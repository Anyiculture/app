import json

try:
    with open('src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'auPair' in data and 'onboarding' in data['auPair']:
        print("Keys in auPair.onboarding:", list(data['auPair']['onboarding'].keys()))
    else:
        print("auPair.onboarding not found")

except Exception as e:
    print(f"Error: {e}")
