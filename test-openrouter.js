// اسکریپت تست OpenRouter API
require('dotenv').config({ path: '.env.production' });

async function testOpenRouterAPI() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  console.log('🔍 بررسی OpenRouter API Key...\n');

  if (!apiKey) {
    console.error('❌ خطا: OPENROUTER_API_KEY در .env.local تنظیم نشده است');
    return;
  }

  console.log('✅ API Key پیدا شد:', `${apiKey.substring(0, 15)}...`);
  console.log('\n📡 در حال ارسال درخواست تست به OpenRouter...\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Kama Education Platform - Test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-preview',
        messages: [
          {
            role: 'user',
            content: 'سلام، این یک تست است. لطفاً یک جمله کوتاه فارسی بنویس.'
          }
        ],
      }),
    });

    console.log('📊 وضعیت پاسخ:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('\n❌ خطا در API:');
      console.error(JSON.stringify(errorData, null, 2));

      if (response.status === 401) {
        console.error('\n💡 راهکار: API Key شما نامعتبر است.');
        console.error('   1. به https://openrouter.ai/keys بروید');
        console.error('   2. یک API Key جدید بسازید');
        console.error('   3. آن را در .env.local جایگزین کنید');
      } else if (response.status === 402) {
        console.error('\n💡 راهکار: موجودی حساب شما کافی نیست.');
        console.error('   به https://openrouter.ai/account بروید و اعتبار اضافه کنید');
      }

      return;
    }

    const result = await response.json();
    console.log('\n✅ درخواست موفقیت‌آمیز بود!');
    console.log('\n📝 پاسخ دریافت شده:');
    console.log('مدل:', result.model);
    console.log('محتوا:', result.choices[0].message.content);
    console.log('\n✨ API Key شما معتبر است و OpenRouter به درستی کار می‌کند!');

  } catch (error) {
    console.error('\n❌ خطای شبکه:', error.message);
  }
}

testOpenRouterAPI();
