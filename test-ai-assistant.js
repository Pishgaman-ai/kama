/**
 * Test script for Principal AI Assistant API
 *
 * Usage: node test-ai-assistant.js
 *
 * This script tests the AI assistant endpoint with a sample query
 * about a student's performance in a subject.
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:3000/api/principal/ai-assistant';
const TEST_QUERY = 'وضعیت کوثر زینلی در درس ریاضی چگونه است؟';

// You need to replace this with a valid session cookie from your browser
// To get this:
// 1. Open browser and login as principal
// 2. Open DevTools (F12)
// 3. Go to Application/Storage > Cookies
// 4. Copy the value of 'user_session' cookie
const SESSION_COOKIE = 'YOUR_SESSION_COOKIE_HERE';

async function testAIAssistant() {
  console.log('🧪 Testing Principal AI Assistant API...\n');
  console.log('📝 Query:', TEST_QUERY);
  console.log('🔗 Endpoint:', API_URL);
  console.log('─'.repeat(60));

  // Prepare request body
  const requestBody = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: TEST_QUERY
      }
    ]
  });

  // Parse URL
  const url = new URL(API_URL);
  const protocol = url.protocol === 'https:' ? https : http;

  // Prepare request options
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'Cookie': `user_session=${SESSION_COOKIE}`
    }
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = protocol.request(options, (res) => {
      console.log(`\n✅ Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log('📋 Response Headers:', res.headers);
      console.log('─'.repeat(60));

      if (res.statusCode !== 200) {
        console.error(`❌ Error: Expected status 200, got ${res.statusCode}`);

        let errorBody = '';
        res.on('data', (chunk) => {
          errorBody += chunk.toString();
        });

        res.on('end', () => {
          console.error('Error Response Body:', errorBody);
          reject(new Error(`HTTP ${res.statusCode}: ${errorBody}`));
        });
        return;
      }

      // Handle streaming response
      let fullResponse = '';

      res.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        fullResponse += chunkStr;
        // Show streaming in real-time
        process.stdout.write(chunkStr);
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        console.log('\n' + '─'.repeat(60));
        console.log(`⏱️  Total Time: ${duration}ms`);
        console.log(`📊 Response Length: ${fullResponse.length} characters`);

        // Analyze response
        console.log('\n🔍 Response Analysis:');
        const hasTable = fullResponse.includes('|');
        const hasNumbers = /[\u06F0-\u06F9\d]/.test(fullResponse);
        const hasStudent = fullResponse.includes('کوثر');
        const hasSubject = fullResponse.includes('ریاضی');

        console.log(`  ✓ Contains Tables: ${hasTable ? '✅' : '❌'}`);
        console.log(`  ✓ Contains Numbers: ${hasNumbers ? '✅' : '❌'}`);
        console.log(`  ✓ Mentions Student: ${hasStudent ? '✅' : '❌'}`);
        console.log(`  ✓ Mentions Subject: ${hasSubject ? '✅' : '❌'}`);

        resolve(fullResponse);
      });
    });

    req.on('error', (error) => {
      console.error('\n❌ Request Error:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout after 30 seconds'));
    });

    // Send request body
    req.write(requestBody);
    req.end();
  });
}

// Instructions for running the test
if (SESSION_COOKIE === 'YOUR_SESSION_COOKIE_HERE') {
  console.log('⚠️  Setup Required!\n');
  console.log('To run this test, you need to:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Login as a principal');
  console.log('3. Open Browser DevTools (F12)');
  console.log('4. Go to: Application > Storage > Cookies');
  console.log('5. Copy the value of "user_session" cookie');
  console.log('6. Edit this file and replace SESSION_COOKIE value');
  console.log('7. Run: node test-ai-assistant.js\n');
  process.exit(0);
}

// Run the test
testAIAssistant()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
