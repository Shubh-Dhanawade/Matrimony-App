const fs = require('fs');
const src = 'C:\\Users\\shubh\\.gemini\\antigravity\\brain\\ea44c534-dbd5-40d6-af87-10899c614d9a\\payment_qr_1774029310452.png';
const dest = 'c:\\Users\\shubh\\OneDrive\\Attachments\\Desktop\\CodeFirst\\React_Native\\matrimony-app\\assets\\payment_qr.png';
try {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied!');
} catch (err) {
  console.error('Error copying file:', err);
}
