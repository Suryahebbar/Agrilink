import { Types } from 'mongoose';

declare module '@/lib/models/LandIntegration' {
  interface LandIntegrationDocument {
    _id: Types.ObjectId;
    requestingUser: Types.ObjectId | string;
    targetUser: Types.ObjectId | string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    executionDate: Date;
    landDetails: {
      totalIntegratedSize: number;
      requestingUser: {
        landParcelId: Types.ObjectId | string;
        sizeInAcres: number;
        contributionRatio: number;
      };
      targetUser: {
        landParcelId: Types.ObjectId | string;
        sizeInAcres: number;
        contributionRatio: number;
      };
    };
    signatures?: Array<{
      userId: Types.ObjectId | string;
      userName: string;
      signature: string;
      signedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }

  const LandIntegration: import('mongoose').Model<LandIntegrationDocument>;
  export default LandIntegration;
}

// Extend the global Express namespace to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}
