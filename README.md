# BioPlot

A modern biological visualization platform for creating beautiful and customizable plots.

## Overview

BioPlot is a web application that allows users to create, customize, and export biological data visualizations. The application follows a simple step-by-step workflow:

1. **Load Data**: Upload or paste your data
2. **Choose Chart**: Select from available chart types
3. **Customize**: Adjust chart options and appearance
4. **Preview & Export**: Generate and download your visualization

## Getting Started

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/YourUsername/BioPlot.git
   ```

2. Set up the frontend:
   ```
   cd BioPlot/frontend
   npm install
   npm start
   ```

3. Set up the backend (in a separate terminal):
   ```
   cd BioPlot/backend
   pip install -r requirements.txt
   python app.py
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Deployment on Vercel

1. Fork or clone this repository to your GitHub account

2. Connect your GitHub repository to Vercel

3. During the import, Vercel will automatically detect the project configuration

4. Deploy and enjoy your application!

## Adding New Graph Types

BioPlot is designed to be easily extensible. Follow these steps to add new graph types:

### 1. Frontend: Register the new graph type

Open `frontend/src/components/GraphRegistry.js` and add your new graph type to the `GRAPH_TYPES` object:

```javascript
const GRAPH_TYPES = {
  // Existing graph types...
  
  my_new_graph: {
    id: 'my_new_graph',
    name: 'My New Graph',
    category: 'My Category',
    description: 'Description of my new graph type',
    options: [
      { id: 'title', name: 'Title', type: 'text', default: '' },
      // Add more options specific to your graph type
    ]
  }
};
```

### 2. Backend: Add the plot generation function

Open `backend/app.py` and:

1. Add a new condition in the `generate_plot` function:

```python
@app.route('/api/generate', methods=['POST'])
def generate_plot():
    # Existing code...
    
    if plot_type == 'bar_plot':
        create_bar_plot(plot_data, options, buffer)
    elif plot_type == 'pie_plot':
        create_pie_plot(plot_data, options, buffer)
    elif plot_type == 'my_new_graph':
        create_my_new_graph(plot_data, options, buffer)
    else:
        return jsonify({"error": f"Unknown plot type: {plot_type}"}), 400
```

2. Add a new function to create your graph:

```python
def create_my_new_graph(data, options, buffer):
    """Create my new graph type and save it to the buffer"""
    # Extract data
    x_values = data.get('x_values', [])
    y_values = data.get('y_values', [])
    
    # Extract options
    title = options.get('title', '')
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Your plotting code here
    # ...
    
    # Save the plot to the buffer
    plt.tight_layout()
    plt.savefig(buffer, format='png')
    plt.close(fig)
```

3. Add sample data for your graph type:

```python
@app.route('/api/sample-data/<plot_type>', methods=['GET'])
def get_sample_data(plot_type):
    # Existing code...
    
    elif plot_type == 'my_new_graph':
        data = {
            "x_values": [1, 2, 3, 4, 5],
            "y_values": [10, 20, 15, 25, 30]
        }
        return jsonify(data)
```

That's it! Your new graph type will automatically appear in the UI and be fully functional.

## Project Structure

```
BioPlot/
├── frontend/               # React frontend
│   ├── public/             # Static files
│   └── src/                # Source code
│       ├── components/     # React components
│       │   ├── GraphRegistry.js  # Central registry for all graph types
│       │   └── ...
│       ├── services/       # API services
│       └── App.js          # Main application component
├── backend/                # Flask backend
│   ├── app.py              # Main application file
│   └── requirements.txt    # Python dependencies
└── vercel.json             # Vercel deployment configuration
```

## Checking for Unused Functions and Dependencies

To check for unused functions and dependencies:

1. For the frontend:
   ```
   cd frontend
   npx eslint src/**/*.js
   ```

2. For the backend:
   ```
   cd backend
   pip install pylint
   pylint app.py
   ```

## Troubleshooting

If you encounter any issues during deployment:

1. Check the Vercel deployment logs for specific error messages
2. Ensure all dependencies are correctly listed in `package.json` and `requirements.txt`
3. Verify that the environment variables are correctly set in the Vercel project settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.
