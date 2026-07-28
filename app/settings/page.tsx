"use client";

import { useState, useEffect } from "react";
import { Phone, Plus, Trash2, Settings } from "lucide-react";

type PhoneNumber = {
  id: string;
  label: string;
  number: string;
  created_at: string;
};

function formatDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

export default function SettingsPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [label, setLabel] = useState("");
  const [number, setNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/settings/phone-numbers");
    const data = await res.json();
    setPhoneNumbers(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!label || !number) return;
    setSaving(true);
    const digits = number.replace(/\D/g, "");
    const e164 = digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
    await fetch("/api/settings/phone-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, number: e164 }),
    });
    setLabel("");
    setNumber("");
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/settings/phone-numbers/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage outbound phone numbers for your campaigns</p>
        </div>
      </div>

      {/* Add Phone Number */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-500" />
          Phone Numbers
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Add outbound caller IDs registered with Bland.ai. These will appear as the "from" number when your agent calls.
        </p>

        <div className="flex gap-3 mb-5">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Label (e.g. Sales Line, Team A)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Phone number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <button
            onClick={handleAdd}
            disabled={!label || !number || saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {saving ? "Adding..." : "Add"}
          </button>
        </div>

        {phoneNumbers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
            <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No phone numbers added yet.</p>
            <p className="text-xs mt-1">Add a Bland.ai registered number above to use it as the outbound caller ID.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {phoneNumbers.map((pn) => (
              <div key={pn.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{pn.label}</p>
                  <p className="text-xs text-gray-500 font-mono">{formatDisplay(pn.number)}</p>
                </div>
                <button
                  onClick={() => handleDelete(pn.id)}
                  disabled={deleting === pn.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>How to use:</strong> When creating a campaign, select one of your phone numbers as the outbound caller ID. Each number can be used across multiple campaigns simultaneously.
      </div>
    </div>
  );
}
