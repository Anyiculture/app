import re
import json

source_file = 'src/components/HostFamilyOnboarding.tsx'
locale_file = 'src/i18n/locales/en.json'

def get_keys_from_source():
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find t('key') or t("key")
    # Also handles t('key', "Default") if simple
    matches = re.findall(r"t\(['\"]([\w\.]+)['\"]", content)
    return set(matches)

def check_keys(keys):
    with open(locale_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    missing = []
    existing = []

    for key in keys:
        parts = key.split('.')
        current = data
        found = True
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                found = False
                break
        
        if not found:
            missing.append(key)
        else:
            existing.append(key)

    return missing, existing

if __name__ == "__main__":
    keys = get_keys_from_source()
    missing, existing = check_keys(keys)
    
    print(f"Total keys found in source: {len(keys)}")
    print(f"Missing keys ({len(missing)}):")
    for k in sorted(missing):
        print(f"  {k}")
