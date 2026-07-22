"use client";

import { useState } from "react";
import { mockContacts } from "@/lib/mock-data";
import { formatPhone } from "@/lib/utils";
import { Search, Plus, Upload, MapPin, CheckCircle, XCircle, Loader2, Globe } from "lucide-react";

type Contact = typeof mockContacts[0];

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [findCity, setFindCity] = useState("");
  const [finding, setFinding] = useState(false);
  const [findResults, setFindResults] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFinder, setShowFinder] = useState(true);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  const filtered = contacts.filter(
    (c) =>
      c.club_name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const [findError, setFindError] = useState<string | null>(null);

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
        setFindError(`Found ${data.total} clubs in ${findCity} but none had phone numbers listed in OpenStreetMap yet. Try a larger city or import numbers manually.`);
      } else {
        setFindResults(data.results);
      }
    } catch {
      setFindError("Network error — check your connection and try again.");
    } finally {
      setFinding(false);
    }
  };

  const addFindResults = () => {
    const existing = new Set(contacts.map((c) => c.phone).filter(Boolean));
    const toAdd = findResults.filter((r) => !r.phone || !existing.has(r.phone));
    setContacts([...contacts, ...toAdd]);
    setFindResults([]);
    setShowFinder(false);
  };

  const handleImport = () => {
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

    setContacts([...contacts, ...newContacts]);
    setImportText("");
    setShowImport(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">{contacts.length} clubs in your database</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImport(true); setShowFinder(false); }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => { setShowFinder(true); setShowImport(false); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Search className="w-4 h-4" />
            Find Clubs
          </button>
        </div>
      </div>

      {/* Phone Number Finder */}
      {showFinder && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Find Club Phone Numbers (OpenStreetMap)</h2>
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
                        <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="w-3 h-3" />{r.city}, {r.state}</span>
                      </div>
                    </div>
                    {r.verified
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addFindResults} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Add {findResults.length} contacts
                </button>
                <button onClick={() => setFindResults([])} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Import */}
      {showImport && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Import Contacts</h2>
          <p className="text-xs text-gray-500 mb-3">Paste CSV rows: <code className="bg-gray-100 px-1 rounded">Club Name, Phone, Email (opt), City (opt), State (opt)</code></p>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
            placeholder={"Austin FC, 5124751000, info@austinfc.com, Austin, TX\nDallas Soccer Club, 2145550100"}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleImport} disabled={!importText} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Import
            </button>
            <button onClick={() => setShowImport(false)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selected.size > 0 && (
            <span className="text-sm text-blue-600 font-medium">{selected.size} selected</span>
          )}
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 text-left border-b border-gray-100">
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 font-medium">Club Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.club_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatPhone(c.phone)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {c.city}{c.state ? `, ${c.state}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColors[c.source]}`}>
                    {sourceLabel[c.source]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.verified
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-gray-300" />}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{c.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-10 text-gray-400 text-sm">No contacts found.</p>
        )}
      </div>
    </div>
  );
}
