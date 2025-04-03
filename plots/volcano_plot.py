import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Default parameters
DEFAULT_PARAMS = {
    "p_thresh": 0.05,
    "fc_thresh": 1.0,
    "title": "Volcano Plot",
    "color_up": "#EF553B",
    "color_down": "#636EFA",
    "color_ns": "#BABBBD", # Grey for non-significant
    "highlight_genes": ""
}

def generate_plot(df: pd.DataFrame, params: dict):
    """Generates a Volcano Plot using Plotly."""
    plot_params = {**DEFAULT_PARAMS, **params}

    # --- Input Validation ---
    required_cols = ['log2fc', 'p_value', 'gene_name']
    if not all(col in df.columns for col in required_cols):
        raise ValueError(f"Input data must contain columns: {', '.join(required_cols)}. Found: {', '.join(df.columns)}")

    # Ensure numeric types where expected
    try:
        df['log2fc'] = pd.to_numeric(df['log2fc'])
        df['p_value'] = pd.to_numeric(df['p_value'])
    except ValueError as e:
        raise ValueError(f"Columns 'log2fc' and 'p_value' must be numeric. Error: {e}")

    # Handle potential infinite values from -log10(0)
    df['-log10p'] = -np.log10(df['p_value'].replace(0, np.nan)).fillna(np.inf)
    # Replace infinite values with a large finite number for plotting
    max_finite_y = df.loc[np.isfinite(df['-log10p']), '-log10p'].max()
    if max_finite_y is np.nan or max_finite_y is None:
         max_finite_y = 300 # Default if no finite values
    df['-log10p'] = df['-log10p'].replace(np.inf, max_finite_y * 1.1) # Plot slightly above max finite

    # --- Plotting Logic ---
    fig = go.Figure()

    # Assign significance status and colors
    conditions = [
        (df['p_value'] < plot_params['p_thresh']) & (df['log2fc'] > plot_params['fc_thresh']),  # Upregulated
        (df['p_value'] < plot_params['p_thresh']) & (df['log2fc'] < -plot_params['fc_thresh']), # Downregulated
        (df['p_value'] >= plot_params['p_thresh']), # Not significant by p-value
        (abs(df['log2fc']) <= plot_params['fc_thresh']) # Not significant by fold change
    ]
    choices_color = [plot_params['color_up'], plot_params['color_down'], plot_params['color_ns'], plot_params['color_ns']]
    choices_label = ['Upregulated', 'Downregulated', 'Not Significant', 'Not Significant']

    df['color'] = np.select(conditions, choices_color, default=plot_params['color_ns'])
    df['status'] = np.select(conditions, choices_label, default='Not Significant')

    # Plot points category by category for legend clarity
    for status_label, color in zip(['Upregulated', 'Downregulated', 'Not Significant'],
                                   [plot_params['color_up'], plot_params['color_down'], plot_params['color_ns']]):
        subset = df[df['status'] == status_label]
        if not subset.empty:
            fig.add_trace(go.Scattergl( # Use Scattergl for performance
                x=subset['log2fc'],
                y=subset['-log10p'],
                mode='markers',
                marker=dict(color=color, size=5, opacity=0.7),
                text=subset['gene_name'], # Text for hover
                hoverinfo='text+x+y',
                name=status_label
            ))

    # Threshold lines
    p_line_y = -np.log10(plot_params['p_thresh']) if plot_params['p_thresh'] > 0 else max_finite_y * 1.1 # Avoid log10(0)
    fig.add_hline(y=p_line_y, line_dash="dash", line_color="grey", annotation_text=f'p={plot_params["p_thresh"]}')
    fig.add_vline(x=plot_params['fc_thresh'], line_dash="dash", line_color="grey", annotation_text=f'log2fc={plot_params["fc_thresh"]}')
    fig.add_vline(x=-plot_params['fc_thresh'], line_dash="dash", line_color="grey", annotation_text=f'log2fc={-plot_params["fc_thresh"]}')

    # Highlight specific genes
    genes_to_highlight = [g.strip() for g in plot_params.get("highlight_genes", "").split(',') if g.strip()]
    if genes_to_highlight:
        highlight_df = df[df['gene_name'].isin(genes_to_highlight)]
        if not highlight_df.empty:
             fig.add_trace(go.Scattergl(
                x=highlight_df['log2fc'],
                y=highlight_df['-log10p'],
                mode='markers+text',
                marker=dict(color='black', size=10, symbol='star', line=dict(width=1, color='white')),
                text=highlight_df['gene_name'],
                textposition="top right",
                textfont=dict(color='black', size=10),
                hoverinfo='text+x+y',
                name='Highlighted'
            ))

    # --- Layout ---
    fig.update_layout(
        title=plot_params['title'],
        xaxis_title="Log2 Fold Change",
        yaxis_title="-Log10 P-value",
        hovermode='closest',
        legend_title_text='Significance',
        xaxis=dict(zeroline=False),
        yaxis=dict(zeroline=False)
    )
    # Ensure y-axis starts from 0 or slightly below
    fig.update_yaxes(rangemode="tozero")


    return fig