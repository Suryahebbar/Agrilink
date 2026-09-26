import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmPoolingInvitation extends Document {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected';
  integrationRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FarmPoolingInvitationSchema = new Schema<IFarmPoolingInvitation>({
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  receiverId: { type: String, required: true, index: true },
  receiverName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  integrationRequestId: { type: String }
}, {
  timestamps: true
});

export const FarmPoolingInvitation = mongoose.models.FarmPoolingInvitation || mongoose.model<IFarmPoolingInvitation>('FarmPoolingInvitation', FarmPoolingInvitationSchema);
