// Curated Sanskrit shlokas from the Valmiki Ramayana (plus a few extremely
// well-known Hanuman Chalisa verses by Tulsidas, clearly labeled as such —
// never misattributed to Valmiki). Verified against sanskritdocuments.org's
// Valmiki Ramayana edition and hanuman-chalisa.com; each entry cites its
// exact Kanda/Sarga/verse so it can be checked.
//
// Grouped by persona — a lens for which life questions each verse speaks to
// most directly. The verses are not exclusive to that persona; the grouping
// is a starting point for reflection, not a claim of ownership.

export const PERSONAS = [
  { id: "seva", label: "Seva & Devotion", blurb: "For anyone in service — temple, community, or quiet daily duty." },
  { id: "developer", label: "Modern Professional", blurb: "For work: deadlines, integrity, leadership, handling failure." },
  { id: "parent", label: "Family & Parenting", blurb: "For the bonds of family — promises, siblings, children, spouse." },
  { id: "student", label: "Student & Learner", blurb: "For study, exams, and building capability through discipline." },
  { id: "hardship", label: "Facing Hardship", blurb: "For grief, loss, or a hard season — resilience and composure." },
];

export const SHLOKAS = [
  // ---------------- Seva & Devotion ----------------
  {
    id: "seva-sabari",
    persona: "seva",
    devanagari:
      "तेषाम् इच्छामि अहं गन्तुं समीपं भावितात्मनाम् । मुनीनाम् आश्रमो येषाम् अहं च परिचारिणी ॥",
    transliteration:
      "teṣām icchāmi ahaṃ gantuṃ samīpaṃ bhāvitātmanām | munīnām āśramo yeṣām ahaṃ ca paricāriṇī ||",
    translation:
      "\"I wish to go into the presence of those purified-souled sages, of whose hermitage I too am the maidservant (devoted attendant).\"",
    source: "Valmiki Ramayana, Aranya Kanda, Sarga 74.29",
    context: "Sabari, describing her life of humble service to her gurus, shortly before her liberation.",
    explanation:
      "Sabari, an elderly forest-dweller with no status or learning, defines her whole identity by one word — \"attendant.\" For anyone sweeping a temple floor or doing quiet, unglamorous duty, this is a reminder that the smallest acts of service, done with devotion, are never beneath dignity.",
  },
  {
    id: "seva-lakshmana",
    persona: "seva",
    devanagari:
      "धनुरादाय सशरं खनित्रपिटकाधरः । अग्रतस्ते गमिष्यामि पन्थानमनुदर्शयन् ॥",
    transliteration:
      "dhanurādāya śasaraṃ khanitrapiṭakādharaḥ | agratas te gamiṣyāmi panthānam anudarśayan ||",
    translation:
      "\"Carrying my bow and arrows, and bearing a spade and a basket, I will walk ahead of you, showing the way.\"",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 31.23",
    context: "Lakshmana, insisting on accompanying and serving Rama and Sita into forest exile.",
    explanation:
      "No grand gestures here — just small, practical, recurring chores: carrying tools, scouting the path, gathering food, day after day. This is seva as unglamorous, consistent labor, not a single dramatic act.",
  },
  {
    id: "seva-hanuman-dasa",
    persona: "seva",
    devanagari: "अहं कोसलराजस्य दासः पवनसम्भवः । हनुमानिति सर्वत्र नाम विश्रावितं मया ॥",
    transliteration:
      "ahaṃ kosalarājasya dāsaḥ pavanasambhavaḥ | hanumān iti sarvatra nāma viśrāvitaṃ mayā ||",
    translation:
      "\"I am the servant of the king of Kosala, born of the wind-god; the name 'Hanuman' I have proclaimed everywhere.\"",
    source: "Valmiki Ramayana, Sundara Kanda, Sarga 59.24",
    context: "Hanuman, at the height of his own power, proclaiming his identity in burning Lanka.",
    explanation:
      "At the height of his own glory, Hanuman's first self-description is not \"hero\" or \"conqueror\" but \"servant.\" No achievement should replace the humility of service — it's the foundation, not something you graduate from.",
  },
  {
    id: "seva-chalisa-32",
    persona: "seva",
    devanagari: "राम रसायन तुम्हरे पासा । सदा रहो रघुपति के दासा ॥",
    transliteration: "rāma rasāyana tumhare pāsā | sadā raho raghupati ke dāsā ||",
    translation:
      "\"You possess the elixir of devotion to Rama; may you remain forever the servant of Raghupati.\"",
    source: "Hanuman Chalisa, verse 32 (Tulsidas — not from Valmiki's Ramayana)",
    context: "A blessing that Hanuman's identity as servant be permanent, not occasional.",
    explanation:
      "Service isn't a task for weekends or festivals — it's a lasting identity you carry into every ordinary duty, not a role you step in and out of.",
  },

  // ---------------- Modern Professional ----------------
  {
    id: "dev-narada",
    persona: "developer",
    devanagari:
      "को न्वस्मिन्साम्प्रतं लोके गुणवान्कश्च वीर्यवान् । धर्मज्ञश्च कृतज्ञश्च सत्यवाक्यो दृढव्रतः ॥",
    transliteration:
      "ko nvasmin sāmprataṃ loke guṇavān kaśca vīryavān, dharmajñaśca kṛtajñaśca satyavākyo dṛḍhavrataḥ",
    translation:
      "\"Who in this world today is virtuous, capable, a knower of righteous duty, grateful, truthful in speech, and firm in resolve?\"",
    source: "Valmiki Ramayana, Bala Kanda, Sarga 1.2",
    context: "Valmiki's opening question to the sage Narada — answered by describing Rama.",
    explanation:
      "The very first verse of the epic is a checklist of character: competence, the ability to perform under pressure, ethical grounding, giving credit to others, honesty, and follow-through even when it's hard. A fair job description for anyone leading a team.",
  },
  {
    id: "dev-abhayam",
    persona: "developer",
    devanagari:
      "सकृदेव प्रपन्नाय तवास्मीति च याचते । अभयं सर्वभूतेभ्यो ददाम्येतद्व्रतं मम ॥",
    transliteration:
      "sakṛdeva prapannāya tavāsmīti ca yācate, abhayaṃ sarvabhūtebhyo dadāmyetadvrataṃ mama",
    translation:
      "\"To one who comes to me even once, surrendering and saying 'I am yours,' I grant freedom from fear from all beings — this is my vow.\"",
    source: "Valmiki Ramayana, Yuddha Kanda, Sarga 18.33",
    context: "Rama's declaration when Vibhishana seeks refuge with him, despite objections from his own camp.",
    explanation:
      "Rama's vow of unconditional protection to anyone who commits to him in good faith. For anyone leading people: once someone is under your wing, you back them — shield them from politics or blame — and keep that commitment even when it costs you.",
  },
  {
    id: "dev-chalisa-36",
    persona: "developer",
    devanagari: "संकट कटै मिटै सब पीरा । जो सुमिरै हनुमत बलबीरा ॥",
    transliteration: "sankat kaṭai miṭai sab pīrā, jo sumirai hanumat balabīrā",
    translation:
      "\"Troubles are cut away and all pain vanishes, for one who remembers the mighty and valiant Hanuman.\"",
    source: "Hanuman Chalisa, Chaupai 36 (Tulsidas — not from Valmiki's Ramayana)",
    context: "A promise that steady, focused remembrance dissolves obstacles.",
    explanation:
      "Under deadline pressure or a mounting incident queue, sustained calm focus on the task — not panic — is what actually cuts through the chaos.",
  },
  {
    id: "dev-chalisa-doha2",
    persona: "developer",
    devanagari:
      "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार । बल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार ॥",
    transliteration:
      "buddhihīna tanu jānike, sumirauṃ pavana-kumāra, bala budhi bidyā dehu mohiṃ, harahu kalesa bikāra",
    translation:
      "\"Knowing myself to be devoid of wisdom, I remember the Son of the Wind. Grant me strength, intellect, and knowledge, and remove my afflictions and faults.\"",
    source: "Hanuman Chalisa, Doha 2 (Tulsidas — not from Valmiki's Ramayana)",
    context: "The hymn opens with an admission of limited intelligence before asking for growth.",
    explanation:
      "The mindset behind a good code review or retrospective: acknowledge gaps in your own knowledge without ego, and treat \"I don't know this yet\" as a starting point, not a threat to defend against.",
  },

  // ---------------- Family & Parenting ----------------
  {
    id: "parent-word",
    persona: "parent",
    devanagari:
      "तद्ब्रूहि वचनं देवि राज्ञो यदभिकाङ्क्षितम्। करिष्ये प्रतिजाने च रामो द्विर्नाभिभाषते।।",
    transliteration:
      "tad brūhi vacanaṃ devi rājño yad abhikāṅkṣitam | kariṣye pratijāne ca rāmo dvir nābhibhāṣate ||",
    translation:
      "\"Tell me, O Queen, what it is the King desires — I will do it; I give my word. For Rama never speaks a thing twice.\"",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 18.30",
    context: "Rama, speaking to Kaikeyi, before learning the full cost of the boons she demands.",
    explanation:
      "A parent's word is the foundation children build their sense of safety on. This is Rama's declaration that he will not hedge once he has given his word — a model for keeping promises to your family even when circumstances turn painful.",
  },
  {
    id: "parent-lakshmana-loyalty",
    persona: "parent",
    devanagari:
      "न देवलोकाक्रमणं नामरत्वमहं वृणे। ऐश्वर्यं वापि लोकानां कामये न त्वया विना।।",
    transliteration:
      "na devalokākramaṇaṃ nāmaratvam ahaṃ vṛṇe | aiśvaryaṃ vāpi lokānāṃ kāmaye na tvayā vinā ||",
    translation:
      "\"I do not wish for ascent to the world of the gods, nor for immortality, nor even sovereignty over all the worlds — without you.\"",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 31.5",
    context: "Lakshmana to Rama, refusing to be left behind when Rama departs for fourteen years of exile.",
    explanation:
      "The purest statement of sibling loyalty in the epic — a touchstone for the bond you hope to instill between children: that family ties outrank comfort, status, or personal gain.",
  },
  {
    id: "parent-putra",
    persona: "parent",
    devanagari:
      "पुन्नाम्नो नरकाद् यस्मात् पितरं त्रायते सुतः। तस्मात् पुत्र इति प्रोक्तः पितॄन् यः पाति सर्वतः।।",
    transliteration:
      "punnāmno narakād yasmāt pitaraṃ trāyate sutaḥ | tasmāt putra iti proktaḥ pitṝn yaḥ pāti sarvataḥ ||",
    translation:
      "\"Because a son delivers his father from the hell named 'Put,' he is called 'putra' — one who protects his forebears in every way.\"",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 107.12",
    context: "Rama, addressing Bharata during their father Dasharatha's funeral rites.",
    explanation:
      "A reminder that family duty runs in both directions — children raised well come to understand that they too will one day be relied upon to look after those who raised them.",
  },
  {
    id: "parent-sita",
    persona: "parent",
    devanagari:
      "यदि त्वं प्रस्थितो दुर्गं वनमद्यैव राघव। अग्रतस्ते गमिष्यामि मृद्नन्ती कुशकण्टकान्।।",
    transliteration:
      "yadi tvaṃ prasthito durgaṃ vanam adyaiva rāghava | agrataste gamiṣyāmi mṛdnantī kuśakaṇṭakān ||",
    translation:
      "\"If you set out today into the impenetrable forest, I will walk ahead of you, treading down the thorny grasses and brambles myself.\"",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 27.6",
    context: "Sita to Rama, insisting on accompanying him into exile rather than remaining behind in comfort.",
    explanation:
      "The spousal partnership that anchors a family — showing up for each other in difficulty, not just in ease. Children absorb this by watching: a partner's place is beside you when things get hard.",
  },

  // ---------------- Student & Learner ----------------
  {
    id: "student-bala-atibala",
    persona: "student",
    devanagari:
      "बलामतिबलां चैव पठतस्तात राघव । न सौभाग्ये न दाक्ष्ये न ज्ञाने बुद्धिनिश्चये ॥ एतद्विद्याद्वयं लब्ध्वा न भवेत्सदृशस्तव ।",
    transliteration:
      "balām atibalāṃ caiva paṭhatas tāta rāghava | na saubhāgye na dākṣye na jñāne buddhiniścaye | etad vidyādvayaṃ labdhvā na bhavet sadṛśas tava ||",
    translation:
      "\"By reciting/practicing the Bala and Atibala hymns, dear Raghava, none will equal you in good fortune, skill, knowledge, or firmness of intellect. Having obtained these two vidyas, none will be your equal.\"",
    source: "Valmiki Ramayana, Bala Kanda, Sarga 22.14, 16",
    context: "Sage Vishwamitra formally transmits sacred knowledge to young Rama on the bank of the Sarayu, the foundation of all his later learning.",
    explanation:
      "True capability is not innate but received through disciplined study under a guru's guidance — even Rama had to sit down and formally receive knowledge. For a student facing exams or self-doubt, consistent practice is literally called the \"mother of all knowledge\": mastery is built, not born.",
  },
  {
    id: "student-narada",
    persona: "student",
    devanagari:
      "इक्ष्वाकुवंशप्रभवो रामो नाम जनैः श्रुतः । नियतात्मा महावीर्यो द्युतिमान् धृतिमान् वशी ॥ बुद्धिमान् नीतिमान् वाग्मी श्रीमान् शत्रुनिबर्हणः ॥",
    transliteration:
      "ikṣvākuvaṃśaprabhavo rāmo nāma janaiḥ śrutaḥ | niyatātmā mahāvīryo dyutimān dhṛtimān vaśī | buddhimān nītimān vāgmī śrīmān śatrunibarhaṇaḥ ||",
    translation:
      "\"Born in the Ikshvaku dynasty, there is one named Rama — self-controlled, of great valor, radiant, steadfast, and master of his senses; wise, principled, eloquent, glorious.\"",
    source: "Valmiki Ramayana, Bala Kanda, Sarga 1.8-9",
    context: "The sage Narada describes Rama's qualities at the very opening of the Ramayana, in answer to Valmiki's question.",
    explanation:
      "Rama's greatness is introduced through qualities like sharp intellect and steadfast self-discipline, not wealth or birth alone. A reminder that the traits worth cultivating through study — steadiness, self-mastery, clear thinking — are the same ones used here to define excellence itself.",
  },
  {
    id: "student-chalisa-7",
    persona: "student",
    devanagari: "विद्यावान गुनी अति चातुर । राम काज करिबे को आतुर ॥",
    transliteration: "vidyāvāna gunī ati cātura, rāma kāja karibe ko ātura",
    translation:
      "\"You are learned, virtuous, and exceedingly clever; you are ever eager to accomplish Lord Rama's work.\"",
    source: "Hanuman Chalisa, verse 7 (Tulsidas — not from Valmiki's Ramayana)",
    context: "Tulsidas praises Hanuman's combination of deep learning, moral virtue, and mental sharpness, placed in service of a devoted purpose.",
    explanation:
      "Hanuman is held up as the ideal learner — not knowledge for its own sake, but learning paired with discipline and eagerness to act. Cultivate real competence and sharpness, then apply it wholeheartedly rather than letting knowledge stay passive.",
  },

  // ---------------- Facing Hardship ----------------
  {
    id: "hardship-composure",
    persona: "hardship",
    devanagari:
      "तदप्रियममित्रघ्नो वचनं मरणोपमम् । श्रुत्वा न विव्यथे रामः कैकेयीं चेदमब्रवीत् ॥",
    transliteration:
      "tad apriyam amitraghno vacanaṃ maraṇopamam | śrutvā na vivyathe rāmaḥ kaikeyīṃ cedam abravīt ||",
    translation:
      "Having heard that unpleasant, death-like pronouncement, Rama was not perturbed — and spoke thus to Kaikeyi.",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 19.1",
    context: "The moment Kaikeyi tells Rama he must give up the throne and live fourteen years in exile.",
    explanation:
      "This verse captures the instant a life-altering blow lands — and shows composure is possible even then, not because the news doesn't matter, but because identity and worth aren't contingent on circumstance. You can receive devastating news, feel its full weight, and still respond from steadiness.",
  },
  {
    id: "hardship-kausalya-grief",
    persona: "hardship",
    devanagari:
      "अयं हि मां दीपयते समुत्थितस्तनूजशोकप्रभवो हुताशनः । महीमिमां रश्मिभिरुत्तमप्रभो यथा निदाघे भगवान् दिवाकरः ॥",
    transliteration:
      "ayaṃ hi māṃ dīpayate samutthitas tanūja-śoka-prabhavo hutāśanaḥ | mahīm imāṃ raśmibhir uttama-prabho yathā nidāghe bhagavān divākaraḥ ||",
    translation:
      "This fire, born of grief for my son and now blazing up, scorches me just as the glorious sun scorches this earth with its rays in the height of summer.",
    source: "Valmiki Ramayana, Ayodhya Kanda, Sarga 43.21",
    context: "Queen Kausalya, Rama's mother, lamenting the anguish of separation the night before Rama departs for the forest.",
    explanation:
      "Even a queen devoted to dharma is shown burning with unconcealed grief — the epic does not ask her to suppress or spiritualize her pain. Permission to feel grief at its full intensity: the Ramayana honors raw sorrow as real and legitimate, not a failure of strength.",
  },
  {
    id: "hardship-sita-resolve",
    persona: "hardship",
    devanagari:
      "शक्या लोभयितुं नाहमैश्वर्येण धनेन वा । अनन्या राघवेणाहं भास्करेण प्रभा यथा ॥",
    transliteration:
      "śakyā lobhayituṃ nāham aiśvaryeṇa dhanena vā | ananyā rāghaveṇāhaṃ bhāskareṇa prabhā yathā ||",
    translation:
      "\"I cannot be tempted, whether by lordship or by wealth. I am inseparable from Raghava, as sunlight is inseparable from the sun.\"",
    source: "Valmiki Ramayana, Sundara Kanda, Sarga 21.15",
    context: "Sita, held captive in Ravana's Ashoka grove, replies to Ravana's temptations of power and riches.",
    explanation:
      "Sita is at her lowest point materially — isolated, threatened, stripped of comfort — yet this is exactly where her inner resolve is most unshakeable. Circumstances can strip away everything external, but they cannot touch what you hold as unshakeably yours: your values, your relationships, your core sense of self.",
  },
  {
    id: "hardship-chalisa-36",
    persona: "hardship",
    devanagari: "सङ्कट कटै मिटै सब पीरा । जो सुमिरै हनुमत बलबीरा ॥",
    transliteration: "saṅkaṭa kaṭai miṭai sab pīrā, jo sumirai hanumat balabīrā",
    translation:
      "All troubles are cut away and every pain disappears, for one who remembers the mighty and valiant Hanuman.",
    source: "Hanuman Chalisa, Chaupai 36 (Tulsidas — not from Valmiki's Ramayana)",
    context: "Near the close of the Chalisa, Tulsidas assures devotees that sincere remembrance of Hanuman dissolves hardship.",
    explanation:
      "Hanuman himself is the epic's emblem of resilience — he crossed the ocean, endured captivity and attack, and never wavered in purpose. In the middle of grief or difficulty, calling to mind a source of strength greater than the immediate moment can itself become an act that steadies the mind.",
  },
];

export function shlokasFor(personaId) {
  return SHLOKAS.filter((s) => s.persona === personaId);
}
