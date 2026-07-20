import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiDollarSign, 
  FiUser, 
  FiPackage, 
  FiClock, 
  FiInfo,
  FiShoppingBag,
  FiShoppingCart,
  FiFileText,
  FiTruck,
  FiUserCheck,
  FiUserX,
  FiCreditCard
} from 'react-icons/fi';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  status: string;
  timestamp: Date | string;
  icon?: string;
  user?: string;
}

interface RecentActivitiesProps {
  activities?: Activity[];
}

const getActivityIcon = (type: string, status: string) => {
  // First check status for color
  const statusColor = getStatusColor(status);
  
  // Then get icon based on activity type
  switch (type) {
    case 'marketplace_order':
      return <FiShoppingBag className={`h-5 w-5 ${statusColor}`} />;
    case 'supplier_order':
      return <FiPackage className={`h-5 w-5 ${statusColor}`} />;
    case 'farmer_order':
      return <FiShoppingCart className={`h-5 w-5 ${statusColor}`} />;
    case 'farmer_registration':
      return <FiUserCheck className={`h-5 w-5 ${statusColor}`} />;
    case 'supplier_registration':
      return <FiUserCheck className={`h-5 w-5 ${statusColor}`} />;
    case 'document_update':
      return <FiFileText className={`h-5 w-5 ${statusColor}`} />;
    case 'payment':
      return <FiCreditCard className={`h-5 w-5 ${statusColor}`} />;
    case 'user':
      return <FiUser className={`h-5 w-5 ${statusColor}`} />;
    default:
      return <FiInfo className={`h-5 w-5 ${statusColor}`} />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'approved':
    case 'verified':
    case 'paid':
      return 'text-green-500';
    case 'processing':
    case 'pending':
    case 'shipped':
      return 'text-yellow-500';
    case 'cancelled':
    case 'rejected':
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-blue-500';
  }
};

const formatTimeAgo = (date?: Date | string) => {
  if (!date) return 'Just now';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'Just now';
};

export default function RecentActivities({ activities = [] }: RecentActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p>No recent activities found</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => {
          const icon = getActivityIcon(activity.type, activity.status);
          const statusColor = getStatusColor(activity.status);
          
          return (
            <li key={`${activity.id}-${index}`}>
              <div className="relative pb-8">
                {index !== activities.length - 1 && (
                  <span 
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}>
                      {icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.description}
                      </p>
                      {activity.amount !== undefined && (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          ₹{activity.amount.toLocaleString()}
                        </p>
                      )}
                      {activity.user && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {activity.user}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={new Date(activity.timestamp).toISOString()}>
                        {formatTimeAgo(activity.timestamp)}
                      </time>
                      <div className={`text-xs mt-1 ${statusColor}`}>
                        {activity.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}