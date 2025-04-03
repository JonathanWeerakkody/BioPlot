# BioPlot: Interactive Bioinformatics Visualization

BioPlot is a web application built with Streamlit designed to make common bioinformatics plotting tasks easy and interactive. Upload your data, choose a plot type (like Volcano, Heatmap, PCA), customize parameters in real-time, preview the results, and download publication-ready figures in various formats (HTML, SVG, PNG).

## Features

*   **Modular Design:** Easily add new plot types by creating a Python file in `plots/` and defining it in `config/plots.json`.
*   **Interactive Controls:** Use sidebar widgets to adjust plot parameters dynamically.
*   **Live Preview:** See how your plot changes as you adjust settings.
*   **Data Validation:** Basic checks to ensure data matches the requirements of the selected plot.
*   **Example Data:** Load sample datasets to quickly understand formats and test plots.
*   **Multiple Download Formats:** Get your plots as interactive HTML, scalable SVG, or high-resolution PNG.
*   **Modern UI:** Clean and user-friendly interface powered by Streamlit and custom theming.

## Demo

[Link to your deployed Vercel app once live]

## Local Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/JonathanWeerakkody/BioPlot.git # Use your repo URL
    cd BioPlot
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Streamlit app:**
    ```bash
    streamlit run app.py
    ```

    The application should open automatically in your web browser.

## Deployment on Vercel

This app is configured for easy deployment on Vercel:

1.  **Push your code to a GitHub repository.**
2.  **Sign up or log in to [Vercel](https://vercel.com/).**
3.  **Import your GitHub repository.**
4.  **Configure Project:**
    *   Vercel should automatically detect it as a Streamlit app (using the `Procfile` and `requirements.txt`).
    *   Ensure the **Root Directory** is correct (usually the repository root).
    *   The **Build Command** and **Output Directory** can often be left blank or default for Streamlit.
    *   The `runtime.txt` file specifies Python 3.12.
5.  **Deploy!** Vercel will install dependencies, build, and deploy your application.

## Adding a New Plot Type

1.  **Create Python Module:** Add a new file like `plots/my_new_plot.py`. It *must* contain a function `generate_plot(df: pd.DataFrame, params: dict)` that takes a pandas DataFrame and a dictionary of parameters, and returns a Plotly Figure object.
2.  **Define in JSON:** Add a new entry to `config/plots.json`. Define its `name`, `module` (e.g., `"plots.my_new_plot"`), `function` (`"generate_plot"`), `description`, `data_requirements`, and `params` (following the established schema).
3.  **Add Example Data (Optional):** Create `data/example_my_new_plot.csv`.
4.  **Add Dependencies:** If your new plot needs extra libraries, add them to `requirements.txt`.
5.  **Test locally and commit!**

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[Specify your license, e.g., MIT License]