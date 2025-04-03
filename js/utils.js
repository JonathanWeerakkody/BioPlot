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
            if(key !== undefined && key !== null && index < values.length) { // Ensure key exists before assignment
                let value = values[index];
                const numValue = parseFloat(value);
                if (value !== null && value.trim() !== '' && !isNaN(numValue)) {
                    rowObject[key] = numValue;
                } else {
                    rowObject[key] = value;
                }
            } else if (key !== undefined && key !== null) { // Key exists but value doesn't (ragged data)
                rowObject[key] = null; // Pad missing
            }
        });
        // Add row only if it has at least one property matching a header key
        if(Object.keys(rowObject).length > 0) {
            data.push(rowObject);
        }
    }


    if (data.length === 0) {
        return { error: "No valid data rows found after the header." };
    }

    console.log("Parsed Header:", header);
    console.log(`Parsed ${data.length} data rows.`);
    return { data: data, header: header };
}

// Make the parser available for import in main.js
export { parseDelimitedText };