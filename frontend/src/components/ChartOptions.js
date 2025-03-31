import React, { useState, useEffect } from 'react';
import { getGraphById } from './GraphRegistry';

function ChartOptions({ chartId, options, onChange }) {
  const [chartOptions, setChartOptions] = useState(options || {});
  const [chartDefinition, setChartDefinition] = useState(null);
  
  useEffect(() => {
    if (chartId) {
      const graph = getGraphById(chartId);
      setChartDefinition(graph);
      
      // Initialize with default values if not already set
      if (graph && graph.options) {
        const defaultValues = {};
        graph.options.forEach(option => {
          if (!(option.id in chartOptions)) {
            defaultValues[option.id] = option.default;
          }
        });
        
        if (Object.keys(defaultValues).length > 0) {
          const newOptions = { ...chartOptions, ...defaultValues };
          setChartOptions(newOptions);
          onChange(newOptions);
        }
      }
    }
  }, [chartId]);
  
  const handleOptionChange = (optionId, value) => {
    const updatedOptions = { ...chartOptions, [optionId]: value };
    setChartOptions(updatedOptions);
    onChange(updatedOptions);
  };
  
  if (!chartDefinition) {
    return <div>Loading chart options...</div>;
  }
  
  return (
    <div className="chart-options">
      <h3>Chart Options</h3>
      
      {chartDefinition.options && chartDefinition.options.map(option => (
        <div className="form-group mb-3" key={option.id}>
          <label htmlFor={`option-${option.id}`}>{option.name}</label>
          
          {option.type === 'text' && (
            <input
              type="text"
              id={`option-${option.id}`}
              className="form-control"
              value={chartOptions[option.id] || ''}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
            />
          )}
          
          {option.type === 'number' && (
            <input
              type="number"
              id={`option-${option.id}`}
              className="form-control"
              value={chartOptions[option.id] || 0}
              onChange={(e) => handleOptionChange(option.id, parseInt(e.target.value, 10))}
              min={option.min}
              max={option.max}
              step={option.step || 1}
            />
          )}
          
          {option.type === 'boolean' && (
            <div className="form-check">
              <input
                type="checkbox"
                id={`option-${option.id}`}
                className="form-check-input"
                checked={!!chartOptions[option.id]}
                onChange={(e) => handleOptionChange(option.id, e.target.checked)}
              />
            </div>
          )}
          
          {option.type === 'color' && (
            <input
              type="color"
              id={`option-${option.id}`}
              className="form-control form-control-color"
              value={chartOptions[option.id] || '#000000'}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
            />
          )}
          
          {option.type === 'select' && (
            <select
              id={`option-${option.id}`}
              className="form-control"
              value={chartOptions[option.id] || option.default}
              onChange={(e) => handleOptionChange(option.id, e.target.value)}
            >
              {option.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChartOptions;
