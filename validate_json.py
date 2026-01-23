import json
import sys

file_path = 'src/i18n/locales/en.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = json.loads(content)
    print("JSON is valid.")
    
    # Check specifically for the keys user complained about
    if "auPair" in data:
        au_pair = data["auPair"]
        if "onboarding" in au_pair:
            onboarding = au_pair["onboarding"]
            if "options" in onboarding:
                options = onboarding["options"]
                print("auPair.onboarding.options keys:", list(options.keys()))
                if "discipline" in options:
                    print("Found discipline:", options["discipline"])
                else:
                    print("Missing discipline in auPair.onboarding.options")
            else:
                print("Missing options in auPair.onboarding")
        else:
            print("Missing onboarding in auPair")
    else:
        print("Missing auPair at root")

except json.JSONDecodeError as e:
    print(f"JSON Decode Error: {e.msg}")
    print(f"Line: {e.lineno}")
    print(f"Column: {e.colno}")
    print(f"Position: {e.pos}")
    # Print context
    lines = content.splitlines()
    start = max(0, e.lineno - 5)
    end = min(len(lines), e.lineno + 5)
    for i in range(start, end):
        prefix = ">> " if i + 1 == e.lineno else "   "
        print(f"{prefix}{i+1}: {lines[i]}")

except Exception as e:
    print(f"An error occurred: {e}")
