"use client";

/**
 * LeadsQueue - One-by-one lead calling interface for dialer
 */

import { useState, useEffect } from "react";

interface Lead {
  id: string;
  placeId: string | null;
  businessName: string;
  phone: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
  reviewCount: number | null;
  socialOnly: boolean;
  website: string | null;
  leadStatus: string;
  notes: string | null;
  lastContactedAt: string | null;
}

interface Category {
  name: string;
  count: number;
}

interface LeadsQueueProps {
  onCall: (phoneNumber: string, leadId: string, businessName: string) => void;
  disabled: boolean;
  onLeadUpdate?: () => void;
}

const COUNTRY_CODES = [
  { code: "+61", flag: "🇦🇺", name: "Australia", default: true },
  { code: "+1", flag: "🇺🇸", name: "United States" },
];

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "callback", label: "Callback" },
  { value: "rejected", label: "Rejected" },
];

export default function LeadsQueue({ onCall, disabled, onLeadUpdate }: LeadsQueueProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countryCode, setCountryCode] = useState("+61");
  const [customCode, setCustomCode] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showLoopMessage, setShowLoopMessage] = useState(false);

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Load country code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dialerCountryCode");
    if (saved) {
      setCountryCode(saved);
    }
  }, []);

  // Save country code to localStorage
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    localStorage.setItem("dialerCountryCode", code);
    setShowCustomInput(code === "custom");
  };

  // Fetch leads data only when filters change
  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedStatus) params.set("leadStatus", selectedStatus);

      const response = await fetch(`/api/leads/queue?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads);
        setCategories(data.categories);
        setTotal(data.total);

        // Reset to first lead when filters change
        setCurrentIndex(0);
        setShowLoopMessage(false);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentLead = leads[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowLoopMessage(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < leads.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowLoopMessage(false);
    } else {
      // Loop back to first
      setCurrentIndex(0);
      setShowLoopMessage(true);
      setTimeout(() => setShowLoopMessage(false), 3000);
    }
  };

  const handleCall = () => {
    if (!currentLead || !currentLead.phone) {
      alert("This lead has no phone number");
      return;
    }

    const finalCode = countryCode === "custom" ? customCode : countryCode;
    if (!finalCode) {
      alert("Please select a country code");
      return;
    }

    // Format phone number with country code
    let phoneNumber = currentLead.phone.trim();

    // Remove any existing + or leading zeros
    phoneNumber = phoneNumber.replace(/^\+/, "").replace(/^0+/, "");

    // Add selected country code
    const formattedNumber = `${finalCode}${phoneNumber}`;

    onCall(formattedNumber, currentLead.id, currentLead.businessName);
  };

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Get selected category display name
  const selectedCategoryName = selectedCategory
    ? categories.find(c => c.name === selectedCategory)?.name || selectedCategory
    : "All Categories";

  const selectedCategoryCount = selectedCategory
    ? categories.find(c => c.name === selectedCategory)?.count || 0
    : total;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Leads Queue</h2>
          <p className="text-sm text-white/50">
            {leads.length} leads • Total: {total}
          </p>
        </div>

        {/* Country Code Selector */}
        <div className="flex items-center gap-2">
          {COUNTRY_CODES.map((country) => (
            <button
              key={country.code}
              onClick={() => handleCountryChange(country.code)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                countryCode === country.code
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
              title={country.name}
            >
              {country.flag} {country.code}
            </button>
          ))}
          <button
            onClick={() => handleCountryChange("custom")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              countryCode === "custom"
                ? "bg-indigo-500 text-white shadow-lg"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            Custom
          </button>
          {showCustomInput && (
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="+XX"
              className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          )}
        </div>
        {/* Category Filter Dropdown */}
      <div className=" relative">
        {/* <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Filter by Category</label> */}
        <button
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="font-medium">{selectedCategoryName}</span>
            <span className="text-white/40">({selectedCategoryCount})</span>
          </span>
          <svg className={`w-5 h-5 text-white/60 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showCategoryDropdown && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />

            {/* Dropdown */}
            <div className="absolute top-full mt-2 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-20 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-64 overflow-y-auto">
                {/* All Categories Option */}
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setShowCategoryDropdown(false);
                    setCategorySearch("");
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                    selectedCategory === ""
                      ? "bg-indigo-500/30 text-white font-medium"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>All Categories</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === ""
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-white/60"
                  }`}>
                    {total}
                  </span>
                </button>

                {/* Filtered Categories */}
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setShowCategoryDropdown(false);
                        setCategorySearch("");
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                        selectedCategory === cat.name
                          ? "bg-indigo-500/30 text-white font-medium"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedCategory === cat.name
                          ? "bg-white/20 text-white"
                          : "bg-white/10 text-white/60"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-white/40 text-sm">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      

      {/* Status Filter */}
      <div className="mb-6">
        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Filter by Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === status.value
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loop Message */}
      {showLoopMessage && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            You've reached the last lead. Starting from the beginning.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Loading leads...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-white/60 text-sm">No leads found with the selected filters</p>
        </div>
      )}

      {/* Lead Card */}
      {!loading && currentLead && (
        <>
          <div className="bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 rounded-xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{currentLead.businessName}</h3>
                {currentLead.category && (
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-full">
                    {currentLead.category}
                  </span>
                )}
              </div>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                currentLead.leadStatus === "new" ? "bg-blue-500/20 text-blue-400" :
                currentLead.leadStatus === "interested" ? "bg-green-500/20 text-green-400" :
                currentLead.leadStatus === "contacted" ? "bg-purple-500/20 text-purple-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {currentLead.leadStatus.charAt(0).toUpperCase() + currentLead.leadStatus.slice(1).replace("_", " ")}
              </span>
            </div>

            <div className="space-y-3">
              {currentLead.phone ? (
                <div className="flex items-center gap-3 text-white">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-mono text-lg">{currentLead.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-orange-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm">No phone number available</span>
                </div>
              )}

              {currentLead.address && (
                <div className="flex items-start gap-3 text-white/80">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{currentLead.address}</span>
                </div>
              )}

              {currentLead.website && (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <a
                    href={currentLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-400 hover:text-indigo-300 truncate"
                  >
                    {currentLead.website}
                  </a>
                </div>
              )}

              {currentLead.rating && (
                <div className="flex items-center gap-3 text-white/80">
                  <span className="text-yellow-400">⭐ {currentLead.rating}</span>
                  {currentLead.reviewCount && (
                    <span className="text-sm text-white/50">({currentLead.reviewCount} reviews)</span>
                  )}
                </div>
              )}

              {currentLead.notes && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{currentLead.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {currentLead.placeId && (
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${currentLead.placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View Map
                </a>
              )}
              <button
                onClick={handleCall}
                disabled={disabled || !currentLead.phone}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {disabled ? "Call in Progress..." : "Call Now"}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <span className="text-white/60 text-sm">
              Lead {currentIndex + 1} of {leads.length}
            </span>

            <button
              onClick={handleNext}
              disabled={leads.length === 0}
              className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
