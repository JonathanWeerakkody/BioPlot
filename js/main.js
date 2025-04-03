// js/main.js

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
        modulePath: '/js/plots/volcano.js',
        exampleFile: 'data/example_volcano.csv'
    },
    'heatmap': {
         title: 'Cluster Heatmap',
         description: 'Visualize matrix data. First column can optionally be used for row labels (specify in controls). Supports clustering and scaling.',
        modulePath: '/js/plots/heatmap.js',
        exampleFile: 'data/example_heatmap.csv'
    }
};

// --- Event Listeners ---
plotCards.forEach(card => {
    card.addEventListener('click', () => {
        const plotType = card.dataset.plotType;
        if (plotDefinitions[plotType]) {
            appState.currentPlotType = plotType;
            switchToPlotGenerationView(plotType);
        } else {
            console.error("Selected plot type definition not found:", plotType);
        }
    });
});

backButton.addEventListener('click', () => {
    switchToSelectionView();
});

fileUpload.addEventListener('change', handleFileUpload);

dynamicControlsContainer.addEventListener('input', handleControlChange); // For sliders, text inputs
dynamicControlsContainer.addEventListener('change', handleControlChange); // For select, checkbox, color

downloadPngBtn.addEventListener('click', () => handleDownload('png'));
downloadSvgBtn.addEventListener('click', () => handleDownload('svg'));
downloadTiffBtn.addEventListener('click', () => handleDownload('tiff')); // Will trigger PNG with warning


// --- Utility Functions ---
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

// --- Core Application Functions ---
async function switchToPlotGenerationView(plotType) {
    const definition = plotDefinitions[plotType];
    if (!definition) return;

    resetPlotArea();
    fileUpload.value = '';
    parseStatus.textContent = '';
    appState.currentPlotType = plotType; // Set plot type early
    updateExampleLink(plotType);

    setLoading(true);
    plotGenerationSection.classList.add('d-none');

    try {
        const plotModule = await import(definition.modulePath);
        appState.currentPlotModule = plotModule;

        const defaults = plotModule[`${plotType}PlotDefaults`];
        if (!defaults) throw new Error(`Defaults object not found in module for ${plotType}`);
        appState.plotConfig = { ...defaults };

        const controlsHTMLFunction = plotModule[`get${capitalize(plotType)}PlotControlsHTML`];
        if (!controlsHTMLFunction) throw new Error(`Controls function not found in module for ${plotType}`);

        dynamicControlsContainer.innerHTML = controlsHTMLFunction(defaults);

        // Apply accordion effect to NEWLY added controls
        ['collapseData', 'collapseCustomize', 'collapseDownload'].forEach(id => {
            const el = document.getElementById(id);
            if (el) new bootstrap.Collapse(el); // Initialize if element exists
        });

        syncConfigFromControls(); // Ensure state matches default controls values initially

        const eventListenerFunction = plotModule[`add${capitalize(plotType)}EventListeners`];
        if (eventListenerFunction) {
            eventListenerFunction(); // Attach dynamic listeners (e.g., for sliders, checkboxes affecting other controls)
        }

        plotSelectionSection.classList.add('d-none');
        plotGenerationSection.classList.remove('d-none');

        // Optionally open the Customize accordion by default
         const customizeCollapseEl = document.getElementById('collapseCustomize');
        if (customizeCollapseEl) {
            const bsCollapse = bootstrap.Collapse.getInstance(customizeCollapseEl) || new bootstrap.Collapse(customizeCollapseEl);
             bsCollapse.show();
         }


    } catch (error) {
        console.error(`Error loading/initializing plot module ${plotType}:`, error);
        displayError(`Failed to load plot module: ${error.message}. Please check console.`);
        switchToSelectionView();
    } finally {
        setLoading(false);
    }
}

function switchToSelectionView() {
    appState.currentPlotType = null;
    appState.plotData = null;
    appState.plotConfig = {};
    appState.currentPlotModule = null;
    resetPlotArea();
    dynamicControlsContainer.innerHTML = ''; // Clear old controls

    plotGenerationSection.classList.add('d-none');
    plotSelectionSection.classList.remove('d-none');
    updateExampleLink(null);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        parseStatus.textContent = '';
        resetPlotArea();
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
            const result = parseDelimitedText(e.target.result, file.name);
            if (result.error) throw new Error(result.error);

            appState.plotData = result.data;
            appState.plotHeader = result.header;
            parseStatus.textContent = `Loaded ${appState.plotData.length} rows from "${file.name}".`;
            parseStatus.classList.remove('text-danger');
            parseStatus.classList.add('text-success');

            autoDetectColumnsIfNeeded(); // Auto-detect after successful parse
            updatePlot(); // Plot with defaults/detected settings
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
     if (!appState.currentPlotType || !appState.plotHeader || appState.plotHeader.length === 0) return;

     const syncUpdate = (elem) => { if (elem) handleControlChange({ target: elem }); };

     if (appState.currentPlotType === 'volcano') {
         syncUpdate(autoDetectColumn(['log2foldchange', 'logfc'], 'volcano-fc-col'));
         syncUpdate(autoDetectColumn(['padj', 'adj.p.val', 'fdr', 'pvalue', 'p.value'], 'volcano-pval-col'));
         syncUpdate(autoDetectColumn(['gene', 'gene_name', 'symbol', 'id'], 'volcano-gene-col'));
     } else if (appState.currentPlotType === 'heatmap') {
         // Attempt to guess first non-numeric *looking* column as potential label
         let firstLikelyLabel = appState.plotHeader.find(h => isNaN(parseFloat(appState.plotData[0]?.[h])));
         syncUpdate(autoDetectColumn(['gene', 'symbol', 'id', 'name', firstLikelyLabel || ''], 'heatmap-row-label-col', true)); // Allow blank
    }
 }

function autoDetectColumn(possibleNames, inputElementId, allowBlank = false) {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement || !appState.plotHeader) return null;

    const headerLower = appState.plotHeader.map(h => h.toLowerCase());
    const possibleLower = possibleNames.map(p => p.toLowerCase());

    for (const possible of possibleLower) {
        const index = headerLower.indexOf(possible);
        if (index !== -1) {
            inputElement.value = appState.plotHeader[index];
            return inputElement; // Return the element that was updated
        }
    }
    // Only set to blank if allowed AND it wasn't found AND its current value isn't already blank
    if (allowBlank && inputElement.value !== '') {
       inputElement.value = '';
        return inputElement;
    }
    return null; // Return null if no change made
}

function handleControlChange(event) {
    if (!event.target || !appState.currentPlotType) return;

    const element = event.target;

    // Handle linked label updates (sliders, etc.) if the specific listener isn't sufficient
     if (element.type === 'range') {
        const labelId = `${element.id}-label`;
         const labelElement = document.getElementById(labelId);
         if (labelElement) {
             labelElement.textContent = element.id.includes('alpha') ? parseFloat(element.value).toFixed(2) : element.value;
         }
     }

     // Special handling for enabling/disabling based on other controls
    if (element.id === 'heatmap-cluster-rows' || element.id === 'heatmap-cluster-cols') {
       document.getElementById('heatmap-cluster-method').disabled = !(document.getElementById('heatmap-cluster-rows').checked || document.getElementById('heatmap-cluster-cols').checked);
       document.getElementById('heatmap-distance-method').disabled = !(document.getElementById('heatmap-cluster-rows').checked || document.getElementById('heatmap-cluster-cols').checked);
     }
     if (element.id === 'heatmap-show-numbers') {
        document.getElementById('heatmap-number-fontsize').disabled = !element.checked;
    }

    // Debounce the actual plot update
    clearTimeout(appState.debounceTimer);
    appState.debounceTimer = setTimeout(() => {
        updatePlot();
    }, 250); // 250ms delay
}

function syncConfigFromControls() { // Ensure this runs before plotting!
    if (!appState.currentPlotType || !appState.currentPlotModule || !dynamicControlsContainer) return false;

    const inputs = dynamicControlsContainer.querySelectorAll('input, select, textarea');
    const defaults = appState.currentPlotModule[`${appState.currentPlotType}PlotDefaults`] || {};
    let changed = false;

    inputs.forEach(element => {
        if (!element.id || element.disabled) return;

        const configKey = element.id.replace(`${appState.currentPlotType}-`, '');
        let value;
        let isNullAllowed = ['xMin', 'xMax', 'yMax', 'zMin', 'zMax'].includes(configKey); // Allow null for range overrides

        if (element.type === 'checkbox') {
            value = element.checked;
        } else if (element.type === 'range') {
            value = parseFloat(element.value);
        } else if (element.type === 'number') {
            value = (element.value === '' && isNullAllowed) ? null : parseFloat(element.value);
            if (isNaN(value) && !isNullAllowed) {
                value = defaults[configKey] ?? undefined; // Use default if invalid & null not allowed
                console.warn(`Invalid number for ${configKey}. Using default.`);
            } else if (isNaN(value) && isNullAllowed) {
                value = null;
            }
        } else { // text, select, color, textarea
            value = element.value;
        }

        // Track if any value actually changed compared to current appState
        // Use loose equality (==) for comparison unless specific types need strict (===)
        if (appState.plotConfig[configKey] != value && !(isNaN(appState.plotConfig[configKey]) && isNaN(value)) ) {
           changed = true;
        }
        appState.plotConfig[configKey] = value;
    });
     // console.log("Sync Complete. Config:", appState.plotConfig, "Changed:", changed);
     return changed;
}


function updatePlot() {
    if (!appState.plotData || !appState.currentPlotType || !appState.currentPlotModule) {
        resetPlotArea(); // Show placeholder if data/module missing
        return;
    }

     syncConfigFromControls(); // Make SURE config is up-to-date with UI just before plotting

    setLoading(true);
    clearError();
    plotPlaceholder.classList.add('d-none');

    const plotFunction = appState.currentPlotModule[`create${capitalize(appState.currentPlotType)}Plot`];

    if (plotFunction) {
        requestAnimationFrame(() => { // Use rAF for smoother rendering before heavy JS
            try {
                const figure = plotFunction(appState.plotData, appState.plotConfig);
                if (figure.error) throw new Error(figure.error);

                // Apply General Layout Enhancements (can be overridden by plot function)
                const plotLayout = {
                     margin: { l: 50, r: 50, t: 80, b: 50 }, // Generous default margins
                    ...(figure.layout || {}), // Spread layout from plot function first
                     font: { family: appState.plotConfig.fontFamily || 'Arial', size: 12, color: '#333' },
                     paper_bgcolor: 'rgba(255,255,255,1)',
                     plot_bgcolor: '#ffffff',
                     autosize: true, // Let plotly manage size initially
                };
                // Ensure title font settings are applied correctly
                if (plotLayout.title?.text) { // Check if title text exists
                     plotLayout.title.font = {
                        size: Math.max(14, (appState.plotConfig.labelFontsize || 18) + 2), // Base title on axis label size + bit larger
                        family: plotLayout.font.family,
                         weight: 'bold',
                         color: '#1a5276'
                    };
                }


                 const configPlotly = { responsive: true, displaylogo: false }; // Standard Plotly config

                if (!appState.plotlyInitialized || !document.getElementById('plot-output')?.hasChildNodes()) {
                     Plotly.newPlot(plotOutput, figure.data, plotLayout, configPlotly);
                    appState.plotlyInitialized = true;
                 } else {
                    Plotly.react(plotOutput, figure.data, plotLayout); // Efficient update
                 }
                 // Resize listener might be needed if container size changes *after* plot generation
                 // Plotly.Plots.resize(plotOutput); might be needed in some resize scenarios

             } catch (error) {
                 console.error('Plotting Error:', error);
                displayError(`Plot generation failed: ${error.message}`);
                appState.plotlyInitialized = false;
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
     if (!appState.plotlyInitialized || !document.getElementById('plot-output')?.hasChildNodes()) {
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

    const baseFilename = `${appState.currentPlotType}_plot_${new Date().toISOString().slice(0, 10).replace(/-/g,'')}`;

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
        // Let Plotly handle SVG sizing; removing scale/width/height might be best for vector quality.
        // Alternatively, provide width/height WITHOUT scale for viewBox setting. Test needed.
         downloadOptions.scale = undefined;
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
    if(plotOutput) {
       try {
            Plotly.purge(plotOutput); // Remove Plotly instance safely
        } catch(e) {
             console.warn("Error purging Plotly:", e);
        }
        plotOutput.innerHTML = ''; // Clear residual elements
    }
    appState.plotlyInitialized = false;
    plotPlaceholder?.classList.remove('d-none');
    errorMessage?.classList.add('d-none');
    errorMessage.textContent = ''; // Clear error text
    setLoading(false); // Ensure loading indicator is off

    // Reset app state related to plot
    appState.plotData = null;
    appState.plotHeader = [];
    appState.plotConfig = {};
    appState.currentPlotModule = null;
 }

// --- Initial Setup ---
plotGenerationSection.classList.add('d-none');
plotSelectionSection.classList.remove('d-none');
updateExampleLink(null); // Set initial example link text
console.log("BioPlot Interactive Initialized");
