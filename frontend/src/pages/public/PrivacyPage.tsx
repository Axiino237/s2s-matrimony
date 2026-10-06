import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useSettingsStore, DEFAULT_PRIVACY_MARKDOWN } from '../../store/settings.store';

interface ParsedPrivacySection {
  badge?: string;
  title: string;
  items: Array<
    | { type: 'heading3'; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'key-value'; label: string; value: string }
  >;
}

function renderFormattedText(text: string) {
  // Parse markdown links [text](url) and bold **bold**
  const tokenRegex = /(\[.+?\]\(.+?\))|(\*\*.+?\*\*)/g;
  const parts = text.split(tokenRegex).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith('http');
      const isEmail = linkMatch[2].startsWith('mailto:');
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="text-primary font-medium hover:underline"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function normalizePrivacyText(raw: string): string {
  let text = (raw || '').trim();
  if (!text) return DEFAULT_PRIVACY_MARKDOWN;

  // 1. Separate combined titles if pasted directly from screen (e.g. "Core PrinciplesOur Privacy Promises to Members")
  text = text.replace(/^(Core Principles)\s*(Our Privacy Promises to Members)/gm, '# $1\n## $2');
  text = text.replace(/^(Section 0[1-7])\s*([A-Za-z &,-]+)$/gm, '# $1\n## $2');

  // 2. Normalize known sections if typed without markdown '#'
  const knownSections = [
    { badge: 'Core Principles', title: 'Our Privacy Promises to Members' },
    { badge: 'Section 01', title: 'Information We Collect' },
    { badge: 'Section 02', title: 'How We Use Your Information' },
    { badge: 'Section 03', title: 'Your Privacy Settings & Controls' },
    { badge: 'Section 04', title: 'Information Sharing & Third-Party Disclosure' },
    { badge: 'Section 05', title: 'Data Security & Encryption Standards' },
    { badge: 'Section 06', title: 'Your Data Rights & Profile Deletion' },
    { badge: 'Section 07', title: 'Grievance Redressal Officer & Contact Information' },
  ];

  knownSections.forEach(({ badge, title }) => {
    const badgeEsc = badge.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const titleEsc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const combinedReg = new RegExp(`^(?!#+\\s*)${badgeEsc}\\s*\\n*${titleEsc}`, 'gm');
    text = text.replace(combinedReg, `# ${badge}\n## ${title}`);

    const singleTitleReg = new RegExp(`^(?!#+\\s*)${titleEsc}\\s*$`, 'gm');
    text = text.replace(singleTitleReg, `## ${title}`);
  });

  // 3. Normalize known subsections if typed without '###'
  const knownSubsections = [
    'No Public Phone Numbers or Contact Harvesting',
    'Anti-Theft Photo Protection & Granular Visibility',
    'Anti-Theft Photo Watermarking & Anonymous Blur Protection',
    'Zero Commercial Advertising & No Third-Party Data Sales',
    'Basic Account & Identity Credentials',
    'Matrimonial Profile & Background Details',
    'Family Information & Lifestyle Preferences',
    'Astrological & Horoscope Data',
    'Verification & Audit Records',
    'Technical & Platform Interaction Data',
    'Matchmaking & Astrological Compatibility Calculations',
    'Communication Alerts & Member Notifications',
    'Safety Moderation & Bad Actor Prevention',
    'Subscription Billing & Customer Assistance',
    'Contact Number Visibility Controls',
    'Incognito Mode & Temporary Profile Deactivation',
    'Display to Registered Members',
    'Secure Payment Processors',
    'Transactional SMS & Email Gateways',
    'Legal Compliance & Law Enforcement',
    'End-to-End Transport Layer Security (TLS / SSL)',
    'End-to-End Transport Layer Security (TLS/SSL)',
    'Cryptographic Salted Password Hashing',
    'Role-Based Access Controls (RBAC) & Immutable Audit Logging',
    'Automated Vulnerability Monitoring',
    'Right to Access & Rectify',
    'Right to Data Portability',
    'Right to Permanent Account Erasure',
  ];

  knownSubsections.forEach((sub) => {
    const subEsc = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subReg = new RegExp(`^(?!#+\\s*)${subEsc}\\s*$`, 'gm');
    text = text.replace(subReg, `### ${sub}`);
  });

  return text;
}

function parsePrivacyMarkdown(rawMarkdown: string): ParsedPrivacySection[] {
  const content = normalizePrivacyText(rawMarkdown);
  const lines = content.split('\n');
  const sections: ParsedPrivacySection[] = [];
  let currentSection: ParsedPrivacySection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      const badgeCandidate = line.replace(/^#\s+/, '').trim();
      let titleCandidate = badgeCandidate;
      let badge: string | undefined = undefined;

      // Check if next non-empty line is ##
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) nextIdx++;
      if (nextIdx < lines.length && lines[nextIdx].trim().startsWith('## ')) {
        badge = badgeCandidate;
        titleCandidate = lines[nextIdx].trim().replace(/^##\s+/, '').trim();
        i = nextIdx;
      }

      currentSection = {
        badge,
        title: titleCandidate,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith('## ')) {
      const title = line.replace(/^##\s+/, '').trim();
      currentSection = {
        title,
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = {
        title: 'Privacy Policy',
        items: [],
      };
      sections.push(currentSection);
    }

    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').trim();
      currentSection.items.push({ type: 'heading3', text });
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const itemText = line.replace(/^[-*]\s+/, '').trim();
      const lastItem = currentSection.items[currentSection.items.length - 1];
      if (lastItem && lastItem.type === 'list') {
        lastItem.items.push(itemText);
      } else {
        currentSection.items.push({ type: 'list', items: [itemText] });
      }
      continue;
    }

    // Key-value pair lines
    const kvMatch = line.match(/^\*{0,2}(Designation|Organization|Official Email|Email|Headquarters|Turnaround Time|Location)\*{0,2}:\s*(.+)$/i);
    if (kvMatch) {
      currentSection.items.push({
        type: 'key-value',
        label: kvMatch[1].trim(),
        value: kvMatch[2].trim(),
      });
      continue;
    }

    // Regular paragraph
    currentSection.items.push({ type: 'paragraph', text: line });
  }

  return sections;
}

export const PrivacyPage = () => {
  const settingsStore = useSettingsStore();
  const [content, setContent] = useState<string>(
    settingsStore.privacyMarkdown || DEFAULT_PRIVACY_MARKDOWN
  );

  useEffect(() => {
    // Dynamically fetch public static pages content from API
    api
      .get('/static-pages/public')
      .then((res) => {
        const raw = res.data?.privacy || res.data?.data?.privacy;
        if (raw && typeof raw === 'string' && raw.trim()) {
          // If database still contains the legacy 15-line stub, ignore and keep DEFAULT_PRIVACY_MARKDOWN
          if (raw.includes('Effective Date: January 1, 2024') && raw.length < 600) {
            setContent(DEFAULT_PRIVACY_MARKDOWN);
            settingsStore.setPrivacyMarkdown(DEFAULT_PRIVACY_MARKDOWN);
          } else {
            setContent(raw);
            settingsStore.setPrivacyMarkdown(raw);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Sync if changed dynamically in store during same session
  useEffect(() => {
    if (settingsStore.privacyMarkdown && settingsStore.privacyMarkdown !== content) {
      setContent(settingsStore.privacyMarkdown);
    }
  }, [settingsStore.privacyMarkdown]);

  const parsedSections = useMemo(() => parsePrivacyMarkdown(content), [content]);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-20">
      {/* Full Width Header Banner */}
      <div className="w-full bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 2xl:px-40 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="w-full relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-400/15 border border-emerald-300/30 rounded-full px-3.5 py-1 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Privacy & Data Security
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Privacy{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-4xl leading-relaxed">
            Your trust, family dignity, and personal safety are the cornerstone of S2S Community Matrimony. Here is our comprehensive commitment to safeguarding your data and privacy.
          </p>
          <div className="pt-2 text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-3">
            <span>Last Updated: January 1, 2026</span>
            <span>•</span>
            <span>Effective Immediately</span>
            <span>•</span>
            <span>GDPR & DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </div>

      {/* Full Width Content — No Boxed / Middle Container */}
      <div className="w-full px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 2xl:px-40 py-12 sm:py-16 space-y-12 sm:space-y-14 text-sm sm:text-base leading-relaxed text-slate-700">
        {parsedSections.map((section, sIdx) => (
          <section key={sIdx} className="space-y-5">
            <div className="border-b border-slate-200 pb-3">
              {section.badge && (
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {section.badge}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-slate-900 mt-1">
                {section.title}
              </h2>
            </div>

            <div className="space-y-5 pt-1">
              {section.items.map((item, iIdx) => {
                if (item.type === 'heading3') {
                  return (
                    <div key={iIdx} className="pt-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                        {renderFormattedText(item.text)}
                      </h3>
                    </div>
                  );
                }

                if (item.type === 'list') {
                  return (
                    <ul key={iIdx} className="space-y-2 pl-6 sm:pl-8 list-disc text-slate-700">
                      {item.items.map((li, lIdx) => (
                        <li key={lIdx}>{renderFormattedText(li)}</li>
                      ))}
                    </ul>
                  );
                }

                if (item.type === 'key-value') {
                  return (
                    <div key={iIdx} className="pl-5 border-l-2 border-primary/40 py-0.5 text-sm sm:text-base">
                      <strong className="text-slate-900 font-semibold">{item.label}: </strong>
                      <span className="text-slate-700">{renderFormattedText(item.value)}</span>
                    </div>
                  );
                }

                return (
                  <p key={iIdx} className="text-slate-700 pl-5 text-sm sm:text-base leading-relaxed">
                    {renderFormattedText(item.text)}
                  </p>
                );
              })}
            </div>
          </section>
        ))}

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Free Registration
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
            <span>•</span>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
