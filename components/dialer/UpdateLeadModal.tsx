"use client";

/**
 * UpdateLeadModal - Post-call lead update interface
 * Replaces disposition modal for lead calls
 */

import { useState } from "react";

interface UpdateLeadModalProps {
  leadId: string;
  businessName: string;
  phone: string;
  currentStatus: string;
  currentNotes?: string | null;
  onClose: () => void;
  onUpdate: (status: string, notes: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: "contacted", label: "Contacted", color: "bg-blue-500" },
  { value: "interested", label: "Interested", color: "bg-green-500" },
  { value: "not_interested", label: "Not Interested", color: "bg-gray-500" },
  { value: "callback", label: "Callback", color: "bg-yellow-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-500" },
];

export default function UpdateLeadModal({
  leadId,
  businessName,
  phone,
  currentStatus,
  currentNotes,
  onClose,
  onUpdate,
  onDelete,
}: UpdateLeadModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes || "");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(selectedStatus, notes);
    } catch (error) {
      console.error("Error updating lead:", error);
      alert("Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setSaving(true);
      await onDelete();
    } catch (error) {
      console.error("Error deleting lead:", error);
      alert("Failed to delete lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="glass-card max-w-2xl w-full p-6 border-2 border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Update Lead</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={saving}
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lead Info */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-lg font-semibold text-white mb-1">{businessName}</p>
          <p className="text-sm text-white/60 font-mono">{phone}</p>
        </div>

        {/* Status Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
            Update Status
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
            onClick={handleDelete}
            disabled={saving}
            className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              showDeleteConfirm
                ? "bg-red-600 text-white flex-1"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            }`}
          >
            {showDeleteConfirm ? "⚠️ Confirm Delete?" : "Delete Lead"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Next Lead"}
          </button>
        </div>

        {showDeleteConfirm && (
          <p className="text-center text-xs text-yellow-400 mt-3">
            Click "Confirm Delete?" again to permanently delete this lead
          </p>
        )}
      </div>
    </div>
  );
}
