"use client";

import { Suspense } from 'react';
import Header from './Header';

export default function HeaderWrapper() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#1f3b2c]" />}>
      <Header />
    </Suspense>
  );
}
