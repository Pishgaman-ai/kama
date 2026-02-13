/**
 * Browser Console Test for Principal AI Assistant
 *
 * HOW TO USE:
 * 1. Open your browser and navigate to:
 *    https://c6c6-86-106-158-103.ngrok-free.app/dashboard/principal/principal-assistant
 *
 * 2. Open Developer Tools (F12)
 *
 * 3. Go to Console tab
 *
 * 4. Copy and paste this entire file into the console
 *
 * 5. Run: testClassQuery('نهم الف')
 *    or: testStudentQuery('علی احمدی', 'ریاضی')
 */

// Test class performance query
async function testClassQuery(className = 'نهم الف') {
  console.log(`%c🧪 Testing Class Query: ${className}`, 'color: #00ff00; font-size: 16px; font-weight: bold');

  const startTime = Date.now();

  try {
    const response = await fetch('/api/principal/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `عملکرد کلاس ${className} چطور است؟`
          }
        ]
      })
    });

    console.log(`%c📡 Response Status: ${response.status}`, 'color: #00aaff; font-size: 14px');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('%c❌ Error Response:', 'color: #ff0000; font-size: 14px', errorText);
      return;
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('%c📥 Streaming response...', 'color: #ffaa00; font-size: 14px');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;

      // Show progress
      process.stdout?.write?.('.') || console.log('.');
    }

    const duration = Date.now() - startTime;

    console.log('\n%c✅ Response Complete', 'color: #00ff00; font-size: 16px; font-weight: bold');
    console.log(`%c⏱️  Duration: ${duration}ms`, 'color: #00aaff; font-size: 14px');
    console.log(`%c📊 Response Length: ${fullResponse.length} characters`, 'color: #00aaff; font-size: 14px');

    // Display formatted response
    console.log('\n%c📄 Full Response:', 'color: #ffaa00; font-size: 16px; font-weight: bold');
    console.log('%c' + '='.repeat(80), 'color: #666666');
    console.log(fullResponse);
    console.log('%c' + '='.repeat(80), 'color: #666666');

    // Analyze response
    analyzeResponse(fullResponse);

    return fullResponse;

  } catch (error) {
    console.error('%c❌ Test Failed:', 'color: #ff0000; font-size: 16px; font-weight: bold', error);
  }
}

// Test student performance query
async function testStudentQuery(studentName = 'علی احمدی', subject = 'ریاضی') {
  console.log(`%c🧪 Testing Student Query: ${studentName} - ${subject}`, 'color: #00ff00; font-size: 16px; font-weight: bold');

  const startTime = Date.now();

  try {
    const query = subject
      ? `وضعیت ${studentName} در درس ${subject} چطور است؟`
      : `فعالیت های ${studentName} را نشان بده`;

    const response = await fetch('/api/principal/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: query
          }
        ]
      })
    });

    console.log(`%c📡 Response Status: ${response.status}`, 'color: #00aaff; font-size: 14px');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('%c❌ Error Response:', 'color: #ff0000; font-size: 14px', errorText);
      return;
    }

    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('%c📥 Streaming response...', 'color: #ffaa00; font-size: 14px');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;
    }

    const duration = Date.now() - startTime;

    console.log('\n%c✅ Response Complete', 'color: #00ff00; font-size: 16px; font-weight: bold');
    console.log(`%c⏱️  Duration: ${duration}ms`, 'color: #00aaff; font-size: 14px');
    console.log(`%c📊 Response Length: ${fullResponse.length} characters`, 'color: #00aaff; font-size: 14px');

    // Display formatted response
    console.log('\n%c📄 Full Response:', 'color: #ffaa00; font-size: 16px; font-weight: bold');
    console.log('%c' + '='.repeat(80), 'color: #666666');
    console.log(fullResponse);
    console.log('%c' + '='.repeat(80), 'color: #666666');

    // Analyze response
    analyzeResponse(fullResponse);

    return fullResponse;

  } catch (error) {
    console.error('%c❌ Test Failed:', 'color: #ff0000; font-size: 16px; font-weight: bold', error);
  }
}

// Analyze response content
function analyzeResponse(response) {
  console.log('\n%c📊 Response Analysis:', 'color: #ffaa00; font-size: 16px; font-weight: bold');

  // Check for tables
  const tableMatches = response.match(/\|/g) || [];
  const tableCount = Math.floor(tableMatches.length / 3);
  console.log(`%c  • Tables: ~${tableCount}`, tableCount > 0 ? 'color: #00ff00' : 'color: #ffaa00');

  // Check for sections
  const sections = response.match(/##\s+.+/g) || [];
  console.log(`%c  • Sections: ${sections.length}`, 'color: #00aaff');
  sections.forEach(section => {
    console.log(`%c    - ${section}`, 'color: #666666');
  });

  // Check for key metrics
  const metrics = {
    'تعداد دانش‌آموزان': 'Student Count',
    'میانگین نمره': 'Average Score',
    'تعداد فعالیت': 'Activity Count',
    'آخرین فعالیت': 'Last Activity',
    'تعداد معلمان': 'Teacher Count',
  };

  console.log('%c  • Key Metrics Found:', 'color: #00aaff');
  for (const [persian, english] of Object.entries(metrics)) {
    const found = response.includes(persian);
    console.log(`%c    - ${english} (${persian}): ${found ? '✓' : '✗'}`,
                found ? 'color: #00ff00' : 'color: #666666');
  }

  // Check for errors or warnings
  const errorIndicators = ['خطا', 'یافت نشد', 'محدودیت زمان', 'تولید نشد'];
  const foundErrors = errorIndicators.filter(indicator => response.includes(indicator));

  if (foundErrors.length > 0) {
    console.log('%c  ⚠️  Warnings/Errors:', 'color: #ff0000; font-weight: bold');
    foundErrors.forEach(error => {
      console.log(`%c    - ${error}`, 'color: #ff0000');
    });
  } else {
    console.log('%c  ✅ No errors detected', 'color: #00ff00');
  }

  // Data quality check
  const hasNumbers = /\d+/.test(response);
  const hasDates = /\d{4}\/\d{2}\/\d{2}/.test(response);
  const hasPercentages = /٪|%/.test(response);

  console.log('%c  • Data Quality:', 'color: #00aaff');
  console.log(`%c    - Contains numbers: ${hasNumbers ? '✓' : '✗'}`,
              hasNumbers ? 'color: #00ff00' : 'color: #ff0000');
  console.log(`%c    - Contains dates: ${hasDates ? '✓' : '✗'}`,
              hasDates ? 'color: #00ff00' : 'color: #666666');
  console.log(`%c    - Contains percentages: ${hasPercentages ? '✓' : '✗'}`,
              hasPercentages ? 'color: #00ff00' : 'color: #666666');
}

// Quick test suite
async function runQuickTests() {
  console.log('%c' + '='.repeat(80), 'color: #00aaff; font-size: 16px');
  console.log('%c🧪 Quick Test Suite - Principal AI Assistant', 'color: #00ff00; font-size: 18px; font-weight: bold');
  console.log('%c' + '='.repeat(80), 'color: #00aaff; font-size: 16px');

  // Test 1: Class query
  console.log('\n%c📚 Test 1: Class Performance Query', 'color: #ffaa00; font-size: 16px; font-weight: bold');
  await testClassQuery('نهم الف');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Student query
  console.log('\n%c👨‍🎓 Test 2: Student Performance Query', 'color: #ffaa00; font-size: 16px; font-weight: bold');
  await testStudentQuery('علی احمدی', 'ریاضی');

  console.log('\n%c✅ All tests complete!', 'color: #00ff00; font-size: 18px; font-weight: bold');
}

// Display usage instructions
console.log('%c' + '='.repeat(80), 'color: #00aaff');
console.log('%c🧪 Principal AI Assistant - Browser Test Suite', 'color: #00ff00; font-size: 18px; font-weight: bold');
console.log('%c' + '='.repeat(80), 'color: #00aaff');
console.log('%cAvailable commands:', 'color: #ffaa00; font-size: 14px; font-weight: bold');
console.log('%c  testClassQuery("نهم الف")           ', 'color: #00aaff', '- Test class performance query');
console.log('%c  testStudentQuery("علی احمدی", "ریاضی")', 'color: #00aaff', '- Test student query with subject');
console.log('%c  testStudentQuery("محمد رضایی")       ', 'color: #00aaff', '- Test student query (all subjects)');
console.log('%c  runQuickTests()                      ', 'color: #00aaff', '- Run all tests');
console.log('%c' + '='.repeat(80), 'color: #00aaff');
