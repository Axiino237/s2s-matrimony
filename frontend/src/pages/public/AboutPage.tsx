import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Users, Sparkles, Award, Compass, CheckCircle2, ArrowRight, Phone, Mail, Building, Globe } from 'lucide-react';

const STATS = [
  { value: '50,000+', label: 'Active Members', description: 'Verified brides and grooms across communities' },
  { value: '10,000+', label: 'Happy Marriages', description: 'Successful alliances formed through our platform' },
  { value: '200+', label: 'Communities', description: 'Authentic cultural & community specific matchmaking' },
  { value: '100%', label: 'Privacy Controlled', description: 'Secure photo watermarks and masked contacts' },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust & Authenticity',
    description: 'Every profile goes through multi-layer verification including OTP phone verification and optional Government ID checks to ensure authentic members.',
  },
  {
    icon: Users,
    title: 'Community Respect',
    description: 'We honor regional, cultural, and community traditions, allowing families to connect based on shared values, mother tongue, and subcaste preferences.',
  },
  {
    icon: Sparkles,
    title: 'AI & Traditional Compatibility',
    description: 'We bring together traditional 10-Porutham (Dasa Porutham) astrology calculations with modern AI preference matching for high-compatibility alliances.',
  },
  {
    icon: Heart,
    title: 'Family-Centric Experience',
    description: 'Designed for both prospective candidates and parents, siblings, or guardians managing profiles on their behalf with clarity and ease.',
  },
];

const MILESTONES = [
  { year: '2019', title: 'Platform Inception', description: 'Started as a regional community matrimonial directory with 500 members.' },
  { year: '2021', title: 'Statewide Expansion', description: 'Expanded across Tamil Nadu and South Indian diasporas with 25,000+ registered profiles.' },
  { year: '2023', title: 'AI Horoscope Matching', description: 'Introduced automated Porutham horoscope calculations and strict photo privacy controls.' },
  { year: '2026', title: 'Premier Community Platform', description: 'Connecting over 50,000 members across 200+ communities with dedicated support.' },
];

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
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
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Connecting hearts within communities. Built on trust, cultural heritage, and modern matchmaking technology to help you find your ideal life partner.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-20 space-y-12">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((s, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl sm:text-3xl font-display font-black bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent block mb-1">
                {s.value}
              </span>
              <span className="text-sm font-bold text-slate-900 block mb-1">{s.label}</span>
              <span className="text-xs text-slate-500 block leading-tight">{s.description}</span>
            </div>
          ))}
        </div>

        {/* Mission & Story Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Our Mission</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 leading-snug">
              Making Matrimony Safe, Authentic & Culturally Meaningful
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Finding a life partner is one of life's most sacred decisions. S2S Community Matrimony was established with the vision of offering individuals and families a safe, dependable, and community-conscious platform.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Unlike generic dating apps or commercial platforms, we focus on genuine matrimonial alliances. Every profile is backed by mobile verification, strict photo privacy options, and optional Government ID badges so families can interact with complete peace of mind.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-md inline-flex items-center gap-2">
                <span>Create Free Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/success-stories" className="btn btn-ghost btn-md border border-slate-200">
                <span>Read Success Stories</span>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-50 via-rose-50/50 to-amber-50/40 rounded-2xl p-6 sm:p-8 border border-primary-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Why Families Trust S2S
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>100% Verified Contact Protection:</strong> Phone numbers are never indexed or shown to crawlers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Watermarked Photo Privacy:</strong> Photos are anti-theft watermarked or viewable upon request.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Accurate Dasa Porutham:</strong> In-depth astrological compatibility based on Star, Rasi, and Gothram.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Dedicated Relationship Managers:</strong> Personalized support for premium tier subscribers.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Core Values */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Our Values</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
              Guiding Principles of S2S Matrimony
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Every decision we make is guided by our core values of trust, transparency, and cultural heritage.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{val.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Milestones</span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">Our Growth Journey</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {MILESTONES.map((m, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-xs font-black text-primary px-2.5 py-0.5 bg-primary/10 rounded-full inline-block">
                  {m.year}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-gradient-to-br from-primary-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold font-display">Begin Your Matrimonial Journey Today</h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md">
              Join 50,000+ verified members and take the first step towards finding your life partner.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link to="/register" className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-md text-center">
              Register Free
            </Link>
            <Link to="/contact" className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-600 transition-colors shadow-md text-center flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Contact Us
            </Link>
          </div>
        </div>

        {/* Quick Footer Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-4">
          <Link to="/" className="text-primary font-bold hover:underline">
            ← Back to Home
          </Link>
          <div className="flex gap-4">
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
