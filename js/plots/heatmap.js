// js/plots/heatmap.js
/* global HClust */ // CDN global variable

export const heatmapPlotDefaults = {
    // Figure Size handled via download options now
    // figureWidth: 6.0,
    // figureHeight: 6.0,
    rowFontsize: 16.0,
    colFontsize: 16.0,
    numberFontsize: 10.0, // Added based on options
    lowerColor: '#0000FF',
    middleColor: '#FFFFFF',
    higherColor: '#FF0000',
    colorNumber: 100, // Steps in custom color scale - may not directly map to Plotly scale generation
    colorScale: 'RdBu', // Default Plotly scale, overriden if custom colors used? Keep RdBu as default for selection.
    scale: 'row', // row, column, none
    displayRowNames: true, // From "Display names": row, column, both, none
    displayColNames: true,
    clusterRows: true, // Cluster orientation: row, column, bidirection, none (Map bidirection to row&col true)
    clusterCols: true,
    clusterMethod: 'complete', // average, ward, single, complete, median, centroid, ward.D, ward.D2, mcquitty
    distanceMethod: 'euclidean', // correlation, euclidean, maximum, manhattan, canberra, binary, minkowski
    showGrid: false, // Border: show / not show
    removeConstantRows: false,
    showNumbers: false,
    zMin: null, // Colorbar range override (optional)
    zMax: null, // Colorbar range override (optional)
    fontFamily: 'Arial', // Times New Roman, Arial
    plotTitle: 'Heatmap', // Added for consistency
    rowLabelCol: 'sample', // Added based on example data first column name
};

// Map user friendly names to ml-hclust names / functionality
const clusterMethodsMap = {
    'average': 'average', 'complete': 'complete', 'single': 'single',
    'ward': 'ward', 'ward.D': 'ward', 'ward.D2': 'ward', // map ward variants to ward
    'mcquitty': 'mcquitty', // may not be in ml-hclust? Check library
    'median': 'median', // check library
    'centroid': 'centroid' // check library
    // Need to verify which methods ml-hclust actually supports by these names
};
const distanceMethodsMap = {
    'euclidean': 'euclidean', 'maximum': 'maximum', 'manhattan': 'manhattan',
    'canberra': 'canberra', 'binary': 'binary', // check if binary is distance or similarity based in lib
    'minkowski': 'minkowski',
    'correlation': 'correlation' // needs custom handling or library support
};

// Custom distance function needed for correlation distance (1 - Pearson correlation)
function correlationDistance(a, b) {
    const n = a.length;
    if (n === 0 || a.length !== b.length) return NaN;
    let sumA = 0, sumB = 0, sumASq = 0, sumBSq = 0, sumAB = 0;
    for (let i = 0; i < n; i++) {
        sumA += a[i]; sumB += b[i];
        sumASq += a[i] * a[i]; sumBSq += b[i] * b[i];
        sumAB += a[i] * b[i];
    }
    const meanA = sumA / n;
    const meanB = sumB / n;
    let cov = 0, stdDevA = 0, stdDevB = 0;
    for (let i = 0; i < n; i++) {
        cov += (a[i] - meanA) * (b[i] - meanB);
        stdDevA += Math.pow(a[i] - meanA, 2);
        stdDevB += Math.pow(b[i] - meanB, 2);
    }
    cov /= n; // Use population covariance/stddev
    stdDevA = Math.sqrt(stdDevA / n);
    stdDevB = Math.sqrt(stdDevB / n);

    if (stdDevA === 0 || stdDevB === 0) {
        return 0; // No variance in one vector, correlation is undefined/0 distance? Or 1? Let's return 0 (identical/no distance)
    }
    const correlation = cov / (stdDevA * stdDevB);
    return 1 - correlation; // Return distance (0=identical, 2=perfectly anti-correlated)
}

function getDistanceFunction(name) {
   if (name === 'correlation') return correlationDistance;
    // ml-hclust might directly take string names for common distances
    return name; // Let the library handle built-ins like 'euclidean', 'manhattan' etc.
}

// Helper for scaling
function scaleMatrix(matrix, scale = 'row') {
   if (scale === 'none' || !matrix || matrix.length === 0) return matrix;
   if (scale === 'row') {
      return matrix.map(row => {
         const validValues = row.filter(v => typeof v === 'number' && !isNaN(v));
          if(validValues.length < 2) return row; // Cannot scale row with < 2 valid values
         const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
          const stdDev = Math.sqrt(validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length);
         if (stdDev === 0) return row.map(() => 0); // All values were the same, return row of zeros
         return row.map(val => (typeof val === 'number' && !isNaN(val)) ? (val - mean) / stdDev : null);
     });
  } else if (scale === 'column') {
     const numRows = matrix.length;
      const numCols = matrix[0].length;
      let scaled = matrix.map(row => [...row]); // Create a mutable copy

       for (let j = 0; j < numCols; j++) {
          const colValues = [];
           for (let i = 0; i < numRows; i++) {
                const val = matrix[i][j];
               if (typeof val === 'number' && !isNaN(val)) {
                   colValues.push(val);
                }
            }
             if (colValues.length < 2) continue; // Cannot scale col with < 2 values

           const mean = colValues.reduce((a, b) => a + b, 0) / colValues.length;
           const stdDev = Math.sqrt(colValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / colValues.length);

           if (stdDev === 0) { // All column values same, scale to 0
               for (let i = 0; i < numRows; i++) scaled[i][j] = 0;
           } else {
              for (let i = 0; i < numRows; i++) {
                   const val = matrix[i][j];
                   if (typeof val === 'number' && !isNaN(val)) {
                       scaled[i][j] = (val - mean) / stdDev;
                  } else {
                      scaled[i][j] = null; // Preserve nulls
                   }
               }
            }
         }
        return scaled;
    }
     return matrix; // Should not happen if scale is valid 'row'/'column'/'none'
 }

 export function getHeatmapPlotControlsHTML(defaults) {
     let clusterMethodOptions = Object.keys(clusterMethodsMap).map(k => `<option value="${k}" ${k === defaults.clusterMethod ? 'selected' : ''}>${k}</option>`).join('');
    let distanceMethodOptions = Object.keys(distanceMethodsMap).map(k => `<option value="${k}" ${k === defaults.distanceMethod ? 'selected' : ''}>${k}</option>`).join('');
    const plotlyColorScales = ['RdBu', 'Blues', 'Reds', 'YlGnBu', 'YlOrRd', 'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis', 'Greys', 'Picnic', 'Portland', 'Jet', 'Hot', 'Electric', 'Blackbody', 'Earth'];
    let colorScaleOptions = plotlyColorScales.map(scale =>
         `<option value="${scale}" ${scale === defaults.colorScale ? 'selected' : ''}>${scale}</option>`).join('');
    const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Helvetica'];
    let fontOptions = fontFamilies.map(font =>
        `<option value="${font}" ${font === defaults.fontFamily ? 'selected' : ''}>${font}</option>`).join('');

     return `
        <div class="control-subgroup">
             <p class="control-subgroup-title">Data Source & Preprocessing</p>
             <div class="mb-2">
                <label for="heatmap-row-label-col" class="form-label small">Row Label Column (optional):</label>
                 <input type="text" id="heatmap-row-label-col" class="form-control form-control-sm" value="${defaults.rowLabelCol}" placeholder="e.g., Gene/Sample ID column name">
            </div>
            <div class="mb-2">
                <label for="heatmap-scale" class="form-label small">Scale:</label>
                <select id="heatmap-scale" class="form-select form-select-sm">
                    <option value="row" ${defaults.scale === 'row' ? 'selected' : ''}>Row (Z-score)</option>
                    <option value="column" ${defaults.scale === 'column' ? 'selected' : ''}>Column (Z-score)</option>
                     <option value="none" ${defaults.scale === 'none' ? 'selected' : ''}>None</option>
                 </select>
             </div>
             <div class="form-check form-switch mb-2">
                 <input class="form-check-input" type="checkbox" id="heatmap-remove-constant-rows" ${defaults.removeConstantRows ? 'checked' : ''}>
                 <label class="form-check-label small" for="heatmap-remove-constant-rows">Remove rows with no variance</label>
            </div>
        </div>

         <div class="control-subgroup">
            <p class="control-subgroup-title">Clustering</p>
            <div class="row mb-2">
                 <div class="col-6">
                     <div class="form-check form-switch">
                         <input class="form-check-input" type="checkbox" id="heatmap-cluster-rows" ${defaults.clusterRows ? 'checked' : ''}>
                        <label class="form-check-label small" for="heatmap-cluster-rows">Cluster Rows</label>
                     </div>
                 </div>
                <div class="col-6">
                     <div class="form-check form-switch">
                         <input class="form-check-input" type="checkbox" id="heatmap-cluster-cols" ${defaults.clusterCols ? 'checked' : ''}>
                         <label class="form-check-label small" for="heatmap-cluster-cols">Cluster Columns</label>
                    </div>
                 </div>
            </div>
             <div class="mb-2">
                 <label for="heatmap-cluster-method" class="form-label small">Clustering Method:</label>
                <select id="heatmap-cluster-method" class="form-select form-select-sm" ${!(defaults.clusterRows || defaults.clusterCols) ? 'disabled' : ''}>${clusterMethodOptions}</select>
             </div>
            <div class="mb-3">
                 <label for="heatmap-distance-method" class="form-label small">Distance Method:</label>
                <select id="heatmap-distance-method" class="form-select form-select-sm" ${!(defaults.clusterRows || defaults.clusterCols) ? 'disabled' : ''}>${distanceMethodOptions}</select>
            </div>
        </div>

        <div class="control-subgroup">
            <p class="control-subgroup-title">Colors</p>
             <div class="mb-2">
                 <label for="heatmap-colorscale" class="form-label small">Color Scale:</label>
                <select id="heatmap-colorscale" class="form-select form-select-sm">${colorScaleOptions}</select>
                 <div class="form-text small">Select a predefined scale. Custom colors not implemented yet.</div>
            </div>
            <!-- Future Custom Color Controls -->
             <!--
            <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-4">Low Color:</label>
                 <div class="col-8"><input type="color" id="heatmap-lower-color" class="form-control-color" value="${defaults.lowerColor}"></div>
             </div>
            <div class="row mb-2 align-items-center gx-2">
                <label class="form-label small col-4">Mid Color:</label>
                 <div class="col-8"><input type="color" id="heatmap-middle-color" class="form-control-color" value="${defaults.middleColor}"></div>
             </div>
             <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-4">High Color:</label>
                 <div class="col-8"><input type="color" id="heatmap-higher-color" class="form-control-color" value="${defaults.higherColor}"></div>
            </div>
            -->
            <div class="row gx-2 mb-2">
                 <div class="col-6">
                    <label for="heatmap-z-min" class="form-label small">Color Scale Min:</label>
                     <input type="number" id="heatmap-z-min" class="form-control form-control-sm" placeholder="Auto" value="${defaults.zMin ?? ''}">
                 </div>
                 <div class="col-6">
                     <label for="heatmap-z-max" class="form-label small">Color Scale Max:</label>
                     <input type="number" id="heatmap-z-max" class="form-control form-control-sm" placeholder="Auto" value="${defaults.zMax ?? ''}">
                 </div>
             </div>
             <div class="form-check form-switch mb-2">
                 <input class="form-check-input" type="checkbox" id="heatmap-showscale" ${defaults.showScale ? 'checked' : ''}>
                 <label class="form-check-label small" for="heatmap-showscale">Show Color Bar</label>
             </div>
        </div>


        <div class="control-subgroup">
            <p class="control-subgroup-title">Display Options</p>
            <div class="mb-2">
                 <label for="heatmap-display-row-names" class="form-label small">Display Row Names:</label>
                 <select id="heatmap-display-row-names" class="form-select form-select-sm">
                     <option value="true" ${defaults.displayRowNames ? 'selected' : ''}>Yes</option>
                     <option value="false" ${!defaults.displayRowNames ? 'selected' : ''}>No</option>
                </select>
            </div>
             <div class="mb-2">
                <label for="heatmap-display-col-names" class="form-label small">Display Column Names:</label>
                <select id="heatmap-display-col-names" class="form-select form-select-sm">
                     <option value="true" ${defaults.displayColNames ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!defaults.displayColNames ? 'selected' : ''}>No</option>
                 </select>
            </div>
            <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="heatmap-show-grid" ${defaults.showGrid ? 'checked' : ''}>
                <label class="form-check-label small" for="heatmap-show-grid">Show Cell Borders (Grid)</label>
             </div>
             <div class="form-check form-switch mb-2">
                 <input class="form-check-input" type="checkbox" id="heatmap-show-numbers" ${defaults.showNumbers ? 'checked' : ''}>
                 <label class="form-check-label small" for="heatmap-show-numbers">Show Numbers in Cells</label>
            </div>
         </div>


         <div class="control-subgroup">
            <p class="control-subgroup-title">Fonts & Title</p>
             <div class="mb-2">
                 <label for="heatmap-font-family" class="form-label small">Font Family:</label>
                 <select id="heatmap-font-family" class="form-select form-select-sm">${fontOptions}</select>
            </div>
            <div class="mb-2">
                 <label for="heatmap-row-fontsize" class="form-label small">Row Label Fontsize:</label>
                 <input type="number" id="heatmap-row-fontsize" class="form-control form-control-sm" value="${defaults.rowFontsize}" step="0.5">
            </div>
             <div class="mb-2">
                 <label for="heatmap-col-fontsize" class="form-label small">Column Label Fontsize:</label>
                 <input type="number" id="heatmap-col-fontsize" class="form-control form-control-sm" value="${defaults.colFontsize}" step="0.5">
             </div>
             <div class="mb-3">
                 <label for="heatmap-number-fontsize" class="form-label small">In-Cell Number Fontsize:</label>
                 <input type="number" id="heatmap-number-fontsize" class="form-control form-control-sm" value="${defaults.numberFontsize}" step="0.5" ${!defaults.showNumbers ? 'disabled': ''}>
             </div>
              <div class="mb-2">
                <label for="heatmap-plot-title" class="form-label small">Plot Title:</label>
                 <input type="text" id="heatmap-plot-title" class="form-control form-control-sm" value="${defaults.plotTitle}">
             </div>
         </div>
     `;
 }

 export function addHeatmapEventListeners() {
    const rowClusterCheck = document.getElementById('heatmap-cluster-rows');
    const colClusterCheck = document.getElementById('heatmap-cluster-cols');
    const clusterMethodSelect = document.getElementById('heatmap-cluster-method');
    const distanceMethodSelect = document.getElementById('heatmap-distance-method');

    function toggleClusterParams() {
        const enabled = rowClusterCheck?.checked || colClusterCheck?.checked;
        if(clusterMethodSelect) clusterMethodSelect.disabled = !enabled;
        if(distanceMethodSelect) distanceMethodSelect.disabled = !enabled;
     }

    rowClusterCheck?.addEventListener('change', toggleClusterParams);
    colClusterCheck?.addEventListener('change', toggleClusterParams);

    const showNumbersCheck = document.getElementById('heatmap-show-numbers');
    const numberFontsizeInput = document.getElementById('heatmap-number-fontsize');
    showNumbersCheck?.addEventListener('change', () => {
        if(numberFontsizeInput) numberFontsizeInput.disabled = !showNumbersCheck.checked;
    });

     // Call once initially to set state based on defaults
     toggleClusterParams();
    if(numberFontsizeInput && showNumbersCheck) numberFontsizeInput.disabled = !showNumbersCheck.checked;
}

 export function createHeatmapPlot(plotDataInput, config) {
     if (!plotDataInput || plotDataInput.length === 0) return { error: "No data available." };

     let plotData = plotDataInput.map(row => ({...row})); // Shallow clone
     let yLabels = [];
     let xLabels = [];
     let numericMatrix = [];

    let dataCols = Object.keys(plotData[0]);

    // --- 1. Identify Row Labels and Numeric Columns ---
    let labelColFound = false;
     if (config.rowLabelCol && dataCols.includes(config.rowLabelCol)) {
         labelColFound = true;
         yLabels = plotData.map(row => String(row[config.rowLabelCol]).trim());
         dataCols = dataCols.filter(col => col !== config.rowLabelCol);
        console.log(`Using column "${config.rowLabelCol}" for row labels.`);
     } else {
        if (config.rowLabelCol) console.warn(`Specified row label column "${config.rowLabelCol}" not found. Using row indices.`);
         yLabels = plotData.map((_, index) => `Row ${index + 1}`);
     }
    xLabels = [...dataCols];

    // --- 2. Extract Numeric Matrix ---
     numericMatrix = plotData.map(row => {
        return dataCols.map(col => {
             const value = row[col];
             const numValue = parseFloat(value);
             return (value !== null && value !== '' && !isNaN(numValue)) ? numValue : null; // Treat empty strings as null too
        });
     });

     // Filter out any potential fully non-numeric rows that might have slipped through
     const validRows = numericMatrix.map((row, i) => row.some(v => v !== null) ? i : -1).filter(i => i !== -1);
    if (validRows.length === 0) return { error: "No valid numeric data found after extracting numeric values." };
     if (validRows.length < plotData.length) {
         numericMatrix = validRows.map(i => numericMatrix[i]);
         yLabels = validRows.map(i => yLabels[i]);
        console.log(`Filtered out ${plotData.length - validRows.length} non-numeric rows.`);
     }

    // --- 3. Remove Rows with No Variance (Optional) ---
    if (config.removeConstantRows) {
         const initialRowCount = numericMatrix.length;
         const varianceThreshold = 1e-9;
         const rowsToKeepIndices = numericMatrix.map((row, i) => {
            const validValues = row.filter(v => v !== null);
            if (validValues.length < 2) return i; // Keep rows with 0 or 1 value
            const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
             const variance = validValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / validValues.length;
             return variance > varianceThreshold ? i : -1;
         }).filter(i => i !== -1);

         if (rowsToKeepIndices.length === 0) return { error: "All rows have zero variance. Cannot plot heatmap." };

         numericMatrix = rowsToKeepIndices.map(i => numericMatrix[i]);
        yLabels = rowsToKeepIndices.map(i => yLabels[i]);
        console.log(`Removed ${initialRowCount - rowsToKeepIndices.length} rows with zero variance.`);
    }

    // --- 4. Apply Scaling (BEFORE Clustering) ---
     const scaledMatrix = scaleMatrix(numericMatrix, config.scale);


    // --- 5. Clustering (using scaled data) ---
    let rowOrder = scaledMatrix.map((_, i) => i);
    let colOrder = xLabels.map((_, i) => i);

     let clusterMethod = clusterMethodsMap[config.clusterMethod] || 'complete';
     let distanceFnRow, distanceFnCol;

     try {
         const distName = distanceMethodsMap[config.distanceMethod] || 'euclidean';
         if (distName === 'correlation') {
            distanceFnRow = correlationDistance;
             distanceFnCol = correlationDistance;
            console.log("Using custom Correlation Distance");
         } else {
             // For ml-hclust built-ins (or custom via string if library supports it)
             distanceFnRow = getDistanceFunction(distName);
             distanceFnCol = getDistanceFunction(distName); // Assuming same method for both
             console.log("Using Distance Method:", distName);
         }

         const hclustOptions = { linkage: clusterMethod, isDistance: false };

        if (config.clusterRows && scaledMatrix.length > 1) {
             console.log(`Clustering rows with method: ${clusterMethod}`);
             // Pass the distance function NAME string or the actual function
             hclustOptions.distance = typeof distanceFnRow === 'string' ? distanceFnRow : (idx1, idx2) => distanceFnRow(scaledMatrix[idx1], scaledMatrix[idx2]);
             const rowCluster = HClust.agnes(scaledMatrix, hclustOptions);
             rowOrder = rowCluster.indices();
        }

        if (config.clusterCols && scaledMatrix[0].length > 1) {
             console.log(`Clustering columns with method: ${clusterMethod}`);
             const transposedMatrix = scaledMatrix[0].map((_, colIndex) => scaledMatrix.map(row => row[colIndex]));
             hclustOptions.distance = typeof distanceFnCol === 'string' ? distanceFnCol : (idx1, idx2) => distanceFnCol(transposedMatrix[idx1], transposedMatrix[idx2]);
             const colCluster = HClust.agnes(transposedMatrix, hclustOptions);
            colOrder = colCluster.indices();
        }
     } catch (clusterError) {
         console.error("Clustering failed:", clusterError);
        displayError("Clustering failed: " + clusterError.message + ". Heatmap shown without clustering.");
         // Reset order to default if clustering fails
        rowOrder = scaledMatrix.map((_, i) => i);
        colOrder = xLabels.map((_, i) => i);
     }

    // --- 6. Apply Permutations ---
    // Use the ORIGINAL numeric matrix for display, but order based on SCALED data clustering
    const zValuesFinal = rowOrder.map(rIdx => colOrder.map(cIdx => numericMatrix[rIdx][cIdx]));
    const yLabelsFinal = rowOrder.map(rIdx => yLabels[rIdx]);
    const xLabelsFinal = colOrder.map(cIdx => xLabels[cIdx]);

    // --- 7. Prepare Trace ---
    const heatmapTrace = {
        z: zValuesFinal, x: xLabelsFinal, y: yLabelsFinal,
        type: 'heatmap',
        colorscale: config.colorScale, // Add logic here for custom scales if lower/mid/higher colors are provided
        showscale: config.showScale,
         xgap: config.showGrid ? 0.5 : 0, // Use small gap for grid effect
        ygap: config.showGrid ? 0.5 : 0,
         line: config.showGrid ? { color: 'grey', width: 0.5 } : {}, // Alternative border method
         zmin: (config.zMin === null || isNaN(config.zMin)) ? undefined : config.zMin,
         zmax: (config.zMax === null || isNaN(config.zMax)) ? undefined : config.zMax,
        zsmooth: false, // No smoothing for biological data usually
        hoverongaps: false,
        colorbar: { ticks: 'outside', len: 0.75, title: { side: 'right', font: { size: 10, family: config.fontFamily } } }
    };

    if (config.showNumbers) {
        heatmapTrace.text = zValuesFinal.map(row => row.map(val => val === null ? '' : val.toPrecision(2)));
        heatmapTrace.texttemplate = "%{text}";
         heatmapTrace.textfont = { size: config.numberFontsize, family: config.fontFamily };
         heatmapTrace.hoverinfo = 'none';
     } else {
        heatmapTrace.hoverinfo = 'x+y+z';
     }

    // --- 8. Layout ---
     const layout = {
         title: config.plotTitle,
         xaxis: {
             tickangle: -45, side: 'top', ticks: '',
             showticklabels: config.displayColNames,
             tickfont: { size: config.colFontsize, family: config.fontFamily },
            automargin: true
        },
        yaxis: {
             ticks: '', showticklabels: config.displayRowNames, autorange: 'reversed',
             tickfont: { size: config.rowFontsize, family: config.fontFamily },
            automargin: true
        },
        margin: { l: config.displayRowNames? 150 : 40, r: 40, t: config.displayColNames ? 100: 50, b: 50 }, // Increase left margin if showing long labels
         autosize: true,
         font: { family: config.fontFamily },
         paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', // Cleaner background
     };

    return { data: [heatmapTrace], layout: layout };
}