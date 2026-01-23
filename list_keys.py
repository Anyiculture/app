import json

try:
    with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Root keys:", list(data.keys()))
    
    if "admin" in data:
        print("Admin keys:", list(data["admin"].keys()))
    else:
        print("Usage of 'admin' key not found at root.")

    if "auPair" in data:
        print("auPair keys:", list(data["auPair"].keys()))
    else:
        print("Usage of 'auPair' key not found at root.")
        
    if "marketingAuPair" in data:
        print("marketingAuPair keys:", list(data["marketingAuPair"].keys()))

except Exception as e:
    print(f"Error: {e}")
