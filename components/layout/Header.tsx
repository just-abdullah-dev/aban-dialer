"use client";

/**
 * Glassmorphic Header Component
 * Beautiful glass-effect header with backdrop blur
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  dialerReady?: boolean;
  dialerError?: string | null;
  onReconnect?: () => void;
}

export default function Header({ onToggleSidebar, showSidebarToggle = false, dialerReady, dialerError, onReconnect }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo (Desktop with Sidebar Toggle / Mobile Simple) */}
        <div className="flex items-center gap-4">
          {/* Desktop: Show sidebar toggle 
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="hidden lg:block p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )} */}

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dialer")}>
            {/* Icon - always show */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            {/* Text - hide on mobile */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-bold text-white">Aban Dialer</h1>
              <p className="text-xs text-white/60">Cold Calling System</p>
            </div>
          </div>
        </div>

        {/* Right: Connection Status + User Menu */}
        <div className="flex items-center gap-3">
          {/* Connection Status Button (only show if dialer props are provided) */}
          {(dialerReady !== undefined || dialerError !== undefined) && (
            <button
              onClick={onReconnect}
              disabled={dialerReady && !dialerError}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border transition-all duration-200"
              style={{
                borderColor: dialerReady && !dialerError
                  ? "rgba(34, 197, 94, 0.3)"
                  : dialerError
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(59, 130, 246, 0.3)",
                cursor: dialerReady && !dialerError ? "default" : "pointer",
              }}
              title={dialerError || (dialerReady ? "Connected" : "Connecting...")}
            >
              {/* Status Dot */}
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    dialerReady && !dialerError
                      ? "bg-green-500"
                      : dialerError
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                />
                {dialerReady && !dialerError && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
              </div>

              {/* Status Text */}
              <span className={`text-sm font-medium hidden sm:inline ${
                dialerReady && !dialerError
                  ? "text-green-400"
                  : dialerError
                  ? "text-red-400"
                  : "text-blue-400"
              }`}>
                {dialerReady && !dialerError ? "Connected" : dialerError ? "Refresh" : "Connecting"}
              </span>

              {/* Refresh Icon (only show if error or connecting) */}
              {(dialerError || (!dialerReady && !dialerError)) && (
                <svg
                  className={`w-4 h-4 ${!dialerReady && !dialerError ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          )}

          {/* User Menu */}
          <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 lg:gap-3 px-2 lg:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
          >
            {/* Avatar - Always show */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            {/* Name & Role - Desktop only */}
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-white">Abdullah</p>
              <p className="text-xs text-white/60">Admin</p>
            </div>
            {/* Dropdown arrow - Desktop only */}
            <svg className={`hidden lg:block w-4 h-4 text-white/60 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white">admin@abandialer.com</p>
                  <p className="text-xs text-white/60 mt-0.5">Operator Account</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/settings");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-white">Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-left mt-1"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm text-red-400">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
