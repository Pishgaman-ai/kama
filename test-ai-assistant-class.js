/**
 * Test Principal AI Assistant - Class Performance Query
 *
 * This script tests the AI assistant with a class-level query
 *
 * Usage:
 *   node test-ai-assistant-class.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'https://c6c6-86-106-158-103.ngrok-free.app';
const ENDPOINT = '/api/principal/ai-assistant';

// Test cases
const CLASS_QUERIES = [
  {
    name: 'Class Performance Query - هفتم الف',
    message: 'عملکرد کلاس هفتم الف چطور است؟'
  },
  {
    name: 'Class Performance Query - نهم الف',
    message: 'وضعیت کلاس نهم الف رو بررسی کن'
  },
  {
    name: 'Class Performance Query - دهم',
    message: 'شاخص های کلاس دهم را نشان بده'
  },
  {
    name: 'Class KPI Query',
    message: 'کی پی آی کلاس هشتم ب چیست؟'
  }
];

const STUDENT_QUERIES = [
  {
    name: 'Student Performance Query',
    message: 'وضعیت علی احمدی در ریاضی چطور است؟'
  },
  {
    name: 'Student All Subjects',
    message: 'نمرات محمد رضایی در همه دروس'
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP request to AI assistant
 */
async function testAIAssistant(query, sessionCookie = null, devUserId = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + ENDPOINT);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestBody = JSON.stringify({
      messages: [
        {
          role: 'user',
          content: query.message
        }
      ]
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'User-Agent': 'EduHelper-Test-Client/1.0'
    };

    // Add authentication
    if (sessionCookie) {
      headers['Cookie'] = `user_session=${sessionCookie}`;
    } else if (devUserId) {
      headers['x-dev-user-id'] = devUserId;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: headers,
      // Disable SSL verification for ngrok (development only!)
      rejectUnauthorized: false
    };

    log(`\n${'='.repeat(80)}`, 'cyan');
    log(`Testing: ${query.name}`, 'bright');
    log(`Query: ${query.message}`, 'blue');
    log(`${'='.repeat(80)}`, 'cyan');

    const startTime = Date.now();

    const req = client.request(options, (res) => {
      log(`Status: ${res.statusCode} ${res.statusMessage}`,
          res.statusCode === 200 ? 'green' : 'red');
      log(`Headers: ${JSON.stringify(res.headers, null, 2)}`, 'yellow');

      let responseData = '';

      res.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        responseData += chunkStr;

        // Show streaming progress
        process.stdout.write('.');
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        console.log('\n'); // New line after dots
        log(`Duration: ${duration}ms`, 'cyan');
        log(`\nResponse (first 500 chars):`, 'green');
        log('-'.repeat(80), 'cyan');
        console.log(responseData.substring(0, 500));
        if (responseData.length > 500) {
          log(`\n... (${responseData.length - 500} more characters)`, 'yellow');
        }
        log('-'.repeat(80), 'cyan');

        // Analyze response
        analyzeResponse(responseData, duration);

        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          data: responseData,
          duration
        });
      });
    });

    req.on('error', (error) => {
      log(`\n❌ Request Error: ${error.message}`, 'red');
      reject(error);
    });

    req.on('timeout', () => {
      log('\n❌ Request Timeout', 'red');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set 60 second timeout
    req.setTimeout(60000);

    req.write(requestBody);
    req.end();
  });
}

/**
 * Analyze response content
 */
function analyzeResponse(response, duration) {
  log('\n📊 Response Analysis:', 'bright');

  // Check for tables
  const tableCount = (response.match(/\|/g) || []).length / 3; // Rough estimate
  log(`  • Tables detected: ~${Math.floor(tableCount)}`, tableCount > 0 ? 'green' : 'yellow');

  // Check for Persian text
  const hasPersian = /[\u0600-\u06FF]/.test(response);
  log(`  • Persian text: ${hasPersian ? '✓' : '✗'}`, hasPersian ? 'green' : 'red');

  // Check for specific keywords
  const keywords = {
    'شاخص': 'KPI metrics',
    'میانگین': 'Averages',
    'دانش‌آموز': 'Students',
    'معلم': 'Teachers',
    'فعالیت': 'Activities',
    'نمره': 'Grades',
    'کلاس': 'Class',
  };

  log('  • Keywords found:', 'cyan');
  for (const [persian, english] of Object.entries(keywords)) {
    const found = response.includes(persian);
    log(`    - ${english} (${persian}): ${found ? '✓' : '✗'}`, found ? 'green' : 'yellow');
  }

  // Check for error messages
  const errorPatterns = [
    'خطا',
    'error',
    'یافت نشد',
    'not found',
    'غیر مجاز',
    'unauthorized'
  ];

  const errors = errorPatterns.filter(pattern =>
    response.toLowerCase().includes(pattern.toLowerCase())
  );

  if (errors.length > 0) {
    log(`  • ⚠️  Error indicators: ${errors.join(', ')}`, 'red');
  }

  // Performance check
  if (duration < 3000) {
    log(`  • ⚡ Performance: Excellent (< 3s)`, 'green');
  } else if (duration < 5000) {
    log(`  • ⏱️  Performance: Good (< 5s)`, 'yellow');
  } else {
    log(`  • 🐌 Performance: Slow (> 5s)`, 'red');
  }

  // Response completeness
  const responseLength = response.length;
  log(`  • Response length: ${responseLength} characters`,
      responseLength > 100 ? 'green' : 'red');

  // Check for incomplete response indicators
  const incompleteIndicators = [
    'محدودیت زمان',
    'تولید نشد',
    'امکان تولید',
  ];

  const incomplete = incompleteIndicators.some(indicator =>
    response.includes(indicator)
  );

  if (incomplete) {
    log(`  • ⚠️  Incomplete response detected (timeout?)`, 'red');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(80), 'bright');
  log('🧪 Principal AI Assistant - Test Suite', 'bright');
  log('='.repeat(80) + '\n', 'bright');

  // Check for authentication
  const sessionCookie = process.env.SESSION_COOKIE;
  const devUserId = process.env.DEV_USER_ID;

  if (!sessionCookie && !devUserId) {
    log('⚠️  Warning: No authentication provided', 'yellow');
    log('Set SESSION_COOKIE or DEV_USER_ID environment variable\n', 'yellow');
    log('Examples:', 'cyan');
    log('  SESSION_COOKIE="your-cookie-here" node test-ai-assistant-class.js', 'cyan');
    log('  DEV_USER_ID="principal-user-id" node test-ai-assistant-class.js\n', 'cyan');
    log('Proceeding with test (may fail with 401 Unauthorized)...\n', 'yellow');
  }

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test class queries
  log('📚 Testing Class Queries\n', 'bright');
  for (const query of CLASS_QUERIES) {
    try {
      const result = await testAIAssistant(query, sessionCookie, devUserId);
      results.total++;
      if (result.success) {
        results.passed++;
        log(`\n✅ PASSED: ${query.name}`, 'green');
      } else {
        results.failed++;
        log(`\n❌ FAILED: ${query.name} (Status: ${result.statusCode})`, 'red');
      }
    } catch (error) {
      results.total++;
      results.failed++;
      log(`\n❌ ERROR: ${query.name} - ${error.message}`, 'red');
    }

    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Test student queries
  log('\n\n👨‍🎓 Testing Student Queries\n', 'bright');
  for (const query of STUDENT_QUERIES) {
    try {
      const result = await testAIAssistant(query, sessionCookie, devUserId);
      results.total++;
      if (result.success) {
        results.passed++;
        log(`\n✅ PASSED: ${query.name}`, 'green');
      } else {
        results.failed++;
        log(`\n❌ FAILED: ${query.name} (Status: ${result.statusCode})`, 'red');
      }
    } catch (error) {
      results.total++;
      results.failed++;
      log(`\n❌ ERROR: ${query.name} - ${error.message}`, 'red');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  log('\n\n' + '='.repeat(80), 'bright');
  log('📊 Test Results Summary', 'bright');
  log('='.repeat(80), 'bright');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`,
      results.passed === results.total ? 'green' : 'yellow');
  log('='.repeat(80) + '\n', 'bright');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
