import json
import collections

file_path = 'src/i18n/locales/zh.json'

def restructure():
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if content.endswith('}'):
             # Debug
             pass
        
        # Attempt to remove last char if it looks like extra brace
        data = None
        for i in range(10):
            try:
                data = json.loads(content, object_pairs_hook=collections.OrderedDict)
                break
            except json.JSONDecodeError as e:
                print(f"JSON Error: {e.msg}. Attempt {i+1}. End: {repr(content[-20:])}")
                
                # Force remove last char
                if content:
                    content = content[:-1].strip()
                else:
                    raise e
        
        if data is None:
             raise Exception("Failed to fix JSON after 5 attempts.")
        
        # 1. Rename marketingAuPair -> auPair
        if 'marketingAuPair' in data:
            print("Renaming marketingAuPair to auPair")
            if 'auPair' not in data:
                # Use insert order preservation? OrderedDict
                # We can just add it. Order might shift but that's okay.
                data['auPair'] = data.pop('marketingAuPair')
            else:
                # Merge?
                print("auPair already exists. Merging content...")
                data['auPair'].update(data.pop('marketingAuPair'))
        
        # 2. Move onboarding -> auPair.onboarding
        if 'onboarding' in data:
            print("Moving onboarding to auPair.onboarding")
            if 'auPair' not in data:
                data['auPair'] = {}
            data['auPair']['onboarding'] = data.pop('onboarding')

        # 3. Move payment -> auPair.payment
        if 'payment' in data:
             print("Moving payment to auPair.payment")
             if 'auPair' not in data:
                data['auPair'] = {}
             data['auPair']['payment'] = data.pop('payment')

        # 4. Move paymentError -> auPair.paymentError
        if 'paymentError' in data:
             print("Moving paymentError to auPair.paymentError")
             if 'auPair' not in data:
                data['auPair'] = {}
             data['auPair']['paymentError'] = data.pop('paymentError')

        # 5. Fix admin.auPair.columns.location
        if 'admin' in data:
             admin = data['admin']
             if 'auPair' in admin:
                 ap = admin['auPair']
                 if 'columns' in ap:
                     cols = ap['columns']
                     if 'location' not in cols:
                         print("Adding location to admin.auPair.columns")
                         # Insert efficiently? OrderedDict.
                         cols['location'] = "Location"
        
        # Save back
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Restructure complete.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    restructure()
