import json
import re
import os

file_path = 'src/i18n/locales/en.json'

def fix_json_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Attempt to fix trailing commas (common error)
    # Replace ,} with } and ,] with ]
    fixed_content = re.sub(r',\s*\}', '}', content)
    fixed_content = re.sub(r',\s*\]', ']', fixed_content)

    try:
        # 2. Parse with allow_duplicates logic (standard json.loads takes last)
        data = json.loads(fixed_content)
        print("Successfully parsed JSON after regex fix.")
        
        # 3. Save it back to standard format (this removes duplicates and fixes formatting)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Saved cleaned JSON.")
        return True

    except json.JSONDecodeError as e:
        print(f"Still invalid after regex fix: {e}")
        # Print the context of the error
        lines = fixed_content.splitlines()
        try:
            print(f"Context at line {e.lineno}:")
            print(lines[e.lineno-2]) # line before
            print(lines[e.lineno-1]) # error line
            print(lines[e.lineno])   # line after
        except Exception:
            pass
        return False

# Run the fix
fix_json_file(file_path)
