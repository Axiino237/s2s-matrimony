const { Client } = require('pg');

async function updateDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public'
  });
  await client.connect();

  const res = await client.query("SELECT value FROM settings WHERE key = 'static_pages'");
  let current = {};
  if (res.rows.length > 0 && res.rows[0].value) {
    try {
      current = JSON.parse(res.rows[0].value);
    } catch (e) {}
  }

  const aboutText = `# Overview
## Empowering Families to Find Meaningful Alliances
Finding a life partner is one of the most sacred, impactful decisions in a person's life. S2S Community Matrimony was created with a heartfelt vision: to provide individuals and families with a dependable, dignified, and culturally rooted matrimonial space where traditions are respected and modern aspirations are embraced.

Today, our platform brings together a vibrant network of over 50,000 active members representing more than 200 cultural communities. Through a blend of compassionate human support and advanced compatibility algorithms, we have helped celebrate more than 10,000 happy marriages, connecting families across cities, states, and global diasporas.

# Our Mission
## Making Matrimony Safe, Authentic & Culturally Meaningful
Unlike casual dating platforms or purely commercial directories, S2S Community Matrimony is purpose-built exclusively for genuine marriage seekers and their families. We understand that Indian matrimonial unions unite not just two individuals, but two families, shared traditions, and generational values.

Our mission is to eliminate superficial barriers and unsafe digital experiences by establishing a trusted matchmaking environment. Every profile undergoes rigorous multi-step verification, contact privacy controls, and optional Government ID credentialing, ensuring that every interaction begins with authenticity and peace of mind.

# Trust & Safety
## Why Families Across Communities Choose S2S
Trust is the cornerstone of everything we build. We uphold industry-leading privacy standards designed specifically around family sensitivities and data protection:

### 100% Verified Contact Protection
Personal phone numbers and email addresses are never publicly indexed, shared with advertisers, or made visible to casual search engine crawlers. Contact details are accessible only upon mutual interest acceptance or through verified subscriber permissions.

### Anti-Theft Watermarked Photo Privacy
Members enjoy granular photo privacy settings. Uploaded photos can be protected with dynamic security watermarks, set to visible-on-request only, or made accessible exclusively to accepted matches.

### Accurate Dasa Porutham & Astrological Compatibility
We integrate traditional 10-Porutham (Dasa Porutham) Vedic astrology calculations based on Rasi, Nakshatram, and Gothram, helping families assess astrological harmony alongside educational, lifestyle, and career compatibility.

### Dedicated Relationship Assistance
For families seeking personalized guidance, our dedicated relationship managers offer curated shortlists, coordinate mutual introductions, and assist with horoscope exchanges.

# Our Values
## Guiding Principles Behind Every Alliance
Our daily work and technological development are anchored in four foundational principles:

### Trust & Authenticity
We uphold zero tolerance for fake profiles, deceptive information, or commercial solicitations. Every member profile undergoes mobile verification, proactive algorithmic moderation, and optional Government ID validation.

### Community Respect & Cultural Heritage
We celebrate diversity across regional cultures, mother tongues, and traditions. We empower families to search with nuanced precision, honoring cultural preferences while facilitating progressive choices.

### Harmony of AI & Traditional Compatibility
Modern algorithms should enhance human decisions, not replace cultural understanding. Our match engine harmonizes lifestyle preferences, career expectations, and family values with authentic astrological Porutham calculations.

### Family-Centric Experience
Whether a profile is managed directly by a bride or groom, or by loving parents, siblings, or guardians, the platform provides intuitive controls, transparent communication, and collaborative family decision-making.

# Evolution
## The S2S Growth Story
What started as a focused community initiative has steadily grown into a trusted matrimonial destination through consistent dedication to member security and cultural relevance:

### 2019 — Platform Inception
#### Foundations of Community Trust
Established as a regional community matrimonial directory supporting 500 pioneering members with manual verification and family counseling.

### 2021 — Statewide Expansion
#### Broadening Regional Reach
Expanded across South Indian communities and metropolitan hubs, surpassing 25,000 registered profiles with community-tailored search filters.

### 2023 — Automated Horoscope & Privacy Suite
#### Technological Innovation
Introduced automated Vedic 10-Porutham astrology scoring, photo watermarking, encrypted direct messaging, and fine-grained contact privacy.

### 2026 — Premier Community Platform
#### Serving Over 50,000 Families
Connecting over 50,000 verified members across 200+ distinct communities, backed by personalized relationship management and end-to-end alliance support.

# Member Care
## Our Continuous Safety Commitment
We believe safety in matchmaking requires vigilant ongoing governance. Our dedicated moderation team reviews flagged activities, monitors potential irregularities, and offers responsive member assistance 6 days a week.

Members can report suspicious profiles or block unwanted communications with a single click. Every report is investigated confidentially, ensuring our community remains a safe, respectful environment for all.`;

  current.about = aboutText;
  const jsonStr = JSON.stringify(current);

  await client.query(`
    INSERT INTO settings (id, key, value, "group", "isPublic", "updatedAt")
    VALUES (gen_random_uuid(), 'static_pages', $1, 'CMS', true, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $1, "updatedAt" = NOW()
  `, [jsonStr]);

  console.log('✅ static_pages.about updated successfully in DB!');
  await client.end();
}

updateDb().catch(e => { console.error(e); process.exit(1); });
