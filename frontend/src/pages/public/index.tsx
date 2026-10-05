import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/admin.service';
import { paymentsApi } from '../../services/payments.service';
import { contactApi } from '../../services/contact.service';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { useSettingsStore } from '../../store/settings.store';


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
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    paymentsApi.getPlans().then((res) => {
      const data = Array.isArray(res) ? res : (res.plans || res.data || []);
      if (Array.isArray(data) && data.length > 0) {
        setDbPlans(data);
      }
    }).catch(() => {});
  }, []);

  const defaultPlans = [
    { name: 'Free', price: '₹0', features: ['5 Daily Interests', 'Basic Search', '5 Profile Views/day'] },
    { name: 'Silver', price: '₹599', period: '/month', features: ['50 Interests/day', '50 Contact Views', 'Direct Chat'] },
    { name: 'Elite', price: '₹999', period: '/3 months', features: ['Unlimited Interests', 'Chat Access', '100 Contact Views', 'Priority Listing'] },
    { name: 'Platinum', price: '₹1,799', period: '/6 months', features: ['Everything in Elite', 'Unlimited Contacts', 'AI Match Score', 'Horoscope Report'] },
  ];

  const rawPlans = dbPlans.length > 0 ? dbPlans : defaultPlans;

  const getPlanRank = (plan: any): number => {
    const tier = (plan.tier || '').toUpperCase();
    const name = (plan.name || '').toLowerCase();

    if (tier === 'FREE' || name.includes('free')) return 1;
    if (tier === 'SILVER' || name.includes('silver')) return 2;
    if (tier === 'GOLD' || name.includes('gold')) return 3;
    if (tier === 'ELITE' || name.includes('elite')) return 4;
    if (tier === 'PLATINUM' || name.includes('platinum')) return 5;
    if (tier === 'DIAMOND' || name.includes('diamond')) return 6;
    return 100;
  };

  const sortedPlans = [...rawPlans].sort((a, b) => {
    const rankA = getPlanRank(a);
    const rankB = getPlanRank(b);
    if (rankA !== rankB) return rankA - rankB;
    const priceA = parseFloat(String(a.price).replace(/[^\d.]/g, '') || '0');
    const priceB = parseFloat(String(b.price).replace(/[^\d.]/g, '') || '0');
    return priceA - priceB;
  });

  const forbiddenFeatures = [
    'whatsapp connect',
    'dedicated manager',
    'dedicated match manager',
    'dedicated relationship manager',
    'video profile',
    'video profile highlight',
    'video highlight',
    'advanced search',
  ];

  const plansToRender = sortedPlans.map((p) => {
    const rawFeats: any[] = Array.isArray(p.features)
      ? p.features
      : typeof p.features === 'string'
      ? JSON.parse(p.features)
      : ['Unlimited Profile Access', 'Direct Chat'];

    const filteredFeats = rawFeats.filter((f) => {
      const text = (typeof f === 'string' ? f : f?.text || '').toLowerCase().trim();
      return !forbiddenFeatures.some((k) => text.includes(k) || k.includes(text));
    });

    return {
      id: p.id,
      tier: p.tier,
      name: p.name === 'Diamond Plan' || p.name === 'Diamond' ? 'Elite Plan' : p.name,
      price: `₹${parseFloat(String(p.price).replace(/[^\d.]/g, '') || '0')}`,
      period: p.period || p.duration || (p.durationMonths ? `/${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}` : ''),
      features: filteredFeats,
      isPopular: p.isPopular || (p.tier === 'ELITE' && !sortedPlans.some((x: any) => x.isPopular && x.id !== p.id)),
    };
  });

  const handleSelectPlan = (plan: any) => {
    if (isAuthenticated) {
      navigate('/premium');
    } else {
      navigate('/register', {
        state: {
          selectedPlan: plan.name,
          planId: plan.id,
          tier: plan.tier,
          from: { pathname: '/premium' },
        },
      });
    }
  };

  return (
    <div className="pt-20 min-h-screen flex justify-center w-full">
      <div className="container mx-auto px-4 md:px-8 py-16 flex flex-col items-center w-full">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="section-title mb-4">Membership <span className="text-gradient">Plans</span></h1>
          <p className="section-subtitle">Choose the plan that fits you</p>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${plansToRender.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-6 max-w-6xl mx-auto w-full`}>
          {plansToRender.map((plan: any, i: number) => {
            const isPopular = plan.isPopular || (plansToRender.length === 3 && i === 2) || (plansToRender.length === 4 && i === 2);
            return (
              <div
                key={i}
                onClick={() => handleSelectPlan(plan)}
                className={`plan-card w-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${
                  isPopular ? 'plan-card-popular border-2 border-primary/60 shadow-xl lg:scale-[1.02] z-10' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 inset-x-0 flex justify-center">
                    <span className="bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-b-xl shadow-sm">
                      Popular
                    </span>
                  </div>
                )}
                <div className={`${isPopular ? 'pt-6' : ''} flex flex-col justify-between h-full`}>
                  <div>
                    <h3 className="text-text-primary font-bold text-xl mb-2">{plan.name}</h3>
                    <div className="flex items-end gap-1 mb-5">
                      <span className="text-3xl font-extrabold text-gradient">{plan.price}</span>
                      {plan.period && <span className="text-text-muted text-xs mb-1 font-medium">{plan.period}</span>}
                    </div>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f: any, j: number) => (
                        <li key={j} className="text-sm text-text-secondary flex gap-2 items-start">
                          <span className="text-primary font-bold mt-0.5">✓</span>
                          <span>{typeof f === 'string' ? f : f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(plan);
                    }}
                    className={`btn w-full font-bold py-3 mt-4 ${isPopular ? 'btn-primary shadow-md' : 'btn-secondary'}`}
                  >
                    Choose {plan.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-text-secondary">
          Already registered?{' '}
          <Link
            to="/login"
            state={{ from: { pathname: '/premium' } }}
            className="text-primary font-semibold hover:underline"
          >
            Log in to upgrade your membership
          </Link>
        </div>
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
      slug: b.slug || b.id,
      title: b.title,
      category: b.category?.name || 'Matrimony Advice',
      readTime: '5 min read',
      date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Published',
      author: 'S2S Editorial Team',
      image: b.coverImage || '/images/ceremony.png',
      excerpt: b.excerpt || (b.content ? b.content.slice(0, 140) + '...' : b.title),
    })) : defaultPosts.map((p) => ({ ...p, slug: p.id }));
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
                to={`/blog/${post.slug || post.id}`}
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

export const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    api.get(`/admin/public/blogs/${slug}`)
      .then((res) => {
        setBlog(res.data);
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? 'Blog article not found.' : 'Failed to load article.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm mt-8 space-y-4">
          <div className="text-5xl">📄</div>
          <h2 className="font-sans text-2xl font-bold text-slate-900">Article Not Found</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {error || 'The blog article you are looking for does not exist or may have been removed.'}
          </p>
          <Link to="/blog" className="btn btn-primary btn-sm font-bold mt-2 inline-flex items-center gap-2">
            ← Back to Blog & Tips
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = blog.category?.name || 'Matrimony Advice';
  const publishedDate = blog.publishedAt || blog.createdAt
    ? new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently Published';

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <Link to="/blog" className="text-primary text-xs font-bold mb-6 inline-flex items-center gap-1 hover:underline">
          ← Back to Blog & Tips
        </Link>
        <div className="card bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <span className="bg-primary/10 text-primary-dark text-xs font-bold px-3 py-1 rounded-full inline-block">
            {categoryName}
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-text-muted border-b border-slate-100 pb-4">
            <span>By S2S Editorial Team</span> • <span>{publishedDate}</span> • <span>5 min read</span>
          </div>
          {blog.coverImage && (
            <div className="aspect-video rounded-2xl overflow-hidden shadow-md bg-slate-100">
              <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}
          {blog.excerpt && (
            <p className="text-slate-600 text-base italic border-l-4 border-primary pl-4 py-1 font-medium bg-slate-50 rounded-r-xl">
              {blog.excerpt}
            </p>
          )}
          <div className="text-slate-700 text-sm md:text-base leading-relaxed space-y-4 font-normal whitespace-pre-line">
            {blog.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ContactPage = () => {
  const { contact, fetchSettings } = useSettingsStore();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.error('Please enter your name');
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      return toast.error('Please enter a valid email address');
    }
    if (!formData.message.trim()) {
      return toast.error('Please describe your query or request');
    }

    setLoading(true);
    try {
      const res = await contactApi.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
      });
      setSent(true);
      toast.success(res?.message || 'Message delivered to S2S Support successfully!');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message) ? err.response.data.message.join(', ') : null) ||
        err?.message ||
        'Failed to deliver message. Please try calling our helpline or try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
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
            {contact.intro ||
              'Have questions about membership plans, horoscope matching, or profile verification? Our team is available 24/7.'}
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Left Info Column */}
          <div className="md:col-span-5 space-y-6">
            <div className="card bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5">
              <h3 className="font-sans text-lg font-extrabold text-slate-900">Headquarters & Offices</h3>

              <div className="space-y-4 text-xs">
                {contact.offices.map((office, idx) => (
                  <a
                    key={idx}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group transition-colors"
                    title={`Open ${office.title || 'Office'} in Google Maps`}
                  >
                    <p className="font-extrabold text-slate-900 text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                      <span className="group-hover:scale-110 transition-transform">📍</span> {office.title || 'Office Address'}
                    </p>
                    <p className="text-text-muted leading-relaxed group-hover:text-slate-800 transition-colors whitespace-pre-line">
                      {office.address}
                    </p>
                  </a>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 text-slate-800 font-bold hover:text-primary transition-colors group"
                  title="Call Helpline"
                >
                  <span>📞 Helpline:</span>
                  <span className="text-primary font-extrabold group-hover:underline">{contact.phone}</span>
                </a>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-slate-800 font-bold hover:text-primary transition-colors group"
                  title="Send Email"
                >
                  <span>✉️ Email:</span>
                  <span className="text-secondary-dark font-bold group-hover:underline">{contact.email}</span>
                </a>
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-800 font-bold hover:text-emerald-600 transition-colors group"
                    title="Chat on WhatsApp"
                  >
                    <span>💬 WhatsApp:</span>
                    <span className="text-emerald-600 font-bold group-hover:underline">{contact.whatsapp}</span>
                  </a>
                )}
                {contact.officeHours && (
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <span>🕐 Hours:</span>
                    <span>{contact.officeHours}</span>
                  </div>
                )}
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
                    Thank you for reaching out to S2S Matrimony. Your inquiry has been forwarded directly to our support inbox. Our team will get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
                    }}
                    className="btn btn-primary btn-sm font-bold mt-2"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-sans text-xl font-extrabold text-slate-900">Send Us A Message</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name *</label>
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
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address *</label>
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
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Plan inquiry, Profile help"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">How can we help? *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your query or request..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3 text-xs font-extrabold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      'Send Message'
                    )}
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


export { AboutPage } from './AboutPage';

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
  const { isSuperAdmin, isAdmin } = useAuthStore();
  const dashboardLink = isSuperAdmin()
    ? '/super-admin/dashboard'
    : isAdmin()
    ? '/admin/dashboard'
    : '/dashboard';

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
          <Link to={dashboardLink} className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-semibold hover:opacity-95 shadow-md transition-all">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export { TermsPage } from './TermsPage';
export { PrivacyPage } from './PrivacyPage';
export { FaqPage } from './FaqPage';
export { SitemapPage } from './SitemapPage';

export default {};
