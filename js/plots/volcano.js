// js/plots/volcano.js

export const volcanoPlotDefaults = {
    fcCol: 'log2FoldChange',
    pvalCol: 'pvalue', // Adjusted default based on example data
    geneCol: 'gene_name', // Adjusted default
    labelGeneList: '', // Genes to specifically label
    pMin: 1e-100, // P-value floor
    fcThreshold: 2.0,
    pvalThreshold: 0.05,
    upColor: '#F39B7F', // Example colors
    downColor: '#4DBBD5',
    nsColor: '#A6A6A6',
    upText: 'Up regulated',
    downText: 'Down regulated',
    nsText: 'Not sig',
    pointSize: 80, // Plotly uses area-like size, needs scaling in plot function
    markerShape: 'circle',
    markerAlpha: 0.7,
    showGrid: true,
    plotTitle: 'Volcano Plot',
    xAxisLabel: 'log2(Fold Change)', // Default, allow override
    yAxisLabel: '-log10(Pvalue)',   // Default, allow override
    ticksFontsize: 18.0,
    labelFontsize: 24.0,
    legendFontsize: 14.0,
    labelGeneFontsize: 14.0,
    lineColor: '#000000', // Threshold lines/axes
    labelGeneColor: '#FF0000',
    labelGeneOffsetX: 0,
    labelGeneOffsetY: 0,
    fontFamily: 'Arial',
    xMin: null, // Use null or '' for auto
    xMax: null,
    yMax: null,
};

export function getVolcanoPlotControlsHTML(defaults) {
    const markerShapes = ['circle', 'square', 'diamond', 'cross', 'x', 'triangle-up', 'triangle-down', 'star'];
    let shapeOptions = markerShapes.map(shape =>
        `<option value="${shape}" ${shape === defaults.markerShape ? 'selected' : ''}>${shape}</option>`
    ).join('');

    const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma', 'Helvetica'];
     let fontOptions = fontFamilies.map(font =>
        `<option value="${font}" ${font === defaults.fontFamily ? 'selected' : ''}>${font}</option>`
     ).join('');


    return `
        <div class="control-subgroup">
            <p class="control-subgroup-title">Data Columns</p>
            <div class="mb-2">
                <label for="volcano-fc-col" class="form-label small">Fold Change Column:</label>
                <input type="text" id="volcano-fc-col" class="form-control form-control-sm" value="${defaults.fcCol}">
            </div>
            <div class="mb-2">
                <label for="volcano-pval-col" class="form-label small">P-value Column:</label>
                <input type="text" id="volcano-pval-col" class="form-control form-control-sm" value="${defaults.pvalCol}">
            </div>
            <div class="mb-2">
                <label for="volcano-gene-col" class="form-label small">Gene Label Column:</label>
                <input type="text" id="volcano-gene-col" class="form-control form-control-sm" value="${defaults.geneCol}">
            </div>
        </div>

        <div class="control-subgroup">
            <p class="control-subgroup-title">Cutoffs & Thresholds</p>
            <div class="mb-2">
                <label for="volcano-fc-thresh" class="form-label small">Fold Change Cutoff (&ge;):</label>
                 <input type="number" id="volcano-fc-thresh" class="form-control form-control-sm" value="${defaults.fcThreshold}" step="0.1">
                 <div class="form-text small">Absolute value of Log2 Fold Change.</div>
             </div>
            <div class="mb-2">
                 <label for="volcano-pval-thresh" class="form-label small">P-value Cutoff (&le;):</label>
                 <input type="number" id="volcano-pval-thresh" class="form-control form-control-sm" value="${defaults.pvalThreshold}" step="0.001" min="0" max="1">
             </div>
            <div class="mb-2">
                <label for="volcano-p-min" class="form-label small">P-value Floor:</label>
                 <input type="number" id="volcano-p-min" class="form-control form-control-sm" value="${defaults.pMin}" step="1e-10" min="0">
                 <div class="form-text small">P-values less than this are set to this value (e.g., 1e-100).</div>
            </div>
        </div>

        <div class="control-subgroup">
             <p class="control-subgroup-title">Appearance: Points & Lines</p>
             <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-5">Up Reg Color:</label>
                 <div class="col-7"><input type="color" id="volcano-up-color" class="form-control-color" value="${defaults.upColor}"></div>
             </div>
             <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-5">Down Reg Color:</label>
                 <div class="col-7"><input type="color" id="volcano-down-color" class="form-control-color" value="${defaults.downColor}"></div>
             </div>
             <div class="row mb-2 align-items-center gx-2">
                  <label class="form-label small col-5">Non Sig Color:</label>
                  <div class="col-7"><input type="color" id="volcano-ns-color" class="form-control-color" value="${defaults.nsColor}"></div>
             </div>
             <hr class="my-2">
             <div class="mb-2">
                <label for="volcano-marker-alpha" class="form-label small">Marker Transparency (Alpha): <span id="volcano-marker-alpha-label">${defaults.markerAlpha}</span></label>
                <input type="range" id="volcano-marker-alpha" class="form-range" min="0.1" max="1" step="0.05" value="${defaults.markerAlpha}">
            </div>
            <div class="mb-2">
                <label for="volcano-point-size" class="form-label small">Marker Size: <span id="volcano-point-size-label">${defaults.pointSize}</span></label>
                <input type="range" id="volcano-point-size" class="form-range" min="1" max="200" step="1" value="${defaults.pointSize}">
                 <div class="form-text small">Controls relative marker area.</div>
            </div>
            <div class="mb-3">
                <label for="volcano-marker-shape" class="form-label small">Marker Shape:</label>
                 <select id="volcano-marker-shape" class="form-select form-select-sm">${shapeOptions}</select>
             </div>
            <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-5">Threshold Line Color:</label>
                 <div class="col-7"><input type="color" id="volcano-line-color" class="form-control-color" value="${defaults.lineColor}"></div>
             </div>
            <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="volcano-show-grid" ${defaults.showGrid ? 'checked' : ''}>
                <label class="form-check-label small" for="volcano-show-grid">Show Grid Lines</label>
            </div>
        </div>

        <div class="control-subgroup">
            <p class="control-subgroup-title">Labels & Text</p>
             <div class="mb-2">
                 <label for="volcano-plot-title" class="form-label small">Plot Title:</label>
                <input type="text" id="volcano-plot-title" class="form-control form-control-sm" value="${defaults.plotTitle}">
            </div>
            <div class="mb-2">
                <label for="volcano-x-axis-label" class="form-label small">X Axis Label:</label>
                <input type="text" id="volcano-x-axis-label" class="form-control form-control-sm" value="${defaults.xAxisLabel}">
            </div>
            <div class="mb-2">
                 <label for="volcano-y-axis-label" class="form-label small">Y Axis Label:</label>
                <input type="text" id="volcano-y-axis-label" class="form-control form-control-sm" value="${defaults.yAxisLabel}">
             </div>
            <hr class="my-2">
            <div class="mb-2">
                 <label for="volcano-up-text" class="form-label small">Legend: Up Reg Text:</label>
                <input type="text" id="volcano-up-text" class="form-control form-control-sm" value="${defaults.upText}">
            </div>
            <div class="mb-2">
                 <label for="volcano-down-text" class="form-label small">Legend: Down Reg Text:</label>
                <input type="text" id="volcano-down-text" class="form-control form-control-sm" value="${defaults.downText}">
            </div>
             <div class="mb-2">
                 <label for="volcano-ns-text" class="form-label small">Legend: Non Sig Text:</label>
                 <input type="text" id="volcano-ns-text" class="form-control form-control-sm" value="${defaults.nsText}">
             </div>
             <hr class="my-2">
             <div class="mb-2">
                <label for="volcano-label-gene-list" class="form-label small">Genes to Label (one per line):</label>
                 <textarea id="volcano-label-gene-list" class="form-control form-control-sm" rows="4">${defaults.labelGeneList}</textarea>
            </div>
             <div class="row mb-2 align-items-center gx-2">
                 <label class="form-label small col-6">Labeled Gene Color:</label>
                 <div class="col-6"><input type="color" id="volcano-label-gene-color" class="form-control-color" value="${defaults.labelGeneColor}"></div>
             </div>
             <div class="row gx-2 mb-2">
                 <div class="col-6">
                    <label for="volcano-label-gene-offset-x" class="form-label small">Label X Offset:</label>
                    <input type="number" id="volcano-label-gene-offset-x" class="form-control form-control-sm" value="${defaults.labelGeneOffsetX}" step="1">
                 </div>
                 <div class="col-6">
                     <label for="volcano-label-gene-offset-y" class="form-label small">Label Y Offset:</label>
                     <input type="number" id="volcano-label-gene-offset-y" class="form-control form-control-sm" value="${defaults.labelGeneOffsetY}" step="1">
                </div>
             </div>
        </div>

         <div class="control-subgroup">
             <p class="control-subgroup-title">Fonts & Sizing</p>
              <div class="mb-2">
                 <label for="volcano-font-family" class="form-label small">Font Family:</label>
                 <select id="volcano-font-family" class="form-select form-select-sm">${fontOptions}</select>
            </div>
              <div class="mb-2">
                 <label for="volcano-ticks-fontsize" class="form-label small">Ticks Fontsize:</label>
                 <input type="number" id="volcano-ticks-fontsize" class="form-control form-control-sm" value="${defaults.ticksFontsize}" step="0.5">
             </div>
             <div class="mb-2">
                  <label for="volcano-label-fontsize" class="form-label small">Axis Label Fontsize:</label>
                 <input type="number" id="volcano-label-fontsize" class="form-control form-control-sm" value="${defaults.labelFontsize}" step="0.5">
            </div>
            <div class="mb-2">
                  <label for="volcano-legend-fontsize" class="form-label small">Legend Fontsize:</label>
                 <input type="number" id="volcano-legend-fontsize" class="form-control form-control-sm" value="${defaults.legendFontsize}" step="0.5">
             </div>
              <div class="mb-2">
                  <label for="volcano-label-gene-fontsize" class="form-label small">Labeled Gene Fontsize:</label>
                  <input type="number" id="volcano-label-gene-fontsize" class="form-control form-control-sm" value="${defaults.labelGeneFontsize}" step="0.5">
              </div>
         </div>

         <div class="control-subgroup">
             <p class="control-subgroup-title">Axis Limits</p>
            <div class="row gx-2 mb-2">
                <div class="col-6">
                     <label for="volcano-x-min" class="form-label small">X Axis Min:</label>
                     <input type="number" id="volcano-x-min" class="form-control form-control-sm" placeholder="Auto" value="${defaults.xMin ?? ''}">
                </div>
                 <div class="col-6">
                      <label for="volcano-x-max" class="form-label small">X Axis Max:</label>
                     <input type="number" id="volcano-x-max" class="form-control form-control-sm" placeholder="Auto" value="${defaults.xMax ?? ''}">
                 </div>
             </div>
             <div class="mb-2">
                  <label for="volcano-y-max" class="form-label small">Y Axis Max:</label>
                 <input type="number" id="volcano-y-max" class="form-control form-control-sm" placeholder="Auto" value="${defaults.yMax ?? ''}">
                  <div class="form-text small">Y axis min is always 0 for -Log10(P).</div>
             </div>
         </div>
    `;
}

export function addVolcanoEventListeners() {
    // Link range sliders to their labels for live updates
    const alphaSlider = document.getElementById('volcano-marker-alpha');
    const alphaLabel = document.getElementById('volcano-marker-alpha-label');
    if (alphaSlider && alphaLabel) {
        alphaSlider.addEventListener('input', (event) => {
            alphaLabel.textContent = parseFloat(event.target.value).toFixed(2);
        });
    }

    const sizeSlider = document.getElementById('volcano-point-size');
    const sizeLabel = document.getElementById('volcano-point-size-label');
     if (sizeSlider && sizeLabel) {
        sizeSlider.addEventListener('input', (event) => {
            sizeLabel.textContent = event.target.value;
        });
     }
}


export function createVolcanoPlot(data, config) {
    if (!data || data.length === 0) return { error: "No data available." };
    if (!config.fcCol || !config.pvalCol) return { error: "Fold change and P-value columns must be specified." };
    if (!data[0].hasOwnProperty(config.fcCol)) return { error: `Column "${config.fcCol}" not found in data.` };
    if (!data[0].hasOwnProperty(config.pvalCol)) return { error: `Column "${config.pvalCol}" not found in data.` };
    if (config.geneCol && !data[0].hasOwnProperty(config.geneCol)) {
        console.warn(`Gene label column "${config.geneCol}" specified but not found. Hover/labeling disabled.`);
        config.geneCol = null;
    }

    const upData = { x: [], y: [], text: [] };
    const downData = { x: [], y: [], text: [] };
    const nsData = { x: [], y: [], text: [] };
    const annotations = [];
    const genesToLabelSet = new Set(
       config.labelGeneList.split(/[\n\s,]+/).map(g => g.trim()).filter(g => g) // More robust split
    );

    let minY = 0, maxY = 0;
    let minX = 0, maxX = 0;
    let absFC = Math.abs(config.fcThreshold) // Ensure positive FC threshold for comparison

    data.forEach(row => {
        const fc = row[config.fcCol];
        let pval = row[config.pvalCol];
        const gene = config.geneCol ? String(row[config.geneCol]).trim() : ''; // Ensure string and trimmed

        if (typeof fc !== 'number' || isNaN(fc) || typeof pval !== 'number' || isNaN(pval)) {
            return; // Skip rows with non-numeric crucial values
        }

        if (pval <= 0) pval = config.pMin > 0 ? config.pMin : Number.MIN_VALUE;
        if (pval < config.pMin && config.pMin > 0) pval = config.pMin;

        const negLog10Pval = -Math.log10(pval);

        if (!isFinite(negLog10Pval)) return;

        minX = Math.min(minX, fc);
        maxX = Math.max(maxX, fc);
        maxY = Math.max(maxY, negLog10Pval);

        let targetData = nsData;

        if (pval <= config.pvalThreshold) {
            if (fc >= absFC) {
                targetData = upData;
            } else if (fc <= -absFC) {
                targetData = downData;
           }
        }

        targetData.x.push(fc);
        targetData.y.push(negLog10Pval);
        targetData.text.push(gene); // Use gene name for hover text, empty if none

        if (gene && genesToLabelSet.has(gene)) {
            annotations.push({
                x: fc,
                y: negLog10Pval,
                xref: 'x', yref: 'y', text: gene, showarrow: false,
                xanchor: 'left', yanchor: 'bottom',
                font: { color: config.labelGeneColor, size: config.labelGeneFontsize, family: config.fontFamily, },
                xshift: config.labelGeneOffsetX || 0,
                yshift: config.labelGeneOffsetY || 0,
            });
        }
    });

    // Attempt to estimate a reasonable marker size based on the "area-like" input
    // This scaling might need adjustment based on visual feedback.
    const markerSizePx = Math.max(1, Math.sqrt(config.pointSize / Math.PI) * 2.5);

    const baseMarkerConfig = {
        size: markerSizePx,
        symbol: config.markerShape,
        opacity: config.markerAlpha,
        line: { width: 0.5, color: 'darkgrey' } // Optional thin border on markers
    };

    const traces = [
        {
            x: nsData.x, y: nsData.y, text: nsData.text,
            mode: 'markers', type: 'scattergl', name: `${config.nsText} (${nsData.x.length})`,
            marker: { ...baseMarkerConfig, color: config.nsColor },
            hoverinfo: (config.geneCol && nsData.text.some(t=>t)) ? 'x+y+text' : 'x+y',
        },
        {
            x: downData.x, y: downData.y, text: downData.text,
            mode: 'markers', type: 'scattergl', name: `${config.downText} (${downData.x.length})`,
            marker: { ...baseMarkerConfig, color: config.downColor },
            hoverinfo: (config.geneCol && downData.text.some(t=>t)) ? 'x+y+text' : 'x+y',
        },
        {
            x: upData.x, y: upData.y, text: upData.text,
            mode: 'markers', type: 'scattergl', name: `${config.upText} (${upData.x.length})`,
            marker: { ...baseMarkerConfig, color: config.upColor },
            hoverinfo: (config.geneCol && upData.text.some(t=>t)) ? 'x+y+text' : 'x+y',
        }
    ];

    // --- Calculate Axis Ranges ---
    const xPadding = Math.max(1, (maxX - minX) * 0.05); // Ensure padding of at least 1 unit
    const xRange = [ config.xMin ?? Math.floor(minX - xPadding), config.xMax ?? Math.ceil(maxX + xPadding)];
    const calculatedYMax = Math.ceil(maxY + 0.05 * maxY) || 10; // Add padding, ensure minimum if maxY is 0
    const thresholdY = config.pvalThreshold > 0 ? (-Math.log10(config.pvalThreshold) + Math.max(1, maxY * 0.02)) : calculatedYMax; // Add padding above threshold line too
    const yRange = [0, config.yMax ?? Math.max(calculatedYMax, thresholdY)];


    // --- Layout ---
    const layout = {
        title: {
            text: config.plotTitle,
            font: { size: Math.max(10, config.labelFontsize), family: config.fontFamily, weight: 'bold' } // Adjust title font based on axis labels?
        },
        xaxis: {
            title: { text: config.xAxisLabel, font: { size: config.labelFontsize, family: config.fontFamily } },
            tickfont: { size: config.ticksFontsize, family: config.fontFamily },
            showgrid: config.showGrid, gridcolor: '#e0e0e0', zeroline: false,
            range: xRange
        },
        yaxis: {
            title: { text: config.yAxisLabel, font: { size: config.labelFontsize, family: config.fontFamily } },
            tickfont: { size: config.ticksFontsize, family: config.fontFamily },
            showgrid: config.showGrid, gridcolor: '#e0e0e0', zeroline: false,
            range: yRange
        },
        hovermode: 'closest',
        margin: { l: 70, r: 30, t: 60, b: 60 }, // Base margins
        legend: {
            font: { size: config.legendFontsize, family: config.fontFamily },
            itemsizing: 'constant', traceorder: 'reversed'
        },
        shapes: config.pvalThreshold > 0 ? [ // Add shapes only if pval threshold makes sense
            { type: 'line', x0: xRange[0], y0: -Math.log10(config.pvalThreshold), x1: xRange[1], y1: -Math.log10(config.pvalThreshold), line: { color: config.lineColor, width: 1, dash: 'dash' } },
            { type: 'line', x0: absFC, y0: 0, x1: absFC, y1: yRange[1], line: { color: config.lineColor, width: 1, dash: 'dash' } },
            { type: 'line', x0: -absFC, y0: 0, x1: -absFC, y1: yRange[1], line: { color: config.lineColor, width: 1, dash: 'dash' } }
        ] : [ // Add only FC lines if no p-value threshold
             { type: 'line', x0: absFC, y0: 0, x1: absFC, y1: yRange[1], line: { color: config.lineColor, width: 1, dash: 'dash' } },
             { type: 'line', x0: -absFC, y0: 0, x1: -absFC, y1: yRange[1], line: { color: config.lineColor, width: 1, dash: 'dash' } }
        ],
        annotations: annotations,
        showlegend: true,
        font: { family: config.fontFamily }, // Base font
        paper_bgcolor: 'rgba(255,255,255,1)', plot_bgcolor: '#ffffff',
        autosize: true, // Important for responsiveness initially
    };

    // console.log("Volcano Plotly Fig:", { data: traces, layout: layout }); // Debug output
    return { data: traces, layout: layout };
}