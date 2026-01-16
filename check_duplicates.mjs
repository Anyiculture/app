import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src/i18n/locales/en.json');

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keys = new Set();
const stack = []; // To track nesting if we wanted, but simple line regex is enough for "same indent" duplicates

console.log("Checking for duplicate keys...");

let duplicates = 0;
// Naive check: Find all "key": 
// Use a map of "indent + key" -> count.
const keyMap = new Map();

lines.forEach((line, lineNum) => {
    const match = line.match(/^(\s*)"([^"]+)":/);
    if (match) {
        const indent = match[1].length;
        const key = match[2];
        const combined = `${indent}:${key}`;
        
        if (keyMap.has(combined)) {
            console.log(`Duplicate found on line ${lineNum + 1}: "${key}"`);
            duplicates++;
        } else {
            keyMap.set(combined, true);
        }
    }
});

if (duplicates === 0) {
    console.log("No obvious duplicates found.");
} else {
    console.log(`Found ${duplicates} duplicates.`);
}
