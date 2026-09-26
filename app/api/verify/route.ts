import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import { hashContractNode } from '@/lib/hashContract';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';

/**
 * GET /api/verify?poolId=...
 *
 * Public endpoint — no auth required.
 * Recomputes the SHA-256 contract hash from live DB data
 * and compares it against the immutably stored blockchain hash.
 *
 * Returns:
 *   verified: true   → document is intact
 *   verified: false  → at least one field has changed since sealing
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');

    if (!poolId) {
      return NextResponse.json({ success: false, error: 'Missing poolId parameter' }, { status: 400 });
    }

    await connectDB();
    const pool = await FarmPool.findById(poolId).lean();

    if (!pool) {
      return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 });
    }

    if (!pool.blockchain?.contractHash) {
      return NextResponse.json({
        success: true,
        verified: null,
        status: 'not_sealed',
        message: 'This agreement has not yet been sealed on the blockchain. Verification is only available after all participants sign.',
        pool: {
          id: pool._id,
          name: pool.name,
          status: pool.status,
          participantCount: pool.participants?.length ?? 0,
        }
      });
    }

    // Re-compute the hash with the stored sealedAt timestamp
    const sealedAt = pool.blockchain.sealedAt ?? pool.blockchain.timestamp?.toISOString() ?? '';
    const recomputedHash = hashContractNode(pool, sealedAt);

    const storedHash = pool.blockchain.contractHash;
    const verified = recomputedHash === storedHash;

    // Audit: contract verified
    void auditLog({
      action: ActivityAction.CONTRACT_VERIFIED,
      module: LogModule.AGREEMENT,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId,
      resourceName: pool.name as string,
      userRole: 'system',
      userName: 'Public Verifier',
      remarks: verified
        ? `Contract integrity verified — hashes match (${poolId})`
        : `Tamper detected — hashes do NOT match for pool ${poolId}`,
      metadata: { verified, storedHash, recomputedHash },
      request,
    });

    return NextResponse.json({
      success: true,
      verified,
      status: verified ? 'intact' : 'tampered',
      storedHash,
      recomputedHash,
      matchDetails: {
        poolId: pool._id?.toString(),
        poolName: pool.name,
        sealedAt,
        blockNumber: pool.blockchain.blockNumber,
        transactionHash: pool.blockchain.transactionHash,
        version: pool.blockchain.version,
        participantCount: pool.participants?.length ?? 0,
        allSigned: pool.participants?.every((p: any) => !!p.signatureHash) ?? false,
      }
    });

  } catch (error: any) {
    console.error('GET /api/verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
