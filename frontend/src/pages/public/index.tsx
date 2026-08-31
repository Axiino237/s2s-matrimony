import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.service';
import { paymentsApi } from '../../services/payments.service';
import api from '../../services/api';
import { useAuthStore, getUserMainRole } from '../../store/auth.store';


// Stub pages for public routes
export const CommunityPage = () => (
  <div className="pt-20 min-h-screen">
    <div className="container mx-auto px-4 md:px-8 py-16 text-center">
      <h1 className="section-title mb-4">Community Matrimony</h1>
      <p className="section-subtitle mb-8">Find matches from your specific community</p>
      <Link to="/search" className="btn btn-primary btn-lg">Search Profiles</Link>
    </div>
  </div>
);

export const SuccessStoriesPage = () => {
  const [dbStories, setDbStories] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/public/success-stories').then((res) => {
      const data = res.data?.stories || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setDbStories(data);
      }
    }).catch(() => {});
  }, []);

  const defaultStories = [
    {
      names: 'Karthik & Shalini',
      location: 'Chennai • Married Jan 2026',
      community: 'Nadar Matrimony',
      image: '/images/couple_happy.png',
      quote: 'We registered on S2S Matrimony and connected within 2 weeks. The horoscope matching tool gave our families 100% confidence. Married in Chennai with blessings!',
      stars: 5,
    },
    {
      names: 'Dr. Ashwin & Divya',
      location: 'Coimbatore • Married Nov 2025',
      community: 'Mudaliar Matrimony',
      image: '/images/couple.png',
      quote: 'Finding an educated doctor partner who valued tradition was seamless with S2S filter tools. We are forever grateful to the S2S team!',
      stars: 5,
    },
    {
      names: 'Venkatesh & Meenakshi',
      location: 'Madurai • Married Feb 2026',
      community: 'Iyer & Iyengar Matrimony',
      image: '/images/ceremony.png',
      quote: 'The privacy controls allowed us to share contact details securely. Today we are happily married with full family support!',
      stars: 5,
    },
    {
      names: 'Siddharth & Priya',
      location: 'Karaikudi • Married Dec 2025',
      community: 'Chettiar Matrimony',
      image: '/images/couple_traditional.png',
      quote: 'The verified profile badges gave my parents total peace of mind. Highly recommend S2S Matrimony to everyone looking for a soulmate!',
      stars: 5,
    },
  ];

  const storiesToRender = dbStories.length > 0 ? dbStories.map((s) => ({
    names: `${s.groomName} & ${s.brideName}`,
    location: s.marriageDate ? new Date(s.marriageDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Verified Union',
    community: 'S2S Matrimony Partner',
    image: s.photo || '/images/couple_happy.png',
    quote: s.story,
    stars: 5,
  })) : defaultStories;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
            ❤️ Real Unions, True Love
          </div>
          <h1 className="font-sans text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Happy <span className="text-gradient">Success Stories</span>
          </h1>
          <p className="text-text-muted text-base max-w-xl mx-auto font-medium">
            Thousands of couples have started their journey together on S2S Matrimony. Read their inspiring stories.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {storiesToRender.map((s, idx) => (
            <div
              key={idx}
              className="card bg-white p-6 border border-slate-200 hover:border-primary/40 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-amber-200 shadow-md">
                <img src={s.image} alt={s.names} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(s.stars)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    💍 Verified Union
                  </span>
                </div>
                <p className="text-slate-700 text-xs sm:text-sm italic leading-relaxed font-medium">
                  "{s.quote}"
                </p>
                <div className="pt-1 border-t border-slate-100">
                  <p className="font-sans font-extrabold text-slate-900 text-base">{s.names}</p>
                  <p className="text-text-muted text-[11px] font-semibold">{s.location} • <span className="text-secondary-dark font-bold">{s.community}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export const MembershipPage = () => {
  const [category, setCategory] = useState<'GENERAL' | 'ELITE' | null>(null);
  const [dbPlans, setDbPlans] = useState<any[]>([]);

  useEffect(() => {
    paymentsApi.getPlans().then((res) => {
      const data = Array.isArray(res) ? res : (res.plans || res.data || []);
      if (Array.isArray(data) && data.length > 0) {
        setDbPlans(data);
      }
    }).catch(() => {});
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
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center w-full">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            ✨ Transparent Plans & Benefits
          </div>
          <h1 className="font-sans text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Membership <span className="text-gradient">Plans</span>
          </h1>
          <p className="text-text-muted text-base">
            Click on a plan category below to explore self-managed General plans or personalized Elite VIP services.
          </p>
        </div>

        {/* Category Toggle - Default null */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="bg-slate-200/90 p-1.5 rounded-2xl flex items-center gap-2 shadow-inner border border-slate-300 max-w-lg w-full">
            <button
              type="button"
              onClick={() => setCategory(category === 'GENERAL' ? null : 'GENERAL')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                category === 'GENERAL'
                  ? 'bg-white text-slate-900 shadow-lg ring-2 ring-primary/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
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
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <span>👑 Elite VIP Plans</span>
              <span className={`text-[10px] py-0.5 px-2 rounded-full font-bold ml-1 ${category === 'ELITE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                3 Plans
              </span>
            </button>
          </div>

          {category && (
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-4 text-center animate-fade-in">
              {category === 'GENERAL'
                ? '✨ General Plans: Self-service membership, instant direct chat, verified profiles & horoscope porutham reports.'
                : '👑 Elite VIP Service: Dedicated senior matchmaking manager, handpicked introductions & complete confidentiality.'}
            </p>
          )}
        </div>

        {/* When Category is Null: Show Interactive Prompt */}
        {category === null ? (
          <div className="max-w-3xl mx-auto py-8 px-4 text-center w-full animate-fade-in">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
                <span className="text-3xl">✨</span>
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
          <div className="flex flex-wrap justify-center items-stretch gap-6 max-w-6xl mx-auto w-full animate-fade-in">
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

                  <div className="space-y-3 mb-8">
                    <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Applicable Features:</p>
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <span className={f.active ? 'text-primary font-bold mt-0.5' : 'text-slate-300 mt-0.5'}>
                          {f.active ? '✓' : '✕'}
                        </span>
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
    </div>
  );
};

export const BlogListPage = () => {
  const [dbBlogs, setDbBlogs] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');

  useEffect(() => {
    api.get('/admin/public/blogs').then((res) => {
      const data = res.data?.blogs || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setDbBlogs(data);
      }
    }).catch(() => {});
  }, []);

  const defaultPosts = [
    {
      id: 'post-1',
      title: 'How to Write the Perfect Matrimony Profile',
      category: 'Profile Tips',
      readTime: '5 min read',
      date: 'July 15, 2026',
      author: 'Dr. Swaminathan',
      image: '/images/couple_happy.png',
      excerpt: 'Learn how to present your education, family background, and partner preferences authentically to attract compatible matches.',
    },
    {
      id: 'post-2',
      title: 'Top 10 Tips for Finding Your Perfect Match',
      category: 'Matchmaking',
      readTime: '6 min read',
      date: 'July 10, 2026',
      author: 'Rethinam Pillai',
      image: '/images/couple.png',
      excerpt: 'Discover practical advice on setting realistic criteria, communicating effectively, and involving family members smoothly.',
    },
    {
      id: 'post-3',
      title: 'Horoscope Matching: What You Need to Know',
      category: 'Horoscope & Porutham',
      readTime: '8 min read',
      date: 'July 05, 2026',
      author: 'Astrologer Sundaram',
      image: '/images/ceremony.png',
      excerpt: 'Understanding the 10 Poruthams, Chevvai Dosham, and how online horoscope tools calculate exact Gothram compatibility.',
    },
    {
      id: 'post-4',
      title: 'Photo Tips for Your Matrimony Profile',
      category: 'Profile Tips',
      readTime: '4 min read',
      date: 'June 28, 2026',
      author: 'Priya Ramanathan',
      image: '/images/couple_happy.png',
      excerpt: 'Why clear, natural lighting and traditional attire photos increase express interest response rates by 300%.',
    },
    {
      id: 'post-5',
      title: 'How to Talk to Prospective Partners',
      category: 'Relationship Guide',
      readTime: '7 min read',
      date: 'June 20, 2026',
      author: 'Kavitha Mudaliar',
      image: '/images/couple.png',
      excerpt: 'First conversation guide: icebreaker questions, discussing career goals, location flexibility, and mutual respect.',
    },
    {
      id: 'post-6',
      title: 'Wedding Planning on a Budget in Tamil Nadu',
      category: 'Wedding Guide',
      readTime: '9 min read',
      date: 'June 12, 2026',
      author: 'Venkatesh Iyer',
      image: '/images/ceremony.png',
      excerpt: 'Smart tips for booking marriage halls, catering menus, photography teams, and jewelry shopping without overspending.',
    },
  ];

  const postsToRender = useMemo(() => {
    return dbBlogs.length > 0 ? dbBlogs.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category?.name || 'Matrimony Advice',
      readTime: '5 min read',
      date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Published',
      author: 'S2S Editorial Team',
      image: b.coverImage || '/images/ceremony.png',
      excerpt: b.content ? b.content.slice(0, 140) + '...' : b.title,
    })) : defaultPosts;
  }, [dbBlogs]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    postsToRender.forEach(p => { if (p.category) cats.add(p.category); });
    return ['All', ...Array.from(cats)];
  }, [postsToRender]);

  const filteredPosts = useMemo(() => {
    return postsToRender.filter((post) => {
      const matchesCat = selectedCategory === 'All' || post.category.toLowerCase() === selectedCategory.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    }).sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [postsToRender, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary-dark text-xs font-bold uppercase tracking-wider mb-3">
            📚 Matrimony Insights & Advice
          </div>
          <h1 className="font-sans text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Matrimony <span className="text-gradient">Blog & Tips</span>
          </h1>
          <p className="text-text-muted text-base max-w-xl mx-auto font-medium">
            Expert articles on profile creation, horoscope matching, first meetings, and wedding planning.
          </p>
        </div>

        {/* Filter & Search Bar Section */}
        <div className="max-w-6xl mx-auto mb-10 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search articles by title, category, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-primary cursor-pointer"
              >
                <option value="latest">Latest Published</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600 to-teal-600 text-white border-transparent shadow-md shadow-rose-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'All' ? '✨ All Articles' : cat}
                </button>
              );
            })}
          </div>

          {/* Active Filter Count & Reset */}
          {(selectedCategory !== 'All' || searchQuery) && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
              <span>Showing <strong>{filteredPosts.length}</strong> matching articles</span>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Blog Cards Grid or No Results */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="text-5xl">🔍</div>
            <h3 className="font-sans text-xl font-bold text-slate-900">No Articles Found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No blog posts matched your search "{searchQuery}" under category "{selectedCategory}". Try clearing your filters.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="btn btn-primary btn-sm font-bold mt-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredPosts.map((post, idx) => (
              <Link
                key={idx}
                to={`/blog/${post.id || 'post-1'}`}
                className="card bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-slate-200">
                    {post.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-text-muted text-xs font-semibold mb-2">
                      <span>{post.author}</span> • <span>{post.date}</span>
                    </div>
                    <h3 className="font-sans text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-text-muted text-xs leading-relaxed mt-2 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary">
                    <span>Read Full Article →</span>
                    <span className="text-text-muted font-normal">{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BlogDetailPage = () => (
  <div className="pt-24 pb-16 min-h-screen bg-slate-50">
    <div className="container mx-auto px-4 md:px-8 max-w-3xl">
      <Link to="/blog" className="text-primary text-xs font-bold mb-6 inline-flex items-center gap-1 hover:underline">
        ← Back to Blog & Tips
      </Link>
      <div className="card bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <span className="bg-primary/10 text-primary-dark text-xs font-bold px-3 py-1 rounded-full inline-block">
          Profile Advice
        </span>
        <h1 className="font-sans text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          How to Write the Perfect Matrimony Profile
        </h1>
        <div className="flex items-center gap-4 text-xs text-text-muted border-b border-slate-100 pb-4">
          <span>By Dr. Swaminathan</span> • <span>July 15, 2026</span> • <span>5 min read</span>
        </div>
        <div className="aspect-video rounded-2xl overflow-hidden shadow-md">
          <img src="/images/couple_happy.png" alt="Couple" className="w-full h-full object-cover" />
        </div>
        <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4 font-normal">
          <p>
            Creating an appealing matrimony profile is the very first step toward finding your ideal life partner. 
            Families and candidates evaluate profiles based on clarity, authenticity, and shared cultural values.
          </p>
          <h2 className="text-xl font-bold text-slate-900 pt-2">1. Be Honest About Family Background & Career</h2>
          <p>
            Clearly mention your degree, current occupation, organization type, and native town. 
            Genuine information builds trust immediately.
          </p>
          <h2 className="text-xl font-bold text-slate-900 pt-2">2. Upload Clear, Professional Photos</h2>
          <p>
            Profiles with high-quality photos receive up to 300% more expressed interests. 
            Ensure you include at least one close-up and one full-length photograph.
          </p>
        </div>
      </div>
    </div>
  </div>
);

export const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary-dark text-xs font-bold uppercase tracking-wider mb-3">
            📞 We Are Here To Help
          </div>
          <h1 className="font-sans text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Contact <span className="text-gradient">S2S Support</span>
          </h1>
          <p className="text-text-muted text-base max-w-lg mx-auto font-medium">
            Have questions about membership plans, horoscope matching, or profile verification? Our team is available 24/7.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="card bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5">
              <h3 className="font-sans text-lg font-extrabold text-slate-900">Headquarters & Offices</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm">📍 Chennai HQ</p>
                  <p className="text-text-muted leading-relaxed">No. 42, Usman Road, T.Nagar, Chennai - 600017</p>
                </div>

                <div>
                  <p className="font-extrabold text-slate-900 text-sm">📍 Coimbatore Regional Office</p>
                  <p className="text-text-muted leading-relaxed">104 DB Road, RS Puram, Coimbatore - 641002</p>
                </div>

                <div>
                  <p className="font-extrabold text-slate-900 text-sm">📍 Madurai Regional Office</p>
                  <p className="text-text-muted leading-relaxed">18 KK Nagar Main Road, Madurai - 625020</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="flex items-center gap-2 text-slate-800 font-bold">
                  <span>📞 Helpline:</span> <a href="tel:+918438011191" className="text-primary font-extrabold hover:underline">+91 84380 11191</a>
                </p>
                <p className="flex items-center gap-2 text-slate-800 font-bold">
                  <span>✉️ Email:</span> <a href="mailto:s2smdoffice@gmail.com" className="text-secondary-dark font-bold hover:underline">s2smdoffice@gmail.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="md:col-span-7">
            <div className="card bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
              {sent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                    ✓
                  </div>
                  <h3 className="font-sans text-2xl font-black text-slate-900">Message Sent Successfully!</h3>
                  <p className="text-text-muted text-sm max-w-sm mx-auto">
                    Thank you for reaching out to S2S Matrimony. Our matchmaking executive will call or email you within 2 hours.
                  </p>
                  <button onClick={() => setSent(false)} className="btn btn-primary btn-sm font-bold mt-2">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-sans text-xl font-extrabold text-slate-900">Send Us A Message</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                      <input
                        required
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">How can we help?</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your query or request..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full py-3 text-xs font-extrabold shadow-lg">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export const AboutPage = () => (
  <div className="pt-20 min-h-screen">
    <div className="container mx-auto px-4 md:px-8 py-16 max-w-4xl">
      <h1 className="section-title mb-4">About <span className="text-gradient">S2S Matrimony</span></h1>
      <p className="text-text-secondary text-lg leading-relaxed mb-6">
        S2S Matrimony is a trusted community-based matrimony platform connecting thousands of families across India. 
        Founded with the mission to make finding a life partner easier, safer, and community-specific, 
        we serve 200+ communities with verified profiles and AI-powered matching.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['50K+', 'Members'], ['10K+', 'Marriages'], ['200+', 'Communities'], ['2019', 'Founded']].map(([num, label]) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-gradient font-display font-bold text-2xl">{num}</p>
            <p className="text-text-secondary text-sm">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="text-8xl mb-6">404</div>
      <h1 className="font-display text-4xl font-bold text-white mb-4">Page Not Found</h1>
      <p className="text-text-secondary mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  </div>
);

export const UnauthorizedPage = () => {
  const { user } = useAuthStore();

  const getDashboardLink = () => {
    if (!user) return '/login';
    const role = getUserMainRole(user);

    if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
    if (role === 'ADMIN' || role === 'MODERATOR' || role === 'SUPPORT_AGENT') return '/admin/dashboard';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
          🔒
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">Access Restricted</h1>
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          You do not have sufficient role permissions to view this section. If you believe this is an error, please switch to an admin account or return to your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Home Page
          </Link>
          <Link to={getDashboardLink()} className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-semibold hover:opacity-95 shadow-md transition-all">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default {};
