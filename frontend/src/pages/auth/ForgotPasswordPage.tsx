import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, ArrowLeft, Sparkles, CheckCircle2, Loader2,
  ShieldCheck, KeyRound, Eye, EyeOff, RefreshCw, Lock, MessageSquare, Star,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../store/settings.store';

type Step = 'email' | 'otp' | 'password' | 'done';

const RESEND_SECONDS = 60;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const logoUrl = useSettingsStore((s) => s.logoUrl);

  // State
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // OTP input refs for auto-advance
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // ─── Step 1: Send OTP ───────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent! Check your inbox.');
      setStep('otp');
      setResendTimer(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: OTP input helpers ──────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otpDigits];
    updated[index] = value.slice(-1); // single digit
    setOtpDigits(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-forgot-otp', { email, otp });
      setResetToken(res.data.resetToken);
      toast.success('OTP verified!');
      setStep('password');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('New OTP sent!');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Set new password ───────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      toast.success('Password changed successfully!');
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Image with Rich Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/images/south_indian_marriage_bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-slate-950/60" />
      <div className="absolute inset-0 bg-mesh opacity-15" />

      {/* Dynamic Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Glassmorphic Hero Showcase */}
          <div className="lg:col-span-6 animate-slide-up hidden lg:block">
            <div className="p-8 sm:p-10 rounded-3xl bg-black/15 border border-white/20 backdrop-blur-sm shadow-xl space-y-6">
              <div className="inline-flex items-center gap-2 bg-amber-500/25 border border-amber-300/50 backdrop-blur-md rounded-full px-4 py-2 text-amber-200 text-xs font-black uppercase tracking-wider shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                Trusted South Indian Matrimony Platform
              </div>

              <div className="flex items-center gap-4">
                <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-2xl border-2 border-amber-400/60 p-2 bg-white" />
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight drop-shadow-lg">
                  <span style={{ color: '#FBBF24' }} className="font-extrabold drop-shadow">
                    S2S Matrimony
                  </span>
                </h1>
              </div>

              <p className="text-sm sm:text-base leading-relaxed font-semibold drop-shadow" style={{ color: '#ffffff' }}>
                Connect with 50,000+ verified profiles across 200+ Tamil and South Indian communities with 100% privacy, AI horoscope matching, and instant connection.
              </p>

              <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
                {[
                  { icon: ShieldCheck, title: '100% Verified Profiles', desc: 'Aadhaar & phone verified members' },
                  { icon: Sparkles, title: 'AI Horoscope Matching', desc: 'Porutham & Star compatibility' },
                  { icon: Lock, title: 'Strict Privacy Controls', desc: 'Control who views photos & contacts' },
                  { icon: MessageSquare, title: 'Instant Messaging', desc: 'Direct chat & phone unlocks' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/25 border border-white/20 backdrop-blur-sm shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white shadow-md mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs" style={{ color: '#ffffff' }}>{item.title}</h4>
                        <p className="text-[11px] font-medium mt-0.5 leading-snug" style={{ color: '#f1f5f9' }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <div>
                  <p className="font-display text-xl sm:text-2xl font-black" style={{ color: '#ffffff' }}>50,000+</p>
                  <p className="text-[11px] font-bold" style={{ color: '#ffffff' }}>Active Members</p>
                </div>
                <div className="h-7 w-px bg-white/30" />
                <div>
                  <p className="font-display text-xl sm:text-2xl font-black" style={{ color: '#ffffff' }}>10,000+</p>
                  <p className="text-[11px] font-bold" style={{ color: '#ffffff' }}>Happy Marriages</p>
                </div>
                <div className="h-7 w-px bg-white/30" />
                <div>
                  <p className="font-display text-xl sm:text-2xl font-black" style={{ color: '#ffffff' }}>200+</p>
                  <p className="text-[11px] font-bold" style={{ color: '#ffffff' }}>Communities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Glassmorphic Card with Big Top Logo */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-200/80 animate-scale-in">
              {/* Header inside Card — Big Logo centered at Top */}
              <div className="text-center mb-6">
                <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
                  <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl p-1.5 bg-white shadow-xl group-hover:scale-105 transition-transform border border-slate-100" />
                </Link>
                <h2 className="font-display text-2xl font-bold text-slate-900">Forgot Password</h2>
                <p className="text-slate-500 text-xs mt-1">Recover your account securely</p>
              </div>

            {/* ── STEP 1: Email ── */}
            {step === 'email' && (
              <>
                <div className="text-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">Forgot Password?</h1>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Enter your registered email and we'll send you a 6-digit OTP.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input pl-10 py-3 text-sm w-full"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Send OTP</>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  🔒 A 6-digit OTP will be sent to your email. Valid for <strong className="text-slate-600">10 minutes</strong>.
                </p>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">Enter OTP</h1>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    We sent a 6-digit code to
                  </p>
                  <p className="font-bold text-primary text-sm bg-primary/5 rounded-xl px-4 py-1.5 border border-primary/10 mt-1 inline-block">
                    {email}
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* 6-digit OTP boxes */}
                  <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-11 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all outline-none
                          ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-slate-50 text-slate-800'}
                          focus:border-primary focus:ring-2 focus:ring-primary/20`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length < 6}
                    className="btn btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Verify OTP</>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']); }}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary disabled:text-slate-400 hover:underline transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 3: New Password ── */}
            {step === 'password' && (
              <>
                <div className="text-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">Set New Password</h1>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="input pl-10 pr-10 py-3 text-sm w-full"
                        required
                        minLength={8}
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`input pl-10 pr-10 py-3 text-sm w-full ${
                          confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:ring-red-200' : ''
                        }`}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                    className="btn btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Changing Password...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Change Password</>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP 4: Done ── */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5 animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Password Changed!</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Go to Login
                </button>
              </div>
            )}

            {/* Back to login */}
            {step !== 'done' && (
              <div className="pt-5 mt-5 border-t border-slate-100 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-primary text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
