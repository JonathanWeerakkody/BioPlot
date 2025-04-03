import streamlit as st
import pandas as pd
import json
import importlib
import os # For example data path

# Import helper functions
from utils.data_loader import load_data, validate_data
from utils.ui_helpers import generate_parameter_widgets
from utils.downloaders import add_plot_download_buttons, add_data_download_button

# --- Page Configuration (MUST be the first Streamlit command) ---
st.set_page_config(
    page_title="BioPlot",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://github.com/JonathanWeerakkody/BioPlot/issues', # Replace with your repo URL
        'Report a bug': "https://github.com/JonathanWeerakkody/BioPlot/issues", # Replace with your repo URL
        'About': """
        ## BioPlot: Interactive Bioinformatics Visualization

        Upload your data, choose a plot type, customize parameters, and download publication-ready figures!

        Developed with Streamlit and Plotly.
        """
    }
)

# --- Load Plot Configurations ---
@st.cache_resource # Cache the config loading
def load_plot_config(config_path="config/plots.json"):
    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        st.error(f"Fatal Error: Configuration file `{config_path}` not found.")
        return None
    except json.JSONDecodeError:
        st.error(f"Fatal Error: Could not decode `{config_path}`. Check JSON format.")
        return None

PLOT_CONFIG = load_plot_config()

# --- Initialize Session State ---
# Use session state to store persistent info across reruns
if 'data_loaded' not in st.session_state:
    st.session_state['data_loaded'] = False
if 'current_df' not in st.session_state:
    st.session_state['current_df'] = None
if 'current_config_key' not in st.session_state:
     st.session_state['current_config_key'] = None # Store the key (e.g., 'volcano')
if 'generated_fig' not in st.session_state:
     st.session_state['generated_fig'] = None
if 'data_validation_status' not in st.session_state:
     st.session_state['data_validation_status'] = (False, ["No data loaded."])


# --- Helper Function for Resetting State ---
def reset_state():
    st.session_state['data_loaded'] = False
    st.session_state['current_df'] = None
    # Don't reset config key unless plot type changes
    st.session_state['generated_fig'] = None
    st.session_state['data_validation_status'] = (False, ["No data loaded."])
    # Clear potentially cached data from load_data if needed (requires managing cache keys or custom logic)
    # load_data.clear() # This clears the entire cache for load_data


# --- App Title ---
st.title("🧬 BioPlot: Interactive Bioinformatics Visualization")
st.markdown("Streamline your data analysis: **Upload -> Customize -> Visualize -> Download**")

# --- Sidebar ---
with st.sidebar:
    st.header("⚙️ Workflow")

    # 1. Plot Type Selection
    st.subheader("1. Select Plot Type")
    if PLOT_CONFIG:
        plot_options = list(PLOT_CONFIG.keys())
        plot_names = [PLOT_CONFIG[key].get("name", key) for key in plot_options]

        # Use index to handle potential name duplicates if keys are different
        selected_plot_name = st.selectbox(
            "Choose visualization:",
            options=plot_names,
            index=plot_names.index(PLOT_CONFIG[st.session_state['current_config_key']].get("name")) if st.session_state['current_config_key'] in PLOT_CONFIG else 0,
            key="plot_type_selector",
            help="Select the type of plot you want to generate."
        )
        # Find the key corresponding to the selected name
        selected_plot_key = plot_options[plot_names.index(selected_plot_name)]

        # Update state if plot type changes
        if st.session_state['current_config_key'] != selected_plot_key:
             st.session_state['current_config_key'] = selected_plot_key
             # Reset data validation and figure when plot type changes
             st.session_state['data_validation_status'] = (False, ["Plot type changed. Please re-validate data."])
             st.session_state['generated_fig'] = None
             # Keep data loaded, but force re-validation

        selected_config = PLOT_CONFIG[selected_plot_key]
    else:
        st.error("Plot configurations could not be loaded.")
        selected_config = None # Ensure selected_config is defined

    st.markdown("---")

    # 2. Data Upload
    st.subheader("2. Upload Data")
    if selected_config:
        data_req = selected_config.get("data_requirements", {})
        st.info(f"**Requires:** {data_req.get('description', 'No specific format defined.')}")

        uploaded_file = st.file_uploader(
            "Upload your data file (CSV, TSV, XLSX)",
            type=["csv", "tsv", "txt", "xlsx"],
            key="file_uploader",
            accept_multiple_files=False,
            on_change=reset_state # Reset if a new file is uploaded
        )

        # Example Data Loader
        example_data_path = f"data/example_{selected_plot_key}.csv"
        if os.path.exists(example_data_path):
            if st.button(f"Load Example {selected_config['name']} Data", key=f"ex_{selected_plot_key}"):
                try:
                    example_df = pd.read_csv(example_data_path)
                    st.session_state['current_df'] = example_df
                    st.session_state['data_loaded'] = True
                    st.session_state['generated_fig'] = None # Reset fig on new data
                    st.success(f"Example data for {selected_config['name']} loaded!")
                    # Trigger validation immediately after loading example
                    is_valid, msg = validate_data(example_df, data_req)
                    st.session_state['data_validation_status'] = (is_valid, msg)
                    st.experimental_rerun() # Rerun to update main panel
                except Exception as e:
                    st.error(f"Error loading example data: {e}")
                    reset_state()
        else:
            st.caption(f"No example data found for {selected_config['name']}")

        # Handle data loading from upload
        if uploaded_file is not None and not st.session_state['data_loaded']: # Load only if not already loaded (avoids reload on widget interaction)
             with st.spinner(f"Loading data from {uploaded_file.name}..."):
                 df = load_data(uploaded_file)
                 if df is not None:
                     st.session_state['current_df'] = df
                     st.session_state['data_loaded'] = True
                     st.session_state['generated_fig'] = None # Reset fig
                     is_valid, msg = validate_data(df, data_req)
                     st.session_state['data_validation_status'] = (is_valid, msg)
                     st.success("Data loaded successfully!")
                 else:
                     reset_state() # Clear state if loading fails


    # 3. Plot Parameters (Generated dynamically)
    if selected_config:
        # Pass params list to helper, get back current values
        # Store params in session state for persistence? Helper does this via keys.
        user_params = generate_parameter_widgets(selected_config.get("params", []))
    else:
        user_params = {}


# --- Main Panel ---
if not PLOT_CONFIG:
    st.error("Application cannot proceed without plot configurations.")
elif not selected_config:
     st.warning("Please select a plot type from the sidebar.")
elif not st.session_state['data_loaded']:
    st.info("⬆️ Upload a data file or load an example using the sidebar to start.")
else:
    # Data is loaded, proceed with tabs and validation display
    df = st.session_state['current_df']
    data_valid, validation_msg = st.session_state['data_validation_status']

    tab_plot, tab_data, tab_validate = st.tabs(["📊 Plot Preview", "📄 Data Preview", "✅ Validation Info"])

    with tab_validate:
        st.subheader("Data Validation Status")
        if data_valid:
            st.success("Data appears valid for the selected plot type.")
            st.markdown(validation_msg) # Show requirements info anyway
        else:
            st.error("Data validation failed. Please check the issues below and your input file.")
            st.warning(validation_msg)

    with tab_data:
        st.subheader("Current Data Preview")
        st.dataframe(df.head(10)) # Show more rows
        with st.expander("Show Full Data"):
             st.dataframe(df)
        with st.expander("Show Data Summary"):
             try:
                 st.dataframe(df.describe(include='all'))
             except Exception as desc_e:
                 st.warning(f"Could not generate data summary: {desc_e}")
        # Add data download button
        add_data_download_button(df, filename=f"BioPlot_data_{selected_plot_key}.csv")


    with tab_plot:
        st.subheader(f"{selected_config['name']} Controls & Preview")

        col1, col2 = st.columns([3, 1]) # Plot takes more space

        with col2:
             st.write("Click to update plot:")
             # Explicit button to generate/update plot
             # Disable button if data is invalid
             generate_button = st.button("🚀 Generate / Update Plot", type="primary", disabled=not data_valid)

        if generate_button and data_valid:
            try:
                # Dynamically import the plotting module and function
                module_name = selected_config['module']
                function_name = selected_config['function']

                plot_module = importlib.import_module(module_name)
                plot_function = getattr(plot_module, function_name)

                # Generate the plot
                with st.spinner(f"⏳ Generating {selected_config['name']}..."):
                    # Pass a copy of df to avoid modification issues if plot func alters it
                    fig = plot_function(df.copy(), user_params)
                    st.session_state['generated_fig'] = fig # Store generated figure

            except ImportError:
                st.error(f"Code Error: Could not import module `{module_name}`.")
                st.session_state['generated_fig'] = None
            except AttributeError:
                st.error(f"Code Error: Could not find function `{function_name}` in `{module_name}`.")
                st.session_state['generated_fig'] = None
            except ValueError as ve: # Catch specific data/parameter errors from plot function
                st.error(f"Plotting Error: {ve}")
                st.session_state['generated_fig'] = None
            except Exception as e:
                st.error(f"An unexpected error occurred during plot generation:")
                st.exception(e) # Show full traceback in the app for debugging
                st.session_state['generated_fig'] = None

        # Display the stored figure if available
        if st.session_state['generated_fig'] is not None:
             with col1: # Display plot in the left column
                st.plotly_chart(st.session_state['generated_fig'], use_container_width=True)
             # Add download buttons below the plot (or in the right column)
             add_plot_download_buttons(st.session_state['generated_fig'], filename_base=f"BioPlot_{selected_plot_key}")
        elif data_valid:
             with col1:
                 st.info("Click the **Generate / Update Plot** button to create the visualization.")
        else:
             with col1:
                 st.warning("Cannot generate plot. Please fix data validation issues shown in the 'Validation Info' tab.")


# --- Footer ---
st.sidebar.markdown("---")
st.sidebar.caption("BioPlot v1.0 | Made with Streamlit")