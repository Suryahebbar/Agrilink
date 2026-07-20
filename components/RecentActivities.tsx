import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ActivityAction, ResourceType } from '@/lib/models/AdminAuditLog';
import { getActionLabel, getResourceIcon, getStatusColor } from '@/lib/utils/activity-helper';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { useActivities } from '@/lib/hooks/useActivities';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentActivitiesProps {
  limit?: number;
  resourceType?: string;
  resourceId?: string;
  userId?: string;
  showTitle?: boolean;
  showViewAll?: boolean;
  className?: string;
}

export function RecentActivities({
  limit = 10,
  resourceType,
  resourceId,
  userId,
  showTitle = true,
  showViewAll = true,
  className = '',
}: RecentActivitiesProps) {
  const { 
    activities, 
    loading, 
    error, 
    pagination, 
    refresh, 
    loadMore 
  } = useActivities({
    limit,
    resourceType,
    resourceId,
    userId,
    autoFetch: true,
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Error loading activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            {error.message || 'Failed to load activities'}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refresh()}
          >
            <FiRefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          {showTitle && (
            <>
              <CardTitle className="text-lg font-medium">
                Recent Activities
              </CardTitle>
              <CardDescription>
                {pagination.total > 0 
                  ? `${pagination.total} total activities`
                  : 'No activities found'}
              </CardDescription>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refresh()}
          disabled={loading}
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {loading && activities.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-2 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities found
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity._id} 
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                    <span className="text-sm">
                      {getResourceIcon(activity.resourceType)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {activity.userName || 'System'}
                      </p>
                      <Badge 
                        variant={getStatusVariant(activity.status)}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getActionLabel(activity.action)}{' '}
                      {activity.resourceType} 
                      {activity.resourceName && `: ${activity.resourceName}`}
                    </p>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <time dateTime={activity.timestamp}>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </time>
                      {activity.ipAddress && (
                        <span className="mx-2">•</span>
                      )}
                      {activity.ipAddress && (
                        <span className="font-mono text-xs">
                          {activity.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {pagination.hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadMore()}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {showViewAll && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm">
              View All Activities
              <FiExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivities;
