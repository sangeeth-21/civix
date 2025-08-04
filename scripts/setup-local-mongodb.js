#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup script for local MongoDB configuration
 * This script creates a .env.local file with local MongoDB settings
 */

console.log('🚀 Setting up local MongoDB configuration for Civix...\n');

// Generate a secure random secret for development
function generateSecret() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Main function to create .env.local file
async function setupLocalMongoDB() {
  try {
    console.log('📝 Creating .env.local file with local MongoDB configuration...\n');

    const secret = generateSecret();
    
    // Generate .env content
    const envContent = `# Database Configuration - Local MongoDB
MONGODB_URI=mongodb://localhost:27017/civix_fInal_production

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_SECRET=${secret}
NEXTAUTH_SECRET=${secret}

# Email Configuration (Optional for local development)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password-here

# Debug Settings (Set to true for development)
NEXTAUTH_DEBUG=true

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Civix
NEXT_PUBLIC_SITE_DESCRIPTION=Professional service booking platform
NEXT_PUBLIC_CONTACT_EMAIL=support@civix.com
NEXT_PUBLIC_CONTACT_PHONE=+1 (555) 123-4567

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
`;

    // Write to .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ .env.local file created successfully!');
    console.log('📍 Location:', envPath);
    console.log('\n📋 Configuration Summary:');
    console.log('   • MongoDB URI: mongodb://localhost:27017/civix_fInal_production');
    console.log('   • NextAuth URL: http://localhost:3000');
    console.log('   • Debug Mode: Enabled');
    console.log('   • Secret Keys: Generated automatically');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Make sure MongoDB is installed and running locally');
    console.log('   2. Start MongoDB service: mongod');
    console.log('   3. Run the development server: npm run dev');
    console.log('   4. Seed the database: npm run seed:all');
    
    console.log('\n💡 MongoDB Installation:');
    console.log('   • Windows: Download from https://www.mongodb.com/try/download/community');
    console.log('   • macOS: brew install mongodb-community');
    console.log('   • Linux: sudo apt-get install mongodb');
    
    console.log('\n🚀 You\'re ready to use local MongoDB!');

  } catch (error) {
    console.error('\n❌ Error creating .env.local file:', error);
    process.exit(1);
  }
}

// Run the setup
setupLocalMongoDB(); 