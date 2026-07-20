"use client";

import { Suspense } from 'react';
import FarmerDashboardLayout from './layout-original';

export default function FarmerLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]" />}>
      <FarmerDashboardLayout>{children}</FarmerDashboardLayout>
    </Suspense>
  );
}
