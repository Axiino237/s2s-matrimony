import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, Key, Database, UserCheck, Mail, ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 text-white pt-28 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-900/30 relative">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-400/15 border border-emerald-300/30 rounded-full px-3.5 py-1 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Privacy & Data Security
          </div>
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Privacy{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Your trust and personal safety are the cornerstone of S2S Community Matrimony. Here is how we safeguard your data.
          </p>
          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-4">
            <span>Last Updated: January 1, 2026</span>
            <span>•</span>
            <span>GDPR & DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-20">
        {/* Quick Highlights Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-5 sm:p-6 mb-8 backdrop-blur-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Our Privacy Promises
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">No Public Phone Numbers</span>
              Your contact number and personal email are never shown publicly or scraped by search engines. Only accepted matches or authorized tier members can request access.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Photo Protection</span>
              You can protect your photo with Watermarks, blur for anonymous browsing, or enable "Visible Only on Request / Acceptance".
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Zero Commercial Ad Sale</span>
              We do not sell, rent, or trade your personal or horoscope data to third-party telemarketers or external advertisers.
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-10 text-sm leading-relaxed text-slate-700">
          
          {/* Section 1 */}
          <section id="collection" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">1</span>
              Information We Collect
            </h2>
            <p>
              To provide a personalized matrimonial matchmaking experience, S2S Community Matrimony collects personal information when you register, create a biodata profile, or engage with our platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-900">Basic Account Credentials:</strong> Full name, gender, date of birth, mobile number, email address, password hash.
              </li>
              <li>
                <strong className="text-slate-900">Matrimonial Profile Details:</strong> Religion, community / caste, subcaste, mother tongue, marital status, education, occupation, annual income, location, family background, and lifestyle habits.
              </li>
              <li>
                <strong className="text-slate-900">Astrological Data:</strong> Rasi, Nakshatram (Star), Dosham details, and horoscope charts provided voluntarily to enable AI and traditional Porutham compatibility matching.
              </li>
              <li>
                <strong className="text-slate-900">Verification Information:</strong> Government photo ID (e.g. Aadhaar, Passport, Voter ID) uploaded strictly for verified badge badges, fraud prevention, and safety audits. ID documents are never visible to other users.
              </li>
              <li>
                <strong className="text-slate-900">Usage & Technical Data:</strong> IP address, device fingerprints, browser types, session timestamps, and interaction logs (profiles viewed, interests expressed, messages sent) to prevent spam, abusive behavior, and security anomalies.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section id="use-of-info" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">2</span>
              How We Use Your Information
            </h2>
            <p>We use the collected information for the following legitimate purposes:</p>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-900 block">Matchmaking & Recommendations</span>
                <span className="text-xs text-slate-600">Calculating horoscope compatibility, partner preference scoring, and presenting suitable prospect recommendations.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-900 block">Communication & Alerts</span>
                <span className="text-xs text-slate-600">Sending SMS, WhatsApp, and email alerts when someone expresses interest, sends a message, or accepts your request.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-900 block">Safety & Trust Moderation</span>
                <span className="text-xs text-slate-600">Verifying authenticity, detecting duplicate accounts, preventing harassment, and reviewing reported bad actors.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-semibold text-slate-900 block">Customer Support & Invoicing</span>
                <span className="text-xs text-slate-600">Processing subscription orders, generating tax invoices, and resolving account issues.</span>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="privacy-controls" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">3</span>
              Your Privacy Settings & Controls
            </h2>
            <p>
              We believe every member should have complete autonomy over who can view their profile and photos:
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex gap-3.5 items-start">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Contact Number Privacy</h3>
                  <p className="text-xs text-slate-600 leading-normal">
                    You can configure your contact visibility to: <em>"Visible to all Premium Members"</em>, <em>"Visible only to members whose interest I have accepted"</em>, or <em>"Hidden - Show only upon explicit request"</em>.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl flex gap-3.5 items-start">
                <EyeOff className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Photo Protection & Watermarking</h3>
                  <p className="text-xs text-slate-600 leading-normal">
                    Uploaded photos can be watermarked with your Member ID and platform logo to deter unauthorized downloads or screenshots. You can also set photos to be blurred until you accept a connection request.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl flex gap-3.5 items-start">
                <Eye className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Incognito & Temporary Profile Deactivation</h3>
                  <p className="text-xs text-slate-600 leading-normal">
                    If you take a break or have finalized an alliance, you can hide your profile from search results immediately with one click without deleting your profile history.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="sharing" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">4</span>
              Information Sharing & Third Parties
            </h2>
            <p>
              We do not sell personal data. Information is only shared under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <strong className="text-slate-900">With Other Members:</strong> Basic matrimonial attributes (age, height, community, education, occupation, general location) are displayed on your public member card.
              </li>
              <li>
                <strong className="text-slate-900">Payment Processors:</strong> We partner with PCI-DSS compliant payment gateways (such as Razorpay / Stripe). We never store raw credit card numbers or UPI PINs on our servers.
              </li>
              <li>
                <strong className="text-slate-900">SMS / Email Notification Providers:</strong> Secure transactional gateways used solely to deliver OTP verification and matchmaking alerts.
              </li>
              <li>
                <strong className="text-slate-900">Legal & Law Enforcement:</strong> We disclose user information only if required by a valid court order, warrant, or governmental legal request to investigate fraudulent behavior or crimes.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="security" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">5</span>
              Data Security & Encryption
            </h2>
            <p>
              We employ strict technical and organizational safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>All web traffic is encrypted using 256-bit TLS / SSL encryption.</li>
              <li>Passwords are cryptographically hashed using salted Bcrypt before being stored in the database.</li>
              <li>Access to internal databases is restricted via role-based access controls and monitored with audit logs.</li>
              <li>Routine security reviews and automated vulnerability scanners are applied to our infrastructure.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="retention" className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center text-xs font-black">6</span>
              Your Data Rights & Deletion
            </h2>
            <p>Under applicable data privacy regulations, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Access & Review:</strong> View and update any inaccurate biodata from your account settings at any time.</li>
              <li><strong>Data Portability:</strong> Request an export of your profile information.</li>
              <li><strong>Delete Account:</strong> Permanently delete your matrimonial profile, biodata, photos, and messages. Once deleted, your profile is permanently erased from active indexes within 30 days.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="grievance" className="space-y-3 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Grievance Officer & Contact
            </h2>
            <p className="text-xs text-slate-600">
              In accordance with the Information Technology Act 2000 and Digital Personal Data Protection Act 2023, the details of our Grievance Officer are:
            </p>
            <div className="text-xs space-y-1 text-slate-700 bg-white p-3.5 rounded-xl border border-slate-100 font-mono">
              <div><strong>Name:</strong> Privacy & Grievance Cell, S2S Community Matrimony</div>
              <div><strong>Email:</strong> privacy@s2smatrimony.com / support@s2smatrimony.com</div>
              <div><strong>Response Time:</strong> Acknowledged within 24 hours, resolved within 15 working days.</div>
              <div><strong>Location:</strong> Chennai, Tamil Nadu, India</div>
            </div>
          </section>

        </div>

        {/* Back action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Registration
          </Link>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/contact" className="hover:underline">Contact Support</Link>
            <span>•</span>
            <Link to="/" className="hover:underline">Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
