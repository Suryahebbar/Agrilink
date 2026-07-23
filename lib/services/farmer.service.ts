import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import { LandDetails } from '@/lib/models/LandDetails';
import { LandIntegration } from '@/lib/models/LandIntegration';
import { ActivityService } from '@/lib/services/activity.service';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export interface GetFarmersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  aadhaarStatus?: string;
  rtcStatus?: string;
  district?: string;
  taluk?: string;
  village?: string;
  sortBy?: string;
}

export class FarmerService {
  static async getFarmers(params: GetFarmersParams) {
    await connectDB();

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // 1. Build initial query for User collection
    const userQuery: any = { role: 'farmer' };

    // 2. Handle search term (Name, Phone, Village, Survey Number)
    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      
      // We also look up in LandDetails and FarmerProfile for matching entries
      const [matchingLand, matchingProfiles] = await Promise.all([
        LandDetails.find({
          $or: [
            { 'rtcDetails.surveyNumber': { $regex: searchRegex } },
            { 'rtcDetails.village': { $regex: searchRegex } }
          ]
        }).select('user').lean(),
        
        FarmerProfile.find({
          $or: [
            { rtcAddress: { $regex: searchRegex } },
            { homeAddress: { $regex: searchRegex } }
          ]
        }).select('user').lean()
      ]);

      const matchedUserIds = [
        ...matchingLand.map((l: any) => l.user?.toString()),
        ...matchingProfiles.map((p: any) => p.user?.toString())
      ].filter(Boolean);

      userQuery.$or = [
        { fullName: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } }
      ];

      if (matchedUserIds.length > 0) {
        userQuery.$or.push({ _id: { $in: matchedUserIds.map(id => new mongoose.Types.ObjectId(id)) } });
      }
    }

    // 3. Handle Account Status filter
    if (params.status) {
      if (params.status === 'active') {
        userQuery.status = { $ne: 'suspended' };
      } else if (params.status === 'suspended') {
        userQuery.status = 'suspended';
      }
    }

    // 4. Handle sorting
    let sort: any = { createdAt: -1 };
    if (params.sortBy) {
      switch (params.sortBy) {
        case 'oldest':
          sort = { createdAt: 1 };
          break;
        case 'name_asc':
          sort = { fullName: 1 };
          break;
        case 'name_desc':
          sort = { fullName: -1 };
          break;
        case 'newest':
        default:
          sort = { createdAt: -1 };
          break;
      }
    }

    // 5. Query Users matching current criteria
    const total = await User.countDocuments(userQuery);
    const users = await User.find(userQuery)
      .select('-passwordHash -emailOtp -phoneOtp')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const farmerIds = users.map((u: any) => u._id);

    // 6. Bulk fetch related profiles, lands, and integration status
    const [profiles, lands, integrations] = await Promise.all([
      FarmerProfile.find({ user: { $in: farmerIds } }).lean(),
      LandDetails.find({ user: { $in: farmerIds } }).lean(),
      LandIntegration.find({
        $or: [
          { requestingUser: { $in: farmerIds } },
          { targetUser: { $in: farmerIds } }
        ]
      }).lean()
    ]);

    // Map fetched items into lookup dictionaries
    const profileMap = new Map(profiles.map((p: any) => [p.user?.toString() || p.userId, p]));
    const landsMap = new Map();
    lands.forEach((l: any) => {
      const userIdStr = l.user?.toString() || l.userId;
      if (!landsMap.has(userIdStr)) {
        landsMap.set(userIdStr, []);
      }
      landsMap.get(userIdStr).push(l);
    });

    // 7. Format details matching Table row requirement
    const formattedData = users.map((user: any) => {
      const userIdStr = user._id.toString();
      const profile = profileMap.get(userIdStr) as any;
      const userLands = landsMap.get(userIdStr) || [];

      // Calculate land metrics
      const totalLandArea = userLands.reduce((acc: number, item: any) => {
        return acc + (item.landData?.landSizeInAcres || 0);
      }, 0);

      // Check integration pool status
      const userIntegrations = integrations.filter((integration: any) => 
        integration.requestingUser?.toString() === userIdStr || 
        integration.targetUser?.toString() === userIdStr
      );
      const hasActivePool = userIntegrations.some((integration: any) => 
        ['accepted', 'completed'].includes(integration.status)
      );
      const hasPendingPool = userIntegrations.some((integration: any) => 
        integration.status === 'pending'
      );
      
      let poolStatus = 'None';
      if (hasActivePool) poolStatus = 'Active';
      else if (hasPendingPool) poolStatus = 'Pending';

      // Parse address details from profile or user
      const village = profile?.rtcAddress || profile?.homeAddress || '';

      // Determine verification fields
      const aadhaarStatus = profile?.nameVerificationStatus || 'pending';
      const rtcStatus = profile?.ownershipVerified ? 'verified' : 'pending';

      return {
        id: userIdStr,
        fullName: user.fullName || 'N/A',
        email: user.email,
        phone: user.phone || 'N/A',
        profilePicture: user.profilePicture || '',
        village: village || 'N/A',
        taluk: profile?.location_taluk || 'N/A',
        district: profile?.location_district || 'N/A',
        totalLandArea: totalLandArea || 0,
        surveyNumbersCount: userLands.length,
        registrationDate: user.createdAt,
        aadhaarVerificationStatus: aadhaarStatus,
        rtcVerificationStatus: rtcStatus,
        accountStatus: user.status === 'suspended' ? 'suspended' : 'active',
        farmPoolStatus: poolStatus,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus || 'pending'
      };
    });

    // 8. Apply frontend-compatible filters (Aadhaar, RTC, District, Taluk, Village)
    let filteredData = formattedData;
    if (params.aadhaarStatus) {
      filteredData = filteredData.filter((f: any) => f.aadhaarVerificationStatus === params.aadhaarStatus);
    }
    if (params.rtcStatus) {
      filteredData = filteredData.filter((f: any) => f.rtcVerificationStatus === params.rtcStatus);
    }
    if (params.district) {
      filteredData = filteredData.filter((f: any) => f.district.toLowerCase().includes(params.district!.toLowerCase()));
    }
    if (params.taluk) {
      filteredData = filteredData.filter((f: any) => f.taluk.toLowerCase().includes(params.taluk!.toLowerCase()));
    }
    if (params.village) {
      filteredData = filteredData.filter((f: any) => f.village.toLowerCase().includes(params.village!.toLowerCase()));
    }

    return {
      farmers: filteredData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async approveFarmer(farmerId: string, adminEmail: string) {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      farmerId,
      { 
        isVerified: true, 
        verificationStatus: 'verified',
        approvedBy: adminEmail,
        approvedAt: new Date(),
        // Clear any old suspension
        status: 'active'
      },
      { new: true }
    );

    if (!user) {
      throw new Error('Farmer not found');
    }

    // Trigger profile changes if needed
    await FarmerProfile.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(farmerId) },
      { nameVerificationStatus: 'verified', ownershipVerified: true }
    );

    await ActivityService.logActivity({
      userId: farmerId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'approve',
      resourceType: 'user',
      resourceId: farmerId,
      status: 'success'
    });

    return user;
  }

  static async rejectFarmer(farmerId: string, adminEmail: string, reason: string) {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      farmerId,
      {
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason: reason,
        rejectedBy: adminEmail,
        rejectedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      throw new Error('Farmer not found');
    }

    await FarmerProfile.findOneAndUpdate(
      { user: new mongoose.Types.ObjectId(farmerId) },
      { nameVerificationStatus: 'not_verified', ownershipVerified: false }
    );

    await ActivityService.logActivity({
      userId: farmerId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'reject',
      resourceType: 'user',
      resourceId: farmerId,
      resourceDetails: { reason },
      status: 'success'
    });

    return user;
  }

  static async suspendFarmer(farmerId: string, adminEmail: string, reason: string) {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      farmerId,
      {
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date(),
        suspendedBy: adminEmail
      },
      { new: true }
    );

    if (!user) {
      throw new Error('Farmer not found');
    }

    await ActivityService.logActivity({
      userId: farmerId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'suspend',
      resourceType: 'user',
      resourceId: farmerId,
      resourceDetails: { reason },
      status: 'success'
    });

    return user;
  }

  static async reactivateFarmer(farmerId: string, adminEmail: string) {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      farmerId,
      {
        status: 'active',
        // Clear suspension fields
        $unset: { suspensionReason: 1, suspendedAt: 1, suspendedBy: 1 }
      },
      { new: true }
    );

    if (!user) {
      throw new Error('Farmer not found');
    }

    await ActivityService.logActivity({
      userId: farmerId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'reactivate',
      resourceType: 'user',
      resourceId: farmerId,
      status: 'success'
    });

    return user;
  }

  static async resetPassword(farmerId: string, adminEmail: string, newPassword: string) {
    await connectDB();

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      farmerId,
      { passwordHash },
      { new: true }
    );

    if (!user) {
      throw new Error('Farmer not found');
    }

    await ActivityService.logActivity({
      userId: farmerId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'reset_password',
      resourceType: 'user',
      resourceId: farmerId,
      status: 'success'
    });

    return { success: true };
  }
}
