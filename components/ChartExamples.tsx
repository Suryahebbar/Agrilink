"use client";

import React from 'react';
import {
  LineChart,
  BarChart,
  DonutChart,
  Sparkline,
  SalesTrendChart,
  CategoryPerformanceChart,
  RevenueComparisonChart,
  DeviceDistributionChart
} from './Charts';
import {
  chartColors,
  lineChartConfig,
  barChartConfig
} from '@/lib/chart-config';

// Chart data types
interface LineChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    borderWidth?: number;
  }>;
}

interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
  }>;
}

interface DoughnutChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    backgroundColor: string[];
    borderWidth?: number;
  }>;
}

// Sample data generators
const generateTimeSeriesData = (days: number, baseValue: number, variance: number) => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, days);
  const data = labels.map(() => 
    baseValue + Math.floor(Math.random() * variance * 2) - variance
  );
  return { labels, data };
};

const generateCategoryData = (categories: string[], baseValue: number, variance: number) => {
  const data = categories.map(() => 
    baseValue + Math.floor(Math.random() * variance * 2) - variance
  );
  return data;
};

// Line Chart Examples
export const LineChartExamples = () => {
  const { labels, data } = generateTimeSeriesData(5, 200, 50);
  const lineData: LineChartData = {
    labels,
    datasets: [{
      label: 'Orders',
      data,
      borderColor: chartColors.primary,
      backgroundColor: `${chartColors.primary}20`,
      borderWidth: 2
    }]
  };

  const areaData: LineChartData = {
    labels,
    datasets: [{
      label: 'Revenue',
      data,
      borderColor: chartColors.primary,
      backgroundColor: chartColors.primaryAreaFill,
      borderWidth: 2
    }]
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Line Chart Examples</h2>
      
      {/* Basic Line Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Sales Trend</h3>
        <LineChart data={lineData} height={256} />
      </div>

      {/* Area Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Revenue Overview (Area)</h3>
        <LineChart data={areaData} height={256} showArea={true} />
      </div>

      {/* Multi-series Line Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Orders vs Visitors</h3>
        <LineChart 
          data={{
            labels,
            datasets: [
              {
                label: 'Orders',
                data: generateTimeSeriesData(5, 150, 30).data,
                borderColor: chartColors.primary,
                backgroundColor: chartColors.primary,
                borderWidth: 2
              },
              {
                label: 'Visitors',
                data: generateTimeSeriesData(5, 500, 100).data,
                borderColor: chartColors.secondary,
                backgroundColor: chartColors.secondary,
                borderWidth: 2
              }
            ]
          }}
          height={256}
          options={{
            plugins: {
              ...lineChartConfig.options.plugins,
              legend: { display: true, position: 'bottom' as const }
            }
          }}
        />
      </div>
    </div>
  );
};

// Bar Chart Examples
export const BarChartExamples = () => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  const barData: BarChartData = {
    labels: categories,
    datasets: [{
      label: 'Units Sold',
      data: generateCategoryData(categories, 200, 80),
      backgroundColor: chartColors.primary
    }]
  };

  const stackedData: BarChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Completed',
        data: generateCategoryData(categories, 150, 50),
        backgroundColor: chartColors.primary
      },
      {
        label: 'Pending',
        data: generateCategoryData(categories, 80, 30),
        backgroundColor: chartColors.warning
      }
    ]
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Bar Chart Examples</h2>
      
      {/* Basic Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Category Performance</h3>
        <BarChart data={barData} height={256} />
      </div>

      {/* Stacked Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Order Status (Stacked)</h3>
        <BarChart data={stackedData} height={256} stacked={true} />
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Revenue by Category</h3>
        <BarChart 
          data={barData}
          height={256}
          options={{
            indexAxis: 'y',
            plugins: {
              ...barChartConfig.options.plugins,
              legend: { display: false }
            }
          }}
        />
      </div>
    </div>
  );
};

// Donut Chart Examples
export const DonutChartExamples = () => {
  // Fix the donut chart data to have proper colors
  const fixedDeviceData: DoughnutChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [55, 35, 10],
      backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.warning],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Donut Chart Examples</h2>
      
      {/* Basic Donut Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Device Distribution</h3>
        <DonutChart data={fixedDeviceData} height={256} />
      </div>

      {/* Donut Chart with Center Text */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Total Revenue</h3>
        <DonutChart 
          data={fixedDeviceData} 
          height={256} 
          centerText="$125K"
        />
      </div>

      {/* Small Donut Chart */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Traffic Sources</h3>
        <DonutChart 
          data={fixedDeviceData} 
          height={180}
        />
      </div>
    </div>
  );
};

// Sparkline Examples
export const SparklineExamples = () => {
  const sparklineData1 = [120, 135, 125, 145, 160, 155, 170];
  const sparklineData2 = [80, 75, 85, 70, 90, 85, 95];
  const sparklineData3 = [200, 180, 210, 190, 220, 205, 235];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Sparkline Examples</h2>
      
      {/* Sparkline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Sales Growth</h4>
          <div className="flex items-center gap-2">
            <Sparkline data={sparklineData1} color={chartColors.primary} />
            <span className="text-sm font-semibold text-green-600">+12%</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">Stock Change</h4>
          <div className="flex items-center gap-2">
            <Sparkline data={sparklineData2} color={chartColors.warning} />
            <span className="text-sm font-semibold text-yellow-600">+3%</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">CTR Trends</h4>
          <div className="flex items-center gap-2">
            <Sparkline data={sparklineData3} color={chartColors.secondary} />
            <span className="text-sm font-semibold text-blue-600">+18%</span>
          </div>
        </div>
      </div>

      {/* Sparkline in Table Context */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Dashboard Metrics with Sparklines</h3>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Sales</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Trend</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">7-Day Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm">Laptop Pro</td>
                <td className="px-4 py-2 text-sm text-right font-medium">1,234</td>
                <td className="px-4 py-2 text-sm text-right text-green-600">+8%</td>
                <td className="px-4 py-2 text-sm text-right">
                  <Sparkline data={sparklineData1} width={80} height={30} />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Smart Watch</td>
                <td className="px-4 py-2 text-sm text-right font-medium">856</td>
                <td className="px-4 py-2 text-sm text-right text-yellow-600">+2%</td>
                <td className="px-4 py-2 text-sm text-right">
                  <Sparkline data={sparklineData2} width={80} height={30} />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">Tablet Air</td>
                <td className="px-4 py-2 text-sm text-right font-medium">642</td>
                <td className="px-4 py-2 text-sm text-right text-green-600">+15%</td>
                <td className="px-4 py-2 text-sm text-right">
                  <Sparkline data={sparklineData3} width={80} height={30} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Pre-configured Dashboard Charts
export const DashboardCharts = () => {
  const salesData: LineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Sales',
      data: [120, 150, 180, 140, 200],
      borderColor: chartColors.primary,
      backgroundColor: `${chartColors.primary}20`,
      borderWidth: 2
    }]
  };

  const categoryData: BarChartData = {
    labels: ['Electronics', 'Fashion', 'Home', 'Beauty'],
    datasets: [{
      label: 'Revenue',
      data: [450, 380, 290, 210],
      backgroundColor: chartColors.primary
    }]
  };

  const comparisonData: BarChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue',
        data: [1200, 1400, 1100, 1600],
        backgroundColor: chartColors.primary
      },
      {
        label: 'Returns',
        data: [120, 140, 110, 160],
        backgroundColor: chartColors.warning
      }
    ]
  };

  const deviceData: DoughnutChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [55, 35, 10],
      backgroundColor: [chartColors.primary, chartColors.secondary, chartColors.warning],
      borderWidth: 0
    }]
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard Charts</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart data={salesData} />
        <CategoryPerformanceChart data={categoryData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueComparisonChart data={comparisonData} />
        <DeviceDistributionChart data={deviceData} />
      </div>
    </div>
  );
};

// Complete Demo
export const ChartsDemo = () => {
  return (
    <div className="p-8 space-y-12 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900">Chart Components</h1>
      
      <LineChartExamples />
      <div className="border-t border-gray-200 pt-8" />
      <BarChartExamples />
      <div className="border-t border-gray-200 pt-8" />
      <DonutChartExamples />
      <div className="border-t border-gray-200 pt-8" />
      <SparklineExamples />
      <div className="border-t border-gray-200 pt-8" />
      <DashboardCharts />
    </div>
  );
};

export default ChartsDemo;
