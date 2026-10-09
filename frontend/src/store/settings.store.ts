import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export interface ContactOffice {
  title?: string;
  address: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
  whatsapp: string;
  officeHours: string;
  mediaEmail: string;
  intro: string;
  offices: ContactOffice[];
  fullAddress: string;
}

export const DEFAULT_CONTACT_MARKDOWN = `# Contact Us

## Get In Touch

We're here to help you with any questions or concerns.

**Email:** support@s2smatrimony.com
**Phone:** +91 98765 43210
**WhatsApp:** +91 98765 43210
**Office Hours:** Mon–Sat: 9 AM – 6 PM

## Office Address
**Chennai HQ:** No. 42, Usman Road, T.Nagar, Chennai - 600017
**Coimbatore Regional Office:** 104 DB Road, RS Puram, Coimbatore - 641002
**Madurai Regional Office:** 18 KK Nagar Main Road, Madurai - 625020

## For Media Inquiries
press@s2smatrimony.com`;

export const DEFAULT_ABOUT_MARKDOWN = `# Overview
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

export const DEFAULT_PRIVACY_MARKDOWN = `# Core Principles
## Our Privacy Promises to Members
At S2S Community Matrimony, we recognize that matrimonial matchmaking touches the most personal and confidential facets of family life. We operate with strict ethical standards built on three non-negotiable promises:

### No Public Phone Numbers or Contact Harvesting
Your contact number, residential address, and personal email are never indexed by web search engines or made visible to casual site visitors. Your phone number is disclosed solely upon mutual interest acceptance or through authorized verified subscriber permissions configured under your explicit settings.

### Anti-Theft Photo Protection & Granular Visibility
You retain complete authority over your photos. Choose to protect your photographs with anti-theft security watermarks featuring your Member ID, blur images for anonymous browsing, or restrict viewing exclusively to profiles whose connection requests you have accepted.

### Zero Commercial Advertising & No Third-Party Data Sales
We do not sell, rent, lease, or monetize your personal information, biodata, or horoscope charts to external telemarketers, banks, or ad networks. Your information exists exclusively to help you find an authentic, meaningful life partner within our community.

# Section 01
## Information We Collect
To provide an authentic matchmaking experience and safeguard members against fraudulent accounts, S2S Community Matrimony collects personal information when you create an account, complete your matrimonial biodata, or engage with other profiles:

### Basic Account & Identity Credentials
Full name, gender, date of birth, age, primary mobile phone number, email address, relationship of the profile creator (e.g. self, parent, or sibling), and salted password hash.

### Matrimonial Profile & Background Details
Religion, community, caste, sub-caste, mother tongue, marital status, height, weight, body type, complexion, educational degree, college or university, occupation, employer, annual income range, current residential status, city, state, and country.

### Family Information & Lifestyle Preferences
Family type (nuclear or joint), family status, family values, father's name and occupation, mother's name and occupation, sibling counts and marital statuses, native place, diet preferences, smoking and drinking habits, and partner expectations.

### Astrological & Horoscope Data
Rasi (Moon sign), Nakshatram (Birth star), Star Padam, Lagnam (Ascendant), Gothram, Kuladeivam, Dosham indicators (e.g., Chevvai / Raagu Dosham), Dasa balance, birth time, birthplace, and uploaded horoscope charts used for traditional Porutham matching.

### Verification & Audit Records
Mobile OTP tokens, optional Government photo ID documents (e.g., Aadhaar, Voter ID, or Passport) submitted solely for verification badge issuance, fraud prevention, and admin compliance. ID documents are strictly internal and are never visible to other members.

### Technical & Platform Interaction Data
IP address, browser type, device information, operating system, login timestamps, profiles viewed, interests sent and received, and internal chat interaction metadata to enforce platform security and prevent spam.

# Section 02
## How We Use Your Information
All data gathered is utilized strictly for lawful purposes directly related to facilitating matrimonial alliances and preserving safety:

### Matchmaking & Astrological Compatibility Calculations
We analyze your criteria, partner preferences, community parameters, and horoscope coordinates to generate compatible match recommendations and calculate 10-Porutham astrology scores.

### Communication Alerts & Member Notifications
We deliver SMS, WhatsApp, and email alerts when a member expresses interest in your profile, accepts an invitation, sends a chat message, or views your biodata.

### Safety Moderation & Bad Actor Prevention
We actively screen profiles to detect duplicate accounts, identify fraudulent impersonations, prevent harassment, and enforce our Community Code of Conduct.

### Subscription Billing & Customer Assistance
We process membership upgrades via RBI-regulated payment gateways, generate official GST tax invoices, and offer dedicated customer support for profile assistance and queries.

# Section 03
## Your Privacy Settings & Controls
You maintain full sovereignty over your information through our granular Privacy Settings available inside your member dashboard:

### Contact Number Visibility Controls
Configure whether your phone number is visible to all premium verified members, restricted exclusively to members whose connection interest you have explicitly accepted, or completely hidden until requested individually.

### Anti-Theft Photo Watermarking & Anonymous Blur Protection
Uploaded photos can be dynamically stamped with your unique Member ID and platform security branding to prevent unauthorized redistribution or downloads. You can also enable photo blur so only accepted matches see your photo in full resolution.

### Incognito Mode & Temporary Profile Deactivation
If you are actively in discussion with a prospective match or need time off, you can hide your profile from search results instantly with a single toggle, preserving all your account data, chat histories, and favorites without deleting your account.

# Section 04
## Information Sharing & Third-Party Disclosure
We hold a strict policy against selling user data. Your information is shared only under the following controlled parameters:

### Display to Registered Members
Basic matrimonial details (age, height, community, education, occupation, and general city) are displayed on your profile card to registered users for matchmaking purposes.

### Secure Payment Processors
When purchasing a membership plan, transactions are processed directly by PCI-DSS compliant payment gateways (such as Razorpay). We never capture, store, or log raw debit/credit card numbers or UPI PINs on our servers.

### Transactional SMS & Email Gateways
Reputable telecom partners and encrypted transactional mail providers are used solely for OTP delivery, account recovery, and essential platform updates.

### Legal Compliance & Law Enforcement
We disclose member information only when mandated by valid subpoenas, court orders, or statutory legal processes under Indian cyber law to investigate fraud, criminal impersonation, or safety violations.

# Section 05
## Data Security & Encryption Standards
We employ modern security protocols and architectural safeguards to protect your personal information against unauthorized access, loss, or alteration:

### End-to-End Transport Layer Security (TLS / SSL)
All data transmitted between your device and our servers is encrypted using 256-bit TLS/SSL protocols, safeguarding your data against eavesdropping or interception.

### Cryptographic Salted Password Hashing
Account passwords are never stored in plain text. They are hashed using industry-standard Bcrypt algorithms with cryptographic salting, ensuring irreversible protection even in internal storage.

### Role-Based Access Controls (RBAC) & Immutable Audit Logging
Administrative database access is tightly restricted to authorized moderation personnel under strict role-based permission policies. All administrative queries, verifications, and approvals are tracked with immutable audit logs.

### Automated Vulnerability Monitoring
Our infrastructure undergoes regular dependency patch cycles, automated penetration scans, and continuous firewall protection to defend against contemporary cyber threats.

# Section 06
## Your Data Rights & Profile Deletion
Under the Digital Personal Data Protection (DPDP) Act 2023 and global privacy benchmarks, every registered user is entitled to full autonomy over their personal record:

### Right to Access & Rectify
You can review, edit, or update your profile details, family background, photos, and partner preferences at any time directly through your account dashboard.

### Right to Data Portability
You have the right to request a digital export of your submitted matrimonial profile, photos, and interaction records by writing to our support desk.

### Right to Permanent Account Erasure
When you find your life partner or wish to withdraw from the service, you can permanently delete your account from your Profile Settings. Upon deletion, your profile is immediately taken offline and permanently removed from active indexes within 30 calendar days, subject only to statutory financial record retention requirements.

# Section 07
## Grievance Redressal Officer & Contact Information
In compliance with the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023, S2S Community Matrimony has designated a dedicated Grievance Officer to address any privacy concerns, data removal requests, or report unauthorized contact access:

**Designation:** Grievance Redressal & Privacy Officer  
**Organization:** S2S Community Matrimony Pvt. Ltd.  
**Official Email:** [privacy@s2smatrimony.com](mailto:privacy@s2smatrimony.com) / [support@s2smatrimony.com](mailto:support@s2smatrimony.com)  
**Headquarters:** No. 42, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017, India  
**Turnaround Time:** Grievances are acknowledged within 24 business hours and resolved within 15 working days.`;

export const DEFAULT_TERMS_MARKDOWN = `# Key Highlights
## Key Highlights for Members
Before using S2S Community Matrimony, please review these foundational commitments:

### Authentic Matrimonial Profiles Only
Only registered individuals looking for genuine matrimonial alliances are permitted. Commercial solicitation, casual dating, escort services, or fraudulent behavior is strictly prohibited.

### Legal Age & Marital Status Eligibility
Minimum age is 18 years for females and 21 years for males in strict accordance with Indian Law. Members must be legally unmarried, divorced with final court decree, or widowed.

### Strict Privacy & Mutual Safety Protection
Your contact information is never shared without your mutual interest acceptance. All members undergo phone and optional government verification. Report any suspicious conduct immediately.

# Section 01
## Acceptance of Terms
Welcome to S2S Community Matrimony ("S2S Matrimony", "Platform", "we", "our", or "us"). By accessing, registering on, or using our website and matchmaking services, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions ("Terms") and our Privacy Policy.

If you do not agree to these Terms, you must not access or use the Platform. These terms apply to all visitors, registered members, premium subscribers, and users across all platforms.

# Section 02
## Eligibility Requirements
To register as a member or use this Platform, you must satisfy the following legal criteria:

### Minimum Legal Marriageable Age
You must be legally eligible to marry under the laws of India or your country of citizenship. For Indian citizens, the minimum legal age of marriage is 18 years for females and 21 years for males.

### Legally Recognized Marital Status
You must be legally unmarried, divorced (with a certified final court decree), widowed, or legally separated. Married individuals seeking extra-marital relationships are strictly prohibited and will be reported.

### Genuine Matrimonial Intent
The Platform is purpose-built strictly for matrimonial alliance search. Casual dating, escort arrangements, commercial marketing, or fraud are criminal offenses and will result in instant account ban and reporting to cyber authorities.

### Truthfulness & Data Authenticity
All personal, astrological, educational, professional, and family details provided on your profile must be truthful, accurate, and authentic.

# Section 03
## Account Security & Verification
When you create an account, you are responsible for maintaining the confidentiality of your login credentials, password, and mobile OTP tokens. You agree to immediately notify S2S Matrimony of any unauthorized use or security breach.

To protect all community members, S2S Matrimony reserves the right to verify member identities through mobile OTP, email verification, Aadhaar/Govt ID verification, or phone screening. Profiles found with fraudulent or misleading information will be permanently deactivated without refund.

# Section 04
## Community Guidelines & Code of Conduct
You agree not to engage in any prohibited activities on the platform:

### Financial Solicitation Strictly Prohibited
Never ask for money, wire transfers, bank account details, luxury gifts, loans, or investments from any member on the platform. Any financial request should be reported to our safety desk immediately.

### Obscene, Defamatory or Abusive Content
Posting obscene photos, sending abusive or sexually explicit messages, making defamatory remarks, or harassing members or their families is strictly forbidden and constitutes a legal offense.

### Impersonation & Unauthorized Registration
Registering on behalf of an individual without their explicit written consent, or misrepresenting marital, family, educational, or financial status, is strictly prohibited.

### Automated Scraping & Data Extraction
Using bots, crawlers, spiders, or automated scripts to extract member profiles, phone numbers, biodata, or photographs is strictly illegal under cyber regulations.

# Section 05
## Membership Plans & Payment Terms
Free members can search profiles, view recommended matches, and receive interest requests. Upgrading to a paid membership tier (Silver, Gold, Elite, Platinum, Diamond) unlocks contact view credits, horoscope downloads, and direct messaging privileges.

All payments are processed through RBI-compliant, 256-bit SSL encrypted payment gateways. Membership fees are non-refundable once contact view credits or premium services have been accessed, except in verified cases of technical duplicate billing.

# Section 06
## Disclaimer & Due Diligence Advice
While S2S Matrimony implements profile verification tools and active moderation filters, users and their families are strongly advised to exercise independent due diligence before finalizing matrimonial alliances. S2S Matrimony is not an investigation agency and cannot guarantee the complete personal background, character, medical health, financial standing, or criminal history of any registrant.

Astrological calculations (Porutham, Rasi, Star, Dosham) provided on the Platform are for cultural guidance only and should be confirmed with family astrologers as per your tradition.

# Section 07
## Termination & Account Deletion
You may deactivate or permanently delete your account at any time from your account settings. S2S Matrimony reserves the right to suspend or permanently terminate accounts found violating community guidelines, indulging in extortion, providing fake credentials, or abusing other members without prior notice.

# Section 08
## Grievance Redressal Officer & Support
In accordance with the Information Technology Act 2000 and rules made thereunder, any complaints, safety concerns, or legal notices can be addressed to our designated Grievance Officer:

**Designation:** Grievance Redressal Officer  
**Organization:** S2S Community Matrimony Pvt. Ltd.  
**Official Email:** [support@s2smatrimony.com](mailto:support@s2smatrimony.com) / [legal@s2smatrimony.com](mailto:legal@s2smatrimony.com)  
**Headquarters:** No. 42, Usman Road, T.Nagar, Chennai, Tamil Nadu - 600017, India  
**Turnaround Time:** Grievances are acknowledged within 24 business hours and resolved within 15 working days.`;

export function parseContactMarkdown(markdown: string): ContactDetails {
  const lines = (markdown || '').split('\n');
  let email = 'support@s2smatrimony.com';
  let phone = '+91 98765 43210';
  let whatsapp = '+91 98765 43210';
  let officeHours = 'Mon–Sat: 9 AM – 6 PM';
  let mediaEmail = 'press@s2smatrimony.com';
  let intro = "We're here to help you with any questions or concerns.";
  const rawOffices: ContactOffice[] = [];
  const addressLines: string[] = [];

  let currentSection = '';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      currentSection = trimmed.replace(/^#+\s+/, '').toLowerCase();
      continue;
    }

    // Key-value pairs anywhere
    const emailMatch = trimmed.match(/\*?\*?Email:\*?\*?\s*([^\s*]+@[^\s*]+)/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
      continue;
    }

    const phoneMatch = trimmed.match(/\*?\*?(?:Phone|Helpline):\*?\*?\s*([+0-9\s()-]{8,25})/i);
    if (phoneMatch) {
      phone = phoneMatch[1].trim();
      continue;
    }

    const waMatch = trimmed.match(/\*?\*?WhatsApp:\*?\*?\s*([+0-9\s()-]{8,25})/i);
    if (waMatch) {
      whatsapp = waMatch[1].trim();
      continue;
    }

    const hoursMatch = trimmed.match(/\*?\*?Office Hours:\*?\*?\s*([^*\n]+)/i);
    if (hoursMatch) {
      officeHours = hoursMatch[1].trim();
      continue;
    }

    if (currentSection.includes('media')) {
      const mediaMatch = trimmed.match(/([^\s*]+@[^\s*]+)/);
      if (mediaMatch) {
        mediaEmail = mediaMatch[1].trim();
        continue;
      }
    }

    if (currentSection.includes('get in touch')) {
      if (!trimmed.includes('**')) {
        intro = trimmed;
      }
      continue;
    }

    if (
      currentSection.includes('office') ||
      currentSection.includes('address') ||
      currentSection.includes('headquarters')
    ) {
      // Check for "- **Title:** Address" or "**Title:** Address" or "Title: Address"
      const officeMatch = trimmed.match(/^[-*•]?\s*\*?\*?([^:*]+):\*?\*?\s*(.+)$/);
      if (
        officeMatch &&
        officeMatch[1].length < 40 &&
        !officeMatch[1].toLowerCase().includes('email') &&
        !officeMatch[1].toLowerCase().includes('phone')
      ) {
        rawOffices.push({
          title: officeMatch[1].trim(),
          address: officeMatch[2].trim(),
        });
      } else {
        addressLines.push(trimmed.replace(/^[-*•]\s+/, ''));
      }
    }
  }

  // If no labeled offices found, but address lines exist, construct offices from address lines
  if (rawOffices.length === 0 && addressLines.length > 0) {
    if (addressLines.length === 1) {
      rawOffices.push({
        title: 'Main Office',
        address: addressLines[0],
      });
    } else {
      rawOffices.push({
        title: 'Headquarters & Office',
        address: addressLines.join('\n'),
      });
    }
  }

  // Default fallback offices if none parsed
  const offices =
    rawOffices.length > 0
      ? rawOffices
      : [
          { title: 'Chennai HQ', address: 'No. 42, Usman Road, T.Nagar, Chennai - 600017' },
          { title: 'Coimbatore Regional Office', address: '104 DB Road, RS Puram, Coimbatore - 641002' },
          { title: 'Madurai Regional Office', address: '18 KK Nagar Main Road, Madurai - 625020' },
        ];

  // Footer address: use first office or addressLines
  let fullAddress = 'No. 42, Usman Road, T.Nagar, Chennai - 600017';
  if (rawOffices.length > 0) {
    fullAddress = rawOffices[0].address;
  } else if (addressLines.length > 0) {
    fullAddress = addressLines.join('\n');
  }

  return {
    email,
    phone,
    whatsapp,
    officeHours,
    mediaEmail,
    intro,
    offices,
    fullAddress,
  };
}

export interface SystemSettingsState {
  logoUrl: string;
  faviconUrl: string;
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  enableBiodataForm: boolean;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  contactMarkdown: string;
  contact: ContactDetails;
  aboutMarkdown: string;
  privacyMarkdown: string;
  termsMarkdown: string;

  // Actions
  setSettings: (settings: Partial<SystemSettingsState>) => void;
  setLogoUrl: (url: string) => void;
  setContactMarkdown: (markdown: string) => void;
  setAboutMarkdown: (markdown: string) => void;
  setPrivacyMarkdown: (markdown: string) => void;
  setTermsMarkdown: (markdown: string) => void;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SystemSettingsState>()(
  persist(
    (set) => ({
      logoUrl: '/images/logo.png',
      faviconUrl: '/favicon.ico',
      siteName: 'S2S Community Matrimony',
      tagline: 'Find Your Perfect Match',
      primaryColor: '#E11D48',
      secondaryColor: '#0D9488',
      supportEmail: 'support@s2smatrimony.com',
      supportPhone: '+91 98765 43210',
      maintenanceMode: false,
      enableBiodataForm: true,
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
      contactMarkdown: DEFAULT_CONTACT_MARKDOWN,
      contact: parseContactMarkdown(DEFAULT_CONTACT_MARKDOWN),
      aboutMarkdown: DEFAULT_ABOUT_MARKDOWN,
      privacyMarkdown: DEFAULT_PRIVACY_MARKDOWN,
      termsMarkdown: DEFAULT_TERMS_MARKDOWN,

      setSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      setLogoUrl: (logoUrl) => set({ logoUrl }),
      setContactMarkdown: (markdown: string) =>
        set((state) => {
          const parsed = parseContactMarkdown(markdown);
          return {
            ...state,
            contactMarkdown: markdown,
            contact: parsed,
            supportEmail: parsed.email || state.supportEmail,
            supportPhone: parsed.phone || state.supportPhone,
          };
        }),
      setAboutMarkdown: (markdown: string) =>
        set((state) => ({
          ...state,
          aboutMarkdown: markdown,
        })),
      setPrivacyMarkdown: (markdown: string) =>
        set((state) => ({
          ...state,
          privacyMarkdown: markdown,
        })),
      setTermsMarkdown: (markdown: string) =>
        set((state) => ({
          ...state,
          termsMarkdown: markdown,
        })),

      fetchSettings: async () => {
        try {
          const res = await api.get('/settings/public');
          const data = res.data?.data || res.data;
          if (data && typeof data === 'object') {
            set((state) => ({
              ...state,
              logoUrl: data.logoUrl || state.logoUrl,
              faviconUrl: data.faviconUrl || state.faviconUrl,
              siteName: data.siteName || state.siteName,
              tagline: data.tagline || state.tagline,
              primaryColor: data.primaryColor || state.primaryColor,
              secondaryColor: data.secondaryColor || state.secondaryColor,
              supportEmail: data.supportEmail || state.supportEmail,
              supportPhone: data.supportPhone || state.supportPhone,
              maintenanceMode:
                data.maintenanceMode !== undefined
                  ? Boolean(data.maintenanceMode === true || data.maintenanceMode === 'true')
                  : state.maintenanceMode,
              enableBiodataForm:
                data.enableBiodataForm !== undefined
                  ? data.enableBiodataForm === true || data.enableBiodataForm === 'true'
                  : state.enableBiodataForm,
              facebookUrl: data.facebookUrl || state.facebookUrl,
              instagramUrl: data.instagramUrl || state.instagramUrl,
              twitterUrl: data.twitterUrl || state.twitterUrl,
              youtubeUrl: data.youtubeUrl || state.youtubeUrl,
            }));
          }
        } catch {
          // Keep current settings
        }

        try {
          const pagesRes = await api.get('/static-pages/public').catch(() => api.get('/admin/static-pages'));
          const pagesData = pagesRes.data?.data || pagesRes.data;
          if (pagesData && typeof pagesData === 'object') {
            if (pagesData.contact) {
              const parsed = parseContactMarkdown(pagesData.contact);
              set((state) => ({
                ...state,
                contactMarkdown: pagesData.contact,
                contact: parsed,
                supportEmail: parsed.email || state.supportEmail,
                supportPhone: parsed.phone || state.supportPhone,
              }));
            }
            if (pagesData.about) {
              set((state) => ({
                ...state,
                aboutMarkdown: pagesData.about,
              }));
            }
            if (pagesData.privacy) {
              const cleanPrivacy =
                pagesData.privacy.includes('Effective Date: January 1, 2024') && pagesData.privacy.length < 600
                  ? DEFAULT_PRIVACY_MARKDOWN
                  : pagesData.privacy;
              set((state) => ({
                ...state,
                privacyMarkdown: cleanPrivacy,
              }));
            }
            if (pagesData.terms) {
              const cleanTerms =
                pagesData.terms.includes('Effective Date: January 1, 2024') && pagesData.terms.length < 600
                  ? DEFAULT_TERMS_MARKDOWN
                  : pagesData.terms;
              set((state) => ({
                ...state,
                termsMarkdown: cleanTerms,
              }));
            }
          }
        } catch {
          // Keep current contact info
        }
      },
    }),
    {
      name: 's2s-settings-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
