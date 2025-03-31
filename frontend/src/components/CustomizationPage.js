import { useState } from 'react';
import './CustomizationPage.css';

const CustomizationPage = ({ 
  plotType, 
  plotData, 
  initialConfig, 
  onConfigChange, 
  onExport, 
  previewUrl, 
  loading 
}) => {
  const [config, setConfig] = useState(initialConfig || {});
  const [activeTab, setActiveTab] = useState('appearance');
  const [exportFormat, setExportFormat] = useState('png');
  const [exportDimensions, setExportDimensions] = useState({
    width: initialConfig?.width || 800,
    height: initialConfig?.height || 600
  });
  const [exportOptions, setExportOptions] = useState({
    includeTitle: true,
    includeLegend: true,
    transparent: false,
    highResolution: false
  });

  // Handle configuration changes
  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Handle nested configuration changes
  const handleNestedConfigChange = (group, key, value) => {
    const newConfig = { 
      ...config, 
      [group]: { 
        ...(config[group] || {}), 
        [key]: value 
      } 
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Handle export dimensions change
  const handleDimensionChange = (dimension, value) => {
    const newDimensions = { ...exportDimensions, [dimension]: value };
    setExportDimensions(newDimensions);
  };

  // Handle export options change
  const handleExportOptionChange = (option, value) => {
    const newOptions = { ...exportOptions, [option]: value };
    setExportOptions(newOptions);
  };

  // Trigger export with current settings
  const handleExport = () => {
    onExport({
      format: exportFormat,
      dimensions: exportDimensions,
      options: exportOptions
    });
  };

  // Render different control types based on option configuration
  const renderControl = (option, key) => {
    if (!option) return null;

    switch (option.type) {
      case 'text':
        return (
          <div className="control-group" key={key}>
            <label htmlFor={key}>{option.label}</label>
            <input
              type="text"
              id={key}
              value={config[key] || option.default || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
              placeholder={option.placeholder || ''}
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="control-group" key={key}>
            <label htmlFor={key}>{option.label}</label>
            <input
              type="number"
              id={key}
              value={config[key] || option.default || 0}
              min={option.min}
              max={option.max}
              step={option.step || 1}
              onChange={(e) => handleConfigChange(key, parseFloat(e.target.value))}
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="control-group" key={key}>
            <label htmlFor={key}>{option.label}</label>
            <select
              id={key}
              value={config[key] || option.default || ''}
              onChange={(e) => handleConfigChange(key, e.target.value)}
            >
              {option.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );
      
      case 'boolean':
        return (
          <div className="control-group checkbox" key={key}>
            <input
              type="checkbox"
              id={key}
              checked={config[key] !== undefined ? config[key] : option.default}
              onChange={(e) => handleConfigChange(key, e.target.checked)}
            />
            <label htmlFor={key}>{option.label}</label>
          </div>
        );
      
      case 'color':
        return (
          <div className="control-group" key={key}>
            <label htmlFor={key}>{option.label}</label>
            <input
              type="color"
              id={key}
              value={config[key] || option.default || '#000000'}
              onChange={(e) => handleConfigChange(key, e.target.value)}
            />
          </div>
        );
      
      case 'colorPalette':
        return (
          <div className="control-group" key={key}>
            <label>{option.label}</label>
            <div className="color-palette">
              {(config[key] || option.default || []).map((color, index) => (
                <input
                  key={index}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newPalette = [...(config[key] || option.default)];
                    newPalette[index] = e.target.value;
                    handleConfigChange(key, newPalette);
                  }}
                />
              ))}
            </div>
          </div>
        );
      
      case 'group':
        return (
          <div className="control-section" key={key}>
            <h3>{option.label}</h3>
            {Object.entries(option.options).map(([subKey, subOption]) => (
              <div className="control-group" key={subKey}>
                <label htmlFor={subKey}>{subOption.label}</label>
                {subOption.type === 'number' ? (
                  <input
                    type="number"
                    id={subKey}
                    value={config[subKey] || subOption.default || 0}
                    min={subOption.min}
                    max={subOption.max}
                    step={subOption.step || 1}
                    onChange={(e) => handleConfigChange(subKey, parseFloat(e.target.value))}
                  />
                ) : subOption.type === 'select' ? (
                  <select
                    id={subKey}
                    value={config[subKey] || subOption.default || ''}
                    onChange={(e) => handleConfigChange(subKey, e.target.value)}
                  >
                    {subOption.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id={subKey}
                    value={config[subKey] || subOption.default || ''}
                    onChange={(e) => handleConfigChange(subKey, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Group options by category for tabs
  const getOptionsForTab = (tab) => {
    if (!initialConfig) return [];
    
    const options = Object.entries(initialConfig).filter(([key, option]) => {
      if (tab === 'appearance') {
        return ['title', 'colors', 'theme', 'fonts', 'fontSize', 'fontFamily'].includes(key);
      } else if (tab === 'layout') {
        return ['width', 'height', 'legend', 'showLegend', 'xAxisLabel', 'yAxisLabel', 'orientation'].includes(key);
      } else if (tab === 'data') {
        return ['donut', 'showPercentage', 'barWidth', 'groupMode', 'pThreshold', 'fcThreshold'].includes(key);
      }
      return false;
    });
    
    return options;
  };

  return (
    <div className="customization-page">
      <div className="customization-container">
        <div className="preview-panel">
          <h2>Preview</h2>
          <div className="preview-container">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : previewUrl ? (
              <img 
                src={previewUrl} 
                alt={`Preview of ${plotType} plot`} 
                className="plot-preview" 
              />
            ) : (
              <div className="no-preview">
                <p>No preview available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="options-panel">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button 
              className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => setActiveTab('layout')}
            >
              Layout
            </button>
            <button 
              className={`tab ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              Data Options
            </button>
            <button 
              className={`tab ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'export' ? (
              <div className="export-options">
                <h3>Export Options</h3>
                
                <div className="control-group">
                  <label htmlFor="export-format">Format</label>
                  <select
                    id="export-format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="png">PNG Image</option>
                    <option value="svg">SVG Vector</option>
                    <option value="pdf">PDF Document</option>
                    <option value="html">Interactive HTML</option>
                    <option value="csv">CSV Data</option>
                  </select>
                </div>
                
                <div className="control-section">
                  <h3>Dimensions</h3>
                  <div className="control-group">
                    <label htmlFor="export-width">Width (px)</label>
                    <input
                      type="number"
                      id="export-width"
                      value={exportDimensions.width}
                      min={300}
                      max={3000}
                      step={50}
                      onChange={(e) => handleDimensionChange('width', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="control-group">
                    <label htmlFor="export-height">Height (px)</label>
                    <input
                      type="number"
                      id="export-height"
                      value={exportDimensions.height}
                      min={200}
                      max={2000}
                      step={50}
                      onChange={(e) => handleDimensionChange('height', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="control-section">
                  <h3>Additional Options</h3>
                  <div className="control-group checkbox">
                    <input
                      type="checkbox"
                      id="include-title"
                      checked={exportOptions.includeTitle}
                      onChange={(e) => handleExportOptionChange('includeTitle', e.target.checked)}
                    />
                    <label htmlFor="include-title">Include Title</label>
                  </div>
                  <div className="control-group checkbox">
                    <input
                      type="checkbox"
                      id="include-legend"
                      checked={exportOptions.includeLegend}
                      onChange={(e) => handleExportOptionChange('includeLegend', e.target.checked)}
                    />
                    <label htmlFor="include-legend">Include Legend</label>
                  </div>
                  <div className="control-group checkbox">
                    <input
                      type="checkbox"
                      id="transparent-bg"
                      checked={exportOptions.transparent}
                      onChange={(e) => handleExportOptionChange('transparent', e.target.checked)}
                    />
                    <label htmlFor="transparent-bg">Transparent Background</label>
                  </div>
                  <div className="control-group checkbox">
                    <input
                      type="checkbox"
                      id="high-resolution"
                      checked={exportOptions.highResolution}
                      onChange={(e) => handleExportOptionChange('highResolution', e.target.checked)}
                    />
                    <label htmlFor="high-resolution">High Resolution (2x)</label>
                  </div>
                </div>
                
                <button 
                  className="export-button"
                  onClick={handleExport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
                </button>
              </div>
            ) : (
              <div className="customization-options">
                {getOptionsForTab(activeTab).map(([key, option]) => renderControl(option, key))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationPage;
