from flask import Flask, request, jsonify
import os
import matplotlib.pyplot as plt
import numpy as np
import base64
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "BioPlot API is running"})

@app.route('/api/generate-chart', methods=['POST'])
def generate_chart():
    """Generate a bar chart based on the provided data and options"""
    try:
        data = request.json
        
        if not data or 'genes' not in data or 'values' not in data:
            return jsonify({"error": "Invalid data format. Must include 'genes' and 'values' arrays."}), 400
        
        genes = data.get('genes', [])
        values = data.get('values', [])
        options = data.get('options', {})
        
        if len(genes) != len(values):
            return jsonify({"error": "Genes and values arrays must be the same length."}), 400
        
        # Apply sorting if enabled
        if options.get('sortBars', False):
            # Create pairs and sort
            pairs = list(zip(genes, values))
            pairs.sort(key=lambda x: x[1], reverse=True)
            
            # Extract sorted arrays
            genes = [pair[0] for pair in pairs]
            values = [pair[1] for pair in pairs]
        
        # Create the plot
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create bars with the specified color
        bar_color = options.get('barColor', '#4285F4')
        bars = ax.bar(genes, values, color=bar_color)
        
        # Add labels and title
        ax.set_xlabel(options.get('xAxisLabel', 'Genes'))
        ax.set_ylabel(options.get('yAxisLabel', 'Expression Level'))
        
        if 'title' in options and options['title']:
            ax.set_title(options['title'])
        
        # Rotate x-axis labels for better readability
        plt.xticks(rotation=45, ha='right')
        
        # Add value labels on top of bars if requested
        if options.get('showValues', True):
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                        f'{height:.2f}',
                        ha='center', va='bottom')
        
        # Adjust layout
        plt.tight_layout()
        
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        plt.close(fig)
        
        # Encode the image to base64
        buf.seek(0)
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        
        return jsonify({
            "image": f"data:image/png;base64,{img_base64}",
            "options": options
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# For Vercel serverless function
def handler(request, context):
    """Vercel serverless function handler"""
    with app.test_request_context(
        path=request.get('path', '/'),
        method=request.get('method', 'GET'),
        headers=request.get('headers', {}),
        query_string=request.get('query', {}),
        json=request.get('body', {})
    ):
        response = app.full_dispatch_request()
        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.get_data().decode('utf-8')
        }
