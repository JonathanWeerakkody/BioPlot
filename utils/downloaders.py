import streamlit as st
import plotly.io as pio
import io
import base64 # For creating download links

# Function to create a download link for different formats
def get_download_link(content, filename, link_text, mimetype='application/octet-stream'):
    """Generates a download link string for Streamlit markdown."""
    if isinstance(content, str):
        content = content.encode('utf-8') # Ensure bytes, utf-8 common
    b64 = base64.b64encode(content).decode()
    href = f'<a href="data:{mimetype};base64,{b64}" download="{filename}">{link_text}</a>'
    return href

def add_plot_download_buttons(fig, filename_base="plot"):
    """Adds download buttons for a Plotly figure to Streamlit columns."""
    if fig is None:
        st.warning("No plot available to download.")
        return

    st.markdown("---")
    st.subheader("⬇️ Download Plot")
    # Use columns for horizontal layout
    col1, col2, col3 = st.columns(3)

    # Generate different formats
    formats = {
        "HTML": {"ext": "html", "mime": "text/html", "col": col1, "gen_func": fig.write_html, "is_bytes": False},
        "SVG": {"ext": "svg", "mime": "image/svg+xml", "col": col2, "gen_func": lambda buf: buf.write(pio.to_image(fig, format='svg')), "is_bytes": True},
        "PNG": {"ext": "png", "mime": "image/png", "col": col3, "gen_func": lambda buf: buf.write(pio.to_image(fig, format='png', scale=2)), "is_bytes": True},
        # "PDF": {"ext": "pdf", "mime": "application/pdf", "col": col4, "gen_func": lambda buf: buf.write(pio.to_image(fig, format='pdf')), "is_bytes": True}, # Requires kaleido
    }

    for fmt_name, props in formats.items():
        with props["col"]:
            try:
                if props["is_bytes"]:
                    buffer = io.BytesIO()
                    props["gen_func"](buffer)
                else:
                    buffer = io.StringIO()
                    props["gen_func"](buffer)

                buffer.seek(0)
                content = buffer.getvalue()
                filename = f"{filename_base}.{props['ext']}"
                link_text = f"Download .{props['ext'].upper()}"

                # Use st.download_button for better browser compatibility
                st.download_button(
                    label=link_text,
                    data=content,
                    file_name=filename,
                    mime=props["mime"],
                    key=f"download_{props['ext']}" # Unique key per button
                )

            except ImportError as ie:
                 # Specifically catch kaleido import error
                 if 'kaleido' in str(ie).lower():
                      st.warning(f"Install 'kaleido' for .{props['ext'].upper()} download:\n`pip install kaleido`")
                 else:
                      st.error(f"Error generating .{props['ext'].upper()}: {ie}")
                      print(f"Detailed error for .{props['ext'].upper()}: {ie}") # Log detailed error
            except ValueError as ve:
                 # Catch Plotly/Kaleido errors like timeouts or missing fonts
                 st.error(f"Rendering Error for .{props['ext'].upper()}: {ve}")
                 print(f"Detailed error for .{props['ext'].upper()}: {ve}")
            except Exception as e:
                # Catch-all for other unexpected errors
                st.error(f"Failed to create .{props['ext'].upper()} download.")
                print(f"Unexpected download error for .{props['ext'].upper()}: {e}") # Log detailed error

# Function to add data download button (optional)
def add_data_download_button(df: pd.DataFrame, filename="processed_data.csv", label="Download Data (CSV)"):
     if df is not None and not df.empty:
         try:
             csv = df.to_csv(index=False).encode('utf-8')
             st.download_button(
                 label=label,
                 data=csv,
                 file_name=filename,
                 mime='text/csv',
                 key='download_data_csv'
             )
         except Exception as e:
             st.error("Failed to prepare data for download.")
             print(f"Data download error: {e}")