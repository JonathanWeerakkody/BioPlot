import React from 'react';
import './CustomizationPanel.css';

const CustomizationPanel = ({ options, config, onChange }) => {
  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  const renderOption = (key, option) => {
    if (option.type === 'group') {
      return (
        <div key={key} className="option-group">
          <h3 className="group-title">{option.label}</h3>
          <div className="group-options">
            {Object.entries(option.options).map(([subKey, subOption]) => 
              renderOption(subKey, subOption)
            )}
          </div>
        </div>
      );
    }

    switch (option.type) {
      case 'text':
        return (
          <div key={key} className="option-item">
            <label htmlFor={key}>{option.label}</label>
            <input
              id={key}
              type="text"
              value={config[key] || option.default}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={key} className="option-item">
            <label htmlFor={key}>{option.label}</label>
            <div className="number-input-container">
              <input
                id={key}
                type="number"
                min={option.min}
                max={option.max}
                step={option.step}
                value={config[key] || option.default}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              />
              {option.min !== undefined && option.max !== undefined && (
                <div className="range-slider">
                  <input
                    type="range"
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    value={config[key] || option.default}
                    onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>
        );
      
      case 'boolean':
        return (
          <div key={key} className="option-item checkbox-item">
            <label htmlFor={key}>
              <input
                id={key}
                type="checkbox"
                checked={config[key] || option.default}
                onChange={(e) => handleChange(key, e.target.checked)}
              />
              {option.label}
            </label>
          </div>
        );
      
      case 'select':
        return (
          <div key={key} className="option-item">
            <label htmlFor={key}>{option.label}</label>
            <select
              id={key}
              value={config[key] || option.default}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              {option.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'color':
        return (
          <div key={key} className="option-item">
            <label htmlFor={key}>{option.label}</label>
            <div className="color-picker">
              <input
                id={key}
                type="color"
                value={config[key] || option.default}
                onChange={(e) => handleChange(key, e.target.value)}
              />
              <span className="color-value">{config[key] || option.default}</span>
            </div>
          </div>
        );
      
      case 'colorPalette':
        return (
          <div key={key} className="option-item color-palette-item">
            <label>{option.label}</label>
            <div className="color-palette">
              {(config[key] || option.default).map((color, index) => (
                <div key={index} className="palette-color">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...(config[key] || option.default)];
                      newColors[index] = e.target.value;
                      handleChange(key, newColors);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="palette-presets">
              <button onClick={() => handleChange(key, ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01', '#46BDC6'])}>
                Default
              </button>
              <button onClick={() => handleChange(key, ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'])}>
                Viridis
              </button>
              <button onClick={() => handleChange(key, ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'])}>
                Tableau
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="customization-panel">
      <h3>Customize Plot</h3>
      <div className="options-container">
        {Object.entries(options).map(([key, option]) => renderOption(key, option))}
      </div>
    </div>
  );
};

export default CustomizationPanel;
