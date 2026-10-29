import { useParams, Link } from 'react-router-dom';
import { 
  Users, ShieldCheck, Heart, Sparkles, MapPin, 
  Search, ArrowRight, CheckCircle2, Lock 
} from 'lucide-react';
import SEO from '../../components/common/SEO';
import { VERIFIED_COMMUNITIES } from '../../data/communityData';

export const CommunityPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = (slug || '').toLowerCase().trim();
  const community = VERIFIED_COMMUNITIES[normalizedSlug];

  if (!community) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-slate-50">
        <SEO
          title="Community Matrimony Directory — S2S Matrimony"
          description="Browse verified community matrimony portals across Tamil Nadu and South India on S2S Matrimony."
          noindex={true}
        />
        <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center py-16">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            🏛️
          </div>
          <h1 className="font-sans text-3xl font-extrabold text-slate-900 mb-3">
            Explore Community Matrimony Portals
          </h1>
          <p className="text-slate-600 text-sm max-w-lg mx-auto mb-8">
            Select your specific community to discover verified profiles, Vedic 10-Porutham horoscope matching, and safe matchmaking.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-left">
            {Object.values(VERIFIED_COMMUNITIES).map((c) => (
              <Link
                key={c.slug}
                to={`/community/${c.slug}`}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <p className="font-bold text-slate-900 group-hover:text-primary transition-colors text-sm">
                  {c.categoryName}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  {c.subCommunities.length}+ Sub-communities
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Link to="/search" className="btn btn-primary btn-sm font-bold">
              Browse All Profiles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Breadcrumb Schema for SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://s2smatrimony.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Communities',
        item: 'https://s2smatrimony.com/sitemap',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: community.categoryName,
        item: `https://s2smatrimony.com/community/${community.slug}`,
      },
    ],
  };

  const otherCommunities = Object.values(VERIFIED_COMMUNITIES)
    .filter((c) => c.slug !== community.slug)
    .slice(0, 6);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50">
      <SEO
        title={community.title}
        description={community.metaDescription}
        canonical={`/community/${community.slug}`}
        jsonLd={breadcrumbSchema}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/sitemap" className="hover:text-primary transition-colors">Communities</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">{community.name}</span>
        </nav>

        {/* Hero Banner */}
        <div className="card bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-primary text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Verified {community.name} Matchmaking
          </div>

          <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            {community.categoryName}
          </h1>

          <p className="text-slate-700 text-base md:text-lg leading-relaxed max-w-3xl font-normal">
            {community.summary}
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/register"
              state={{ community: community.name }}
              className="btn btn-primary btn-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-current" /> Register Free for {community.name} Matrimony
            </Link>
            <Link
              to={`/search?community=${encodeURIComponent(community.name)}`}
              className="btn btn-secondary btn-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Browse {community.name} Profiles
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">100% Mobile & ID Verified Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="font-semibold">Vedic 10-Porutham Compatibility</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="font-semibold">Zero Public Contact Exposure</span>
            </div>
          </div>
        </div>

        {/* Sub-communities & Gotrams Section */}
        <div className="card bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span>Ancestral Roots & Sub-Castes</span>
          </div>
          <h2 className="font-sans text-2xl font-black text-slate-900">
            Sub-Communities & Divisions Supported
          </h2>
          <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
            S2S Matrimony accommodates detailed sub-community classifications, Gotra distinctions, and family roots for {community.name} families:
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {community.subCommunities.map((sub, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Traditions & Regions Two-Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Traditions Card */}
          <div className="card bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
              <span>Wedding Customs & Porutham</span>
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900">
              Traditional Practices & Horoscopes
            </h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
              {community.traditions}
            </p>
            <div className="pt-2">
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">✨ Vedic 10-Porutham Matching Included</p>
                <p className="text-[11px] leading-relaxed">
                  Automatic Dina, Gana, Mahendra, Stree Deerkha, Yoni, Rasi, Rasyadhipathi, Vasiya, Rajju, and Vedha compatibility calculations.
                </p>
              </div>
            </div>
          </div>

          {/* Regional Presence Card */}
          <div className="card bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-secondary-dark font-bold text-xs uppercase tracking-wider">
              <span>Key Locations</span>
            </div>
            <h2 className="font-sans text-xl font-bold text-slate-900">
              Active Regional Hubs
            </h2>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
              Verified {community.name} matrimonial biodatas are active across major metropolitan centers, regional cities, and global Tamil families:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold text-slate-700">
              {community.keyLocations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strict Privacy Guarantee Box */}
        <div className="card bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-xl mb-12 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" /> Member Privacy Standard
          </div>
          <h2 className="font-sans text-xl font-extrabold text-white">
            How S2S Matrimony Protects Your Family Privacy
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            In compliance with our strict privacy framework, member phone numbers, email addresses, horoscopes, and private photographs are never exposed on search engines or publicly readable web crawlers. Contact details are accessible solely through mutual interest acceptance or authenticated subscriber permissions.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Phone Masking
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Watermarked Photos
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Strict Family Consent
            </span>
          </div>
        </div>

        {/* Related Communities Internal Links */}
        <div className="card bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xl font-bold text-slate-900">
              Explore Other Tamil & South Indian Communities
            </h2>
            <Link to="/sitemap" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {otherCommunities.map((c) => (
              <Link
                key={c.slug}
                to={`/community/${c.slug}`}
                className="p-3 bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-primary/40 rounded-2xl text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-primary mx-auto mb-1.5 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {c.name[0]}
                </div>
                <p className="font-bold text-slate-900 group-hover:text-primary transition-colors text-xs truncate">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
