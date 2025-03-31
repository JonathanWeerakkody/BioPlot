import React, { useState } from 'react';
import './ExportManager.css';

const ExportManager = ({ onExport, plotType, loading }) => {
  const [exportFormat, setExportFormat] = useState('png');
  const [exportResolution, setExportResolution] = useState('medium');
  const [exportStatus, setExportStatus] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [batchExport, setBatchExport] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['png']);
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(900);
  const [exportOptions, setExportOptions] = useState({
    includeTitle: true,
    includeLegend: true,
    transparent: false,
    includeDateStamp: false,
    includeWatermark: false
  });

  const formats = [
    { id: 'png', name: 'PNG Image', description: 'Best for web use and presentations', icon: '📷' },
    { id: 'svg', name: 'SVG Vector', description: 'Scalable vector format, ideal for editing', icon: '✏️' },
    { id: 'pdf', name: 'PDF Document', description: 'Perfect for printing and publications', icon: '📄' },
    { id: 'tiff', name: 'TIFF Image', description: 'High-quality image for professional use', icon: '🖼️' },
    { id: 'eps', name: 'EPS Vector', description: 'For professional printing and publishing', icon: '🖨️' },
    { id: 'csv', name: 'CSV Data', description: 'Export the underlying data', icon: '📊' }
  ];

  const resolutions = [
    { id: 'screen', name: 'Screen (72 DPI)', width: 800, height: 600 },
    { id: 'medium', name: 'Medium (150 DPI)', width: 1200, height: 900 },
    { id: 'high', name: 'High (300 DPI)', width: 2400, height: 1800 },
    { id: 'publication', name: 'Publication (600 DPI)', width: 4800, height: 3600 },
    { id: 'custom', name: 'Custom Size', width: null, height: null }
  ];

  const handleOptionChange = (option, value) => {
    setExportOptions({
      ...exportOptions,
      [option]: value
    });
  };

  const handleFormatToggle = (format) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  const handleSingleExport = async () => {
    setExportStatus('exporting');
    
    try {
      const exportConfig = {
        format: exportFormat,
        resolution: exportResolution,
        dimensions: exportResolution === 'custom' 
          ? { width: customWidth, height: customHeight }
          : resolutions.find(r => r.id === exportResolution),
        options: exportOptions
      };
      
      await onExport(exportConfig);
      
      // Add to export history
      const newExport = {
        id: Date.now(),
        format: exportFormat,
        resolution: exportResolution,
        timestamp: new Date().toLocaleString(),
        filename: `${plotType}_plot.${exportFormat}`
      };
      
      setExportHistory([newExport, ...exportHistory]);
      setExportStatus('success');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    }
  };

  const handleBatchExport = async () => {
    if (selectedFormats.length === 0) {
      setExportStatus('error');
      return;
    }
    
    setExportStatus('exporting');
    
    try {
      // Create a base export config
      const baseConfig = {
        resolution: exportResolution,
        dimensions: exportResolution === 'custom' 
          ? { width: customWidth, height: customHeight }
          : resolutions.find(r => r.id === exportResolution),
        options: exportOptions
      };
      
      // Export each selected format
      for (const format of selectedFormats) {
        const exportConfig = {
          ...baseConfig,
          format: format
        };
        
        await onExport(exportConfig);
        
        // Add to export history
        const newExport = {
          id: Date.now() + Math.random(),
          format: format,
          resolution: exportResolution,
          timestamp: new Date().toLocaleString(),
          filename: `${plotType}_plot.${format}`
        };
        
        setExportHistory(prev => [newExport, ...prev]);
      }
      
      setExportStatus('success');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Batch export error:', error);
      setExportStatus('error');
      
      // Reset status after a delay
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="export-manager">
      <div className="export-tabs">
        <button 
          className={`tab-button ${!batchExport ? 'active' : ''}`}
          onClick={() => setBatchExport(false)}
        >
          Single Export
        </button>
        <button 
          className={`tab-button ${batchExport ? 'active' : ''}`}
          onClick={() => setBatchExport(true)}
        >
          Batch Export
        </button>
      </div>
      
      {!batchExport ? (
        <div className="single-export">
          <div className="export-section">
            <h4>File Format</h4>
            <div className="format-options">
              {formats.map(format => (
                <div 
                  key={format.id}
                  className={`format-option ${exportFormat === format.id ? 'selected' : ''}`}
                  onClick={() => setExportFormat(format.id)}
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
                  className={`resolution-option ${exportResolution === resolution.id ? 'selected' : ''}`}
                  onClick={() => setExportResolution(resolution.id)}
                >
                  <div className="resolution-name">{resolution.name}</div>
                  {resolution.width && resolution.height && (
                    <div className="resolution-dimensions">{resolution.width} × {resolution.height} px</div>
                  )}
                </div>
              ))}
            </div>
            
            {exportResolution === 'custom' && (
              <div className="custom-dimensions">
                <div className="dimension-input">
                  <label>Width (px)</label>
                  <input 
                    type="number" 
                    min="100" 
                    max="10000" 
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                  />
                </div>
                <div className="dimension-input">
                  <label>Height (px)</label>
                  <input 
                    type="number" 
                    min="100" 
                    max="10000" 
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
                  checked={exportOptions.includeTitle} 
                  onChange={(e) => handleOptionChange('includeTitle', e.target.checked)}
                />
                Include title
              </label>
              
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.includeLegend} 
                  onChange={(e) => handleOptionChange('includeLegend', e.target.checked)}
                />
                Include legend
              </label>
              
              {(exportFormat === 'png' || exportFormat === 'svg') && (
                <label className="option-checkbox">
                  <input 
                    type="checkbox" 
                    checked={exportOptions.transparent} 
                    onChange={(e) => handleOptionChange('transparent', e.target.checked)}
                  />
                  Transparent background
                </label>
              )}
              
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.includeDateStamp} 
                  onChange={(e) => handleOptionChange('includeDateStamp', e.target.checked)}
                />
                Include date stamp
              </label>
            </div>
          </div>
          
          <div className="export-actions">
            <button 
              className={`export-button ${exportStatus ? exportStatus : ''}`}
              onClick={handleSingleExport}
              disabled={loading || exportStatus === 'exporting'}
            >
              {loading || exportStatus === 'exporting' ? 'Exporting...' : 
               exportStatus === 'success' ? 'Export Successful!' : 
               exportStatus === 'error' ? 'Export Failed, Try Again' : 
               `Export as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      ) : (
        <div className="batch-export">
          <div className="export-section">
            <h4>Select Formats to Export</h4>
            <div className="batch-format-options">
              {formats.map(format => (
                <label key={format.id} className="batch-format-option">
                  <input 
                    type="checkbox"
                    checked={selectedFormats.includes(format.id)}
                    onChange={() => handleFormatToggle(format.id)}
                  />
                  <div className="format-icon">{format.icon}</div>
                  <div className="format-name">{format.name}</div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="export-section">
            <h4>Resolution (applies to all formats)</h4>
            <div className="resolution-options">
              {resolutions.map(resolution => (
                <div 
                  key={resolution.id}
                  className={`resolution-option ${exportResolution === resolution.id ? 'selected' : ''}`}
                  onClick={() => setExportResolution(resolution.id)}
                >
                  <div className="resolution-name">{resolution.name}</div>
                  {resolution.width && resolution.height && (
                    <div className="resolution-dimensions">{resolution.width} × {resolution.height} px</div>
                  )}
                </div>
              ))}
            </div>
            
            {exportResolution === 'custom' && (
              <div className="custom-dimensions">
                <div className="dimension-input">
                  <label>Width (px)</label>
                  <input 
                    type="number" 
                    min="100" 
                    max="10000" 
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                  />
                </div>
                <div className="dimension-input">
                  <label>Height (px)</label>
                  <input 
                    type="number" 
                    min="100" 
                    max="10000" 
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="export-section">
            <h4>Additional Options (apply to all formats)</h4>
            <div className="additional-options">
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.includeTitle} 
                  onChange={(e) => handleOptionChange('includeTitle', e.target.checked)}
                />
                Include title
              </label>
              
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.includeLegend} 
                  onChange={(e) => handleOptionChange('includeLegend', e.target.checked)}
                />
                Include legend
              </label>
              
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.transparent} 
                  onChange={(e) => handleOptionChange('transparent', e.target.checked)}
                />
                Transparent background (PNG/SVG only)
              </label>
              
              <label className="option-checkbox">
                <input 
                  type="checkbox" 
                  checked={exportOptions.includeDateStamp} 
                  onChange={(e) => handleOptionChange('includeDateStamp', e.target.checked)}
                />
                Include date stamp
              </label>
            </div>
          </div>
          
          <div className="export-actions">
            <button 
              className={`export-button ${exportStatus ? exportStatus : ''}`}
              onClick={handleBatchExport}
              disabled={loading || exportStatus === 'exporting' || selectedFormats.length === 0}
            >
              {loading || exportStatus === 'exporting' ? 'Exporting...' : 
               exportStatus === 'success' ? 'Export Successful!' : 
               exportStatus === 'error' ? 'Export Failed, Try Again' : 
               `Export Selected Formats (${selectedFormats.length})`}
            </button>
          </div>
        </div>
      )}
      
      {exportHistory.length > 0 && (
        <div className="export-history">
          <h4>Recent Exports</h4>
          <div className="history-list">
            {exportHistory.slice(0, 5).map(item => (
              <div key={item.id} className="history-item">
                <div className="history-icon">
                  {formats.find(f => f.id === item.format)?.icon || '📄'}
                </div>
                <div className="history-details">
                  <div className="history-filename">{item.filename}</div>
                  <div className="history-meta">
                    {item.resolution} • {item.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
  );
};

export default ExportManager;
