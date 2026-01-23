import sys

path = 'src/i18n/locales/en.json'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

open_braces = 0
open_quotes = False
escape = False

for i, char in enumerate(content):
    if escape:
        escape = False
        continue
        
    if char == '\\':
        escape = True
        continue
        
    if char == '"':
        open_quotes = not open_quotes
        continue
        
    if not open_quotes:
        if char == '{':
            open_braces += 1
        elif char == '}':
            open_braces -= 1
            if open_braces < 0:
                print(f"Extra closing brace at position {i}, line {content[:i].count('\\n')+1}")
                sys.exit(1)

if open_quotes:
    print("Error: Unclosed quote detected!")
elif open_braces > 0:
    print(f"Error: {open_braces} unclosed braces detected!")
elif open_braces < 0:
    print(f"Error: {abs(open_braces)} extra closing braces detected!")
else:
    print("Braces and quotes are balanced.")
