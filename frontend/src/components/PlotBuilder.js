import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './PlotBuilder.css';

// Components
import DataInput from './DataInput';
import PlotPreview from './PlotPreview';
import CustomizationPage from './CustomizationPage';
import ExportOptions from './ExportOptions';
import DataValidation from './DataValidation';

// API Services
import { getSampleData, validateData, generatePlot, useApi } from '../services/ApiService';

const PlotBuilder = () => {
  const { moduleId, plotType } = useParams();
  
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [customizationOptions, setCustomizationOptions] = useState({});
  const [plotConfig, setPlotConfig] = useState({
    title: '',
    width: 800,
    height: 600,
    colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01', '#46BDC6'],
    fontSize: 12,
    showLegend: true,
    xAxisLabel: '',
    yAxisLabel: '',
    theme: 'light',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState('input'); // input, customize, export
  const [isDataValid, setIsDataValid] = useState(false);

  // API hooks
  const sampleDataApi = useApi(getSampleData);
  const validateDataApi = useApi(validateData);
  const generatePlotApi = useApi(generatePlot);

  useEffect(() => {
    // Fetch plot-specific customization options
    const fetchCustomizationOptions = async () => {
      try {
        // In production, this would be a real API call
        // For now, we'll use mock data based on plot type
        const plotTypeDisplay = plotType ? plotType.replace('_', ' ') : '';
        let options = {
          title: {
            type: 'text',
            label: 'Plot Title',
            default: `${plotTypeDisplay} Plot`
          },
          dimensions: {
            type: 'group',
            label: 'Dimensions',
            options: {
              width: {
                type: 'number',
                label: 'Width (px)',
                min: 400,
                max: 1200,
                step: 50,
                default: 800
              },
              height: {
                type: 'number',
                label: 'Height (px)',
                min: 300,
                max: 1000,
                step: 50,
                default: 600
              }
            }
          },
          colors: {
            type: 'colorPalette',
            label: 'Color Palette',
            default: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#FF6D01', '#46BDC6']
          },
          fonts: {
            type: 'group',
            label: 'Fonts',
            options: {
              fontSize: {
                type: 'number',
                label: 'Font Size',
                min: 8,
                max: 24,
                step: 1,
                default: 12
              },
              fontFamily: {
                type: 'select',
                label: 'Font Family',
                options: ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'],
                default: 'Arial'
              }
            }
          },
          legend: {
            type: 'boolean',
            label: 'Show Legend',
            default: true
          },
          theme: {
            type: 'select',
            label: 'Theme',
            options: ['light', 'dark', 'colorful'],
            default: 'light'
          }
        };

        // Add plot-specific options based on plot type
        if (plotType === 'Pie_Plot') {
          options = {
            ...options,
            donut: {
              type: 'boolean',
              label: 'Donut Style',
              default: false
            },
            showPercentage: {
              type: 'boolean',
              label: 'Show Percentages',
              default: true
            },
            startAngle: {
              type: 'number',
              label: 'Start Angle',
              min: 0,
              max: 360,
              step: 10,
              default: 0
            },
            sortSlices: {
              type: 'select',
              label: 'Sort Slices',
              options: ['none', 'ascending', 'descending'],
              default: 'none'
            }
          };
        } else if (plotType === 'Bar_Plot') {
          options = {
            ...options,
            orientation: {
              type: 'select',
              label: 'Orientation',
              options: ['vertical', 'horizontal'],
              default: 'vertical'
            },
            barWidth: {
              type: 'number',
              label: 'Bar Width (%)',
              min: 30,
              max: 100,
              step: 5,
              default: 70
            },
            groupMode: {
              type: 'select',
              label: 'Group Mode',
              options: ['grouped', 'stacked'],
              default: 'grouped'
            },
            xAxisLabel: {
              type: 'text',
              label: 'X-Axis Label',
              default: 'Categories'
            },
            yAxisLabel: {
              type: 'text',
              label: 'Y-Axis Label',
              default: 'Values'
            }
          };
        } else if (plotType === 'Volcano_Plot') {
          options = {
            ...options,
            pThreshold: {
              type: 'number',
              label: 'P-value Threshold',
              min: 0.0001,
              max: 0.1,
              step: 0.001,
              default: 0.05
            },
            fcThreshold: {
              type: 'number',
              label: 'Fold Change Threshold',
              min: 0.5,
              max: 5,
              step: 0.1,
              default: 1.0
            },
            upColor: {
              type: 'color',
              label: 'Up-regulated Color',
              default: '#EA4335'
            },
            downColor: {
              type: 'color',
              label: 'Down-regulated Color',
              default: '#4285F4'
            },
            nsColor: {
              type: 'color',
              label: 'Non-significant Color',
              default: '#CCCCCC'
            },
            xAxisLabel: {
              type: 'text',
              label: 'X-Axis Label',
              default: 'Log2 Fold Change'
            },
            yAxisLabel: {
              type: 'text',
              label: 'Y-Axis Label',
              default: '-log10(p-value)'
            },
            labelTopGenes: {
              type: 'number',
              label: 'Label Top Genes',
              min: 0,
              max: 50,
              step: 1,
              default: 10
            }
          };
        } else if (plotType === 'KM_Plot') {
          options = {
            ...options,
            showConfidence: {
              type: 'boolean',
              label: 'Show Confidence Intervals',
              default: true
            },
            showCensored: {
              type: 'boolean',
              label: 'Show Censored Points',
              default: true
            },
            riskTable: {
              type: 'boolean',
              label: 'Show Risk Table',
              default: false
            },
            xAxisLabel: {
              type: 'text',
              label: 'X-Axis Label',
              default: 'Time'
            },
            yAxisLabel: {
              type: 'text',
              label: 'Y-Axis Label',
              default: 'Survival Probability'
            }
          };
        } else if (plotType === 'ROC_Curve') {
          options = {
            ...options,
            showAUC: {
              type: 'boolean',
              label: 'Show AUC Value',
              default: true
            },
            showDiagonal: {
              type: 'boolean',
              label: 'Show Diagonal Line',
              default: true
            },
            xAxisLabel: {
              type: 'text',
              label: 'X-Axis Label',
              default: 'False Positive Rate'
            },
            yAxisLabel: {
              type: 'text',
              label: 'Y-Axis Label',
              default: 'True Positive Rate'
            }
          };
        }

        setCustomizationOptions(options);
        
        // Initialize plot config with defaults
        const initialConfig = {};
        Object.entries(options).forEach(([key, option]) => {
          if (option.type !== 'group') {
            initialConfig[key] = option.default;
          } else {
            Object.entries(option.options).forEach(([subKey, subOption]) => {
              initialConfig[subKey] = subOption.default;
            });
          }
        });
        
        setPlotConfig(initialConfig);
      } catch (err) {
        console.error('Failed to load customization options:', err);
      }
    };

    if (moduleId && plotType) {
      fetchCustomizationOptions();
    }
  }, [moduleId, plotType]);

  // Fetch sample data for the selected plot type
  const fetchSampleData = async () => {
    try {
      if (!moduleId || !plotType) return;
      
      const result = await sampleDataApi.execute(moduleId, plotType);
      if (result && result.data) {
        setData(result.data);
        setColumns(result.columns);
        
        // Generate initial preview
        generatePreview(result.data, plotConfig);
      }
    } catch (err) {
      console.error('Error fetching sample data:', err);
    }
  };

  const handleDataSubmit = async (inputData) => {
    try {
      // Set data first to allow validation component to work
      setData(inputData);
      
      // Validation will be handled by the DataValidation component
      // We'll proceed to the next step only if validation passes
      if (isDataValid) {
        setStep('customize');
        
        // Generate preview with the new data
        generatePreview(inputData, plotConfig);
      }
    } catch (err) {
      console.error('Error handling data submission:', err);
    }
  };

  const handleValidationComplete = (isValid) => {
    setIsDataValid(isValid);
    
    // If data is valid and we're still on the input step, move to customize
    if (isValid && step === 'input' && data.length > 0) {
      setStep('customize');
      generatePreview(data, plotConfig);
    }
  };

  const handleCustomizationChange = (newConfig) => {
    const updatedConfig = { ...plotConfig, ...newConfig };
    setPlotConfig(updatedConfig);
    
    // Generate preview with updated config
    generatePreview(data, updatedConfig);
  };

  const generatePreview = async (plotData, config) => {
    try {
      if (!plotData || plotData.length === 0 || !isDataValid) return;
      
      const result = await generatePlotApi.execute(plotType, plotData, config);
      
      if (result && result.plot_urls && result.plot_urls.png) {
        setPreviewUrl(result.plot_urls.png);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleExport = async (exportConfig) => {
    try {
      // Generate the plot with export configuration
      const result = await generatePlotApi.execute(plotType, data, {
        ...plotConfig,
        output_formats: [exportConfig.format],
        width: exportConfig.dimensions.width,
        height: exportConfig.dimensions.height,
        includeTitle: exportConfig.options.includeTitle,
        includeLegend: exportConfig.options.includeLegend,
        transparent: exportConfig.options.transparent
      });
      
      if (result && result.plot_urls && result.plot_urls[exportConfig.format]) {
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = result.plot_urls[exportConfig.format];
        link.download = `${plotType}_plot.${exportConfig.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error exporting plot:', err);
    }
  };

  return (
    <div className="plot-builder">
      <h2>{plotType ? plotType.replace('_', ' ') : 'Plot'} Builder</h2>
      
      {validateDataApi.error && <div className="error-message">{validateDataApi.error}</div>}
      {generatePlotApi.error && <div className="error-message">{generatePlotApi.error}</div>}
      
      <div className="plot-builder-steps">
        <div className={`step ${step === 'input' ? 'active' : ''}`} onClick={() => setStep('input')}>
          1. Data Input
        </div>
        <div className={`step ${step === 'customize' ? 'active' : ''}`} onClick={() => isDataValid && data.length > 0 && setStep('customize')}>
          2. Customize
        </div>
        <div className={`step ${step === 'export' ? 'active' : ''}`} onClick={() => isDataValid && data.length > 0 && setStep('export')}>
          3. Export
        </div>
      </div>
      
      <div className="plot-builder-content">
        {step === 'input' && (
          <>
            <DataInput 
              data={data} 
              columns={columns} 
              onSubmit={handleDataSubmit} 
              onLoadSample={fetchSampleData}
              plotType={plotType}
              loading={validateDataApi.loading || sampleDataApi.loading}
            />
            
            {data.length > 0 && (
              <DataValidation 
                data={data}
                plotType={plotType}
                onValidationComplete={handleValidationComplete}
              />
            )}
          </>
        )}
        
        {step === 'customize' && (
          <CustomizationPage
            plotType={plotType}
            plotData={data}
            initialConfig={customizationOptions}
            onConfigChange={handleCustomizationChange}
            onExport={(exportConfig) => {
              handleExport(exportConfig);
              setStep('export');
            }}
            previewUrl={previewUrl}
            loading={generatePlotApi.loading}
          />
        )}
        
        {step === 'export' && (
          <ExportOptions 
            onExport={handleExport}
            loading={generatePlotApi.loading}
          />
        )}
      </div>
    </div>
  );
};

export default PlotBuilder;
