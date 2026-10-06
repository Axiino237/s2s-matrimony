import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building, ArrowRight, Mail } from 'lucide-react';
import api from '../../services/api';
import { useSettingsStore, DEFAULT_ABOUT_MARKDOWN } from '../../store/settings.store';

// Helper to render bold markdown (**text**)
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface ParsedSection {
  badge?: string;
  title?: string;
  items: Array<
    | { type: 'heading3'; text: string; subtitle?: string }
    | { type: 'timeline'; year: string; title: string; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; items: string[] }
  >;
}

function parseAboutMarkdown(rawMarkdown: string): ParsedSection[] {
  let content = rawMarkdown || DEFAULT_ABOUT_MARKDOWN;

  // Auto-normalize if text was pasted without markdown headers (# or ##)
  if (!content.includes('# ') && !content.includes('## ')) {
    const knownSections = [
      'Overview',
      'Our Mission',
      'Trust & Safety',
      'Our Values',
      'Evolution',
      'Member Care',
    ];

    knownSections.forEach((s) => {
      const reg = new RegExp(`^${s}\\s*$`, 'gm');
      content = content.replace(reg, `# ${s}`);
    });
  }

  const lines = content.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { items: [] };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i++;
      continue;
    }

    // Check for Section H1 (# Badge / Category)
    if (line.startsWith('# ')) {
      if (currentSection.badge || currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      const badgeText = line.replace(/^#\s+/, '').trim();
      currentSection = { badge: badgeText, items: [] };

      // If next non-empty line is H2 (## Title) or plain line acting as title
      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) {
        nextIdx++;
      }
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx].trim();
        if (nextLine.startsWith('## ')) {
          currentSection.title = nextLine.replace(/^##\s+/, '').trim();
          i = nextIdx;
        } else if (!nextLine.startsWith('#') && nextLine.length < 90) {
          currentSection.title = nextLine;
          i = nextIdx;
        }
      }
      i++;
      continue;
    }

    // Check for Section H2 (## Title) without preceding #
    if (line.startsWith('## ')) {
      if (currentSection.badge || currentSection.title || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      const titleText = line.replace(/^##\s+/, '').trim();
      currentSection = { title: titleText, items: [] };
      i++;
      continue;
    }

    // Check for Timeline item: e.g. "### 2019 — Platform Inception" or "2019 — ..."
    const timelineMatch = line.match(/^(?:###\s*)?(\d{4}\s*[—–-]\s*[^:\n]+)$/);
    if (timelineMatch) {
      const yearTitle = timelineMatch[1].trim();
      let subtitle = '';
      let text = '';

      let nextIdx = i + 1;
      while (nextIdx < lines.length && !lines[nextIdx].trim()) {
        nextIdx++;
      }
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx].trim();
        if (nextLine.startsWith('#### ') || (!nextLine.startsWith('#') && nextLine.length < 60)) {
          subtitle = nextLine.replace(/^####\s+/, '').trim();
          nextIdx++;
          while (nextIdx < lines.length && !lines[nextIdx].trim()) {
            nextIdx++;
          }
        }
      }

      if (nextIdx < lines.length && !lines[nextIdx].trim().startsWith('#')) {
        text = lines[nextIdx].trim();
        i = nextIdx;
      } else {
        i = nextIdx - 1;
      }

      currentSection.items.push({
        type: 'timeline',
        year: yearTitle,
        title: subtitle,
        text,
      });
      i++;
      continue;
    }

    // Check for Subsection H3 (### Title)
    if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '').trim();
      currentSection.items.push({
        type: 'heading3',
        text: headingText,
      });
      i++;
      continue;
    }

    // Check for list items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.startsWith('- ') || l.startsWith('* ')) {
          listItems.push(l.replace(/^[-*]\s+/, '').trim());
          i++;
        } else if (!l) {
          i++;
        } else {
          break;
        }
      }
      currentSection.items.push({ type: 'list', items: listItems });
      continue;
    }

    // Single or multi-line paragraph
    const pLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || l.startsWith('#') || l.startsWith('- ') || l.startsWith('* ')) {
        break;
      }
      pLines.push(l);
      i++;
    }

    currentSection.items.push({
      type: 'paragraph',
      text: pLines.join(' '),
    });
  }

  if (currentSection.badge || currentSection.title || currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

export const AboutPage = () => {
  const storeAbout = useSettingsStore((s) => s.aboutMarkdown);
  const setAboutMarkdown = useSettingsStore((s) => s.setAboutMarkdown);
  const [content, setContent] = useState<string>(storeAbout || DEFAULT_ABOUT_MARKDOWN);

  useEffect(() => {
    // Fetch live content from public static pages API
    api
      .get('/static-pages/public')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && typeof data === 'object' && data.about) {
          setContent(data.about);
          setAboutMarkdown(data.about);
        }
      })
      .catch(() => {});
  }, [setAboutMarkdown]);

  // Keep state in sync if store updates
  useEffect(() => {
    if (storeAbout) {
      setContent(storeAbout);
    }
  }, [storeAbout]);

  const parsedSections = useMemo(() => parseAboutMarkdown(content), [content]);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="w-full relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 rounded-full px-3.5 py-1 text-primary-300 text-xs font-bold uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-rose-400" /> S2S Community Matrimony
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            About{' '}
            <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              Our Journey
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-4xl leading-relaxed">
            Connecting hearts within communities. Built on trust, cultural heritage, and modern matchmaking technology to help you find your ideal life partner.
          </p>
          <div className="pt-2 text-xs text-slate-400 flex items-center gap-3 sm:gap-4 flex-wrap">
            <span>Founded in 2019</span>
            <span>•</span>
            <span>50,000+ Active Members</span>
            <span>•</span>
            <span>200+ Communities</span>
            <span>•</span>
            <span>10,000+ Happy Marriages</span>
          </div>
        </div>
      </div>

      {/* Full Width Editorial Content */}
      <div className="w-full px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 py-12 sm:py-16 space-y-12 sm:space-y-14 text-sm sm:text-base leading-relaxed text-slate-700">
        {parsedSections.map((section, sIdx) => (
          <section key={sIdx} className="space-y-5">
            {(section.badge || section.title) && (
              <div className="border-b border-slate-200 pb-3">
                {section.badge && (
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {section.badge}
                  </span>
                )}
                {section.title && (
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-slate-900 mt-1">
                    {section.title}
                  </h2>
                )}
              </div>
            )}

            <div className="space-y-4">
              {section.items.map((item, iIdx) => {
                if (item.type === 'heading3') {
                  return (
                    <div key={iIdx} className="pt-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        {item.text}
                      </h3>
                    </div>
                  );
                }

                if (item.type === 'timeline') {
                  return (
                    <div key={iIdx} className="border-l-2 border-primary/50 pl-5 py-1 space-y-1">
                      <span className="text-xs font-bold text-primary block">{item.year}</span>
                      {item.title && (
                        <h4 className="font-semibold text-slate-900 text-base sm:text-lg">
                          {item.title}
                        </h4>
                      )}
                      {item.text && (
                        <p className="text-slate-600 text-sm sm:text-base">
                          {renderFormattedText(item.text)}
                        </p>
                      )}
                    </div>
                  );
                }

                if (item.type === 'list') {
                  return (
                    <ul key={iIdx} className="space-y-2 pl-4 sm:pl-5 list-disc text-slate-700">
                      {item.items.map((li, lIdx) => (
                        <li key={lIdx}>{renderFormattedText(li)}</li>
                      ))}
                    </ul>
                  );
                }

                if (item.type === 'paragraph') {
                  return (
                    <p key={iIdx} className="leading-relaxed text-slate-700">
                      {renderFormattedText(item.text)}
                    </p>
                  );
                }

                return null;
              })}
            </div>
          </section>
        ))}

        {/* Section: Conclusion & Call to Action */}
        <section id="join" className="border-t border-slate-200 pt-8 sm:pt-10 space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-slate-900">
            Begin Your Matrimonial Journey with Confidence
          </h2>
          <p className="text-slate-600">
            Whether you are taking the very first step in your partner search or continuing your journey on behalf of a family member, S2S Community Matrimony is here to support you at every milestone.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors shadow-sm"
            >
              <span>Create Free Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/success-stories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <span>Read Success Stories</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-500" />
              <span>Contact Our Team</span>
            </Link>
          </div>
        </section>

        {/* Quick Footer Navigation Links */}
        <div className="border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <Link to="/" className="text-primary font-bold hover:underline">
            ← Back to Home
          </Link>
          <div className="flex gap-4 flex-wrap">
            <Link to="/membership" className="hover:underline">Membership Plans</Link>
            <span>•</span>
            <Link to="/faq" className="hover:underline">FAQ Help Center</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
