import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { FarmPool } from '@/lib/models/FarmPool';
import { verifyAdminToken } from '@/lib/admin-auth';

// Helper to verify admin
async function isAdmin(request: Request) {
  try {
    const token = request.headers.get('cookie')?.split('; ')
      .find(row => row.startsWith('admin-token='))
      ?.split('=')[1];
    if (!token) return false;
    const payload = await verifyAdminToken(token);
    return !!payload;
  } catch (e) {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // Seed dummy pools if none exist
    const count = await FarmPool.countDocuments();
    if (count === 0) {
      // Find or create some dummy farmers and FCOs for demo
      let farmers = await User.find({ role: 'farmer' }).limit(3);
      let fcos = await User.find({ role: 'fco' }).limit(2);

      // If no FCO exists, create a dummy one
      if (fcos.length === 0) {
        const dummyFco = await User.create({
          name: 'Somanna Gowda',
          email: 'somanna.fco@agrilink.in',
          password: 'password123',
          role: 'fco',
          isVerified: true,
          employeeId: 'FCO-9872',
          username: 'somanna_fco',
          qualification: 'B.Sc. Agriculture',
          experience: 5
        });
        fcos = [dummyFco];
      }

      // If no Farmers exist, create dummy ones
      if (farmers.length === 0) {
        const f1 = await User.create({ name: 'Kempanna Gowda', email: 'kempanna@gmail.com', password: 'password123', role: 'farmer', isVerified: true });
        const f2 = await User.create({ name: 'Rame Gowda', email: 'rame@gmail.com', password: 'password123', role: 'farmer', isVerified: true });
        const f3 = await User.create({ name: 'Ningappa Patil', email: 'ningappa@gmail.com', password: 'password123', role: 'farmer', isVerified: true });
        farmers = [f1, f2, f3];
      }

      // Create a pending pool (Awaiting Counselor)
      await FarmPool.create({
        name: 'Chikkamagaluru Coffee & Potato Pool',
        status: 'awaiting_counselor',
        participants: [
          {
            userId: farmers[0]._id,
            fullName: farmers[0].name,
            phone: farmers[0].phone || '9876543210',
            landId: new mongoose.Types.ObjectId(),
            landSize: 4.5,
            surveyNumber: '112/A',
            investmentContribution: 0,
            labourContribution: 0,
            machineryContribution: '',
            landContribution: 4.5
          },
          {
            userId: farmers[1]._id,
            fullName: farmers[1].name,
            phone: farmers[1].phone || '9876543211',
            landId: new mongoose.Types.ObjectId(),
            landSize: 3.2,
            surveyNumber: '112/B',
            investmentContribution: 0,
            labourContribution: 0,
            machineryContribution: '',
            landContribution: 3.2
          }
        ]
      });

      // Create a pool in planning stage
      await FarmPool.create({
        name: 'Kadur Ragi & Maize Cluster',
        status: 'planning',
        counselorId: fcos[0]._id,
        counselorName: fcos[0].name,
        meetingDetails: {
          meetingType: 'offline',
          scheduledAt: new Date(Date.now() + 86400000 * 2),
          location: 'Kadur Hobli FPO Center',
          checklist: {
            benefits: true,
            risks: true,
            profitSharing: true,
            lossSharing: true,
            responsibilities: true,
            exitConditions: true,
            investmentModel: false,
            insurance: false,
            resourceSharing: false,
            answersProvided: true
          }
        },
        participants: [
          {
            userId: farmers[1]._id,
            fullName: farmers[1].name,
            phone: farmers[1].phone || '9876543211',
            landId: new mongoose.Types.ObjectId(),
            landSize: 3.2,
            surveyNumber: '112/B',
            investmentContribution: 50000,
            labourContribution: 50,
            machineryContribution: 'Tractor (Mahindra 275 DI)',
            landContribution: 3.2
          },
          {
            userId: farmers[2]._id,
            fullName: farmers[2].name,
            phone: farmers[2].phone || '9876543212',
            landId: new mongoose.Types.ObjectId(),
            landSize: 5.0,
            surveyNumber: '44/3',
            investmentContribution: 75000,
            labourContribution: 50,
            machineryContribution: 'Rotavator & Seed Drill',
            landContribution: 5.0
          }
        ]
      });
    }

    let pools = await FarmPool.find({}).sort({ createdAt: -1 });
    const now = new Date();
    let updatedAny = false;

    // Check timelines and auto-terminate expired pools
    for (const pool of pools) {
      if (pool.endDate && now > new Date(pool.endDate) && !pool.isTerminated) {
        pool.isTerminated = true;
        
        // Append termination parameters to blockchain details to seal on-chain receipt
        if (pool.blockchain && pool.blockchain.contractHash) {
          const terminationReceipt = {
            terminatedAt: now.toISOString(),
            reason: 'Contract Timeline Exceeded',
            oldState: pool.status,
            newState: 'TERMINATED',
            sealHash: pool.blockchain.contractHash
          };
          pool.blockchain.isImmutable = true;
          pool.blockchain.sealedAt = now.toISOString();
          pool.blockchain.version = '1.0.0-terminated';
          
          // Generate block progress hash
          const crypto = require('crypto');
          const parentHash = pool.blockchain.contractHash || '0x0000000000000000000000000000000000000000000000000000000000000000';
          const blockData = JSON.stringify({
            blockNumber: 2,
            action: 'Contract Timeline Expired',
            parentHash,
            timestamp: now.toISOString()
          });
          const blockHash = '0x' + crypto.createHash('sha256').update(blockData + parentHash).digest('hex');

          // Initialize list if missing, then push
          if (!pool.blockchain.blocksProgress) {
            pool.blockchain.blocksProgress = [{
              blockNumber: 1,
              timestamp: pool.blockchain.timestamp || pool.createdAt || now,
              action: 'Contract Sealed',
              parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
              blockHash: parentHash,
              remarks: 'Agreement validated, signed by all farmers, and anchored on the blockchain ledger.',
              operator: 'System'
            }];
          }

          pool.blockchain.blocksProgress.push({
            blockNumber: 2,
            timestamp: now,
            action: 'Contract Terminated',
            parentHash,
            blockHash,
            remarks: `Contract validity timeline expired on ${new Date(pool.endDate).toLocaleDateString('en-IN')}. Ledger status moved to completed.`,
            operator: 'Blockchain Oracle'
          });
          
          // Log to audit logger
          try {
            const { auditLog } = await import('@/lib/auditLogger');
            const { ActivityAction, ResourceType, LogModule, ActivityStatus } = await import('@/lib/auditTypes');
            
            await auditLog({
              action: ActivityAction.STATUS_CHANGE,
              module: LogModule.AGREEMENT,
              resourceType: ResourceType.AGREEMENT,
              resourceId: pool._id.toString(),
              resourceName: pool.name,
              oldValue: pool.status,
              newValue: 'TERMINATED',
              remarks: `Contract timeline expired on ${new Date(pool.endDate).toLocaleDateString('en-IN')}. Auto-terminated and sealed on blockchain.`,
              status: ActivityStatus.SUCCESS
            });
          } catch (e) {
            console.error('Failed to log timeline termination audit trail:', e);
          }
        }
        await pool.save();
        updatedAny = true;
      }
    }

    if (updatedAny) {
      // Re-fetch updated states
      pools = await FarmPool.find({}).sort({ createdAt: -1 });
    }

    const counselors = await User.find({ role: 'fco', status: { $ne: 'suspended' } }).select('name email employeeId username');

    return NextResponse.json({ success: true, pools, counselors });
  } catch (error: any) {
    console.error('GET /api/admin/farm-pools error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { poolId, counselorId } = body;

    if (!poolId || !counselorId) {
      return NextResponse.json({ success: false, error: 'Missing poolId or counselorId' }, { status: 400 });
    }

    const counselor = await User.findOne({ _id: counselorId, role: 'fco' });
    if (!counselor) {
      return NextResponse.json({ success: false, error: 'Counselor not found' }, { status: 404 });
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm pool not found' }, { status: 404 });
    }

    pool.counselorId = counselor._id;
    pool.counselorName = counselor.name;
    // If the status is awaiting_counselor, update to indicate counselor assigned/scheduled
    if (pool.status === 'awaiting_counselor') {
      pool.status = 'counseling_scheduled';
    }
    
    await pool.save();

    // Log this to AdminAuditLog
    try {
      const { AdminAuditLog } = await import('@/lib/models/AdminAuditLog');
      await AdminAuditLog.create({
        action: 'assign_counselor',
        entityType: 'farm_pool',
        entityId: pool._id,
        entityName: pool.name,
        details: { counselorId, counselorName: counselor.name },
        performedBy: 'Admin Portal',
        timestamp: new Date()
      });
    } catch (e) {
      console.warn('AdminAuditLog not logged:', e);
    }

    return NextResponse.json({ success: true, pool });
  } catch (error: any) {
    console.error('POST /api/admin/farm-pools error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
