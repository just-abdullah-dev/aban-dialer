"use client";

/**
 * ManualCallDispositionModal - Post-call disposition for manual dial pad calls
 * Saves the call to leads with basic information
 */

import { useState } from "react";

interface ManualCallDispositionModalProps {
  phoneNumber: string;
  duration: number;
  onClose: () => void;
  onSave: (businessName: string, status: string, notes: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "interested", label: "Interested", color: "bg-green-500" },
  { value: "not_interested", label: "Not Interested", color: "bg-gray-500" },
  { value: "callback", label: "Callback", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
];

export default function ManualCallDispositionModal({
  phoneNumber,
  duration,
  onClose,
  onSave,
}: ManualCallDispositionModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("contacted");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      alert("Please enter a business name");
      return;
    }

    try {
      setSaving(true);
      await onSave(businessName.trim(), selectedStatus, notes);
    } catch (error) {
      console.error("Error saving lead:", error);
      alert("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (confirm("Skip saving this call to leads?")) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-card max-w-2xl w-full p-6 border-2 border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Save Call to Leads</h2>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={saving}
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Call Info */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 mb-1">Phone Number</p>
              <p className="text-lg font-mono text-white">{phoneNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/60 mb-1">Duration</p>
              <p className="text-lg font-semibold text-green-400">{formatDuration(duration)}</p>
            </div>
          </div>
        </div>

        {/* Business Name */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
            Business Name *
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter business or contact name"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500"
            disabled={saving}
            autoFocus
          />
        </div>

        {/* Status Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
            Call Outcome
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedStatus === option.value
                    ? `${option.color} text-white shadow-lg scale-105`
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                }`}
                disabled={saving}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 resize-none"
            rows={4}
            placeholder="Add notes about this call..."
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={saving}
            className="px-4 py-3 rounded-lg font-medium transition-all duration-200 bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !businessName.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save to Leads"}
          </button>
        </div>
      </div>
    </div>
  );
}
