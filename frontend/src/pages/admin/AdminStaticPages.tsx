import { useState } from 'react';
import { FileText, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

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
S2S Community Matrimony Pvt. Ltd.
Chennai, Tamil Nadu, India

## For Media Inquiries
press@s2smatrimony.com`,
};

const AdminStaticPages = () => {
  const [activePage, setActivePage] = useState('about');
  const [contents, setContents] = useState<Record<string, string>>(INITIAL_CONTENT);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    toast.success('Page content saved successfully!');
    setSaving(false);
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

        {/* Editor */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{currentPage?.label}</h2>
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
                rows={22}
                className="w-full px-5 py-4 text-sm font-mono text-slate-800 border-none resize-none focus:outline-none bg-slate-50/50"
                placeholder="Write page content in Markdown format..."
              />
            )}

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-400">Supports Markdown: # Heading, ## Subheading, **bold**, - list items</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
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
