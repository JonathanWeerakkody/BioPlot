import axios from 'axios';

// API base URL - change this based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API service functions
export const getModules = async () => {
  try {
    const response = await apiClient.get('/modules');
    return response.data;
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

export const getSampleData = async (plotType) => {
  try {
    const response = await apiClient.get(`/sample-data/${plotType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sample data for ${plotType}:`, error);
    throw error;
  }
};

export const generatePlot = async (plotType, data, options) => {
  try {
    const response = await apiClient.post('/generate', {
      plotType,
      data,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Error generating plot:', error);
    throw error;
  }
};

export const validateData = async (plotType, data) => {
  try {
    const response = await apiClient.post('/validate', {
      plotType,
      data
    });
    return response.data;
  } catch (error) {
    console.error('Error validating data:', error);
    throw error;
  }
};
