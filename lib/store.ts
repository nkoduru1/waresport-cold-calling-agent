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
  created_at: string;
}

interface Store {
  campaigns: StoredCampaign[];
  contacts: Array<{ id: string; club_name: string; phone: string; email?: string; city?: string; state?: string; source: string; verified: boolean; created_at: string }>;
  calls: StoredCall[];
  call_outcomes: Record<string, string>;
}

function read(): Store {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch {
    return { campaigns: [], contacts: [], calls: [], call_outcomes: {} };
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

export function updateCampaignStatus(id: string, status: string) {
  const store = read();
  const c = store.campaigns.find((c) => c.id === id);
  if (c) c.status = status;
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

export function getCallOutcomes(): Record<string, string> {
  return read().call_outcomes ?? {};
}

export function setCallOutcome(id: string, outcome: string) {
  const store = read();
  if (!store.call_outcomes) store.call_outcomes = {};
  store.call_outcomes[id] = outcome;
  write(store);
}
