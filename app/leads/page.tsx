"use client";

/**
 * Leads Management Page - Redesigned with Modern UI
 * Clean, compact design with glassmorphism theme
 */

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import * as XLSX from "xlsx";

interface Lead {
  id?: string;
  place_id: string;
  business_name: string;
  phone: string;
  address: string;
  category: string;
  rating: string;
  review_count: string;
  social_only: string;
  website: string;
  business_status: string;
  leadStatus?: string;
  importedAt?: string;
}

interface Filters {
  search: string;
  socialOnly: string;
  leadStatus: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    socialOnly: "",
    leadStatus: "",
  });

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Import states
  const [importedData, setImportedData] = useState<Lead[]>([]);
  const [importing, setImporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [duplicatePhones, setDuplicatePhones] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchLeads();
  }, [page, filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data.leads);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set());
    } else {
      const currentPageIds = leads.map((lead: any) => lead.id);
      setSelectedLeads(new Set(currentPageIds));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectLead = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
    setSelectAll(newSelected.size === leads.length);
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedLeads.size} selected lead(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedLeads) }),
      });

      if (response.ok) {
        alert(`✅ Successfully deleted ${selectedLeads.size} lead(s)`);
        setSelectedLeads(new Set());
        setSelectAll(false);
        fetchLeads();
      } else {
        alert("❌ Failed to delete leads");
      }
    } catch (error) {
      console.error("Error deleting leads:", error);
      alert("❌ Failed to delete leads");
    }
  };

  const handleViewDetails = (lead: any) => {
    setSelectedLead(lead);
    setShowDetailsModal(true);
  };

  const handleEdit = (lead: any) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this lead?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Lead deleted successfully");
        fetchLeads();
      } else {
        alert("❌ Failed to delete lead");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("❌ Failed to delete lead");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  // Import functions
  const detectDuplicates = (data: Lead[]) => {
    const phoneMap = new Map<string, number>();
    const duplicates = new Set<string>();

    data.forEach((lead) => {
      if (lead.phone) {
        const phone = String(lead.phone).trim();
        if (phone) {
          const count = phoneMap.get(phone) || 0;
          phoneMap.set(phone, count + 1);
          if (count > 0) {
            duplicates.add(phone);
          }
        }
      }
    });

    return duplicates;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const leads = jsonData as Lead[];
        setImportedData(leads);

        const duplicates = detectDuplicates(leads);
        setDuplicatePhones(duplicates);

        setShowImportModal(true);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error parsing file. Please check the format.");
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleRemoveLead = (index: number) => {
    const newData = [...importedData];
    newData.splice(index, 1);
    setImportedData(newData);

    const duplicates = detectDuplicates(newData);
    setDuplicatePhones(duplicates);
  };

  const handleEditLead = (index: number, field: keyof Lead, value: string) => {
    const newData = [...importedData];
    newData[index] = { ...newData[index], [field]: value };
    setImportedData(newData);

    const duplicates = detectDuplicates(newData);
    setDuplicatePhones(duplicates);
  };

  const handleRemoveAllDuplicates = () => {
    const phonesSeen = new Set<string>();
    const uniqueLeads = importedData.filter((lead) => {
      if (!lead.phone) return true;

      const phone = String(lead.phone).trim();
      if (!phone) return true;

      if (phonesSeen.has(phone)) {
        return false;
      }

      phonesSeen.add(phone);
      return true;
    });

    setImportedData(uniqueLeads);
    setDuplicatePhones(new Set());
    setEditingIndex(null);

    const removedCount = importedData.length - uniqueLeads.length;
    alert(`✅ Removed ${removedCount} duplicate entries. Kept the first occurrence of each phone number.`);
  };

  const handleSaveLeads = async () => {
    try {
      const currentDuplicates = detectDuplicates(importedData);

      if (currentDuplicates.size > 0) {
        const duplicateList = Array.from(currentDuplicates).join(", ");
        alert(
          `❌ Cannot proceed with duplicates!\n\n` +
          `Found ${currentDuplicates.size} duplicate phone number(s):\n${duplicateList}\n\n` +
          `Please edit or remove duplicate entries before saving.`
        );
        return;
      }

      setImporting(true);

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: importedData }),
      });

      const data = await response.json();

      if (response.ok) {
        let message = `✅ Import Complete!\n\n`;
        message += `📊 Summary:\n`;
        message += `• Total in file: ${importedData.length}\n`;
        message += `• Successfully saved: ${data.saved}\n`;

        if (data.duplicates > 0) {
          message += `• Skipped (duplicates in DB): ${data.duplicates}\n\n`;

          if (data.skippedLeads && data.skippedLeads.length > 0) {
            message += `🔍 Skipped Leads (already exist in database):\n`;
            data.skippedLeads.slice(0, 10).forEach((lead: any) => {
              message += `• ${lead.businessName} - ${lead.phone}\n`;
            });

            if (data.skippedLeads.length > 10) {
              message += `... and ${data.skippedLeads.length - 10} more\n`;
            }
          }
        }

        alert(message);
        setShowImportModal(false);
        setImportedData([]);
        setDuplicatePhones(new Set());
        setEditingIndex(null);
        fetchLeads();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving leads:", error);
      alert("Failed to save leads. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/leads/export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting leads:", error);
      alert("Failed to export leads.");
    }
  };

  const downloadSample = () => {
    window.open("/sample_leads.csv", "_blank");
  };

  const handleDeleteAllLeads = async () => {
    if (total === 0) return;

    const confirmed = confirm(
      `⚠️ WARNING: This will permanently delete ALL ${total} leads from the database!\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Are you absolutely sure you want to proceed?`
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleCheck = confirm(
      `FINAL CONFIRMATION:\n\n` +
      `Delete ${total} leads permanently?\n\n` +
      `Type "DELETE" in the next prompt to confirm.`
    );

    if (!doubleCheck) return;

    const userInput = prompt(
      `Please type DELETE (in capital letters) to confirm deletion of all ${total} leads:`
    );

    if (userInput !== "DELETE") {
      alert("❌ Deletion cancelled. You must type DELETE exactly.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/leads/delete-all", {
        method: "POST",
      });

      if (response.ok) {
        alert(`✅ Successfully deleted all ${total} leads`);
        setSelectedLeads(new Set());
        setSelectAll(false);
        setPage(1);
        fetchLeads();
      } else {
        alert("❌ Failed to delete all leads");
      }
    } catch (error) {
      console.error("Error deleting all leads:", error);
      alert("❌ Failed to delete all leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Leads</h1>
            <p className="text-sm text-white/50">
              {total} total • Page {page} of {totalPages} • {selectedLeads.size} selected
            </p>
          </div>

          <div className="flex items-center gap-2">


            <button
              onClick={downloadSample}
              className="px-3 py-2 glass-card text-white text-sm hover:bg-white/10 transition-all duration-200"
              title="Download Sample CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>

            <button
              onClick={handleExport}
              disabled={total === 0}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>

            <button
              onClick={handleDeleteAllLeads}
              disabled={total === 0}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 border border-red-500/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All
            </button>


          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Search and Filters */}
        <div className="glass-card p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by business name, category, city..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Custom Social Only Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2 min-w-[150px]"
              >
                <span className="flex-1 text-left">
                  {filters.socialOnly === "true" ? "Social Only" : filters.socialOnly === "false" ? "Has Website" : "All Leads"}
                </span>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSocialDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSocialDropdown(false)} />
                  <div className="absolute top-full mt-1 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-20 overflow-hidden">
                    {[
                      { value: "", label: "All Leads" },
                      { value: "true", label: "Social Only" },
                      { value: "false", label: "Has Website" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, socialOnly: option.value });
                          setShowSocialDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${filters.socialOnly === option.value
                          ? "bg-indigo-500/30 text-white font-medium"
                          : "text-white/80 hover:bg-white/10"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

            </div>

            {/* Custom Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors flex items-center gap-2 min-w-[150px]"
              >
                <span className="flex-1 text-left">
                  {filters.leadStatus ? filters.leadStatus.charAt(0).toUpperCase() + filters.leadStatus.slice(1).replace("_", " ") : "All Status"}
                </span>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                  <div className="absolute top-full mt-1 w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl z-20 overflow-hidden">
                    {[
                      { value: "", label: "All Status" },
                      { value: "new", label: "New" },
                      { value: "contacted", label: "Contacted" },
                      { value: "interested", label: "Interested" },
                      { value: "not_interested", label: "Not Interested" },
                      { value: "callback", label: "Callback" },
                      { value: "rejected", label: "Rejected" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilters({ ...filters, leadStatus: option.value });
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${filters.leadStatus === option.value
                          ? "bg-indigo-500/30 text-white font-medium"
                          : "text-white/80 hover:bg-white/10"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedLeads.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete {selectedLeads.size}
              </button>
            )}
          </div>
        </div>



        {/* Loading State */}
        {loading && (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Loading leads...</p>
          </div>
        )}

        {/* Compact Table */}
        {!loading && (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Business Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider whitespace-nowrap">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white/80 uppercase tracking-wider">Website</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white/80 uppercase tracking-wider w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-white/40 text-sm">
                        No leads found. Import your first CSV file to get started.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-white">{lead.businessName}</div>
                          {lead.address && (
                            <div className="text-xs text-white/50 truncate max-w-xs">{lead.address}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono text-white whitespace-nowrap">{lead.phone || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/80">{lead.category || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {lead.website ? (
                              <>
                                <button
                                  onClick={() => copyToClipboard(lead.website)}
                                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                  title="Copy URL"
                                >
                                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <a
                                  href={lead.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                  title="Open website"
                                >
                                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </>
                            ) : (
                              <span className="text-sm text-white/30">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${lead.leadStatus === "new" ? "bg-blue-500/20 text-blue-400" :
                            lead.leadStatus === "interested" ? "bg-green-500/20 text-green-400" :
                              lead.leadStatus === "contacted" ? "bg-purple-500/20 text-purple-400" :
                                "bg-gray-500/20 text-gray-400"
                            }`}>
                            {lead.leadStatus || "new"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {/* Call Button */}
                            {lead.phone && (
                              <a
                                href={`/dialer?number=${encodeURIComponent(lead.phone.replace(/\D/g, ""))}`}
                                className="p-1.5 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                                title="Call this number"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </a>
                            )}

                            {/* View in Map Button */}
                            {(lead.placeId || lead.place_id) && (
                              <a
                                href={`https://www.google.com/maps/place/?q=place_id:${lead.placeId || lead.place_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                title="View on Google Maps"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </a>
                            )}

                            <button
                              onClick={() => handleViewDetails(lead)}
                              className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors"
                              title="View details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(lead)}
                              className="p-1.5 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Info Bar - Optional page info */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="text-xs text-white/50 text-center">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, total)} of {total} leads
                </div>
                {/* Pagination Controls - Moved to Top */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 glass-car ">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="First Page"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="px-3 text-sm text-white font-medium">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Last Page"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Lead Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Business Name</label>
                    <p className="text-white font-medium mt-1">{selectedLead.businessName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Phone</label>
                    <p className="text-white font-mono mt-1">{selectedLead.phone || "—"}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider">Address</label>
                  <p className="text-white/80 mt-1">{selectedLead.address || "—"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Category</label>
                    <p className="text-white mt-1">{selectedLead.category || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${selectedLead.leadStatus === "new" ? "bg-blue-500/20 text-blue-400" :
                        selectedLead.leadStatus === "interested" ? "bg-green-500/20 text-green-400" :
                          selectedLead.leadStatus === "contacted" ? "bg-purple-500/20 text-purple-400" :
                            "bg-gray-500/20 text-gray-400"
                        }`}>
                        {selectedLead.leadStatus || "new"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Rating</label>
                    <p className="text-white mt-1">{selectedLead.rating ? `⭐ ${selectedLead.rating}` : "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Reviews</label>
                    <p className="text-white mt-1">{selectedLead.reviewCount || "0"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Type</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${selectedLead.socialOnly ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"
                        }`}>
                        {selectedLead.socialOnly ? "Social" : "Website"}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedLead.website && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Website</label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={selectedLead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm truncate flex-1"
                      >
                        {selectedLead.website}
                      </a>
                      <button
                        onClick={() => copyToClipboard(selectedLead.website)}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider">Imported</label>
                  <p className="text-white/60 text-sm mt-1">
                    {selectedLead.importedAt ? new Date(selectedLead.importedAt).toLocaleString() : "—"}
                  </p>
                </div>

                {selectedLead.notes && (
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider">Notes</label>
                    <p className="text-white/80 text-sm mt-1 whitespace-pre-wrap">{selectedLead.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedLead);
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                >
                  Edit Lead
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-4 py-2 glass-card text-white hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Lead</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch(`/api/leads/${selectedLead.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(selectedLead),
                  });

                  if (response.ok) {
                    alert("✅ Lead updated successfully");
                    setShowEditModal(false);
                    fetchLeads();
                  } else {
                    alert("❌ Failed to update lead");
                  }
                } catch (error) {
                  console.error("Error updating lead:", error);
                  alert("❌ Failed to update lead");
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Business Name *</label>
                    <input
                      type="text"
                      value={selectedLead.businessName}
                      onChange={(e) => setSelectedLead({ ...selectedLead, businessName: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Phone</label>
                    <input
                      type="text"
                      value={selectedLead.phone || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Address</label>
                    <textarea
                      value={selectedLead.address || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, address: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Category</label>
                    <input
                      type="text"
                      value={selectedLead.category || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, category: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Status</label>
                    <select
                      value={selectedLead.leadStatus || "new"}
                      onChange={(e) => setSelectedLead({ ...selectedLead, leadStatus: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="not_interested">Not Interested</option>
                      <option value="callback">Callback</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Website</label>
                    <input
                      type="url"
                      value={selectedLead.website || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, website: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/80 uppercase tracking-wider mb-2 block">Notes</label>
                    <textarea
                      value={selectedLead.notes || ""}
                      onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
                      rows={3}
                      placeholder="Add any notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 glass-card text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Preview Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="glass-card max-w-[95vw] w-full p-6 border-2 border-white/20 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Import Preview - {importedData.length} Leads</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Status Messages */}
              {duplicatePhones.size > 0 ? (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-red-400 font-bold mb-1">⚠️ Duplicates Detected!</p>
                      <p className="text-red-300 text-sm mb-3">
                        Found {duplicatePhones.size} duplicate phone number(s). Duplicate rows are highlighted in red.
                      </p>
                      <button
                        onClick={handleRemoveAllDuplicates}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove All Duplicates
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No duplicates found. Ready to save {importedData.length} leads!
                  </p>
                </div>
              )}

              {/* Preview Table */}
              <div className="overflow-auto mb-4 flex-1 border border-white/10 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-white/5 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">#</th>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">Actions</th>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">Business Name</th>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">Phone</th>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">Category</th>
                      <th className="px-2 py-2 text-left text-white border-b border-white/10 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.map((lead, idx) => {
                      const isDuplicate = lead.phone && duplicatePhones.has(String(lead.phone).trim());
                      const isEditing = editingIndex === idx;

                      return (
                        <tr
                          key={idx}
                          className={`border-b border-white/5 hover:bg-white/5 ${isDuplicate ? "bg-red-500/20 border-red-500/30" : ""
                            }`}
                        >
                          <td className="px-2 py-2 text-white/60 font-mono">{idx + 1}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingIndex(isEditing ? null : idx)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title={isEditing ? "Done" : "Edit"}
                              >
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleRemoveLead(idx)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                title="Remove"
                              >
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              {isDuplicate && (
                                <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">DUP</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={lead.business_name || ""}
                                onChange={(e) => handleEditLead(idx, "business_name", e.target.value)}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                              />
                            ) : (
                              <span className="text-white">{lead.business_name || <span className="text-orange-400">Empty</span>}</span>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={lead.phone || ""}
                                onChange={(e) => handleEditLead(idx, "phone", e.target.value)}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs font-mono"
                              />
                            ) : (
                              <span className={`font-mono ${isDuplicate ? "text-red-300 font-bold" : "text-white"}`}>
                                {lead.phone || <span className="text-orange-400">Empty</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-white">{lead.category || "—"}</td>
                          <td className="px-2 py-2">
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">New</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="flex-1 px-6 py-3 glass-card text-white font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLeads}
                  disabled={importing || duplicatePhones.size > 0}
                  className={`flex-1 px-6 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 ${duplicatePhones.size > 0
                    ? "bg-gray-500 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                    }`}
                >
                  {importing ? "Saving..." : duplicatePhones.size > 0
                    ? `❌ Fix ${duplicatePhones.size} Duplicate(s) First`
                    : `✅ Save ${importedData.length} Leads`
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
