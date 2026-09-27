import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FarmLifecyclePlan } from '@/lib/models/FarmLifecyclePlan';
import { FarmPool } from '@/lib/models/FarmPool';
import User from '@/models/User';
import { CROP_TEMPLATES } from '@/lib/data/cropTemplates';
import { CropLifecycleService } from '@/lib/services/crop-lifecycle.service';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, LogModule, ResourceType } from '@/lib/auditTypes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const poolId = url.searchParams.get('poolId');
    const getTemplates = url.searchParams.get('templates');

    // Return catalog of available crop agronomic templates
    if (getTemplates === 'true') {
      return NextResponse.json({
        success: true,
        templates: Object.values(CROP_TEMPLATES)
      });
    }

    let query: any = {};
    if (poolId) {
      query.poolId = poolId;
    } else if (userId) {
      query.userId = userId;
    } else {
      // Return recent active plans for admin/FCO overview
      const allPlans = await FarmLifecyclePlan.find().sort({ createdAt: -1 }).limit(20);
      return NextResponse.json({ success: true, plans: allPlans });
    }

    const plans = await FarmLifecyclePlan.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      plans,
      templates: Object.values(CROP_TEMPLATES)
    });
  } catch (error: any) {
    console.error('GET /api/farmer/crop-lifecycle error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, poolId, cropKey, sowingDate, acreage, variety, notes } = body;

    if (!userId || !cropKey || !sowingDate || !acreage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, cropKey, sowingDate, acreage' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    const farmerName = user?.name || 'Farmer Member';

    // Generate dynamic calendar & tasks
    const generated = CropLifecycleService.generatePlan(cropKey, sowingDate, Number(acreage));

    const newPlan = await FarmLifecyclePlan.create({
      userId,
      poolId: poolId || undefined,
      farmerName,
      cropKey: generated.cropKey,
      cropName: generated.cropName,
      variety: variety || 'High Yield Variety (HYV)',
      sowingDate: generated.sowingDate,
      acreage: Number(acreage),
      expectedHarvestDate: generated.expectedHarvestDate,
      tasks: generated.tasks,
      status: 'active',
      notes
    });

    // Audit log
    void auditLog({
      action: ActivityAction.CREATE,
      module: LogModule.AGREEMENT,
      resourceType: ResourceType.FARM_POOL,
      resourceId: poolId || newPlan._id.toString(),
      resourceName: `${generated.cropName} Lifecycle Plan`,
      userId,
      userName: farmerName,
      metadata: { cropKey, acreage, sowingDate }
    });

    return NextResponse.json({
      success: true,
      message: 'Crop lifecycle & interactive calendar created successfully!',
      plan: newPlan
    });
  } catch (error: any) {
    console.error('POST /api/farmer/crop-lifecycle error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { planId, taskId, completed, completedBy, pestIncident } = body;

    if (!planId) {
      return NextResponse.json({ success: false, error: 'Missing planId' }, { status: 400 });
    }

    const plan = await FarmLifecyclePlan.findById(planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    // 1. Task Toggle / Completion
    if (taskId) {
      const task = plan.tasks.find((t: any) => t.taskId === taskId || t._id?.toString() === taskId);
      if (task) {
        task.completed = completed !== undefined ? completed : !task.completed;
        task.completedAt = task.completed ? new Date() : undefined;
        task.completedBy = task.completed ? (completedBy || 'Farmer') : undefined;
      }
    }

    // 2. Report New Pest Incident
    if (pestIncident) {
      plan.pestIncidents.push({
        pestName: pestIncident.pestName || 'Scouted Pest / Symptom',
        severity: pestIncident.severity || 'medium',
        symptoms: pestIncident.symptoms || '',
        advisory: pestIncident.advisory || '',
        photoUrl: pestIncident.photoUrl || '',
        status: 'reported',
        reportedAt: new Date(),
        reportedBy: completedBy || 'Farmer Member'
      });

      // If attached to a pool, automatically dispatch a notification/ticket to the assigned Field Counseling Officer (FCO)
      if (plan.poolId) {
        try {
          const { ConflictTicket } = await import('@/lib/models/ConflictTicket');
          const { FarmPool } = await import('@/lib/models/FarmPool');
          const pool = await FarmPool.findById(plan.poolId);
          if (pool) {
            await ConflictTicket.create({
              poolId: plan.poolId,
              poolName: pool.name || 'Farm Pool',
              farmerId: plan.userId,
              farmerName: plan.farmerName || 'Farmer Member',
              category: 'others',
              title: ` Pest Outbreak Alert: ${pestIncident.pestName} (${pestIncident.severity?.toUpperCase()} Severity)`,
              description: `Crop: ${plan.cropName}. Symptoms: ${pestIncident.symptoms || 'Visual damage noticed in field'}. Recommended Agronomic Action: ${pestIncident.advisory || 'Inspection requested.'}`,
              status: 'pending',
              visibility: 'public'
            });
          }
        } catch (ticketErr) {
          console.warn('Could not auto-generate FCO conflict ticket:', ticketErr);
        }
      }
    }

    await plan.save();

    return NextResponse.json({
      success: true,
      message: 'Plan updated and pest notification dispatched to FCO successfully',
      plan
    });
  } catch (error: any) {
    console.error('PATCH /api/farmer/crop-lifecycle error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
