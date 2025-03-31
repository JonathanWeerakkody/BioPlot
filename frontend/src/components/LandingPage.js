import { useState, useEffect } from 'react';
import './LandingPage.css';

const LandingPage = ({ modules, loading, error, onPlotSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState([]);

  useEffect(() => {
    if (modules && modules.length > 0) {
      setFilteredModules(modules);
    }
  }, [modules]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredModules(modules);
      return;
    }
    
    const filtered = modules.map(module => {
      // Check if module name matches
      const moduleMatches = module.name.toLowerCase().includes(term);
      
      // Filter plots within the module
      const filteredPlots = module.plots.filter(plot => 
        plot.name.toLowerCase().includes(term) || 
        (plot.description && plot.description.toLowerCase().includes(term))
      );
      
      // If module name matches or it has matching plots, include it
      if (moduleMatches || filteredPlots.length > 0) {
        return {
          ...module,
          plots: moduleMatches ? module.plots : filteredPlots
        };
      }
      
      return null;
    }).filter(Boolean);
    
    setFilteredModules(filtered);
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-header">
          <h1>Welcome to SRplot</h1>
          <p className="subtitle">Scientific Visualization Platform</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading graph modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="landing-header">
          <h1>Welcome to SRplot</h1>
          <p className="subtitle">Scientific Visualization Platform</p>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1>Welcome to SRplot</h1>
        <p className="subtitle">Scientific Visualization Platform</p>
        <p className="description">
          Create beautiful scientific visualizations with just a few clicks. 
          Choose from a variety of plot types below to get started.
        </p>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for plots..."
          value={searchTerm}
          onChange={handleSearch}
          aria-label="Search for plots"
        />
      </div>
      
      <div className="modules-grid">
        {filteredModules.length === 0 ? (
          <div className="no-results">
            <p>No plots found matching "{searchTerm}"</p>
          </div>
        ) : (
          filteredModules.map(module => (
            <div key={module.id} className="module-card">
              <h2 className="module-title">{module.name}</h2>
              <div className="plots-grid">
                {module.plots.map(plot => (
                  <div 
                    key={plot.id} 
                    className="plot-card"
                    onClick={() => onPlotSelect(module.id, plot.id)}
                    tabIndex="0"
                    role="button"
                    aria-label={`Select ${plot.name} plot`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPlotSelect(module.id, plot.id);
                      }
                    }}
                  >
                    <div className="plot-icon">
                      {plot.icon || getDefaultIcon(plot.name)}
                    </div>
                    <h3 className="plot-name">{plot.name}</h3>
                    {plot.description && (
                      <p className="plot-description">{plot.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to get default icon based on plot name
const getDefaultIcon = (plotName) => {
  const name = plotName.toLowerCase();
  
  if (name.includes('bar')) return '📊';
  if (name.includes('pie')) return '🥧';
  if (name.includes('scatter')) return '⚬';
  if (name.includes('line')) return '📈';
  if (name.includes('volcano')) return '🌋';
  if (name.includes('heat')) return '🔥';
  if (name.includes('box')) return '📦';
  if (name.includes('violin')) return '🎻';
  if (name.includes('roc')) return '↗️';
  if (name.includes('km') || name.includes('kaplan')) return '📉';
  
  return '📊'; // Default icon
};

export default LandingPage;
