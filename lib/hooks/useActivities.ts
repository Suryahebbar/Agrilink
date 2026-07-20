import { useState, useEffect, useCallback } from 'react';
import { ActivityAction, ResourceType, ActivityStatus } from '@/lib/models/AdminAuditLog';
import { ActivityLogger } from '@/lib/utils/activity-helper';

interface UseActivitiesOptions {
  limit?: number;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  action?: string;
  status?: ActivityStatus;
  autoFetch?: boolean;
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const {
    limit = 10,
    resourceType,
    resourceId,
    userId,
    action,
    status,
    autoFetch = true,
  } = options;

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit,
    hasMore: false,
  });

  const fetchActivities = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const skip = (page - 1) * limit;
      
      const result = await ActivityLogger.getRecentActivities({
        limit,
        skip,
        resourceType,
        resourceId,
        userId,
        action,
        status,
      });

      setActivities(prev => page === 1 ? result.data : [...prev, ...result.data]);
      
      setPagination({
        page,
        total: result.total,
        limit,
        hasMore: page * limit < result.total,
      });
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch activities');
      setError(error);
      console.error('Error fetching activities:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [limit, resourceType, resourceId, userId, action, status]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      return fetchActivities(pagination.page + 1);
    }
    return Promise.resolve();
  }, [fetchActivities, pagination, loading]);

  const refresh = useCallback(() => {
    return fetchActivities(1);
  }, [fetchActivities]);

  // Auto-fetch on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchActivities(1);
    }
  }, [autoFetch, fetchActivities]);

  // Log activity helper
  const logActivity = useCallback(async (params: {
    action: ActivityAction | string;
    resourceType: ResourceType | string;
    resourceId: string | any;
    resourceName?: string;
    changes?: Record<string, { old: any; new: any }>;
    metadata?: Record<string, any>;
    status?: ActivityStatus;
  }) => {
    try {
      const activity = await ActivityLogger.logActivity(params);
      
      // Prepend the new activity to the list
      if (activity) {
        setActivities(prev => [activity, ...prev]);
        
        // Update pagination total
        setPagination(prev => ({
          ...prev,
          total: prev.total + 1,
        }));
      }
      
      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }, []);

  return {
    activities,
    loading,
    error,
    pagination,
    fetchActivities,
    loadMore,
    refresh,
    logActivity,
  };
}

// Hook for activity statistics
export function useActivityStats(options: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  resourceType?: string;
  action?: string;
  userId?: string;
} = {}) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ActivityLogger.getActivityStats({
        startDate: options.startDate,
        endDate: options.endDate,
        groupBy: options.groupBy,
        resourceType: options.resourceType,
        action: options.action,
        userId: options.userId,
      });

      setStats(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch activity stats');
      setError(error);
      console.error('Error fetching activity stats:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [
    options.startDate, 
    options.endDate, 
    options.groupBy, 
    options.resourceType, 
    options.action, 
    options.userId
  ]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
