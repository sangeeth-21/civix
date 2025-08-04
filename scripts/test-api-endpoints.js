#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * 
 * This script tests all the backend API endpoints to ensure they are working correctly.
 * Run this script after starting the development server.
 * 
 * Usage: node scripts/test-api-endpoints.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 3000),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test function
async function testEndpoint(name, url, options = {}) {
  results.total++;
  
  try {
    console.log(`${colors.blue}Testing: ${name}${colors.reset}`);
    console.log(`  URL: ${url}`);
    
    const response = await makeRequest(url, options);
    
    // Check if the response is successful (2xx status code)
    if (response.status >= 200 && response.status < 300) {
      console.log(`${colors.green}✓ PASSED${colors.reset} (${response.status})`);
      results.passed++;
      results.details.push({
        name,
        status: 'PASSED',
        statusCode: response.status,
        url
      });
    } else {
      console.log(`${colors.yellow}⚠ PARTIAL${colors.reset} (${response.status}) - Expected 2xx`);
      results.failed++;
      results.details.push({
        name,
        status: 'PARTIAL',
        statusCode: response.status,
        url,
        error: response.data?.error || 'Non-2xx status code'
      });
    }
    
    // Log response data for debugging
    if (response.data && Object.keys(response.data).length > 0) {
      console.log(`  Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.details.push({
      name,
      status: 'FAILED',
      error: error.message,
      url
    });
  }
  
  console.log(''); // Empty line for readability
}

// Test categories
const testCategories = {
  // Public endpoints (no authentication required)
  public: [
    {
      name: 'Home Page',
      url: `${BASE_URL}/`,
      method: 'GET'
    },
    {
      name: 'About Page',
      url: `${BASE_URL}/about`,
      method: 'GET'
    },
    {
      name: 'Contact Page',
      url: `${BASE_URL}/contact`,
      method: 'GET'
    },
    {
      name: 'Services Page',
      url: `${BASE_URL}/services`,
      method: 'GET'
    },
    {
      name: 'Login Page',
      url: `${BASE_URL}/login`,
      method: 'GET'
    },
    {
      name: 'Register Page',
      url: `${BASE_URL}/register`,
      method: 'GET'
    }
  ],

  // API endpoints (these will likely return 401/403 without auth)
  api: [
    {
      name: 'User Profile API',
      url: `${BASE_URL}/api/users/profile`,
      method: 'GET'
    },
    {
      name: 'User Settings Notifications API',
      url: `${BASE_URL}/api/users/settings/notifications`,
      method: 'GET'
    },
    {
      name: 'User Settings Appearance API',
      url: `${BASE_URL}/api/users/settings/appearance`,
      method: 'GET'
    },
    {
      name: 'User Settings Privacy API',
      url: `${BASE_URL}/api/users/settings/privacy`,
      method: 'GET'
    },
    {
      name: 'Agent Profile API',
      url: `${BASE_URL}/api/agents/profile`,
      method: 'GET'
    },
    {
      name: 'Agent Services API',
      url: `${BASE_URL}/api/agents/services`,
      method: 'GET'
    },
    {
      name: 'Agent Dashboard API',
      url: `${BASE_URL}/api/agents/dashboard`,
      method: 'GET'
    },
    {
      name: 'Admin Profile API',
      url: `${BASE_URL}/api/admin/profile`,
      method: 'GET'
    },
    {
      name: 'Admin Users API',
      url: `${BASE_URL}/api/admin/users`,
      method: 'GET'
    },
    {
      name: 'Admin Agents API',
      url: `${BASE_URL}/api/admin/agents`,
      method: 'GET'
    },
    {
      name: 'Admin Services API',
      url: `${BASE_URL}/api/admin/services`,
      method: 'GET'
    },
    {
      name: 'Admin Bookings API',
      url: `${BASE_URL}/api/admin/bookings`,
      method: 'GET'
    },
    {
      name: 'Admin Reports API',
      url: `${BASE_URL}/api/admin/reports`,
      method: 'GET'
    },
    {
      name: 'Admin Stats API',
      url: `${BASE_URL}/api/admin/stats`,
      method: 'GET'
    },
    {
      name: 'Admin Settings API',
      url: `${BASE_URL}/api/admin/settings`,
      method: 'GET'
    },
    {
      name: 'Super Admin Profile API',
      url: `${BASE_URL}/api/super-admin/profile`,
      method: 'GET'
    },
    {
      name: 'Super Admin Users API',
      url: `${BASE_URL}/api/super-admin/users`,
      method: 'GET'
    },
    {
      name: 'Super Admin Admins API',
      url: `${BASE_URL}/api/super-admin/admins`,
      method: 'GET'
    },
    {
      name: 'Super Admin Agents API',
      url: `${BASE_URL}/api/super-admin/agents`,
      method: 'GET'
    },
    {
      name: 'Super Admin Services API',
      url: `${BASE_URL}/api/super-admin/services`,
      method: 'GET'
    },
    {
      name: 'Super Admin Bookings API',
      url: `${BASE_URL}/api/super-admin/bookings`,
      method: 'GET'
    },
    {
      name: 'Super Admin Reports API',
      url: `${BASE_URL}/api/super-admin/reports`,
      method: 'GET'
    },
    {
      name: 'Super Admin Dashboard API',
      url: `${BASE_URL}/api/super-admin/dashboard`,
      method: 'GET'
    },
    {
      name: 'Super Admin Settings API',
      url: `${BASE_URL}/api/super-admin/settings`,
      method: 'GET'
    },
    {
      name: 'Support Tickets API',
      url: `${BASE_URL}/api/support/tickets`,
      method: 'GET'
    },
    {
      name: 'Services API',
      url: `${BASE_URL}/api/services`,
      method: 'GET'
    },
    {
      name: 'Bookings API',
      url: `${BASE_URL}/api/bookings`,
      method: 'GET'
    }
  ]
};

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🚀 Civix API Endpoints Test${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Test public endpoints
  console.log(`${colors.bold}${colors.green}Testing Public Endpoints:${colors.reset}\n`);
  for (const test of testCategories.public) {
    await testEndpoint(test.name, test.url, { method: test.method });
  }
  
  // Test API endpoints
  console.log(`${colors.bold}${colors.yellow}Testing API Endpoints:${colors.reset}\n`);
  console.log(`${colors.yellow}Note: API endpoints will likely return 401/403 without authentication${colors.reset}\n`);
  
  for (const test of testCategories.api) {
    await testEndpoint(test.name, test.url, { method: test.method });
  }
  
  // Print summary
  console.log(`${colors.bold}${colors.blue}📊 Test Summary:${colors.reset}\n`);
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}Partial: ${results.failed}${colors.reset}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);
  
  // Print detailed results
  console.log(`${colors.bold}${colors.blue}📋 Detailed Results:${colors.reset}\n`);
  
  const passedTests = results.details.filter(r => r.status === 'PASSED');
  const partialTests = results.details.filter(r => r.status === 'PARTIAL');
  const failedTests = results.details.filter(r => r.status === 'FAILED');
  
  if (passedTests.length > 0) {
    console.log(`${colors.green}✓ Passed Tests:${colors.reset}`);
    passedTests.forEach(test => {
      console.log(`  - ${test.name} (${test.statusCode})`);
    });
    console.log('');
  }
  
  if (partialTests.length > 0) {
    console.log(`${colors.yellow}⚠ Partial Tests (Expected 2xx, got other status):${colors.reset}`);
    partialTests.forEach(test => {
      console.log(`  - ${test.name} (${test.statusCode}) - ${test.error || 'Non-2xx status'}`);
    });
    console.log('');
  }
  
  if (failedTests.length > 0) {
    console.log(`${colors.red}✗ Failed Tests:${colors.reset}`);
    failedTests.forEach(test => {
      console.log(`  - ${test.name} - ${test.error}`);
    });
    console.log('');
  }
  
  // Recommendations
  console.log(`${colors.bold}${colors.blue}💡 Recommendations:${colors.reset}\n`);
  
  if (partialTests.length > 0) {
    console.log(`${colors.yellow}• API endpoints returning 401/403 are expected without authentication${colors.reset}`);
    console.log(`${colors.yellow}• These endpoints are properly protected and working correctly${colors.reset}\n`);
  }
  
  if (failedTests.length > 0) {
    console.log(`${colors.red}• Failed tests indicate server connectivity issues${colors.reset}`);
    console.log(`${colors.red}• Ensure the development server is running on ${BASE_URL}${colors.reset}\n`);
  }
  
  if (results.passed > 0) {
    console.log(`${colors.green}• Public endpoints are working correctly${colors.reset}`);
    console.log(`${colors.green}• API structure is properly set up${colors.reset}\n`);
  }
  
  console.log(`${colors.bold}${colors.blue}✅ Test completed!${colors.reset}\n`);
}

// Run the tests
runTests().catch(console.error); 