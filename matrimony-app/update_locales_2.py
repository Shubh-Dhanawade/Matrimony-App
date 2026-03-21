import json
import os

files = {
    'en': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/en.json',
    'hi': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/hi.json',
    'mr': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/mr.json',
}

updates = {
    'en': {
        "unlock": "Unlock",
        "pending": "Pending",
        "locked": "Locked",
        "profile_managed_by": "Managed By",
        "active_now": "Active now",
        "active_ago": "Active {{time}} ago",
        "unlock_profiles": "Unlock Profiles",
        "upgrade_to_view_profiles": "Upgrade to View Profiles"
    },
    'hi': {
        "unlock": "अनलॉक",
        "pending": "प्रतींबित",
        "locked": "लॉक",
        "profile_managed_by": "मैनेज्ड बाय",
        "active_now": "अभी सक्रिय",
        "active_ago": "{{time}} पहले सक्रिय",
        "unlock_profiles": "प्रोफ़ाइल अनलॉक़ करें",
        "upgrade_to_view_profiles": "पूरी प्रोफ़ाइल देखने के लिए अपग्रेड करें"
    },
    'mr': {
        "unlock": "अनलॉक",
        "pending": "प्रतीक्षेत",
        "locked": "लॉक",
        "profile_managed_by": "व्यवस्थापक",
        "active_now": "आत्ता सक्रिय",
        "active_ago": "{{time}} पूर्वी सक्रिय",
        "unlock_profiles": "प्रोफाईल अनलॉक करा",
        "upgrade_to_view_profiles": "संपूर्ण प्रोफाईल पाहण्यासाठी अपग्रेड करा"
    }
}

for lang, filepath in files.items():
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for k, v in updates[lang].items():
            data[k] = v
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Updated {lang}.json")
    else:
        print(f"File not found: {filepath}")
