// A larger, categorized set of starting questions — the landing screen's
// 4 chips are just a teaser; this is the full library, opened from the
// sidebar. Each entry is a bold "lead" phrase + a muted continuation,
// matching the landing chip style.

export const PROMPT_CATEGORIES = [
  { id: "characters", label: "Characters" },
  { id: "events", label: "Key Events" },
  { id: "teachings", label: "Teachings & Dharma" },
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
