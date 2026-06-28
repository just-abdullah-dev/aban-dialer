"use client";

/**
 * Active Call Dialog Component - Compact Landscape Design
 * Centered modal with horizontal layout for desktop
 */

import { formatForDisplay } from "@/lib/utils/phone";

interface Contact {
  id: string;
  businessName: string;
  contactName: string | null;
}

interface ActiveCallBarProps {
  status: "connecting" | "ringing" | "connected";
  phoneNumber: string;
  contact: Contact | null;
  duration: number;
  isMuted: boolean;
  onHangup: () => void;
  onToggleMute: () => void;
}

export default function ActiveCallBar({
  status,
  phoneNumber,
  contact,
  duration,
  isMuted,
  onHangup,
  onToggleMute,
}: ActiveCallBarProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const statusConfig = {
    connecting: {
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
      label: "Calling...",
      icon: (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    ringing: {
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      label: "Ringing...",
      icon: (
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    connected: {
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      label: "Connected",
      icon: (
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
      ),
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Responsive: Portrait on Mobile, Landscape on Desktop */}
      <div className="glass-card max-w-4xl w-full p-4 md:p-6 border-2 border-white/20 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Mobile: Portrait Layout */}
          <div className="md:hidden w-full space-y-4">
            {/* Phone Icon - Centered */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>

            {/* Contact Info - Centered */}
            <div className="text-center">
              {contact ? (
                <>
                  <h2 className="text-xl font-bold text-white">{contact.businessName}</h2>
                  {contact.contactName && (
                    <p className="text-sm text-white/70">{contact.contactName}</p>
                  )}
                  <p className="text-sm font-mono text-white/80">{formatForDisplay(phoneNumber)}</p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">Outbound Call</h2>
                  <p className="text-sm font-mono text-white/80">{formatForDisplay(phoneNumber)}</p>
                </>
              )}
            </div>

            {/* Status Badge - Centered */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${currentStatus.bgColor}`}>
                {currentStatus.icon}
                <span className={`text-sm font-semibold ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
                {status === "connected" && (
                  <span className="text-lg font-mono font-bold text-white ml-2">
                    {formatDuration(duration)}
                  </span>
                )}
              </div>
            </div>

            {/* Control Buttons - Centered Mute Button Only */}
            <div className="flex justify-center">
              {/* Mute Button */}
              <button
                onClick={onToggleMute}
                disabled={status !== "connected"}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl transition-all duration-200 min-w-[100px] ${
                  isMuted
                    ? "bg-red-500/30 text-red-400 border-2 border-red-400"
                    : "glass-card text-white hover:bg-white/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    // Microphone OFF with slash
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </>
                  ) : (
                    // Microphone ON
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
                <span className="text-sm font-medium">{isMuted ? "Unmute" : "Mute"}</span>
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={onHangup}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
              End Call
            </button>
          </div>

          {/* Desktop: Landscape Layout */}
          <div className="hidden md:flex items-center gap-6 w-full">
            {/* Left Side: Contact Info & Status */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Phone Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50 flex-shrink-0">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>

              {/* Contact Details */}
              <div className="flex-1 min-w-0">
                {contact ? (
                  <>
                    <h2 className="text-lg font-bold text-white truncate">{contact.businessName}</h2>
                    {contact.contactName && (
                      <p className="text-sm text-white/70">{contact.contactName}</p>
                    )}
                    <p className="text-sm font-mono text-white/80">{formatForDisplay(phoneNumber)}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-white">Outbound Call</h2>
                    <p className="text-sm font-mono text-white/80">{formatForDisplay(phoneNumber)}</p>
                  </>
                )}

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg ${currentStatus.bgColor}`}>
                  {currentStatus.icon}
                  <span className={`text-sm font-semibold ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                  {status === "connected" && (
                    <span className="text-sm font-mono font-bold text-white ml-2">
                      {formatDuration(duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

              {/* Right Side: Control Buttons */}
              <div className="flex items-center gap-3">
                {/* Mute Button */}
                <button
                  onClick={onToggleMute}
                  disabled={status !== "connected"}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 ${
                    isMuted
                      ? "bg-red-500/30 text-red-400 border-2 border-red-400"
                      : "glass-card text-white hover:bg-white/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      // Microphone OFF with slash
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                      </>
                    ) : (
                      // Microphone ON
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                  <span className="text-xs font-medium">{isMuted ? "Unmute" : "Mute"}</span>
                </button>

                {/* End Call Button */}
                <button
                  onClick={onHangup}
                  className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/50 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  End Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
}
