// اسکریپت تست استخراج تاریخ با هوش مصنوعی
// این اسکریپت نمونه‌های مختلف ورودی را برای تست استخراج تاریخ بررسی می‌کند

const moment = require("moment-jalaali");

// نمونه‌های تست
const testCases = [
  {
    description: "امروز",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم امروز",
    expectedDate: moment().format('YYYY-MM-DD')
  },
  {
    description: "دیروز",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم دیروز",
    expectedDate: moment().subtract(1, 'days').format('YYYY-MM-DD')
  },
  {
    description: "5 روز پیش",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم 5 روز پیش",
    expectedDate: moment().subtract(5, 'days').format('YYYY-MM-DD')
  },
  {
    description: "هفته گذشته",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم هفته گذشته",
    expectedDate: moment().subtract(7, 'days').format('YYYY-MM-DD')
  },
  {
    description: "بدون تاریخ (باید null باشد)",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم",
    expectedDate: null
  },
  {
    description: "تاریخ شمسی مشخص",
    input: "آتنا احمدی نمره ۱۸ آزمون میان‌ترم 1403/10/10",
    expectedDate: moment('1403/10/10', 'jYYYY/jMM/jDD').format('YYYY-MM-DD')
  }
];

console.log('🧪 نمونه‌های تست استخراج تاریخ:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.description}`);
  console.log(`   ورودی: "${testCase.input}"`);
  console.log(`   تاریخ مورد انتظار: ${testCase.expectedDate || 'null'}`);
  console.log('');
});

console.log('💡 نکته: برای تست واقعی، این نمونه‌ها را در رابط کاربری وارد کنید');
console.log('   و بررسی کنید که تاریخ‌ها به درستی استخراج می‌شوند.\n');

// نمایش تاریخ فعلی
const now = moment();
const dayNames = {
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
  6: 'شنبه'
};

console.log('📅 اطلاعات تاریخ فعلی که به AI ارسال می‌شود:');
console.log(`   امروز: ${dayNames[now.day()]} ${now.format('jYYYY/jMM/jDD')} (میلادی: ${now.format('YYYY-MM-DD')})`);
