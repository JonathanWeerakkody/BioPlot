import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import DataInput from './components/DataInput';
import BarChartModule from './components/BarChartModule';
import Footer from './components/Footer';

function App() {
  const [data, setData] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    title: 'Gene Expression Bar Chart',
    xAxisLabel: 'Genes',
    yAxisLabel: 'Expression Level',
    barColor: '#4285F4',
    showValues: true,
    sortBars: false
  });

  const handleDataChange = (newData) => {
    setData(newData);
  };

  const handleOptionsChange = (newOptions) => {
    setChartOptions({...chartOptions, ...newOptions});
  };

  return (
    <div className="App">
      <Header />
      <main className="app-content">
        <section className="app-section">
          <h2>1. Input Data</h2>
          <DataInput onDataChange={handleDataChange} />
        </section>
        
        {data && (
          <section className="app-section">
            <h2>2. Customize & Preview</h2>
            <BarChartModule 
              data={data} 
              options={chartOptions} 
              onOptionsChange={handleOptionsChange} 
            />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
