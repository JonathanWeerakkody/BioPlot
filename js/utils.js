// js/utils.js

function parseDelimitedText(text, filename) {
    const lines = text.trim().replace(/\r\n/g, '\n').split('\n'); // Normalize line endings
    if (lines.length < 2) {
        return { error: "File must have at least a header and one data row." };
    }

    // Robust delimiter detection
    let delimiter = ',';
    if (filename) {
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.endsWith('.tsv') || lowerFilename.endsWith('.txt')) {
            delimiter = '\t';
        }
    }
    if (delimiter === ',' && lines[0].includes('\t') && !lines[0].includes(',')){
         delimiter = '\t';
    } else if (delimiter === ',' && lines[0].includes(';') && !lines[0].includes(',')){
        delimiter = ';';
    }

    // Header Parsing
    const parseHeader = (line, del) => {
        return line.split(del).map(h => h.trim().replace(/^["'](.*)["']$/, '$1'));
    };
    let header = parseHeader(lines[0], delimiter);
     if (header.length > 0 && header[0].charCodeAt(0) === 0xFEFF) { // Check for BOM
         header[0] = header[0].slice(1);
     }
    if (header.length === 0 || header.every(h => h === '')) {
       return { error: "Could not parse header row. Check delimiter and file format." };
    }

    // Data Parsing
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(delimiter).map(v => v.trim().replace(/^["'](.*)["']$/, '$1'));
        const rowObject = {};
        header.forEach((key, index) => {
            if(key && index < values.length) {
                 let value = values[index];
                 const numValue = parseFloat(value);
                 if (value !== null && value.trim() !== '' && !isNaN(numValue)) {
                     rowObject[key] = numValue;
                } else {
                    rowObject[key] = value;
                }
            } else if (key) {
                 rowObject[key] = null; // Pad missing
             }
        });
        data.push(rowObject);
    }

    if (data.length === 0) {
        return { error: "No valid data rows found after the header." };
    }

    console.log("Parsed Header:", header);
    console.log(`Parsed ${data.length} data rows.`);
    return { data: data, header: header };
} // End of parseDelimitedText

function displayError(message, elementId = 'error-message') {
    // IMPORTANT: This function relies on appState being globally accessible (defined in main.js)
    // Ensure utils.js is loaded AFTER main.js OR restructure to pass appState.
    const errorDiv = document.getElementById(elementId);
    if (!errorDiv) return;

    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');

    document.getElementById('plot-placeholder')?.classList.add('d-none');
    document.getElementById('loading-indicator')?.style.display = 'none';
    const plotOutput = document.getElementById('plot-output');
    if (plotOutput) plotOutput.innerHTML = '';

    // Check if appState is defined before trying to access its properties
    if (typeof appState !== 'undefined') {
       appState.plotlyInitialized = false; // This assignment is correct
    } else {
       console.warn("appState not accessible in displayError function. Check script load order or structure.");
    }
} // End of displayError

function clearError(elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (!errorDiv) return;
    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';
} // End of clearError


// Check this function carefully, especially around line 92 in YOUR file
function setLoading(isLoading) {
    const loader = document.getElementById('loading-indicator');
    const plotOutput = document.getElementById('plot-output');
    const plotPlaceholder = document.getElementById('plot-placeholder');
    // Ensure elements exist before proceeding
    if (!loader || !plotOutput || !plotPlaceholder) {
       console.warn("Missing required elements for setLoading (loader, plotOutput, or plotPlaceholder)");
       return;
    }

    if (isLoading) {
        loader.style.display = 'flex';
        plotOutput.style.opacity = '0.3';
        plotPlaceholder.classList.add('d-none');
        clearError(); // Assumes clearError is defined
    } else {
        loader.style.display = 'none';
        plotOutput.style.opacity = '1';

        // Only show placeholder if there's actually no plot yet
        // IMPORTANT: This also relies on appState being accessible
        let isInitialized = false;
         if (typeof appState !== 'undefined') {
            isInitialized = appState.plotlyInitialized;
         } else {
             console.warn("appState not accessible in setLoading function. Check script load order or structure.");
             // Default to assuming not initialized if appState is unavailable
         }

         // Check around this 'if' statement (approx line 92) in your file:
         // Did you accidentally write "if (!appState.plotlyInitialized = something)"?
        if (!isInitialized) {
            plotPlaceholder.classList.remove('d-none');
        }
    }
} // End of setLoading