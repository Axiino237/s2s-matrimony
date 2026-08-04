import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Sparkles, Heart, ShieldCheck, UserCheck, ArrowRight, Star, 
  Users, CheckCircle2, Award, Zap, Phone, Lock, MessageSquare, Globe, X, Loader2
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
    }).catch(() => {});
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
              S2S Matrimony connects you with verified profiles from 200+ communities. 
              Enjoy AI-powered matchmaking, 100% privacy control, and real-time interaction.
            </p>

            {/* Quick Search Widget */}
            <form onSubmit={handleQuickSearch} className="glass-card p-6 max-w-xl mx-auto lg:mx-0 shadow-2xl border-slate-200/60 bg-white/95">
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveGender('BRIDE')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${
                    activeGender === 'BRIDE'
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
                  className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${
                    activeGender === 'GROOM'
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

// ── How It Works Section ──────────────────────────────────────────
const HowItWorksSection = () => {
  const steps = [
    { num: '01', icon: UserCheck, title: 'Register Free', desc: 'Create your profile in minutes. Add photos, family details, and partner preferences.' },
    { num: '02', icon: Search, title: 'Search & Browse', desc: 'Use 25+ filters to find matches by community, location, education, and horoscope.' },
    { num: '03', icon: Heart, title: 'Send Interest', desc: 'Connect with profiles you like. Accept or decline received interests privately.' },
    { num: '04', icon: Sparkles, title: 'Get Married', desc: 'Chat securely, view verified contacts, and begin your beautiful journey together.' },
  ];

  return (
    <section className="section bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
          <p className="section-subtitle">Find your compatible life partner in 4 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const IconComponent = step.icon;
            return (
              <div key={i} className="card p-6 text-center hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group bg-white">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 mx-auto mb-4 flex items-center justify-center transition-transform group-hover:scale-110 shadow-md">
                  <IconComponent className="w-7 h-7" />
                </div>
                <span className="text-gradient-gold font-display font-bold text-3xl block mb-2">{step.num}</span>
                <h3 className="text-text-primary font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── Features Section (Split Layout with Hand Image) ────────────────
const FeaturesSection = () => {
  const features = [
    { icon: Sparkles, title: 'AI Compatibility Score', desc: 'Our AI engine analyzes 25+ compatibility factors to give you a match score.' },
    { icon: ShieldCheck, title: '100% Verified Profiles', desc: 'Every profile undergoes photo and ID verification to eliminate fake accounts.' },
    { icon: Lock, title: 'Privacy & Contact Protection', desc: 'Control who sees your phone number, email, photos, and horoscope.' },
    { icon: MessageSquare, title: 'Real-Time Secure Messaging', desc: 'Chat safely with matched profiles before exchanging family contacts.' },
  ];

  return (
    <section className="section bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Features */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="section-title text-left">Why <span className="text-gradient">S2S Matrimony?</span></h2>
              <p className="text-text-secondary text-base max-w-xl mt-3">Premium features designed for safe, community-focused matrimony</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((f, i) => {
                const IconComp = f.icon;
                return (
                  <div key={i} className="card p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 group bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 mb-3 flex items-center justify-center transition-transform group-hover:scale-105">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-text-primary font-bold text-base mb-1">{f.title}</h3>
                    <p className="text-text-secondary text-xs leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Banner Image */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative border border-slate-200 p-2 bg-white rounded-3xl shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <img 
                src="/images/hands.png" 
                alt="South Indian Matrimony Hands" 
                className="w-full h-80 object-cover rounded-2xl"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur border border-slate-200 p-4 rounded-2xl shadow-lg">
                <p className="text-text-primary font-bold text-sm">Trust & Tradition</p>
                <p className="text-text-secondary text-xs mt-0.5">Connecting families with traditional values and modern verification.</p>
              </div>
            </div>
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
    }).catch(() => {});
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
    }).catch(() => {});
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

// ── Pricing & Plans Section ──────────────────────────────────
const PricingPlansSection = () => {
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    paymentsApi.getPlans().then((res) => {
      const data = Array.isArray(res) ? res : (res.plans || res.data || []);
      if (Array.isArray(data) && data.length > 0) {
        setDbPlans(data);
      }
    }).catch(() => {});
  }, []);

  const defaultPlans = [
    {
      id: 'free',
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
        { text: 'Basic Search Filters (Age, Religion, Community)', active: true },
        { text: '5 Profile Views per Day', active: true },
        { text: 'Basic Compatibility Score', active: true },
        { text: 'Contact Numbers & Email Unlocks', active: false },
        { text: 'Direct Instant Messaging & Live Chat', active: false },
        { text: 'Priority Search Ranking in Results', active: false },
        { text: 'Dedicated Matchmaking Manager', active: false },
      ],
      ctaText: 'Register Free',
      ctaLink: '/register',
      ctaStyle: 'btn bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300',
    },
    {
      id: 'silver',
      name: 'Silver Plan',
      price: '₹599',
      period: 'per month',
      popular: false,
      badge: 'Popular Choice',
      badgeBg: 'bg-teal-50 text-secondary-dark border-secondary/30 font-bold',
      checkColor: 'text-secondary',
      description: 'Unlock contact details & start connecting with matches',
      features: [
        { text: '50 Daily Expressed Interests', active: true },
        { text: 'Advanced Search & Education Filters', active: true },
        { text: '50 Contact Number & Email Unlocks', active: true },
        { text: 'Direct Instant Messaging & Live Chat', active: true },
        { text: 'Verified Badge Priority on Search', active: true },
        { text: 'Full Horoscope Overview', active: true },
        { text: 'Priority Search Ranking in Results', active: false },
        { text: 'Dedicated Matchmaking Manager', active: false },
      ],
      ctaText: 'Choose Silver',
      ctaLink: '/register',
      ctaStyle: 'btn bg-gradient-secondary text-white font-bold shadow-md hover:opacity-95 border-0',
    },
    {
      id: 'elite',
      name: 'Elite Plan',
      price: '₹999',
      period: 'for 3 months',
      popular: true,
      badge: 'Most Popular ⭐',
      badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold',
      checkColor: 'text-indigo-700',
      description: 'Maximum visibility & unlimited connection privileges',
      features: [
        { text: 'UNLIMITED Expressed Interests', active: true },
        { text: 'Full Horoscope & Porutham Match Reports', active: true },
        { text: '100 Direct Contact & Phone Unlocks', active: true },
        { text: 'Unlimited Direct Messaging & Chat', active: true },
        { text: 'TOP 10 Priority Ranking in Search', active: true },
        { text: 'AI Matchmaking & Compatibility Score', active: true },
        { text: 'Privacy Shield & Photo Lock Control', active: true },
        { text: 'Dedicated Matchmaking Manager', active: false },
      ],
      ctaText: 'Get Elite Plan',
      ctaLink: '/register',
      ctaStyle: 'btn bg-indigo-600 text-white font-extrabold shadow-lg hover:bg-indigo-700 border-0',
    },
    {
      id: 'platinum',
      name: 'Platinum VIP',
      price: '₹1,799',
      period: 'for 6 months',
      popular: false,
      badge: 'Royal VIP Service',
      badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-extrabold',
      checkColor: 'text-cyan-700',
      description: 'Dedicated personal manager and full VIP privileges',
      features: [
        { text: 'UNLIMITED Expressed Interests', active: true },
        { text: 'Full Horoscope & Koota Analysis', active: true },
        { text: 'UNLIMITED Direct Contact Unlocks', active: true },
        { text: 'Unlimited Direct Messaging & Video Call', active: true },
        { text: 'DEDICATED Personal Match Manager', active: true },
        { text: 'Elite Badge Highlighted Profile Card', active: true },
        { text: 'VIP 24/7 Priority Concierge Support', active: true },
        { text: 'Custom Verified Background Check', active: true },
      ],
      ctaText: 'Join Platinum VIP',
      ctaLink: '/register',
      ctaStyle: 'btn bg-cyan-600 text-white font-black shadow-xl hover:bg-cyan-700 border-0',
    },
  ];

  const plansToRender = dbPlans.length > 0 ? dbPlans.map((p) => {
    let name = p.name || 'Membership Plan';
    if (name === 'Diamond Plan' || name === 'Diamond') name = 'Elite Plan';
    const isPopular = p.isPopular || p.tier === 'ELITE' || p.tier === 'ELITE_PLAN';
    const featuresList = Array.isArray(p.features)
      ? p.features.map((f: any) => ({ text: typeof f === 'string' ? f : f.text, active: true }))
      : typeof p.features === 'string'
      ? JSON.parse(p.features).map((f: any) => ({ text: typeof f === 'string' ? f : f.text, active: true }))
      : [{ text: 'Unlimited Profile Access', active: true }, { text: 'Direct Chat', active: true }];
    return {
      id: p.id,
      name,
      price: `₹${p.price ?? 0}`,
      period: p.duration || (p.durationMonths ? `for ${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}` : 'Lifetime'),
      popular: isPopular,
      badge: isPopular ? 'Most Popular ⭐' : (p.tier || 'MEMBER'),
      badgeBg: isPopular ? 'bg-primary/10 text-primary-dark border-primary/30 font-extrabold' : 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
      checkColor: isPopular ? 'text-primary' : 'text-slate-500',
      description: 'Unlock contact details & start connecting with matches',
      features: featuresList,
      ctaText: `Choose ${name}`,
      ctaLink: '/register',
      ctaStyle: isPopular ? 'btn bg-gradient-primary text-white font-extrabold shadow-lg hover:opacity-95 border-0' : 'btn bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300',
    };
  }) : defaultPlans;

  return (
    <section className="section bg-slate-100/60 relative overflow-hidden" id="membership-plans">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary-dark text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Transparent Pricing & Benefits
          </div>
          <h2 className="section-title">
            Choose Your <span className="text-gradient">Membership Plan</span>
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Select the plan that fits your search goals. Upgrade anytime to unlock phone numbers, direct messages, and priority search rankings.
          </p>
        </div>

        <div className="flex flex-wrap justify-center items-stretch gap-6 pt-2 max-w-6xl mx-auto">
          {plansToRender.map((p) => (
            <div
              key={p.id}
              className={`card p-6 flex flex-col justify-between relative transition-all duration-300 rounded-2xl w-full sm:w-[270px] lg:w-[290px] max-w-[320px] flex-1 ${
                p.popular
                  ? 'border-2 border-primary bg-white shadow-2xl scale-[1.04] z-10'
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
      </div>
    </section>
  );
};



// ── CTA Banner ──────────────────────────────────────────
const CTASection = () => (
  <section className="section bg-white">
    <div className="container mx-auto px-4 md:px-8">
      <div 
        className="relative overflow-hidden rounded-3xl p-12 text-center shadow-2xl border border-slate-700 bg-cover bg-center text-white" 
        style={{ backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.88)), url('/images/ceremony.png')" }}
      >
        <div className="relative z-10 space-y-6 max-w-2xl mx-auto text-white">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-xl" style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
            Ready to Find Your Life Partner?
          </h2>
          <p className="text-white text-base md:text-lg leading-relaxed font-medium drop-shadow-md" style={{ color: '#ffffff', textShadow: '0 1px 5px rgba(0,0,0,0.7)' }}>
            Join 50,000+ members who found happiness through S2S Matrimony. Register free in under 2 minutes!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
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
    <PricingPlansSection />
    <SuccessStoriesSection />
    <CommunitiesSection />
    <CTASection />
  </div>
);

export default LandingPage;

