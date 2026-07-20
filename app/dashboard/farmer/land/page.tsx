"use client";

import Link from 'next/link';

export default function LandPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1f3b2c]">Land Management</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          Manage your land mapping and integration options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Land Mapping */}
        <section className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#1f3b2c] mb-2">Land Mapping</h2>
          <p className="text-sm text-[#6b7280] mb-4">
            Upload your land sketch and map it to geographic coordinates.
          </p>
          
          <Link
            href="/dashboard/farmer/land/details"
            className="inline-flex items-center justify-center rounded-md bg-[#166534] px-4 py-2 text-sm font-medium text-white hover:bg-[#14532d]"
          >
            Map Your Land
          </Link>
        </section>

        {/* Land Integration */}
        <section className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#1f3b2c] mb-2">Land Integration</h2>
          <p className="text-sm text-[#6b7280] mb-4">
            Find neighboring farmers and integrate your lands for better productivity.
          </p>
          
          <Link
            href="/dashboard/farmer/land/integrate"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Integrate Land
          </Link>
        </section>
      </div>

      {/* Information Section */}
      <section className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-[#1f3b2c] mb-2">How Land Integration Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-[#1f3b2c]">
            <div className="font-semibold mb-1">1. Map Your Land</div>
            <p className="text-xs text-[#6b7280]">Upload sketch and convert to coordinates</p>
          </div>
          <div className="text-[#1f3b2c]">
            <div className="font-semibold mb-1">2. Get Ready</div>
            <p className="text-xs text-[#6b7280]">Mark yourself as ready to integrate</p>
          </div>
          <div className="text-[#1f3b2c]">
            <div className="font-semibold mb-1">3. Find Neighbours</div>
            <p className="text-xs text-[#6b7280]">System finds nearby verified farmers</p>
          </div>
          <div className="text-[#1f3b2c]">
            <div className="font-semibold mb-1">4. Integrate</div>
            <p className="text-xs text-[#6b7280]">Send requests and sign agreements</p>
          </div>
        </div>
      </section>
    </div>
  );
}
