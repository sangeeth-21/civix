import mongoose, { Document, Schema } from 'mongoose';

// Response interface
export interface ITicketResponse {
  userId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  isSystemMessage?: boolean;
}

// Support ticket interface
export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'booking' | 'other';
  responses: ITicketResponse[];
  createdAt: Date;
  updatedAt: Date;
  userDeleted: boolean;
}

// Response schema
const TicketResponseSchema = new Schema<ITicketResponse>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  }
});

// Support ticket schema
const SupportTicketSchema = new Schema<ISupportTicket>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'account', 'booking', 'other'],
    default: 'other'
  },
  responses: [TicketResponseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  userDeleted: {
    type: Boolean,
    default: false
  }
});

// Only run indexing on server side to avoid browser warnings
if (typeof window === 'undefined') {
  // Create indexes
  SupportTicketSchema.index({ userId: 1, status: 1 });
  SupportTicketSchema.index({ createdAt: -1 });
  SupportTicketSchema.index({ updatedAt: -1 });
}

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema); 