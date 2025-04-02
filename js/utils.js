// js/utils.js

function parseDelimitedText(text, filename) {
    const lines = text.trim().replace(/\r\n/g, '\n').split('\n'); // Normalize line endings
    if (lines.length < 2) {
        return { error: "File must have at least a header and one data row." };
    }

    // Robust delimiter detection (prioritize known extensions, then check content)
    let delimiter = ','; // Default to CSV
    if (filename) {
        const lowerFilename = filename.toLowerCase();
        if (lowerFilename.endsWith('.tsv') || lowerFilename.endsWith('.txt')) {
            delimiter = '\t';
        }
    }
    // Content check if delimiter not set by extension (simple check on header)
    if (delimiter === ',' && lines[0].includes('\t') && !lines[0].includes(',')){
         delimiter = '\t';
    } else if (delimiter === ',' && lines[0].includes(';') && !lines[0].includes(',')){
        delimiter = ';';
    }

    // Improved Header Parsing: Handles quotes and delimiter within quotes very basically
    const parseHeader = (line, del) => {
        // Very simplified CSV/TSV split - use PapaParse for full robustness
        return line.split(del).map(h => h.trim().replace(/^["'](.*)["']$/, '$1')); // Remove start/end quotes
    };

    let header = parseHeader(lines[0], delimiter);

     // Check for Byte Order Mark (BOM) commonly found in UTF-8 files from Windows
     if (header.length > 0 && header[0].charCodeAt(0) === 0xFEFF) {
         header[0] = header[0].slice(1); // Remove BOM
     }


    if (header.length === 0 || header.every(h => h === '')) {
       return { error: "Could not parse header row. Check delimiter and file format." };
    }

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple split, does NOT handle delimiters inside quoted fields correctly.
        // For robust parsing, consider using PapaParse: https://www.papaparse.com/
        const values = line.split(delimiter).map(v => v.trim().replace(/^["'](.*)["']$/, '$1'));

        // Be lenient if the number of values doesn't match header (e.g., trailing empty cells)
        // if (values.length !== header.length) {
        //    console.warn(`Row ${i+1} has ${values.length} values, header has ${header.length}. Proceeding cautiously.`);
        //    // You might want to pad values with empty strings or nulls, or discard the row
        // }

        const rowObject = {};
        header.forEach((key, index) => {
            // Ensure key is valid if values were shorter/longer than header
            if(key && index < values.length) {
                 let value = values[index];
                 // Attempt numeric conversion if not explicitly empty/null string
                 const numValue = parseFloat(value);
                 if (value !== null && value.trim() !== '' && !isNaN(numValue)) {
                     rowObject[key] = numValue;
                } else {
                    rowObject[key] = value; // Keep as string otherwise
                }
            } else if (key) {
                 rowObject[key] = null; // Pad missing values
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
}

function displayError(message, elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    // Ensure plot area reflects the error state
    document.getElementById('plot-placeholder')?.classList.add('d-none');
    document.getElementById('loading-indicator')?.style.display = 'none';
    document.getElementById('plot-output').innerHTML = ''; // Clear plot
    appState.plotlyInitialized = false; // Reset Plotly flag
}

function clearError(elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (!errorDiv) return;
    errorDiv.classList.add('d-none');
    errorDiv.textContent = '';
}

function setLoading(isLoading) {
    const loader = document.getElementById('loading-indicator');
    const plotOutput = document.getElementById('plot-output');
    const plotPlaceholder = document.getElementById('plot-placeholder');
    if (!loader || !plotOutput || !plotPlaceholder) return;

    if (isLoading) {
        loader.style.display = 'flex'; // Use flex to ensure spinner centering works
        plotOutput.style.opacity = '0.3'; // More pronounced dimming
        plotPlaceholder.classList.add('d-none');
        clearError(); // Clear previous errors when starting loading
    } else {
        loader.style.display = 'none';
        plotOutput.style.opacity = '1';
         // Only show placeholder if there's actually no plot yet
         if (!appState.plotlyInitialized) {
             plotPlaceholder.classList.remove('d-none');
         }
    }
}