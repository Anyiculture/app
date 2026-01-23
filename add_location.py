import json
import collections

file_path = 'src/i18n/locales/en.json'

def add_location():
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        
        if 'admin' not in data:
            print("Admin missing")
            return
            
        admin = data['admin']
        if 'auPair' not in admin:
             # Create it?
             print("admin.auPair missing. Creating...")
             admin['auPair'] = {}
        
        ap = admin['auPair']
        if 'columns' not in ap:
             print("admin.auPair.columns missing. Creating...")
             ap['columns'] = {}
             
        cols = ap['columns']
        if 'location' not in cols:
            print("Adding location key")
            cols['location'] = "Location"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("Saved.")
        else:
            print("Location key already exists.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    add_location()
