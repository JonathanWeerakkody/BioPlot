import React, { useState, useEffect } from 'react';
import './DataValidation.css';

// Validation rules for different plot types
const validationRules = {
  Pie_Plot: {
    requiredColumns: 2,
    columnTypes: {
      0: ['string'], // First column should be string (category)
      1: ['number']  // Second column should be number (value)
    },
    minRows: 2,
    maxRows: 20,
    validate: (data) => {
      // Check if all values are positive
      const hasNegative = data.some(row => {
        const values = Object.values(row);
        return values[1] < 0;
      });
      
      if (hasNegative) {
        return { valid: false, message: 'Pie charts cannot contain negative values' };
      }
      
      return { valid: true };
    }
  },
  
  Bar_Plot: {
    requiredColumns: 2,
    columnTypes: {
      0: ['string'], // First column should be string (category)
      1: ['number']  // Second column should be number (value)
    },
    minRows: 2,
    maxRows: 50,
    validate: () => ({ valid: true })
  },
  
  Volcano_Plot: {
    requiredColumns: 3,
    columnTypes: {
      0: ['string'], // First column should be string (gene name)
      1: ['number'], // Second column should be number (log2FC)
      2: ['number']  // Third column should be number (p-value)
    },
    minRows: 5,
    validate: (data) => {
      // Check if p-values are between 0 and 1
      const invalidPValues = data.some(row => {
        const values = Object.values(row);
        return values[2] < 0 || values[2] > 1;
      });
      
      if (invalidPValues) {
        return { valid: false, message: 'P-values must be between 0 and 1' };
      }
      
      return { valid: true };
    }
  },
  
  KM_Plot: {
    requiredColumns: 2,
    columnTypes: {
      0: ['number'], // First column should be number (time)
      1: ['number']  // Second column should be number (status)
    },
    minRows: 5,
    validate: (data) => {
      // Check if status values are valid (typically 0/1 or 1/2)
      const validStatus = data.every(row => {
        const values = Object.values(row);
        return values[1] === 0 || values[1] === 1 || values[1] === 2;
      });
      
      if (!validStatus) {
        return { 
          valid: false, 
          message: 'Status values should be 0/1 (0=alive, 1=dead) or 1/2 (1=alive, 2=dead)' 
        };
      }
      
      // Check if time values are positive
      const hasNegativeTime = data.some(row => {
        const values = Object.values(row);
        return values[0] < 0;
      });
      
      if (hasNegativeTime) {
        return { valid: false, message: 'Time values cannot be negative' };
      }
      
      return { valid: true };
    }
  },
  
  ROC_Curve: {
    requiredColumns: 3,
    columnTypes: {
      0: ['string'], // First column should be string (sample)
      1: ['string'], // Second column should be string (class)
      2: ['number']  // Third column should be number (value)
    },
    minRows: 5,
    validate: () => ({ valid: true })
  }
};

const DataValidation = ({ data, plotType, onValidationComplete }) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    if (data && data.length > 0 && plotType) {
      validateData();
    }
  }, [data, plotType]);

  const validateData = () => {
    setIsValidating(true);
    setValidationErrors([]);
    
    // Get validation rules for the selected plot type
    const rules = validationRules[plotType];
    if (!rules) {
      setValidationResult({ valid: true, message: 'No specific validation rules for this plot type' });
      setIsValidating(false);
      onValidationComplete(true);
      return;
    }
    
    const errors = [];
    
    // Check number of columns
    const firstRow = data[0];
    const columnCount = Object.keys(firstRow).length;
    
    if (columnCount < rules.requiredColumns) {
      errors.push(`This plot type requires at least ${rules.requiredColumns} columns, but found ${columnCount}`);
    }
    
    // Check number of rows
    if (rules.minRows && data.length < rules.minRows) {
      errors.push(`This plot type requires at least ${rules.minRows} data rows, but found ${data.length}`);
    }
    
    if (rules.maxRows && data.length > rules.maxRows) {
      errors.push(`This plot type supports a maximum of ${rules.maxRows} data rows, but found ${data.length}`);
    }
    
    // Check column types if we have enough columns
    if (columnCount >= rules.requiredColumns && rules.columnTypes) {
      const columns = Object.keys(firstRow);
      
      for (let i = 0; i < rules.requiredColumns; i++) {
        const expectedTypes = rules.columnTypes[i];
        const columnName = columns[i];
        
        // Check data type of this column across all rows
        const invalidRows = data.filter(row => {
          const value = row[columnName];
          const valueType = typeof value;
          
          // Check if the value type matches any of the expected types
          return !expectedTypes.some(type => {
            if (type === 'number') return valueType === 'number' && !isNaN(value);
            if (type === 'string') return valueType === 'string';
            return false;
          });
        });
        
        if (invalidRows.length > 0) {
          const expectedTypeStr = expectedTypes.join(' or ');
          errors.push(`Column "${columnName}" should contain ${expectedTypeStr} values, but found ${invalidRows.length} invalid rows`);
        }
      }
    }
    
    // Run custom validation function if available
    if (rules.validate) {
      const customValidation = rules.validate(data);
      if (!customValidation.valid) {
        errors.push(customValidation.message);
      }
    }
    
    // Set validation result
    const isValid = errors.length === 0;
    setValidationErrors(errors);
    setValidationResult({ 
      valid: isValid, 
      message: isValid ? 'Data is valid for this plot type' : 'Data validation failed'
    });
    setIsValidating(false);
    
    // Notify parent component
    onValidationComplete(isValid);
  };

  if (!data || data.length === 0 || !plotType) {
    return null;
  }

  return (
    <div className="data-validation">
      {isValidating ? (
        <div className="validating-message">
          <div className="spinner"></div>
          <p>Validating data...</p>
        </div>
      ) : validationResult && (
        <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
          <div className="validation-icon">
            {validationResult.valid ? '✓' : '✗'}
          </div>
          <div className="validation-message">
            <p>{validationResult.message}</p>
            
            {validationErrors.length > 0 && (
              <ul className="validation-errors">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataValidation;
