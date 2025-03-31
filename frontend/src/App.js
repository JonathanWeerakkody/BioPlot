import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import Section from './components/Section';
import DataLoader from './components/DataLoader';
import ChartSelector from './components/ChartSelector';
import ChartCustomizer from './components/ChartCustomizer';
import ChartPreview from './components/ChartPreview';
import Footer from './components/Footer';
import { getModulesFormat } from './components/GraphRegistry';

function App() {
  const [data, setData] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentChart, setCurrentChart] = useState(null);
  const [chartOptions, setChartOptions] = useState({});
  const [generatedChart, setGeneratedChart] = useState(null);
  
  // Initialize modules from GraphRegistry
  useEffect(() => {
    const modulesData = getModulesFormat();
    setModules(modulesData);
  }, []);

  const handleDataLoaded = (loadedData, source) => {
    setData(loadedData);
    setDataSource(source);
  };

  const handleChartSelect = (chart) => {
    setCurrentChart(chart);
    setChartOptions({}); // Reset options when chart changes
    setGeneratedChart(null);
  };

  const handleOptionsChange = (newOptions) => {
    setChartOptions(newOptions);
  };

  const handleChartGenerated = (chartData) => {
    setGeneratedChart(chartData);
  };

  return (
    <div className="App">
      <Header />
      <div className="app-sections">
        <Section title="1. Load your data">
          <DataLoader onDataLoaded={handleDataLoaded} />
        </Section>
        
        {data && (
          <Section title="2. Choose a chart">
            <ChartSelector 
              modules={modules} 
              onSelectChart={handleChartSelect} 
              currentChart={currentChart}
            />
          </Section>
        )}
        
        {data && currentChart && (
          <Section title="3. Customize">
            <ChartCustomizer 
              chart={currentChart} 
              data={data}
              options={chartOptions}
              onOptionsChange={handleOptionsChange}
            />
          </Section>
        )}
        
        {data && currentChart && (
          <Section title="4. Preview & Export">
            <ChartPreview 
              chart={currentChart}
              data={data}
              options={chartOptions}
              onChartGenerated={handleChartGenerated}
              generatedChart={generatedChart}
            />
          </Section>
        )}
        
        <Footer />
      </div>
    </div>
  );
}

export default App;
