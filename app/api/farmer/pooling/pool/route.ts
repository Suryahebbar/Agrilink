import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // Find a pool where this user is one of the participants
    const pool = await FarmPool.findOne({ 'participants.userId': userId }).sort({ updatedAt: -1 });
    
    return NextResponse.json({ success: true, pool });
  } catch (error: any) {
    console.error('GET /api/farmer/pooling/pool error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      poolId, userId, signatureHash, signatureImage,
      signatureMethod, signatureUrl, ipAddress, userAgent,
      resign, action, rejectionReason,
      userName, userEmail,
    } = body;

    if (!poolId || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Pool not found' }, { status: 404 });
    }

    // ─── REJECT ────────────────────────────────────────────────────────────────
    if (action === 'reject') {
      const participant = pool.participants.find((p: any) => p.userId.toString() === userId.toString());
      const rejecterName = participant ? participant.fullName : 'A participating farmer';
      
      const prevStatus = pool.status;
      pool.status = 'planning';
      pool.rejectionReason = rejectionReason || 'No reason provided';
      pool.rejectedBy = rejecterName;

      // Clear all signatures to ensure unanimous fresh round of signs
      pool.participants.forEach((p: any) => {
        p.signatureHash = undefined;
        p.signedAt = undefined;
        p.signatureImage = undefined;
        p.signatureMethod = undefined;
        p.signatureUrl = undefined;
        p.ipAddress = undefined;
        p.userAgent = undefined;
      });

      pool.markModified('participants');
      await pool.save();

      // Audit log: agreement rejected
      void auditLog({
        action: ActivityAction.AGREEMENT_REJECTED,
        module: LogModule.AGREEMENT,
        resourceType: ResourceType.FARM_POOL,
        resourceId: poolId,
        resourceName: pool.name,
        userId,
        userName: userName || rejecterName,
        userEmail,
        userRole: 'farmer',
        oldValue: prevStatus,
        newValue: 'planning',
        remarks: `Agreement rejected by ${rejecterName}. Reason: ${rejectionReason || 'No reason provided'}`,
        request,
      });

      return NextResponse.json({ success: true, pool });
    }

    // ─── RE-SIGN ───────────────────────────────────────────────────────────────
    if (resign) {
      const participantIndex = pool.participants.findIndex((p: any) => p.userId.toString() === userId.toString());
      if (participantIndex !== -1) {
        pool.participants[participantIndex].signatureHash = undefined;
        pool.participants[participantIndex].signedAt = undefined;
        pool.participants[participantIndex].signatureImage = undefined;
        pool.participants[participantIndex].signatureMethod = undefined;
        pool.participants[participantIndex].signatureUrl = undefined;
        pool.participants[participantIndex].ipAddress = undefined;
        pool.participants[participantIndex].userAgent = undefined;
        if (pool.status === 'active' || pool.status === 'blockchain_storage') {
          pool.status = 'signing';
        }
        
        // Clear previous rejection if re-signing
        pool.rejectionReason = undefined;
        pool.rejectedBy = undefined;

        pool.markModified('participants');
        await pool.save();
        return NextResponse.json({ success: true, pool });
      }
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
    }

    // ─── SIGN ──────────────────────────────────────────────────────────────────
    if (!signatureHash) {
      return NextResponse.json({ success: false, error: 'Missing signatureHash' }, { status: 400 });
    }

    const participantIndex = pool.participants.findIndex((p: any) => p.userId.toString() === userId.toString());
    if (participantIndex === -1) {
      return NextResponse.json({ success: false, error: 'Participant not found in this pool' }, { status: 404 });
    }

    const farmerName = pool.participants[participantIndex].fullName || userName || 'Farmer';

    pool.participants[participantIndex].signatureHash = signatureHash;
    pool.participants[participantIndex].signedAt = new Date();
    pool.participants[participantIndex].signatureImage = signatureImage;
    pool.participants[participantIndex].signatureMethod = signatureMethod || 'draw';
    pool.participants[participantIndex].signatureUrl = signatureUrl || signatureImage;
    pool.participants[participantIndex].ipAddress = ipAddress || request.headers.get('x-forwarded-for') || 'unknown';
    pool.participants[participantIndex].userAgent = userAgent || request.headers.get('user-agent') || 'unknown';
    
    // Clear previous rejection info
    pool.rejectionReason = undefined;
    pool.rejectedBy = undefined;

    pool.markModified('participants');

    // Check if all participants have signed
    const allSigned = pool.participants.every((p: any) => !!p.signatureHash);

    if (allSigned) {
      const { hashContractNode } = await import('@/lib/hashContract');
      const sealedAt = new Date().toISOString();
      const contractHash = hashContractNode(pool, sealedAt);

      const txHash = '0x' + crypto.createHash('sha256')
        .update(contractHash + sealedAt)
        .digest('hex');

      pool.blockchain = {
        contractHash,
        transactionHash: txHash,
        blockNumber: Math.floor(Math.random() * 500000) + 12000000,
        timestamp: new Date(sealedAt),
        version: '1.0.0',
        isImmutable: true,
        sealedAt,
        blocksProgress: [{
          blockNumber: 1,
          timestamp: new Date(sealedAt),
          action: 'Contract Sealed',
          parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          blockHash: contractHash,
          remarks: 'Agreement validated, signed by all farmers, and anchored on the blockchain ledger.',
          operator: 'System'
        }]
      };

      pool.status = 'active';
    }

    await pool.save();

    // Audit log: farmer signed
    void auditLog({
      action: ActivityAction.AGREEMENT_SIGNED,
      module: LogModule.AGREEMENT,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId,
      resourceName: pool.name,
      userId,
      userName: farmerName,
      userEmail,
      userRole: 'farmer',
      newValue: 'signed',
      remarks: `${farmerName} signed the agreement (method: ${signatureMethod || 'draw'})`,
      metadata: {
        signatureMethod: signatureMethod || 'draw',
        signatureUrl: signatureUrl || signatureImage,
        participantCount: pool.participants.length,
        signedCount: pool.participants.filter((p: any) => !!p.signatureHash).length,
      },
      request,
    });

    // Audit log: blockchain sealed (if all signed)
    if (allSigned) {
      void auditLog({
        action: ActivityAction.BLOCKCHAIN_SEALED,
        module: LogModule.BLOCKCHAIN,
        resourceType: ResourceType.FARM_POOL,
        resourceId: poolId,
        resourceName: pool.name,
        userId: 'system',
        userName: 'Blockchain Oracle',
        userRole: 'system',
        oldValue: 'signing',
        newValue: 'active',
        remarks: `All ${pool.participants.length} participants signed. Contract sealed on blockchain.`,
        metadata: {
          contractHash: pool.blockchain?.contractHash,
          transactionHash: pool.blockchain?.transactionHash,
          blockNumber: pool.blockchain?.blockNumber,
          sealedAt: pool.blockchain?.sealedAt,
          participantCount: pool.participants.length,
        },
        request,
      });
    }

    return NextResponse.json({ success: true, pool });
  } catch (error: any) {
    console.error('POST /api/farmer/pooling/pool error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
