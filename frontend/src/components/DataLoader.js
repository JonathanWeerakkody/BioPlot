import React, { useState } from 'react';
import { getSampleData } from '../services/ApiService';

function DataLoader({ onDataLoaded }) {
  const [inputData, setInputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError(null);
  };

  const handleLoadSample = async (plotType) => {
    try {
      setLoading(true);
      setError(null);
      const sampleData = await getSampleData(plotType);
      setInputData(sampleData);
      onDataLoaded(sampleData, 'sample');
    } catch (error) {
      setError('Failed to load sample data. Please try again.');
      console.error('Error loading sample data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!inputData.trim()) {
      setError('Please enter some data or load a sample.');
      return;
    }
    
    try {
      // Here you would typically parse and validate the data
      // For simplicity, we're just passing it through
      onDataLoaded(inputData, 'user');
      setError(null);
    } catch (error) {
      setError('Invalid data format. Please check your input.');
      console.error('Error processing data:', error);
    }
  };

  return (
    <div className="data-loader">
      <div className="data-loader-controls">
        <button 
          className="btn btn-secondary data-sample-btn" 
          onClick={() => handleLoadSample('bar_plot')}
          disabled={loading}
        >
          Load Sample Data
        </button>
      </div>
      
      <textarea
        className="data-input"
        value={inputData}
        onChange={handleInputChange}
        placeholder="Paste your data here (CSV, TSV, or JSON format)..."
        disabled={loading}
      />
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <button 
        className="btn btn-primary" 
        onClick={handleSubmit}
        disabled={loading || !inputData.trim()}
      >
        {loading ? 'Loading...' : 'Use This Data'}
      </button>
    </div>
  );
}

export default DataLoader;
