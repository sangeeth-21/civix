import mongoose, { Schema, Document, Model } from "mongoose";

export interface IService extends Document {
  title: string;
  description: string;
  price: number;
  category: string;
  agentId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Only run indexing on server side to avoid browser warnings
if (typeof window === 'undefined') {
  // Add text search index
  ServiceSchema.index({ title: "text", description: "text", category: "text" });
}

// Prevent model compilation error in development due to hot reloading
const Service = (mongoose.models.Service as Model<IService>) || 
                mongoose.model<IService>("Service", ServiceSchema);

export default Service; 