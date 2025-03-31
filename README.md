# BioPlot

A modern scientific visualization platform for creating beautiful and customizable biological plots.

## Features

- **Modern UI**: Clean, responsive interface with dark mode support
- **Multiple Plot Types**: Support for various scientific visualization types
- **Customization Options**: Extensive options to customize plot appearance and layout
- **Export Capabilities**: Export plots in multiple formats (PNG, SVG, PDF, HTML)
- **Extensible Architecture**: Easily add new graph types as the application grows

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.7+ (for backend)
- pip (for Python dependencies)

### Local Development

#### Frontend Setup

1. Clone the repository:
   ```
   git clone https://github.com/YourUsername/BioPlot.git
   ```

2. Navigate to the frontend directory:
   ```
   cd BioPlot/frontend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

#### Backend Setup

For full functionality, you need to run the backend server:

1. Navigate to the backend directory:
   ```
   cd SRplot_App/backend
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```
   python run.py
   ```

### Testing Locally

#### Frontend Testing

1. Run ESLint to check for code issues:
   ```
   cd frontend
   npx eslint src/**/*.js
   ```

2. Run tests:
   ```
   npm test
   ```

3. Check for unused dependencies:
   ```
   npx depcheck
   ```

#### Backend Testing

1. Test the API endpoints:
   ```
   cd backend
   python -m pytest tests/
   ```

2. Check for unused Python imports:
   ```
   pip install pylint
   pylint app.py
   ```

### Checking for Unused Functions and Dependencies

#### Frontend

1. Install depcheck to find unused dependencies:
   ```
   npm install -g depcheck
   cd frontend
   depcheck
   ```

2. Use ESLint to find unused variables and functions:
   ```
   npx eslint src/ --rule 'no-unused-vars: error'
   ```

3. Clean up unused dependencies:
   ```
   npm prune
   ```

#### Backend

1. Use pylint to find unused imports and functions:
   ```
   cd backend
   pylint app.py --disable=all --enable=unused-import,unused-variable
   ```

### Deploying with Vercel

SRplot App can be easily deployed using Vercel for both frontend and backend components.

#### Frontend Deployment

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Navigate to the frontend directory:
   ```
   cd frontend
   ```

3. Build the project:
   ```
   npm run build
   ```

4. Deploy to Vercel:
   ```
   vercel
   ```

5. For production deployment:
   ```
   vercel --prod
   ```

#### Backend Deployment

1. Create a `vercel.json` file in the backend directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "run.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "run.py"
       }
     ]
   }
   ```

2. Deploy the backend:
   ```
   cd backend
   vercel
   ```

3. For production deployment:
   ```
   vercel --prod
   ```

#### Connecting Frontend and Backend

1. Get the URL of your deployed backend from Vercel
2. Create a `.env` file in your frontend directory:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```

3. Redeploy the frontend:
   ```
   cd frontend
   vercel --prod
   ```

#### Monorepo Deployment (Alternative)

For a unified deployment from the project root:

1. Create a `vercel.json` file in the project root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "build"
         }
       },
       {
         "src": "backend/run.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "backend/run.py"
       },
       {
         "src": "/(.*)",
         "dest": "frontend/build/$1"
       }
     ]
   }
   ```

2. Deploy the entire project:
   ```
   vercel
   ```

## Adding New Graph Types

BioPlot is designed to be easily extensible. Follow these steps to add new graph types:

### Frontend Registration

1. **Navigate to the Graph Registry**:
   - Open `src/components/GraphRegistry.js`

2. **Add a new entry to the GRAPH_TYPES object**:
   ```javascript
   YourNew_Plot: {
     name: "Your New Plot",
     category: "your-category", // Use an existing category or create a new one
     description: "Description of your new plot type",
     icon: "🔍", // Choose an appropriate emoji or icon
     dataRequirements: {
       minColumns: 2, // Minimum number of data columns required
       maxColumns: 4, // Maximum number of data columns (null for unlimited)
       requiredTypes: {
         x: ["number", "date"], // Required data types for x-axis
         y: ["number"] // Required data types for y-axis
       },
       optionalColumns: ["group"] // Optional columns
     },
     defaultConfig: {
       // Default configuration options
       yourOption1: "default-value",
       yourOption2: true
     },
     customOptions: {
       // Custom options for the customization panel
       yourOption1: {
         type: "select", // Option type (select, number, boolean, color, etc.)
         label: "Your Option Label",
         options: ["option1", "option2", "option3"],
         default: "option1"
       },
       yourOption2: {
         type: "boolean",
         label: "Enable Feature",
         default: true
       }
     }
   }
   ```

### Backend Integration

3. **Add Python backend support**:
   - Navigate to the backend directory: `cd SRplot_App/backend`
   - Open `app.py` and locate the plot generation functions
   - Add a new function for your graph type following this pattern:

   ```python
   @app.route('/api/generate_plot', methods=['POST'])
   def generate_plot():
       data = request.json
       plot_type = data.get('plot_type')
       plot_data = data.get('data')
       params = data.get('params', {})
       
       if plot_type == 'Bar_Plot':
           return generate_bar_plot(plot_data, params)
       elif plot_type == 'Pie_Plot':
           return generate_pie_plot(plot_data, params)
       # Add your new plot type here
       elif plot_type == 'Your_New_Plot':
           return generate_your_new_plot(plot_data, params)
       else:
           return jsonify({'error': f'Unknown plot type: {plot_type}'}), 400

   # Add a new function for your plot type
   def generate_your_new_plot(data, params):
       try:
           # Import necessary libraries
           import matplotlib.pyplot as plt
           import numpy as np
           
           # Create figure
           fig, ax = plt.subplots(figsize=(params.get('width', 800)/100, params.get('height', 600)/100))
           
           # Process data
           x_data = [item['x'] for item in data]
           y_data = [item['y'] for item in data]
           
           # Your custom plotting code here
           # ...
           
           # Apply customization from params
           if params.get('title'):
               ax.set_title(params.get('title'))
           
           # Save plot to temporary file
           plot_filename = f"your_new_plot_{uuid.uuid4()}.png"
           plot_path = os.path.join(app.config['PLOT_FOLDER'], plot_filename)
           plt.savefig(plot_path, dpi=100, bbox_inches='tight')
           plt.close()
           
           # Return URLs for the generated plot
           return jsonify({
               'plot_urls': {
                   'png': f"/api/plots/{plot_filename}"
               }
           })
       except Exception as e:
           return jsonify({'error': str(e)}), 500
   ```

4. **Test Your New Plot**:
   - Restart the application
   - Your new plot type will automatically appear in the UI
   - Test with sample data to ensure it works correctly

### Easy Deployment

5. **Create a deployment script**:
   - Create a file named `deploy.sh` in the root directory:

   ```bash
   #!/bin/bash
   
   # Build frontend
   cd frontend
   npm install
   npm run build
   
   # Setup backend
   cd ../backend
   pip install -r requirements.txt
   
   # Start services
   python run.py &
   cd ../frontend
   serve -s build -l 3000
   ```

   - Make it executable: `chmod +x deploy.sh`
   - Run with: `./deploy.sh`

## Customization Options

The application provides extensive customization options for each plot type:

- **Appearance**: Title, colors, theme, fonts
- **Layout**: Dimensions, legend, axis labels, orientation
- **Data Options**: Plot-specific data visualization options
- **Export**: Format, dimensions, and additional export options

## Project Structure

```
SRplot_App/
├── backend/               # Python Flask backend
│   ├── app.py             # Main backend application
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── public/            # Static files
│   └── src/               # Source code
│       ├── components/    # React components
│       │   ├── GraphRegistry.js  # Graph type registry
│       │   ├── LandingPage.js    # Modern landing page
│       │   └── CustomizationPage.js  # Plot customization
│       ├── services/      # API services
│       └── styles/        # CSS styles
└── README.md              # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
