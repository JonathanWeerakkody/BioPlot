import pandas as pd
import numpy as np
import plotly.express as px
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

DEFAULT_PARAMS = {
    "transpose": False,
    "id_column": "",
    "n_components": 2,
    "scale_data": True,
    "color_by_column": True,
    "title": "PCA Plot"
}

def generate_plot(df: pd.DataFrame, params: dict):
    """Generates a PCA plot using Plotly Express."""
    plot_params = {**DEFAULT_PARAMS, **params}

    # --- Input Validation & Preparation ---
    input_df = df.copy()

    # Handle Transposition if needed (Samples as Columns)
    if plot_params["transpose"]:
        id_col_name = input_df.columns[0] # Assume first col is feature ID if transposing
        input_df = input_df.set_index(id_col_name).transpose()
        input_df.index.name = "SampleID" # New index is SampleID
        input_df = input_df.reset_index() # Make SampleID a column
        # Now the user-specified id_column should refer to SampleID or a metadata column
        plot_params["id_column"] = plot_params.get("id_column") or "SampleID" # Default to SampleID if transposing and none specified


    id_col = plot_params.get("id_column", "")
    label_data = None
    numeric_df = input_df

    # Separate label/ID column if specified and exists
    if id_col and id_col in input_df.columns:
        label_data = input_df[[id_col]]
        # Select only numeric columns for PCA
        numeric_df = input_df.select_dtypes(include=np.number)
        if numeric_df.empty:
             raise ValueError("No numeric columns found for PCA after excluding the ID column.")
    else:
        # Try to select only numeric columns if no ID column specified
        numeric_df = input_df.select_dtypes(include=np.number)
        if numeric_df.empty:
            raise ValueError("No numeric columns found for PCA. Does your data contain numeric values?")
        # Create a dummy ID if none provided for hover info
        label_data = pd.DataFrame({'Sample': [f"Sample_{i+1}" for i in range(len(numeric_df))]}, index=numeric_df.index)
        id_col = 'Sample' # Use the dummy ID column

    # --- Scaling ---
    if plot_params["scale_data"]:
        if numeric_df.shape[1] > 0: # Check if there are numeric columns to scale
            scaler = StandardScaler()
            try:
                 scaled_data = scaler.fit_transform(numeric_df)
            except ValueError as e:
                 raise ValueError(f"Error during scaling. Check for non-numeric data or NaNs in numeric columns. Original error: {e}")
            plot_params["title"] += " (Scaled)"
        else:
            scaled_data = numeric_df.values # No columns to scale
    else:
        scaled_data = numeric_df.values

    # Check for NaNs *after* potential scaling/selection
    if np.isnan(scaled_data).any():
        raise ValueError("NaN values detected in the data matrix before PCA. Please clean your data (e.g., imputation or row removal).")

    # --- PCA ---
    n_samples = scaled_data.shape[0]
    n_features = scaled_data.shape[1]
    if n_features < 2:
         raise ValueError(f"PCA requires at least 2 numeric features. Found {n_features}.")

    # Adjust n_components dynamically
    max_components = min(n_samples, n_features)
    n_components = min(plot_params["n_components"], max_components)
    if n_components < 2:
        print(f"Warning: Only {n_components} component(s) possible with the data dimensions. Plotting may be limited.")
        # Allow PCA but plotting might only show PC1

    pca = PCA(n_components=n_components)
    try:
        principal_components = pca.fit_transform(scaled_data)
    except ValueError as e:
         raise ValueError(f"Error during PCA fitting. Check data for issues. Original error: {e}")

    pc_columns = [f'PC{i+1}' for i in range(n_components)]
    pca_df = pd.DataFrame(data=principal_components, columns=pc_columns, index=numeric_df.index)

    # Combine with label data for plotting
    pca_df = pd.concat([pca_df, label_data], axis=1)

    # --- Plotting ---
    explained_variance = pca.explained_variance_ratio_ * 100
    labels = {
        f'PC{i+1}': f'PC {i+1} ({explained_variance[i]:.1f}%)'
        for i in range(n_components)
    }

    color_arg = id_col if plot_params["color_by_column"] and id_col in pca_df.columns else None
    hover_data = list(input_df.columns) # Show original columns on hover

    x_axis = 'PC1'
    y_axis = 'PC2' if n_components >= 2 else None # Only plot PC2 if available

    if y_axis:
        fig = px.scatter(
            pca_df,
            x=x_axis,
            y=y_axis,
            color=color_arg,
            title=plot_params['title'],
            labels=labels,
            hover_name=id_col if id_col in pca_df.columns else None,
            hover_data=hover_data, # Show original data columns on hover
            marginal_x="box", # Optional: add box plots to margins
            marginal_y="box"
        )
    else: # Handle 1-component case (less common)
         fig = px.scatter(
            pca_df,
            x=x_axis,
            y=[0] * len(pca_df), # Plot along y=0 line
            color=color_arg,
            title=plot_params['title'],
            labels=labels,
            hover_name=id_col if id_col in pca_df.columns else None,
            hover_data=hover_data
        )
         fig.update_yaxes(title="", showticklabels=False, zeroline=True, zerolinecolor='grey')


    fig.update_layout(
         xaxis_title=labels.get('PC1', 'PC1'),
         yaxis_title=labels.get('PC2', 'PC2') if y_axis else "",
         legend_title_text=id_col if color_arg else "Group",
         hovermode='closest'
     )
    fig.update_traces(marker=dict(size=8, opacity=0.8), selector=dict(mode='markers'))

    return fig