from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import io
import base64
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import json

app = Flask(__name__)
CORS(app)

# Sample data directory
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'BioPlot_Data')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/api/modules', methods=['GET'])
def get_modules():
    modules = [
        {
            "id": "basic_plots",
            "name": "Basic Plots",
            "plots": [
                {"id": "pie_plot", "name": "Pie Plot"},
                {"id": "bar_plot", "name": "Bar Plot"},
                {"id": "line_plot", "name": "Line Plot"},
                {"id": "scatter_plot", "name": "Scatter Plot"}
            ]
        },
        {
            "id": "genome_analysis",
            "name": "Genome Analysis",
            "plots": [
                {"id": "snp_density", "name": "SNP Density"},
                {"id": "chromosome_distribution", "name": "Chromosome Distribution"},
                {"id": "peak_venn", "name": "Peak Venn"},
                {"id": "circos_plot", "name": "Circos Plot"}
            ]
        },
        {
            "id": "transcriptome_analysis",
            "name": "Transcriptome Analysis",
            "plots": [
                {"id": "heatmap", "name": "Heatmap"},
                {"id": "volcano_plot", "name": "Volcano Plot"},
                {"id": "violin_plot", "name": "Violin Plot"},
                {"id": "bubble_plot", "name": "Bubble Plot"},
                {"id": "chord_plot", "name": "Chord Plot"}
            ]
        },
        {
            "id": "epigenome_analysis",
            "name": "Epigenome Analysis",
            "plots": [
                {"id": "metagene_plot", "name": "Metagene Plot"},
                {"id": "motif_plot", "name": "Motif Plot"}
            ]
        },
        {
            "id": "clinical_data_analysis",
            "name": "Clinical Data Analysis",
            "plots": [
                {"id": "forest_plot", "name": "Forest Plot"},
                {"id": "km_plot", "name": "KM Plot"},
                {"id": "roc_curve", "name": "ROC Curve"}
            ]
        },
        {
            "id": "miscellaneous",
            "name": "Miscellaneous",
            "plots": [
                {"id": "map", "name": "Map"},
                {"id": "pca", "name": "PCA"}
            ]
        }
    ]
    return jsonify(modules)

@app.route('/api/sample-data/<plot_type>', methods=['GET'])
def get_sample_data(plot_type):
    sample_data_map = {
        'pie_plot': os.path.join(SAMPLE_DATA_DIR, 'Basic_Plots', 'PiePlot_Sample.csv'),
        'bar_plot': os.path.join(SAMPLE_DATA_DIR, 'Basic_Plots', 'BarPlot_GeneUpDown_Sample.csv'),
        'volcano_plot': os.path.join(SAMPLE_DATA_DIR, 'Transcriptome_Analysis', 'VolcanoPlot_Sample.csv'),
        'km_plot': os.path.join(SAMPLE_DATA_DIR, 'Clinical_Data_Analysis', 'KMPlot_Sample.csv'),
        'roc_curve': os.path.join(SAMPLE_DATA_DIR, 'Clinical_Data_Analysis', 'ROCCurve_Sample.csv')
    }
    
    if plot_type not in sample_data_map:
        return jsonify({"error": "Sample data not available for this plot type"}), 404
    
    try:
        with open(sample_data_map[plot_type], 'r') as f:
            data = f.read()
        return data
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/validate', methods=['POST'])
def validate_data():
    data = request.json
    if not data or 'plotType' not in data or 'data' not in data:
        return jsonify({"valid": False, "errors": ["Missing required fields"]}), 400
    
    plot_type = data['plotType']
    input_data = data['data']
    
    # Validation logic for different plot types
    if plot_type == 'pie_plot':
        try:
            # Convert string data to DataFrame
            df = pd.read_csv(io.StringIO(input_data), sep='\t')
            
            # Check required columns
            if 'class' not in df.columns or 'percent' not in df.columns:
                return jsonify({"valid": False, "errors": ["Missing required columns: class, percent"]}), 400
            
            # Check data types
            if not pd.to_numeric(df['percent'], errors='coerce').notna().all():
                return jsonify({"valid": False, "errors": ["Percent column must contain numeric values"]}), 400
            
            # Check for negative values
            if (df['percent'] < 0).any():
                return jsonify({"valid": False, "errors": ["Percent column cannot contain negative values"]}), 400
            
            return jsonify({"valid": True})
        except Exception as e:
            return jsonify({"valid": False, "errors": [str(e)]}), 400
    
    elif plot_type == 'volcano_plot':
        try:
            # Convert string data to DataFrame
            df = pd.read_csv(io.StringIO(input_data), sep='\t')
            
            # Check required columns
            if 'name' not in df.columns or 'log2fc' not in df.columns or 'pvalue' not in df.columns:
                return jsonify({"valid": False, "errors": ["Missing required columns: name, log2fc, pvalue"]}), 400
            
            # Check data types
            if not pd.to_numeric(df['log2fc'], errors='coerce').notna().all():
                return jsonify({"valid": False, "errors": ["log2fc column must contain numeric values"]}), 400
            
            if not pd.to_numeric(df['pvalue'], errors='coerce').notna().all():
                return jsonify({"valid": False, "errors": ["pvalue column must contain numeric values"]}), 400
            
            # Check p-value range
            if (df['pvalue'] < 0).any() or (df['pvalue'] > 1).any():
                return jsonify({"valid": False, "errors": ["p-values must be between 0 and 1"]}), 400
            
            return jsonify({"valid": True})
        except Exception as e:
            return jsonify({"valid": False, "errors": [str(e)]}), 400
    
    # Add validation for other plot types as needed
    
    return jsonify({"valid": True})

@app.route('/api/generate', methods=['POST'])
def generate_plot():
    data = request.json
    if not data or 'plotType' not in data or 'data' not in data or 'options' not in data:
        return jsonify({"error": "Missing required fields"}), 400
    
    plot_type = data['plotType']
    input_data = data['data']
    options = data['options']
    
    try:
        # Generate plot based on type
        if plot_type == 'pie_plot':
            img_data = generate_pie_plot(input_data, options)
        elif plot_type == 'bar_plot':
            img_data = generate_bar_plot(input_data, options)
        elif plot_type == 'volcano_plot':
            img_data = generate_volcano_plot(input_data, options)
        elif plot_type == 'km_plot':
            img_data = generate_km_plot(input_data, options)
        elif plot_type == 'roc_curve':
            img_data = generate_roc_curve(input_data, options)
        else:
            return jsonify({"error": f"Plot type '{plot_type}' not supported"}), 400
        
        return jsonify({"image": img_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_pie_plot(input_data, options):
    # Parse data
    df = pd.read_csv(io.StringIO(input_data), sep='\t')
    
    # Create figure with specified size
    fig_width = options.get('width', 10)
    fig_height = options.get('height', 8)
    fig = plt.figure(figsize=(fig_width, fig_height))
    
    # Get colors
    colors = options.get('colors', sns.color_palette('Set3', len(df)))
    
    # Create pie chart
    plt.pie(
        df['percent'], 
        labels=df['class'], 
        autopct='%1.1f%%',
        startangle=options.get('startAngle', 90), 
        shadow=options.get('shadow', True), 
        explode=[options.get('explode', 0.05)] * len(df),
        colors=colors
    )
    
    # Add title if specified
    if options.get('title'):
        plt.title(options.get('title'), fontsize=options.get('titleFontSize', 16), pad=options.get('titlePadding', 20))
    
    # Equal aspect ratio ensures that pie is drawn as a circle
    plt.axis('equal')
    
    # Add styling
    plt.tight_layout()
    
    # Convert plot to base64 image
    img_data = fig_to_base64(fig)
    plt.close(fig)
    
    return img_data

def generate_bar_plot(input_data, options):
    # Parse data - this file is in a transposed format
    lines = input_data.strip().split('\n')
    headers = lines[0].strip().split('\t')
    values = lines[1].strip().split('\t')
    
    # Extract miRNAs and log2FC values
    mirnas = headers[1:]  # Skip the first header which is 'miRNAs'
    log2fc = [float(x) for x in values[1:]]  # Skip the first value which is 'log2FC'
    
    # Create figure with specified size
    fig_width = options.get('width', 12)
    fig_height = options.get('height', 8)
    fig = plt.figure(figsize=(fig_width, fig_height))
    
    # Create colors based on up/down regulation
    colors = ['#EA4335' if x > 0 else '#4285F4' for x in log2fc]
    if options.get('customColors'):
        colors = options.get('customColors')
    
    # Create bar chart
    bars = plt.bar(mirnas, log2fc, color=colors)
    
    # Add horizontal line at y=0
    plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
    
    # Add labels and title
    plt.xlabel(options.get('xLabel', 'miRNAs'), fontsize=options.get('labelFontSize', 14))
    plt.ylabel(options.get('yLabel', 'Log2 Fold Change'), fontsize=options.get('labelFontSize', 14))
    
    if options.get('title'):
        plt.title(options.get('title'), fontsize=options.get('titleFontSize', 16), pad=options.get('titlePadding', 20))
    
    # Add grid if specified
    if options.get('showGrid', True):
        plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add value labels on top of bars if specified
    if options.get('showValues', True):
        for bar in bars:
            height = bar.get_height()
            plt.text(
                bar.get_x() + bar.get_width()/2.,
                height + 0.1 * (1 if height > 0 else -1),
                f'{height:.1f}',
                ha='center', 
                va='bottom' if height > 0 else 'top',
                fontsize=options.get('valueFontSize', 10)
            )
    
    # Add styling
    plt.tight_layout()
    
    # Convert plot to base64 image
    img_data = fig_to_base64(fig)
    plt.close(fig)
    
    return img_data

def generate_volcano_plot(input_data, options):
    # Parse data
    df = pd.read_csv(io.StringIO(input_data), sep='\t')
    
    # Create figure with specified size
    fig_width = options.get('width', 10)
    fig_height = options.get('height', 8)
    fig = plt.figure(figsize=(fig_width, fig_height))
    
    # Set thresholds
    log2fc_threshold = options.get('log2fcThreshold', 2)
    pvalue_threshold = options.get('pvalueThreshold', 3)
    
    # Create scatter plot
    for i, row in df.iterrows():
        if abs(row['log2fc']) > log2fc_threshold and row['pvalue'] > pvalue_threshold:
            if row['log2fc'] > 0:
                # Up-regulated and significant
                plt.scatter(row['log2fc'], row['pvalue'], color=options.get('upColor', '#EA4335'), s=options.get('pointSize', 60))
                if options.get('showLabels', True):
                    plt.text(row['log2fc'], row['pvalue'] + 0.15, row['name'], 
                             ha='center', va='bottom', fontsize=options.get('labelFontSize', 9))
            else:
                # Down-regulated and significant
                plt.scatter(row['log2fc'], row['pvalue'], color=options.get('downColor', '#4285F4'), s=options.get('pointSize', 60))
                if options.get('showLabels', True):
                    plt.text(row['log2fc'], row['pvalue'] + 0.15, row['name'], 
                             ha='center', va='bottom', fontsize=options.get('labelFontSize', 9))
        elif abs(row['log2fc']) > log2fc_threshold:
            # Fold change significant but not p-value
            plt.scatter(row['log2fc'], row['pvalue'], color=options.get('fcColor', '#FBBC05'), s=options.get('pointSize', 50), alpha=0.7)
        elif row['pvalue'] > pvalue_threshold:
            # P-value significant but not fold change
            plt.scatter(row['log2fc'], row['pvalue'], color=options.get('pvalueColor', '#34A853'), s=options.get('pointSize', 50), alpha=0.7)
        else:
            # Not significant
            plt.scatter(row['log2fc'], row['pvalue'], color=options.get('nsColor', '#9AA0A6'), s=options.get('pointSize', 40), alpha=0.5)
    
    # Add threshold lines
    if options.get('showThresholdLines', True):
        plt.axvline(x=log2fc_threshold, color=options.get('upColor', '#EA4335'), linestyle='--', alpha=0.3)
        plt.axvline(x=-log2fc_threshold, color=options.get('downColor', '#4285F4'), linestyle='--', alpha=0.3)
        plt.axhline(y=pvalue_threshold, color='black', linestyle='--', alpha=0.3)
    
    # Add labels and title
    plt.xlabel(options.get('xLabel', 'Log2 Fold Change'), fontsize=options.get('axisLabelSize', 14))
    plt.ylabel(options.get('yLabel', '-log10(p-value)'), fontsize=options.get('axisLabelSize', 14))
    
    if options.get('title'):
        plt.title(options.get('title'), fontsize=options.get('titleFontSize', 16), pad=options.get('titlePadding', 20))
    
    # Add grid if specified
    if options.get('showGrid', True):
        plt.grid(linestyle='--', alpha=0.3)
    
    # Add legend if specified
    if options.get('showLegend', True):
        plt.legend([
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=options.get('upColor', '#EA4335'), markersize=10),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=options.get('downColor', '#4285F4'), markersize=10),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=options.get('fcColor', '#FBBC05'), markersize=10),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=options.get('pvalueColor', '#34A853'), markersize=10),
            plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=options.get('nsColor', '#9AA0A6'), markersize=10)
        ], [
            'Up-regulated significant',
            'Down-regulated significant',
            'Fold change significant',
            'P-value significant',
            'Not significant'
        ], loc=options.get('legendPosition', 'upper right'))
    
    # Add styling
    plt.tight_layout()
    
    # Convert plot to base64 image
    img_data = fig_to_base64(fig)
    plt.close(fig)
    
    return img_data

def generate_km_plot(input_data, options):
    # Import lifelines for KM plot
    try:
        from lifelines import KaplanMeierFitter
    except ImportError:
        import subprocess
        subprocess.check_call(['pip', 'install', 'lifelines'])
        from lifelines import KaplanMeierFitter
    
    # Parse data
    df = pd.read_csv(io.StringIO(input_data), sep='\t')
    
    # Create figure with specified size
    fig_width = options.get('width', 10)
    fig_height = options.get('height', 8)
    fig = plt.figure(figsize=(fig_width, fig_height))
    
    # Create KM fitter
    kmf = KaplanMeierFitter()
    
    # Get unique groups
    groups = df[options.get('groupColumn', 'Sex')].unique()
    
    # Colors for groups
    colors = options.get('colors', ['#4285F4', '#EA4335', '#FBBC05', '#34A853'])
    
    # Plot each group
    for i, group in enumerate(groups):
        group_data = df[df[options.get('groupColumn', 'Sex')] == group]
        kmf.fit(
            group_data[options.get('timeColumn', 'Months')], 
            group_data[options.get('statusColumn', 'Status')] - 1, 
            label=group
        )
        kmf.plot(
            ci_show=options.get('showCI', True),
            color=colors[i % len(colors)]
        )
    
    # Add labels and title
    plt.xlabel(options.get('xLabel', 'Months'), fontsize=options.get('axisLabelSize', 14))
    plt.ylabel(options.get('yLabel', 'Survival Probability'), fontsize=options.get('axisLabelSize', 14))
    
    if options.get('title'):
        plt.title(options.get('title'), fontsize=options.get('titleFontSize', 16), pad=options.get('titlePadding', 20))
    
    # Add grid if specified
    if options.get('showGrid', True):
        plt.grid(linestyle='--', alpha=0.3)
    
    # Add styling
    plt.tight_layout()
    
    # Convert plot to base64 image
    img_data = fig_to_base64(fig)
    plt.close(fig)
    
    return img_data

def generate_roc_curve(input_data, options):
    # Import scikit-learn for ROC curve
    try:
        from sklearn.metrics import roc_curve, auc
        from sklearn.preprocessing import LabelEncoder
    except ImportError:
        import subprocess
        subprocess.check_call(['pip', 'install', 'scikit-learn'])
        from sklearn.metrics import roc_curve, auc
        from sklearn.preprocessing import LabelEncoder
    
    # Parse data
    df = pd.read_csv(io.StringIO(input_data), sep='\t')
    
    # Create figure with specified size
    fig_width = options.get('width', 10)
    fig_height = options.get('height', 8)
    fig = plt.figure(figsize=(fig_width, fig_height))
    
    # Encode class labels
    le = LabelEncoder()
    y_true = le.fit_transform(df[options.get('classColumn', 'class')])
    
    # Calculate ROC curve
    fpr, tpr, _ = roc_curve(y_true, df[options.get('scoreColumn', 'gene1')])
    roc_auc = auc(fpr, tpr)
    
    # Plot ROC curve
    plt.plot(
        fpr, tpr, 
        color=options.get('lineColor', '#4285F4'), 
        lw=options.get('lineWidth', 2), 
        label=f'ROC curve (area = {roc_auc:.2f})'
    )
    
    # Add diagonal line
    plt.plot(
        [0, 1], [0, 1], 
        color=options.get('diagonalColor', '#9AA0A6'), 
        lw=options.get('diagonalWidth', 2), 
        linestyle='--'
    )
    
    # Set axis limits
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    
    # Add labels and title
    plt.xlabel(options.get('xLabel', 'False Positive Rate'), fontsize=options.get('axisLabelSize', 14))
    plt.ylabel(options.get('yLabel', 'True Positive Rate'), fontsize=options.get('axisLabelSize', 14))
    
    if options.get('title'):
        plt.title(options.get('title'), fontsize=options.get('titleFontSize', 16), pad=options.get('titlePadding', 20))
    
    # Add legend if specified
    if options.get('showLegend', True):
        plt.legend(loc=options.get('legendPosition', 'lower right'))
    
    # Add grid if specified
    if options.get('showGrid', True):
        plt.grid(linestyle='--', alpha=0.3)
    
    # Add styling
    plt.tight_layout()
    
    # Convert plot to base64 image
    img_data = fig_to_base64(fig)
    plt.close(fig)
    
    return img_data

def fig_to_base64(fig):
    # Convert matplotlib figure to base64 string
    buf = io.BytesIO()
    FigureCanvas(fig).print_png(buf)
    img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
    return img_data

@app.route('/', methods=['GET'])
def index():
    return "SRplot API is running. Access the frontend for the full application."

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
