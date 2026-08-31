import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, Heart, ShieldCheck, UserCheck, ArrowRight, Star,
  Users, CheckCircle2, Award, Zap, Phone, Lock, MessageSquare, Globe, X, Loader2,
  ChevronDown, HelpCircle
} from 'lucide-react';
import { adminApi } from '../../services/admin.service';
import { communitiesApi, CommunityData } from '../../services/communities.service';
import { profilesApi, ProfileData } from '../../services/profiles.service';
import { paymentsApi } from '../../services/payments.service';


// ── Hero Section ──────────────────────────────────────────────
const HeroSection = () => {
  const navigate = useNavigate();
  const [activeGender, setActiveGender] = useState<'BRIDE' | 'GROOM'>('BRIDE');
  const [ageRange, setAgeRange] = useState<string>('18-35');
  const [religion, setReligion] = useState<string>('');
  const [dbProfiles, setDbProfiles] = useState<ProfileData[]>([]);

  useEffect(() => {
    profilesApi.searchProfiles({ limit: 4 }).then((res) => {
      const items = res.items || (Array.isArray(res) ? res : []);
      if (Array.isArray(items) && items.length > 0) {
        setDbProfiles(items);
      }
    }).catch(() => { });
  }, []);

  const handleQuickSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    params.set('gender', activeGender === 'BRIDE' ? 'FEMALE' : 'MALE');
    if (ageRange) {
      const [min, max] = ageRange.split('-');
      if (min) params.set('minAge', min);
      if (max) params.set('maxAge', max);
    }
    if (religion) {
      params.set('religion', religion);
    }
    navigate(`/search?${params.toString()}`);
  };

  const brideProfile = dbProfiles.find((p) => p.gender === 'FEMALE') || dbProfiles[0];
  const groomProfile = dbProfiles.find((p) => p.gender === 'MALE') || dbProfiles[1] || dbProfiles[0];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-28 pb-16">
      {/* Background Gradients & Glow Orbs & Blended Couple Image */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: "url('/images/couple.png')" }} />
      <div className="absolute inset-0 bg-mesh opacity-25" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Content (7 Cols) */}
          <div className="lg:col-span-7 text-center lg:text-left animate-slide-up space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 text-primary text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Trusted by 50,000+ Verified Members
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.15] tracking-tight">
              Find Your Perfect <br className="hidden sm:inline" />
              <span className="text-gradient">Life Partner</span>{' '}
              <span className="text-text-primary">Within Your Community</span>
            </h1>

            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Personalized matchmaking,  intelligent compatibility assessment,  curated introductions and complete confidentiality
            </p>

            {/* Quick Search Widget */}
            <form onSubmit={handleQuickSearch} className="glass-card p-6 max-w-xl mx-auto lg:mx-0 shadow-2xl border-slate-200/60 bg-white/95">
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveGender('BRIDE')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${activeGender === 'BRIDE'
                      ? 'bg-gradient-primary text-white border-primary-light shadow-md'
                      : 'bg-slate-50 text-text-secondary border-slate-200 hover:text-text-primary hover:bg-slate-100'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${activeGender === 'BRIDE' ? 'fill-current' : ''}`} />
                  <span>Looking for Bride</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGender('GROOM')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${activeGender === 'GROOM'
                      ? 'bg-gradient-primary text-white border-primary-light shadow-md'
                      : 'bg-slate-50 text-text-secondary border-slate-200 hover:text-text-primary hover:bg-slate-100'
                    }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Looking for Groom</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="input-label">Age Preference</label>
                  <select
                    className="input text-xs py-2.5 font-medium"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                  >
                    <option value="18-35">18 yrs - 35 yrs</option>
                    <option value="18-24">18 yrs - 24 yrs</option>
                    <option value="25-30">25 yrs - 30 yrs</option>
                    <option value="31-36">31 yrs - 36 yrs</option>
                    <option value="37-45">37 yrs - 45 yrs</option>
                    <option value="46-60">46 yrs - 60 yrs</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Religion / Caste</label>
                  <select
                    className="input text-xs py-2.5 font-medium"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                  >
                    <option value="">All Religions</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Christian">Christian</option>
                    <option value="Jain">Jain</option>
                    <option value="Sikh">Sikh</option>
                  </select>
                </div>
              </div>

              <button type="button" onClick={handleQuickSearch} className="btn btn-primary w-full shadow-lg flex items-center justify-center gap-2 py-3.5 text-sm font-semibold">
                <Search className="w-4 h-4" /> Search Profiles Now
              </button>
            </form>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-200 max-w-xl mx-auto lg:mx-0">
              {[
                { num: '50K+', label: 'Active Members' },
                { num: '10K+', label: 'Marriages' },
                { num: '200+', label: 'Communities' },
                { num: '99%', label: 'Verified' },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <p className="text-gradient font-display font-bold text-2xl md:text-3xl">{stat.num}</p>
                  <p className="text-text-muted text-xs font-semibold mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Showcase Cards (5 Cols) — Live DB Profile Stack */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[480px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-secondary/10 to-transparent rounded-3xl blur-2xl" />

            <div className="relative w-full max-w-md space-y-4">
              {/* Profile Card 1: Bride */}
              <div className="card p-4 border-primary/30 shadow-2xl hover:border-primary/60 transition-all duration-300 transform -rotate-1 hover:rotate-0 bg-white">
                <div className="flex items-center gap-4">
                  <img
                    src={brideProfile?.photos?.[0]?.url || '/images/bride.png'}
                    alt={brideProfile?.displayName || 'Kavitha Ramasamy'}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-primary/30 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-text-primary font-bold text-base truncate">{brideProfile?.displayName || 'Kavitha Ramasamy'}</h3>
                      <span className="badge badge-verified text-[11px] py-1 px-2.5 bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {brideProfile?.age || 26} yrs • {brideProfile?.heightCm || 163} cm • Chennai
                    </p>
                    <p className="text-text-muted text-xs truncate">
                      {brideProfile?.occupation?.title || 'Software Engineer'} • {brideProfile?.community?.name || 'Nadar'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-primary h-full rounded-full" style={{ width: '85%' }} />
                      </div>
                      <span className="text-primary text-xs font-bold">85% Match</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Banner Card: AI Match */}
              <div className="glass-card p-5 border-gold/40 shadow-glow-gold bg-gradient-to-r from-white via-primary/5 to-white relative z-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gold/20 text-gold mx-auto mb-2 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <h4 className="text-text-primary font-display font-bold text-base">Perfect AI Match Found!</h4>
                <p className="text-text-secondary text-xs mt-1">Based on 25+ horoscope & lifestyle compatibility factors</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
              </div>

              {/* Profile Card 2: Groom */}
              <div className="card p-4 border-secondary/30 shadow-2xl hover:border-secondary/60 transition-all duration-300 transform rotate-1 hover:rotate-0 bg-white">
                <div className="flex items-center gap-4">
                  <img
                    src={groomProfile?.photos?.[0]?.url || '/images/groom.png'}
                    alt={groomProfile?.displayName || 'Dr. Arjun Sundaram'}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-secondary/30 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-text-primary font-bold text-base truncate">{groomProfile?.displayName || 'Dr. Arjun Sundaram'}</h3>
                      <span className="badge badge-premium text-[10px] py-0.5 px-2 bg-amber-50 text-amber-700 border-amber-200">★ Premium</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {groomProfile?.age || 29} yrs • {groomProfile?.heightCm || 180} cm • Coimbatore
                    </p>
                    <p className="text-text-muted text-xs truncate">
                      {groomProfile?.occupation?.title || 'Doctor (MBBS, MD)'} • {groomProfile?.community?.name || 'Mudaliar'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-secondary to-secondary-light h-full rounded-full" style={{ width: '92%' }} />
                      </div>
                      <span className="text-secondary-light text-xs font-bold">92% Match</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── A More Personal Way to Find Your Life Partner ───────────────────
const HowItWorksSection = () => {
  const steps = [
    { num: '01', icon: MessageSquare, title: 'Tell Us Your Story', desc: 'Begin with a private consultation. We learn about your background, personality, aspirations, family values, and expectations.' },
    { num: '02', icon: Search, title: 'Understand Preferences', desc: 'We identify the qualities, lifestyle, and compatibility factors that matter most to you in a life partner.' },
    { num: '03', icon: Sparkles, title: 'Curated Match Selection', desc: 'Our matchmaking team carefully identifies potential matches aligned with your requirements and relationship goals.' },
    { num: '04', icon: Heart, title: 'Personalised Introductions', desc: 'We facilitate introductions in a respectful, comfortable, and completely confidential manner.' },
    { num: '05', icon: Award, title: 'Support When It Matters', desc: 'From the first introduction through the relationship journey, our team remains available to provide guidance and support.' },
  ];

  return (
    <section className="section bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Our Matchmaking Process
          </div>
          <h2 className="section-title">A More Personal Way to <span className="text-gradient">Find Your Life Partner</span></h2>
          <p className="section-subtitle max-w-2xl mx-auto">Thoughtfully guided from initial consultation through your wedding day</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, i) => {
            const IconComponent = step.icon;
            return (
              <div key={i} className="card p-6 text-center hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group bg-white shadow-sm hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-gradient font-display font-black text-2xl block mb-2">{step.num}</span>
                  <h3 className="text-text-primary font-bold text-base mb-2">{step.title}</h3>
                  <p className="text-text-secondary text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Why Choose S2S Matrimony ───────────────────────────────────────
const FeaturesSection = () => {
  const features = [
    { icon: Sparkles, title: 'Curated, Not Crowded', desc: 'We focus on quality over quantity. Every introduction is thoughtfully considered based on your preferences, personality, values, and family expectations.' },
    { icon: UserCheck, title: 'Personalised Matchmaking', desc: 'Your journey is guided by a dedicated matchmaking expert who takes the time to understand you beyond an online profile.' },
    { icon: Lock, title: 'Privacy & Discretion', desc: 'Your personal information and matrimonial journey are handled with the highest level of confidentiality and professionalism.' },
    { icon: Heart, title: 'Meaningful Compatibility', desc: 'We look beyond education and appearance to understand lifestyle, values, family vision, personality, and relationship expectations.' },
    { icon: ShieldCheck, title: 'Trusted Network', desc: 'Access a carefully curated network of eligible individuals and families who are genuinely seeking a committed relationship.' },
    { icon: Award, title: 'Relationship With Purpose', desc: 'Our goal isn’t simply to find you a match. It is to help you discover a partner with whom you can build a fulfilling life.' },
  ];

  return (
    <section className="section bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 text-secondary text-xs font-bold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5" /> The S2S Distinction
          </div>
          <h2 className="section-title">Why Choose <span className="text-gradient">S2S Matrimony</span></h2>
          <p className="section-subtitle">Excellence, discretion, and meaningful connections tailored to you</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const IconComp = f.icon;
            return (
              <div key={i} className="card p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-200 group bg-slate-50/60 hover:bg-white shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4 flex items-center justify-center transition-transform group-hover:scale-105">
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-text-primary font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Beyond Profiles. Beyond Algorithms. ────────────────────────────
const PhilosophySection = () => {
  const pillars = [
    { title: 'Shared Values', icon: Heart, desc: 'Deep-rooted cultural & moral harmony' },
    { title: 'Emotional Compatibility', icon: Sparkles, desc: 'Mutual empathy & emotional resonance' },
    { title: 'Family Harmony', icon: Users, desc: 'Aligning family traditions & vision' },
    { title: 'Life Aspirations', icon: Award, desc: 'Shared ambitions & personal growth' },
    { title: 'Mutual Respect', icon: ShieldCheck, desc: 'A foundation of equality & dignity' },
    { title: 'Shared Vision for Future', icon: Globe, desc: 'Building a fulfilling life together' },
  ];

  return (
    <section className="section bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Our Matching Philosophy
          </div>
          <h2 className="section-title">
            Beyond Profiles. <span className="text-gradient">Beyond Algorithms.</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            A successful marriage is built on more than a checklist. That's why our matchmaking process looks at the complete picture.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-base mb-1">{p.title}</h4>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── For Individuals & For Families ─────────────────────────────────
const AudienceSection = () => {
  const audiences = [
    {
      title: 'Accomplished Individuals',
      tag: 'Professionals & Entrepreneurs',
      desc: 'Seeking a meaningful, intellectually and culturally aligned relationship with an equal partner who shares your aspirations.',
      badge: 'Personal Discretion',
    },
    {
      title: 'Well-Matched Families',
      tag: 'Family Alliances',
      desc: 'Looking for a compatible alliance built on shared tradition, background, integrity, and mutual respect with total peace of mind.',
      badge: 'Family Harmony',
    },
    {
      title: 'Global NRIs',
      tag: 'Global Connections',
      desc: 'Seeking trusted matrimony bridging international lifestyles with rich cultural heritage and seamless family connections.',
      badge: 'Global Outreach',
    },
  ];

  return (
    <section className="section bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Tailored Matchmaking
          </div>
          <h2 className="section-title">For Individuals <span className="text-gradient">& For Families</span></h2>
          <p className="section-subtitle">
            We understand that finding a life partner is a deeply personal journey—and often a family decision. We provide a discreet and professional experience balancing personal preferences with family values.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {audiences.map((a, i) => (
            <div key={i} className="card p-6 bg-white border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 inline-block mb-3">
                  {a.badge}
                </span>
                <h3 className="text-text-primary font-bold text-lg mb-1">{a.title}</h3>
                <p className="text-xs font-semibold text-text-muted mb-3">{a.tag}</p>
                <p className="text-text-secondary text-sm leading-relaxed">{a.desc}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-primary text-xs font-bold gap-1">
                <span>Tailored private matchmaking</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Your Privacy Is Our Priority ───────────────────────────────────
const PrivacySection = () => {
  const privacyPoints = [
    { title: 'Confidential Consultations', icon: Lock, desc: 'Private one-on-one sessions with our senior matchmaking team.' },
    { title: 'Carefully Managed Profiles', icon: ShieldCheck, desc: 'Complete control over who views your photos, contact, and details.' },
    { title: 'Discreet Introductions', icon: Heart, desc: 'Introductions facilitated only upon mutual consent and verified interest.' },
    { title: 'Professional Matchmaking Support', icon: UserCheck, desc: 'Dedicated advisors upholding complete discretion at every step.' },
  ];

  return (
    <section className="section bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-primary/5 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl">
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Confidentiality Guarantee
            </div>
            <h2 className="section-title">Your Privacy Is Our <span className="text-gradient">Priority</span></h2>
            <p className="text-text-secondary text-base max-w-2xl mx-auto">
              Your personal life deserves complete discretion. We maintain a confidential matchmaking environment designed for individuals and families who prefer a private, professional approach.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {privacyPoints.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-text-primary font-bold text-sm mb-1">{item.title}</h4>
                    <p className="text-text-secondary text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Success Stories Section ────────────────────────────────────────
const SuccessStoriesSection = () => {
  const [dbStories, setDbStories] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getPublicSuccessStories(1, 10).then((res) => {
      const data = res.stories || res.items || (Array.isArray(res) ? res : []);
      if (Array.isArray(data) && data.length > 0) {
        setDbStories(data);
      }
    }).catch(() => { });
  }, []);

  const defaultStories = [
    { groomName: 'Karthik', brideName: 'Shalini', story: 'We registered on S2S Matrimony and connected within 2 weeks. Married in Chennai with family blessings!', photo: '/images/couple_happy.png' },
    { groomName: 'Dr. Ashwin', brideName: 'Divya', story: 'Finding an educated doctor partner who valued tradition was seamless with S2S filter tools!', photo: '/images/couple.png' },
    { groomName: 'Venkatesh', brideName: 'Meenakshi', story: 'The privacy controls allowed us to share contact details securely. Today we are happily married!', photo: '/images/ceremony.png' },
    { groomName: 'Siddharth', brideName: 'Priya', story: 'The verified profile badges gave my parents total peace of mind. Highly recommend S2S Matrimony!', photo: '/images/couple_traditional.png' },
  ];

  const storiesToRender = dbStories.length > 0 ? dbStories : defaultStories;

  return (
    <section className="section bg-slate-50 relative overflow-hidden" id="success-stories">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5 fill-current text-rose-500" /> Real Unions, True Love
          </div>
          <h2 className="section-title">
            Happy <span className="text-gradient">Success Stories</span>
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            Thousands of couples have started their journey together on S2S Matrimony. Read their inspiring stories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {storiesToRender.map((s, idx) => {
            const groom = s.groomName || s.coupleName?.split('&')[0]?.trim() || 'Karthik';
            const bride = s.brideName || s.coupleName?.split('&')[1]?.trim() || 'Deepa';
            const storyText = s.story || s.storyText || 'We found our match on S2S Matrimony!';
            const photoUrl = s.photo || s.couplePhoto || '/images/couple_happy.png';
            const mDate = s.marriageDate || s.weddingDate;

            return (
              <div
                key={s.id || idx}
                className="card bg-white p-6 border border-slate-200 hover:border-primary/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-amber-200 shadow-md">
                  <img src={photoUrl} alt={`${groom} & ${bride}`} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      💍 Verified Union
                    </span>
                  </div>

                  <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed font-medium">
                    "{storyText}"
                  </p>

                  <div className="pt-1 border-t border-slate-100">
                    <p className="font-sans font-extrabold text-slate-900 text-base">{groom} & {bride}</p>
                    <p className="text-text-muted text-[11px] font-semibold">
                      {mDate ? (isNaN(new Date(mDate).getTime()) ? String(mDate) : new Date(mDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })) : 'Verified Happy Couple'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


// ── Communities Section ──────────────────────────────────────────
const CommunitiesSection = () => {
  const [dbCommunities, setDbCommunities] = useState<CommunityData[]>([]);

  useEffect(() => {
    communitiesApi.getCommunities().then((comms) => {
      if (Array.isArray(comms) && comms.length > 0) {
        setDbCommunities(comms.filter((c) => !c.parentId).slice(0, 12));
      }
    }).catch(() => { });
  }, []);

  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="section-title">Browse by <span className="text-gradient">Community</span></h2>
          <p className="section-subtitle">Portals dedicated to 200+ distinct communities</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          {dbCommunities.map((c) => (
            <Link
              key={c.id}
              to={`/community/${c.slug}`}
              className="card p-4 text-center hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group bg-slate-50/50"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-primary mx-auto mb-2 flex items-center justify-center text-white font-bold text-base shadow-md group-hover:scale-110 transition-transform">
                {c.name[0]}
              </div>
              <h3 className="text-text-primary font-semibold text-sm truncate">{c.name}</h3>
              <p className="text-text-muted text-[11px] mt-0.5">{c.memberCount || '1,000+'} profiles</p>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link to="/search" className="btn btn-secondary">
            View All 200+ Communities <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// ── Pricing & Plans Section (2 Categories: General & Elite) ────────
const PricingPlansSection = () => {
  const [category, setCategory] = useState<'GENERAL' | 'ELITE' | null>(null);
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    paymentsApi.getPlans().then((res) => {
      const data = Array.isArray(res) ? res : (res.plans || res.data || []);
      if (Array.isArray(data) && data.length > 0) {
        setDbPlans(data);
      }
    }).catch(() => { });
  }, []);

  const generalPlans = [
    {
      id: 'gen-free',
      name: 'Free Starter',
      price: '₹0',
      period: 'Lifetime Free',
      popular: false,
      badge: 'Free Forever',
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
      checkColor: 'text-slate-500',
      description: 'Ideal for exploring verified profiles and getting started',
      features: [
        { text: '5 Daily Expressed Interests', active: true },
        { text: 'Basic Search (Age, Religion, Community)', active: true },
        { text: '5 Profile Views per Day', active: true },
        { text: 'Basic Compatibility Score', active: true },
        { text: 'Verified Member Badge', active: true },
        { text: 'Contact Numbers & Email Unlocks', active: false },
        { text: 'Direct Instant Messaging & Live Chat', active: false },
        { text: 'Priority Search Ranking in Results', active: false },
      ],
      ctaText: 'Register Free',
      ctaLink: '/register',
      ctaStyle: 'btn bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300',
    },
    {
      id: 'gen-silver',
      name: 'Silver Plan',
      price: '₹599',
      period: '1 month',
      popular: false,
      badge: 'Standard Access',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
      checkColor: 'text-teal-600',
      description: 'Unlock contact details & start connecting directly with matches',
      features: [
        { text: '50 Daily Expressed Interests', active: true },
        { text: 'Advanced Search & Education Filters', active: true },
        { text: '50 Contact Number & Phone Unlocks', active: true },
        { text: 'Direct Instant Messaging & Live Chat', active: true },
        { text: 'Full Horoscope Overview', active: true },
        { text: 'Verified Search Badge Priority', active: true },
        { text: 'Top 10 Search Placement', active: false },
        { text: 'Dedicated Matchmaking Advisor', active: false },
      ],
      ctaText: 'Choose Silver',
      ctaLink: '/register',
      ctaStyle: 'btn bg-teal-600 hover:bg-teal-700 text-white font-bold border-0 shadow-md',
    },
    {
      id: 'gen-gold',
      name: 'Gold Plan',
      price: '₹1,199',
      period: '3 months',
      popular: true,
      badge: 'Best Value ⭐',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
      checkColor: 'text-amber-600',
      description: 'High visibility, faster responses & full horoscope match reports',
      features: [
        { text: 'UNLIMITED Expressed Interests', active: true },
        { text: '150 Direct Contact & Phone Unlocks', active: true },
        { text: 'Unlimited Direct Messaging & Chat', active: true },
        { text: 'Full Horoscope & Porutham Match Reports', active: true },
        { text: 'Priority Search Placement in Results', active: true },
        { text: 'AI Matchmaking & Compatibility Score', active: true },
        { text: 'Privacy Shield & Photo Lock Controls', active: true },
        { text: 'Dedicated Relationship Manager', active: false },
      ],
      ctaText: 'Choose Gold',
      ctaLink: '/register',
      ctaStyle: 'btn bg-gradient-gold text-white font-extrabold shadow-lg hover:brightness-105 border-0',
    },
    {
      id: 'gen-platinum',
      name: 'Platinum Plan',
      price: '₹1,999',
      period: '6 months',
      popular: false,
      badge: 'Maximum Access',
      badgeBg: 'bg-primary/10 text-primary-dark border-primary/30 font-extrabold',
      checkColor: 'text-primary',
      description: 'Maximum connection limits, top tier ranking & premium badges',
      features: [
        { text: 'UNLIMITED Expressed Interests', active: true },
        { text: '300 Direct Contact & Phone Unlocks', active: true },
        { text: 'Unlimited Chat & Priority Messaging', active: true },
        { text: 'Full Horoscope & 10 Porutham Reports', active: true },
        { text: 'TOP 5 Featured Profile Placement', active: true },
        { text: 'Highlighted Platinum Badge on Profile', active: true },
        { text: 'Complete Privacy & Contact Protection', active: true },
        { text: 'Priority Email & WhatsApp Support', active: true },
      ],
      ctaText: 'Choose Platinum',
      ctaLink: '/register',
      ctaStyle: 'btn bg-gradient-primary text-white font-black shadow-xl hover:opacity-95 border-0',
    },
  ];

  const elitePlans = [
    {
      id: 'elite-silver',
      name: 'Elite Silver',
      price: '₹4,999',
      period: '3 months',
      popular: false,
      badge: 'Curated Matchmaking',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      checkColor: 'text-slate-700',
      description: 'Assisted matchmaking with handpicked matches & dedicated guidance',
      features: [
        { text: 'Dedicated Matchmaking Advisor', active: true },
        { text: '15 Curated & Handpicked Introductions', active: true },
        { text: 'Personal Profile Screening & Verification', active: true },
        { text: 'Confidential Contact Information Sharing', active: true },
        { text: 'Full Astrological & Horoscope Matching', active: true },
        { text: 'Unlimited Profile Views on Portal', active: true },
        { text: 'Direct Communication Support', active: true },
        { text: 'Family Meeting Coordination', active: false },
      ],
      ctaText: 'Get Elite Silver',
      ctaLink: '/register',
      ctaStyle: 'btn bg-slate-800 hover:bg-slate-900 text-white font-bold border-0 shadow-md',
    },
    {
      id: 'elite-gold',
      name: 'Elite Gold',
      price: '₹9,999',
      period: '6 months',
      popular: true,
      badge: 'Most Preferred VIP ⭐',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold',
      checkColor: 'text-amber-600',
      description: 'Complete personalized matchmaking with senior relationship manager',
      features: [
        { text: 'Senior Personal Relationship Manager', active: true },
        { text: '35 Handpicked & Pre-Screened Matches', active: true },
        { text: 'Family Meeting Setup & Facilitation', active: true },
        { text: 'Discreet Introductions & Complete Discretion', active: true },
        { text: 'In-Depth Background & Horoscope Verification', active: true },
        { text: 'Priority Search & Direct Family Connect', active: true },
        { text: 'VIP Concierge & Weekly Progress Calls', active: true },
        { text: 'Till Marriage Commitment Guarantee', active: false },
      ],
      ctaText: 'Get Elite Gold',
      ctaLink: '/register',
      ctaStyle: 'btn bg-gradient-gold text-white font-extrabold shadow-xl hover:brightness-105 border-0',
    },
    {
      id: 'elite-platinum',
      name: 'Elite Platinum',
      price: '₹18,999',
      period: 'Till Marriage (12M)',
      popular: false,
      badge: 'Royal Bespoke VIP',
      badgeBg: 'bg-primary/10 text-primary-dark border-primary/30 font-black',
      checkColor: 'text-primary',
      description: 'Bespoke executive matchmaking for accomplished individuals & families',
      features: [
        { text: 'Senior Director & Dedicated Matchmaking Team', active: true },
        { text: 'UNLIMITED Curated & Vetted Introductions', active: true },
        { text: 'End-to-End Family Coordination & Scheduling', active: true },
        { text: 'Strict NDA & Total Privacy Protection', active: true },
        { text: 'Comprehensive Background & Kundali Verification', active: true },
        { text: '24/7 Dedicated Concierge & Relationship Support', active: true },
        { text: 'Exclusive Cross-Community & NRI Match Network', active: true },
        { text: 'Active Matchmaking Support Until Marriage', active: true },
      ],
      ctaText: 'Join Elite Platinum',
      ctaLink: '/register',
      ctaStyle: 'btn bg-gradient-primary text-white font-black shadow-2xl hover:opacity-95 border-0',
    },
  ];

  const activePlans = category === 'GENERAL' ? generalPlans : category === 'ELITE' ? elitePlans : [];

  return (
    <section className="section bg-slate-50/70 border-t border-slate-100 relative overflow-hidden" id="membership-plans">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary-dark text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Transparent Pricing & Benefits
          </div>
          <h2 className="section-title">
            Choose Your <span className="text-gradient">Membership Plan</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Click on a plan category below to explore self-managed General plans or personalized Elite VIP assisted matchmaking.
          </p>
        </div>

        {/* Category Toggle (General vs Elite) - Default is null */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="bg-slate-200/90 p-1.5 rounded-2xl flex items-center gap-2 shadow-inner border border-slate-300 max-w-lg w-full">
            <button
              type="button"
              onClick={() => setCategory(category === 'GENERAL' ? null : 'GENERAL')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                category === 'GENERAL'
                  ? 'bg-white text-slate-900 shadow-lg ring-2 ring-primary/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-primary" />
              <span>🌟 General Plans</span>
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ml-1 ${category === 'GENERAL' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                4 Plans
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory(category === 'ELITE' ? null : 'ELITE')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                category === 'ELITE'
                  ? 'bg-gradient-gold text-white shadow-lg ring-2 ring-amber-400/40 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>👑 Elite VIP Plans</span>
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ml-1 ${category === 'ELITE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                3 Plans
              </span>
            </button>
          </div>

          {category && (
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-4 text-center animate-fade-in">
              {category === 'GENERAL'
                ? '✨ General Plans: Self-managed search, instant direct chat, verified profiles & horoscope porutham reports.'
                : '👑 Elite VIP Service: Dedicated senior matchmaking manager, handpicked introductions & complete confidentiality.'}
            </p>
          )}
        </div>

        {/* When Category is Null: Show Interactive Prompt Cards */}
        {category === null ? (
          <div className="max-w-3xl mx-auto py-8 px-4 text-center animate-fade-in">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="font-sans text-2xl font-black text-slate-900">
                Please Select a Plan Category to View Packages
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Choose between self-managed membership packages or our assisted luxury matchmaking service.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => setCategory('GENERAL')}
                  className="p-5 rounded-2xl border-2 border-slate-200 hover:border-primary bg-slate-50 hover:bg-white transition-all text-left group shadow-xs hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-base mb-1">
                    <span>🌟 General Plans</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    4 Plans from ₹0 to ₹1,999. Includes Free Starter, Silver, Gold & Platinum.
                  </p>
                  <span className="text-primary text-xs font-bold mt-3 inline-block group-hover:translate-x-1 transition-transform">
                    View General Plans →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('ELITE')}
                  className="p-5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/50 hover:bg-white transition-all text-left group shadow-xs hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-base mb-1">
                    <span>👑 Elite VIP Plans</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    3 VIP Plans from ₹4,999 to ₹18,999 with dedicated relationship manager.
                  </p>
                  <span className="text-amber-700 text-xs font-bold mt-3 inline-block group-hover:translate-x-1 transition-transform">
                    View Elite VIP Plans →
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Plans Grid */
          <div className="flex flex-wrap justify-center items-stretch gap-6 pt-2 max-w-6xl mx-auto animate-fade-in">
            {activePlans.map((p) => (
              <div
                key={p.id}
                className={`card p-6 flex flex-col justify-between relative transition-all duration-300 rounded-2xl w-full sm:w-[270px] lg:w-[285px] max-w-[320px] flex-1 ${
                  p.popular
                    ? 'border-2 border-primary bg-white shadow-2xl scale-[1.03] z-10'
                    : 'bg-white border border-slate-200 hover:border-primary/30 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] uppercase px-3 py-1 rounded-full border ${p.badgeBg}`}>
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="font-sans text-xl font-extrabold text-slate-900 mb-1">{p.name}</h3>
                  <p className="text-text-muted text-xs mb-4 min-h-[32px] leading-relaxed">{p.description}</p>

                  <div className="mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-sans text-3xl font-black text-slate-900 tracking-tight">{p.price}</span>
                      <span className="text-text-muted text-xs font-semibold">/ {p.period}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Applicable Features:</p>
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        {f.active ? (
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${p.checkColor}`} />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={f.active ? 'text-slate-800 font-semibold' : 'text-slate-400 line-through opacity-70'}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to={p.ctaLink} className={`btn w-full text-center py-2.5 text-xs ${p.ctaStyle}`}>
                  {p.ctaText}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};



// ── Frequently Asked Questions ──────────────────────────────
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is your matchmaking service completely confidential?',
      answer: 'Yes. We place strong emphasis on privacy and discretion throughout the matchmaking process.',
    },
    {
      question: 'Do you personally curate the matches?',
      answer: 'Yes. Our approach is personalised, with potential matches selected according to your requirements and compatibility factors.',
    },
    {
      question: 'Who is your service designed for?',
      answer: 'Our service is designed for individuals and families seeking a premium, personalised approach to matrimonial matchmaking, including professionals, entrepreneurs, business families, NRIs, and accomplished individuals.',
    },
    {
      question: 'Can families participate in the matchmaking process?',
      answer: 'Absolutely. Where appropriate, we work closely with families while respecting the individual\'s preferences and expectations.',
    },
    {
      question: 'How do I get started?',
      answer: 'Simply request a private consultation. Our team will understand your requirements and explain the matchmaking process suited to you.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section bg-slate-50/70 border-t border-slate-100 py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center space-y-3 mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="section-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Everything you need to know about our personalized matchmaking and privacy standards.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`transition-all duration-300 rounded-2xl border bg-white overflow-hidden ${
                  isOpen
                    ? 'border-primary/40 shadow-md ring-1 ring-primary/20'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none transition-colors"
                >
                  <span className={`text-base sm:text-lg font-bold tracking-tight ${
                    isOpen ? 'text-primary' : 'text-slate-900'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                    isOpen ? 'bg-primary/10 text-primary rotate-180' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};



// ── CTA Banner ──────────────────────────────────────────
const CTASection = () => (
  <section className="section bg-white border-t border-slate-100">
    <div className="container mx-auto px-4 md:px-8">
      <div
        className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center shadow-2xl border border-slate-700 bg-cover bg-center text-white"
        style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.88)), url('/images/ceremony.png')" }}
      >
        <div className="relative z-10 space-y-6 max-w-3xl mx-auto text-white">
          <div className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 rounded-full px-4 py-1.5 text-gold text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Start Your Journey Today
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-xl" style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
            The Beginning of <span className="text-gold">Something Extraordinary</span>
          </h2>
          <p className="text-slate-200 text-base md:text-lg leading-relaxed font-normal max-w-2xl mx-auto">
            You have built a remarkable life. Now find someone with whom you can share it. Take the first step toward a relationship founded on <strong className="text-white">compatibility, trust, respect, and shared aspirations</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-3">
            <Link to="/register" className="btn btn-gold btn-lg text-sm font-bold shadow-xl">
              Register Free Now
            </Link>
            <Link to="/search" className="btn border-2 border-white text-white hover:bg-white/20 btn-lg text-sm font-semibold">
              Browse Profiles
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);



// ── Main Landing Page ─────────────────────────────────────────
const LandingPage = () => (
  <div className="bg-slate-50/50">
    <HeroSection />
    <HowItWorksSection />
    <FeaturesSection />
    <PhilosophySection />
    <AudienceSection />
    <PrivacySection />
    <PricingPlansSection />
    <SuccessStoriesSection />
    <CommunitiesSection />
    <FAQSection />
    <CTASection />
  </div>
);

export default LandingPage;


