import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  totalFarmers: number;
  pendingFarmerApprovals: number;
  totalFarmPools: number;
  activeFarmPools: number;
  totalFcos: number;
  pendingAgreements: number;
  totalBlockchainAgreements: number;
  blockchainRecords: number;
  revenueOverview: number;
  totalInsuranceRequests: number;
  totalSuppliers: number;
  totalProducts: number;
  totalMarketplaceOrders: number;
  totalSupplierOrders: number;
  totalRevenue: number;
  recentActivities: any[];
  topProducts: any[];
  recentOrders: any[];
  recentActivity: any[];
}

export function useDashboardData() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        return response.json();
      } catch (error) {
        console.error('Dashboard API error:', error);
        // Return default data on error
        return {
          totalFarmers: 0,
          pendingFarmerApprovals: 0,
          totalFarmPools: 0,
          activeFarmPools: 0,
          totalFcos: 0,
          pendingAgreements: 0,
          totalBlockchainAgreements: 0,
          blockchainRecords: 0,
          revenueOverview: 0,
          totalInsuranceRequests: 0,
          totalSuppliers: 0,
          totalProducts: 0,
          totalMarketplaceOrders: 0,
          totalSupplierOrders: 0,
          totalRevenue: 0,
          recentActivities: [],
          topProducts: [],
          recentOrders: [],
          recentActivity: []
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on error
  });
}
