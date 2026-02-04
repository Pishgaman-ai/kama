const moment = require("moment-jalaali");

// تنظیم moment-jalaali برای استفاده از تقویم شمسی
moment.loadPersian();

// محاسبه تاریخ و روز شمسی فعلی
const now = moment();
const persianDate = now.format('jYYYY/jMM/jDD');
const gregorianDate = now.format('YYYY-MM-DD');

// نقشه روزهای هفته به فارسی
const dayNames = {
  'Saturday': 'شنبه',
  'Sunday': 'یکشنبه',
  'Monday': 'دوشنبه',
  'Tuesday': 'سه‌شنبه',
  'Wednesday': 'چهارشنبه',
  'Thursday': 'پنجشنبه',
  'Friday': 'جمعه'
};

const englishDayName = now.format('dddd');
const persianDay = dayNames[englishDayName];

console.log('📅 اطلاعات تاریخ فعلی:');
console.log(`   امروز: ${persianDay} ${persianDate}`);
console.log(`   میلادی: ${gregorianDate}`);
console.log('');

// تست‌های مختلف تاریخ
console.log('🧪 تست تبدیل تاریخ‌های مختلف:');
console.log('');

// تست 1: دیروز
const yesterday = moment().subtract(1, 'days');
console.log(`1. دیروز: ${yesterday.format('jYYYY/jMM/jDD')} (${yesterday.format('YYYY-MM-DD')})`);

// تست 2: 5 روز پیش
const fiveDaysAgo = moment().subtract(5, 'days');
console.log(`2. 5 روز پیش: ${fiveDaysAgo.format('jYYYY/jMM/jDD')} (${fiveDaysAgo.format('YYYY-MM-DD')})`);

// تست 3: هفته گذشته
const lastWeek = moment().subtract(7, 'days');
console.log(`3. هفته گذشته: ${lastWeek.format('jYYYY/jMM/jDD')} (${lastWeek.format('YYYY-MM-DD')})`);

// تست 4: ماه گذشته
const lastMonth = moment().subtract(30, 'days');
console.log(`4. ماه گذشته: ${lastMonth.format('jYYYY/jMM/jDD')} (${lastMonth.format('YYYY-MM-DD')})`);

// تست 5: تبدیل تاریخ شمسی به میلادی
const persianDateSample = '1403/10/13';
const gregorianFromPersian = moment(persianDateSample, 'jYYYY/jMM/jDD');
console.log(`5. ${persianDateSample} شمسی = ${gregorianFromPersian.format('YYYY-MM-DD')} میلادی`);

// تست 6: پیدا کردن آخرین یکشنبه
const lastSunday = moment().day(0); // 0 = Sunday
if (lastSunday.isAfter(now)) {
  lastSunday.subtract(7, 'days');
}
console.log(`6. آخرین یکشنبه: ${lastSunday.format('jYYYY/jMM/jDD')} (${lastSunday.format('YYYY-MM-DD')})`);

console.log('');
console.log('✅ تست کامل شد');
