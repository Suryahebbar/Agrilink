import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandIntegration } from '@/lib/models/LandIntegration';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';

export interface AdminDashboardStats {
  totalFarmers: number;
  pendingFarmerApprovals: number;
  totalFarmPools: number;
  activeFarmPools: number;
  totalFcos: number;
  pendingAgreements: number;
  totalBlockchainAgreements: number;
  revenueOverview: number;
  totalInsuranceRequests: number;
  blockchainRecords: number;
}

export class AdminService {
  static async getDashboardStats(): Promise<AdminDashboardStats> {
    await connectDB();

    const [
      totalFarmers,
      pendingFarmerApprovals,
      totalFarmPools,
      activeFarmPools,
      pendingAgreements,
      totalBlockchainAgreements,
      blockchainRecords
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }).catch(() => 0),
      FarmerProfile.countDocuments({ nameVerificationStatus: 'pending' }).catch(() => 0),
      LandIntegration.countDocuments().catch(() => 0),
      LandIntegration.countDocuments({ status: { $in: ['accepted', 'completed'] } }).catch(() => 0),
      LandIntegration.countDocuments({ status: 'pending' }).catch(() => 0),
      LandIntegration.countDocuments({ 'blockchain.agreementId': { $exists: true, $ne: '' } }).catch(() => 0),
      LandIntegration.countDocuments({ 'blockchain.transactionHash': { $exists: true, $ne: '' } }).catch(() => 0),
    ]);

    return {
      totalFarmers,
      pendingFarmerApprovals,
      totalFarmPools,
      activeFarmPools,
      totalFcos: 0, // Placeholder as FCO module is not yet implemented
      pendingAgreements,
      totalBlockchainAgreements,
      revenueOverview: 0, // Placeholder
      totalInsuranceRequests: 0, // Placeholder
      blockchainRecords
    };
  }

  static async getRecentActivities(limit = 10) {
    await connectDB();

    try {
      const logs = await AdminAuditLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return logs.map((log: any) => ({
        id: log._id.toString(),
        type: log.resourceType,
        action: log.action,
        title: this.formatActivityTitle(log),
        description: log.errorMessage || `${log.userName || 'System'} performed ${log.action} on ${log.resourceType}`,
        timestamp: log.timestamp || log.createdAt,
        user: log.userName || log.userEmail || 'System',
        status: log.status
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  private static formatActivityTitle(log: any): string {
    const resource = log.resourceType.toUpperCase();
    const action = log.action.toUpperCase();
    return `${resource} ${action}`;
  }
}
