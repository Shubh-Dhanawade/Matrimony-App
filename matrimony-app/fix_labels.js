const fs = require('fs');
const file = 'src/screens/registration/RegistrationScreen.js';
let content = fs.readFileSync(file, 'utf8');

// Section Titles
content = content.replace(/\{t\(\"basic_info\"\)\}/g, '"Basic Information"');
content = content.replace(/\{t\(\"personal_details\"\)\}/g, '"Personal Details"');
content = content.replace(/\{t\(\"contact_location\"\) \|\| \"Contact Details\"\}/g, '"Contact & Location"');
content = content.replace(/\{t\(\"professional_details\"\)\}/g, '"Professional Details"');
content = content.replace(/\{t\(\"community_details\"\)\}/g, '"Community Details"');
content = content.replace(/\{t\(\"expectations_photo\"\)\}/g, '"Partner Expectations & Photos"');

// Labels
content = content.replace(/label=\{`\$\{t\(\"full_name\"\)\} \*\`\}/g, 'label=\"Full Name *\"');
content = content.replace(/label=\{t\(\"father_name\"\)\}/g, 'label=\"Father\\\'s Name\"');
content = content.replace(/label=\{t\(\"mother_maiden_name\"\)\}/g, 'label=\"Mother\\\'s Maiden Name\"');
content = content.replace(/label=\{`\$\{t\(\"dob\"\)\} \*\`\}/g, 'label=\"Date of Birth *\"');
content = content.replace(/label=\{`\$\{t\(\"gender\"\)\} \*\`\}/g, 'label=\"Gender *\"');
content = content.replace(/label=\{`\$\{t\(\"feet\"\) \|\| \"Feet\"\} \*\`\}/g, 'label=\"Feet *\"');
content = content.replace(/label=\{`\$\{t\(\"inches\"\) \|\| \"Inches\"\} \*\`\}/g, 'label=\"Inches *\"');
content = content.replace(/label=\{t\(\"color\"\) \|\| \"Complexion\"\}/g, 'label=\"Complexion\"');
content = content.replace(/label=\{`\$\{t\(\"age\"\)\} \*\`\}/g, 'label=\"Age *\"');
content = content.replace(/label=\{`\$\{t\(\"marital_status\"\)\} \*\`\}/g, 'label=\"Marital Status *\"');
content = content.replace(/label=\{t\(\"manglik\"\) \|\| \"Manglik\"\}/g, 'label=\"Manglik\"');
content = content.replace(/label=\{`\$\{t\(\"profile_for\"\)\} \*\`\}/g, 'label=\"Creating Profile For *\"');
content = content.replace(/label=\{t\(\"profile_managed_by\"\) \|\| \"Profile Managed By\"\}/g, 'label=\"Profile Managed By\"');
content = content.replace(/label=\{`\$\{t\(\"specify_relation\"\)\} \*\`\}/g, 'label=\"Specify Relation *\"');
content = content.replace(/label=\{`\$\{t\(\"phone_number\"\) \|\| \"Phone Number\"\} \*\`\}/g, 'label=\"Phone Number *\"');
content = content.replace(/label=\{t\(\"whatsapp_number\"\) \|\| \"WhatsApp Number\"\}/g, 'label=\"WhatsApp Number\"');
content = content.replace(/label=\{t\(\"birthplace\"\)\}/g, 'label=\"Birthplace\"');
content = content.replace(/label=\{t\(\"full_address\"\)\}/g, 'label=\"Full Address\"');
content = content.replace(/label=\{t\(\"state\"\)\}/g, 'label=\"State\"');
content = content.replace(/label=\{t\(\"district\"\)\}/g, 'label=\"District\"');
content = content.replace(/label=\{t\(\"taluka\"\)\}/g, 'label=\"Taluka\"');
content = content.replace(/label=\{`\$\{t\(\"qualification\"\)\} \*\`\}/g, 'label=\"Qualification *\"');
content = content.replace(/label=\{`\$\{t\(\"occupation\"\)\} \*\`\}/g, 'label=\"Occupation *\"');
content = content.replace(/label=\{`\$\{t\(\"profession\"\)\} \*\`\}/g, 'label=\"Profession *\"');
content = content.replace(/label=\{t\(\"company_name\"\) \|\| \"Company Name\"\}/g, 'label=\"Company Name / Business Name\"');
content = content.replace(/label=\{`\$\{t\(\"monthly_income\"\)\} \*\`\}/g, 'label=\"Monthly Income *\"');
content = content.replace(/label=\{`\$\{t\(\"property\"\)\} \*\`\}/g, 'label=\"Property Details *\"');
content = content.replace(/label=\{t\(\"caste\"\)\}/g, 'label=\"Caste\"');
content = content.replace(/label=\{t\(\"sub_caste\"\)\}/g, 'label=\"Sub Caste\"');
content = content.replace(/label=\{t\(\"relative_surname\"\)\}/g, 'label=\"Relative Surname\"');
content = content.replace(/label=\{t\(\"partner_expectations\"\)\}/g, 'label=\"Partner Expectations\"');

// Placeholders
content = content.replace(/placeholder=\{t\(\"gender\"\)\}/g, 'placeholder=\"Select Gender\"');
content = content.replace(/placeholder=\{t\(\"marital_status\"\)\}/g, 'placeholder=\"Select Marital Status\"');
content = content.replace(/placeholder=\{t\(\"select_manglik\"\) \|\| \"Select Manglik\"\}/g, 'placeholder=\"Select Manglik\"');
content = content.replace(/placeholder=\{t\(\"profile_for\"\)\}/g, 'placeholder=\"Select Profile For\"');
content = content.replace(/placeholder=\{t\(\"select_manager\"\) \|\| \"Select Manager\"\}/g, 'placeholder=\"Select Manager\"');
content = content.replace(/placeholder=\{loadingStates \? t\(\"loading\"\) \+ \"\.\.\.\" : t\(\"select_state\"\)\}/g, 'placeholder={loadingStates ? \"Loading...\" : \"Select State\"}');

// Replacing multiline conditionals with simpler strings 
content = content.replace(/!formData\.state\s*\?\s*t\(\"select_state_first\"\)\s*:\s*loadingDistricts\s*\?\s*t\(\"loading\"\) \+ \"\.\.\.\"\s*:\s*t\(\"select_district\"\)/, '!formData.state ? \"Select State First\" : loadingDistricts ? \"Loading...\" : \"Select District\"');
content = content.replace(/!formData\.district\s*\?\s*t\(\"select_district_first\"\)\s*:\s*loadingTalukas\s*\?\s*t\(\"loading\"\) \+ \"\.\.\.\"\s*:\s*talukas\.length === 0\s*\?\s*t\(\"no_talukas\"\)\s*:\s*t\(\"select_taluka\"\)/, '!formData.district ? \"Select District First\" : loadingTalukas ? \"Loading...\" : talukas.length === 0 ? \"No Talukas Found\" : \"Select Taluka\"');

content = content.replace(/placeholder=\{t\(\"Qualification\"\) \|\| \"Select Qualification\"\}/g, 'placeholder=\"Select Qualification\"');
content = content.replace(/placeholder=\{t\(\"Occupation\"\) \|\| \"Select Occupation\"\}/g, 'placeholder=\"Select Occupation\"');

// Options array mapping for Gender
content = content.replace(/\{ label: t\(\"gender_male\"\), value: \"Male\" \}/g, '{ label: \"Male\", value: \"Male\" }');
content = content.replace(/\{ label: t\(\"gender_female\"\), value: \"Female\" \}/g, '{ label: \"Female\", value: \"Female\" }');
content = content.replace(/\{ label: t\(\"gender_other\"\), value: \"Other\" \}/g, '{ label: \"Other\", value: \"Other\" }');

// Options for Marital Status
content = content.replace(/\{ label: t\(\"marital_single\"\), value: \"Single\" \}/g, '{ label: \"Single\", value: \"Single\" }');
content = content.replace(/\{ label: t\(\"marital_married\"\), value: \"Married\" \}/g, '{ label: \"Married\", value: \"Married\" }');
content = content.replace(/\{ label: t\(\"marital_divorced\"\), value: \"Divorced\" \}/g, '{ label: \"Divorced\", value: \"Divorced\" }');
content = content.replace(/\{ label: t\(\"marital_widowed\"\), value: \"Widowed\" \}/g, '{ label: \"Widowed\", value: \"Widowed\" }');

// Options for Profile For
content = content.replace(/\{ label: t\(\"profile_for_myself\"\), value: \"Myself\" \}/g, '{ label: \"Myself\", value: \"Myself\" }');
content = content.replace(/\{ label: t\(\"profile_for_son\"\), value: \"Son\" \}/g, '{ label: \"Son\", value: \"Son\" }');
content = content.replace(/\{ label: t\(\"profile_for_daughter\"\), value: \"Daughter\" \}/g, '{ label: \"Daughter\", value: \"Daughter\" }');
content = content.replace(/\{ label: t\(\"profile_for_brother\"\), value: \"Brother\" \}/g, '{ label: \"Brother\", value: \"Brother\" }');
content = content.replace(/\{ label: t\(\"profile_for_sister\"\), value: \"Sister\" \}/g, '{ label: \"Sister\", value: \"Sister\" }');
content = content.replace(/\{ label: t\(\"profile_for_other\"\), value: \"Other\" \}/g, '{ label: \"Other\", value: \"Other\" }');

// Options for Managed By -- removing Friend, and setting specific text and values per user's prompt
content = content.replace(/\{\s*label: t\(\"managed_by_self\"\) \|\| \"Self\",\s*value: \"Self\"\s*\}/g, '{ label: \"Self\", value: \"self\" }');
content = content.replace(/\{\s*label: t\(\"managed_by_parents\"\) \|\| \"Parents\",\s*value: \"Parents\"\s*\}/g, '{ label: \"Parents\", value: \"parents\" }');
content = content.replace(/\{\s*label: t\(\"managed_by_brother\"\) \|\| \"Brother\",\s*value: \"Brother\"\s*\}/g, '{ label: \"Brother\", value: \"brother\" }');
content = content.replace(/\{\s*label: t\(\"managed_by_sister\"\) \|\| \"Sister\",\s*value: \"Sister\"\s*\}/g, '{ label: \"Sister\", value: \"sister\" }');
content = content.replace(/\{\s*label: t\(\"managed_by_relative\"\) \|\| \"Relative\",\s*value: \"Relative\"\s*\}/g, '{ label: \"Guardian\", value: \"guardian\" }');
content = content.replace(/,\s*\{\s*label: t\(\"managed_by_friend\"\) \|\| \"Friend\",\s*value: \"Friend\"\s*\}/g, '');

// Photo section labels
content = content.replace(/\{t\(\"profile_photo\"\)\}/g, '\"Profile Photo\"');
content = content.replace(/\{t\(\"take_photo\"\)\}/g, '\"Take Photo\"');
content = content.replace(/\{t\(\"from_gallery\"\)\}/g, '\"Pick from Gallery\"');
content = content.replace(/\{t\(\"biodata_upload\"\) \|\| \"Biodata Upload\"\}/g, '\"Biodata Upload\"');
content = content.replace(/\{t\(\"multiple_photos\"\)\}/g, '\"Multiple Profile Photos\"');

// Buttons
content = content.replace(/\{saving \? t\(\"saving\"\) \+ \"\.\.\.\" : t\(\"save_profile\"\)\}/g, '{saving ? \"Saving...\" : \"Save Profile\"}');

fs.writeFileSync(file, content, 'utf8');
console.log('Script processed file.');
