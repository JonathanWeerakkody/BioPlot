import React, { useState, useEffect } from 'react';
import './PlotPreview.css';

const PlotPreview = ({ data, config, plotType, loading }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // This function would normally make an API call to the backend
  // For now, we'll simulate it with a timeout
  const generatePreview = async () => {
    if (!data || data.length === 0) {
      setPreviewError('No data available for preview');
      return;
    }

    try {
      setPreviewError(null);
      
      // In a real implementation, this would be an API call to the backend
      // For demonstration, we'll simulate a delay and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a unique URL to prevent caching
      const timestamp = new Date().getTime();
      
      // In a real implementation, this would be the URL returned from the backend
      // For now, we'll use a placeholder image based on plot type
      let mockImageUrl;
      
      switch(plotType) {
        case 'Pie_Plot':
          mockImageUrl = '/images/pie_plot_preview.png';
          break;
        case 'Bar_Plot':
          mockImageUrl = '/images/bar_plot_preview.png';
          break;
        case 'Volcano_Plot':
          mockImageUrl = '/images/volcano_plot_preview.png';
          break;
        case 'KM_Plot':
          mockImageUrl = '/images/km_plot_preview.png';
          break;
        case 'ROC_Curve':
          mockImageUrl = '/images/roc_curve_preview.png';
          break;
        default:
          mockImageUrl = '/images/default_plot_preview.png';
      }
      
      // Add timestamp to prevent caching
      setPreviewUrl(`${mockImageUrl}?t=${timestamp}`);
      setLastUpdateTime(new Date());
    } catch (error) {
      setPreviewError(`Failed to generate preview: ${error.message}`);
    }
  };

  // Generate preview when data or config changes
  useEffect(() => {
    // Debounce preview generation to avoid too many requests
    const debounceTimeout = setTimeout(() => {
      if (data && data.length > 0) {
        generatePreview();
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(debounceTimeout);
  }, [data, config]);

  const handleRefreshPreview = () => {
    generatePreview();
  };

  return (
    <div className="plot-preview">
      <div className="preview-header">
        <h3>Plot Preview</h3>
        {lastUpdateTime && (
          <span className="last-updated">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="preview-container">
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Generating preview...</p>
          </div>
        ) : previewError ? (
          <div className="preview-error">
            <p>{previewError}</p>
            <button 
              className="retry-button"
              onClick={handleRefreshPreview}
            >
              Retry
            </button>
          </div>
        ) : previewUrl ? (
          <div className="preview-image-container">
            <img src={previewUrl} alt="Plot preview" className="preview-image" />
          </div>
        ) : (
          <div className="no-preview">
            <p>No preview available</p>
            <p>Customize your plot options and a preview will appear here</p>
          </div>
        )}
      </div>
      
      <div className="preview-controls">
        <button 
          className="refresh-button"
          onClick={handleRefreshPreview}
          disabled={loading || !data || data.length === 0}
        >
          <i className="refresh-icon"></i> Refresh Preview
        </button>
        
        <div className="preview-options">
          <label className="auto-update-option">
            <input 
              type="checkbox"
              checked={true}
              onChange={() => {}} // In a real implementation, this would toggle auto-update
            />
            Auto-update preview
          </label>
        </div>
      </div>
    </div>
  );
};

export default PlotPreview;
