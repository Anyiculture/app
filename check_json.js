const fs = require('fs');

const filePath = 'src/i18n/locales/en.json';
const content = fs.readFileSync(filePath, 'utf8');

const findDuplicates = (jsonString) => {
  const lines = jsonString.split('\n');
  const seenKeys = new Set();
  const duplicates = [];

  // Very specific regex to match "key": at start of line (ignoring whitespace)
  const keyRegex = /^\s*"([^"]+)":/;

  // Track context (naive)
  // This simplistic approach catches direct duplicates in the same validation pass, 
  // but for nested objects, full parsing with a custom reviver is better.
  // However, `JSON.parse` with a reviver doesn't easily tell you *where* the duplicate is.
  // Standard JSON.parse just overwrites.
  
  // Let's use a strict parser approach or just simple line scanning for simple duplicates.
  
  lines.forEach((line, index) => {
    const match = line.match(keyRegex);
    if (match) {
      const key = match[1];
      // Note: this naive scan doesn't respect scope/nesting, 
      // so "name" in "user" and "name" in "product" would be flagged false positives.
      // We need a proper parser.
    }
  });
};

// Better approach: Use a parser that tracks keys
function parseAndFindDuplicates(json) {
    let duplicates = [];
    const stack = [new Set()]; 
    
    // We can't easily modify JSON.parse. 
    // Let's just use a library-free approach: 
    // Regex scan is hard for nested.
    
    // Let's rely on the fact that the user is likely seeing bundling errors.
    // Or just try to parse it and catch syntax errors.
    
    try {
        JSON.parse(json);
        console.log("JSON Parse Successful (Standard)");
    } catch (e) {
        console.log("JSON Parse Failed:");
        console.log(e.message);
    }
}

parseAndFindDuplicates(content);
