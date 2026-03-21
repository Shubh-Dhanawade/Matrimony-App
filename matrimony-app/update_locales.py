import json

files = {
    'en': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/en.json',
    'hi': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/hi.json',
    'mr': r'c:/Users/shubh/OneDrive/Attachments/Desktop/CodeFirst/React_Native/matrimony-app/src/locales/mr.json',
}

updates = {
    'en': {
        "send_interest": "Send Interest",
        "shortlist": "Shortlist",
        "upgrade_to_view_profiles": "Upgrade to View Profiles",
        "try_again": "Try Again",
        "access_restricted": "You need to connect to view full profile",
        "upgrade_to_premium": "Upgrade to Premium",
        "waiting_for_acceptance": "Waiting for Acceptance",
        "profile_managed_by": "Profile Managed By",
        "contact_details": "Contact Details",
        "premium_valid_till": "Premium valid till: {{date}}",
        "active_ago": "Active {{time}} ago",
        "full_profile": "View Full Profile",
        "payment_instructions": "Payment Instructions",
        "interested": "Send Interest",
        "already_saved": "Already Shortlisted",
        "already_saved_msg": "This profile is already in your shortlist.",
        "profile_shortlisted_msg": "Profile added to your shortlist!"
    },
    'hi': {
        "send_interest": "रुचि भेजें",
        "shortlist": "शॉर्टलिस्ट करें",
        "upgrade_to_view_profiles": "प्रोफ़ाइल देखने के लिए अपग्रेड करें",
        "try_again": "फिर से प्रयास करें",
        "access_restricted": "पूरी प्रोफ़ाइल देखने के लिए आपको कनेक्ट करना होगा",
        "upgrade_to_premium": "प्रीमियम में अपग्रेड करें",
        "waiting_for_acceptance": "स्वीकृति की प्रतीक्षा की जा रही है",
        "profile_managed_by": "प्रोफ़ाइल प्रबंधित कर रहे हैं",
        "contact_details": "संपर्क विवरण",
        "premium_valid_till": "प्रीमियम की वैधता: {{date}}",
        "active_ago": "{{time}} पहले सक्रिय",
        "full_profile": "पूरी प्रोफ़ाइल देखें",
        "payment_instructions": "भुगतान निर्देश",
        "interested": "रुचि भेजें",
        "already_saved": "पहले से शॉर्टलिस्ट किया गया",
        "already_saved_msg": "यह प्रोफ़ाइल पहले से ही आपकी शॉर्टलिस्ट में है।",
        "profile_shortlisted_msg": "प्रोफ़ाइल आपकी शॉर्टलिस्ट में जोड़ दी गई है!"
    },
    'mr': {
        "send_interest": "रस दर्शवा",
        "shortlist": "शॉर्टलिस्ट करा",
        "upgrade_to_view_profiles": "प्रोफाईल पाहण्यासाठी अपग्रेड करा",
        "try_again": "पुन्हा प्रयत्न करा",
        "access_restricted": "संपूर्ण प्रोफाईल पाहण्यासाठी तुम्हाला कनेक्ट करणे आवश्यक आहे",
        "upgrade_to_premium": "प्रीमियमवर अपग्रेड करा",
        "waiting_for_acceptance": "स्वीकृतीची प्रतीक्षा करत आहे",
        "profile_managed_by": "प्रोफाईल व्यवस्थापित करत आहे",
        "contact_details": "संपर्क तपशील",
        "premium_valid_till": "प्रीमियम वैधता: {{date}}",
        "active_ago": "{{time}} पूर्वी सक्रिय",
        "full_profile": "संपूर्ण प्रोफाईल पहा",
        "payment_instructions": "पेमेंट सूचना",
        "interested": "रस दर्शवा",
        "already_saved": "आधीच शॉर्टलिस्ट केले आहे",
        "already_saved_msg": "हे प्रोफाईल आधीपासूनच तुमच्या शॉर्टलिस्टमध्ये आहे.",
        "profile_shortlisted_msg": "प्रोफाईल तुमच्या शॉर्टलिस्टमध्ये जोडले गेले आहे!"
    }
}

for lang, filepath in files.items():
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for k, v in updates[lang].items():
        data[k] = v
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Updated {lang}.json")
