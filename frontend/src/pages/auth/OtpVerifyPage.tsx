import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowLeft, Loader2, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';

const OtpVerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithOtp } = useAuthStore();

  const phoneFromState = (location.state as { phone?: string })?.phone || '';
  const [phone, setPhone] = useState(phoneFromState);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!cleanPhone) {
      toast.error('Phone number is missing. Please try logging in or registering again.');
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithOtp(cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`, cleanOtp);
      toast.success('Phone verified successfully!');
      const userRoleStr = (
        user?.role ||
        (Array.isArray(user?.roles) ? user?.roles[0] : user?.roles) ||
        (user as any)?.userRoles?.[0]?.role?.name ||
        'MEMBER'
      ).toString().toUpperCase();

      if (userRoleStr === 'SUPER_ADMIN') {
        navigate('/super-admin/dashboard');
      } else if (userRoleStr === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        const completion = (user as any)?.profileCompletionPercent ?? 0;
        if (completion < 100) {
          toast.success('Welcome! Please complete your profile to get started.');
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || 'Invalid or expired OTP code.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error('Please enter your phone number to resend OTP.');
      return;
    }

    setResending(true);
    try {
      const targetPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
      await api.post('/auth/send-otp', { phone: targetPhone });
      toast.success(`New OTP sent to ${targetPhone}`);
      setCountdown(30);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12 bg-slate-50">
      <div className="absolute inset-0 bg-gradient-hero opacity-60" />
      <div className="absolute inset-0 bg-mesh opacity-40" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-2xl text-center">
          
          {/* Package Icon (Smartphone from lucide-react) */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 shadow-sm border border-primary/20">
            <Smartphone className="w-8 h-8 text-primary animate-pulse" />
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">Verify OTP</h1>
          <p className="text-slate-500 text-sm mb-6">
            Enter the 6-digit verification code sent to
          </p>

          <form onSubmit={handleVerify} className="space-y-5">
            {/* Phone input field (editable if empty or coming from state) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider text-left mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            {/* OTP 6-Digit input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider text-left mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-2xl font-bold text-center tracking-[0.75rem] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                autoFocus
              />
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verify OTP
                </>
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Didn't receive code?</span>
            {countdown > 0 ? (
              <span className="font-semibold text-slate-400">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="font-bold text-primary hover:text-rose-600 flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
            )}
          </div>

          {/* Back to Login */}
          <div className="mt-6">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
