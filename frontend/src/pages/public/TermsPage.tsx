import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useSettingsStore, DEFAULT_TERMS_MARKDOWN } from '../../store/settings.store';

interface ParsedTermsSection {
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

function normalizeTermsText(raw: string): string {
  let text = (raw || '').trim();
  if (!text) return DEFAULT_TERMS_MARKDOWN;

  // 1. Separate combined titles if pasted directly from screen (e.g. "Key HighlightsKey Highlights for Members")
  text = text.replace(/^(Key Highlights)\s*(Key Highlights for Members)/gm, '# $1\n## $2');
  text = text.replace(/^(Section 0[1-8])\s*([A-Za-z &,-]+)$/gm, '# $1\n## $2');

  // 2. Normalize known sections if typed without markdown '#'
  const knownSections = [
    { badge: 'Key Highlights', title: 'Key Highlights for Members' },
    { badge: 'Section 01', title: 'Acceptance of Terms' },
    { badge: 'Section 02', title: 'Eligibility Requirements' },
    { badge: 'Section 03', title: 'Account Security & Verification' },
    { badge: 'Section 04', title: 'Community Guidelines & Code of Conduct' },
    { badge: 'Section 05', title: 'Membership Plans & Payment Terms' },
    { badge: 'Section 06', title: 'Disclaimer & Due Diligence Advice' },
    { badge: 'Section 07', title: 'Termination & Account Deletion' },
    { badge: 'Section 08', title: 'Grievance Redressal Officer & Support' },
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
    'Authentic Matrimonial Profiles Only',
    'Legal Age & Marital Status Eligibility',
    'Strict Privacy & Mutual Safety Protection',
    'Minimum Legal Marriageable Age',
    'Legally Recognized Marital Status',
    'Genuine Matrimonial Intent',
    'Truthfulness & Data Authenticity',
    'Financial Solicitation Strictly Prohibited',
    'Obscene, Defamatory or Abusive Content',
    'Impersonation & Unauthorized Registration',
    'Automated Scraping & Data Extraction',
  ];

  knownSubsections.forEach((sub) => {
    const subEsc = sub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subReg = new RegExp(`^(?!#+\\s*)${subEsc}\\s*$`, 'gm');
    text = text.replace(subReg, `### ${sub}`);
  });

  return text;
}

function parseTermsMarkdown(rawMarkdown: string): ParsedTermsSection[] {
  const content = normalizeTermsText(rawMarkdown);
  const lines = content.split('\n');
  const sections: ParsedTermsSection[] = [];
  let currentSection: ParsedTermsSection | null = null;

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
        title: 'Terms & Conditions',
        items: [],
      };
      sections.push(currentSection);
    }

    if (line.startsWith('### ')) {
      const subHeading = line.replace(/^###\s+/, '').trim();
      currentSection.items.push({ type: 'heading3', text: subHeading });
      continue;
    }

    // Key-value pairs: **Key:** Value
    const kvMatch = line.match(/^\*\*([^:]+):\*\*\s*(.*)$/);
    if (kvMatch) {
      currentSection.items.push({
        type: 'key-value',
        label: kvMatch[1].trim(),
        value: kvMatch[2].trim(),
      });
      continue;
    }

    // Bullet points: - item or * item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[-*]\s+/, '').trim();
      const lastItem = currentSection.items[currentSection.items.length - 1];
      if (lastItem && lastItem.type === 'list') {
        lastItem.items.push(bulletText);
      } else {
        currentSection.items.push({ type: 'list', items: [bulletText] });
      }
      continue;
    }

    // Regular paragraph
    currentSection.items.push({ type: 'paragraph', text: line });
  }

  return sections;
}

export const TermsPage = () => {
  const settingsStore = useSettingsStore();
  const [content, setContent] = useState<string>(
    settingsStore.termsMarkdown || DEFAULT_TERMS_MARKDOWN
  );

  useEffect(() => {
    // Dynamically fetch public static pages content from API
    api
      .get('/static-pages/public')
      .then((res) => {
        const raw = res.data?.terms || res.data?.data?.terms;
        if (raw && typeof raw === 'string' && raw.trim()) {
          // If database contains legacy 15-line stub, ignore and keep DEFAULT_TERMS_MARKDOWN
          if (raw.includes('Effective Date: January 1, 2024') && raw.length < 600) {
            setContent(DEFAULT_TERMS_MARKDOWN);
            settingsStore.setTermsMarkdown(DEFAULT_TERMS_MARKDOWN);
          } else {
            setContent(raw);
            settingsStore.setTermsMarkdown(raw);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Sync if changed dynamically in store during same session
  useEffect(() => {
    if (settingsStore.termsMarkdown && settingsStore.termsMarkdown !== content) {
      setContent(settingsStore.termsMarkdown);
    }
  }, [settingsStore.termsMarkdown]);

  const parsedSections = useMemo(() => parseTermsMarkdown(content), [content]);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-20">
      {/* Full Width Header Banner */}
      <div className="w-full bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 2xl:px-40 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="w-full relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-300/30 rounded-full px-3.5 py-1 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Legal Agreement & Terms of Service
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Terms &{' '}
            <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-4xl leading-relaxed">
            Please review these terms and conditions carefully before creating an account or using S2S Community Matrimony. They govern your rights, membership responsibilities, and use of our platform.
          </p>
          <div className="pt-2 text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-3">
            <span>Last Updated: January 1, 2026</span>
            <span>•</span>
            <span>Effective Immediately</span>
            <span>•</span>
            <span>Legally Binding User Agreement</span>
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
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
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

export default TermsPage;
