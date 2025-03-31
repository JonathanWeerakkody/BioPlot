import React, { useState, useEffect } from 'react';
import { generatePlot } from '../services/ApiService';

function ChartPreview({ chart, data, options, onChartGenerated, generatedChart }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  
  useEffect(() => {
    if (chart && data && options) {
      handleGenerateChart();
    }
  }, [chart, options]);
  
  const handleGenerateChart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await generatePlot(chart.id, data, options);
      
      if (result && result.image) {
        setImageUrl(`data:image/png;base64,${result.image}`);
        onChartGenerated(result);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setError('Failed to generate chart. Please try again.');
      console.error('Error generating chart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${chart.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="chart-preview">
      <div className="preview-container">
        {loading && <div className="loading-indicator">Generating chart...</div>}
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        {imageUrl && !loading && (
          <div className="chart-image-container">
            <img src={imageUrl} alt={chart.name} className="chart-image" />
          </div>
        )}
        
        {!imageUrl && !loading && !error && (
          <div className="empty-preview">
            <p>Adjust options and click Generate to preview your chart</p>
          </div>
        )}
      </div>
      
      <div className="export-options">
        <button 
          className="btn btn-primary" 
          onClick={handleGenerateChart}
          disabled={loading || !chart || !data}
        >
          {loading ? 'Generating...' : 'Generate Chart'}
        </button>
        
        <button 
          className="btn btn-secondary" 
          onClick={handleDownload}
          disabled={!imageUrl || loading}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

export default ChartPreview;
