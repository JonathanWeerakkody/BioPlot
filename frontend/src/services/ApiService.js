import { useState } from 'react';
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

export const getSampleData = async (module, plotType) => {
  try {
    const response = await apiClient.get(`/sample_data/${module}/${plotType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching sample data for ${plotType}:`, error);
    throw error;
  }
};

export const validateData = async (plotType, data) => {
  try {
    const response = await apiClient.post('/validate_data', {
      plot_type: plotType,
      data: data
    });
    return response.data;
  } catch (error) {
    console.error('Error validating data:', error);
    throw error;
  }
};

export const generatePlot = async (plotType, data, params) => {
  try {
    const response = await apiClient.post('/generate_plot', {
      plot_type: plotType,
      data: data,
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('Error generating plot:', error);
    throw error;
  }
};

export const getPlotUrl = (filename) => {
  return `${API_BASE_URL}/plots/${filename}`;
};

// Custom hook for API calls with loading and error states
export const useApi = (apiFunction, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};
