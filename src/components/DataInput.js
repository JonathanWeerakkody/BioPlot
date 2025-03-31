import React, { useState } from 'react';
import './DataInput.css';

function DataInput({ onDataChange }) {
  const [inputMethod, setInputMethod] = useState('paste');
  const [textData, setTextData] = useState('');
  const [sampleSelected, setSampleSelected] = useState(false);

  const handleTextChange = (e) => {
    setTextData(e.target.value);
  };

  const handleSubmit = () => {
    if (!textData.trim()) return;
    
    try {
      // Parse the input data
      const lines = textData.trim().split('\n');
      const genes = [];
      const values = [];
      
      lines.forEach(line => {
        const [gene, value] = line.split('\t');
        if (gene && value && !isNaN(parseFloat(value))) {
          genes.push(gene);
          values.push(parseFloat(value));
        }
      });
      
      if (genes.length > 0 && values.length > 0) {
        onDataChange({ genes, values });
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      alert('Error parsing data. Please check the format and try again.');
    }
  };

  const loadSampleData = () => {
    const sampleData = 
`BRCA1\t2.5
TP53\t4.2
EGFR\t3.7
KRAS\t1.8
PTEN\t0.9
MYC\t5.1
VEGFA\t2.3
IL6\t3.0
TNF\t1.5
GAPDH\t1.0`;
    
    setTextData(sampleData);
    setSampleSelected(true);
  };

  return (
    <div className="data-input">
      <div className="input-tabs">
        <button 
          className={inputMethod === 'paste' ? 'active' : ''} 
          onClick={() => setInputMethod('paste')}
        >
          Paste Data
        </button>
        <button 
          className={inputMethod === 'upload' ? 'active' : ''} 
          onClick={() => setInputMethod('upload')}
        >
          Upload File
        </button>
      </div>
      
      <div className="input-content">
        {inputMethod === 'paste' && (
          <div className="paste-input">
            <div className="form-group">
              <label htmlFor="data-textarea">
                Paste your gene expression data (gene name and expression value, tab-separated):
              </label>
              <textarea 
                id="data-textarea"
                rows="10"
                value={textData}
                onChange={handleTextChange}
                placeholder="Example:&#10;BRCA1&#9;2.5&#10;TP53&#9;4.2&#10;EGFR&#9;3.7"
              />
            </div>
            <div className="input-actions">
              <button onClick={loadSampleData}>
                {sampleSelected ? 'Sample Data Loaded' : 'Load Sample Data'}
              </button>
              <button onClick={handleSubmit} className="primary-button">
                Visualize Data
              </button>
            </div>
          </div>
        )}
        
        {inputMethod === 'upload' && (
          <div className="file-input">
            <p>Upload a tab-separated (TSV) or comma-separated (CSV) file with gene names and expression values.</p>
            <input type="file" accept=".tsv,.csv,.txt" />
            <p className="note">
              Note: File upload functionality will be implemented in a future update. 
              Please use the Paste Data option for now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataInput;
