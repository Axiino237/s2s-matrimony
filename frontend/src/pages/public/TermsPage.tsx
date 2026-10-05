import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, CheckCircle2, AlertCircle, ArrowLeft, Scale, Lock, Heart, HelpCircle, Mail } from 'lucide-react';

export const TermsPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'eligibility' | 'conduct' | 'membership' | 'liability'>('all');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-300/30 rounded-full px-3.5 py-1 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" /> Legal Agreement
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Terms &{' '}
            <span className="bg-gradient-to-r from-rose-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Please read these terms carefully before creating an account or using S2S Community Matrimony.
          </p>
          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-4">
            <span>Last Updated: January 1, 2026</span>
            <span>•</span>
            <span>Effective Immediately</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-20">
        {/* Quick Summary Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-5 sm:p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Key Highlights for Members
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Authentic Profiles</span>
              Only registered individuals looking for genuine matrimonial alliances are allowed. Commercial use or casual dating is strictly prohibited.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Age Eligibility</span>
              Minimum age is 18 years for women and 21 years for men in accordance with Indian Law.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Privacy & Safety</span>
              Your contact info is never shared without your mutual permission. Report any suspicious behavior immediately.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-10 text-sm leading-relaxed text-slate-700">
          
          {/* Section 1 */}
          <section id="acceptance" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">1</span>
              Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>S2S Community Matrimony</strong> (&ldquo;S2S Matrimony&rdquo;, &ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing, registering on, or using our website and matchmaking services, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Platform. These terms apply to all visitors, registered members, premium subscribers, and users.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">2</span>
              Eligibility Requirements
            </h2>
            <p>To register as a member or use this Platform, you must satisfy the following legal criteria:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Minimum Age:</strong> You must be legally eligible to marry under the laws of India or your country of citizenship. For Indian citizens, the minimum legal age of marriage is 18 years for females and 21 years for males.
              </li>
              <li>
                <strong>Marital Status:</strong> You must be legally unmarried, divorced (with a final court decree), widowed, or legally separated. Married individuals seeking extra-marital relationships are strictly prohibited.
              </li>
              <li>
                <strong>Intention:</strong> The Platform is strictly for matrimonial search. Casual dating, escort services, commercial marketing, or fraud are criminal offenses and will result in instant account ban and reporting to cyber authorities.
              </li>
              <li>
                <strong>Accuracy:</strong> All personal, astrological, educational, professional, and family details provided must be truthful and authentic.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="account" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">3</span>
              Account Security & Verification
            </h2>
            <p>
              When you create an account, you are responsible for maintaining the confidentiality of your login credentials and OTP tokens. You agree to immediately notify S2S Matrimony of any unauthorized use or security breach.
            </p>
            <p>
              To protect all community members, S2S Matrimony reserves the right to verify member identities through mobile OTP, email verification, Aadhaar/Govt ID verification, or phone screening. Profiles with fraudulent information will be permanently deactivated without refund.
            </p>
          </section>

          {/* Section 4 */}
          <section id="conduct" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">4</span>
              Community Guidelines & Code of Conduct
            </h2>
            <p>You agree not to engage in any of the following prohibited activities:</p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-900">
                <strong>🚫 Financial Solicitation:</strong> Never ask for money, bank details, gifts, loans, or investments from any member on the platform.
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-900">
                <strong>🚫 Obscene or Abusive Content:</strong> Posting obscene photos, abusive messages, defamatory remarks, or harassing members is strictly forbidden.
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-900">
                <strong>🚫 Impersonation:</strong> Registering on behalf of an individual without their explicit written consent or misrepresenting marital/family status.
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-rose-900">
                <strong>🚫 Automated Scraping:</strong> Using bots, crawlers, or automated scripts to extract member profiles, phone numbers, or photographs.
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="membership" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">5</span>
              Membership Plans & Payments
            </h2>
            <p>
              Free members can search profiles, view recommended matches, and receive interest requests. Upgrading to a paid membership tier (Silver, Gold, Elite, Platinum, Diamond) unlocks contact view credits, horoscope downloads, and direct messaging privileges.
            </p>
            <p>
              All payments are processed through RBI-compliant, 256-bit SSL encrypted payment gateways. Membership fees are non-refundable once contact view credits or premium services have been accessed, except in cases of verified duplicate billing.
            </p>
          </section>

          {/* Section 6 */}
          <section id="disclaimer" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">6</span>
              Disclaimer & Due Diligence
            </h2>
            <p>
              While S2S Matrimony implements profile verification tools and moderation filters, <strong>users and their families are strongly advised to exercise due diligence</strong> before finalizing matrimonial alliances. S2S Matrimony is not an investigation agency and cannot guarantee the complete background, character, health, financial standing, or criminal history of any registrant.
            </p>
            <p>
              Astrological calculations (Porutham, Rasi, Star, Dosham) provided on the Platform are for cultural guidance only and should be confirmed with family astrologers as per your tradition.
            </p>
          </section>

          {/* Section 7 */}
          <section id="termination" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">7</span>
              Termination & Account Deletion
            </h2>
            <p>
              You may deactivate or permanently delete your account at any time from your account settings. S2S Matrimony reserves the right to suspend or terminate accounts found violating community guidelines, indulging in extortion, providing fake documents, or abusing other members.
            </p>
          </section>

          {/* Section 8 */}
          <section id="contact-grievance" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">8</span>
              Grievance Redressal & Support
            </h2>
            <p>
              In accordance with the Information Technology Act 2000 and rules made thereunder, any complaints or safety concerns can be addressed to our Grievance Officer:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <p><strong>Grievance Officer:</strong> S2S Matrimony Redressal Team</p>
              <p><strong>Email:</strong> support@s2smatrimony.com / legal@s2smatrimony.com</p>
              <p><strong>Location:</strong> Chennai, Tamil Nadu, India</p>
              <p><strong>Response Time:</strong> Within 48 business hours</p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 pb-12">
          <Link to="/register" className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Free Registration
          </Link>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
