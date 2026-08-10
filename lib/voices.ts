export const VOICES = [
  { id: "2f9fdbc7-4bf2-4792-8a18-21ce3c93978f", label: "Maya", desc: "Young American Female" },
  { id: "37b3f1c8-a01e-4d70-b251-294733f08371", label: "Ryan", desc: "Professional American Male" },
  { id: "e1289219-0ea2-4f22-a994-c542c2a48a0f", label: "Alexa", desc: "American Female" },
  { id: "ff2c405b-3dba-41e0-9261-bc8ee3f91f46", label: "David", desc: "American Male" },
  { id: "60fec350-03ff-48fa-9f31-c180f37b1a38", label: "June", desc: "American Female" },
  { id: "13843c96-ab9e-4938-baf3-ad53fcee541d", label: "Nat", desc: "American Male" },
];

export const VOICE_LABEL: Record<string, string> = Object.fromEntries(
  VOICES.map((v) => [v.id, v.label])
);
