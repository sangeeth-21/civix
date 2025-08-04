const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Hash password pre-save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ resetPasswordToken: 1 });

const User = mongoose.model('User', userSchema);

// Admin users data
const adminUsers = [
  {
    name: "System Administrator",
    email: "admin@civix.com",
    password: "Admin@2024!",
    role: "ADMIN",
    phone: "+1-555-0101",
    address: "123 Admin Street, Tech City, TC 12345",
    isActive: true
  },
  {
    name: "Operations Manager",
    email: "operations@civix.com",
    password: "Ops@2024!",
    role: "ADMIN",
    phone: "+1-555-0102",
    address: "456 Operations Ave, Business District, BD 67890",
    isActive: true
  },
  {
    name: "Support Manager",
    email: "support@civix.com",
    password: "Support@2024!",
    role: "ADMIN",
    phone: "+1-555-0103",
    address: "789 Support Blvd, Help Center, HC 11111",
    isActive: true
  }
];

// Super Admin users data
const superAdminUsers = [
  {
    name: "Super Administrator",
    email: "superadmin@civix.com",
    password: "SuperAdmin@2024!",
    role: "SUPER_ADMIN",
    phone: "+1-555-0001",
    address: "999 Super Admin Plaza, Executive District, ED 00000",
    isActive: true
  },
  {
    name: "System Owner",
    email: "owner@civix.com",
    password: "Owner@2024!",
    role: "SUPER_ADMIN",
    phone: "+1-555-0002",
    address: "888 Owner Tower, Corporate Center, CC 99999",
    isActive: true
  }
];

async function seedAdminUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    console.log('\n🚀 Starting admin and super-admin user seeding...\n');
    
    // Seed Admin Users
    console.log('👥 Seeding Admin Users...');
    for (const adminData of adminUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: adminData.email });
        
        if (existingUser) {
          console.log(`⚠️  Admin user already exists: ${adminData.email}`);
          continue;
        }
        
        // Create new admin user
        const adminUser = new User(adminData);
        await adminUser.save();
        
        console.log(`✅ Created Admin User: ${adminUser.name} (${adminUser.email})`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Password: ${adminData.password}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating admin user ${adminData.email}:`, error.message);
      }
    }
    
    // Seed Super Admin Users
    console.log('👑 Seeding Super Admin Users...');
    for (const superAdminData of superAdminUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: superAdminData.email });
        
        if (existingUser) {
          console.log(`⚠️  Super Admin user already exists: ${superAdminData.email}`);
          continue;
        }
        
        // Create new super admin user
        const superAdminUser = new User(superAdminData);
        await superAdminUser.save();
        
        console.log(`✅ Created Super Admin User: ${superAdminUser.name} (${superAdminUser.email})`);
        console.log(`   Role: ${superAdminUser.role}`);
        console.log(`   Password: ${superAdminData.password}`);
        console.log('');
        
      } catch (error) {
        console.error(`❌ Error creating super admin user ${superAdminData.email}:`, error.message);
      }
    }
    
    // Display summary
    console.log('📊 Seeding Summary:');
    const totalAdmins = await User.countDocuments({ role: "ADMIN" });
    const totalSuperAdmins = await User.countDocuments({ role: "SUPER_ADMIN" });
    
    console.log(`   Total Admin Users: ${totalAdmins}`);
    console.log(`   Total Super Admin Users: ${totalSuperAdmins}`);
    
    console.log('\n🎉 Admin and Super Admin user seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================================');
    
    // Display all admin credentials
    const allAdmins = await User.find({ role: { $in: ["ADMIN", "SUPER_ADMIN"] } }).select('name email role');
    
    for (const admin of allAdmins) {
      const userData = [...adminUsers, ...superAdminUsers].find(u => u.email === admin.email);
      console.log(`\n👤 ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Password: ${userData ? userData.password : 'Check script for password'}`);
    }
    
    console.log('\n=====================================');
    console.log('🔐 Please change these passwords after first login!');
    console.log('🔒 Store these credentials securely!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Function to validate password strength
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    throw new Error('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    throw new Error('Password must contain at least one special character');
  }
  
  return true;
}

// Validate all passwords before seeding
console.log('🔍 Validating passwords...');
try {
  [...adminUsers, ...superAdminUsers].forEach(user => {
    validatePassword(user.password);
  });
  console.log('✅ All passwords meet security requirements');
} catch (error) {
  console.error('❌ Password validation failed:', error.message);
  process.exit(1);
}

// Run the seeding script
seedAdminUsers(); 