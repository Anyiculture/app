import json

try:
    with open('src/i18n/locales/zh.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("Root keys:", list(data.keys()))
except Exception as e:
    print(f"Error: {e}")
