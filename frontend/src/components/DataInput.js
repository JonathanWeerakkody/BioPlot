import React, { useState, useEffect } from 'react';
import { useApi, getSampleData } from '../services/ApiService';
import './DataInput.css';

const DataInput = ({ onSubmit, onLoadSample, plotType, loading }) => {
  const [inputMethod, setInputMethod] = useState('paste');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState(null);
  const [delimiter, setDelimiter] = useState('tab');
  const [hasHeader, setHasHeader] = useState(true);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState(null);
  
  // API hooks
  const sampleDataApi = useApi(getSampleData);

  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
    
    // Generate preview data
    try {
      const parsedData = parseTextData(e.target.value, delimiter, hasHeader);
      setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows
      setError(null);
    } catch (err) {
      setError('Error parsing data: ' + err.message);
      setPreviewData([]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        setTextInput(content);
        
        // Generate preview data
        try {
          const parsedData = parseTextData(content, delimiter, hasHeader);
          setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows
          setError(null);
        } catch (err) {
          setError('Error parsing file: ' + err.message);
          setPreviewData([]);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const parseTextData = (text, delim, header) => {
    if (!text.trim()) {
      return [];
    }
    
    // Determine the actual delimiter
    const delimChar = delim === 'tab' ? '\t' : delim === 'comma' ? ',' : delim === 'space' ? ' ' : '\t';
    
    // Split into lines
    const lines = text.trim().split('\n');
    if (lines.length === 0) {
      return [];
    }
    
    // Parse header if present
    let headerRow = [];
    let dataStartIndex = 0;
    
    if (header && lines.length > 0) {
      headerRow = lines[0].split(delimChar).map(h => h.trim());
      dataStartIndex = 1;
    } else {
      // Generate column names (Column1, Column2, etc.)
      const firstRow = lines[0].split(delimChar);
      headerRow = Array.from({ length: firstRow.length }, (_, i) => `Column${i + 1}`);
    }
    
    // Parse data rows
    const parsedData = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(delimChar);
      const rowData = {};
      
      // Map values to column names
      headerRow.forEach((colName, index) => {
        if (index < values.length) {
          // Try to convert to number if possible
          const value = values[index].trim();
          const numValue = Number(value);
          rowData[colName] = isNaN(numValue) ? value : numValue;
        } else {
          rowData[colName] = '';
        }
      });
      
      parsedData.push(rowData);
    }
    
    return parsedData;
  };

  const handleSubmit = () => {
    try {
      const parsedData = parseTextData(textInput, delimiter, hasHeader);
      if (parsedData.length === 0) {
        setError('No data to submit');
        return;
      }
      onSubmit(parsedData);
      setError(null);
    } catch (err) {
      setError('Error submitting data: ' + err.message);
    }
  };

  const handleLoadSample = async () => {
    try {
      await onLoadSample();
    } catch (err) {
      setError('Error loading sample data: ' + err.message);
    }
  };

  return (
    <div className="data-input">
      <div className="input-methods">
        <button 
          className={`method-button ${inputMethod === 'paste' ? 'active' : ''}`}
          onClick={() => setInputMethod('paste')}
        >
          Paste Data
        </button>
        <button 
          className={`method-button ${inputMethod === 'upload' ? 'active' : ''}`}
          onClick={() => setInputMethod('upload')}
        >
          Upload File
        </button>
        <button 
          className="method-button sample-button"
          onClick={handleLoadSample}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load Sample Data'}
        </button>
      </div>
      
      <div className="input-container">
        {inputMethod === 'paste' ? (
          <textarea
            className="data-textarea"
            placeholder={`Paste your data here (${delimiter === 'tab' ? 'tab' : delimiter}-separated values)`}
            value={textInput}
            onChange={handleTextInputChange}
          />
        ) : (
          <div className="file-upload">
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
            />
            <p className="file-name">{file ? file.name : 'No file selected'}</p>
          </div>
        )}
      </div>
      
      <div className="input-options">
        <div className="option">
          <label>Delimiter:</label>
          <select 
            value={delimiter} 
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value="tab">Tab</option>
            <option value="comma">Comma</option>
            <option value="space">Space</option>
            <option value="semicolon">Semicolon</option>
          </select>
        </div>
        
        <div className="option">
          <label>
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            First row is header
          </label>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {sampleDataApi.error && <div className="error-message">{sampleDataApi.error}</div>}
      
      {previewData.length > 0 && (
        <div className="data-preview">
          <h3>Data Preview</h3>
          <div className="preview-table-container">
            <table className="preview-table">
              <thead>
                <tr>
                  {Object.keys(previewData[0]).map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="preview-note">Showing first {previewData.length} rows</p>
        </div>
      )}
      
      <div className="input-actions">
        <button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={previewData.length === 0 || loading}
        >
          Next: Customize Plot
        </button>
      </div>
    </div>
  );
};

export default DataInput;
