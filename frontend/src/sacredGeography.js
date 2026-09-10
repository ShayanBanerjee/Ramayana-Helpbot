/**
 * Curated waypoints of the Ramayana's story-geography, in narrative order.
 * `x`/`y` are hand-placed percentage coordinates on the illustrated map
 * canvas (not a geographic projection — this is a simple, stylized map,
 * not a GIS tool). Modern-place identifications and "folklore" notes are
 * phrased as tradition/local belief, not asserted historical fact, in
 * keeping with the assistant's own "respectful, neutral tone; avoid
 * sectarian claims" rule (see backend/src/prompts.py).
 *
 * `distanceFromPrevKm` is a straight-line (haversine, "as the crow flies")
 * distance from the previous waypoint in the route, computed from each
 * place's real modern coordinates — not a scriptural claim about the exact
 * path taken, which followed terrain and isn't precisely recorded.
 * `footDays` is illustrative only: distance ÷ ~25 km/day, a commonly cited
 * pre-modern travel pace for a large group on foot. Both are clearly
 * labeled as estimates in the UI, not presented as historical fact.
 */
export const SACRED_PLACES = [
  {
    id: "ayodhya",
    name: "Ayodhya",
    modern: "Ayodhya, Uttar Pradesh, India",
    era: "Birth & Return",
    x: 44,
    y: 9,
    image: "/places/ayodhya.jpg",
    imageCaption: "The rebuilt Ram Mandir in Ayodhya, on the Sarayu river.",
    distanceFromPrevKm: 0,
    footDays: 0,
    summary:
      "Capital of the Kosala kingdom on the Sarayu river — the birthplace and throne of Rama, and the city he returned to after fourteen years of exile. The Ramayana opens and closes here: Book I (Balakanda) begins with King Dasharatha's court, and Book VI (Yuddhakanda) ends with Rama's coronation, Pattabhisheka.",
    folklore:
      "Traditionally counted among Hinduism's seven most sacred cities (Sapta Puri); local memory of Rama's birthplace has been carried here for generations and anchors the whole story's geography. A temple marking the traditional birth-site (Ram Janmabhoomi) was rebuilt and consecrated in 2024.",
  },
  {
    id: "janakpur",
    name: "Janakpur (Mithila)",
    modern: "Janakpur, Madhesh Province, Nepal",
    era: "Sita's Birth & Wedding",
    x: 66,
    y: 12,
    image: "/places/janakpur.jpg",
    imageCaption: "Janaki Mandir, Janakpur — built where tradition holds Sita's birthplace stood.",
    distanceFromPrevKm: 370,
    footDays: 15,
    summary:
      "Capital of King Janaka's Videha kingdom — Sita's birthplace, and where Rama won her hand by stringing Shiva's great bow at her swayamvara. Not on the main exile route (it's a spur north-east of Ayodhya), but essential to the story's start.",
    folklore:
      "The Janaki Mandir in modern Janakpur is venerated by tradition as marking the site, and remains a major pilgrimage centre shared by devotees from both India and Nepal — the Vivah Panchami festival there re-enacts Rama and Sita's wedding every year.",
  },
  {
    id: "prayag",
    name: "Prayag",
    modern: "Prayagraj, Uttar Pradesh, India",
    era: "Early Exile",
    x: 42,
    y: 22,
    image: "/places/prayag.jpg",
    imageCaption: "The riverside at the Ganga–Yamuna confluence, Prayagraj.",
    distanceFromPrevKm: 155,
    footDays: 6,
    summary:
      "Site of sage Bharadwaja's ashram, at the sacred confluence (sangam) of the Ganga and Yamuna — the first stop after crossing the Ganga on leaving Ayodhya, where the three were received and guided onward toward Chitrakoot.",
    folklore:
      "The Sangam remains one of Hinduism's most important pilgrimage points, drawing millions of pilgrims during the Kumbh Mela — held here on a cycle tied to this same confluence.",
  },
  {
    id: "chitrakoot",
    name: "Chitrakoot",
    modern: "Chitrakoot, on the Uttar Pradesh–Madhya Pradesh border, India",
    era: "Early Exile",
    x: 33,
    y: 37,
    image: "/places/chitrakoot.jpg",
    imageCaption: "Ramghat, on the Mandakini river at Chitrakoot.",
    distanceFromPrevKm: 105,
    footDays: 4,
    summary:
      "A forest retreat on the Mandakini river, on Bharadwaja's advice, where Rama, Sita, and Lakshmana settled for part of their exile — and where Bharata came bearing their father's sandals to plead for Rama's return. Rama sent him back with the sandals as a symbol of his rule in his stead.",
    folklore:
      "Local tradition points to the Ramghat riverbank (pictured) and Kamadgiri hill here as places associated with their stay — both remain active pilgrimage sites today, with a parikrama (circumambulation) path around Kamadgiri.",
  },
  {
    id: "panchavati",
    name: "Panchavati",
    modern: "Nashik, Maharashtra, India",
    era: "Later Exile",
    x: 32,
    y: 48,
    image: "/places/panchavati.jpg",
    imageCaption: "The Godavari ghats at Panchavati, Nashik.",
    distanceFromPrevKm: 926,
    footDays: 37,
    summary:
      "Where the three built their forest dwelling under five banyan trees on the Godavari river — the longest single stretch of the exile. The site of the encounter with Shurpanakha (Ravana's sister) and, from nearby, Sita's abduction by Ravana disguised as a mendicant.",
    folklore:
      "Nashik's Panchavati neighborhood — named for those five ancient trees — is traditionally identified with this site and remains a living pilgrimage locality, with Ramkund (pictured) and Sita Gufa (a cave shrine) both drawing visitors today.",
  },
  {
    id: "kishkindha",
    name: "Kishkindha",
    modern: "Hampi & Anegundi, Karnataka, India",
    era: "Alliance & Search",
    x: 31,
    y: 64,
    special: "hanuman",
    image: "/places/kishkindha.jpg",
    imageCaption: "The hills of Anjanadri, near Hampi and Anegundi — the traditional Kishkindha.",
    distanceFromPrevKm: 591,
    footDays: 24,
    summary:
      "The vanara kingdom of Sugriva, where Rama allied with Sugriva and Hanuman after helping Sugriva reclaim his throne from his brother Vali — and from where search parties set out in every direction to find Sita, with Hanuman's southern party ultimately succeeding.",
    folklore:
      "The boulder-strewn hills around Hampi and Anegundi are traditionally venerated as Kishkindha, and nearby Anjanadri hill (pictured) is widely held by local tradition to be Hanuman's birthplace — a temple and a long stairway to its summit mark the spot today.",
  },
  {
    id: "rameswaram",
    name: "Rameswaram",
    modern: "Rameswaram, Tamil Nadu, India",
    era: "The Crossing",
    x: 39,
    y: 84,
    image: "/places/rameswaram.jpg",
    imageCaption: "The eastern gopuram of Ramanathaswamy Temple, Rameswaram.",
    distanceFromPrevKm: 740,
    footDays: 30,
    summary:
      "Where Rama is said to have worshipped Shiva to atone for the coming war before the vanara army, led by the engineer Nala, built Rama Setu — a bridge of floating stones across the strait to Lanka.",
    folklore:
      "The Ramanathaswamy Temple enshrines this tradition, and the chain of limestone shoals stretching toward Sri Lanka is popularly known as Rama Setu, or Adam's Bridge — visible as a pale underwater ridge in satellite images of the strait.",
  },
  {
    id: "lanka",
    name: "Lanka",
    modern: "Sri Lanka",
    era: "The War",
    x: 47,
    y: 93,
    image: "/places/lanka.jpg",
    imageCaption: "Seetha Amman Temple at Seetha Eliya, near Nuwara Eliya — a traditional Ashok Vatika site.",
    distanceFromPrevKm: 73,
    footDays: 3,
    summary:
      "Ravana's island kingdom, and the site of the climactic battle that freed Sita and ended in Ravana's defeat by Rama, with the aid of Sugriva's vanara army and Vibhishana, Ravana's own brother, who defected to Rama's side.",
    folklore:
      "Several sites across modern Sri Lanka are locally associated by pilgrims with events from this part of the story — including the Seetha Amman Temple (pictured) near Nuwara Eliya, close to a garden tradition holds was Ashok Vatika, where Sita was held.",
  },
];

/** Ayodhya -> Prayag -> Chitrakoot -> Panchavati -> Kishkindha -> Rameswaram -> Lanka. */
export const MAIN_ROUTE_IDS = [
  "ayodhya",
  "prayag",
  "chitrakoot",
  "panchavati",
  "kishkindha",
  "rameswaram",
  "lanka",
];
