import React from 'react';
import './Dashboard.css';

const Dashboard = ({ modules, loading, error, onPlotSelect }) => {
  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading plot modules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">
          <h3>Error Loading Modules</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="welcome-section">
        <div className="card">
          <h2>Welcome to SRplot</h2>
          <p>
            SRplot is a comprehensive scientific visualization platform designed to create high-quality, 
            publication-ready plots for various types of scientific data.
          </p>
          <p>
            Select a plot type from the sidebar or explore the featured plots below to get started.
          </p>
        </div>
      </section>

      <section className="featured-plots">
        <h2 className="section-title">Featured Plot Types</h2>
        <div className="plot-grid">
          {modules.slice(0, 3).map(module => (
            module.plots.slice(0, 2).map(plot => (
              <div className="plot-card" key={`${module.id}-${plot.id}`}>
                <h3>{plot.name}</h3>
                <p>From {module.name}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => onPlotSelect(module.id, plot.id)}
                >
                  Create Plot
                </button>
              </div>
            ))
          ))}
        </div>
      </section>

      <section className="getting-started">
        <h2 className="section-title">Getting Started</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Select a Plot Type</h3>
            <p>Choose from various plot types organized by scientific domain in the sidebar.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Input Your Data</h3>
            <p>Paste your data, upload a file, or use our sample datasets.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Customize Your Plot</h3>
            <p>Adjust colors, sizes, labels, and other visual elements to your preference.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Export Your Results</h3>
            <p>Download your plot in various formats including PNG, SVG, PDF, and more.</p>
          </div>
        </div>
      </section>

      <section className="all-modules">
        <h2 className="section-title">All Plot Modules</h2>
        <div className="modules-grid">
          {modules.map(module => (
            <div className="module-card" key={module.id}>
              <h3>{module.name}</h3>
              <p>{module.plots.length} plot types</p>
              <ul className="module-plots-list">
                {module.plots.slice(0, 3).map(plot => (
                  <li key={plot.id}>
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        onPlotSelect(module.id, plot.id);
                      }}
                    >
                      {plot.name}
                    </a>
                  </li>
                ))}
                {module.plots.length > 3 && (
                  <li className="more-plots">
                    +{module.plots.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
