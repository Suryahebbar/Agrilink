"use client";

import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import Spinner from './Spinner';
import CircularProgress from './CircularProgress';

// Progress Bar Examples
export const ProgressBarExamples = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Progress Bar Examples</h2>
      
      {/* Basic Progress Bar */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Progress</h3>
        <ProgressBar value={progress} />
      </div>

      {/* Progress Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Progress Variants</h3>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Success (70%)</span>
          <ProgressBar value={70} variant="success" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Warning (40%)</span>
          <ProgressBar value={40} variant="warning" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Error (20%)</span>
          <ProgressBar value={20} variant="error" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Info (60%)</span>
          <ProgressBar value={60} variant="info" />
        </div>
      </div>

      {/* Progress Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Progress Sizes</h3>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Small</span>
          <ProgressBar value={50} size="sm" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Medium</span>
          <ProgressBar value={50} size="md" />
        </div>
        
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Large</span>
          <ProgressBar value={50} size="lg" />
        </div>
      </div>

      {/* Indeterminate Progress */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Indeterminate Progress</h3>
        <ProgressBar indeterminate={true} />
      </div>

      {/* Progress with Label */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Progress with Label</h3>
        <ProgressBar 
          value={progress} 
          showLabel={true} 
          label="Uploading files" 
        />
      </div>
    </div>
  );
};

// Spinner Examples
export const SpinnerExamples = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Spinner Examples</h2>
      
      {/* Basic Spinner */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Spinner</h3>
        <Spinner />
      </div>

      {/* Spinner Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Spinner Sizes</h3>
        
        <div className="flex items-center gap-4">
          <Spinner size="sm" label="Small" />
          <Spinner size="md" label="Medium" />
          <Spinner size="lg" label="Large" />
        </div>
      </div>

      {/* Spinner Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Spinner Variants</h3>
        
        <div className="flex items-center gap-4">
          <Spinner variant="success" label="Success" />
          <Spinner variant="warning" label="Warning" />
          <Spinner variant="error" label="Error" />
          <Spinner variant="info" label="Info" />
        </div>
      </div>
    </div>
  );
};

// Circular Progress Examples
export const CircularProgressExamples = () => {
  const [circularProgress, setCircularProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCircularProgress(prev => (prev >= 100 ? 0 : prev + 15));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Circular Progress Examples</h2>
      
      {/* Basic Circular Progress */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Basic Circular Progress</h3>
        <CircularProgress value={circularProgress} />
      </div>

      {/* Circular Progress Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Circular Progress Variants</h3>
        
        <div className="flex items-center gap-8">
          <CircularProgress value={75} variant="success" />
          <CircularProgress value={50} variant="warning" />
          <CircularProgress value={25} variant="error" />
          <CircularProgress value={60} variant="info" />
        </div>
      </div>

      {/* Circular Progress with Custom Label */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Custom Label</h3>
        <CircularProgress value={85} label="Complete" />
      </div>

      {/* Different Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Different Sizes</h3>
        
        <div className="flex items-center gap-8">
          <CircularProgress value={60} size={80} />
          <CircularProgress value={60} size={120} />
          <CircularProgress value={60} size={160} />
        </div>
      </div>
    </div>
  );
};

// Complete Demo
export const ProgressIndicatorsDemo = () => {
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-2xl font-bold text-gray-900">Progress Indicators</h1>
      
      <ProgressBarExamples />
      <div className="border-t pt-8" />
      <SpinnerExamples />
      <div className="border-t pt-8" />
      <CircularProgressExamples />
    </div>
  );
};

export default ProgressIndicatorsDemo;
