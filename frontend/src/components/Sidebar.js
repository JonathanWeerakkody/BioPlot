import { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({ modules, loading, onPlotSelect, onNavigation, activePage, activePlot }) => {
  const [expandedModules, setExpandedModules] = useState({});

  // Initialize expanded state when modules are loaded
  useEffect(() => {
    if (modules.length > 0) {
      const initialExpandedState = {};
      modules.forEach(module => {
        initialExpandedState[module.id] = false;
      });
      
      // If there's an active plot, expand its module
      if (activePlot && activePlot.module) {
        initialExpandedState[activePlot.module.id] = true;
      }
      
      setExpandedModules(initialExpandedState);
    }
  }, [modules, activePlot]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Plot Types</h2>
        </div>
        <div className="sidebar-loading">
          <div className="spinner"></div>
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Plot Types</h2>
      </div>
      <nav className="sidebar-nav">
        <ul className="module-list">
          {modules.map(module => (
            <li key={module.id} className="module-item">
              <div 
                className={`module-header ${expandedModules[module.id] ? 'expanded' : ''}`}
                onClick={() => toggleModule(module.id)}
              >
                <span className="module-name">{module.name}</span>
                <span className="expand-icon">
                  {expandedModules[module.id] ? '−' : '+'}
                </span>
              </div>
              
              {expandedModules[module.id] && (
                <ul className="plot-list">
                  {module.plots.map(plot => (
                    <li key={plot.id} className="plot-item">
                      <a 
                        href={`/plot/${module.id}/${plot.id}`}
                        className="plot-link"
                        aria-label={`View ${plot.name} plot`}
                        onClick={(e) => {
                          e.preventDefault();
                          onPlotSelect(module.id, plot.id);
                        }}
                      >
                        {plot.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <a 
          href="/about" 
          className="about-link"
          aria-label="About SRplot application"
          onClick={(e) => {
            e.preventDefault();
            onNavigation('about');
          }}
        >
          About SRplot
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
