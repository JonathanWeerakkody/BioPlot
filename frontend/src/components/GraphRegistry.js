import { useState } from 'react';
import './GraphRegistry.css';

/**
 * GraphRegistry - A system for managing graph types in the application
 * 
 * This module provides a centralized registry for all graph types available in the application.
 * It allows for easy addition of new graph types by following a consistent pattern.
 * 
 * To add a new graph type:
 * 1. Add a new entry to the GRAPH_TYPES object with appropriate configuration
 * 2. Implement any specific validation or rendering logic if needed
 * 3. The new graph will automatically appear in the UI
 */

// Graph type registry - central location for all graph definitions
export const GRAPH_TYPES = {
  // Basic plots
  Bar_Plot: {
    name: "Bar Plot",
    category: "basic",
    description: "Visualize categorical data with rectangular bars",
    icon: "📊",
    dataRequirements: {
      minColumns: 2,
      maxColumns: null,
      requiredTypes: {
        x: ["string", "category"],
        y: ["number"]
      },
      optionalColumns: ["group", "error"]
    },
    defaultConfig: {
      orientation: "vertical",
      barWidth: 0.7,
      groupMode: "grouped",
      showValues: false,
      sortBars: "none"
    },
    customOptions: {
      orientation: {
        type: "select",
        label: "Orientation",
        options: ["vertical", "horizontal"],
        default: "vertical"
      },
      barWidth: {
        type: "number",
        label: "Bar Width (%)",
        min: 30,
        max: 100,
        step: 5,
        default: 70
      },
      groupMode: {
        type: "select",
        label: "Group Mode",
        options: ["grouped", "stacked"],
        default: "grouped"
      }
    }
  },
  
  Pie_Plot: {
    name: "Pie Chart",
    category: "basic",
    description: "Show composition of data as portions of a whole",
    icon: "🥧",
    dataRequirements: {
      minColumns: 2,
      maxColumns: 2,
      requiredTypes: {
        labels: ["string", "category"],
        values: ["number"]
      }
    },
    defaultConfig: {
      donut: false,
      showPercentage: true,
      startAngle: 0,
      sortSlices: "none"
    },
    customOptions: {
      donut: {
        type: "boolean",
        label: "Donut Style",
        default: false
      },
      showPercentage: {
        type: "boolean",
        label: "Show Percentages",
        default: true
      },
      startAngle: {
        type: "number",
        label: "Start Angle",
        min: 0,
        max: 360,
        step: 10,
        default: 0
      }
    }
  },
  
  Line_Plot: {
    name: "Line Plot",
    category: "basic",
    description: "Visualize trends over a continuous interval",
    icon: "📈",
    dataRequirements: {
      minColumns: 2,
      maxColumns: null,
      requiredTypes: {
        x: ["number", "date"],
        y: ["number"]
      },
      optionalColumns: ["group"]
    },
    defaultConfig: {
      lineStyle: "solid",
      lineWidth: 2,
      markers: "auto",
      markerSize: 5,
      fillArea: false,
      smoothing: 0
    },
    customOptions: {
      lineStyle: {
        type: "select",
        label: "Line Style",
        options: ["solid", "dashed", "dotted", "dashdot"],
        default: "solid"
      },
      markers: {
        type: "select",
        label: "Show Markers",
        options: ["auto", "always", "never"],
        default: "auto"
      },
      fillArea: {
        type: "boolean",
        label: "Fill Area Under Line",
        default: false
      }
    }
  },
  
  // Statistical plots
  Box_Plot: {
    name: "Box Plot",
    category: "statistical",
    description: "Display distribution of data through quartiles",
    icon: "📦",
    dataRequirements: {
      minColumns: 2,
      maxColumns: null,
      requiredTypes: {
        x: ["string", "category"],
        y: ["number"]
      },
      optionalColumns: ["group"]
    },
    defaultConfig: {
      showOutliers: true,
      notched: false,
      showMean: false,
      orientation: "vertical"
    },
    customOptions: {
      showOutliers: {
        type: "boolean",
        label: "Show Outliers",
        default: true
      },
      notched: {
        type: "boolean",
        label: "Notched Boxes",
        default: false
      },
      showMean: {
        type: "boolean",
        label: "Show Mean Marker",
        default: false
      }
    }
  },
  
  Violin_Plot: {
    name: "Violin Plot",
    category: "statistical",
    description: "Visualize distribution and probability density",
    icon: "🎻",
    dataRequirements: {
      minColumns: 2,
      maxColumns: null,
      requiredTypes: {
        x: ["string", "category"],
        y: ["number"]
      },
      optionalColumns: ["group"]
    },
    defaultConfig: {
      showInner: "box",
      bandwidth: 0.5,
      orientation: "vertical"
    },
    customOptions: {
      showInner: {
        type: "select",
        label: "Inner Representation",
        options: ["box", "quartile", "stick", "none"],
        default: "box"
      },
      bandwidth: {
        type: "number",
        label: "Bandwidth",
        min: 0.1,
        max: 1.0,
        step: 0.1,
        default: 0.5
      }
    }
  },
  
  // Specialized plots
  Volcano_Plot: {
    name: "Volcano Plot",
    category: "specialized",
    description: "Identify significant changes in large datasets",
    icon: "🌋",
    dataRequirements: {
      minColumns: 3,
      maxColumns: 4,
      requiredTypes: {
        x: ["number"], // log2 fold change
        y: ["number"], // -log10 p-value
        labels: ["string"]
      },
      optionalColumns: ["group"]
    },
    defaultConfig: {
      pThreshold: 0.05,
      fcThreshold: 1.0,
      upColor: "#EA4335",
      downColor: "#4285F4",
      nsColor: "#CCCCCC",
      labelTopGenes: 10
    },
    customOptions: {
      pThreshold: {
        type: "number",
        label: "P-value Threshold",
        min: 0.0001,
        max: 0.1,
        step: 0.001,
        default: 0.05
      },
      fcThreshold: {
        type: "number",
        label: "Fold Change Threshold",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 1.0
      },
      labelTopGenes: {
        type: "number",
        label: "Label Top Genes",
        min: 0,
        max: 50,
        step: 1,
        default: 10
      }
    }
  },
  
  KM_Plot: {
    name: "Kaplan-Meier Plot",
    category: "specialized",
    description: "Visualize survival probability over time",
    icon: "📉",
    dataRequirements: {
      minColumns: 3,
      maxColumns: 4,
      requiredTypes: {
        time: ["number"],
        event: ["number", "boolean"],
        group: ["string", "category"]
      }
    },
    defaultConfig: {
      showConfidence: true,
      showCensored: true,
      riskTable: false
    },
    customOptions: {
      showConfidence: {
        type: "boolean",
        label: "Show Confidence Intervals",
        default: true
      },
      showCensored: {
        type: "boolean",
        label: "Show Censored Points",
        default: true
      },
      riskTable: {
        type: "boolean",
        label: "Show Risk Table",
        default: false
      }
    }
  },
  
  ROC_Curve: {
    name: "ROC Curve",
    category: "specialized",
    description: "Evaluate classification model performance",
    icon: "↗️",
    dataRequirements: {
      minColumns: 2,
      maxColumns: 3,
      requiredTypes: {
        actual: ["number", "boolean"],
        predicted: ["number"]
      },
      optionalColumns: ["group"]
    },
    defaultConfig: {
      showAUC: true,
      showDiagonal: true
    },
    customOptions: {
      showAUC: {
        type: "boolean",
        label: "Show AUC Value",
        default: true
      },
      showDiagonal: {
        type: "boolean",
        label: "Show Diagonal Line",
        default: true
      }
    }
  }
};

// Helper functions for working with graph types

/**
 * Get all graph types organized by category
 * @returns {Object} Graph types organized by category
 */
export const getGraphTypesByCategory = () => {
  const categories = {};
  
  Object.entries(GRAPH_TYPES).forEach(([id, graph]) => {
    const category = graph.category || 'other';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      id,
      ...graph
    });
  });
  
  return categories;
};

/**
 * Get a specific graph type by ID
 * @param {string} id - The graph type ID
 * @returns {Object} The graph type configuration
 */
export const getGraphTypeById = (id) => {
  return GRAPH_TYPES[id] ? { id, ...GRAPH_TYPES[id] } : null;
};

/**
 * Validate data for a specific graph type
 * @param {string} graphTypeId - The graph type ID
 * @param {Array} data - The data to validate
 * @returns {Object} Validation result with isValid flag and any error messages
 */
export const validateDataForGraphType = (graphTypeId, data) => {
  const graphType = GRAPH_TYPES[graphTypeId];
  
  if (!graphType) {
    return {
      isValid: false,
      errors: [`Unknown graph type: ${graphTypeId}`]
    };
  }
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      errors: ['Data must be a non-empty array']
    };
  }
  
  const errors = [];
  const { dataRequirements } = graphType;
  
  // Check column count
  const columnCount = Object.keys(data[0]).length;
  
  if (dataRequirements.minColumns && columnCount < dataRequirements.minColumns) {
    errors.push(`This graph requires at least ${dataRequirements.minColumns} columns`);
  }
  
  if (dataRequirements.maxColumns && columnCount > dataRequirements.maxColumns) {
    errors.push(`This graph accepts at most ${dataRequirements.maxColumns} columns`);
  }
  
  // More detailed validation could be added here based on specific graph requirements
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * GraphRegistryManager component for managing graph types
 */
const GraphRegistryManager = () => {
  const [categories] = useState(getGraphTypesByCategory());
  
  return (
    <div className="graph-registry-manager">
      <h2>Available Graph Types</h2>
      
      {Object.entries(categories).map(([category, graphs]) => (
        <div key={category} className="graph-category">
          <h3 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
          
          <div className="graph-list">
            {graphs.map(graph => (
              <div key={graph.id} className="graph-item">
                <div className="graph-icon">{graph.icon}</div>
                <div className="graph-info">
                  <h4 className="graph-name">{graph.name}</h4>
                  <p className="graph-description">{graph.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="add-graph-instructions">
        <h3>How to Add a New Graph Type</h3>
        <ol>
          <li>Open <code>GraphRegistry.js</code></li>
          <li>Add a new entry to the <code>GRAPH_TYPES</code> object</li>
          <li>Define the required properties (name, category, description, etc.)</li>
          <li>Specify data requirements and custom options</li>
          <li>The new graph will automatically appear in the UI</li>
        </ol>
        <p>See the existing graph types for examples of the required structure.</p>
      </div>
    </div>
  );
};

export default GraphRegistryManager;
