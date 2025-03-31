from flask import Flask, request, jsonify, send_from_directory
import os
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import io
import base64
import uuid
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Create a directory for storing temporary plot files
PLOT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plots')
os.makedirs(PLOT_FOLDER, exist_ok=True)
app.config['PLOT_FOLDER'] = PLOT_FOLDER

# Sample data directory
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'BioPlot_Data')
os.makedirs(SAMPLE_DATA_DIR, exist_ok=True)

# API Routes
@app.route('/api/modules', methods=['GET'])
def get_modules():
    """Return available modules and plot types"""
    modules = [
        {
            "id": "basic_plots",
            "name": "Basic Plots",
            "plots": [
                {"id": "bar_plot", "name": "Bar Plot"},
                {"id": "pie_plot", "name": "Pie Chart"}
            ]
        },
        {
            "id": "statistical_plots",
            "name": "Statistical Plots",
            "plots": [
                {"id": "scatter_plot", "name": "Scatter Plot"},
                {"id": "box_plot", "name": "Box Plot"}
            ]
        }
    ]
    return jsonify(modules)

@app.route('/api/sample-data/<plot_type>', methods=['GET'])
def get_sample_data(plot_type):
    """Return sample data for the specified plot type"""
    if plot_type == 'bar_plot':
        data = {
            "categories": ["Category A", "Category B", "Category C", "Category D", "Category E"],
            "values": [23, 45, 56, 78, 90]
        }
        return jsonify(data)
    elif plot_type == 'pie_plot':
        data = {
            "labels": ["Segment 1", "Segment 2", "Segment 3", "Segment 4"],
            "values": [30, 25, 20, 25]
        }
        return jsonify(data)
    else:
        return jsonify({"error": f"No sample data available for {plot_type}"}), 404

@app.route('/api/generate', methods=['POST'])
def generate_plot():
    """Generate a plot based on the provided data and options"""
    data = request.json
    plot_type = data.get('plotType')
    plot_data = data.get('data')
    options = data.get('options', {})
    
    try:
        # Create a BytesIO object to store the image
        buffer = io.BytesIO()
        
        # Create the plot based on the plot type
        if plot_type == 'bar_plot':
            create_bar_plot(plot_data, options, buffer)
        elif plot_type == 'pie_plot':
            create_pie_plot(plot_data, options, buffer)
        else:
            return jsonify({"error": f"Unknown plot type: {plot_type}"}), 400
        
        # Convert the image to base64
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            "image": image_base64,
            "options": options
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def create_bar_plot(data, options, buffer):
    """Create a bar plot and save it to the buffer"""
    # Extract data
    categories = data.get('categories', [])
    values = data.get('values', [])
    
    # Extract options
    title = options.get('title', '')
    x_label = options.get('xAxisLabel', 'Categories')
    y_label = options.get('yAxisLabel', 'Values')
    bar_color = options.get('barColor', '#3498db')
    show_values = options.get('showValues', True)
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(categories, values, color=bar_color)
    
    # Add labels and title
    ax.set_xlabel(x_label)
    ax.set_ylabel(y_label)
    if title:
        ax.set_title(title)
    
    # Add value labels on top of bars
    if show_values:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height}',
                    ha='center', va='bottom')
    
    # Save the plot to the buffer
    plt.tight_layout()
    plt.savefig(buffer, format='png')
    plt.close(fig)

def create_pie_plot(data, options, buffer):
    """Create a pie chart and save it to the buffer"""
    # Extract data
    labels = data.get('labels', [])
    values = data.get('values', [])
    
    # Extract options
    title = options.get('title', '')
    show_legend = options.get('showLegend', True)
    show_percentage = options.get('showPercentage', True)
    is_donut = options.get('donut', False)
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(8, 8))
    
    # Set autopct based on options
    autopct = '%1.1f%%' if show_percentage else None
    
    # Create pie chart
    wedges, texts, autotexts = ax.pie(
        values, 
        labels=None if show_legend else labels,
        autopct=autopct,
        startangle=90
    )
    
    # Make donut chart if specified
    if is_donut:
        # Draw a white circle at the center
        centre_circle = plt.Circle((0, 0), 0.70, fc='white')
        ax.add_artist(centre_circle)
    
    # Add legend if specified
    if show_legend:
        ax.legend(wedges, labels, loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    # Add title if specified
    if title:
        ax.set_title(title)
    
    # Save the plot to the buffer
    plt.tight_layout()
    plt.savefig(buffer, format='png')
    plt.close(fig)

@app.route('/api/plots/<filename>')
def serve_plot(filename):
    """Serve a generated plot file"""
    return send_from_directory(app.config['PLOT_FOLDER'], filename)

# For Vercel serverless deployment
def handler(request, context):
    """Handle requests for Vercel serverless functions"""
    with app.test_client() as client:
        response = client.request(
            method=request['method'],
            path=request['path'],
            headers=request['headers'],
            data=request.get('body', None)
        )
        return {
            'statusCode': response.status_code,
            'headers': dict(response.headers),
            'body': response.data.decode('utf-8')
        }

# For local development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
