import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledDate: Date;
  amount: number;
  totalAmount?: number;
  rating?: number;
  notes?: string;
  agentNotes?: string;
  notifications?: {
    confirmationSent: boolean;
    confirmationSentAt?: Date;
    statusUpdateSent?: boolean;
    statusUpdateSentAt?: Date;
    lastNotificationType?: string;
    notificationHistory?: Array<{
      type: string;
      sentAt: Date;
      success: boolean;
    }>;
  };
  statusHistory?: Array<{
    status: string;
    updatedAt: Date;
    updatedBy?: mongoose.Types.ObjectId;
  }>;
  lastStatusUpdate?: Date;
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
      default: "PENDING"
    },
    scheduledDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    totalAmount: { type: Number },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    agentNotes: { type: String },
    notifications: {
      confirmationSent: { type: Boolean, default: false },
      confirmationSentAt: { type: Date },
      statusUpdateSent: { type: Boolean, default: false },
      statusUpdateSentAt: { type: Date },
      lastNotificationType: { type: String },
      notificationHistory: [{
        type: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
        success: { type: Boolean, default: true }
      }]
    },
    statusHistory: [{
      status: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
    }],
    lastStatusUpdate: { type: Date },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

// Add pre-save middleware to track status changes
BookingSchema.pre('save', function(next) {
  const booking = this as IBooking;
  
  // If this is a new booking, add to status history
  if (booking.isNew) {
    booking.statusHistory = [{
      status: booking.status,
      updatedAt: new Date(),
    }];
    booking.lastStatusUpdate = new Date();
  } 
  // If status has changed on an existing booking
  else if (booking.isModified('status')) {
    if (!booking.statusHistory) booking.statusHistory = [];
    booking.statusHistory.push({
      status: booking.status,
      updatedAt: new Date(),
    });
    booking.lastStatusUpdate = new Date();
  }
  
  next();
});

// Only run indexing on server side to avoid browser warnings
if (typeof window === 'undefined') {
  // Create compound index for faster queries
  BookingSchema.index({ userId: 1, status: 1 });
  BookingSchema.index({ agentId: 1, status: 1 });
  BookingSchema.index({ scheduledDate: 1 });
  BookingSchema.index({ lastStatusUpdate: -1 });
}

// Prevent model compilation error in development due to hot reloading
const Booking = (mongoose.models.Booking as Model<IBooking>) || 
                mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking; 