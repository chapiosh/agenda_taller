#!/usr/bin/env node

const API_BASE_URL = 'https://fquuajdbnlipavxiaqah.supabase.co/functions/v1/api';

async function testEndpoint(name, endpoint) {
  try {
    console.log(`\nTesting ${name}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`✓ ${name} - OK`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      return true;
    } else {
      console.log(`✗ ${name} - Error: ${data.error || response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ ${name} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Testing Mechanic Shop REST API endpoints...');
  console.log(`Base URL: ${API_BASE_URL}\n`);
  console.log('='.repeat(60));

  const tests = [
    ['GET /stats', '/stats'],
    ['GET /appointments', '/appointments'],
    ['GET /vehicles', '/vehicles'],
    ['GET /vehicles/workflow', '/vehicles/workflow'],
    ['GET /cotizaciones', '/cotizaciones'],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, endpoint] of tests) {
    const result = await testEndpoint(name, endpoint);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✓ All tests passed! The API is accessible.');
    console.log('  The MCP server should work correctly.\n');
  } else {
    console.log('\n✗ Some tests failed. Check your network connection.');
    console.log('  The MCP server may not work properly.\n');
  }
}

runTests().catch(console.error);
