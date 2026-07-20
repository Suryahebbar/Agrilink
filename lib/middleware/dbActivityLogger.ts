import { Model, Document, Schema, Query } from 'mongoose';
import { AdminAuditLog, ActivityAction, ResourceType, ActivityStatus, IAdminAuditLog } from '@/lib/models/AdminAuditLog';
import { getClientInfo } from '@/lib/utils/client-info';

export interface TrackedModel<T = any> {
  trackChanges?: boolean;
  resourceType?: ResourceType | string;
  getResourceName?: (doc: T) => string;
}

interface ModifiedDocument extends Document {
  isNew: boolean;
  isModified(path?: string | string[]): boolean;
  modifiedPaths(): string[];
  get(path: string, type?: any, options?: any): any;
  _id: any;
  [key: string]: any;
}

interface QueryResult {
  nModified?: number;
  modifiedCount?: number;
  result?: {
    nModified?: number;
  };
}

export function trackModelChanges(
  model: any,
  options: {
    resourceType: ResourceType | string;
    getResourceName?: (doc: any) => string;
  }
): void {
  model.trackChanges = true;
  model.resourceType = options.resourceType;
  model.getResourceName = options.getResourceName;

  // Track document saves (create/update)
  model.schema.post('save', async function(doc: any) {
    if (!model.trackChanges) return;
    
    const typedDoc = doc as unknown as ModifiedDocument;
    const operation = typedDoc.isNew ? ActivityAction.CREATE : ActivityAction.UPDATE;
    
    const changes = typedDoc.isModified() 
      ? typedDoc.modifiedPaths().reduce<Record<string, { old: any; new: any }>>((acc, path) => {
          acc[path] = {
            old: typedDoc.get(path, null, { getters: false }),
            new: typedDoc.get(path)
          };
          return acc;
        }, {}) 
      : {};
    
    try {
      const clientInfo = await getClientInfo();
      const resourceName = model.getResourceName?.(doc) || 
                         (typedDoc as any).name || 
                         typedDoc._id?.toString().substring(0, 8) || 
                         'unknown';
      
      const userId = typedDoc.get('userId') || 
                    typedDoc.get('createdBy') || 
                    'system';
      
      const userName = typedDoc.get('userName') || 'System';
      
      await AdminAuditLog.logActivity({
        userId,
        userName,
        action: operation,
        resourceType: model.resourceType!,
        resourceId: typedDoc._id,
        resourceName,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        ipAddress: clientInfo.req.ip,
        userAgent: clientInfo.req.headers['user-agent'] || '',
        status: ActivityStatus.SUCCESS,
        metadata: {
          isNew: typedDoc.isNew,
          modifiedPaths: typedDoc.modifiedPaths()
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  });

  // Track document deletes
  model.schema.post('remove', async function(doc: any) {
    if (!model.trackChanges) return;
    
    const typedDoc = doc as unknown as ModifiedDocument;
    
    try {
      const clientInfo = await getClientInfo();
      const resourceName = model.getResourceName?.(doc) || 
                         (typedDoc as any).name || 
                         typedDoc._id?.toString().substring(0, 8) || 
                         'unknown';
      
      const userId = typedDoc.get('userId') || 
                    typedDoc.get('createdBy') || 
                    'system';
      
      const userName = typedDoc.get('userName') || 'System';
      
      await AdminAuditLog.logActivity({
        userId,
        userName,
        action: ActivityAction.DELETE,
        resourceType: model.resourceType!,
        resourceId: typedDoc._id,
        resourceName,
        ipAddress: clientInfo.req.ip,
        userAgent: clientInfo.req.headers['user-agent'] || '',
        status: ActivityStatus.SUCCESS,
        metadata: {
          deletedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log delete activity:', error);
    }
  });
}

// Track query-based operations (updateMany, deleteMany, etc.)
export function trackQueryOperations() {
  const operations = ['updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndRemove'] as const;
  
  type QueryOperation = typeof operations[number];
  
  operations.forEach((op: QueryOperation) => {
    const original = (Query.prototype as any)[op] as Function;
    
    if (typeof original !== 'function') return;
    
    (Query.prototype as any)[op] = async function(this: any, ...args: any[]) {
      const model = this.model as TrackedModel<any>;
      const shouldTrack = model.trackChanges && this.op !== 'count';
      
      if (!shouldTrack) {
        return original.apply(this, args);
      }
      
      try {
        const clientInfo = await getClientInfo();
        const result = await original.apply(this, args) as QueryResult;
        
        const action = op.startsWith('delete') ? ActivityAction.DELETE : ActivityAction.UPDATE;
        const resourceIds = result?.result?.nModified ?? result?.modifiedCount ?? 0;
        
        if (resourceIds > 0) {
          await AdminAuditLog.logActivity({
            action,
            resourceType: model.resourceType!,
            resourceId: 'multiple',
            ipAddress: clientInfo.req.ip,
            userAgent: clientInfo.req.headers['user-agent'] || '',
            status: ActivityStatus.SUCCESS,
            metadata: {
              operation: op,
              filter: this.getFilter(),
              update: this.getUpdate(),
              options: this.getOptions(),
              affectedCount: resourceIds
            }
          });
        }
        
        return result;
      } catch (error) {
        console.error(`Failed to log ${op} activity:`, error);
        throw error;
      }
    };
  });
}

// Initialize tracking for all models
export function initializeActivityTracking() {
  // Enable query operation tracking
  trackQueryOperations();
  
  // Return function to track specific models
  return {
    trackModel: trackModelChanges
  };
}

// Export a singleton instance
export const activityTracker = initializeActivityTracking();
