"""
Fixes duplicate top-level keys in en.json by merging them.
"""
import json
import re

INPUT = r"src\i18n\locales\en.json"
OUTPUT = r"src\i18n\locales\en.json"

def load_with_duplicates(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def pairs_hook(pairs):
        result = {}
        for key, value in pairs:
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key].update(value)
            else:
                result[key] = value
        return result
    
    return json.loads(content, object_pairs_hook=pairs_hook)

def main():
    print(f"Reading {INPUT}...")
    data = load_with_duplicates(INPUT)
    
    print(f"Writing merged JSON to {OUTPUT}...")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    print("Done! Duplicate keys merged successfully.")
    
    with open(OUTPUT, 'r', encoding='utf-8') as f:
        content = f.read()
    
    keys = re.findall(r'^\s{0,2}"([^"]+)":', content, re.MULTILINE)
    from collections import Counter
    counts = Counter(keys)
    dups = {k: v for k, v in counts.items() if v > 1}
    if dups:
        print(f"WARNING: Still found duplicates: {dups}")
    else:
        print("Verification OK: No duplicate top-level keys found.")

if __name__ == "__main__":
    main()
