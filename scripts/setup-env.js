
/**
 * Environment Setup Script for Civix
 * 
 * This script helps set up the required environment variables for Civix.
 * It creates a .env.local file with the necessary configuration.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Generate a secure random string for AUTH_SECRET
function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

// Main function to create .env.local file
async function setupEnv() {
  console.log('\n🔧 Civix Environment Setup\n');
  console.log('This script will help you set up the .env.local file with the necessary configuration.\n');
  
  // Default values
  const defaults = {
    MONGODB_URI: 'mongodb://localhost:27017/civix_fInal_production&authSource=admin',
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    AUTH_SECRET: generateSecret(),
    NEXTAUTH_SECRET: generateSecret(),
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_USER: 'civix.devteam@gmail.com',
    NEXTAUTH_DEBUG: 'false'
  };

  // Get environment from user (development or production)
  let environment = await askQuestion('Which environment are you setting up? (development/production): ', 'development');
  environment = environment.toLowerCase();

  if (environment === 'production') {
    console.log('\n⚠️ Production Environment Settings\n');
    defaults.NEXTAUTH_URL = await askQuestion('Enter your production URL (e.g., https://civix.in): ', 'https://civix.in');
    defaults.NEXT_PUBLIC_APP_URL = defaults.NEXTAUTH_URL;
    defaults.NEXT_PUBLIC_SITE_URL = defaults.NEXTAUTH_URL;
    defaults.NEXTAUTH_DEBUG = 'false';
  }

  // Get MongoDB URI
  console.log('\n📦 Database Configuration\n');
  const mongoDbUri = await askQuestion('Enter your MongoDB URI: ', defaults.MONGODB_URI);

  // Email configuration
  console.log('\n📧 Email Configuration\n');
  const smtpUser = await askQuestion('Enter your SMTP email address: ', defaults.SMTP_USER);
  const smtpPass = await askQuestion('Enter your SMTP password (App Password for Gmail): ', '');

  // Generate .env content
  const envContent = `# Database Configuration
MONGODB_URI=${mongoDbUri}

# NextAuth Configuration
NEXTAUTH_URL=${defaults.NEXTAUTH_URL}
NEXT_PUBLIC_APP_URL=${defaults.NEXT_PUBLIC_APP_URL}
NEXT_PUBLIC_SITE_URL=${defaults.NEXT_PUBLIC_SITE_URL}
AUTH_SECRET=${defaults.AUTH_SECRET}
NEXTAUTH_SECRET=${defaults.NEXTAUTH_SECRET}

# Email Configuration
SMTP_HOST=${defaults.SMTP_HOST}
SMTP_PORT=${defaults.SMTP_PORT}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}

# Debug Settings
NEXTAUTH_DEBUG=${defaults.NEXTAUTH_DEBUG}
`;

  // Write to .env.local file
  try {
    fs.writeFileSync(path.join(process.cwd(), '.env.local'), envContent);
    console.log('\n✅ .env.local file created successfully!');
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
      console.log('✅ logs directory created');
    }
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run `npm run verify:auth` to verify your configuration');
    console.log('2. Run `npm run build` to build your application');
    console.log('3. Run `npm run start` to start your application');
    console.log('\nFor more information, refer to docs/ENV-EXAMPLE.md');
  } catch (error) {
    console.error('\n❌ Error creating .env.local file:', error);
  }

  rl.close();
}

// Helper function to ask questions
function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    const defaultPrompt = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultPrompt}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Run the script
setupEnv().catch(console.error); 