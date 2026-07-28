"use client";

import { useState, useEffect } from "react";
import { formatPhone } from "@/lib/utils";
import { Search, Upload, MapPin, CheckCircle, XCircle, Loader2, Globe, BookUser, Plus, Trash2 } from "lucide-react";

type Contact = {
  id: string;
  club_name: string;
  phone: string;
  email?: string | null;
  city: string;
  state: string;
  source: string;
  verified: boolean;
  created_at: string;
  notes?: string;
};

const sourceColors: Record<string, string> = {
  google_places: "bg-blue-100 text-blue-700",
  import: "bg-purple-100 text-purple-700",
  manual: "bg-gray-100 text-gray-600",
};

const sourceLabel: Record<string, string> = {
  google_places: "Google Maps",
  import: "Imported",
  manual: "Manual",
};

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"find" | "book">("find");

  // Find Contacts tab state
  const [findQuery, setFindQuery] = useState("");
  const [findCity, setFindCity] = useState("");
  const [finding, setFinding] = useState(false);
  const [findResults, setFindResults] = useState<Contact[]>([]);
  const [findError, setFindError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [addingToBook, setAddingToBook] = useState(false);

  // Manual add state
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // Contact Book tab state
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([]);
  const [targetCampaign, setTargetCampaign] = useState("");
  const [addingToCampaign, setAddingToCampaign] = useState(false);
  const [showCampaignPicker, setShowCampaignPicker] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSavedContacts = async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setSavedContacts(Array.isArray(data) ? data : []);
  };

  const loadCampaigns = async () => {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setCampaigns(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (activeTab === "book") {
      loadSavedContacts();
      loadCampaigns();
    }
  }, [activeTab]);

  const handleFind = async () => {
    if (!findQuery || !findCity) return;
    setFinding(true);
    setFindResults([]);
    setFindError(null);
    try {
      const res = await fetch(
        `/api/contacts/find?query=${encodeURIComponent(findQuery)}&city=${encodeURIComponent(findCity)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setFindError(data.error ?? "Search failed. Try a different city or sport.");
      } else if (data.results.length === 0) {
        setFindError(`Found ${data.total} clubs in ${findCity} but none had phone numbers listed yet. Try a larger city or import numbers manually.`);
      } else {
        setFindResults(data.results);
      }
    } catch {
      setFindError("Network error — check your connection and try again.");
    } finally {
      setFinding(false);
    }
  };

  const persistContacts = async (contacts: Contact[]) => {
    setAddingToBook(true);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacts),
    });
    setAddingToBook(false);
  };

  const addFindResultsToBook = async () => {
    await persistContacts(findResults);
    setFindResults([]);
    setFindError(null);
  };

  const handleImport = async () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    const newContacts: Contact[] = lines
      .map((line, i) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length < 2) return null;
        return {
          id: `import-${Date.now()}-${i}`,
          club_name: parts[0],
          phone: parts[1].replace(/\D/g, ""),
          email: parts[2] || null,
          city: parts[3] || "",
          state: parts[4] || "",
          source: "import" as const,
          verified: false,
          created_at: new Date().toISOString(),
          notes: "",
        };
      })
      .filter(Boolean) as Contact[];

    await persistContacts(newContacts);
    setImportText("");
    setShowImport(false);
  };

  const handleManualAdd = async () => {
    if (!manualName || !manualPhone) return;
    const contact: Contact = {
      id: `manual-${Date.now()}`,
      club_name: manualName,
      phone: manualPhone.replace(/\D/g, ""),
      email: manualEmail || null,
      city: manualCity,
      state: manualState,
      source: "manual",
      verified: false,
      created_at: new Date().toISOString(),
      notes: "",
    };
    await persistContacts([contact]);
    setManualName("");
    setManualPhone("");
    setManualCity("");
    setManualState("");
    setManualEmail("");
    setShowManual(false);
    if (activeTab === "book") loadSavedContacts();
  };

  const handleDeleteContact = async (id: string) => {
    setDeletingId(id);
    setSavedContacts((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  const handleAddToCampaign = async () => {
    if (!targetCampaign) return;
    setAddingToCampaign(true);
    const selected = savedContacts.filter((c) => selectedBook.has(c.id));
    const contacts = selected.map((c) => ({ id: c.id, club_name: c.club_name, phone: c.phone }));
    await fetch(`/api/campaigns/${targetCampaign}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts }),
    });
    setAddingToCampaign(false);
    setShowCampaignPicker(false);
    setSelectedBook(new Set());
    setTargetCampaign("");
  };

  const toggleBookSelect = (id: string) => {
    const next = new Set(selectedBook);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedBook(next);
  };

  const filteredBook = savedContacts.filter(
    (c) =>
      c.club_name.toLowerCase().includes(bookSearch.toLowerCase()) ||
      c.city.toLowerCase().includes(bookSearch.toLowerCase()) ||
      c.phone.includes(bookSearch)
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">Find clubs and manage your contact book</p>
        </div>
        <button
          onClick={() => { setShowManual(true); setShowImport(false); }}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("find")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "find"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Globe className="w-4 h-4" />
          Find Contacts
        </button>
        <button
          onClick={() => setActiveTab("book")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "book"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookUser className="w-4 h-4" />
          Contact Book
          {savedContacts.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{savedContacts.length}</span>
          )}
        </button>
      </div>

      {/* ── FIND CONTACTS TAB ── */}
      {activeTab === "find" && (
        <div className="space-y-4">
          {/* Manual add form */}
          {showManual && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Add Contact Manually</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Club / Company Name *"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone Number *"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email (optional)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                  />
                  <input
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                    value={manualState}
                    onChange={(e) => setManualState(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleManualAdd}
                  disabled={!manualName || !manualPhone}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save to Contact Book
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search finder */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-800">Find Club Phone Numbers (Google Maps)</h2>
            </div>
            <div className="flex gap-3 mb-4">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Club type (e.g. soccer clubs, basketball academies)"
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFind()}
              />
              <input
                className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City (e.g. Austin)"
                value={findCity}
                onChange={(e) => setFindCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFind()}
              />
              <button
                onClick={handleFind}
                disabled={finding || !findQuery || !findCity}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {finding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {finding ? "Searching..." : "Search"}
              </button>
            </div>

            {findError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                {findError}
              </div>
            )}

            {findResults.length > 0 && (
              <div>
                <div className="space-y-2 mb-3">
                  {findResults.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{r.club_name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">{formatPhone(r.phone)}</span>
                          {r.email && <span className="text-xs text-gray-400">{r.email}</span>}
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />{r.city}, {r.state}
                          </span>
                        </div>
                      </div>
                      {r.verified
                        ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addFindResultsToBook}
                    disabled={addingToBook}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingToBook ? "Saving..." : `Save ${findResults.length} contacts to Contact Book`}
                  </button>
                  <button
                    onClick={() => setFindResults([])}
                    className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CSV Import */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-800">Import from CSV</h2>
              <button
                onClick={() => setShowImport(!showImport)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                {showImport ? "Hide" : "Import CSV"}
              </button>
            </div>
            {showImport && (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Paste CSV rows: <code className="bg-gray-100 px-1 rounded">Club Name, Phone, Email (opt), City (opt), State (opt)</code>
                </p>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  placeholder={"Austin FC, 5124751000, info@austinfc.com, Austin, TX\nDallas Soccer Club, 2145550100"}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleImport}
                    disabled={!importText}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Import to Contact Book
                  </button>
                  <button
                    onClick={() => setShowImport(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CONTACT BOOK TAB ── */}
      {activeTab === "book" && (
        <div className="space-y-4">
          {/* Manual add form (same, shown here too) */}
          {showManual && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Add Contact Manually</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Club / Company Name *"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone Number *"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                />
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email (optional)"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                  />
                  <input
                    className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                    value={manualState}
                    onChange={(e) => setManualState(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleManualAdd}
                  disabled={!manualName || !manualPhone}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save to Contact Book
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add to campaign picker */}
          {showCampaignPicker && selectedBook.size > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 p-4">
              <p className="text-sm font-medium text-gray-800 mb-3">
                Add {selectedBook.size} contact{selectedBook.size > 1 ? "s" : ""} to a campaign:
              </p>
              <div className="flex gap-3">
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={targetCampaign}
                  onChange={(e) => setTargetCampaign(e.target.value)}
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddToCampaign}
                  disabled={!targetCampaign || addingToCampaign}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addingToCampaign ? "Adding..." : "Add to Campaign"}
                </button>
                <button
                  onClick={() => { setShowCampaignPicker(false); setTargetCampaign(""); }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Contact Book table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search contacts..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                />
              </div>
              {selectedBook.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-blue-600 font-medium">{selectedBook.size} selected</span>
                  <button
                    onClick={() => { setShowCampaignPicker(true); loadCampaigns(); }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Add to Campaign
                  </button>
                  <button
                    onClick={() => setSelectedBook(new Set())}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {filteredBook.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookUser className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No contacts in your book yet.</p>
                <p className="text-xs mt-1">Search for clubs in the "Find Contacts" tab or add them manually.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 text-left border-b border-gray-100">
                    <th className="px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedBook.size === filteredBook.length && filteredBook.length > 0}
                        onChange={() => {
                          if (selectedBook.size === filteredBook.length) setSelectedBook(new Set());
                          else setSelectedBook(new Set(filteredBook.map((c) => c.id)));
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Club Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBook.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedBook.has(c.id)}
                          onChange={() => toggleBookSelect(c.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.club_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatPhone(c.phone)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {c.city}{c.state ? `, ${c.state}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[c.source] ?? "bg-gray-100 text-gray-600"}`}>
                          {sourceLabel[c.source] ?? c.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{c.email || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
