import streamlit as st

def generate_parameter_widgets(param_list):
    """
    Generates Streamlit widgets in the sidebar based on the parameter definition list.
    Returns a dictionary of parameter IDs mapped to their current values.
    Uses session state indirectly via widget keys to maintain state.
    """
    params = {}
    if not param_list:
        st.sidebar.write("No adjustable parameters for this plot type.")
        return params

    st.sidebar.markdown("---")
    st.sidebar.subheader("🔧 Plot Parameters")

    for p_idx, p in enumerate(param_list):
        param_id = p['id']
        label = p['label']
        ptype = p['type']
        default = p.get('default')
        help_text = p.get('help', None) # Get help text if provided
        widget_key = f"param_{param_id}_{p_idx}" # Unique key for state

        try:
            if ptype == "number":
                min_val = p.get('min') # Can be None
                max_val = p.get('max') # Can be None
                step = p.get('step', 0.01 if isinstance(default, float) else 1)
                format_str = p.get('format', "%.2f" if isinstance(default, float) else "%d")
                params[param_id] = st.sidebar.number_input(
                    label,
                    min_value=min_val,
                    max_value=max_val,
                    value=default, # Let Streamlit handle default type conversion
                    step=step,
                    format=format_str,
                    key=widget_key,
                    help=help_text
                )
            elif ptype == "text":
                params[param_id] = st.sidebar.text_input(
                    label,
                    value=str(default) if default is not None else "", # Ensure string
                    key=widget_key,
                    help=help_text
                )
            elif ptype == "color":
                params[param_id] = st.sidebar.color_picker(
                    label,
                    value=str(default) if default else "#000000", # Default to black if None
                    key=widget_key,
                    help=help_text
                )
            elif ptype == "boolean":
                params[param_id] = st.sidebar.checkbox(
                    label,
                    value=bool(default) if default is not None else False, # Ensure boolean
                    key=widget_key,
                    help=help_text
                )
            elif ptype == "select":
                options = p.get('options', [])
                # Find index of default value, default to 0 if not found or invalid
                try:
                    # Ensure default is string for comparison if options are strings
                    default_val = str(default) if default is not None else None
                    index = options.index(default_val) if default_val in options else 0
                except (ValueError, TypeError):
                    index = 0
                params[param_id] = st.sidebar.selectbox(
                    label,
                    options=options,
                    index=index,
                    key=widget_key,
                    help=help_text
                )
            else:
                 st.sidebar.warning(f"Unsupported parameter type '{ptype}' for '{label}'.")

        except Exception as e:
             st.sidebar.error(f"Error creating widget for '{label}': {e}")
             params[param_id] = default # Fallback to default value if widget fails

    return params