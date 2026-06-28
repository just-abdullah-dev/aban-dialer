"use client";

/**
 * Analytics Dashboard Page
 * Call performance metrics and statistics
 */

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

interface AnalyticsData {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number;
  dispositionBreakdown: Record<string, number>;
  callsByHour: Array<{ hour: number; count: number }>;
  callsByDay: Array<{ date: string; count: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const answerRate = analytics
    ? ((analytics.answeredCalls / analytics.totalCalls) * 100).toFixed(1)
    : "0.0";

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
              Analytics
            </h1>
            <p className="text-sm md:text-base text-white/60">
              Track your call performance and metrics
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {["24h", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === range
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                    : "glass-card text-white/70 hover:bg-white/10"
                }`}
              >
                {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : !analytics ? (
          <div className="glass-card p-8 text-center">
            <p className="text-white/60">No analytics data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Calls */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/60">Total Calls</p>
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.totalCalls}</p>
              </div>

              {/* Answered Calls */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/60">Answered</p>
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.answeredCalls}</p>
                <p className="text-sm text-green-400 mt-1">{answerRate}% answer rate</p>
              </div>

              {/* Missed Calls */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/60">Missed</p>
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-white">{analytics.missedCalls}</p>
              </div>

              {/* Avg Duration */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/60">Avg Duration</p>
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-white">{formatDuration(analytics.avgDuration)}</p>
              </div>
            </div>

            {/* Disposition Breakdown */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Call Outcomes</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(analytics.dispositionBreakdown).map(([disposition, count]) => (
                  <div key={disposition} className="bg-white/5 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-white/60 mt-1 capitalize">
                      {disposition.replace(/_/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Calls by Day Chart */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Calls by Day</h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.callsByDay.map((day) => {
                  const maxCalls = Math.max(...analytics.callsByDay.map(d => d.count));
                  const height = (day.count / maxCalls) * 100;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all hover:from-indigo-600 hover:to-purple-700"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '20px' : '0' }}
                        title={`${day.count} calls`}
                      />
                      <p className="text-xs text-white/60 transform -rotate-45 origin-top-left mt-2">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calls by Hour Heatmap */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Calls by Hour</h2>
              <div className="grid grid-cols-12 gap-2">
                {analytics.callsByHour.map((hourData) => {
                  const maxCalls = Math.max(...analytics.callsByHour.map(h => h.count));
                  const intensity = hourData.count / maxCalls;

                  return (
                    <div key={hourData.hour} className="text-center">
                      <div
                        className="rounded-lg h-16 flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                        }}
                        title={`${hourData.count} calls at ${hourData.hour}:00`}
                      >
                        <span className="text-white font-semibold text-sm">{hourData.count}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">{hourData.hour}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
