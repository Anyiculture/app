import json
import os

def deduplicate(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Try to fix common trailing comma issues before parsing
            # (Though json.loads is strict)
            data = json.loads(content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully deduplicated {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    deduplicate(r'c:\Users\OMEN\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\i18n\locales\zh.json')
    deduplicate(r'c:\Users\OMEN\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main\src\i18n\locales\en.json')
