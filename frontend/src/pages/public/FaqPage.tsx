import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, ChevronDown, ChevronUp, MessageCircle, Phone, Mail, ShieldCheck, Heart, Sparkles, UserCheck, CreditCard } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'account' | 'membership' | 'privacy' | 'horoscope';
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: '1',
    category: 'general',
    question: 'What makes S2S Community Matrimony different from other matrimony sites?',
    answer: 'S2S Community Matrimony is purpose-built for authentic community-centered matchmaking. We combine verified profiles (phone + Aadhaar/Govt ID verification), advanced AI Porutham horoscope compatibility, strict photo/contact privacy controls, and dedicated support to help families and individuals find life partners with confidence.',
  },
  {
    id: '2',
    category: 'account',
    question: 'How do I create a matrimony profile?',
    answer: 'Click on "Register Free", choose who the profile is for (Self, Son, Daughter, Brother, Sister, or Relative), enter basic personal details, and verify your mobile number. You can then fill out your detailed biodata including education, profession, family background, and horoscope details.',
  },
  {
    id: '3',
    category: 'account',
    question: 'Can parents or siblings manage a profile on behalf of the candidate?',
    answer: 'Yes! During registration, you can choose "Son", "Daughter", "Sibling", or "Relative" under "Profile Created For". The managing guardian can handle communication, view matches, and receive interest requests.',
  },
  {
    id: '4',
    category: 'account',
    question: 'How does profile verification work and what is the Verified Badge?',
    answer: 'Members can upload a government ID (such as Aadhaar, Voter ID, or Passport) in their profile settings. Our verification team reviews the document within 24 hours. Once approved, a green "Verified Member" badge is displayed on your card, which increases match inquiries by up to 3x.',
  },
  {
    id: '5',
    category: 'membership',
    question: 'Is registration on S2S Matrimony free?',
    answer: 'Yes, registration is 100% free! Free members can create a profile, upload photos and horoscopes, search and view profile summaries, and receive interest requests from prospective matches.',
  },
  {
    id: '6',
    category: 'membership',
    question: 'What are the benefits of upgrading to a Premium Plan?',
    answer: 'Premium plans unlock direct contact phone numbers, instant messaging/chat, horoscope porutham matching reports, priority profile listing in search results, and dedicated relationship manager assistance depending on your chosen tier (Silver, Gold, or Platinum).',
  },
  {
    id: '7',
    category: 'membership',
    question: 'How do contact view credits work?',
    answer: 'Each membership plan includes a quota of verified contact unlocks (e.g. 25, 50, or unlimited contacts). When you view a member\'s phone number or address, one credit is used. Unused contact views remain valid for the entire duration of your plan.',
  },
  {
    id: '8',
    category: 'privacy',
    question: 'Is my phone number and email visible to anyone on the internet?',
    answer: 'No. Your phone number, email address, and street address are never visible to the public or search engines. They can only be accessed by authenticated members who have an active plan or with whom you have mutually accepted interest.',
  },
  {
    id: '9',
    category: 'privacy',
    question: 'Can I protect my photos so they are not downloaded or misused?',
    answer: 'Yes! We provide built-in photo watermarking that embeds your Member ID and S2S Matrimony branding across all uploaded images. Additionally, you can set your photos to "Visible Only Upon Accepted Request" or blur them for anonymous browsing.',
  },
  {
    id: '10',
    category: 'horoscope',
    question: 'How does AI Horoscope & Porutham matching work?',
    answer: 'Our platform supports traditional South Indian 10-Porutham (Dasa Porutham) calculations based on Rasi, Nakshatram, and Padham. Our matching engine automatically computes compatibility scores, highlights Kuja / Sevvai / Rahu-Ketu dosham alignments, and recommends compatible stars.',
  },
  {
    id: '11',
    category: 'account',
    question: 'How do I edit my biodata or caste details after registration?',
    answer: 'Log in to your member account, go to "My Profile" or "Edit Profile", and update your information. You can edit community, education, occupation, partner preferences, and astrological details anytime.',
  },
  {
    id: '12',
    category: 'privacy',
    question: 'How can I temporarily hide or permanently delete my profile?',
    answer: 'If you wish to take a temporary break or have finalized your marriage, you can toggle "Profile Visibility" to hidden in your settings. You can also permanently delete your account and all associated data at any time from your account settings.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions', icon: HelpCircle },
  { key: 'general', label: 'General', icon: Sparkles },
  { key: 'account', label: 'Registration & Profile', icon: UserCheck },
  { key: 'membership', label: 'Plans & Payments', icon: CreditCard },
  { key: 'privacy', label: 'Privacy & Security', icon: ShieldCheck },
  { key: 'horoscope', label: 'Horoscope Matching', icon: Heart },
];

export const FaqPage = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['1', '2']);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch =
        search.trim() === '' ||
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-400/30 rounded-full px-3.5 py-1 text-primary-300 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" /> Help Center & Knowledge Base
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Everything you need to know about registering, profile verification, membership plans, and finding your life partner on S2S Matrimony.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions (e.g. contact views, verification, horoscope)..."
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-20">
        {/* Category Pills */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 p-2 sm:p-3 mb-8 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No matching questions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find an answer matching "{search}". Please try another keyword or reach out to our team.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="mt-2 inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {faq.question}
                    </span>
                    <span className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-12 bg-gradient-to-br from-primary-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <MessageCircle className="w-3.5 h-3.5" /> Direct Support
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display">
                Still have questions? We're here to help
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md">
                Our matrimonial counsellors and customer support team are available Monday through Saturday, 9 AM – 6 PM.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/contact"
                className="px-5 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-md text-center inline-flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4 text-primary" /> Contact Us
              </Link>
              <a
                href="tel:+914412345678"
                className="px-5 py-3 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm hover:bg-primary-600 transition-colors shadow-md text-center inline-flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> +91 44 1234 5678
              </a>
            </div>
          </div>
        </div>

        {/* Quick Footer Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <Link to="/" className="text-primary font-bold hover:underline">
            ← Back to Home
          </Link>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/sitemap" className="hover:underline">Sitemap</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
