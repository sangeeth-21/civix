import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// Settings interfaces
export interface INotificationSettings {
  email: boolean;
  sms: boolean;
  marketing: boolean;
  reminders: boolean;
}

export interface IAppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reduceAnimations: boolean;
  highContrast: boolean;
}

export interface IPrivacySettings {
  profileVisibility: 'public' | 'contacts' | 'private';
  shareBookingHistory: boolean;
  shareContactInfo: boolean;
  allowDataCollection: boolean;
}

export interface IUserSettings {
  notifications: INotificationSettings;
  appearance: IAppearanceSettings;
  privacy: IPrivacySettings;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "USER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  phone?: string;
  address?: string;
  isActive: boolean;
  settings?: IUserSettings;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Settings schemas
const NotificationSettingsSchema = new Schema<INotificationSettings>({
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: false },
  marketing: { type: Boolean, default: false },
  reminders: { type: Boolean, default: true }
}, { _id: false });

const AppearanceSettingsSchema = new Schema<IAppearanceSettings>({
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  reduceAnimations: { type: Boolean, default: false },
  highContrast: { type: Boolean, default: false }
}, { _id: false });

const PrivacySettingsSchema = new Schema<IPrivacySettings>({
  profileVisibility: { type: String, enum: ['public', 'contacts', 'private'], default: 'public' },
  shareBookingHistory: { type: Boolean, default: false },
  shareContactInfo: { type: Boolean, default: false },
  allowDataCollection: { type: Boolean, default: true }
}, { _id: false });

const UserSettingsSchema = new Schema<IUserSettings>({
  notifications: { type: NotificationSettingsSchema, default: () => ({}) },
  appearance: { type: AppearanceSettingsSchema, default: () => ({}) },
  privacy: { type: PrivacySettingsSchema, default: () => ({}) }
}, { _id: false });

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
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
    settings: { type: UserSettingsSchema, default: () => ({}) },
    lastLogin: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Only run indexing on server side to avoid browser warnings
if (typeof window === 'undefined') {
  // Create indexes for better query performance
  UserSchema.index({ email: 1 }, { unique: true });
  UserSchema.index({ role: 1 });
  UserSchema.index({ resetPasswordToken: 1 });
}

// Prevent model compilation error in development due to hot reloading
let User: Model<IUser>;

if (mongoose.models && mongoose.models.User) {
  User = mongoose.models.User as Model<IUser>;
} else {
  User = mongoose.model<IUser>("User", UserSchema);
}

export default User;