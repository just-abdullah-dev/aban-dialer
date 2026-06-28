"use client";

/**
 * Call History Stats Component - Glassmorphic Design
 * Key metrics dashboard
 */

interface Call {
  status: string;
  durationSeconds: number | null;
  disposition?: {
    outcome: string;
  };
}

interface CallHistoryStatsProps {
  calls: Call[];
}

export default function CallHistoryStats({ calls }: CallHistoryStatsProps) {
  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === "completed").length;
  const connectRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : "0";

  const totalDuration = calls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0);
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;

  const interestedCalls = calls.filter((c) => c.disposition?.outcome === "interested").length;
  const conversionRate = totalCalls > 0 ? ((interestedCalls / totalCalls) * 100).toFixed(1) : "0";

  const stats = [
    {
      label: "Total Calls",
      value: totalCalls,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      color: "from-indigo-500 to-purple-600",
    },
    {
      label: "Connect Rate",
      value: `${connectRate}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-green-500 to-emerald-600",
    },
    {
      label: "Avg Duration",
      value: `${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, "0")}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Interested",
      value: `${conversionRate}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: "from-yellow-500 to-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
              <div className="text-white">{stat.icon}</div>
            </div>
          </div>
          <p className="text-sm text-white/60 mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
