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

async function resetUserPassword() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civix_fInal_production';
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Find the existing user
    const userEmail = 'tectoviaquiz@gmail.com';
    const newPassword = 'password123';
    
    console.log(`🔍 Looking for user: ${userEmail}`);
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    // Reset password
    console.log(`🔐 Resetting password to: ${newPassword}`);
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Password reset successfully');
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare(newPassword, user.password);
    console.log('🔍 Password verification test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    // Test with the user's comparePassword method
    const isPasswordValidMethod = await user.comparePassword(newPassword);
    console.log('🔍 Method verification test:', isPasswordValidMethod ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n🎉 Password reset completed!');
    console.log('You can now login with:');
    console.log(`Email: ${userEmail}`);
    console.log(`Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
resetUserPassword(); 