"use client";

/**
 * Disposition Modal Component - Glassmorphic Design
 * Post-call outcome tagging and notes
 */

import { useState } from "react";
import { formatForDisplay } from "@/lib/utils/phone";

interface Contact {
  id: string;
  businessName: string;
  contactName: string | null;
}

interface DispositionModalProps {
  callId: string;
  contact: Contact | null;
  phoneNumber: string;
  duration: number;
  onClose: () => void;
}

const dispositionOptions = [
  { value: "interested", label: "Interested", color: "from-green-500 to-emerald-600", icon: "✓" },
  { value: "call_back_later", label: "Call Back Later", color: "from-blue-500 to-indigo-600", icon: "↻" },
  { value: "not_interested", label: "Not Interested", color: "from-gray-500 to-gray-600", icon: "✗" },
  { value: "voicemail", label: "Voicemail", color: "from-purple-500 to-purple-600", icon: "📧" },
  { value: "wrong_number", label: "Wrong Number", color: "from-orange-500 to-orange-600", icon: "⚠" },
  { value: "no_answer", label: "No Answer", color: "from-yellow-500 to-yellow-600", icon: "○" },
  { value: "other", label: "Other", color: "from-slate-500 to-slate-600", icon: "•" },
];

export default function DispositionModal({
  callId,
  contact,
  phoneNumber,
  duration,
  onClose,
}: DispositionModalProps) {
  const [selectedDisposition, setSelectedDisposition] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSave = async () => {
    if (!selectedDisposition) {
      setError("Please select a disposition");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("💾 Saving disposition:", { callId, outcome: selectedDisposition, hasNotes: !!notes.trim() });

      const response = await fetch("/api/dispositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          outcome: selectedDisposition,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Failed to save disposition:", data);
        throw new Error(data.error || data.details || "Failed to save disposition");
      }

      console.log("✅ Disposition saved successfully:", data);
      setSuccess("Disposition saved successfully!");

      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("❌ Error saving disposition:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save disposition. Please try again.";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card max-w-5xl w-full p-6 border-2 border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Call Disposition</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Responsive: Portrait on Mobile, Landscape on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
          {/* Left Column: Call Info & Disposition */}
          <div>
            {/* Call Summary */}
            <div className="glass-card p-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/60 mb-1">Contact</p>
                  <p className="font-semibold text-white text-sm">
                    {contact ? contact.businessName : "Unknown"}
                  </p>
                  {contact?.contactName && (
                    <p className="text-xs text-white/70">{contact.contactName}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Phone</p>
                  <p className="font-mono text-white text-sm">{formatForDisplay(phoneNumber)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Duration</p>
                  <p className="font-semibold text-white text-sm">{formatDuration(duration)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Time</p>
                  <p className="text-white text-sm">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Disposition Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                How did the call go? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {dispositionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDisposition(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedDisposition === option.value
                        ? `bg-gradient-to-r ${option.color} border-white text-white shadow-lg`
                        : "glass-card border-white/10 text-white hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Notes */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-white mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={12}
              placeholder="Add any additional notes about this call..."
              className="flex-1 px-4 py-3 glass-card text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-2 glass-card text-white font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedDisposition}
            className="flex-1 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Disposition"}
          </button>
        </div>
      </div>
    </div>
  );
}
