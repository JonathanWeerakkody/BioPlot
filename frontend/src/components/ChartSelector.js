import React from 'react';

function ChartSelector({ modules, onSelectChart, currentChart }) {
  if (!modules || modules.length === 0) {
    return <div>Loading available charts...</div>;
  }

  return (
    <div>
      <div className="chart-grid">
        {modules.flatMap(module => 
          module.plots.map(plot => (
            <div 
              key={plot.id}
              className={`chart-card ${currentChart && currentChart.id === plot.id ? 'active' : ''}`}
              onClick={() => onSelectChart(plot)}
            >
              <div className="chart-card-header">
                <h3 className="chart-card-title">{plot.name}</h3>
                <p className="chart-card-category">{module.name}</p>
              </div>
              <div className="chart-card-body">
                <p>Click to select this chart type</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChartSelector;
