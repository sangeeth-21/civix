const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

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
  state: { type: String },
  experience: { type: String },
  specialization: { type: String },
  rating: { type: Number },
  totalJobs: { type: Number },
  isVerified: { type: Boolean, default: false },
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

const User = mongoose.model('User', userSchema);

async function cleanCollection() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://machanva252:T0ea8F0QGIuMp0za@civix.mmj0ip4.mongodb.net/?retryWrites=true&w=majority&appName=civix';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    const existingCount = await User.countDocuments();
    console.log(`📊 Found ${existingCount} existing users`);
    if (existingCount === 0) {
      console.log('ℹ️  No users to delete');
      return;
    }
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Successfully deleted ${deleteResult.deletedCount} users`);
    console.log('🧹 Collection cleaned successfully!');
  } catch (error) {
    console.error('❌ Failed to clean collection:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function seedUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://machanva252:T0ea8F0QGIuMp0za@civix.mmj0ip4.mongodb.net/?retryWrites=true&w=majority&appName=civix';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');
    const jsonPath = path.join(__dirname, '..', 'civix.users.json');
    let usersData;
    try {
      usersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      console.error('❌ Failed to read or parse civix.users.json:', err);
      process.exitCode = 1;
      return;
    }
    console.log(`📖 Found ${usersData.length} users in the JSON file`);
    const deleteResult = await User.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing users`);
    const processedUsers = [];
    const errors = [];
    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      try {
        const universalPassword = "Civix@2025";
        const userObject = {
          name: userData.name,
          email: userData.email,
          password: universalPassword,
          role: userData.role,
          phone: userData.phone,
          address: userData.address,
          state: userData.state,
          experience: userData.experience,
          specialization: userData.specialization,
          rating: userData.rating,
          totalJobs: userData.totalJobs,
          isVerified: userData.isVerified || false,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          settings: userData.settings || {
            notifications: {
              email: true,
              sms: false,
              marketing: false,
              reminders: true
            },
            appearance: {
              theme: 'system',
              fontSize: 'medium',
              reduceAnimations: false,
              highContrast: false
            },
            privacy: {
              profileVisibility: 'public',
              shareBookingHistory: false,
              shareContactInfo: false,
              allowDataCollection: true
            }
          }
        };
        const user = new User(userObject);
        await user.save();
        processedUsers.push({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: '✅ Created'
        });
        console.log(`✅ Created user ${i + 1}/${usersData.length}: ${userData.name} (${userData.email}) - ${userData.role}`);
      } catch (error) {
        const errorMsg = `Failed to create user ${userData.name} (${userData.email}): ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    // Summary
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`✅ Successfully created: ${processedUsers.length} users`);
    console.log(`❌ Errors: ${errors.length}`);
    if (processedUsers.length > 0) {
      console.log('\n👥 CREATED USERS:');
      console.log('================');
      const usersByRole = processedUsers.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = [];
        acc[user.role].push(user);
        return acc;
      }, {});
      Object.entries(usersByRole).forEach(([role, users]) => {
        console.log(`\n🔸 ${role} (${users.length} users):`);
        users.forEach(user => {
          console.log(`   • ${user.name} - ${user.email}`);
        });
      });
      console.log('\n🔐 LOGIN CREDENTIALS');
      console.log('===================');
      console.log('All users have been created with the password: Civix@2025');
      console.log('\n📧 Sample login emails:');
      Object.entries(usersByRole).forEach(([role, users]) => {
        if (users.length > 0) {
          console.log(`\n${role}:`);
          users.slice(0, 3).forEach(user => {
            console.log(`   • ${user.email}`);
          });
          if (users.length > 3) {
            console.log(`   • ... and ${users.length - 3} more`);
          }
        }
      });
    }
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      console.log('==========');
      errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }
    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const options = {
  help: args.includes('--help') || args.includes('-h'),
  dryRun: args.includes('--dry-run'),
  clear: args.includes('--clear'),
  clean: args.includes('--clean')
};

if (options.help) {
  console.log(`
🌱 Civix User Seeder

Usage:
  node scripts/seed-users.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be created without actually creating users
  --clear        Clear all existing users before seeding
  --clean        Clean collection (delete all users) and exit

Examples:
  node scripts/seed-users.js
  node scripts/seed-users.js --clear
  node scripts/seed-users.js --clean
  node scripts/seed-users.js --help
`);
  process.exit(0);
}

async function main() {
  if (options.clean) {
    await cleanCollection();
    process.exit(0);
  }
  await seedUsers();
  console.log('\n✨ All done!');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });