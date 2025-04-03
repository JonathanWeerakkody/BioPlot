// js/main.js

// Import the parser function specifically
import { parseDelimitedText } from './utils.js'; // Assuming utils.js is in the same folder

// Application State
const appState = {
    currentPlotType: null,
    plotData: null,
    plotConfig: {},
    plotHeader: [],
    plotlyInitialized: false,
    debounceTimer: null,
    currentPlotModule: null,
};

// --- DOM Elements ---
const plotSelectionSection = document.getElementById('plot-selection');
const plotGenerationSection = document.getElementById('plot-generation');
const plotCards = document.querySelectorAll('.plot-card');
const backButton = document.getElementById('back-to-selection');
const fileUpload = document.getElementById('file-upload');
const parseStatus = document.getElementById('parse-status');
const dynamicControlsContainer = document.getElementById('dynamic-controls');
const plotContainer = document.getElementById('plot-container');
const plotOutput = document.getElementById('plot-output');
const plotPlaceholder = document.getElementById('plot-placeholder');
const errorMessage = document.getElementById('error-message');
const downloadPngBtn = document.getElementById('download-png');
const downloadSvgBtn = document.getElementById('download-svg');
const downloadTiffBtn = document.getElementById('download-tiff');
const downloadDpiSelect = document.getElementById('download-dpi');
const plotTitleElement = document.getElementById('plot-title');
const plotDescriptionElement = document.getElementById('plot-description');
const exampleDataLink = document.getElementById('example-data-link');


// --- Plot Definitions (Module Path based) ---
const plotDefinitions = {
    'volcano': {
        title: 'Volcano Plot',
        description: 'Visualize differential expression results. Required columns depend on settings, typically Fold Change and P-value.',
        modulePath: './plots/volcano.js', // Relative path for dynamic import
        exampleFile: 'data/example_volcano.csv'
    },
    'heatmap': {
         title: 'Cluster Heatmap',
         description: 'Visualize matrix data. First column can optionally be used for row labels (specify in controls). Supports clustering and scaling.',
        modulePath: './plots/heatmap.js', // Relative path for dynamic import
        exampleFile: 'data/example_heatmap.csv'
    }
};

// --- MOVED Utility Functions (Depend on appState / DOM structure) ---

function displayError(message, elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (!errorDiv) {
        console.error("Error display element not found:", elementId);
        return;
    }
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');

    // Reset plot area on error
    document.getElementById('plot-placeholder')?.classList.add('d-none');
    document.getElementById('loading-indicator')?.style.display = 'none';
    if (plotOutput) plotOutput.innerHTML = ''; // Clear plot
    appState.plotlyInitialized = false; // Reset Plotly flag is essential here
}

function clearError(elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.classList.add('d-none');
        errorDiv.textContent = '';
    }
}

function setLoading(isLoading) {
    // Check if elements exist every time
    const loader = document.getElementById('loading-indicator');
    const plotOutput = document.getElementById('plot-output');
    const plotPlaceholder = document.getElementById('plot-placeholder');

    if (!loader || !plotOutput || !plotPlaceholder) {
       // This might happen transiently during page load/setup. Only warn if persists.
       // console.warn("Missing required elements for setLoading");
       return;
    }

    if (isLoading) {
        loader.style.display = 'flex';
        plotOutput.style.opacity = '0.3';
        plotPlaceholder.classList.add('d-none');
        clearError();
    } else {
        loader.style.display = 'none';
        plotOutput.style.opacity = '1';
        // Show placeholder only if plot is NOT already rendered
        if (!appState.plotlyInitialized) {
             plotPlaceholder.classList.remove('d-none');
         }
    }
}


// --- Event Listeners --- (Keep as before)
plotCards.forEach(card => {
    card.addEventListener('click', () => {
        const plotType = card.dataset.plotType;
        if (plotDefinitions[plotType]) {
           // No change here - this triggers the load and setup
           switchToPlotGenerationView(plotType);
        } else {
            console.error("Selected plot type definition not found:", plotType);
        }
    });
});
// ... (Keep other event listeners: backButton, fileUpload, dynamicControlsContainer, download buttons) ...
backButton.addEventListener('click', () => {
    switchToSelectionView();
});

fileUpload.addEventListener('change', handleFileUpload);

dynamicControlsContainer.addEventListener('input', handleControlChange); // For sliders, text inputs
dynamicControlsContainer.addEventListener('change', handleControlChange); // For select, checkbox, color

downloadPngBtn.addEventListener('click', () => handleDownload('png'));
downloadSvgBtn.addEventListener('click', () => handleDownload('svg'));
downloadTiffBtn.addEventListener('click', () => handleDownload('tiff'));

// --- Rest of main.js ---
// Keep capitalize, updateExampleLink, switchToPlotGenerationView, switchToSelectionView,
// handleFileUpload (it correctly calls the imported parseDelimitedText),
// autoDetectColumnsIfNeeded, autoDetectColumn, handleControlChange, syncConfigFromControls,
// updatePlot, handleDownload, resetPlotArea (it now correctly calls setLoading/clearError/displayError)

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateExampleLink(plotType) {
     const definition = plotDefinitions[plotType];
     const currentPlotNameSpan = document.getElementById('current-plot-name-example');

    if (currentPlotNameSpan) currentPlotNameSpan.textContent = definition?.title || 'Plot';

     const linkContainer = exampleDataLink?.parentElement;
     if (linkContainer) {
         if (exampleDataLink && definition?.exampleFile) {
             exampleDataLink.href = definition.exampleFile;
             exampleDataLink.download = definition.exampleFile.split('/').pop();
             linkContainer.style.display = 'inline';
        } else {
            linkContainer.style.display = 'none';
        }
    }
 }


 async function switchToPlotGenerationView(plotType) {
    const definition = plotDefinitions[plotType];
    if (!definition) return;

    // Clear previous state BEFORE potentially failing import/setup
    switchToSelectionView(); // Clears most things and hides plot gen section

    appState.currentPlotType = plotType; // Set current plot type
    updateExampleLink(plotType);
    plotTitleElement.textContent = definition.title; // Set title/desc early
    plotDescriptionElement.textContent = definition.description;

    setLoading(true); // Show loading

    try {
        // Dynamic import MUST use a relative path from *this* file (main.js)
        const plotModule = await import(definition.modulePath);
        appState.currentPlotModule = plotModule;

        const defaults = plotModule[`${plotType}PlotDefaults`];
        if (!defaults) throw new Error(`Defaults object not found`);
        appState.plotConfig = { ...defaults };

        const controlsHTMLFunction = plotModule[`get${capitalize(plotType)}PlotControlsHTML`];
        if (!controlsHTMLFunction) throw new Error(`Controls function not found`);

        dynamicControlsContainer.innerHTML = controlsHTMLFunction(defaults);

        // Re-initialize accordions as the content is replaced
        ['collapseData', 'collapseCustomize', 'collapseDownload'].forEach(id => {
             const el = document.getElementById(id);
            // Remove existing instance if present before creating new
            const existingCollapse = bootstrap.Collapse.getInstance(el);
            if(existingCollapse) existingCollapse.dispose();
            if (el) new bootstrap.Collapse(el);
        });


        // Sync state AGAIN now that controls physically exist
        syncConfigFromControls();

        // Attach specific listeners (like range slider label updates)
        const eventListenerFunction = plotModule[`add${capitalize(plotType)}EventListeners`];
        if (eventListenerFunction) {
            eventListenerFunction(); // Attach dynamic listeners
        }

        plotSelectionSection.classList.add('d-none'); // Hide selection
        plotGenerationSection.classList.remove('d-none'); // Show generation

        // Optionally show Customize accordion
        const customizeCollapseEl = document.getElementById('collapseCustomize');
         if (customizeCollapseEl) {
           const bsCollapse = bootstrap.Collapse.getInstance(customizeCollapseEl) || new bootstrap.Collapse(customizeCollapseEl);
            bsCollapse.show();
        }
        // Make sure plot area starts with placeholder showing correctly
        resetPlotArea();


    } catch (error) {
        console.error(`Error loading/initializing plot module ${plotType}:`, error);
        displayError(`Failed to load plot module '${definition.title}': ${error.message}. Check console.`);
        switchToSelectionView(); // Revert fully on error
    } finally {
        setLoading(false); // Always turn off loader
    }
}

function switchToSelectionView() {
    // Clear state BEFORE hiding elements etc.
    appState.currentPlotType = null;
    appState.plotData = null;
    appState.plotConfig = {};
    appState.currentPlotModule = null;
    appState.plotlyInitialized = false; // Ensure this is reset

    if(dynamicControlsContainer) dynamicControlsContainer.innerHTML = '';
    if(fileUpload) fileUpload.value = ''; // Clear file input
    if(parseStatus) parseStatus.textContent = ''; // Clear parse status
    if(plotTitleElement) plotTitleElement.textContent = ''; // Clear plot title
    if(plotDescriptionElement) plotDescriptionElement.textContent = ''; // Clear description

    // Reset plot display area LAST
    resetPlotArea(); // This will show placeholder and hide errors/loading

    // Hide generation, show selection
    plotGenerationSection?.classList.add('d-none');
    plotSelectionSection?.classList.remove('d-none');
    updateExampleLink(null);
}


function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || !appState.currentPlotType) { // Also check if a plot type is selected
        if(!appState.currentPlotType && file) alert("Please select a plot type before uploading data.");
        parseStatus.textContent = '';
        resetPlotArea(); // Clear plot if file is removed or no plot type selected
        appState.plotData = null;
        appState.plotHeader = [];
        return;
    }

    clearError();
    parseStatus.textContent = `Processing ${file.name}...`;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
             // Use the imported parser function
            const result = parseDelimitedText(e.target.result, file.name);
            if (result.error) throw new Error(result.error);

            appState.plotData = result.data;
            appState.plotHeader = result.header;
            parseStatus.textContent = `Loaded ${appState.plotData.length} rows from "${file.name}".`;
            parseStatus.classList.remove('text-danger');
            parseStatus.classList.add('text-success');

            autoDetectColumnsIfNeeded();
            updatePlot(); // This implicitly calls syncConfigFromControls first
        } catch (err) {
            console.error("Parsing/Processing Error:", err);
            parseStatus.textContent = `Error: ${err.message}`;
            parseStatus.classList.remove('text-success');
            parseStatus.classList.add('text-danger');
            appState.plotData = null;
            appState.plotHeader = [];
            resetPlotArea();
            displayError(`Failed to process file: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    reader.onerror = function () {
        parseStatus.textContent = 'Error reading file.';
        parseStatus.classList.remove('text-success');
        parseStatus.classList.add('text-danger');
        resetPlotArea();
        setLoading(false);
        displayError('Could not read the selected file.');
    };
    reader.readAsText(file);
}


function autoDetectColumnsIfNeeded() {
     if (!appState.currentPlotType || !appState.plotHeader || appState.plotHeader.length === 0 || !appState.plotData || appState.plotData.length === 0) return;

     const syncUpdate = (elem) => { if (elem) handleControlChange({ target: elem }); };

     if (appState.currentPlotType === 'volcano') {
         syncUpdate(autoDetectColumn(['log2foldchange', 'logfc'], 'volcano-fc-col'));
         syncUpdate(autoDetectColumn(['padj', 'adj.p.val', 'fdr', 'pvalue', 'p.value'], 'volcano-pval-col'));
         syncUpdate(autoDetectColumn(['gene', 'gene_name', 'symbol', 'id'], 'volcano-gene-col'));
     } else if (appState.currentPlotType === 'heatmap') {
         // Only suggest if default 'sample' or common alternatives aren't the actual first column name
         const currentLabelCol = document.getElementById('heatmap-row-label-col')?.value || '';
         const firstHeader = appState.plotHeader[0];
         if (!labelColFoundInHeader(currentLabelCol) && firstHeader && isNaN(parseFloat(appState.plotData[0]?.[firstHeader])) ) {
            syncUpdate(autoDetectColumn([firstHeader], 'heatmap-row-label-col', true)); // Suggest first header if it looks like labels
         } else {
            // Ensure the current default or user setting is valid or use common fallbacks
             syncUpdate(autoDetectColumn(['sample','gene', 'symbol', 'id', 'name'], 'heatmap-row-label-col', true));
         }
    }
 }

function labelColFoundInHeader(colName){
    if(!colName || !appState.plotHeader || appState.plotHeader.length === 0) return false;
    return appState.plotHeader.map(h => h.toLowerCase()).includes(colName.toLowerCase());
}

 function autoDetectColumn(possibleNames, inputElementId, allowBlank = false) {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement || !appState.plotHeader) return null;

    const currentValLower = inputElement.value.toLowerCase();
    // If user has already entered a valid column, don't override it.
     if (inputElement.value !== '' && appState.plotHeader.map(h => h.toLowerCase()).includes(currentValLower)) {
       // console.log(`Keeping existing valid value "${inputElement.value}" for ${inputElementId}`);
       return null; // No change needed
    }


    const headerLower = appState.plotHeader.map(h => h.toLowerCase());
    const possibleLower = possibleNames.map(p => typeof p === 'string' ? p.toLowerCase() : '').filter(p=>p); // Filter empty possibles

    for (const possible of possibleLower) {
        const index = headerLower.indexOf(possible);
        if (index !== -1) {
            console.log(`Auto-detected "${appState.plotHeader[index]}" for ${inputElementId}`);
            inputElement.value = appState.plotHeader[index];
            return inputElement;
        }
    }
     if (allowBlank) { // If no match found and blank is okay, ensure it's blank
         if(inputElement.value !== '') {
             inputElement.value = '';
             console.log(`Setting ${inputElementId} to blank as no match found.`);
            return inputElement;
        }
    } else if (inputElement.value === '') { // If not allowed blank and it's currently blank, try first header? Or default? Use default.
         const defaults = appState.currentPlotModule?.[`${appState.currentPlotType}PlotDefaults`] || {};
         const defaultVal = defaults[inputElement.id.replace(`${appState.currentPlotType}-`, '')] || '';
         if(defaultVal && appState.plotHeader.map(h=>h.toLowerCase()).includes(defaultVal.toLowerCase())){
              inputElement.value = defaultVal;
              console.log(`Setting ${inputElementId} to default "${defaultVal}" as no match found and blank not allowed.`);
             return inputElement;
         }
    }
    return null;
}


function handleControlChange(event) {
    if (!event.target || !appState.currentPlotType) return;
    const element = event.target;

    // --- Immediate UI Updates (e.g., slider labels) ---
    if (element.type === 'range') {
        const labelId = `${element.id}-label`;
        const labelElement = document.getElementById(labelId);
        if (labelElement) {
            labelElement.textContent = element.id.includes('alpha') ? parseFloat(element.value).toFixed(2) : element.value;
        }
    }

    // --- Dynamic Control Enabling/Disabling ---
    if(appState.currentPlotType === 'heatmap') {
       const rowCheck = document.getElementById('heatmap-cluster-rows');
       const colCheck = document.getElementById('heatmap-cluster-cols');
       const showNumCheck = document.getElementById('heatmap-show-numbers');
       const clusterMethod = document.getElementById('heatmap-cluster-method');
       const distMethod = document.getElementById('heatmap-distance-method');
       const numFont = document.getElementById('heatmap-number-fontsize');

        if (element.id === rowCheck?.id || element.id === colCheck?.id) {
           const clusterEnabled = rowCheck?.checked || colCheck?.checked;
           if(clusterMethod) clusterMethod.disabled = !clusterEnabled;
           if(distMethod) distMethod.disabled = !clusterEnabled;
        }
        if (element.id === showNumCheck?.id) {
           if(numFont) numFont.disabled = !element.checked;
       }
   }

    // Debounce Plot Update
    clearTimeout(appState.debounceTimer);
    appState.debounceTimer = setTimeout(() => {
        updatePlot();
    }, 300); // Slightly increased delay
}

function updatePlot() {
    // Check essential conditions first
    if (!appState.plotData || !appState.currentPlotType || !appState.currentPlotModule) {
        console.log("UpdatePlot cancelled: Missing data, plot type, or module.");
        // Ensure placeholder is shown if nothing can be plotted
         resetPlotArea();
         return;
     }

     // Update appState.plotConfig from UI controls
     syncConfigFromControls();

    setLoading(true);
     clearError(); // Clear previous plot errors
     // Only hide placeholder if we're about to *try* plotting
     if (plotPlaceholder) plotPlaceholder.classList.add('d-none');

    const plotFunction = appState.currentPlotModule[`create${capitalize(appState.currentPlotType)}Plot`];

    if (plotFunction) {
         requestAnimationFrame(() => {
             try {
                 // Call the specific plot function with CURRENT data and config
                 const figure = plotFunction(appState.plotData, appState.plotConfig);
                 if (figure.error) throw new Error(figure.error); // Handle errors returned by plot func

                // Define common layout properties to ensure consistency
                 const commonLayout = {
                    margin: { l: 50, r: 50, t: 80, b: 50 },
                     font: { family: appState.plotConfig?.fontFamily || 'Arial', size: 12, color: '#333' },
                    paper_bgcolor: 'rgba(255,255,255,1)',
                    plot_bgcolor: '#ffffff', // White plot background
                    autosize: true,
                    // Standardize title styling if a title exists
                    ...( (figure.layout?.title?.text || appState.plotConfig?.plotTitle) && {
                         title: {
                            text: figure.layout?.title?.text || appState.plotConfig?.plotTitle,
                            font: {
                                size: Math.max(14, (appState.plotConfig?.labelFontsize || 18) + 2),
                                 family: appState.plotConfig?.fontFamily || 'Arial',
                                weight: 'bold',
                                color: '#1a5276'
                             }
                         }
                    })
                };

                // Merge plot-specific layout with common layout, specific taking precedence
                 const finalLayout = { ...commonLayout, ...(figure.layout || {}) };


                const configPlotly = { responsive: true, displaylogo: false };

                if (!appState.plotlyInitialized || !plotOutput?.hasChildNodes()) {
                    Plotly.newPlot(plotOutput, figure.data, finalLayout, configPlotly);
                     appState.plotlyInitialized = true;
                 } else {
                     Plotly.react(plotOutput, figure.data, finalLayout);
                }

             } catch (error) {
                 console.error('Plotting Error:', error);
                displayError(`Plot generation failed: ${error.message}`);
                appState.plotlyInitialized = false; // Ensure reset on failure
             } finally {
                setLoading(false);
             }
         });
     } else {
        console.error("Plot function not found for type:", appState.currentPlotType);
        displayError(`Internal error: Plot function missing.`);
         setLoading(false);
    }
 }

function handleDownload(format) {
     if (!appState.plotlyInitialized || !plotOutput?.hasChildNodes()) {
        alert("Please generate a plot before downloading.");
        return;
     }

     const scaleFactor = parseFloat(downloadDpiSelect.value) || 3;
    const defaultWidth = plotOutput.offsetWidth || 800;
     const defaultHeight = plotOutput.offsetHeight || 600;

    let dlWidthInput = document.getElementById('download-width');
    let dlHeightInput = document.getElementById('download-height');
    let dlWidth = dlWidthInput?.value ? parseInt(dlWidthInput.value) : defaultWidth;
    let dlHeight = dlHeightInput?.value ? parseInt(dlHeightInput.value) : defaultHeight;

    if (isNaN(dlWidth) || dlWidth <= 0) dlWidth = defaultWidth;
     if (isNaN(dlHeight) || dlHeight <= 0) dlHeight = defaultHeight;

     const baseFilename = `${appState.currentPlotType}_plot_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

    let downloadOptions = {
        format: '', width: dlWidth, height: dlHeight, filename: '', scale: scaleFactor
    };

    if (format === 'png' || format === 'tiff') {
        downloadOptions.format = 'png';
        downloadOptions.filename = `${baseFilename}.png`;
        if (format === 'tiff') {
            alert("TIFF format is not directly supported. Downloading as high-resolution PNG (equivalent quality for import).");
        }
    } else if (format === 'svg') {
        downloadOptions.format = 'svg';
        downloadOptions.filename = `${baseFilename}.svg`;
        downloadOptions.scale = undefined; // Let SVG scale naturally
    } else {
        console.error("Unsupported download format:", format);
        return;
    }

    setLoading(true);
    Plotly.downloadImage(plotOutput, downloadOptions)
        .then(filename => { console.log(`Downloaded: ${filename}`); })
        .catch(err => { console.error("Download failed:", err); alert(`Download failed: ${err.message}`); })
        .finally(() => { setLoading(false); });
}


function resetPlotArea() {
    if (plotOutput) {
       try {
            Plotly.purge(plotOutput);
        } catch (e) { /* ignore if no plot existed */ }
        plotOutput.innerHTML = '';
     }
    appState.plotlyInitialized = false;
     if(plotPlaceholder) plotPlaceholder.classList.remove('d-none');
    if(errorMessage) errorMessage.classList.add('d-none');
    setLoading(false); // Make sure loader is off
 }


// --- Initial Setup ---
switchToSelectionView(); // Start by showing the selection screen
console.log("BioPlot Interactive Initialized");