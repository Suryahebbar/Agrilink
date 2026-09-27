import { NextResponse } from 'next/server';
import { auditLog } from '@/lib/auditLogger';
import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

/**
 * POST /api/farmer/activity-log
 *
 * Lightweight endpoint for client-side farmer UI events.
 * Does NOT require admin auth  -  uses the farmer's session context
 * passed in the request body. Never blocks the UI.
 *
 * Body:
 *   { action, module, resourceId, resourceName, userId, userName,
 *     userEmail, referenceId, remarks, metadata }
 */

// Whitelist of actions that may be submitted from the client
const ALLOWED_CLIENT_ACTIONS: string[] = [
  ActivityAction.AGREEMENT_OPENED,
  ActivityAction.AGREEMENT_SCROLLED,
  ActivityAction.AGREEMENT_DOWNLOADED,
  ActivityAction.SIGNATURE_METHOD_SELECTED,
  ActivityAction.SIGNATURE_CAPTURED,
  ActivityAction.PDF_GENERATED,
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action, module: logModule, resourceId, resourceName,
      userId, userName, userEmail, referenceId, remarks, metadata,
    } = body;

    if (!action || !resourceId) {
      return NextResponse.json({ success: false, error: 'action and resourceId are required' }, { status: 400 });
    }

    // Only allow whitelisted actions from the client (prevents log injection)
    if (!ALLOWED_CLIENT_ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, error: 'Action not permitted via client endpoint' }, { status: 403 });
    }

    void auditLog({
      action,
      module: logModule ?? LogModule.FARMER,
      resourceType: ResourceType.FARM_POOL,
      resourceId: resourceId.toString(),
      resourceName,
      userId,
      userName,
      userEmail,
      userRole: 'farmer',
      referenceId,
      remarks,
      metadata,
      status: ActivityStatus.SUCCESS,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.warn('[activity-log] Error:', error.message);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
