import React from 'react';
import './ExportOptions.css';

const ExportOptions = ({ onExport, loading }) => {
  const formats = [
    { id: 'png', name: 'PNG Image', description: 'Best for web use and presentations', icon: '📷' },
    { id: 'svg', name: 'SVG Vector', description: 'Scalable vector format, ideal for editing', icon: '✏️' },
    { id: 'pdf', name: 'PDF Document', description: 'Perfect for printing and publications', icon: '📄' },
    { id: 'tiff', name: 'TIFF Image', description: 'High-quality image for professional use', icon: '🖼️' },
    { id: 'csv', name: 'CSV Data', description: 'Export the underlying data', icon: '📊' }
  ];

  const resolutions = [
    { id: 'screen', name: 'Screen (72 DPI)', width: 800, height: 600 },
    { id: 'medium', name: 'Medium (150 DPI)', width: 1200, height: 900 },
    { id: 'high', name: 'High (300 DPI)', width: 2400, height: 1800 },
    { id: 'custom', name: 'Custom Size', width: null, height: null }
  ];

  const [selectedFormat, setSelectedFormat] = React.useState('png');
  const [selectedResolution, setSelectedResolution] = React.useState('medium');
  const [customWidth, setCustomWidth] = React.useState(1200);
  const [customHeight, setCustomHeight] = React.useState(900);
  const [includeTitle, setIncludeTitle] = React.useState(true);
  const [includeLegend, setIncludeLegend] = React.useState(true);
  const [transparent, setTransparent] = React.useState(false);
  const [exportStatus, setExportStatus] = React.useState(null);

  const handleExport = () => {
    setExportStatus('exporting');
    
    const exportConfig = {
      format: selectedFormat,
      resolution: selectedResolution,
      dimensions: selectedResolution === 'custom' 
        ? { width: customWidth, height: customHeight }
        : resolutions.find(r => r.id === selectedResolution),
      options: {
        includeTitle,
        includeLegend,
        transparent
      }
    };
    
    try {
      onExport(exportConfig);
      setExportStatus('success');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (error) {
      setExportStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="export-options">
      <h3>Export Options</h3>
      
      <div className="export-section">
        <h4>File Format</h4>
        <div className="format-options">
          {formats.map(format => (
            <div 
              key={format.id}
              className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
              onClick={() => setSelectedFormat(format.id)}
            >
              <div className="format-icon">{format.icon}</div>
              <div className="format-details">
                <div className="format-name">{format.name}</div>
                <div className="format-description">{format.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="export-section">
        <h4>Resolution</h4>
        <div className="resolution-options">
          {resolutions.map(resolution => (
            <div 
              key={resolution.id}
              className={`resolution-option ${selectedResolution === resolution.id ? 'selected' : ''}`}
              onClick={() => setSelectedResolution(resolution.id)}
            >
              <div className="resolution-name">{resolution.name}</div>
              {resolution.width && resolution.height && (
                <div className="resolution-dimensions">{resolution.width} × {resolution.height} px</div>
              )}
            </div>
          ))}
        </div>
        
        {selectedResolution === 'custom' && (
          <div className="custom-dimensions">
            <div className="dimension-input">
              <label>Width (px)</label>
              <input 
                type="number" 
                min="100" 
                max="5000" 
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value))}
              />
            </div>
            <div className="dimension-input">
              <label>Height (px)</label>
              <input 
                type="number" 
                min="100" 
                max="5000" 
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="export-section">
        <h4>Additional Options</h4>
        <div className="additional-options">
          <label className="option-checkbox">
            <input 
              type="checkbox" 
              checked={includeTitle} 
              onChange={(e) => setIncludeTitle(e.target.checked)}
            />
            Include title
          </label>
          
          <label className="option-checkbox">
            <input 
              type="checkbox" 
              checked={includeLegend} 
              onChange={(e) => setIncludeLegend(e.target.checked)}
            />
            Include legend
          </label>
          
          {(selectedFormat === 'png' || selectedFormat === 'svg') && (
            <label className="option-checkbox">
              <input 
                type="checkbox" 
                checked={transparent} 
                onChange={(e) => setTransparent(e.target.checked)}
              />
              Transparent background
            </label>
          )}
        </div>
      </div>
      
      <div className="export-actions">
        <button 
          className={`export-button ${exportStatus ? exportStatus : ''}`}
          onClick={handleExport}
          disabled={loading || exportStatus === 'exporting'}
        >
          {loading || exportStatus === 'exporting' ? 'Exporting...' : 
           exportStatus === 'success' ? 'Export Successful!' : 
           exportStatus === 'error' ? 'Export Failed, Try Again' : 
           'Export Plot'}
        </button>
        
        {exportStatus === 'success' && (
          <div className="export-success-message">
            Your plot has been exported successfully and downloaded to your device.
          </div>
        )}
        
        {exportStatus === 'error' && (
          <div className="export-error-message">
            There was an error exporting your plot. Please try again or choose a different format.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportOptions;
