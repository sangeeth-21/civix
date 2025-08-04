#!/usr/bin/env node

/**
 * Auth.js (NextAuth) Configuration Verification Script
 * 
 * This script checks if required environment variables are set
 * for proper Auth.js functioning in production.
 */

// Load environment variables
require('dotenv').config();

// Required variables
const requiredVars = [
  'NEXTAUTH_URL',
  'AUTH_SECRET', 
  'NEXTAUTH_SECRET',
  'MONGODB_URI'
];

// Optional but recommended variables
const recommendedVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SITE_URL'
];

console.log('\n🔐 Auth.js (NextAuth) Configuration Checker\n');

// Check required variables
console.log('Required variables:');
let hasErrors = false;

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`❌ ${varName}: Missing`);
    hasErrors = true;
  } else {
    // Show first few characters for secrets
    if (varName.includes('SECRET')) {
      const secret = process.env[varName];
      console.log(`✅ ${varName}: ${secret.substring(0, 5)}...${secret.substring(secret.length - 3)}`);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
    }
  }
});

// Check recommended variables
console.log('\nRecommended variables:');
recommendedVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`⚠️ ${varName}: Missing`);
  } else {
    console.log(`✅ ${varName}: ${process.env[varName]}`);
  }
});

// Check NEXTAUTH_URL for production
if (process.env.NEXTAUTH_URL) {
  const url = process.env.NEXTAUTH_URL.toLowerCase();
  
  if (!url.startsWith('https://')) {
    console.log('\n⚠️ Warning: NEXTAUTH_URL should use HTTPS in production');
  }
  
  if (url === 'https://civix.in' || url.includes('civix.in')) {
    console.log('\n✅ NEXTAUTH_URL is correctly set to your production domain');
  } else {
    console.log('\n⚠️ Warning: NEXTAUTH_URL does not match your production domain (civix.in)');
  }
}

// Show guidance if errors
if (hasErrors) {
  console.log('\n❌ Configuration issues found. Please set all required environment variables.');
  console.log('\nAdd to your .env or deployment environment:');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      if (varName === 'NEXTAUTH_URL') {
        console.log(`${varName}=https://civix.in`);
      } else if (varName.includes('SECRET')) {
        console.log(`${varName}=your_secure_random_string_here`);
      } else if (varName === 'MONGODB_URI') {
        console.log(`${varName}=your_mongodb_connection_string`);
      } else {
        console.log(`${varName}=needed_value`);
      }
    }
  });
} else {
  console.log('\n✅ All required environment variables are set.');
}

console.log('\nFor more information, refer to docs/DEPLOYMENT-ENV-GUIDE.md');
console.log(''); 