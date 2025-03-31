import { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlotBuilder from './components/PlotBuilder';
import About from './components/About';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import GraphRegistryManager from './components/GraphRegistry';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activePlot, setActivePlot] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch modules from API
    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/modules`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setModules(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching modules:', err);
        setError('Failed to load modules. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handlePlotSelect = (moduleId, plotId) => {
    const selectedModule = modules.find(m => m.id === moduleId);
    if (selectedModule) {
      const selectedPlot = selectedModule.plots.find(p => p.id === plotId);
      if (selectedPlot) {
        setActivePlot({
          id: selectedPlot.id,
          name: selectedPlot.name,
          module: {
            id: selectedModule.id,
            name: selectedModule.name
          }
        });
        setActivePage('plot-builder');
      }
    }
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    if (page === 'dashboard') {
      setActivePlot(null);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <LandingPage 
              modules={modules} 
              loading={loading}
              error={error}
              onPlotSelect={handlePlotSelect}
            />
          </ErrorBoundary>
        );
      case 'plot-builder':
        return (
          <ErrorBoundary>
            <PlotBuilder 
              plot={activePlot}
              onBack={() => handleNavigation('dashboard')}
            />
          </ErrorBoundary>
        );
      case 'about':
        return (
          <ErrorBoundary>
            <About />
          </ErrorBoundary>
        );
      case 'graph-registry':
        return (
          <ErrorBoundary>
            <GraphRegistryManager />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <LandingPage 
              modules={modules} 
              loading={loading}
              error={error}
              onPlotSelect={handlePlotSelect}
            />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="app">
      <Header onNavigation={handleNavigation} />
      <div className="main-container">
        <Sidebar 
          modules={modules} 
          loading={loading}
          onPlotSelect={handlePlotSelect}
          onNavigation={handleNavigation}
          activePage={activePage}
          activePlot={activePlot}
        />
        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
