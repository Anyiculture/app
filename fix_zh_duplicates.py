"""
Fixes duplicate top-level keys in zh.json by merging them.
For each key that appears more than once, all values are merged (later entries update earlier ones),
then only the first occurrence position is kept.
"""
import json
import re
import sys

INPUT = r"src\i18n\locales\zh.json"
OUTPUT = r"src\i18n\locales\zh.json"

def load_with_duplicates(path):
    """Load JSON, collecting duplicate keys by merging their contents."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Use object_pairs_hook to handle duplicates at parse time
    merged = {}
    def pairs_hook(pairs):
        result = {}
        for key, value in pairs:
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                # Deep merge: update existing dict with new dict's keys
                result[key].update(value)
            else:
                result[key] = value
        return result
    
    data = json.loads(content, object_pairs_hook=pairs_hook)
    return data

def main():
    print(f"Reading {INPUT}...")
    data = load_with_duplicates(INPUT)
    
    print(f"Writing merged JSON to {OUTPUT}...")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    
    print("Done! Duplicate keys merged successfully.")
    
    # Verify no duplicates remain by reading back
    with open(OUTPUT, 'r', encoding='utf-8') as f:
        content = f.read()
    
    keys = re.findall(r'^\s{0,2}"([^"]+)":', content, re.MULTILINE)
    from collections import Counter
    counts = Counter(keys)
    dups = {k: v for k, v in counts.items() if v > 1}
    if dups:
        print(f"WARNING: Still found duplicates at top level: {dups}")
    else:
        print("Verification OK: No duplicate top-level keys found.")

if __name__ == "__main__":
    main()
