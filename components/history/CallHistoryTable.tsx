"use client";

/**
 * Call History Table Component - Glassmorphic Design
 * Detailed call log with expandable rows
 */

import { useState } from "react";
import { formatForDisplay } from "@/lib/utils/phone";

interface Call {
  id: string;
  toNumber: string;
  status: string;
  startedAt: string;
  durationSeconds: number | null;
  recordingStorageProvider: string | null;
  recordingStorageKey: string | null;
  contact?: {
    businessName: string;
    contactName: string | null;
  };
  disposition?: {
    outcome: string;
    notes: string | null;
  };
}

interface CallHistoryTableProps {
  calls: Call[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CallHistoryTable({ calls, loading, onRefresh }: CallHistoryTableProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      "no-answer": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      busy: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
      canceled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getDispositionColor = (outcome: string) => {
    const colors: Record<string, string> = {
      interested: "text-green-400",
      call_back_later: "text-blue-400",
      not_interested: "text-gray-400",
      voicemail: "text-purple-400",
      wrong_number: "text-orange-400",
      no_answer: "text-yellow-400",
    };
    return colors[outcome] || "text-white/60";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDisposition = (outcome: string) => {
    return outcome
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handlePlayRecording = async (callId: string) => {
    if (playingRecording === callId) {
      setPlayingRecording(null);
      return;
    }
    // TODO: Fetch recording URL and play
    setPlayingRecording(callId);
  };

  if (loading) {
    return (
      <div className="glass-card p-12">
        <div className="flex items-center justify-center">
          <svg className="w-8 h-8 text-white/60 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="ml-3 text-white/60">Loading call history...</span>
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-white/60 mb-4">No calls found</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                Disposition
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {calls.map((call) => (
              <>
                <tr
                  key={call.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                >
                  <td className="px-6 py-4 text-sm text-white">
                    <div>{new Date(call.startedAt).toLocaleDateString()}</div>
                    <div className="text-white/60 text-xs">
                      {new Date(call.startedAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    <div className="font-medium">
                      {call.contact?.businessName || "Unknown"}
                    </div>
                    {call.contact?.contactName && (
                      <div className="text-white/60 text-xs">{call.contact.contactName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-white">
                    {formatForDisplay(call.toNumber)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-white">
                    {formatDuration(call.durationSeconds)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {call.disposition ? (
                      <span className={`font-medium ${getDispositionColor(call.disposition.outcome)}`}>
                        {formatDisposition(call.disposition.outcome)}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {call.recordingStorageKey && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayRecording(call.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Play recording"
                        >
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row */}
                {expandedCall === call.id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-white/5">
                      <div className="space-y-3">
                        {call.disposition?.notes && (
                          <div>
                            <p className="text-xs text-white/60 mb-1">Notes:</p>
                            <p className="text-sm text-white">{call.disposition.notes}</p>
                          </div>
                        )}
                        {playingRecording === call.id && (
                          <div className="glass-card p-4">
                            <p className="text-xs text-white/60 mb-2">Recording:</p>
                            <audio controls className="w-full">
                              <source src="#" type="audio/mpeg" />
                            </audio>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
