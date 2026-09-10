/**
 * Real Sanskrit chant recordings, all CC0/public-domain or Free Art
 * License (freely reusable, not commercial copyrighted film audio), sourced
 * from Wikimedia Commons and re-encoded to mp3 for broad browser support
 * (see frontend/public/audio/). These are general devotional mantras and
 * stotras, not recordings of the specific Valmiki Ramayana verses curated
 * in shlokas.js — no per-verse Ramayana chant recordings are publicly
 * available at that granularity, so don't attach one of these as if it
 * were "the recording of" a specific SHLOKAS entry; they're offered
 * separately as a general "listen" / ambient chanting mode.
 *
 * `repeat`: the two shortest recordings (Gayatri, Mahamrityunjaya) are
 * single ~20-second recitations — played once each, a 10-15 minute session
 * would jump between tracks every 20 seconds, which feels choppy rather
 * than meditative. Repeating a short mantra in place is also the authentic
 * traditional practice (japa — chanting a mantra a fixed number of times in
 * one sitting, classically 108), so AuraCleaning.jsx replays each track
 * `repeat` times in place before advancing, rather than looping the whole
 * four-track playlist track-by-track.
 */
export const CHANTS = [
  {
    id: "gayatri",
    title: "Gayatri Mantra",
    devanagari: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
    blurb: "The most widely chanted Vedic mantra, invoking the sun's illuminating power for clarity of mind.",
    src: "/audio/gayatri.mp3",
    durationSec: 21,
    repeat: 8,
    license: "CC0 1.0 (public domain)",
    attribution: "Wilfredor, via Wikimedia Commons",
  },
  {
    id: "mrityunjaya",
    title: "Mahamrityunjaya Mantra",
    devanagari: "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्",
    blurb: "A mantra of healing and release, addressed to Shiva — chanted for protection and inner peace.",
    src: "/audio/mrityunjaya.mp3",
    durationSec: 18,
    repeat: 9,
    license: "Free Art License",
    attribution: "Rameshvar, via Wikimedia Commons",
  },
  {
    id: "aarti",
    title: "Aarti Puja Chant",
    devanagari: "आरती पूजा मन्त्र",
    blurb: "A devotional aarti recitation in a female voice, of the kind offered at the close of temple worship.",
    src: "/audio/aarti_puja.mp3",
    durationSec: 132,
    repeat: 1,
    license: "CC0 1.0 (public domain)",
    attribution: "Aarti Shri Radha Govind Dev Ji, Jaipur — via Wikimedia Commons",
  },
  {
    id: "guru-stotram",
    title: "Guru Stotram",
    devanagari: "गुरुस्तोत्रम्",
    blurb: "A longer chant in praise of the Guru as guide and remover of darkness — well suited to sustained listening.",
    src: "/audio/guru_stotram.mp3",
    durationSec: 295,
    repeat: 1,
    license: "CC0 1.0 (public domain)",
    attribution: "Swami Atmananda, via Wikimedia Commons",
  },
];
