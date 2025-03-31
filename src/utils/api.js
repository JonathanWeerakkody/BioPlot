import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Health check to verify API is running
export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Generate chart using the backend API
export const generateChart = async (genes, values, options) => {
  try {
    const response = await axios.post(`${API_URL}/generate-chart`, {
      genes,
      values,
      options
    });
    return response.data;
  } catch (error) {
    console.error('Chart generation failed:', error);
    throw error;
  }
};
