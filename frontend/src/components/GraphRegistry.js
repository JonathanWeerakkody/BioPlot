import React from 'react';

// This file serves as a registry for all available graph types
// New graphs can be easily added here without modifying other components

const GRAPH_TYPES = {
  // Basic Plots
  bar_plot: {
    id: 'bar_plot',
    name: 'Bar Plot',
    category: 'Basic Plots',
    description: 'Simple bar chart for comparing values across categories',
    options: [
      { id: 'title', name: 'Title', type: 'text', default: '' },
      { id: 'xAxisLabel', name: 'X-Axis Label', type: 'text', default: 'Categories' },
      { id: 'yAxisLabel', name: 'Y-Axis Label', type: 'text', default: 'Values' },
      { id: 'barColor', name: 'Bar Color', type: 'color', default: '#3498db' },
      { id: 'showValues', name: 'Show Values', type: 'boolean', default: true },
      { id: 'sortBars', name: 'Sort Bars', type: 'boolean', default: false }
    ]
  },
  
  pie_plot: {
    id: 'pie_plot',
    name: 'Pie Chart',
    category: 'Basic Plots',
    description: 'Circular chart divided into sectors that represent proportion',
    options: [
      { id: 'title', name: 'Title', type: 'text', default: '' },
      { id: 'showLegend', name: 'Show Legend', type: 'boolean', default: true },
      { id: 'showPercentage', name: 'Show Percentage', type: 'boolean', default: true },
      { id: 'donut', name: 'Donut Style', type: 'boolean', default: false },
      { id: 'colorScheme', name: 'Color Scheme', type: 'select', 
        options: ['Blues', 'Greens', 'Oranges', 'Purples', 'Reds'],
        default: 'Blues' }
    ]
  },
  
  // Add more graph types here as needed
};

// Helper function to get all graph types
export const getAllGraphTypes = () => {
  return Object.values(GRAPH_TYPES);
};

// Helper function to get graph by ID
export const getGraphById = (id) => {
  return GRAPH_TYPES[id] || null;
};

// Helper function to get graphs by category
export const getGraphsByCategory = () => {
  const categories = {};
  
  Object.values(GRAPH_TYPES).forEach(graph => {
    if (!categories[graph.category]) {
      categories[graph.category] = [];
    }
    categories[graph.category].push(graph);
  });
  
  return categories;
};

// Helper function to format data for API modules endpoint
export const getModulesFormat = () => {
  const categories = getGraphsByCategory();
  
  return Object.keys(categories).map(category => ({
    id: category.toLowerCase().replace(/\s+/g, '_'),
    name: category,
    plots: categories[category].map(plot => ({
      id: plot.id,
      name: plot.name
    }))
  }));
};

export default {
  GRAPH_TYPES,
  getAllGraphTypes,
  getGraphById,
  getGraphsByCategory,
  getModulesFormat
};
