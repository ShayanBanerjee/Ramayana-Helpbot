// A larger, categorized set of starting questions — the landing screen's
// 4 chips are just a teaser; this is the full library, opened from the
// sidebar. Each entry is a bold "lead" phrase + a muted continuation,
// matching the landing chip style.

export const PROMPT_CATEGORIES = [
  { id: "characters", label: "Characters" },
  { id: "events", label: "Key Events" },
  { id: "teachings", label: "Teachings & Dharma" },
  { id: "cosmos", label: "Worlds & Cosmology" },
  { id: "puranas", label: "Related Puranas" },
];

export const PROMPT_LIBRARY = [
  // ---------------- Characters ----------------
  {
    id: "char-hanuman",
    category: "characters",
    lead: "Who is Hanuman",
    rest: "and what does his devotion to Rama teach us?",
    prompt: "Who is Hanuman, and what does his devotion to Rama teach us?",
  },
  {
    id: "char-sita",
    category: "characters",
    lead: "Sita's character",
    rest: "— what defines her choices throughout the epic?",
    prompt: "What defines Sita's character and her choices throughout the Ramayana?",
  },
  {
    id: "char-ravana",
    category: "characters",
    lead: "Who is Ravana",
    rest: "and what does his downfall represent?",
    prompt: "Who is Ravana, and what does his downfall represent in the story?",
  },
  {
    id: "char-lakshmana",
    category: "characters",
    lead: "Rama and Lakshmana",
    rest: "— what defines their bond as brothers?",
    prompt: "What is the relationship between Rama and Lakshmana, and what defines their bond?",
  },

  // ---------------- Key Events ----------------
  {
    id: "event-exile",
    category: "events",
    lead: "Rama's exile",
    rest: "— what does it teach about duty over comfort?",
    prompt: "What are the events leading to Rama's exile, and what does it teach about duty over comfort?",
  },
  {
    id: "event-search",
    category: "events",
    lead: "The search for Sita",
    rest: "— how does it unfold across the epic?",
    prompt: "How does the search for Sita unfold in the Kishkindha and Sundara Kandas?",
  },
  {
    id: "event-battle",
    category: "events",
    lead: "The final battle",
    rest: "between Rama and Ravana — how does it unfold?",
    prompt: "What happens during the final battle between Rama and Ravana?",
  },
  {
    id: "event-balakanda",
    category: "events",
    lead: "Summarize the Balakanda",
    rest: "in a few key events",
    prompt: "Summarize the Balakanda in a few key events.",
  },

  // ---------------- Teachings & Dharma ----------------
  {
    id: "teach-dharma",
    category: "teachings",
    lead: "Dharma in the Ramayana",
    rest: "— how is it defined through the story?",
    prompt: "How does the Ramayana define dharma and duty through its story?",
  },
  {
    id: "teach-word",
    category: "teachings",
    lead: "Keeping one's word",
    rest: "— what does the epic teach, even at great cost?",
    prompt: "What does the Ramayana teach about keeping one's word, even at great cost?",
  },
  {
    id: "teach-leadership",
    category: "teachings",
    lead: "Rama as a king",
    rest: "— what does his conduct teach about leadership?",
    prompt: "What lessons on leadership can be drawn from Rama's conduct as a king?",
  },
  {
    id: "teach-loyalty",
    category: "teachings",
    lead: "Loyalty and service",
    rest: "— what does the epic say, through Hanuman and Lakshmana?",
    prompt: "What does the epic say about loyalty and service through the examples of Hanuman and Lakshmana?",
  },

  // ---------------- Worlds & Cosmology ----------------
  // The Valmiki Ramayana never says "multiverse" — these ask about its own
  // vocabulary (lokas, Svarga, Patala, Brahmaloka) and let the grounded answer
  // say what the text does and does not state.
  {
    id: "cosmos-multiverse",
    category: "cosmos",
    lead: "Many worlds?",
    rest: "— does the Valmiki Ramayana describe more than one world or universe?",
    prompt: "Does the Valmiki Ramayana describe multiple worlds or lokas, and what does it actually say about them?",
  },
  {
    id: "cosmos-trishanku",
    category: "cosmos",
    lead: "Trishanku's heaven",
    rest: "— how did Vishvamitra create a new heaven?",
    prompt: "How did Vishvamitra create a separate heaven for Trishanku, according to the Valmiki Ramayana?",
  },
  {
    id: "cosmos-trivikrama",
    category: "cosmos",
    lead: "Vamana's three steps",
    rest: "— how does Vishnu span the worlds?",
    prompt: "How does the Valmiki Ramayana tell the story of Vishnu as Vamana taking three strides across the worlds?",
  },
  {
    id: "cosmos-ganga",
    category: "cosmos",
    lead: "Ganga's descent",
    rest: "— from heaven to earth and the nether regions",
    prompt: "How does the Ramayana describe the descent of the Ganga from heaven to earth and the nether regions?",
  },
  {
    id: "cosmos-ocean",
    category: "cosmos",
    lead: "Churning of the ocean",
    rest: "— which beings and realms are involved?",
    prompt: "How does the Valmiki Ramayana describe the churning of the ocean, and which beings and realms are involved?",
  },
  {
    id: "cosmos-ravana-worlds",
    category: "cosmos",
    lead: "Ravana and the three worlds",
    rest: "— how far did his power reach?",
    prompt: "How does the Ramayana describe Ravana's power over the three worlds and the gods?",
  },
  {
    id: "cosmos-geography",
    category: "cosmos",
    lead: "The edges of the world",
    rest: "— Sugriva's directions to the search parties",
    prompt: "How does Sugriva describe the regions of the world when he sends the search parties in each direction?",
  },
  {
    id: "cosmos-return",
    category: "cosmos",
    lead: "Rama's return",
    rest: "— what does the Ramayana say about his divine nature at the end?",
    prompt: "What does the Valmiki Ramayana say about Rama's divine nature and his return at the end of the story?",
  },

  // ---------------- Related Puranas ----------------
  {
    id: "purana-avatar",
    category: "puranas",
    lead: "Rama among Vishnu's avatars",
    rest: "— how do the Puranas describe his place?",
    prompt: "How do the Puranas describe Rama's place among Vishnu's avatars?",
  },
  {
    id: "purana-retellings",
    category: "puranas",
    lead: "Other Puranic accounts",
    rest: "— what do they say about the Ramayana's events?",
    prompt: "What do other Puranic texts say about the events of the Ramayana?",
  },
  {
    id: "purana-adhyatma",
    category: "puranas",
    lead: "The Adhyatma Ramayana",
    rest: "— how does its telling differ from Valmiki's?",
    prompt: "How does the Adhyatma Ramayana differ in its telling from Valmiki's Ramayana?",
  },
  {
    id: "purana-dharma-thread",
    category: "puranas",
    lead: "Dharma across the Puranas",
    rest: "— what role does it play connected to Rama's story?",
    prompt: "What role does dharma play across the Puranas connected to Rama's story?",
  },
];

export function promptsFor(categoryId) {
  return PROMPT_LIBRARY.filter((p) => p.category === categoryId);
}
