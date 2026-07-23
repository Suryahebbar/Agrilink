import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { ActivityService } from '@/lib/services/activity.service';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export interface GetFcoParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | '';
  sortBy?: string;
}

export interface FcoInput {
  fullName: string;
  employeeId: string;
  email: string;
  phone: string;
  address: string;
  qualification: string;
  experience: number;
  username: string;
  password?: string;
  profilePicture?: string;
  status?: 'active' | 'inactive';
}

export class FcoService {
  static async getFcoList(params: GetFcoParams) {
    await connectDB();

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const query: any = { role: 'fco' };

    // Search by Name, Employee ID, Email, Phone
    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [
        { fullName: { $regex: searchRegex } },
        { employeeId: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } }
      ];
    }

    // Filter by Status
    if (params.status) {
      query.status = params.status;
    }

    // Sort options
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

    const total = await User.countDocuments(query);
    const fcos = await User.find(query)
      .select('-passwordHash -emailOtp -phoneOtp')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      fcos: fcos.map((f: any) => ({
        id: f._id.toString(),
        employeeId: f.employeeId || 'N/A',
        fullName: f.fullName || 'N/A',
        email: f.email,
        phone: f.phone || 'N/A',
        qualification: f.qualification || 'N/A',
        experience: f.experience || 0,
        status: f.status || 'active',
        createdAt: f.createdAt,
        address: f.address || '',
        username: f.username || '',
        profilePicture: f.profilePicture || ''
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async createFco(data: FcoInput, adminEmail: string) {
    await connectDB();

    // Check unique constraints
    const [emailExists, usernameExists, employeeIdExists] = await Promise.all([
      User.findOne({ email: data.email.toLowerCase() }),
      User.findOne({ username: data.username.toLowerCase() }),
      User.findOne({ employeeId: data.employeeId })
    ]);

    if (emailExists) throw new Error('Email is already registered');
    if (usernameExists) throw new Error('Username is already taken');
    if (employeeIdExists) throw new Error('Employee ID already exists');

    // Hash password
    if (!data.password) throw new Error('Password is required for creation');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const fcoUser = await User.create({
      role: 'fco',
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      address: data.address,
      qualification: data.qualification,
      experience: data.experience,
      username: data.username.toLowerCase(),
      passwordHash,
      profilePicture: data.profilePicture || '',
      status: data.status || 'active',
      createdBy: adminEmail
    });

    await ActivityService.logActivity({
      userId: fcoUser._id.toString(),
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'create',
      resourceType: 'fco',
      resourceId: fcoUser._id.toString(),
      status: 'success'
    });

    return fcoUser;
  }

  static async editFco(fcoId: string, data: Partial<FcoInput>, adminEmail: string) {
    await connectDB();

    const updateFields: any = {
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      qualification: data.qualification,
      experience: data.experience,
      status: data.status,
      profilePicture: data.profilePicture
    };

    // Filter out undefined values
    Object.keys(updateFields).forEach(
      key => updateFields[key] === undefined && delete updateFields[key]
    );

    const fcoUser = await User.findOneAndUpdate(
      { _id: fcoId, role: 'fco' },
      updateFields,
      { new: true }
    );

    if (!fcoUser) {
      throw new Error('FCO not found');
    }

    await ActivityService.logActivity({
      userId: fcoId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'update',
      resourceType: 'fco',
      resourceId: fcoId,
      status: 'success'
    });

    return fcoUser;
  }

  static async resetPassword(fcoId: string, adminEmail: string, newPassword: string) {
    await connectDB();

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const fcoUser = await User.findOneAndUpdate(
      { _id: fcoId, role: 'fco' },
      { passwordHash },
      { new: true }
    );

    if (!fcoUser) {
      throw new Error('FCO not found');
    }

    await ActivityService.logActivity({
      userId: fcoId,
      userEmail: adminEmail,
      userName: 'Admin',
      action: 'reset_password',
      resourceType: 'fco',
      resourceId: fcoId,
      status: 'success'
    });

    return { success: true };
  }

  static async toggleStatus(fcoId: string, status: 'active' | 'inactive', adminEmail: string) {
    await connectDB();

    const fcoUser = await User.findOneAndUpdate(
      { _id: fcoId, role: 'fco' },
      { status },
      { new: true }
    );

    if (!fcoUser) {
      throw new Error('FCO not found');
    }

    const action = status === 'active' ? 'activate' : 'deactivate';

    await ActivityService.logActivity({
      userId: fcoId,
      userEmail: adminEmail,
      userName: 'Admin',
      action,
      resourceType: 'fco',
      resourceId: fcoId,
      status: 'success'
    });

    return fcoUser;
  }

  static async getFcoDetails(fcoId: string) {
    await connectDB();

    const f = await User.findOne({ _id: fcoId, role: 'fco' })
      .select('-passwordHash -emailOtp -phoneOtp')
      .lean();

    if (!f) {
      throw new Error('FCO not found');
    }

    // Workload summary (placeholders as requested)
    const workloadSummary = {
      assignedGroupsCount: 4,
      pendingMeetingsCount: 2,
      completedCounsellingCount: 12,
      completedAgreementsCount: 8
    };

    return {
      id: f._id.toString(),
      employeeId: f.employeeId || 'N/A',
      fullName: f.fullName || 'N/A',
      email: f.email,
      phone: f.phone || 'N/A',
      address: f.address || 'N/A',
      qualification: f.qualification || 'N/A',
      experience: f.experience || 0,
      status: f.status || 'active',
      createdAt: f.createdAt,
      profilePicture: f.profilePicture || '',
      username: f.username || '',
      workloadSummary
    };
  }
}
