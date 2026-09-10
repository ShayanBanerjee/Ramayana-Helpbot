/**
 * Curated, text-only guide to present-day Ayodhya — no photos of our own to
 * license for these specific sites (unlike shlokas.js/sacredGeography.js,
 * which do have sourced images), so this is deliberately a reading guide
 * rather than a photo gallery. Facts about temples/sites are phrased as
 * local tradition/belief, not asserted history, matching the assistant's
 * own "respectful, neutral tone; avoid sectarian claims" rule (see
 * backend/src/prompts.py) — the same convention sacredGeography.js already
 * follows. Modern infrastructure facts (airport/station names and dates)
 * are checked against current news reporting, not generated from memory.
 */
export const AYODHYA_OVERVIEW =
  "Ayodhya, on the Sarayu river in Uttar Pradesh, is where the Ramayana begins and ends — Rama's birthplace " +
  "and the throne he returned to. It's counted among Hinduism's Sapta Puri, the seven cities held to grant " +
  "moksha (liberation), and remains a living pilgrimage city today, not just a setting from the text.";

export const AYODHYA_PLACES = [
  {
    id: "ram-mandir",
    name: "Shri Ram Janmabhoomi Mandir",
    tag: "The centerpiece",
    summary:
      "A Nagara-style temple at the site tradition holds as Rama's birthplace, built after a 2019 Supreme " +
      "Court verdict settled a decades-long land dispute. Its sanctum was consecrated (the Pran Pratishtha " +
      "ceremony) on 22 January 2024.",
    importance:
      "The reason most visitors come to Ayodhya at all today — the physical anchor of the city's identity as " +
      "Rama's birthplace.",
    tip: "Expect security screening and long darshan queues, especially on weekends and festival days.",
  },
  {
    id: "hanuman-garhi",
    name: "Hanuman Garhi",
    tag: "Visit first, by custom",
    summary:
      "A fortress-like hilltop temple to Hanuman, reached by climbing about 76 steps. Local tradition holds " +
      "Hanuman resided here, keeping watch over Ramkot, Rama's citadel.",
    importance:
      "Custom holds that a visit to Ayodhya properly begins here, seeking Hanuman's permission before going " +
      "on to Ram Janmabhoomi — many pilgrims still visit in that order.",
    tip: "The steps and approach lanes get crowded; mornings are calmer than evenings.",
  },
  {
    id: "kanak-bhavan",
    name: "Kanak Bhavan",
    tag: "Sita's palace, by tradition",
    summary:
      "A temple known for its gold-crowned idols of Rama and Sita. Tradition holds it stands on the site of a " +
      "palace gifted to Sita by her mother-in-law Kaikeyi soon after the wedding.",
    importance: "One of Ayodhya's oldest continuously venerated temples, and among its most visually striking.",
    tip: "Quieter than Hanuman Garhi or Ram Mandir — a good stop for unhurried darshan.",
  },
  {
    id: "sarayu-ghats",
    name: "Ram ki Paidi & the Sarayu Ghats",
    tag: "The evening aarti",
    summary:
      "A long series of stepped ghats built for ritual bathing along the Sarayu, the river the Ramayana names " +
      "throughout as Ayodhya's own. A large evening Sarayu Aarti is held here daily.",
    importance:
      "The Sarayu is where tradition holds Rama himself bathed and where Guptar Ghat (below) marks the end of " +
      "his earthly story — the river runs through the whole narrative, not just its opening.",
    tip: "The evening aarti draws large crowds; arrive early for a clear view of the ghats.",
  },
  {
    id: "treta-ke-thakur",
    name: "Treta Ke Thakur",
    tag: "The oldest idols",
    summary:
      "A riverside temple whose idols of Rama, Sita, Lakshmana, and Hanuman are, by tradition, carved from " +
      "single blocks of black touchstone and date to the Treta Yuga — the age the Ramayana is traditionally " +
      "set in.",
    importance: "Held by tradition to be among the very oldest images of the Ramayana's central figures still worshipped today.",
    tip: "Less visited than the major sites — a good stop for a quieter darshan by the river.",
  },
  {
    id: "nageshwarnath",
    name: "Nageshwarnath Temple",
    tag: "Kush's temple, by tradition",
    summary:
      "A Shiva temple that local tradition credits to Kush, one of Rama's twin sons, said to have built it for " +
      "a Naga princess.",
    importance:
      "Tradition holds this temple never fell out of worship even through periods when much of the rest of " +
      "ancient Ayodhya was lost, making it a rare continuous thread back to the city's earliest history.",
    tip: "Central and easy to combine with Ram ki Paidi, which is close by.",
  },
  {
    id: "guptar-ghat",
    name: "Guptar Ghat",
    tag: "Where the story ends",
    summary:
      "A quiet ghat on the Sarayu where tradition holds Rama, at the end of his reign, walked into the river " +
      "and left his earthly body — a scene classical retellings call his jal samadhi.",
    importance: "The traditional bookend to Ram Janmabhoomi: birth at one site, departure at another, both on the same river.",
    tip: "Peaceful and far less crowded than the central ghats — worth the short trip out for the contrast.",
  },
];

export const AYODHYA_PRACTICAL = {
  gettingThere: [
    {
      mode: "By air",
      detail:
        "Maharishi Valmiki International Airport, Ayodhya — inaugurated December 2023, with commercial " +
        "flights operating since January 2024.",
    },
    {
      mode: "By rail",
      detail:
        "Ayodhya Dham Junction — the city's railway station, redeveloped and renamed as part of the same " +
        "2023–24 infrastructure push, well connected to major Indian cities.",
    },
    {
      mode: "By road",
      detail: "About 130 km from Lucknow, the nearest major city, on a well-maintained highway.",
    },
  ],
  bestTime:
    "October to March is coolest and most comfortable for walking between sites. Ram Navami (Rama's birthday, " +
    "in the Chaitra month, usually March or April) and Deepotsav (around Diwali) are Ayodhya's biggest " +
    "festival occasions — spectacular, but expect very large crowds and to plan accommodation well ahead.",
};
