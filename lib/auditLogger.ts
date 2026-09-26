/**
 * auditLogger.ts
 *
 * Fire-and-forget audit logging utility for AgriLink.
 * Call `void auditLog({...})` from any API route — it never throws,
 * never blocks the response, and auto-parses browser/OS/device from the
 * userAgent string.
 *
 * Works on the server only (API routes, middleware).
 * For client-side farmer events, POST to /api/farmer/activity-log instead.
 */

import { ActivityAction, ActivityStatus, LogModule, ResourceType } from '@/lib/auditTypes';

export interface AuditEntry {
  /** Who performed the action */
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;        // 'farmer' | 'admin' | 'system' | 'fco' | 'supplier'

  /** What happened */
  action: ActivityAction | string;
  module?: LogModule | string;
  resourceType: ResourceType | string;
  resourceId: string;
  resourceName?: string;
  referenceId?: string;

  /** State change */
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  metadata?: Record<string, any>;

  /** Context */
  request?: Request | { headers: { get(name: string): string | null } };
  ipAddress?: string;
  userAgent?: string;

  /** Override */
  status?: ActivityStatus;
  errorMessage?: string;
}

/** Parse browser name from user-agent string */
function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua))     return 'Edge';
  if (/OPR\//i.test(ua))     return 'Opera';
  if (/Chrome\//i.test(ua))  return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua))  return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'IE';
  return 'Other';
}

/** Parse OS from user-agent string */
function parseOS(ua: string): string {
  if (/Android/i.test(ua))       return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua))       return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua))         return 'Linux';
  return 'Unknown';
}

/** Parse device type from user-agent string */
function parseDevice(ua: string): string {
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

/** Extract IP from a Request object */
function extractIP(req?: AuditEntry['request']): string {
  if (!req) return 'server';
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * Write one audit log entry to MongoDB.
 * Always fire with `void auditLog(...)` so it doesn't block your response.
 *
 * @example
 * void auditLog({ action: ActivityAction.AGREEMENT_SIGNED, module: LogModule.AGREEMENT,
 *   resourceType: ResourceType.FARM_POOL, resourceId: pool._id, userId: farmerId,
 *   userName: farmerName, userRole: 'farmer', request: req });
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const { connectDB } = await import('@/lib/db');
    await connectDB();
    const { AdminAuditLog, ActivityStatus: AS } = await import('@/lib/models/AdminAuditLog');

    const ua = entry.userAgent ?? entry.request?.headers.get('user-agent') ?? 'server';
    const ip = entry.ipAddress ?? extractIP(entry.request);

    await AdminAuditLog.create({
      userId:       entry.userId,
      userEmail:    entry.userEmail,
      userName:     entry.userName,
      userRole:     entry.userRole,
      action:       entry.action,
      module:       entry.module,
      resourceType: entry.resourceType,
      resourceId:   entry.resourceId,
      resourceName: entry.resourceName,
      referenceId:  entry.referenceId,
      oldValue:     entry.oldValue,
      newValue:     entry.newValue,
      remarks:      entry.remarks,
      metadata:     entry.metadata,
      ipAddress:    ip,
      userAgent:    ua,
      browser:      parseBrowser(ua),
      os:           parseOS(ua),
      deviceType:   parseDevice(ua),
      status:       entry.status ?? AS.SUCCESS,
      errorMessage: entry.errorMessage,
      timestamp:    new Date(),
    });
  } catch (err) {
    // Never propagate — logging must never break the main request
    console.warn('[auditLog] Failed to write log entry:', err);
  }
}
