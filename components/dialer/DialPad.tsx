"use client";

/**
 * Dial Pad Component - Glassmorphic Design
 * Manual phone number entry with keypad
 */

import { useState, useEffect, useRef } from "react";

interface DialPadProps {
  onCall: (phoneNumber: string) => void;
  disabled?: boolean;
  initialNumber?: string;
  // Call status props
  isInCall?: boolean;
  callStatus?: "connecting" | "ringing" | "connected";
  activeNumber?: string;
  activeContact?: string; // Business name or contact name
  callDuration?: number;
  isMuted?: boolean;
  onHangup?: () => void;
  onToggleMute?: () => void;
}

export default function DialPad({
  onCall,
  disabled = false,
  initialNumber = "",
  isInCall = false,
  callStatus,
  activeNumber,
  activeContact,
  callDuration = 0,
  isMuted = false,
  onHangup,
  onToggleMute,
}: DialPadProps) {
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial number from URL or props
  useEffect(() => {
    if (initialNumber && !number) {
      setNumber(initialNumber);
    }
  }, [initialNumber]);

  // Auto-focus input and listen for keyboard
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled) return;

      // Only handle if not typing in another input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Handle numbers and symbols
      const validChars = /^[0-9*#+]$/;
      if (validChars.test(e.key)) {
        e.preventDefault();
        setNumber((prev) => prev + e.key);
        setError("");
      } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        // Show error for letters
        setError("Please enter numbers only");
        setTimeout(() => setError(""), 2000);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setNumber((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter" && number) {
        e.preventDefault();
        handleCall();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [disabled, number]);

  const handleDigit = (digit: string) => {
    if (disabled) return;
    setNumber((prev) => prev + digit);
    setError("");
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNumber("");
  };

  const handleCall = () => {
    if (!number || disabled) return;
    onCall(number);
    // Don't clear number immediately - let parent handle call state
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const digits = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ];

  return (
    <div className="glass-card p-4">
      <h2 className="text-lg font-bold text-white mb-3">Dial Pad</h2>

      {/* Active Call Status */}
      {isInCall && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 rounded-lg">
          {/* Call Status Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {callStatus === "connecting" && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 text-sm font-medium">Connecting...</span>
                </>
              )}
              {callStatus === "ringing" && (
                <>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 text-sm font-medium">Ringing...</span>
                </>
              )}
              {callStatus === "connected" && (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-sm font-medium">Connected</span>
                </>
              )}
            </div>
            {callStatus === "connected" && (
              <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
            )}
          </div>

          {/* Contact Info */}
          <div className="mb-3">
            {activeContact && (
              <p className="text-white font-semibold text-lg mb-1">{activeContact}</p>
            )}
            <p className="text-white/80 font-mono text-sm">{activeNumber}</p>
          </div>

          {/* Call Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onToggleMute}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                isMuted
                  ? "bg-red-500/30 text-red-300 border border-red-500/50"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isMuted ? (
                <>
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  <span className="text-xs mt-1 block">Muted</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span className="text-xs mt-1 block">Mute</span>
                </>
              )}
            </button>
            <button
              onClick={onHangup}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
              <span className="text-xs mt-1 block">Hang Up</span>
            </button>
          </div>
        </div>
      )}

      {/* Number Display */}
      <div className="mb-4">
        <div className={`bg-transparent border-0 border-b-2 pb-2 min-h-[50px] flex items-center justify-between ${
          error ? 'border-red-500/50' : 'border-gray-400/30'
        }`}>
          <input
            ref={inputRef}
            type="tel"
            value={number}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow numbers and phone symbols
              if (/^[0-9*#+]*$/.test(value)) {
                setNumber(value);
                setError("");
              } else {
                setError("Please enter numbers only");
                setTimeout(() => setError(""), 2000);
              }
            }}
            disabled={disabled}
            className="bg-transparent text-center text-white text-5xl font-mono w-full outline-none border-0 focus:outline-none focus:ring-0 focus:border-0 placeholder:text-white/40"
            style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
          />
          {number && (
            <button
              onClick={handleBackspace}
              disabled={disabled}
              className="ml-2 p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-1 animate-fade-in">{error}</p>
        )}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 place-items-center gap-2 mb-3">
        {digits.map((row, rowIdx) =>
          row.map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={disabled}
              className="glass-card h-16 w-16 !rounded-full p-1 text-3xl font-semibold text-white hover:bg-white/20 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-2">
        {/* <button
          onClick={handleClear}
          disabled={!number || disabled}
          className="px-4 py-2 glass-card text-white font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button> */}
        <button
          onClick={handleCall}
          disabled={!number || disabled}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full aspect-square hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-xs text-white/50 mb-1">Quick prefix:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setNumber("+1")}
            disabled={disabled}
            className="px-3 py-1 text-xs glass-card text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            +1 (US)
          </button>
          <button
            onClick={() => setNumber("+61")}
            disabled={disabled}
            className="px-3 py-1 text-xs glass-card text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            +61 (AU)
          </button>
        </div>
      </div>
    </div>
  );
}
