'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface SalesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }>;
}

interface SalesChartProps {
  data?: SalesData;
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0
  },
  transitions: {
    active: {
      animation: {
        duration: 0
      }
    }
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
      }
    },
    tooltip: {
      backgroundColor: 'white',
      titleColor: '#111827',
      bodyColor: '#4B5563',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 12,
      usePointStyle: true,
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ₹${value?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '0'}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#6B7280'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.03)'
      },
      ticks: {
        color: '#6B7280',
        callback: (value: string | number) => `₹${Number(value).toLocaleString()}`
      }
    }
  },
  elements: {
    line: {
      tension: 0,
      borderWidth: 2
    },
    point: {
      radius: 0,
      hoverRadius: 5,
      hoverBorderWidth: 2
    }
  },
};

export default function SalesChart({ data }: SalesChartProps) {
  // Default data when no data is provided
  const defaultData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Marketplace Orders',
        data: [0, 10000, 5000, 15000, 10000, 20000, 15000],
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
      },
      {
        label: 'Supplier Orders',
        data: [0, 8000, 4000, 12000, 8000, 18000, 12000],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
      },
    ],
  };

  const chartData = data || defaultData;

  return (
    <div className="h-full w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Transaction Volume (Last 7 Days)</h3>
      <div className="h-64">
        <Line 
          data={chartData} 
          options={options} 
        />
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Hover over points to see transaction amounts
      </div>
    </div>
  );
}
