const fs = require('fs');

const content = fs.readFileSync('src/i18n/locales/en.json', 'utf-8');
let balance = 0;
let line = 1;
let col = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '\n') {
    line++;
    col = 0;
  } else {
    col++;
  }

  if (char === '{') {
    balance++;
  } else if (char === '}') {
    balance--;
  }

  if (balance < 0) {
    console.log(`Negative balance (extra }) at Line ${line}, Column ${col}`);
    process.exit(1);
  }
  
  if (balance === 0 && i < content.length - 1) {
     // Check if only whitespace remains
     const remaining = content.slice(i+1).trim();
     if (remaining.length > 0) {
       console.log(`Root object closed at Line ${line}, Column ${col}. Remaining content found: "${remaining.slice(0, 50)}..."`);
       process.exit(1);
     }
  }
}

if (balance > 0) {
  console.log(`Positive balance (missing }) at end of file. Balance: ${balance}`);
} else {
  console.log("Braces balanced.");
}
