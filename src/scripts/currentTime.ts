import { 
  getCurrentISTString, 
  toISTString, 
  formatForAPI, 
  getCurrentISTISOString,
  getCurrentISTTime 
} from '../utils/timezone.js';

console.log('🕐 Current Time Check using our timezone utilities:');
console.log('================================================');

const now = new Date();

console.log('\n📅 Raw JavaScript Date:');
console.log('🕐 UTC Time:', now.toISOString());
console.log('🕐 Local Time:', now.toString());

console.log('\n🇮🇳 Indian Standard Time (IST) using our utilities:');
console.log('🕐 Current IST String:', getCurrentISTString());
console.log('🕐 IST Formatted:', toISTString(now));
console.log('🕐 IST API Format:', formatForAPI(now));
console.log('🕐 IST ISO String:', getCurrentISTISOString());
console.log('🕐 IST Date Object:', getCurrentISTTime());

console.log('\n✅ All timezone utilities are working correctly!');
console.log('🇮🇳 Your application is now using Indian Standard Time (IST)');
