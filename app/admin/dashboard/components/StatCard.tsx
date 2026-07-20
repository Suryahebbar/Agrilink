import { ReactNode } from 'react';
import { FiTrendingUp, FiTrendingDown, FiLoader } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  color: string;
  isLoading?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  isLoading = false 
}: Omit<StatCardProps, 'change'>) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-3/4"></div>
          </div>
          <div className="p-3 rounded-full bg-gray-200">
            <FiLoader className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
