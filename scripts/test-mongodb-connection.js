#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

/**
 * Test MongoDB connection script
 * This script tests the MongoDB connection and shows connection status
 */

console.log('🧪 Testing MongoDB connection...\n');

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production';

console.log(`📋 Configuration:`);
console.log(`   • MongoDB URI: ${MONGODB_URI}`);
console.log(`   • NODE_ENV: ${process.env.NODE_ENV}`);
console.log('');

// Set up connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully!');
  console.log(`   • Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
  console.log(`   • Host: ${mongoose.connection.host}`);
  console.log(`   • Port: ${mongoose.connection.port}`);
  console.log(`   • Ready State: ${mongoose.connection.readyState}`);
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error.message);
  
  // Provide helpful error messages
  if (error.message.includes('ECONNREFUSED')) {
    console.error('\n💡 MongoDB is not running. Please start MongoDB:');
    console.error('   • Windows: Start MongoDB service or run mongod');
    console.error('   • macOS: brew services start mongodb-community');
    console.error('   • Linux: sudo systemctl start mongod');
  } else if (error.message.includes('ENOTFOUND')) {
    console.error('\n💡 Cannot resolve MongoDB host. Check your MONGODB_URI');
  } else if (error.message.includes('Authentication failed')) {
    console.error('\n💡 Authentication failed. Check your MongoDB credentials');
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Test connection function
async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(MONGODB_URI, opts);
    
    // Wait a bit to see connection events
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // List all databases
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('📚 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`   • ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Test creating a collection
    const testCollection = mongoose.connection.db.collection('test_connection');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Test document inserted successfully');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
    process.exit(0);
  }
}

// Run the test
testConnection(); 