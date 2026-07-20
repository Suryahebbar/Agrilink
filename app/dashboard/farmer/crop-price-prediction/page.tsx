"use client";

import { useState, useEffect } from 'react';
// TODO: Implement useSearchParams for user-specific data
// import { useSearchParams } from 'next/navigation';

interface CropData {
  value: string;
  label: string;
}

interface PredictionData {
  crop: string;
  predictions: number[];
  dates: string[];
  confidenceIntervals: Array<{
    lower: number;
    upper: number;
  }>;
}

interface HistoricalData {
  crop: string;
  dates: string[];
  prices: number[];
  data_points: number;
}

export default function CropPricePrediction() {
  // TODO: Implement searchParams and userId usage for user-specific data
  // const searchParams = useSearchParams();
  // const userId = searchParams?.get('userId');
  
  const [crops, setCrops] = useState<CropData[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionMonths, setPredictionMonths] = useState(3);

  // Helper function to build URLs with userId
  // Helper function to build URLs with userId (currently unused but kept for future use)
  // const buildUrl = (path: string) => {
  //   return userId ? `${path}?userId=${userId}` : path;
  // };

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crop-prices/predict-simple');
      if (response.ok) {
        const data = await response.json();
        setCrops(data.crops || []);
      }
    } catch {
      console.error('Failed to load crops data');
    } finally {
      setLoading(false);
    }
  };

  const handleCropChange = async (crop: string) => {
    setSelectedCrop(crop);
    setHistoricalData(null);
    setPredictionData(null);
    setError(null);
    
    if (crop) {
      await loadHistoricalData(crop);
    }
  };

  const loadHistoricalData = async (crop: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/crop-prices/historical-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crop, months: 24 }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      } else {
        setError('Failed to load historical data');
      }
    } catch {
      console.error('Failed to load historical data');
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async () => {
    if (!selectedCrop) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/crop-prices/predict-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crop: selectedCrop, months: predictionMonths }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          setError(data.error);
        } else {
          setPredictionData(data);
        }
      } else {
        setError('Failed to generate prediction');
      }
    } catch {
      console.error('Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const renderChart = () => {
    if (!historicalData) return null;

    const allDates = [...historicalData.dates];
    const allPrices = [...historicalData.prices];
    let predictedPrices: number[] = [];
    let predictedDates: string[] = [];
    // TODO: Implement confidence intervals visualization
    // const confidenceIntervals: Array<{lower: number; upper: number}> = [];

    if (predictionData) {
      predictedDates = predictionData.dates;
      predictedPrices = predictionData.predictions;
      // confidenceIntervals = predictionData.confidenceIntervals;
      
      // Add prediction data to chart
      allDates.push(...predictedDates);
      allPrices.push(...predictedPrices);
    }

    // Calculate min and max for chart scaling
    const minPrice = Math.min(...allPrices) * 0.9;
    const maxPrice = Math.max(...allPrices) * 1.1;
    const priceRange = maxPrice - minPrice;

    return (
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
        <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">
          Price Analysis - {selectedCrop?.charAt(0).toUpperCase() + selectedCrop?.slice(1)}
        </h3>
        
        {/* SVG Chart */}
        <div className="relative h-96 mb-6">
          <svg width="100%" height="100%" viewBox="0 0 800 400" className="border border-gray-200 rounded">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g key={i}>
                <line
                  x1="50"
                  y1={50 + i * 60}
                  x2="750"
                  y2={50 + i * 60}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x="40"
                  y={55 + i * 60}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  {formatPrice(maxPrice - (priceRange * i) / 5)}
                </text>
              </g>
            ))}

            {/* Historical data line */}
            {historicalData && (
              <polyline
                points={historicalData.prices.map((price, index) => {
                  const x = 50 + (index / (allDates.length - 1)) * 700;
                  const y = 50 + ((maxPrice - price) / priceRange) * 300;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#1f3b2c"
                strokeWidth="2"
              />
            )}

            {/* Historical data points */}
            {historicalData.prices.map((price, index) => {
              const x = 50 + (index / (allDates.length - 1)) * 700;
              const y = 50 + ((maxPrice - price) / priceRange) * 300;
              return (
                <circle
                  key={`hist-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#1f3b2c"
                />
              );
            })}

            {/* Prediction line */}
            {predictionData && (
              <>
                <polyline
                  points={predictionData.predictions.map((price, index) => {
                    const histLength = historicalData.dates.length;
                    const predIndex = histLength + index;
                    const x = 50 + (predIndex / (allDates.length - 1)) * 700;
                    const y = 50 + ((maxPrice - price) / priceRange) * 300;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f7941d"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                
                {/* Prediction points */}
                {predictionData.predictions.map((price, index) => {
                  const histLength = historicalData.dates.length;
                  const predIndex = histLength + index;
                  const x = 50 + (predIndex / (allDates.length - 1)) * 700;
                  const y = 50 + ((maxPrice - price) / priceRange) * 300;
                  return (
                    <circle
                      key={`pred-${index}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#f7941d"
                    />
                  );
                })}

                {/* Confidence intervals */}
                {predictionData.confidenceIntervals.map((interval, index) => {
                  const histLength = historicalData.dates.length;
                  const predIndex = histLength + index;
                  const x = 50 + (predIndex / (allDates.length - 1)) * 700;
                  const yLower = 50 + ((maxPrice - interval.upper) / priceRange) * 300;
                  const yUpper = 50 + ((maxPrice - interval.lower) / priceRange) * 300;
                  
                  return (
                    <rect
                      key={`conf-${index}`}
                      x={x - 10}
                      y={yLower}
                      width="20"
                      height={yUpper - yLower}
                      fill="#f7941d"
                      fillOpacity="0.2"
                    />
                  );
                })}
              </>
            )}

            {/* X-axis labels (show sample dates) */}
            {allDates.filter((_, _index) => _index % Math.ceil(allDates.length / 8) === 0).map((date) => {
              const actualIndex = allDates.indexOf(date);
              const x = 50 + (actualIndex / (allDates.length - 1)) * 700;
              return (
                <text
                  key={date}
                  x={x}
                  y="380"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {formatDate(date)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[#1f3b2c] rounded"></div>
            <span className="text-[#6b7280]">Historical Prices</span>
          </div>
          {predictionData && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#f7941d] rounded"></div>
                <span className="text-[#6b7280]">Predicted Prices</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-[#f7941d] rounded opacity-30"></div>
                <span className="text-[#6b7280]">Confidence Interval</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f3b2c] mb-2">Crop Price Prediction</h1>
        <p className="text-[#6b7280]">AI-powered price forecasting for agricultural crops</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-lg border border-[#e2d4b7] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Crop Selection */}
          <div>
            <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
              Select Crop
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => handleCropChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] text-gray-700"
              disabled={loading}
              aria-label="Select Crop"
              id="crop-select"
              title="Select a crop for price prediction"
            >
              <option value="">Choose a crop...</option>
              {crops.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {crop.label}
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Months */}
          <div>
            <label className="block text-sm font-medium text-[#1f3b2c] mb-2">
              Prediction Period
            </label>
            <select
              value={predictionMonths}
              onChange={(e) => setPredictionMonths(Number(e.target.value))}
              className="w-full px-3 py-2 border border-[#e2d4b7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b2c] text-gray-700"
              disabled={loading}
              aria-label="Prediction Period"
              id="prediction-period-select"
              title="Select prediction period in months"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generatePrediction}
              disabled={!selectedCrop || loading}
              className="w-full bg-[#1f3b2c] text-white py-2 px-4 rounded-lg hover:bg-[#2d4f3c] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Prediction'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Chart */}
      {historicalData && renderChart()}

      {/* Prediction Results */}
      {predictionData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Predictions Table */}
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
            <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Price Predictions</h3>
            <div className="space-y-3">
              {predictionData.dates.map((date, index) => (
                <div key={date} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-[#6b7280]">{formatDate(date)}</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#1f3b2c]">
                      {formatPrice(predictionData.predictions[index])}
                    </span>
                    <div className="text-xs text-[#6b7280]">
                      ±{formatPrice((predictionData.confidenceIntervals[index].upper - predictionData.confidenceIntervals[index].lower) / 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg border border-[#e2d4b7] p-6">
            <h3 className="text-lg font-semibold text-[#1f3b2c] mb-4">Analysis Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Current Price</span>
                <span className="font-semibold text-[#1f3b2c]">
                  {historicalData && historicalData.prices.length > 0 
                    ? formatPrice(historicalData.prices[historicalData.prices.length - 1])
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Predicted Average</span>
                <span className="font-semibold text-[#1f3b2c]">
                  {formatPrice(predictionData.predictions.reduce((a, b) => a + b, 0) / predictionData.predictions.length)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Price Trend</span>
                <span className={`font-semibold ${
                  predictionData.predictions[predictionData.predictions.length - 1] > 
                  (historicalData?.prices[historicalData.prices.length - 1] || 0)
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {predictionData.predictions[predictionData.predictions.length - 1] > 
                  (historicalData?.prices[historicalData.prices.length - 1] || 0)
                    ? '↗️ Rising' : '↘️ Falling'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b7280]">Data Points</span>
                <span className="font-semibold text-[#1f3b2c]">
                  {historicalData?.data_points || 0}
                </span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#e2d4b7]">
                <div className="text-xs text-[#6b7280] space-y-1">
                <p>• Actual prices may vary due to market conditions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !historicalData && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1f3b2c] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading crop data...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !selectedCrop && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-[#6b7280]">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-[#1f3b2c] mb-2">Select a Crop to Begin</h3>
          <p className="text-[#6b7280]">Choose a crop from the dropdown to see price predictions</p>
        </div>
      )}
    </div>
  );
}