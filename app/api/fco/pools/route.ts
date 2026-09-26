import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import User from '@/models/User';
import { LandDetails } from '@/lib/models/LandDetails';
import { FarmerProfile } from '@/lib/models/FarmerProfile';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const counselorId = url.searchParams.get('userId');

    // If no counselor ID provided, return all pools that have FCOs assigned for demo purposes, or fallback to first FCO
    let query = {};
    if (counselorId) {
      query = { counselorId };
    } else {
      const firstFco = await User.findOne({ role: 'fco' });
      if (firstFco) {
        query = { counselorId: firstFco._id };
      }
    }

    let pools = await FarmPool.find(query).sort({ updatedAt: -1 });
    
    // Fallback to all pools if none found, so testing FCO dashboard is simple
    if (pools.length === 0) {
      pools = await FarmPool.find({}).sort({ updatedAt: -1 });
    }

    // Enhance pools with registered crops for each participant
    const enhancedPools = await Promise.all(pools.map(async (pool: any) => {
      const poolObj = pool.toObject();
      if (poolObj.participants && Array.isArray(poolObj.participants)) {
        poolObj.participants = await Promise.all(poolObj.participants.map(async (p: any) => {
          let registeredCrops: string[] = [];
          try {
            // Find land details
            const land = await LandDetails.findOne({
              $or: [
                { _id: p.landId },
                { user: p.userId },
                { userId: p.userId?.toString() }
              ]
            });
            if (land?.rtcDetails) {
              if (land.rtcDetails.cropType) {
                registeredCrops.push(land.rtcDetails.cropType);
              }
              if (Array.isArray(land.rtcDetails.allCrops)) {
                land.rtcDetails.allCrops.forEach((c: any) => {
                  if (typeof c === 'string' && c) {
                    registeredCrops.push(c);
                  } else if (c && typeof c === 'object' && c.name) {
                    registeredCrops.push(c.name);
                  }
                });
              }
            }
            
            // Also try FarmerProfile croppingHistory
            const profile = await FarmerProfile.findOne({
              $or: [
                { user: p.userId },
                { userId: p.userId?.toString() }
              ]
            });
            if (profile?.croppingHistory && profile.croppingHistory !== 'None') {
              const historyCrops = profile.croppingHistory.split(',').map((s: string) => {
                return s.trim().split(' ')[0];
              });
              registeredCrops.push(...historyCrops);
            }
          } catch (e) {
            console.error('Error fetching crops for participant', p.userId, e);
          }
          
          // Remove duplicates, empty values, fallback if empty
          const uniqueCrops = Array.from(new Set(registeredCrops.map(c => c.trim()).filter(Boolean)));
          return {
            ...p,
            registeredCrops: uniqueCrops.length > 0 ? uniqueCrops : ['Coffee', 'Pepper']
          };
        }));
      }
      return poolObj;
    }));
    
    return NextResponse.json({ success: true, pools: enhancedPools });
  } catch (error: any) {
    console.error('GET /api/fco/pools error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { poolId, action } = body;

    if (!poolId || !action) {
      return NextResponse.json({ success: false, error: 'Missing poolId or action' }, { status: 400 });
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm pool not found' }, { status: 404 });
    }

    if (action === 'schedule_meeting') {
      const { meetingType, scheduledAt, location, meetingLink } = body;
      pool.meetingDetails = {
        meetingType,
        scheduledAt: new Date(scheduledAt),
        location: meetingType === 'offline' ? location : undefined,
        meetingLink: meetingType === 'online' ? meetingLink : undefined,
        checklist: pool.meetingDetails?.checklist || {
          benefits: false,
          risks: false,
          profitSharing: false,
          lossSharing: false,
          responsibilities: false,
          exitConditions: false,
          investmentModel: false,
          insurance: false,
          resourceSharing: false,
          answersProvided: false
        }
      };
      pool.status = 'counseling_scheduled';
    } 
    
    else if (action === 'complete_counseling') {
      const { checklist } = body;
      if (pool.meetingDetails) {
        pool.meetingDetails.checklist = checklist;
      }
      pool.status = 'planning';
    } 
    
    else if (action === 'select_model') {
      const { collaborationModel } = body;
      pool.collaborationModel = collaborationModel;
    } 
    
    else if (action === 'save_planning') {
      const { farmPlan, participants, startDate, endDate } = body;
      pool.farmPlan = farmPlan;
      if (startDate) pool.startDate = new Date(startDate);
      if (endDate) pool.endDate = new Date(endDate);
      
      if (participants && Array.isArray(participants)) {
        for (const pContrib of participants) {
          const participant = pool.participants.find(
            (p: any) => p.userId.toString() === pContrib.userId.toString()
          );
          if (participant) {
            participant.investmentContribution = pContrib.investmentContribution;
            participant.labourContribution = pContrib.labourContribution;
            participant.machineryContribution = pContrib.machineryContribution;
            participant.landContribution = pContrib.landContribution;
            participant.collaborationModel = pContrib.collaborationModel || 1;
            participant.labourChargePerDay = pContrib.labourChargePerDay || 0;
          }
        }
      }
    } 
    
    else if (action === 'generate_contract') {
      // Step 7: Smart Contract Generation
      // Clear signatures for testing/regeneration purposes
      if (pool.participants && Array.isArray(pool.participants)) {
        for (const p of pool.participants) {
          p.signatureHash = undefined;
          p.signedAt = undefined;
        }
      }

      // Calculate contract hash based on pool variables
      const dataToHash = JSON.stringify({
        poolId: pool._id,
        name: pool.name,
        participants: pool.participants.map((p: any) => ({ userId: p.userId, landContribution: p.landContribution })),
        collaborationModel: pool.collaborationModel,
        farmPlan: pool.farmPlan,
        startDate: pool.startDate,
        endDate: pool.endDate
      });
      
      const contractHash = '0x' + crypto.createHash('sha256').update(dataToHash).digest('hex');
      
      pool.blockchain = {
        contractHash,
        version: '1.0.0',
        isImmutable: false
      };
      pool.status = 'signing';
    }
    
    else if (action === 'add_progress_block') {
      const { blockAction, remarks, operator } = body;
      if (!blockAction) {
        return NextResponse.json({ success: false, error: 'Missing blockAction' }, { status: 400 });
      }

      if (!pool.blockchain || !pool.blockchain.contractHash) {
        return NextResponse.json({ success: false, error: 'Cannot append blocks: Contract is not sealed on the blockchain yet.' }, { status: 400 });
      }

      const now = new Date();
      // Find latest block to determine block number and parent hash
      const progressList = pool.blockchain.blocksProgress || [];
      const parentHash = progressList.length > 0 
        ? progressList[progressList.length - 1].blockHash 
        : pool.blockchain.contractHash;
      const nextBlockNumber = progressList.length > 0 
        ? progressList[progressList.length - 1].blockNumber + 1 
        : 2;

      // Hash data
      const blockData = JSON.stringify({
        blockNumber: nextBlockNumber,
        action: blockAction,
        parentHash,
        timestamp: now.toISOString(),
        remarks
      });
      const blockHash = '0x' + crypto.createHash('sha256').update(blockData + parentHash).digest('hex');

      // Initialize blocks list if missing
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
        action: blockAction,
        parentHash,
        blockHash,
        remarks: remarks || 'Operational cycle milestone recorded.',
        operator: operator || 'Field Counseling Officer'
      });

      // Track log activity
      try {
        const { auditLog } = await import('@/lib/auditLogger');
        const { ActivityAction, ResourceType, LogModule, ActivityStatus } = await import('@/lib/auditTypes');
        await auditLog({
          action: ActivityAction.BLOCKCHAIN_SEALED,
          module: LogModule.BLOCKCHAIN,
          resourceType: ResourceType.FARM_POOL,
          resourceId: pool._id.toString(),
          resourceName: pool.name,
          userId: 'system',
          userName: operator || 'Field Counseling Officer',
          userRole: 'fco',
          newValue: 'active',
          remarks: `New block #${nextBlockNumber} [${blockAction}] sealed on blockchain ledger. Parent hash: ${parentHash.slice(0, 10)}...`,
          status: ActivityStatus.SUCCESS
        });
      } catch (e) {
        console.error('Failed to log progressive block audit trail:', e);
      }
    }
    
    else if (action === 'add_task') {
      const { taskName, taskDate } = body;
      if (!pool.tasksList) pool.tasksList = [];
      pool.tasksList.push({
        id: Date.now().toString(),
        name: taskName,
        status: 'pending',
        date: taskDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      });
    }

    else if (action === 'toggle_task') {
      const { taskId } = body;
      if (pool.tasksList) {
        const tIdx = pool.tasksList.findIndex((t: any) => t.id === taskId);
        if (tIdx !== -1) {
          pool.tasksList[tIdx].status = pool.tasksList[tIdx].status === 'completed' ? 'pending' : 'completed';
        }
      }
    }

    else if (action === 'delete_task') {
      const { taskId } = body;
      if (pool.tasksList) {
        pool.tasksList = pool.tasksList.filter((t: any) => t.id !== taskId);
      }
    }

    else if (action === 'add_expense') {
      const { category, amount, farmerId, farmerName, reason } = body;
      if (!pool.expensesList) pool.expensesList = [];
      pool.expensesList.push({
        id: Date.now().toString(),
        category,
        amount: Number(amount) || 0,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        farmerId,
        farmerName,
        reason
      });
    }

    else if (action === 'delete_expense') {
      const { expenseId } = body;
      if (pool.expensesList) {
        pool.expensesList = pool.expensesList.filter((e: any) => e.id !== expenseId);
      }
    }

    else if (action === 'upload_file') {
      const { fileName, fileUrl } = body;
      const { uploadedFiles = [] } = pool as any;
      uploadedFiles.push({
        id: Date.now().toString(),
        name: fileName,
        url: fileUrl,
        uploadedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      });
      (pool as any).uploadedFiles = uploadedFiles;
    }

    else if (action === 'delete_file') {
      const { fileId } = body;
      const { uploadedFiles = [] } = pool as any;
      (pool as any).uploadedFiles = uploadedFiles.filter((f: any) => f.id !== fileId);
    }

    // Initialize default tasks list when generating contract
    if (action === 'generate_contract') {
      pool.tasksList = [
        { id: '1', name: 'Sowing seeds and crop alignment verification', status: 'pending', date: 'Aug 05, 2026' },
        { id: '2', name: 'First NPK Fertilizer and bio-nutrient application', status: 'pending', date: 'Aug 20, 2026' },
        { id: '3', name: 'Manual weeding cycle 1 & pest checking', status: 'pending', date: 'Sep 10, 2026' },
        { id: '4', name: 'Harvesting phase and output inventory audit', status: 'pending', date: 'Nov 15, 2026' }
      ];
    }

    await pool.save();
    return NextResponse.json({ success: true, pool });
  } catch (error: any) {
    console.error('POST /api/fco/pools error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
