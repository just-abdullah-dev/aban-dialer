"use client";

/**
 * Glassmorphic Footer Component
 * Consistent footer across all pages
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-card mx-4 mb-4 lg:ml-68 lg:mr-4">
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Aban Dialer</p>
              <p className="text-xs text-white/60">Cold Calling System</p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="/docs" className="text-white/70 hover:text-white transition-colors duration-200">
              Documentation
            </a>
            <a href="/support" className="text-white/70 hover:text-white transition-colors duration-200">
              Support
            </a>
            <a href="/privacy" className="text-white/70 hover:text-white transition-colors duration-200">
              Privacy
            </a>
          </div>

          {/* Right: Copyright */}
          <div className="text-sm text-white/60">
            © {currentYear} Aban Software Solutions
          </div>
        </div>

        {/* Bottom: Status Row */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Operational</span>
          </div>
          <span>•</span>
          <span>Provider: Twilio</span>
          <span>•</span>
          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
