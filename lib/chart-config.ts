// Chart configuration utilities for Amazon-style charts
// Compatible with Chart.js, but can be adapted for other libraries

// Type definition for chart datasets
interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  type?: string;
}

export const chartColors = {
  primary: '#1A9B9A',
  primaryLight: '#4DB8B8',
  primaryTransparent: 'rgba(26, 155, 154, 0.12)',
  primaryAreaFill: 'rgba(26, 155, 154, 0.18)',
  
  secondary: '#2962FF',
  secondaryLight: '#5C85FF',
  secondaryTransparent: 'rgba(41, 98, 255, 0.12)',
  
  warning: '#FF9900',
  warningTransparent: 'rgba(255, 153, 0, 0.12)',
  
  error: '#D93025',
  errorTransparent: 'rgba(211, 48, 37, 0.12)',
  
  grid: '#E5E7EB',
  axis: '#9CA3AF',
  legend: '#374151',
  
  tooltip: {
    backgroundColor: '#232F3E',
    titleColor: '#FFFFFF',
    bodyColor: '#FFFFFF',
    borderColor: '#232F3E'
  }
};

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
      labels: {
        color: chartColors.legend,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: chartColors.tooltip.backgroundColor,
      titleColor: chartColors.tooltip.titleColor,
      bodyColor: chartColors.tooltip.bodyColor,
      borderColor: chartColors.tooltip.borderColor,
      borderWidth: 0,
      padding: 10,
      cornerRadius: 6,
      displayColors: true,
      boxPadding: 4
    }
  },
  scales: {
    x: {
      grid: {
        color: chartColors.grid,
        drawBorder: false,
        borderDash: [2, 4]
      },
      ticks: {
        color: chartColors.axis,
        font: {
          size: 11
        }
      }
    },
    y: {
      grid: {
        color: chartColors.grid,
        drawBorder: false,
        borderDash: [2, 4]
      },
      ticks: {
        color: chartColors.axis,
        font: {
          size: 11
        }
      }
    }
  }
};

export const lineChartConfig = {
  type: 'line',
  options: {
    ...baseChartOptions,
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 2
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }
};

export const barChartConfig = {
  type: 'bar',
  options: {
    ...baseChartOptions,
    elements: {
      bar: {
        borderRadius: 6,
        maxBarThickness: 40
      }
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        display: false
      }
    }
  }
};

export const stackedBarChartConfig = {
  type: 'bar',
  options: {
    ...baseChartOptions,
    scales: {
      x: {
        ...baseChartOptions.scales.x,
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        ...baseChartOptions.scales.y,
        stacked: true,
        grid: {
          color: chartColors.grid,
          drawBorder: false,
          borderDash: [2, 4]
        }
      }
    },
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        display: true,
        position: 'bottom' as const
      }
    }
  }
};

export const donutChartConfig = {
  type: 'doughnut',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: chartColors.legend,
          font: {
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle' as const
        }
      },
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          label: function(context: { label: string; parsed: number; dataset: { data: number[] } }) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }
};

export const areaChartConfig = {
  type: 'line',
  options: {
    ...lineChartConfig.options,
    elements: {
      ...lineChartConfig.options.elements,
      fill: true
    }
  }
};

export const sparklineConfig = {
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        borderDash: []
      },
      point: {
        radius: 0,
        hoverRadius: 0
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }
};

// Helper function to create chart data
export const createChartData = (labels: string[], datasets: ChartDataset[]) => ({
  labels,
  datasets
});

// Helper function to create a single dataset
export const createDataset = (
  label: string,
  data: number[],
  color: string = chartColors.primary,
  backgroundColor?: string,
  type?: 'line' | 'bar'
): ChartDataset => ({
  label,
  data,
  borderColor: color,
  backgroundColor: backgroundColor || color,
  borderWidth: 2,
  type
});

const ChartConfig = {
  chartColors,
  baseChartOptions,
  lineChartConfig,
  barChartConfig,
  stackedBarChartConfig,
  donutChartConfig,
  areaChartConfig,
  sparklineConfig,
  createChartData,
  createDataset
};

export default ChartConfig;
