import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

interface StoredCall {
  id: string;
  bland_call_id: string;
  campaign_id: string;
  campaign_name: string;
  contact_id: string;
  club_name: string;
  phone: string;
  created_at: string;
}

interface StoredCampaign {
  id: string;
  name: string;
  description: string;
  script: string;
  voice_id: string;
  max_calls_per_day: number;
  call_time_start: string;
  call_time_end: string;
  timezone: string;
  status: string;
  contacts: Array<{ id: string; club_name: string; phone: string }>;
  from_number?: string;
  created_at: string;
}

export interface StoredContact {
  id: string;
  club_name: string;
  phone: string;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string;
  state?: string;
  source: string;
  verified: boolean;
  created_at: string;
  notes?: string;
  rating?: number | null;
  reviews?: number | null;
  preferred_contact_method?: "phone" | "email" | null;
  preferred_contact_value?: string | null;
}

export interface StoredPhoneNumber {
  id: string;
  label: string;
  number: string;
  created_at: string;
}

export interface EmailSettings {
  resend_api_key: string;
  from_email: string;
}

interface Store {
  campaigns: StoredCampaign[];
  contacts: StoredContact[];
  calls: StoredCall[];
  call_outcomes: Record<string, string>;
  phone_numbers: StoredPhoneNumber[];
  email_settings?: EmailSettings;
}

function read(): Store {
  try {
    const data = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    return {
      campaigns: data.campaigns ?? [],
      contacts: data.contacts ?? [],
      calls: data.calls ?? [],
      call_outcomes: data.call_outcomes ?? {},
      phone_numbers: data.phone_numbers ?? [],
      email_settings: data.email_settings ?? undefined,
    };
  } catch {
    return { campaigns: [], contacts: [], calls: [], call_outcomes: {}, phone_numbers: [] };
  }
}

function write(data: Store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function getCampaigns() {
  return read().campaigns;
}

export function getCampaign(id: string) {
  return read().campaigns.find((c) => c.id === id) ?? null;
}

export function saveCampaign(campaign: StoredCampaign) {
  const store = read();
  const idx = store.campaigns.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) store.campaigns[idx] = campaign;
  else store.campaigns.push(campaign);
  write(store);
}

export function deleteCampaign(id: string) {
  const store = read();
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  store.calls = store.calls.filter((c) => c.campaign_id !== id);
  write(store);
}

export function updateCampaignStatus(id: string, status: string) {
  const store = read();
  const c = store.campaigns.find((c) => c.id === id);
  if (c) c.status = status;
  write(store);
}

export function updateCampaignContacts(id: string, newContacts: Array<{ id: string; club_name: string; phone: string }>) {
  const store = read();
  const c = store.campaigns.find((c) => c.id === id);
  if (c) {
    const existing = new Set(c.contacts.map((x) => x.phone));
    newContacts.forEach((contact) => {
      if (!existing.has(contact.phone)) {
        c.contacts.push(contact);
        existing.add(contact.phone);
      }
    });
  }
  write(store);
}

export function saveCall(call: StoredCall) {
  const store = read();
  store.calls.push(call);
  write(store);
}

export function getCalls(campaignId?: string) {
  const store = read();
  if (campaignId) return store.calls.filter((c) => c.campaign_id === campaignId);
  return store.calls;
}

export function getCallById(id: string): StoredCall | null {
  return read().calls.find((c) => c.id === id) ?? null;
}

export function getCallByBlandId(blandCallId: string): StoredCall | null {
  return read().calls.find((c) => c.bland_call_id === blandCallId) ?? null;
}

export function getCallOutcomes(): Record<string, string> {
  return read().call_outcomes ?? {};
}

export function setCallOutcome(id: string, outcome: string) {
  const store = read();
  if (!store.call_outcomes) store.call_outcomes = {};
  store.call_outcomes[id] = outcome;
  write(store);
}

export function getContacts(): StoredContact[] {
  return read().contacts;
}

export function saveContact(contact: StoredContact) {
  const store = read();
  const idx = store.contacts.findIndex((c) => c.phone === contact.phone);
  if (idx >= 0) {
    store.contacts[idx] = { ...store.contacts[idx], ...contact };
  } else {
    store.contacts.push(contact);
  }
  write(store);
}

export function deleteContact(id: string) {
  const store = read();
  store.contacts = store.contacts.filter((c) => c.id !== id);
  write(store);
}

export function getPhoneNumbers(): StoredPhoneNumber[] {
  return read().phone_numbers;
}

export function savePhoneNumber(pn: StoredPhoneNumber) {
  const store = read();
  const idx = store.phone_numbers.findIndex((p) => p.id === pn.id);
  if (idx >= 0) store.phone_numbers[idx] = pn;
  else store.phone_numbers.push(pn);
  write(store);
}

export function deletePhoneNumber(id: string) {
  const store = read();
  store.phone_numbers = store.phone_numbers.filter((p) => p.id !== id);
  write(store);
}

export function getEmailSettings(): EmailSettings | null {
  return read().email_settings ?? null;
}

export function saveEmailSettings(settings: EmailSettings) {
  const store = read();
  store.email_settings = settings;
  write(store);
}
