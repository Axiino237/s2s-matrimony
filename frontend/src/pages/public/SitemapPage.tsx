import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, Search, ArrowRight, ExternalLink, Compass, Shield, Users, Heart, FileText, UserCheck, HelpCircle, Phone, Lock, Sparkles } from 'lucide-react';

interface SitemapSection {
  title: string;
  icon: any;
  description: string;
  links: {
    name: string;
    path: string;
    description?: string;
    badge?: string;
  }[];
}

const SITEMAP_SECTIONS: SitemapSection[] = [
  {
    title: 'Explore & Matchmaking',
    icon: Compass,
    description: 'Find verified prospective brides and grooms across communities.',
    links: [
      { name: 'Home Landing Page', path: '/', description: 'Overview of features, community stats, and testimonials' },
      { name: 'Search Profiles', path: '/search', description: 'Multi-filter matchmaking search by age, community, education' },
      { name: 'Recommended Matches', path: '/matches', description: 'AI horoscope and preference matched profiles' },
      { name: 'Membership Plans & Pricing', path: '/membership', description: 'Compare Silver, Gold, and Platinum contact benefits' },
      { name: 'Success Stories', path: '/success-stories', description: 'Real marriage testimonials and happy couple stories' },
      { name: 'Matrimonial Blog & Guides', path: '/blog', description: 'Wedding traditions, horoscope Porutham guides, and tips' },
      { name: 'Free Public Biodata Entry Form', path: '/fill-biodata', description: 'Direct biodata entry without logging in', badge: 'Public' },
      { name: 'Blank Biodata Printable Template', path: '/print/blank-biodata', description: 'Print-ready traditional matrimonial biodata format', badge: 'Print' },
    ],
  },
  {
    title: 'Account & Membership',
    icon: UserCheck,
    description: 'Member authentication, dashboard, and subscription management.',
    links: [
      { name: 'Free Registration', path: '/register', description: 'Create your matrimonial biodata account' },
      { name: 'Member Sign In', path: '/login', description: 'Log in to your existing matrimony profile' },
      { name: 'Verify Mobile OTP', path: '/verify-otp', description: 'Secure two-factor and OTP verification' },
      { name: 'Forgot Password', path: '/forgot-password', description: 'Reset your account password via mobile / email' },
      { name: 'Member Dashboard', path: '/dashboard', description: 'Daily matches, activity stats, and quick links' },
      { name: 'My Profile View', path: '/profile', description: 'Review your public matrimonial card' },
      { name: 'Edit Profile & Biodata', path: '/profile/edit', description: 'Update education, lifestyle, family, and horoscope' },
      { name: 'Complete Profile Wizard', path: '/complete-profile', description: 'Step-by-step 8-stage profile enrichment' },
      { name: 'Profile Viewers History', path: '/profile/viewers', description: 'See who viewed your profile recently' },
      { name: 'Express Interests & Requests', path: '/interests', description: 'Sent and received connection invitations' },
      { name: 'Messages & Direct Chat', path: '/messages', description: 'Chat with connected matches in real-time' },
      { name: 'Payment & Invoice History', path: '/payment-history', description: 'View plan receipts and transaction statements' },
    ],
  },
  {
    title: 'Community Matrimony Hubs',
    icon: Users,
    description: 'Explore verified matrimonial profiles curated by community.',
    links: [
      { name: 'Brahmin Matrimony', path: '/community/brahmin', description: 'Iyer, Iyengar & Telugu Brahmin profiles' },
      { name: 'Chettiar Matrimony', path: '/community/chettiar', description: 'Nattukottai & Vaniya Chettiar alliances' },
      { name: 'Mudaliar Matrimony', path: '/community/mudaliar', description: 'Arcot, Thondaimandala & Saiva Mudaliar' },
      { name: 'Nadar Matrimony', path: '/community/nadar', description: 'Hindu & Christian Nadar matrimony alliances' },
      { name: 'Pillai Matrimony', path: '/community/pillai', description: 'Tirunelveli, Karkatha & Veerakodi Pillai' },
      { name: 'Thevar Matrimony', path: '/community/thevar', description: 'Maravar, Kallar & Agamudayar alliances' },
      { name: 'Vanniyar Matrimony', path: '/community/vanniyar', description: 'Vanniya Kula Kshatriya alliances' },
      { name: 'Vishwakarma Matrimony', path: '/community/vishwakarma', description: 'Achari, Kammalar & Sthapathi profiles' },
      { name: 'Naidu Matrimony', path: '/community/naidu', description: 'Kamma, Balija & Gavara Naidu profiles' },
      { name: 'Reddiar Matrimony', path: '/community/reddiar', description: 'South Indian Reddiar & Reddy alliances' },
    ],
  },
  {
    title: 'Help, Trust & Company',
    icon: Shield,
    description: 'Customer service, company information, and platform governance.',
    links: [
      { name: 'About S2S Matrimony', path: '/about', description: 'Our mission, heritage, and values' },
      { name: 'Contact & Support', path: '/contact', description: 'Office address, support phone, and email form' },
      { name: 'Frequently Asked Questions (FAQ)', path: '/faq', description: 'Common queries about safety, plans, and profiles' },
      { name: 'Terms & Conditions', path: '/terms', description: 'Legal rules, age eligibility, and member guidelines' },
      { name: 'Privacy Policy', path: '/privacy', description: 'Data protection, contact masking, and photo privacy' },
    ],
  },
];

export const SitemapPage = () => {
  const [search, setSearch] = useState('');

  const filteredSections = SITEMAP_SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter(
      (link) =>
        link.name.toLowerCase().includes(search.toLowerCase()) ||
        link.path.toLowerCase().includes(search.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter((section) => section.links.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 rounded-full px-3.5 py-1 text-primary-300 text-xs font-bold uppercase tracking-wider">
            <Map className="w-3.5 h-3.5 text-rose-400" /> Navigation Directory
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Website{' '}
            <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              Sitemap
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Find every page, community hub, member service, and legal policy on the S2S Community Matrimony platform.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sitemap pages (e.g. search, terms, faq, pricing)..."
                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-20">
        {/* Quick Stats Strip */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-4 sm:p-5 mb-10 flex flex-wrap items-center justify-around gap-4 text-center">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Total Sections</span>
            <span className="text-xl font-bold text-slate-900">4 Categories</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Indexable Pages</span>
            <span className="text-xl font-bold text-primary">30+ Routes</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Community Hubs</span>
            <span className="text-xl font-bold text-emerald-600">10 Communities</span>
          </div>
        </div>

        {/* Sitemap Sections Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filteredSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg leading-tight">
                        {section.title}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-6 divide-y divide-slate-100">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx} className="py-2.5 first:pt-0 last:pb-0">
                        <Link
                          to={link.path}
                          className="group flex items-start justify-between gap-3 text-slate-700 hover:text-primary transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs sm:text-sm group-hover:underline">
                                {link.name}
                              </span>
                              {link.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  {link.badge}
                                </span>
                              )}
                            </div>
                            {link.description && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {link.description}
                              </p>
                            )}
                          </div>
                          <span className="text-slate-400 group-hover:text-primary transition-colors mt-0.5 shrink-0">
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pb-8">
          <Link to="/" className="text-primary font-bold hover:underline">
            ← Back to Home
          </Link>
          <div className="flex gap-4">
            <Link to="/faq" className="hover:underline">FAQ Help Center</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapPage;
