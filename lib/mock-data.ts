export const mockContacts = [
  { id: "c1", club_name: "Austin FC Youth Academy", phone: "5124751000", email: "info@austinfcyouth.com", city: "Austin", state: "TX", source: "google_places", verified: true, created_at: "2024-01-10T10:00:00Z" },
  { id: "c2", club_name: "Dallas Soccer Club", phone: "2145550100", email: "admin@dallassoccer.com", city: "Dallas", state: "TX", source: "google_places", verified: true, created_at: "2024-01-10T10:05:00Z" },
  { id: "c3", club_name: "Houston Athletic FC", phone: "7135550200", email: "contact@houstonafc.com", city: "Houston", state: "TX", source: "import", verified: false, created_at: "2024-01-11T09:00:00Z" },
  { id: "c4", club_name: "San Antonio Spurs Youth", phone: "2105550300", email: "youth@saspurs.com", city: "San Antonio", state: "TX", source: "google_places", verified: true, created_at: "2024-01-11T09:30:00Z" },
  { id: "c5", club_name: "Plano Soccer Association", phone: "9725550400", email: null, city: "Plano", state: "TX", source: "google_places", verified: true, created_at: "2024-01-12T11:00:00Z" },
  { id: "c6", club_name: "Fort Worth FC", phone: "8175550500", email: "info@fortworthfc.com", city: "Fort Worth", state: "TX", source: "manual", verified: false, created_at: "2024-01-12T14:00:00Z" },
  { id: "c7", club_name: "Frisco Soccer Club", phone: "9725550600", email: "frisco@soccer.com", city: "Frisco", state: "TX", source: "google_places", verified: true, created_at: "2024-01-13T08:00:00Z" },
  { id: "c8", club_name: "Arlington FC Academy", phone: "8175550700", email: null, city: "Arlington", state: "TX", source: "import", verified: false, created_at: "2024-01-13T09:00:00Z" },
  { id: "c9", club_name: "Irving Soccer League", phone: "9725550800", email: "isl@irving.com", city: "Irving", state: "TX", source: "google_places", verified: true, created_at: "2024-01-14T10:00:00Z" },
  { id: "c10", club_name: "Garland Athletic Club", phone: "9725550900", email: null, city: "Garland", state: "TX", source: "google_places", verified: true, created_at: "2024-01-14T11:00:00Z" },
];

export const mockCampaigns = [
  {
    id: "camp1",
    name: "Texas Soccer Clubs Q1",
    description: "Targeting youth soccer clubs across Texas for Waresport platform demo",
    status: "active",
    script: "Hi, I'm calling from Waresport. We help sports clubs manage scheduling, payments, and registrations all in one place. I'd love to show you a quick 15-minute demo. Would you be available this week?",
    voice_id: "maya",
    max_calls_per_day: 50,
    call_time_start: "09:00",
    call_time_end: "17:00",
    timezone: "America/Chicago",
    created_at: "2024-01-10T00:00:00Z",
    contact_count: 10,
    calls_made: 7,
    demos_booked: 2,
  },
  {
    id: "camp2",
    name: "Basketball Clubs Outreach",
    description: "Targeting basketball clubs and academies nationwide",
    status: "paused",
    script: "Hey there! I'm reaching out from Waresport. We've built a platform specifically for sports clubs to handle everything from player registration to tournament management. Can I show you how it works?",
    voice_id: "ryan",
    max_calls_per_day: 30,
    call_time_start: "10:00",
    call_time_end: "16:00",
    timezone: "America/New_York",
    created_at: "2024-01-05T00:00:00Z",
    contact_count: 25,
    calls_made: 18,
    demos_booked: 5,
  },
  {
    id: "camp3",
    name: "Swimming Clubs Demo Drive",
    description: "Outreach to aquatic centers and swim clubs",
    status: "draft",
    script: "Hi, this is an AI assistant calling on behalf of Waresport. We specialize in management software for sports clubs. Would you have 15 minutes for a demo?",
    voice_id: "maya",
    max_calls_per_day: 20,
    call_time_start: "09:00",
    call_time_end: "17:00",
    timezone: "America/Los_Angeles",
    created_at: "2024-01-15T00:00:00Z",
    contact_count: 8,
    calls_made: 0,
    demos_booked: 0,
  },
];

export const mockCalls = [
  {
    id: "call1",
    campaign_id: "camp1",
    campaign_name: "Texas Soccer Clubs Q1",
    contact_id: "c1",
    club_name: "Austin FC Youth Academy",
    phone: "5124751000",
    status: "completed",
    outcome: "demo-booked",
    duration: 187,
    started_at: "2024-01-15T09:12:00Z",
    ended_at: "2024-01-15T09:15:07Z",
    transcript: `Agent: Hi, this is an AI assistant calling from Waresport. We help sports clubs manage scheduling, payments, and registrations all in one place. Is this Austin FC Youth Academy?

Contact: Yes, this is Austin FC. What's this about?

Agent: Great! We've built a platform specifically for youth soccer clubs that handles everything from player registration to tournament brackets and payment collection. A lot of clubs in Texas are using it to save 10+ hours a week on admin work. Would you be open to a 15-minute demo this week?

Contact: Actually that sounds interesting. We've been struggling with our registration system lately. What day works?

Agent: I can schedule that for Thursday or Friday this week. Which works better for you?

Contact: Thursday at 2pm works.

Agent: Perfect! I'll have someone from our team reach out to confirm. Can I get the best email for that?

Contact: Sure, it's info@austinfcyouth.com.

Agent: Got it. Thanks so much and we'll see you Thursday at 2pm!`,
    summary: "Successful call. Contact expressed interest after mentioning registration system struggles. Demo booked for Thursday at 2pm. Follow-up email to info@austinfcyouth.com.",
  },
  {
    id: "call2",
    campaign_id: "camp1",
    campaign_name: "Texas Soccer Clubs Q1",
    contact_id: "c2",
    club_name: "Dallas Soccer Club",
    phone: "2145550100",
    status: "completed",
    outcome: "not-interested",
    duration: 45,
    started_at: "2024-01-15T09:25:00Z",
    ended_at: "2024-01-15T09:25:45Z",
    transcript: `Agent: Hi, this is an AI assistant from Waresport. We help sports clubs with management software. Is this Dallas Soccer Club?

Contact: Yes, but we're not interested in any sales calls. Please remove us from your list.

Agent: Absolutely, I understand. I'll make note of that. Have a great day!

Contact: Thanks, bye.`,
    summary: "Contact immediately declined and requested removal from call list. Marked as do-not-call.",
  },
  {
    id: "call3",
    campaign_id: "camp1",
    campaign_name: "Texas Soccer Clubs Q1",
    contact_id: "c3",
    club_name: "Houston Athletic FC",
    phone: "7135550200",
    status: "completed",
    outcome: "callback",
    duration: 92,
    started_at: "2024-01-15T10:00:00Z",
    ended_at: "2024-01-15T10:01:32Z",
    transcript: `Agent: Hi, I'm calling from Waresport regarding sports club management software. Is this Houston Athletic FC?

Contact: It is, yes. Look I'm in the middle of practice right now.

Agent: Of course, I completely understand! Would it be okay if I called back at a better time?

Contact: Sure, try tomorrow afternoon around 3pm.

Agent: Perfect, I'll have someone call back tomorrow at 3pm. Thanks for your time!`,
    summary: "Contact was busy during practice. Requested callback tomorrow at 3pm. Add to follow-up queue.",
  },
  {
    id: "call4",
    campaign_id: "camp1",
    campaign_name: "Texas Soccer Clubs Q1",
    contact_id: "c4",
    club_name: "San Antonio Spurs Youth",
    phone: "2105550300",
    status: "completed",
    outcome: "voicemail",
    duration: 30,
    started_at: "2024-01-15T10:30:00Z",
    ended_at: "2024-01-15T10:30:30Z",
    transcript: `[Voicemail detected]

Agent: Hi, this is a message from Waresport. We help youth sports clubs streamline registration, scheduling, and payments. If you're interested in a free demo, please call us back or visit waresport.com. Thank you!`,
    summary: "Left voicemail. No response yet.",
  },
  {
    id: "call5",
    campaign_id: "camp1",
    campaign_name: "Texas Soccer Clubs Q1",
    contact_id: "c5",
    club_name: "Plano Soccer Association",
    phone: "9725550400",
    status: "completed",
    outcome: "demo-booked",
    duration: 215,
    started_at: "2024-01-15T11:00:00Z",
    ended_at: "2024-01-15T11:03:35Z",
    transcript: `Agent: Hi, this is Waresport calling. We've built an all-in-one management platform for youth soccer clubs. Is this Plano Soccer Association?

Contact: Yes it is. What kind of platform?

Agent: We handle player registration, team scheduling, tournament management, and payment collection — all in one place. Clubs typically save 8-12 hours per week on administrative tasks.

Contact: Oh wow, we use like three different systems right now. That's a nightmare.

Agent: That's exactly what we help with! We can show you how everything integrates in about 15 minutes. Would you have time this week?

Contact: Yeah, how about Wednesday morning?

Agent: Wednesday morning works great. 10am or 11am?

Contact: 10am is perfect.

Agent: Awesome! What's the best email to send the calendar invite to?

Contact: Use frisco@soccer.com — wait, no, I meant plano@soccer.com.

Agent: Got it — plano@soccer.com. We'll send over a calendar invite shortly. Thanks so much!`,
    summary: "Strong interest — contact is currently using 3 separate systems. Demo booked for Wednesday at 10am. Email: plano@soccer.com. High conversion potential.",
  },
  {
    id: "call6",
    campaign_id: "camp2",
    campaign_name: "Basketball Clubs Outreach",
    contact_id: "c6",
    club_name: "Fort Worth FC",
    phone: "8175550500",
    status: "completed",
    outcome: "no-answer",
    duration: 0,
    started_at: "2024-01-14T14:00:00Z",
    ended_at: "2024-01-14T14:00:30Z",
    transcript: "[No answer — call rang out]",
    summary: "No answer. Schedule retry.",
  },
  {
    id: "call7",
    campaign_id: "camp2",
    campaign_name: "Basketball Clubs Outreach",
    contact_id: "c7",
    club_name: "Frisco Soccer Club",
    phone: "9725550600",
    status: "completed",
    outcome: "interested",
    duration: 143,
    started_at: "2024-01-14T15:00:00Z",
    ended_at: "2024-01-14T15:02:23Z",
    transcript: `Agent: Hi there, this is an AI assistant from Waresport reaching out about our sports club management platform.

Contact: Waresport? I've actually heard of you guys.

Agent: That's great to hear! We've been expanding across Texas. Are you currently using any management software?

Contact: Just spreadsheets honestly. It's gotten out of hand since we grew to 400 players.

Agent: Wow, 400 players on spreadsheets — that's impressive you've managed that! We can definitely help streamline that. Would you like to see a demo?

Contact: Send me some information first, I'd like to look it over before booking a call.

Agent: Absolutely! What's the best email for that?

Contact: frisco@soccer.com`,
    summary: "Warm lead — contact had heard of Waresport. Currently managing 400 players on spreadsheets. Requested information by email before booking demo. Send follow-up to frisco@soccer.com.",
  },
];

export const mockAnalytics = {
  total_calls: 47,
  pickups: 34,
  pickup_rate: 72,
  demos_booked: 7,
  demo_rate: 20,
  not_interested: 8,
  voicemails: 5,
  no_answer: 13,
  callbacks: 6,
  avg_duration: 124,
  daily_calls: [
    { date: "Jan 10", calls: 5, pickups: 4, demos: 1 },
    { date: "Jan 11", calls: 8, pickups: 6, demos: 2 },
    { date: "Jan 12", calls: 6, pickups: 4, demos: 0 },
    { date: "Jan 13", calls: 10, pickups: 7, demos: 1 },
    { date: "Jan 14", calls: 9, pickups: 6, demos: 2 },
    { date: "Jan 15", calls: 9, pickups: 7, demos: 1 },
  ],
  outcomes: [
    { name: "Demo Booked", value: 7, color: "#22c55e" },
    { name: "Interested", value: 6, color: "#3b82f6" },
    { name: "Callback", value: 6, color: "#f59e0b" },
    { name: "Not Interested", value: 8, color: "#ef4444" },
    { name: "Voicemail", value: 5, color: "#8b5cf6" },
    { name: "No Answer", value: 13, color: "#6b7280" },
    { name: "Wrong Number", value: 2, color: "#1e293b" },
  ],
};
