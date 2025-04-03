import pandas as pd
import numpy as np
import plotly.figure_factory as ff
import plotly.graph_objects as go
from scipy.spatial.distance import pdist, squareform
from scipy.cluster.hierarchy import linkage, leaves_list
from scipy.stats import zscore

DEFAULT_PARAMS = {
    "cluster_rows": True,
    "cluster_cols": True,
    "color_scale": "Viridis",
    "standardize": "None", # Options: "None", "Per Row (Z-score)"
    "title": "Heatmap"
}

def generate_plot(df: pd.DataFrame, params: dict):
    """Generates a clustered heatmap using Plotly Figure Factory."""
    plot_params = {**DEFAULT_PARAMS, **params}

    # --- Input Validation & Preparation ---
    if df.shape[1] < 2:
        raise ValueError("Heatmap requires at least two columns (one for labels, one for data).")

    # Assume first column is labels/genes, rest is numeric data
    labels = df.iloc[:, 0].astype(str).tolist()
    numeric_df = df.iloc[:, 1:]

    # Check if remaining columns are numeric
    try:
        numeric_df = numeric_df.astype(float)
    except ValueError as e:
        raise ValueError(f"All columns except the first must be numeric for heatmap generation. Error: {e}")

    # Handle potential NaNs (replace with mean of column or row, or drop)
    # Here, let's fill with column mean, but other strategies exist
    if numeric_df.isnull().values.any():
        print("Warning: NaN values found in data. Filling with column means.") # Use st.warning in actual app if possible
        numeric_df = numeric_df.fillna(numeric_df.mean())
    # Check again after filling
    if numeric_df.isnull().values.any():
         raise ValueError("Could not resolve NaN values. Please check your input data.")


    data_matrix = numeric_df.values
    sample_names = numeric_df.columns.tolist()

    # --- Standardization ---
    if plot_params["standardize"] == "Per Row (Z-score)":
         if data_matrix.shape[1] > 1: # Z-score requires variation
             data_matrix = zscore(data_matrix, axis=1, nan_policy='omit')
              # Handle rows with zero variance after z-scoring (will be all NaNs)
             data_matrix = np.nan_to_num(data_matrix, nan=0.0)
             plot_params["title"] += " (Row Z-score)"
         else:
             print("Warning: Cannot apply Z-score with only one data column.")


    # --- Clustering (using scipy linkage) ---
    row_linkage = None
    col_linkage = None
    row_order = list(range(data_matrix.shape[0]))
    col_order = list(range(data_matrix.shape[1]))

    # Avoid clustering if few rows/cols or disabled
    perform_row_cluster = plot_params["cluster_rows"] and data_matrix.shape[0] > 1
    perform_col_cluster = plot_params["cluster_cols"] and data_matrix.shape[1] > 1

    if perform_row_cluster:
        try:
            row_linkage = linkage(pdist(data_matrix, metric='euclidean'), method='ward')
            row_order = leaves_list(row_linkage)
        except ValueError as e:
             print(f"Warning: Could not perform row clustering. {e}")
             perform_row_cluster = False # Disable if fails

    if perform_col_cluster:
         try:
             col_linkage = linkage(pdist(data_matrix.T, metric='euclidean'), method='ward')
             col_order = leaves_list(col_linkage)
         except ValueError as e:
             print(f"Warning: Could not perform column clustering. {e}")
             perform_col_cluster = False # Disable if fails

    # Reorder data and labels based on clustering
    ordered_data = data_matrix[row_order, :][:, col_order]
    ordered_labels = [labels[i] for i in row_order]
    ordered_samples = [sample_names[i] for i in col_order]


    # --- Create Plotly Heatmap ---
    # Figure Factory dendrogram is convenient but can be slow for large matrices
    # Consider using go.Heatmap directly for larger data if performance is an issue

    # If clustering is disabled, pass empty lists for dendrograms
    fig = ff.create_dendrogram(data_matrix if not perform_row_cluster else data_matrix[row_order,:],
                               orientation='right', labels=ordered_labels if perform_row_cluster else labels,
                               linkagefun=lambda x: row_linkage if perform_row_cluster else [])
    dendro_traces_rows = list(fig.select_traces()) # Get row dendrogram traces

    fig_cols = ff.create_dendrogram(data_matrix.T if not perform_col_cluster else data_matrix[:,col_order].T,
                                    orientation='bottom', labels=ordered_samples if perform_col_cluster else sample_names,
                                    linkagefun=lambda x: col_linkage if perform_col_cluster else [])
    dendro_traces_cols = list(fig_cols.select_traces()) # Get col dendrogram traces


    # Create the heatmap trace
    heatmap = [
        go.Heatmap(
            z=ordered_data,
            x=ordered_samples,
            y=ordered_labels,
            colorscale=plot_params["color_scale"],
            colorbar={'title': 'Value'},
            hoverongaps=False,
            hovertemplate='Gene: %{y}<br>Sample: %{x}<br>Value: %{z}<extra></extra>' # Custom hover text
        )
    ]

    # Combine dendrograms and heatmap
    fig = go.Figure(data=heatmap + dendro_traces_rows + dendro_traces_cols)

    # --- Layout adjustments ---
    # This part is tricky as FigureFactory pre-defines layout parts
    # We need to adjust domains and axes to fit everything

    y_axis_domain_start = 0.0
    x_axis_domain_end = 1.0

    # Domain for row dendrogram (controls width)
    if perform_row_cluster:
        fig.update_layout(yaxis={'domain': [0, 0.85], 'side': 'right'}) # Heatmap Y axis
        fig.update_layout(yaxis2={'domain': [0, 0.85]}) # Dendrogram Y axis (mirrors heatmap)
        x_axis_domain_end = 0.85 # Leave space for row dendrogram on the left
    else:
         fig.update_layout(yaxis={'domain': [0, 0.85], 'side':'left'}) # Regular Y axis if no row dendro

    # Domain for column dendrogram (controls height)
    if perform_col_cluster:
         fig.update_layout(xaxis={'domain': [x_axis_domain_end * 0.15, x_axis_domain_end]}) # Heatmap X axis
         fig.update_layout(xaxis2={'domain': [x_axis_domain_end * 0.15, x_axis_domain_end], 'anchor':'y'}) # Dendrogram X axis (mirrors heatmap)
         y_axis_domain_start = 0.855 # Leave space for column dendrogram at the top
    else:
        fig.update_layout(xaxis={'domain': [x_axis_domain_end * 0.05, x_axis_domain_end]}) # Regular X axis slightly indented


    # Adjust overall layout
    fig.update_layout(
        title=plot_params['title'],
        margin=dict(l=10, r=10, t=80, b=80), # Adjust margins as needed
        hovermode='closest',
        xaxis={'tickangle': -45, 'automargin': True} if perform_col_cluster else {'automargin': True}, # Angle ticks if clustered
        yaxis={'automargin': True, 'ticklen':5},
        height=max(600, 30 * len(labels)), # Dynamic height based on number of rows
        width=max(700, 40 * len(sample_names)) # Dynamic width
    )

    # Adjust specific axis properties set by ff.create_dendrogram if needed
    # (May require inspecting fig.layout object)


    return fig