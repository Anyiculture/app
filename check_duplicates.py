from collections import defaultdict
import json

def check_duplicates(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple lexical scanner for keys
    lines = content.split('\n')
    key_counts = defaultdict(list)
    
    for i, line in enumerate(lines):
        line = line.strip()
        if line.startswith('"') and '":' in line:
            key = line.split('":')[0].strip('"')
            # Indentation matters for true depth check, but quick scan helps
            # If "jobs" appears twice at same indentation...
            key_counts[key].append(i + 1)
            
    for k, lines in key_counts.items():
        if len(lines) > 1:
            print(f'Duplicate key potential: "{k}" at lines {lines}')

check_duplicates('src/i18n/locales/zh.json')
