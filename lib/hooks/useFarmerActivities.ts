import { useState, useEffect, useCallback } from 'react';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  timestamp: string | Date;
  user?: string;
}

export function useFarmerActivities(userId: string | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/farmer/activities?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch activities');
      setError(error);
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const refresh = useCallback(() => {
    return fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refresh,
  };
}
