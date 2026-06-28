"use client";

/**
 * Call History Filters Component - Glassmorphic Design
 * Search and filter controls
 */

interface Filters {
  search: string;
  status: string;
  disposition: string;
  country: string;
  dateFrom: string;
  dateTo: string;
}

interface CallHistoryFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function CallHistoryFilters({ filters, onFiltersChange }: CallHistoryFiltersProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      search: "",
      status: "",
      disposition: "",
      country: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm text-white/70 mb-2">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="Search by contact name, phone, or notes..."
            className="w-full px-4 py-2 glass-card text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="no-answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Disposition */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Disposition</label>
          <select
            value={filters.disposition}
            onChange={(e) => handleChange("disposition", e.target.value)}
            className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">All Dispositions</option>
            <option value="interested">Interested</option>
            <option value="call_back_later">Call Back Later</option>
            <option value="not_interested">Not Interested</option>
            <option value="voicemail">Voicemail</option>
            <option value="wrong_number">Wrong Number</option>
            <option value="no_answer">No Answer</option>
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Country</label>
          <select
            value={filters.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
          >
            <option value="">All Countries</option>
            <option value="US">United States</option>
            <option value="AU">Australia</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm text-white/70 mb-2">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange("dateFrom", e.target.value)}
            className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm text-white/70 mb-2">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange("dateTo", e.target.value)}
            className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
