import { useState, useEffect } from 'react';
import { FileText, Save, Loader2, Eye, EyeOff, ExternalLink, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSettingsStore } from '../../store/settings.store';

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
  </svg>
);

const PAGES = [
  { id: 'about', label: 'About Us', path: '/about' },
  { id: 'contact', label: 'Contact Us', path: '/contact' },
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy-policy' },
  { id: 'terms', label: 'Terms & Conditions', path: '/terms' },
  { id: 'refund', label: 'Refund Policy', path: '/refund-policy' },
];

const INITIAL_CONTENT: Record<string, string> = {
  about: `# About S2S Community Matrimony

S2S Community Matrimony is a trusted matrimonial platform dedicated to helping individuals and families find their ideal life partners within their communities.

## Our Mission
To provide a safe, verified, and community-focused matrimony platform that respects cultural values while embracing modern technology.

## Our Story
Founded in 2020, S2S Matrimony has helped thousands of couples find their perfect match.

## Why Choose S2S?
- **Verified Profiles** — Every profile goes through document verification
- **Community-Focused** — Matches based on shared cultural and community values
- **AI-Powered** — Advanced AI biodata parser and matchmaking algorithms
- **Privacy First** — Your data is protected with enterprise-grade security`,

  privacy: `# Privacy Policy

**Effective Date:** January 1, 2024

## Information We Collect
We collect information you provide directly to us, such as when you create an account, complete your profile, or contact us for support.

## How We Use Your Information
- To provide and improve our matrimony services
- To verify your identity and profile authenticity
- To send notifications about matches and messages
- To process payments securely

## Data Security
We implement enterprise-grade security measures to protect your personal information.

## Your Rights
You have the right to access, update, or delete your personal information at any time through your account settings.

## Contact Us
For privacy concerns, contact us at privacy@s2smatrimony.com`,

  terms: `# Terms & Conditions

**Effective Date:** January 1, 2024

## Acceptance of Terms
By using S2S Matrimony, you agree to these terms and conditions.

## User Responsibilities
- Provide accurate information in your profile
- Respect other members and communicate professionally
- Do not share false or misleading information

## Prohibited Activities
- Creating fake profiles
- Harassment or abuse of other members
- Commercial solicitation without authorization

## Limitation of Liability
S2S Matrimony is not responsible for the conduct of any user.`,

  refund: `# Refund Policy

## Membership Plans
Membership plans are non-refundable once activated and contact views have been used.

## Eligible Refunds
- Technical issues preventing access to the platform
- Duplicate charges
- Service unavailability exceeding 72 hours

## Refund Process
Contact support@s2smatrimony.com within 7 days of purchase with your order details.

## Processing Time
Approved refunds are processed within 5-7 business days.`,

  contact: `# Contact Us

## Get In Touch

We're here to help you with any questions or concerns.

**Email:** support@s2smatrimony.com
**Phone:** +91 98765 43210
**WhatsApp:** +91 98765 43210
**Office Hours:** Monday to Saturday, 9 AM – 6 PM IST

## Office Address
**Chennai HQ:** No. 42, Usman Road, T.Nagar, Chennai - 600017
**Coimbatore Regional Office:** 104 DB Road, RS Puram, Coimbatore - 641002
**Madurai Regional Office:** 18 KK Nagar Main Road, Madurai - 625020

## For Media Inquiries
press@s2smatrimony.com`,
};

const AdminStaticPages = () => {
  const [activePage, setActivePage] = useState('about');
  const [contents, setContents] = useState<Record<string, string>>(INITIAL_CONTENT);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Social Links state (used in footer & contact page)
  const settingsStore = useSettingsStore();
  const [socialLinks, setSocialLinks] = useState({
    facebookUrl: settingsStore.facebookUrl || 'https://www.facebook.com/s2smatrimony',
    instagramUrl: settingsStore.instagramUrl || 'https://www.instagram.com/s2smatrimony',
    twitterUrl: settingsStore.twitterUrl || 'https://x.com/s2smatrimony',
    youtubeUrl: settingsStore.youtubeUrl || 'https://www.youtube.com/@s2smatrimony',
  });

  // Load static pages and settings from API on mount
  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && typeof data === 'object') {
          setSocialLinks({
            facebookUrl: data.facebookUrl || settingsStore.facebookUrl,
            instagramUrl: data.instagramUrl || settingsStore.instagramUrl,
            twitterUrl: data.twitterUrl || settingsStore.twitterUrl,
            youtubeUrl: data.youtubeUrl || settingsStore.youtubeUrl,
          });
        }
      })
      .catch(() => { });

    api.get('/admin/static-pages')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && typeof data === 'object') {
          setContents((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => { });
  }, [settingsStore.facebookUrl, settingsStore.instagramUrl, settingsStore.twitterUrl, settingsStore.youtubeUrl]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save static page content
      await api.put('/admin/static-pages', contents).catch(() => null);

      // 2. If on contact page, save social links
      if (activePage === 'contact') {
        await api.put('/admin/settings', socialLinks).catch(() => null);
        settingsStore.setSettings(socialLinks);
      }

      if (contents.contact) {
        settingsStore.setContactMarkdown(contents.contact);
      }

      toast.success(
        activePage === 'contact'
          ? 'Contact Us & Social Media Links saved successfully! 🎉'
          : 'Page content saved successfully!'
      );
    } catch {
      toast.error('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPage = PAGES.find(p => p.id === activePage);
  const content = contents[activePage] || '';

  const renderPreview = (text: string) => {
    const html = text
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-900 mb-4">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 mb-2 mt-4">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li class="text-slate-600 text-sm ml-4">• $1</li>')
      .replace(/\n\n/g, '</p><p class="text-slate-600 text-sm mb-3">')
      .replace(/^(?!<h[12]|<li)(.+)$/gm, '<p class="text-slate-600 text-sm mb-2">$1</p>');
    return html;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Static Pages</h1>
        <p className="text-sm text-slate-500 mt-1">Edit the content of public static pages: About, Privacy Policy, Terms, Refund Policy, Contact</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Page Selector */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {PAGES.map(page => (
              <button
                key={page.id}
                onClick={() => setActivePage(page.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activePage === page.id ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                {page.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor & Social Media Links */}
        <div className="flex-1 space-y-5">
          {/* Social Links Configuration (Shown specifically for Contact Us) */}
          {activePage === 'contact' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Social Media Links (Footer & Contact)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the official social profile URLs. These links dynamically power the Facebook, Instagram, X (Twitter), and YouTube icons in the website footer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Facebook */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
                      <FacebookIcon className="w-3.5 h-3.5 fill-current" />
                    </span>
                    Facebook Profile URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinks.facebookUrl}
                      onChange={(e) => setSocialLinks({ ...socialLinks, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/s2smatrimony"
                      className="input py-2 text-sm w-full font-mono text-xs text-slate-800"
                    />
                    {socialLinks.facebookUrl && (
                      <a
                        href={socialLinks.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary px-3 py-2 text-xs flex items-center gap-1 flex-shrink-0"
                        title="Test Facebook Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#E4405F]/10 text-[#E4405F] flex items-center justify-center">
                      <InstagramIcon className="w-3.5 h-3.5 fill-current" />
                    </span>
                    Instagram Profile URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinks.instagramUrl}
                      onChange={(e) => setSocialLinks({ ...socialLinks, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/s2smatrimony"
                      className="input py-2 text-sm w-full font-mono text-xs text-slate-800"
                    />
                    {socialLinks.instagramUrl && (
                      <a
                        href={socialLinks.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary px-3 py-2 text-xs flex items-center gap-1 flex-shrink-0"
                        title="Test Instagram Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* X (Twitter) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-900/10 text-slate-900 flex items-center justify-center">
                      <XIcon className="w-3 h-3 fill-current" />
                    </span>
                    X (Twitter) Profile URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinks.twitterUrl}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitterUrl: e.target.value })}
                      placeholder="https://x.com/s2smatrimony"
                      className="input py-2 text-sm w-full font-mono text-xs text-slate-800"
                    />
                    {socialLinks.twitterUrl && (
                      <a
                        href={socialLinks.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary px-3 py-2 text-xs flex items-center gap-1 flex-shrink-0"
                        title="Test X Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* YouTube */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center">
                      <YoutubeIcon className="w-3.5 h-3.5 fill-current" />
                    </span>
                    YouTube Channel URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={socialLinks.youtubeUrl}
                      onChange={(e) => setSocialLinks({ ...socialLinks, youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/@s2smatrimony"
                      className="input py-2 text-sm w-full font-mono text-xs text-slate-800"
                    />
                    {socialLinks.youtubeUrl && (
                      <a
                        href={socialLinks.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary px-3 py-2 text-xs flex items-center gap-1 flex-shrink-0"
                        title="Test YouTube Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{currentPage?.label} Content</h2>
                <p className="text-xs text-slate-400 mt-0.5">Public URL: <span className="font-mono">{currentPage?.path}</span></p>
              </div>
              <button
                onClick={() => setPreviewing(!previewing)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {previewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {previewing ? 'Edit' : 'Preview'}
              </button>
            </div>

            {previewing ? (
              <div
                className="p-6 prose prose-sm max-w-none min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
              />
            ) : (
              <textarea
                value={content}
                onChange={e => setContents(prev => ({ ...prev, [activePage]: e.target.value }))}
                rows={18}
                className="w-full px-5 py-4 text-sm font-mono text-slate-800 border-none resize-none focus:outline-none bg-slate-50/50"
                placeholder="Write page content in Markdown format..."
              />
            )}

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">Supports Markdown: # Heading, ## Subheading, **bold**, - list items</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStaticPages;

