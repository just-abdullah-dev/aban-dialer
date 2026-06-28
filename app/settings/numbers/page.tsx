"use client";

/**
 * Connected Numbers Management Page
 * View and manage connected phone numbers
 */

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  country: string;
  provider: string;
  isActive: boolean;
  capabilities: string[];
  createdAt: string;
}

export default function ConnectedNumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/phone-numbers");
      const data = await response.json();

      if (response.ok) {
        setNumbers(data.numbers);
      }
    } catch (error) {
      console.error("Error fetching numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/phone-numbers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchNumbers();
      }
    } catch (error) {
      console.error("Error updating number:", error);
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      US: "🇺🇸",
      AU: "🇦🇺",
      GB: "🇬🇧",
      CA: "🇨🇦",
      IN: "🇮🇳",
    };
    return flags[country] || "🌐";
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            Connected Numbers
          </h1>
          <p className="text-sm md:text-base text-white/60">
            Manage your connected phone numbers and their settings
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : numbers.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">No Connected Numbers</h2>
            <p className="text-white/60 mb-6">
              You need to connect a phone number to start making calls
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/50 transition-all duration-200">
              Add Phone Number
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {numbers.map((number) => (
              <div key={number.id} className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Number Info */}
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{getCountryFlag(number.country)}</div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white font-mono">
                          {number.phoneNumber}
                        </h3>
                        {number.isActive ? (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/50">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full border border-gray-500/50">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {number.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                          {number.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Added {new Date(number.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Capabilities */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {number.capabilities.map((capability) => (
                          <span
                            key={capability}
                            className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded border border-indigo-500/30"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(number.id, number.isActive)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        number.isActive
                          ? "bg-gray-500/20 text-gray-400 border border-gray-500/50 hover:bg-gray-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                      }`}
                    >
                      {number.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button className="px-4 py-2 glass-card text-white hover:bg-white/10 transition-colors rounded-lg">
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="glass-card p-6 mt-6 border-l-4 border-indigo-500">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-white mb-2">About Connected Numbers</h3>
              <p className="text-sm text-white/60 mb-2">
                Connected numbers are the phone numbers you use to make outbound calls. Each number is provided by a telephony provider (like Twilio) and configured in your environment variables.
              </p>
              <p className="text-sm text-white/60">
                To add a new number, configure it in your <code className="px-2 py-1 bg-white/10 rounded text-indigo-400">.env</code> file and restart the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
