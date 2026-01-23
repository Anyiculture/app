
import json
import os
from collections import OrderedDict

def remove_duplicates(file_path):
    print(f"Processing {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse manually to find duplicates logic or use a library? 
        # Since standard json library doesn't detect duplicates easily (it just takes the last one),
        # we need to be careful. Warnings come from the IDE which detects them.
        # If we load and dump, we might lose the intended earlier keys or keep the later ones.
        # Usually, the later one overwrites. 
        # However, to explicitly clean them up and avoid data loss if the duplicate was intended to be elsewhere:
        # The user report shows duplicate keys in the *same object*.
        # Loading and dumping usually resolves this by keeping the last occurrence.
        # We need to make sure the structure is preserved.
        
        data = json.loads(content, object_pairs_hook=OrderedDict)
        
        # Writing it back out should remove duplicates (keeping the last one)
        # But we need to ensure indentation and standard formatting.
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully processed {file_path}")
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {file_path}: {e}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    en_path = os.path.join(base_dir, "src/i18n/locales/en.json")
    zh_path = os.path.join(base_dir, "src/i18n/locales/zh.json")
    
    remove_duplicates(en_path)
    remove_duplicates(zh_path)
