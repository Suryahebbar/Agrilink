import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandIntegration } from '@/lib/models/LandIntegration';
import { AdminAuditLog } from '@/lib/models/AdminAuditLog';
import { Seller, Product, Order } from '@/lib/models/supplier';

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
  // Supplier Metrics
  totalSuppliers: number;
  verifiedSuppliers: number;
  pendingSupplierApprovals: number;
  totalSupplierProducts: number;
  totalSupplierOrders: number;
  totalSupplierRevenue: number;
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
      blockchainRecords,
      userSuppliersCount,
      sellerSuppliersCount,
      userVerifiedSuppliers,
      sellerVerifiedSuppliers,
      userPendingSuppliers,
      sellerPendingSuppliers,
      totalSupplierProducts,
      totalSupplierOrders,
      orderRevenueResult
    ] = await Promise.all([
      User.countDocuments({ role: 'farmer' }).catch(() => 0),
      FarmerProfile.countDocuments({ nameVerificationStatus: 'pending' }).catch(() => 0),
      LandIntegration.countDocuments().catch(() => 0),
      LandIntegration.countDocuments({ status: { $in: ['accepted', 'completed'] } }).catch(() => 0),
      LandIntegration.countDocuments({ status: 'pending' }).catch(() => 0),
      LandIntegration.countDocuments({ 'blockchain.agreementId': { $exists: true, $ne: '' } }).catch(() => 0),
      LandIntegration.countDocuments({ 'blockchain.transactionHash': { $exists: true, $ne: '' } }).catch(() => 0),
      User.countDocuments({ role: 'supplier' }).catch(() => 0),
      Seller.countDocuments().catch(() => 0),
      User.countDocuments({ role: 'supplier', verificationStatus: 'verified' }).catch(() => 0),
      Seller.countDocuments({ verificationStatus: 'verified' }).catch(() => 0),
      User.countDocuments({ role: 'supplier', verificationStatus: 'pending' }).catch(() => 0),
      Seller.countDocuments({ verificationStatus: 'pending' }).catch(() => 0),
      Product.countDocuments().catch(() => 0),
      Order.countDocuments().catch(() => 0),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).catch(() => [])
    ]);

    const totalSuppliers = (userSuppliersCount || 0) + (sellerSuppliersCount || 0);
    const verifiedSuppliers = (userVerifiedSuppliers || 0) + (sellerVerifiedSuppliers || 0);
    const pendingSupplierApprovals = (userPendingSuppliers || 0) + (sellerPendingSuppliers || 0);
    const totalSupplierRevenue = orderRevenueResult?.[0]?.total || 0;

    return {
      totalFarmers,
      pendingFarmerApprovals,
      totalFarmPools,
      activeFarmPools,
      totalFcos: 0, // Placeholder as FCO module is not yet implemented
      pendingAgreements,
      totalBlockchainAgreements,
      revenueOverview: totalSupplierRevenue,
      totalInsuranceRequests: 0, // Placeholder
      blockchainRecords,
      totalSuppliers,
      verifiedSuppliers,
      pendingSupplierApprovals,
      totalSupplierProducts: totalSupplierProducts || 0,
      totalSupplierOrders: totalSupplierOrders || 0,
      totalSupplierRevenue
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
