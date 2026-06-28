"use client";

/**
 * Module 9: Call History & Analytics - Complete Implementation
 * Dual-source: Twilio API + Local Database with Dispositions
 * Glassmorphic design with tabs, pagination, filtering, and CSV export
 */

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

type TabType = "twilio" | "local";

interface TwilioCall {
  id: string;
  sid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration: string | null;
  price: string | null;
  priceUnit: string | null;
  startTime: string | null;
  endTime: string | null;
  answeredBy: string | null;
  dateCreated: string;
}

interface LocalCall {
  id: string;
  toNumber: string;
  status: string;
  durationSeconds: number | null;
  createdAt: string;
  contact?: {
    businessName: string;
    contactName: string | null;
  };
  disposition?: {
    outcome: string;
    notes: string | null;
    createdAt: string;
  };
  fromNumber?: {
    e164Number: string;
  };
}

interface Filters {
  search: string;
  status: string;
  disposition: string;
  dateFrom: string;
  dateTo: string;
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("twilio");
  const [twilioCalls, setTwilioCalls] = useState<TwilioCall[]>([]);
  const [localCalls, setLocalCalls] = useState<LocalCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [twilioPage, setTwilioPage] = useState(1);
  const [localPage, setLocalPage] = useState(1);
  const [twilioHasMore, setTwilioHasMore] = useState(false);
  const [localTotalPages, setLocalTotalPages] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    disposition: "",
    dateFrom: "",
    dateTo: "",
  });

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    if (activeTab === "twilio") {
      fetchTwilioCalls();
    } else {
      fetchLocalCalls();
    }
  }, [activeTab, twilioPage, localPage, filters]);

  const fetchTwilioCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", twilioPage.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());

      if (filters.status) params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      console.log(`📞 Fetching Twilio calls (page ${twilioPage})...`);

      const response = await fetch(`/api/calls/twilio?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTwilioCalls(data.calls);
        setTwilioHasMore(data.pagination.hasMore);
        console.log(`✅ Loaded ${data.calls.length} Twilio calls`);
      } else {
        console.error("❌ Failed to fetch Twilio calls:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching Twilio calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalCalls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", localPage.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());

      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.disposition) params.set("disposition", filters.disposition);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      console.log(`💾 Fetching local calls (page ${localPage})...`);

      const response = await fetch(`/api/calls/local?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLocalCalls(data.calls);
        setLocalTotalPages(data.pagination.totalPages);
        console.log(`✅ Loaded ${data.calls.length} local calls`);
      } else {
        console.error("❌ Failed to fetch local calls:", data.error);
      }
    } catch (error) {
      console.error("❌ Error fetching local calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | string | null) => {
    if (!seconds) return "N/A";
    const secs = typeof seconds === "string" ? parseInt(seconds) : seconds;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleExportCSV = () => {
    const calls = activeTab === "twilio" ? twilioCalls : localCalls;

    if (activeTab === "twilio") {
      const headers = ["Date", "From", "To", "Status", "Direction", "Duration", "Price"];
      const rows = twilioCalls.map((call) => [
        formatDate(call.dateCreated),
        call.from,
        call.to,
        call.status,
        call.direction,
        formatDuration(call.duration),
        call.price ? `${call.price} ${call.priceUnit}` : "N/A",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      downloadCSV(csvContent, "twilio-call-history");
    } else {
      const headers = ["Date", "Contact", "Phone", "Status", "Duration", "Disposition", "Notes"];
      const rows = localCalls.map((call) => [
        formatDate(call.createdAt),
        call.contact?.businessName || "Unknown",
        call.toNumber,
        call.status,
        formatDuration(call.durationSeconds),
        call.disposition?.outcome || "N/A",
        call.disposition?.notes || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      downloadCSV(csvContent, "local-call-history");
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
              <p className="text-white/60">View calls from Twilio API and local database</p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={loading || (activeTab === "twilio" ? twilioCalls.length === 0 : localCalls.length === 0)}
              className="px-4 py-2 glass-card text-white font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("twilio")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === "twilio"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                : "glass-card text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Twilio History
            </div>
          </button>
          <button
            onClick={() => setActiveTab("local")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === "local"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                : "glass-card text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Local & Dispositions
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {activeTab === "local" && (
              <input
                type="text"
                placeholder="Search contact or phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
              />
            )}

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="busy">Busy</option>
              <option value="no-answer">No Answer</option>
              <option value="failed">Failed</option>
            </select>

            {activeTab === "local" && (
              <select
                value={filters.disposition}
                onChange={(e) => setFilters({ ...filters, disposition: e.target.value })}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Dispositions</option>
                <option value="interested">Interested</option>
                <option value="call_back_later">Call Back Later</option>
                <option value="not_interested">Not Interested</option>
                <option value="voicemail">Voicemail</option>
                <option value="wrong_number">Wrong Number</option>
                <option value="no_answer">No Answer</option>
              </select>
            )}

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/60">Loading call history...</p>
          </div>
        )}

        {/* Twilio Table */}
        {!loading && activeTab === "twilio" && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Date/Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">From</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">To</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Direction</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {twilioCalls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                        No calls found
                      </td>
                    </tr>
                  ) : (
                    twilioCalls.map((call) => (
                      <tr key={call.sid} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white">{formatDate(call.dateCreated)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{call.from}</td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{call.to}</td>
                        <td className="px-4 py-3 text-sm text-white capitalize">{call.direction}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            call.status === "completed" ? "bg-green-500/20 text-green-400" :
                            call.status === "busy" ? "bg-yellow-500/20 text-yellow-400" :
                            call.status === "no-answer" ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{formatDuration(call.duration)}</td>
                        <td className="px-4 py-3 text-sm text-white">
                          {call.price ? `${call.price} ${call.priceUnit}` : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Twilio Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <div className="text-sm text-white/60">
                Page {twilioPage} • {twilioCalls.length} calls
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTwilioPage(p => Math.max(1, p - 1))}
                  disabled={twilioPage === 1}
                  className="px-4 py-2 glass-card text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setTwilioPage(p => p + 1)}
                  disabled={!twilioHasMore}
                  className="px-4 py-2 glass-card text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local Table */}
        {!loading && activeTab === "local" && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Date/Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Disposition</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {localCalls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                        No calls found
                      </td>
                    </tr>
                  ) : (
                    localCalls.map((call) => (
                      <tr key={call.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white">{formatDate(call.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-white">
                          {call.contact?.businessName || "Unknown"}
                          {call.contact?.contactName && (
                            <div className="text-xs text-white/50">{call.contact.contactName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-white">{call.toNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            call.status === "completed" ? "bg-green-500/20 text-green-400" :
                            call.status === "busy" ? "bg-yellow-500/20 text-yellow-400" :
                            call.status === "no-answer" ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white">{formatDuration(call.durationSeconds)}</td>
                        <td className="px-4 py-3">
                          {call.disposition ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              call.disposition.outcome === "interested" ? "bg-green-500/20 text-green-400" :
                              call.disposition.outcome === "call_back_later" ? "bg-blue-500/20 text-blue-400" :
                              call.disposition.outcome === "not_interested" ? "bg-gray-500/20 text-gray-400" :
                              "bg-purple-500/20 text-purple-400"
                            }`}>
                              {call.disposition.outcome.replace("_", " ")}
                            </span>
                          ) : (
                            <span className="text-xs text-white/40">No disposition</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-white/70 max-w-xs truncate">
                          {call.disposition?.notes || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Local Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <div className="text-sm text-white/60">
                Page {localPage} of {localTotalPages} • {localCalls.length} calls
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalPage(p => Math.max(1, p - 1))}
                  disabled={localPage === 1}
                  className="px-4 py-2 glass-card text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setLocalPage(p => p + 1)}
                  disabled={localPage >= localTotalPages}
                  className="px-4 py-2 glass-card text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
