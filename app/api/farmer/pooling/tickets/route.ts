import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ConflictTicket } from '@/lib/models/ConflictTicket';
import { FarmPool } from '@/lib/models/FarmPool';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';

// GET /api/farmer/pooling/tickets?userId=xxx or poolId=xxx
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const poolId = searchParams.get('poolId');
    const ticketId = searchParams.get('ticketId');
    const currentViewerId = searchParams.get('currentViewerId'); // to filter private ones for other pooled farmers

    const filter: any = {};
    if (ticketId) {
      filter._id = ticketId;
    } else if (userId) {
      filter.farmerId = userId;
    } else if (poolId) {
      filter.poolId = poolId;
      if (currentViewerId) {
        // If query is fetched by another farmer, show public ones OR their own private ones
        filter.$or = [
          { visibility: 'public' },
          { farmerId: currentViewerId }
        ];
      }
    }

    const tickets = await ConflictTicket.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error('GET /api/farmer/pooling/tickets error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/farmer/pooling/tickets
// Action: 'create' or 'resolve'
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, ticketId, poolId, farmerId, category, title, description, visibility, resolution, resolvedBy } = body;

    if (action === 'create') {
      if (!poolId || !farmerId || !title || !description) {
        return NextResponse.json({ success: false, error: 'Missing required ticket parameters.' }, { status: 400 });
      }

      // Fetch pool and user names
      const pool = await FarmPool.findById(poolId);
      const user = await User.findById(farmerId);

      if (!pool || !user) {
        return NextResponse.json({ success: false, error: 'Pool or Farmer User not found.' }, { status: 404 });
      }

      const ticket = await ConflictTicket.create({
        poolId,
        poolName: pool.name,
        farmerId,
        farmerName: user.fullName,
        category: category || 'others',
        title,
        description,
        visibility: visibility || 'public',
        status: 'pending'
      });

      // Audit Log
      try {
        const { auditLog } = await import('@/lib/auditLogger');
        const { ActivityAction, ResourceType, LogModule, ActivityStatus } = await import('@/lib/auditTypes');
        await auditLog({
          action: ActivityAction.UPDATE,
          module: LogModule.AGREEMENT,
          resourceType: ResourceType.FARM_POOL,
          resourceId: poolId,
          resourceName: pool.name,
          userId: farmerId,
          userName: user.fullName,
          userRole: 'farmer',
          newValue: 'pending',
          remarks: `dispute raised: [${category.toUpperCase()}] ${title}. Description: ${description}`,
          status: ActivityStatus.SUCCESS
        });
      } catch (logErr) {
        console.error('dispute raise audit failed:', logErr);
      }

      return NextResponse.json({ success: true, ticket });
    }

    else if (action === 'resolve') {
      if (!ticketId || !resolution) {
        return NextResponse.json({ success: false, error: 'Ticket ID and resolution details are required.' }, { status: 400 });
      }

      const ticket = await ConflictTicket.findById(ticketId);
      if (!ticket) {
        return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
      }

      ticket.status = 'resolved';
      ticket.resolution = resolution;
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = resolvedBy || 'Field Counseling Officer';
      await ticket.save();

      // Chain resolution to active pool timeline progress block
      const pool = await FarmPool.findById(ticket.poolId);
      if (pool && pool.blockchain && pool.blockchain.isImmutable) {
        try {
          const now = new Date();
          const progressList = pool.blockchain.blocksProgress || [];
          const parentHash = progressList.length > 0 
            ? progressList[progressList.length - 1].blockHash 
            : pool.blockchain.contractHash;
          const nextBlockNumber = progressList.length > 0 
            ? progressList[progressList.length - 1].blockNumber + 1 
            : 2;

          const crypto = await import('crypto');
          const blockData = JSON.stringify({
            blockNumber: nextBlockNumber,
            action: 'Dispute Resolved',
            parentHash,
            timestamp: now.toISOString(),
            remarks: `Ticket "${ticket.title}" resolved: ${resolution}`
          });
          const blockHash = '0x' + crypto.createHash('sha256').update(blockData + parentHash).digest('hex');

          if (!pool.blockchain.blocksProgress || pool.blockchain.blocksProgress.length === 0) {
            pool.blockchain.blocksProgress = [{
              blockNumber: 1,
              timestamp: pool.blockchain.timestamp || pool.createdAt || now,
              action: 'Contract Sealed',
              parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
              blockHash: pool.blockchain.contractHash,
              remarks: 'Agreement validated, signed by all farmers, and anchored on the blockchain ledger.',
              operator: 'System'
            }];
          }

          pool.blockchain.blocksProgress.push({
            blockNumber: nextBlockNumber,
            timestamp: now,
            action: 'Dispute Resolved',
            parentHash,
            blockHash,
            remarks: `Ticket resolved by ${resolvedBy || 'FCO'}: ${resolution}`,
            operator: 'Field Counseling Officer'
          });

          await pool.save();

          // Log Audit Trail for dispute resolution
          const { auditLog } = await import('@/lib/auditLogger');
          const { ActivityAction, ResourceType, LogModule, ActivityStatus } = await import('@/lib/auditTypes');
          await auditLog({
            action: ActivityAction.BLOCKCHAIN_SEALED,
            module: LogModule.AGREEMENT,
            resourceType: ResourceType.FARM_POOL,
            resourceId: pool._id.toString(),
            resourceName: pool.name,
            userId: 'system',
            userName: resolvedBy || 'Field Counseling Officer',
            userRole: 'fco',
            newValue: 'resolved',
            remarks: `Dispute resolved successfully on-chain. Sealed Block #${nextBlockNumber}. Hash: ${blockHash.slice(0, 10)}...`,
            status: ActivityStatus.SUCCESS
          });

        } catch (chainErr) {
          console.error('Failed to seal dispute resolution block:', chainErr);
        }
      }

      return NextResponse.json({ success: true, ticket });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter.' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/farmer/pooling/tickets error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
