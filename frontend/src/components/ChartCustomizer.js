import React, { useState } from 'react';
import ChartOptions from './ChartOptions';

function ChartCustomizer({ chart, data, options, onOptionsChange }) {
  const [localOptions, setLocalOptions] = useState(options || {});
  
  const handleOptionsChange = (updatedOptions) => {
    setLocalOptions(updatedOptions);
    onOptionsChange(updatedOptions);
  };
  
  if (!chart) {
    return <div>Please select a chart first</div>;
  }
  
  return (
    <div className="customizer-grid">
      <div className="options-panel">
        <ChartOptions 
          chartId={chart.id}
          options={localOptions}
          onChange={handleOptionsChange}
        />
      </div>
      
      <div className="preview-panel">
        <p>Adjust options to customize your chart</p>
        <div className="options-summary">
          <p><strong>Selected Chart:</strong> {chart.name}</p>
          {localOptions.title && <p><strong>Title:</strong> {localOptions.title}</p>}
          {localOptions.width && localOptions.height && (
            <p><strong>Dimensions:</strong> {localOptions.width} x {localOptions.height}px</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChartCustomizer;
