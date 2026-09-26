import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmPool } from '@/lib/models/FarmPool';
import Scheme from '@/lib/models/Scheme';
import { User } from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// POST - Propose a scheme for the shared land pool
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { poolId, schemeId, userId } = body;

    if (!poolId || !schemeId || !userId) {
      return NextResponse.json({ success: false, error: 'poolId, schemeId and userId are required' }, { status: 400 });
    }

    const [pool, scheme, user] = await Promise.all([
      FarmPool.findById(poolId),
      Scheme.findById(schemeId).lean(),
      User.findById(userId).lean()
    ]);

    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm Pool not found' }, { status: 404 });
    }
    if (!scheme) {
      return NextResponse.json({ success: false, error: 'Scheme not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: 'Proposer not found' }, { status: 404 });
    }

    // Verify user is in pool participants list
    const isParticipant = pool.participants.some((p: any) => String(p.userId) === userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this farm pool' }, { status: 403 });
    }

    // Initialize proposedSchemes array if it doesn't exist
    if (!pool.proposedSchemes) {
      pool.proposedSchemes = [];
    }

    // Proposer auto-votes Yes
    const newProposal = {
      schemeId: scheme._id,
      schemeName: scheme.name,
      proposedBy: user._id,
      proposerName: user.fullName,
      status: (pool.participants.length <= 1 ? 'approved' : 'voting') as any,
      votes: [{
        userId: user._id,
        vote: 'yes' as const,
        votedAt: new Date()
      }],
      createdAt: new Date()
    };

    pool.proposedSchemes.push(newProposal);
    await pool.save();

    return NextResponse.json({ success: true, message: 'Scheme proposed successfully!', data: pool });
  } catch (err: any) {
    console.error('Error proposing scheme:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import SchemeRecommendation from '@/lib/models/SchemeRecommendation';

// PUT - Vote Yes/No on a scheme proposal in a pool OR FCO Apply Consensus Scheme
export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { poolId, proposalId, userId, vote, action, fcoId } = body;

    if (!poolId || !proposalId) {
      return NextResponse.json({ success: false, error: 'poolId and proposalId are required' }, { status: 400 });
    }

    // FCO Apply Action
    if (action === 'apply') {
      if (!fcoId) {
        return NextResponse.json({ success: false, error: 'fcoId is required for application' }, { status: 400 });
      }

      const pool = await FarmPool.findById(poolId);
      if (!pool) {
        return NextResponse.json({ success: false, error: 'Farm Pool not found' }, { status: 404 });
      }

      const proposal = pool.proposedSchemes?.id(proposalId) || pool.proposedSchemes?.find((p: any) => String(p._id) === proposalId);
      if (!proposal) {
        return NextResponse.json({ success: false, error: 'Scheme proposal not found' }, { status: 404 });
      }

      if (proposal.status !== 'approved') {
        return NextResponse.json({ success: false, error: 'Scheme proposal must be approved by group consensus before applying' }, { status: 400 });
      }

      // Update proposal status in pool
      proposal.status = 'applied';
      await pool.save();

      // Register FCO application campaign so that it shows up in every farmer's "Applied Schemes" tab
      await SchemeRecommendation.create({
        schemeId: proposal.schemeId,
        fcoId: fcoId,
        targetFilters: { poolId: pool._id, poolName: pool.name },
        farmerResponses: pool.participants.map((p: any) => ({
          userId: p.userId,
          fullName: p.fullName,
          status: 'interested',
          updatedAt: new Date()
        })),
        bulkApplied: true,
        bulkAppliedAt: new Date()
      });

      return NextResponse.json({ success: true, message: 'Scheme applied successfully on behalf of group!', data: pool });
    }

    // Regular Farmer Vote Action
    if (!userId || !vote) {
      return NextResponse.json({ success: false, error: 'userId and vote are required' }, { status: 400 });
    }

    if (!['yes', 'no'].includes(vote)) {
      return NextResponse.json({ success: false, error: 'Vote must be yes or no' }, { status: 400 });
    }

    const pool = await FarmPool.findById(poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: 'Farm Pool not found' }, { status: 404 });
    }

    const proposal = pool.proposedSchemes?.id(proposalId) || pool.proposedSchemes?.find((p: any) => String(p._id) === proposalId);
    if (!proposal) {
      return NextResponse.json({ success: false, error: 'Scheme proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'voting') {
      return NextResponse.json({ success: false, error: 'Voting is already closed for this proposal' }, { status: 400 });
    }

    // Verify user is in pool participants list
    const isParticipant = pool.participants.some((p: any) => String(p.userId) === userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this farm pool' }, { status: 403 });
    }

    // Add or update vote
    const voteIndex = proposal.votes.findIndex((v: any) => String(v.userId) === userId);
    if (voteIndex > -1) {
      proposal.votes[voteIndex].vote = vote;
      proposal.votes[voteIndex].votedAt = new Date();
    } else {
      proposal.votes.push({
        userId,
        vote,
        votedAt: new Date()
      });
    }

    // Determine status
    const yesCount = proposal.votes.filter((v: any) => v.vote === 'yes').length;
    const noCount = proposal.votes.filter((v: any) => v.vote === 'no').length;

    if (noCount > 0) {
      proposal.status = 'rejected';
    } else if (yesCount === pool.participants.length) {
      proposal.status = 'approved';
    }

    await pool.save();

    return NextResponse.json({ success: true, message: 'Vote recorded successfully!', data: pool });
  } catch (err: any) {
    console.error('Error handling scheme proposal modification:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
