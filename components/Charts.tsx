"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  chartColors,
  lineChartConfig,
  barChartConfig,
  stackedBarChartConfig,
  donutChartConfig,
  areaChartConfig,
  sparklineConfig
} from '@/lib/chart-config';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart data interfaces
interface LineChartData {
  labels: string[];
  datasets: LineChartDataset[];
}

interface BarChartData {
  labels: string[];
  datasets: BarChartDataset[];
}

interface DoughnutChartData {
  labels: string[];
  datasets: DoughnutChartDataset[];
}

interface LineChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  type?: 'line';
}

interface BarChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  type?: 'bar';
}

interface DoughnutChartDataset {
  data: number[];
  backgroundColor: string[];
  borderWidth?: number;
}

interface BaseChartProps {
  options?: Record<string, unknown>;
  className?: string;
  height?: number;
}

interface LineChartProps extends BaseChartProps {
  data: LineChartData;
  showArea?: boolean;
}

interface BarChartProps extends BaseChartProps {
  data: BarChartData;
  stacked?: boolean;
}

interface DonutChartProps extends BaseChartProps {
  data: DoughnutChartData;
  centerText?: string;
}

interface SparklineProps {
  data: number[];
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}

// Line Chart Component
export const LineChart: React.FC<LineChartProps> = ({
  data,
  options = {},
  className = '',
  height = 256,
  showArea = false
}) => {
  const config = showArea ? areaChartConfig : lineChartConfig;
  const mergedOptions = { ...config.options, ...options };

  return (
    <div className={`chart-container ${className} chart-height-${height}`}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

// Bar Chart Component
export const BarChart: React.FC<BarChartProps> = ({
  data,
  options = {},
  className = '',
  height = 256,
  stacked = false
}) => {
  const config = stacked ? stackedBarChartConfig : barChartConfig;
  const mergedOptions = { ...config.options, ...options };

  return (
    <div className={`chart-container ${className} chart-height-${height}`}>
      <Bar data={data} options={mergedOptions} />
    </div>
  );
};

// Donut Chart Component
export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  options = {},
  className = '',
  height = 256,
  centerText
}) => {
  const mergedOptions = { ...donutChartConfig.options, ...options };

  return (
    <div className={`chart-container ${className} chart-height-${height} chart-donut-container`}>
      <Doughnut data={data} options={mergedOptions} />
      {centerText && (
        <div className="chart-donut-center-text">
          <div className="chart-donut-center-value">
            {centerText}
          </div>
        </div>
      )}
    </div>
  );
};

// Sparkline Component
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  className = '',
  width = 96,
  height = 40,
  color = chartColors.primary
}) => {
  const sparklineData = {
    labels: Array(data.length).fill(''),
    datasets: [{
      label: '',
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      borderWidth: 2
    }]
  };

  return (
    <div className={`${className} chart-sparkline chart-sparkline-${width}-${height}`}>
      <Line data={sparklineData} options={sparklineConfig.options} />
    </div>
  );
};

// Pre-configured chart examples
export const SalesTrendChart: React.FC<{ data: LineChartData }> = ({ data }) => (
  <LineChart
    data={data}
    height={300}
    options={{
      plugins: {
        ...lineChartConfig.options.plugins,
        title: {
          display: true,
          text: 'Sales Trend',
          color: chartColors.legend,
          font: { size: 16, weight: 'bold' as const }
        }
      }
    }}
  />
);

export const CategoryPerformanceChart: React.FC<{ data: BarChartData }> = ({ data }) => (
  <BarChart
    data={data}
    height={300}
    options={{
      plugins: {
        ...barChartConfig.options.plugins,
        title: {
          display: true,
          text: 'Category Performance',
          color: chartColors.legend,
          font: { size: 16, weight: 'bold' as const }
        }
      }
    }}
  />
);

export const RevenueComparisonChart: React.FC<{ data: BarChartData }> = ({ data }) => (
  <BarChart
    data={data}
    height={300}
    stacked={true}
    options={{
      plugins: {
        ...stackedBarChartConfig.options.plugins,
        title: {
          display: true,
          text: 'Revenue vs Returns',
          color: chartColors.legend,
          font: { size: 16, weight: 'bold' as const }
        }
      }
    }}
  />
);

export const DeviceDistributionChart: React.FC<{ data: DoughnutChartData }> = ({ data }) => (
  <DonutChart
    data={data}
    height={300}
    options={{
      plugins: {
        ...donutChartConfig.options.plugins,
        title: {
          display: true,
          text: 'Device Distribution',
          color: chartColors.legend,
          font: { size: 16, weight: 'bold' as const }
        }
      }
    }}
  />
);

const ChartsComponents = {
  LineChart,
  BarChart,
  DonutChart,
  Sparkline,
  SalesTrendChart,
  CategoryPerformanceChart,
  RevenueComparisonChart,
  DeviceDistributionChart
};

export default ChartsComponents;
