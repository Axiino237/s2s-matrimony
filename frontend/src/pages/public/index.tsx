import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.service';
import { paymentsApi } from '../../services/payments.service';
import api from '../../services/api';


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
    { name: 'Silver', price: '₹599', period: '/month', features: ['50 Interests/day', 'Advanced Search', '50 Contact Views'] },
    { name: 'Elite', price: '₹999', period: '/3 months', features: ['Unlimited Interests', 'Chat Access', '100 Contact Views', 'Priority Listing'] },
    { name: 'Platinum', price: '₹1,799', period: '/6 months', features: ['Everything in Elite', 'Unlimited Contacts', 'AI Match Score', 'Video Profile', 'Dedicated Manager'] },
  ];

  const plansToRender = dbPlans.length > 0 ? dbPlans.map((p) => ({
    name: p.name === 'Diamond Plan' || p.name === 'Diamond' ? 'Elite Plan' : p.name,
    price: `₹${p.price ?? 0}`,
    period: p.duration || (p.durationMonths ? `/${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}` : ''),
    features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? JSON.parse(p.features) : ['Unlimited Profile Access', 'Direct Chat'],
    isPopular: p.isPopular || p.tier === 'ELITE',
  })) : defaultPlans.map((p, idx) => ({ ...p, isPopular: idx === 2 }));

  return (
    <div className="pt-20 min-h-screen flex justify-center w-full">
      <div className="container mx-auto px-4 md:px-8 py-16 flex flex-col items-center w-full">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="section-title mb-4">Membership <span className="text-gradient">Plans</span></h1>
          <p className="section-subtitle">Choose the plan that fits you</p>
        </div>
        <div className="flex flex-wrap justify-center items-stretch gap-6 max-w-6xl mx-auto">
          {plansToRender.map((plan: any, i: number) => {
            const isPopular = plan.isPopular || (plansToRender.length === 3 && i === 2) || (plansToRender.length === 4 && i === 2);
            return (
              <div
                key={i}
                className={`plan-card w-full sm:w-[280px] md:w-[300px] lg:w-[310px] max-w-[340px] flex-1 ${
                  isPopular ? 'plan-card-popular border-2 border-primary/60 shadow-xl scale-[1.02] z-10' : ''
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
                  <button className={`btn w-full font-bold py-3 mt-4 ${isPopular ? 'btn-primary shadow-md' : 'btn-secondary'}`}>
                    Choose {plan.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const BlogListPage = () => {
  const [dbBlogs, setDbBlogs] = useState<any[]>([]);

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

  const postsToRender = dbBlogs.length > 0 ? dbBlogs.map((b) => ({
    id: b.id,
    title: b.title,
    category: b.category?.name || 'Matrimony Advice',
    readTime: '5 min read',
    date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Published',
    author: 'S2S Editorial Team',
    image: b.coverImage || '/images/ceremony.png',
    excerpt: b.content ? b.content.slice(0, 140) + '...' : b.title,
  })) : defaultPosts;

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {postsToRender.map((post, idx) => (
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
                  <span>📞 Helpline:</span> <span className="text-primary font-extrabold">+91 98765 43210</span>
                </p>
                <p className="flex items-center gap-2 text-slate-800 font-bold">
                  <span>✉️ Email:</span> <span className="text-secondary-dark font-bold">support@s2smatrimony.com</span>
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

export const UnauthorizedPage = () => (
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
        <Link to="/dashboard" className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-semibold hover:opacity-95 shadow-md transition-all">
          Go to Dashboard
        </Link>
      </div>
    </div>
  </div>
);

export default {};
