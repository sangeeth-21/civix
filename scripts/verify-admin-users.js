const mongoose = require('mongoose');

// User schema (matching the production model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"],
    default: "USER"
  },
  phone: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      reminders: { type: Boolean, default: true }
    },
    appearance: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      reduceAnimations: { type: Boolean, default: false },
      highContrast: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'contacts', 'private'], default: 'public' },
      shareBookingHistory: { type: Boolean, default: false },
      shareContactInfo: { type: Boolean, default: false },
      allowDataCollection: { type: Boolean, default: true }
    }
  },
  lastLogin: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Create indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordToken: 1 });

const User = mongoose.model('User', userSchema);

async function verifyAdminUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    console.log('\n🔍 Verifying admin and super-admin users...\n');
    
    // Get all admin and super-admin users
    const adminUsers = await User.find({ role: "ADMIN" }).select('name email role isActive createdAt');
    const superAdminUsers = await User.find({ role: "SUPER_ADMIN" }).select('name email role isActive createdAt');
    
    console.log('👥 Admin Users:');
    console.log('==============');
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
    }
    
    console.log('👑 Super Admin Users:');
    console.log('=====================');
    if (superAdminUsers.length === 0) {
      console.log('❌ No super admin users found');
    } else {
      superAdminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log('===========');
    console.log(`Total Admin Users: ${adminUsers.length}`);
    console.log(`Total Super Admin Users: ${superAdminUsers.length}`);
    console.log(`Total Admin + Super Admin Users: ${adminUsers.length + superAdminUsers.length}`);
    
    // Check if all expected users exist
    const expectedEmails = [
      'admin@civix.com',
      'operations@civix.com', 
      'support@civix.com',
      'superadmin@civix.com',
      'owner@civix.com'
    ];
    
    const allAdminEmails = [...adminUsers, ...superAdminUsers].map(u => u.email);
    const missingEmails = expectedEmails.filter(email => !allAdminEmails.includes(email));
    
    if (missingEmails.length > 0) {
      console.log('\n⚠️  Missing expected users:');
      missingEmails.forEach(email => console.log(`   - ${email}`));
    } else {
      console.log('\n✅ All expected admin users are present!');
    }
    
    // Check for any inactive users
    const inactiveUsers = [...adminUsers, ...superAdminUsers].filter(u => !u.isActive);
    if (inactiveUsers.length > 0) {
      console.log('\n⚠️  Inactive admin users:');
      inactiveUsers.forEach(user => console.log(`   - ${user.name} (${user.email})`));
    } else {
      console.log('\n✅ All admin users are active!');
    }
    
    console.log('\n🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the verification script
verifyAdminUsers(); 