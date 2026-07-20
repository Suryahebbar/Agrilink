"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { withSupplierAuth } from "@/lib/supplier-auth";

interface InventoryLog {
  _id: string;
  productId?: {
    _id: string;
    name: string;
    sku: string;
  };
  product?: {
    name: string;
    sku: string;
  };
  change: number;
  reason: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");

  useEffect(() => {
    void loadLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadLogs = async (targetPage: number) => {
    try {
      setLoading(true);
      setError("");

      // Get supplierId if not already set
      let currentSupplierId = supplierId;
      if (!currentSupplierId) {
        const profileResponse = await fetch('/api/supplier', withSupplierAuth());
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          currentSupplierId = profileData.seller?._id || 'temp';
          setSupplierId(currentSupplierId);
        } else {
          throw new Error('Failed to get supplier profile');
        }
      }

      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/supplier/${currentSupplierId}/inventory/logs?${params.toString()}`, withSupplierAuth());
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to load inventory logs");
      }

      setLogs((data as { logs?: InventoryLog[] }).logs || []);
      setPagination((data as { pagination?: Pagination }).pagination || null);
    } catch (err) {
      console.error("Error loading inventory logs:", err);
      setError((err as Error).message || "Failed to load inventory logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const productName = log.product?.name || log.productId?.name || "";
    const sku = log.product?.sku || log.productId?.sku || "";
    const reason = log.reason || "";
    return (
      productName.toLowerCase().includes(term) ||
      sku.toLowerCase().includes(term) ||
      reason.toLowerCase().includes(term)
    );
  });

  const handlePrevPage = () => {
    if (!pagination) return;
    if (pagination.page > 1) setPage(pagination.page - 1);
  };

  const handleNextPage = () => {
    if (!pagination) return;
    if (pagination.page < pagination.pages) setPage(pagination.page + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--navy-blue)]">Inventory Activity Logs</h1>
          <p className="text-sm text-[var(--gray-600)] mt-1">
            View a detailed history of all stock changes for your products
          </p>
        </div>
        <Link
          href="/dashboard/supplier/inventory"
          className="btn-secondary btn-md"
        >
          Back to Inventory
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--error-red-light)] border border-[var(--error-red-border)] rounded-lg p-4">
          <p className="text-[var(--error-red)]">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-[var(--gray-300)] rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by product name, SKU, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-md w-full text-[var(--navy-blue)] border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-teal)]"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#e2d4b7] rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-[#6b7280]">Loading inventory logs...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#6b7280]">No inventory activity found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2d4b7]">
              <thead className="bg-[#f9fafb]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Stock Before / After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e2d4b7]">
                {filteredLogs.map((log) => {
                  const productName = log.product?.name || log.productId?.name || "Unknown product";
                  const sku = log.product?.sku || log.productId?.sku || "";
                  const changeClass =
                    log.change > 0
                      ? "text-green-600"
                      : log.change < 0
                      ? "text-red-600"
                      : "text-[#6b7280]";

                  return (
                    <tr key={log._id} className="hover:bg-[#f9fafb]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[var(--navy-blue)]">{productName}</div>
                          {sku && (
                            <div className="text-xs text-[var(--navy-blue)]">{sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${changeClass}`}>
                          {log.change > 0 ? `+${log.change}` : log.change}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--navy-blue)]">
                        {log.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--navy-blue)]">
                        {log.previousStock} → {log.newStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--navy-blue)] max-w-xs truncate">
                        {log.notes || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--navy-blue)]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#6b7280]">
          <div>
            Page {pagination.page} of {pagination.pages} · {pagination.total} logs
          </div>
          <div className="space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.page <= 1}
              className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={pagination.page >= pagination.pages}
              className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
