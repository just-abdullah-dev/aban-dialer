"use client";

/**
 * Contact Queue Component - Glassmorphic Design
 * List of contacts with click-to-call functionality
 */

import { formatForDisplay } from "@/lib/utils/phone";

interface Contact {
  id: string;
  businessName: string;
  contactName: string | null;
  phoneE164: string;
  country: string;
}

interface ContactQueueProps {
  contacts: Contact[];
  onCall: (phoneNumber: string, contact: Contact) => void;
  disabled?: boolean;
}

export default function ContactQueue({ contacts, onCall, disabled = false }: ContactQueueProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-white">Contact Queue</h2>
          <p className="text-xs text-white/60 mt-0.5">{contacts.length} contacts ready to call</p>
        </div>
        <a
          href="/contacts"
          className="px-3 py-1.5 glass-card text-white text-xs hover:bg-white/10 transition-colors"
        >
          Manage Contacts
        </a>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-white/60 mb-3 text-sm">No contacts in queue</p>
          <a
            href="/contacts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contacts
          </a>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="glass-card p-3 hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-white truncate text-sm">
                      {contact.businessName}
                    </h3>
                    <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/70">
                      {contact.country}
                    </span>
                  </div>
                  {contact.contactName && (
                    <p className="text-xs text-white/60 mb-0.5">{contact.contactName}</p>
                  )}
                  <p className="text-xs font-mono text-white/80">
                    {formatForDisplay(contact.phoneE164)}
                  </p>
                </div>
                <button
                  onClick={() => onCall(contact.phoneE164, contact)}
                  disabled={disabled}
                  className="ml-4 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
