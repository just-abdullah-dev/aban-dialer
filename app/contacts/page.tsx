"use client";

/**
 * Contacts Page
 *
 * Full contact management:
 * - List view with search/filter
 * - Add/edit contacts
 * - CSV import
 * - Delete contacts
 */

import { useState, useEffect } from "react";
import { formatForDisplay } from "@/lib/utils/phone";
import AppLayout from "@/components/layout/AppLayout";

interface Contact {
  id: string;
  businessName: string;
  contactName: string | null;
  phoneE164: string;
  country: string;
  source: string;
  notes: string | null;
  nextCallbackAt: string | null;
  createdAt: string;
  calls?: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (countryFilter) params.set("country", countryFilter);

      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [searchTerm, countryFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchContacts();
      } else {
        alert("Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact");
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Contacts</h1>
              <p className="text-white/60">Manage your lead list and contact information</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 glass-card text-white font-medium hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Import CSV
              </button>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/50 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by business name, contact, phone, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 glass-card text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2 glass-card text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
              >
                <option value="">All Countries</option>
                <option value="US">United States</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-white/60">
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/60 mb-4">
                {searchTerm || countryFilter
                  ? "No contacts found matching your filters"
                  : "No contacts yet"}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
              >
                Add your first contact
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Call
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {contact.businessName}
                      </div>
                      {contact.notes && (
                        <div className="text-sm text-white/60 truncate max-w-xs">
                          {contact.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {contact.contactName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {formatForDisplay(contact.phoneE164)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border glass-card text-white/80 border-white/10">
                        {contact.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {contact.calls && contact.calls.length > 0 ? (
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            contact.calls[0].status === "completed" ? "bg-green-100 text-green-800" :
                            contact.calls[0].status === "no-answer" ? "bg-yellow-100 text-yellow-800" :
                            contact.calls[0].status === "busy" ? "bg-orange-100 text-orange-800" :
                            contact.calls[0].status === "failed" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {contact.calls[0].status}
                          </span>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(contact.calls[0].createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        "Never called"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setShowAddModal(true);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
            <div className="text-sm text-white/60">Total Contacts</div>
            <div className="text-3xl font-bold text-white mt-2">{contacts.length}</div>
          </div>
          <div className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
            <div className="text-sm text-white/60">US Contacts</div>
            <div className="text-3xl font-bold text-white mt-2">
              {contacts.filter((c) => c.country === "US").length}
            </div>
          </div>
          <div className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
            <div className="text-sm text-white/60">AU Contacts</div>
            <div className="text-3xl font-bold text-white mt-2">
              {contacts.filter((c) => c.country === "AU").length}
            </div>
          </div>
          <div className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
            <div className="text-sm text-white/60">Never Called</div>
            <div className="text-3xl font-bold text-white mt-2">
              {contacts.filter((c) => !c.calls || c.calls.length === 0).length}
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
        <AddEditContactModal
          contact={selectedContact}
          onClose={() => {
            setShowAddModal(false);
            setSelectedContact(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setSelectedContact(null);
            fetchContacts();
          }}
        />
        )}

        {/* Import Modal */}
        {showImportModal && (
          <ImportCSVModal
            onClose={() => setShowImportModal(false)}
            onSuccess={() => {
              setShowImportModal(false);
              fetchContacts();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Add/Edit Contact Modal Component
function AddEditContactModal({
  contact,
  onClose,
  onSuccess,
}: {
  contact: Contact | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    businessName: contact?.businessName || "",
    contactName: contact?.contactName || "",
    phoneE164: contact?.phoneE164 || "",
    country: contact?.country || "US",
    notes: contact?.notes || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = contact ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = contact ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save contact");
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {contact ? "Edit Contact" : "Add Contact"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) =>
                setFormData({ ...formData, contactName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number * (E.164 format)
            </label>
            <input
              type="tel"
              required
              value={formData.phoneE164}
              onChange={(e) =>
                setFormData({ ...formData, phoneE164: e.target.value })
              }
              placeholder="+14155551234"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: +[country code][number]
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              required
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="US">United States</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : contact ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import CSV Modal Component
function ImportCSVModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Import failed");
        setLoading(false);
        return;
      }

      setResult(data.result);
      setLoading(false);

      if (data.result.success > 0) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setError("An error occurred during import");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Import Contacts from CSV
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        {result ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900">
                ✅ Import completed!
              </p>
              <p className="text-sm text-green-800 mt-1">
                {result.success} contacts created, {result.skipped} skipped
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="font-medium text-yellow-900 mb-2">
                  Errors/Warnings:
                </p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {result.errors.slice(0, 10).map((err: any, idx: number) => (
                    <li key={idx}>
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-yellow-600">
                      ... and {result.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={onSuccess}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">CSV Format:</p>
              <p>
                Your CSV should have these columns: <br />
                <span className="font-mono">
                  businessName, contactName, phone, country, notes
                </span>
              </p>
              <p className="mt-2">
                Required: businessName, phone, country
                <br />
                Optional: contactName, notes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Importing..." : "Import"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
