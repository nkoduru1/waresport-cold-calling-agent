"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/utils";
import { ChevronLeft, CheckSquare, Square, Mic, Phone } from "lucide-react";
import Link from "next/link";

const VOICES = [
  { id: "maya", label: "Maya", desc: "Warm & professional female voice" },
  { id: "ryan", label: "Ryan", desc: "Friendly male voice" },
  { id: "grace", label: "Grace", desc: "Calm & clear female voice" },
  { id: "matt", label: "Matt", desc: "Confident male voice" },
];

const DEFAULT_SCRIPT = `Hi, this is an AI assistant calling from Waresport. We help sports clubs manage player registrations, scheduling, and payments — all in one platform.

I was hoping to connect with whoever manages your club's operations. We've been helping clubs across Texas save 15-20 hours per week on admin work, and I'd love to show you how in a quick 15-minute demo.

Would you have time for a call this week?`;

type Contact = {
  id: string;
  club_name: string;
  phone: string;
  city: string;
  state: string;
};

type PhoneNumber = {
  id: string;
  label: string;
  number: string;
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [voice, setVoice] = useState("maya");
  const [maxPerDay, setMaxPerDay] = useState("30");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [fromNumberId, setFromNumberId] = useState("");

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((saved: Contact[]) => setAllContacts(Array.isArray(saved) ? saved : []))
      .catch(() => {});

    // Load phone numbers for caller ID selection
    fetch("/api/settings/phone-numbers")
      .then((r) => r.json())
      .then(setPhoneNumbers)
      .catch(() => {});
  }, []);

  const toggleContact = (id: string) => {
    const next = new Set(selectedContacts);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedContacts(next);
  };

  const toggleAll = () => {
    if (selectedContacts.size === allContacts.length) setSelectedContacts(new Set());
    else setSelectedContacts(new Set(allContacts.map((c) => c.id)));
  };

  const selectedPhoneNumber = phoneNumbers.find((p) => p.id === fromNumberId);

  const handleSave = async (launch: boolean) => {
    setSaving(true);
    try {
      const selected = allContacts.filter((c) => selectedContacts.has(c.id)).map((c) => ({
        id: c.id,
        club_name: c.club_name,
        phone: c.phone,
      }));

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          script,
          voice_id: voice,
          max_calls_per_day: parseInt(maxPerDay),
          call_time_start: startTime,
          call_time_end: endTime,
          timezone,
          contacts: selected,
          from_number: selectedPhoneNumber?.number ?? "",
        }),
      });

      const campaign = await res.json();

      if (launch && campaign.id) {
        await fetch(`/api/campaigns/${campaign.id}/launch`, { method: "POST" });
      }

      router.push("/campaigns");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/campaigns" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Campaign</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {["Details", "Script & Voice", "Contacts", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i + 1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                step === i + 1
                  ? "bg-blue-600 text-white"
                  : step > i + 1
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === i + 1 ? "bg-white text-blue-600" : step > i + 1 ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"
              }`}>{i + 1}</span>
              {label}
            </button>
            {i < 3 && <div className="w-6 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-800">Campaign Details</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Campaign Name *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Texas Soccer Clubs Q1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                placeholder="What are you targeting with this campaign?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Calls per Day</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                  min={1} max={200}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">End Time</label>
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Timezone</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Outbound Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                {phoneNumbers.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-2">
                    No phone numbers added yet. <Link href="/settings" className="text-blue-500 hover:underline">Add one in Settings</Link>.
                  </p>
                ) : (
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fromNumberId}
                    onChange={(e) => setFromNumberId(e.target.value)}
                  >
                    <option value="">Use Bland.ai default</option>
                    {phoneNumbers.map((p) => (
                      <option key={p.id} value={p.id}>{p.label} ({p.number})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Script & Voice */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-gray-800">AI Script & Voice</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Call Script</label>
              <p className="text-xs text-gray-400 mb-2">This is what the AI will say and how it will handle the conversation.</p>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none font-mono"
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">Voice</label>
              <div className="grid grid-cols-2 gap-3">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`flex items-center gap-3 p-3 border rounded-lg text-left transition-colors ${
                      voice === v.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${voice === v.id ? "bg-blue-500" : "bg-gray-200"}`}>
                      <Mic className={`w-4 h-4 ${voice === v.id ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.label}</p>
                      <p className="text-xs text-gray-500">{v.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contacts */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Select Contacts</h2>
              <button onClick={toggleAll} className="text-sm text-blue-600 hover:underline">
                {selectedContacts.size === allContacts.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {selectedContacts.size} of {allContacts.length} contacts selected
            </p>
            {allContacts.length === 0 ? (
              <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">No contacts yet.</p>
                <p className="text-xs mt-1">
                  <Link href="/contacts" className="text-blue-500 hover:underline">Add contacts</Link> in the Find Contacts page first.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                {allContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => toggleContact(c.id)}
                    className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
                  >
                    {selectedContacts.has(c.id)
                      ? <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                      : <Square className="w-4 h-4 text-gray-300 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{c.club_name}</p>
                      <p className="text-xs text-gray-500">{formatPhone(c.phone)} · {c.city}{c.state ? `, ${c.state}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Review Campaign</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Contacts</span>
                <span className="font-medium text-gray-800">{selectedContacts.size} selected</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Calls per Day</span>
                <span className="font-medium text-gray-800">{maxPerDay}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Calling Hours</span>
                <span className="font-medium text-gray-800">{startTime}–{endTime} ({timezone.split("/")[1].replace("_", " ")})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Voice</span>
                <span className="font-medium text-gray-800">{VOICES.find((v) => v.id === voice)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Outbound Number</span>
                <span className="font-medium text-gray-800 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {selectedPhoneNumber ? `${selectedPhoneNumber.label} (${selectedPhoneNumber.number})` : "Bland.ai default"}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Script preview</p>
              <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">{script}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          Back
        </button>
        <div className="flex gap-2">
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !name}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-5 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Launching..." : "Launch Campaign"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
