import json
import collections
import re

en_file = 'src/i18n/locales/en.json'
zh_file = 'src/i18n/locales/zh.json'
component_file = 'src/components/ui/LocationCascade.tsx'

new_keys_en = {
    "common": {
        "location": {
            "country": "Country",
            "selectCountry": "Select Country",
            "province": "Province",
            "selectProvince": "Select Province",
            "city": "City",
            "selectCity": "Select City",
            "otherCity": "Other",
            "enterCityName": "Enter city name",
            "currentLocation": "Current Location"
        }
    }
}

new_keys_zh = {
    "common": {
        "location": {
            "country": "国家",
            "selectCountry": "选择国家",
            "province": "省份/州",
            "selectProvince": "选择省份/州",
            "city": "城市",
            "selectCity": "选择城市",
            "otherCity": "其他",
            "enterCityName": "请输入城市名称",
            "currentLocation": "当前位置"
        }
    }
}

def update_json(file_path, new_keys_data):
    print(f"Updating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        
        # Merge
        if "common" in data:
            if not isinstance(data["common"], dict):
                print(f"WARNING: 'common' is not a dict, it is {type(data['common'])}. Renaming to 'common_legacy'.")
                data["common_legacy"] = data["common"]
                data["common"] = collections.OrderedDict()
        else:
            data["common"] = collections.OrderedDict()
        
        if "location" not in data["common"] or not isinstance(data["common"]["location"], dict):
             if "location" in data["common"]:
                print(f"WARNING: 'common.location' is {type(data['common']['location'])}. Overwriting.")
             data["common"]["location"] = collections.OrderedDict()
             
        for k, v in new_keys_data["common"]["location"].items():
            data["common"]["location"][k] = v
            
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("JSON Update Success.")
        
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

def update_component(file_path):
    print(f"Updating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace onboarding.X with common.location.X for specific keys
        replacements = {
            "onboarding.country": "common.location.country",
            "onboarding.selectCountry": "common.location.selectCountry",
            "onboarding.province": "common.location.province",
            "onboarding.selectProvince": "common.location.selectProvince",
            "onboarding.city": "common.location.city",
            "onboarding.selectCity": "common.location.selectCity",
            "onboarding.otherCity": "common.location.otherCity",
            "onboarding.enterCityName": "common.location.enterCityName"
        }
        
        for old, new in replacements.items():
            content = content.replace(f"'{old}'", f"'{new}'")
            content = content.replace(f'"{old}"', f'"{new}"')
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"{file_path} Update Success.")
        
    except Exception as e:
        print(f"Error updating component {file_path}: {e}")

if __name__ == "__main__":
    update_json(en_file, new_keys_en)
    update_json(zh_file, new_keys_zh)
    update_component(component_file)
    update_component('src/components/ui/GlobalLocationSelector.tsx')
