"use client";

import { useState, useEffect } from "react";
import { Phone, Plus, Trash2, Settings, Mail, Eye, EyeOff, CheckCircle, AlertCircle, Send } from "lucide-react";

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

  // Email settings
  const [resendKey, setResendKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [testTo, setTestTo] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = async () => {
    const res = await fetch("/api/settings/phone-numbers");
    const data = await res.json();
    setPhoneNumbers(data);
  };

  const loadEmail = async () => {
    const res = await fetch("/api/settings/email");
    const data = await res.json();
    setResendKey(data.resend_api_key ?? "");
    setFromEmail(data.from_email ?? "");
  };

  useEffect(() => {
    load();
    loadEmail();
  }, []);

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

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    setEmailStatus(null);
    await fetch("/api/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resend_api_key: resendKey, from_email: fromEmail }),
    });
    setSavingEmail(false);
    setEmailStatus({ ok: true, msg: "Email settings saved." });
    setTimeout(() => setEmailStatus(null), 3000);
  };

  const handleTestEmail = async () => {
    if (!testTo) return;
    setTestingEmail(true);
    setEmailStatus(null);
    const res = await fetch("/api/settings/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resend_api_key: resendKey, from_email: fromEmail, test_to: testTo }),
    });
    const data = await res.json();
    setTestingEmail(false);
    if (data.ok) {
      setEmailStatus({ ok: true, msg: `Test email sent to ${testTo}. Check your inbox.` });
    } else {
      setEmailStatus({ ok: false, msg: data.error ?? "Failed to send test email." });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Configure outbound numbers and email follow-ups</p>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-500" />
          Email Follow-Ups (Resend)
        </h2>
        <p className="text-sm text-gray-500">
          When a prospect books a demo on a call, Waresport automatically sends a 5-email sequence:
          confirmation + calendar invite, reminders at −24h and −1h, then follow-ups at +24h and +48h after the demo.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 space-y-1">
          <p className="font-medium">Setup (2 minutes):</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
            <li>Sign up free at <strong>resend.com</strong> (3,000 emails/month free)</li>
            <li>Go to <strong>API Keys</strong> → Create API Key → paste below</li>
            <li>Add your sending email (verify your domain, or use <code>onboarding@resend.dev</code> for testing — only delivers to your own inbox)</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Resend API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="re_xxxxxxxxxxxxxxxx"
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Email Address</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="team@yourclub.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>

          <button
            onClick={handleSaveEmail}
            disabled={savingEmail || !resendKey}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {savingEmail ? "Saving..." : "Save Email Settings"}
          </button>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-medium text-gray-600">Send a test email</p>
          <div className="flex gap-2">
            <input
              type="email"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
            <button
              onClick={handleTestEmail}
              disabled={testingEmail || !resendKey || !testTo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              {testingEmail ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>

        {emailStatus && (
          <div className={`flex items-center gap-2 text-sm rounded-lg p-3 ${
            emailStatus.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          }`}>
            {emailStatus.ok
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {emailStatus.msg}
          </div>
        )}
      </div>

      {/* Phone Numbers */}
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
    </div>
  );
}
