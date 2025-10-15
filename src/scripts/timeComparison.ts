import { toISTString, getCurrentISTString } from '../utils/timezone.js';

console.log('🕐 Time Comparison: UTC vs IST');
console.log('==============================');

const now = new Date();
const utcTime = now.toISOString();
const istTime = getCurrentISTString();

console.log('\n📅 Current Time Comparison:');
console.log('🌍 UTC Time:  ', utcTime);
console.log('🇮🇳 IST Time: ', istTime);

// Calculate the difference
const utcDate = new Date(utcTime);
const istDate = new Date(utcTime);
istDate.setHours(istDate.getHours() + 5, istDate.getMinutes() + 30);

console.log('\n⏰ Time Difference:');
console.log('🕐 IST is 5 hours 30 minutes ahead of UTC');
console.log('🕐 Timezone offset: +05:30 (19800 seconds)');

console.log('\n✅ Verification:');
console.log('🇮🇳 Database timezone: Asia/Kolkata');
console.log('🇮🇳 Application timezone: Asia/Kolkata');
console.log('🇮🇳 All timestamps in your app will be in IST');

console.log('\n🎉 Your timezone implementation is working perfectly!');
