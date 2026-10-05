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
  enableBiodataForm: boolean;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  contactMarkdown: string;
  contact: ContactDetails;

  // Actions
  setSettings: (settings: Partial<SystemSettingsState>) => void;
  setLogoUrl: (url: string) => void;
  setContactMarkdown: (markdown: string) => void;
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
      enableBiodataForm: true,
      facebookUrl: 'https://www.facebook.com/s2smatrimony',
      instagramUrl: 'https://www.instagram.com/s2smatrimony',
      twitterUrl: 'https://x.com/s2smatrimony',
      youtubeUrl: 'https://www.youtube.com/@s2smatrimony',
      contactMarkdown: DEFAULT_CONTACT_MARKDOWN,
      contact: parseContactMarkdown(DEFAULT_CONTACT_MARKDOWN),

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
          if (pagesData && typeof pagesData === 'object' && pagesData.contact) {
            const parsed = parseContactMarkdown(pagesData.contact);
            set((state) => ({
              ...state,
              contactMarkdown: pagesData.contact,
              contact: parsed,
              supportEmail: parsed.email || state.supportEmail,
              supportPhone: parsed.phone || state.supportPhone,
            }));
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
