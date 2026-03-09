const fs = require('fs');
const file = 'src/screens/registration/RegistrationScreen.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/>\"Basic Information\"</g, '>Basic Information<');
content = content.replace(/>\"Personal Details\"</g, '>Personal Details<');
content = content.replace(/>\"Contact & Location\"</g, '>Contact & Location<');
content = content.replace(/>\"Professional Details\"</g, '>Professional Details<');
content = content.replace(/>\"Community Details\"</g, '>Community Details<');
content = content.replace(/>\"Partner Expectations & Photos\"</g, '>Partner Expectations & Photos<');
content = content.replace(/>\"Profile Photo\"</g, '>Profile Photo<');
content = content.replace(/>\"Take Photo\"</g, '>Take Photo<');
content = content.replace(/>\"Pick from Gallery\"</g, '>Pick from Gallery<');
content = content.replace(/>\"Biodata Upload\"</g, '>Biodata Upload<');
content = content.replace(/>\"Multiple Profile Photos\"</g, '>Multiple Profile Photos<');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed quotes in section labels.');
