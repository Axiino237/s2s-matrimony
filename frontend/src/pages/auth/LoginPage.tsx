import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Sparkles, ShieldCheck, Heart, UserCheck, Lock, Phone, 
  ArrowRight, Star, Key, CheckCircle2, MessageSquare, Award,
  Eye, EyeOff, Mail, Info
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useSettingsStore } from '../../store/settings.store';
import toast from 'react-hot-toast';
import api from '../../services/api';
import SEO from '../../components/common/SEO';
import { getAuthorizedAdminRoute, ROUTE_PERMISSIONS } from '../../components/layout/AdminLayout';

const LoginPage = () => {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithOtp } = useAuthStore();
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  const navigate = useNavigate();
  const location = useLocation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ email: string; password: string }>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    reset({ email: '', password: '' });
  }, [reset]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phone: `+91${phone}` });
      setOtpSent(true);
      toast.success('OTP sent successfully to your phone!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const user = await loginWithOtp(`+91${phone}`, otp);
      toast.success('Login successful!');
      redirectUser(user);
    } catch (err: any) {
      if (
        err?.response?.status === 503 ||
        err?.response?.data?.maintenance ||
        String(err?.response?.data?.message || '').toLowerCase().includes('maintenance')
      ) {
        useSettingsStore.getState().setSettings({ maintenanceMode: true });
        toast.error(err?.response?.data?.message || 'Platform is under maintenance. Regular member login is temporarily unavailable.');
        navigate('/maintenance');
        return;
      }
      toast.error('Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordLogin = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success('Welcome back!');
      redirectUser(user);
    } catch (err: any) {
      if (
        err?.response?.status === 503 ||
        err?.response?.data?.maintenance ||
        String(err?.response?.data?.message || '').toLowerCase().includes('maintenance')
      ) {
        useSettingsStore.getState().setSettings({ maintenanceMode: true });
        toast.error(err?.response?.data?.message || 'Platform is under maintenance. Regular member login is temporarily unavailable.');
        navigate('/maintenance');
        return;
      }
      toast.error('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (user: any) => {
    const fromPath = location.state?.from?.pathname;
    const fromSearch = location.state?.from?.search || '';

    const userRoleStr = (
      user?.role ||
      (Array.isArray(user?.roles) ? user?.roles[0] : user?.roles) ||
      (user as any)?.userRoles?.[0]?.role?.name ||
      'MEMBER'
    ).toString().toUpperCase();

    const allRoles: string[] = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r?.name || '').toUpperCase())
      : ((user as any)?.userRoles ? (user as any).userRoles.map((ur: any) => (ur.role?.name || ur.name || '').toUpperCase()) : [userRoleStr]);

    const isSuperAdmin = userRoleStr === 'SUPER_ADMIN' || allRoles.includes('SUPER_ADMIN');
    const isStaff = isSuperAdmin || allRoles.some((r: string) => ['ADMIN'].includes(r));

    const checkPerm = (perm: string): boolean => {
      return useAuthStore.getState().hasPermission(perm);
    };

    if (fromPath && fromPath !== '/login' && fromPath !== '/register' && fromPath !== '/unauthorized') {
      if (fromPath.startsWith('/super-admin') && !isSuperAdmin) {
        if (isStaff) {
          const staffLanding = getAuthorizedAdminRoute(checkPerm, isSuperAdmin) || '/unauthorized';
          navigate(staffLanding);
        } else {
          navigate('/dashboard');
        }
      } else if (fromPath === '/admin' || fromPath === '/admin/dashboard') {
        if (isStaff) {
          const staffLanding = getAuthorizedAdminRoute(checkPerm, isSuperAdmin) || '/unauthorized';
          navigate(staffLanding);
        } else {
          navigate('/dashboard');
        }
      } else if (fromPath.startsWith('/admin/')) {
        const reqPerm = ROUTE_PERMISSIONS[fromPath];
        if (!reqPerm || checkPerm(reqPerm) || isSuperAdmin) {
          navigate(fromPath + fromSearch);
        } else {
          const staffLanding = getAuthorizedAdminRoute(checkPerm, isSuperAdmin) || '/unauthorized';
          navigate(staffLanding);
        }
      } else {
        navigate(fromPath + fromSearch);
      }
    } else if (isSuperAdmin) {
      navigate('/super-admin/dashboard');
    } else if (isStaff) {
      const staffLanding = getAuthorizedAdminRoute(checkPerm, isSuperAdmin) || '/unauthorized';
      navigate(staffLanding);
    } else {
      const completion = (user as any)?.profileCompletionPercent ?? 0;
      if (completion < 100) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="relative min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16 flex items-center overflow-x-hidden bg-slate-950">
      <SEO
        title="Member Sign In — S2S Matrimony"
        description="Sign in to your S2S Matrimony account to manage your biodata, view daily match recommendations, and connect with prospective partners."
        canonical="/login"
      />
      {/* High Resolution Marriage Background Image — Bright & Clearly Visible */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-85 scale-100 transition-transform duration-1000"
        style={{ backgroundImage: "url('/images/south_indian_marriage_bg.png')" }}
      />
      {/* Subtle Warm Gradient Overlay for Brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-slate-950/60" />
      <div className="absolute inset-0 bg-mesh opacity-15" />

      {/* Dynamic Glowing Mesh Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/30 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="container relative z-10 mx-auto px-3 sm:px-4 md:px-8 max-w-full w-full min-w-0">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full max-w-full min-w-0">
          {/* Left Column: Ultra Light Transparent Glassmorphic Showcase */}
          <div className="lg:col-span-6 animate-slide-up w-full max-w-full min-w-0">
            <div className="p-3.5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-black/25 border border-white/20 backdrop-blur-sm shadow-xl space-y-4 sm:space-y-6 w-full max-w-full min-w-0 box-border overflow-hidden">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-amber-500/25 border border-amber-300/50 backdrop-blur-md rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-amber-200 text-[10px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider shadow-md max-w-full min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow flex-shrink-0" />
                <span className="truncate min-w-0">Trusted South Indian Matrimony Platform</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 text-center sm:text-left min-w-0 w-full">
                <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-amber-400/60 p-1.5 sm:p-2 bg-white flex-shrink-0" />
                <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-lg break-words min-w-0">
                  <span style={{ color: '#FBBF24' }} className="font-extrabold drop-shadow">
                    S2S Matrimony
                  </span>
                </h1>
              </div>

              <p className="text-xs sm:text-base leading-relaxed font-semibold drop-shadow break-words w-full" style={{ color: '#ffffff' }}>
                Connect with 50,000+ verified profiles across 200+ Tamil and South Indian communities with 100% privacy, AI horoscope matching, and instant connection.
              </p>

              {/* Key Value Propositions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 pt-1 w-full min-w-0">
                {[
                  { icon: ShieldCheck, title: '100% Verified Profiles', desc: 'Aadhaar & phone verified members' },
                  { icon: Sparkles, title: 'AI Horoscope Matching', desc: 'Porutham & Star compatibility' },
                  { icon: Lock, title: 'Strict Privacy Controls', desc: 'Control who views photos & contacts' },
                  { icon: MessageSquare, title: 'Instant Messaging', desc: 'Direct chat & phone unlocks' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3 p-3 rounded-2xl bg-black/25 border border-white/20 backdrop-blur-sm hover:bg-black/40 transition-all duration-300 shadow-sm min-w-0 w-full overflow-hidden">
                      <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white shadow-md mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs truncate sm:whitespace-normal" style={{ color: '#ffffff' }}>{item.title}</h4>
                        <p className="text-[11px] font-medium mt-0.5 leading-snug break-words" style={{ color: '#f1f5f9' }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Couple Testimonial Card */}
              <div className="p-3 sm:p-4 rounded-2xl bg-black/25 border border-amber-400/40 backdrop-blur-sm flex items-center gap-3 sm:gap-4 shadow-lg min-w-0 w-full overflow-hidden">
                <img src="/images/couple_happy.png" alt="Happy Couple" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-amber-400 shadow-md flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-amber-300 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                    <span className="text-[10px] text-amber-200 font-extrabold ml-1 truncate">Verified Union</span>
                  </div>
                  <p className="text-xs italic font-semibold break-words" style={{ color: '#ffffff' }}>"Found our life partner with total family trust in 3 weeks!"</p>
                  <p className="font-black text-xs mt-0.5 truncate" style={{ color: '#FBBF24' }}>— Karthik & Shalini (Chennai)</p>
                </div>
              </div>

              {/* Quick Stats Counter */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center w-full min-w-0">
                <div className="min-w-0">
                  <p className="font-display text-base sm:text-2xl font-black truncate" style={{ color: '#ffffff' }}>50,000+</p>
                  <p className="text-[10px] sm:text-[11px] font-bold leading-tight truncate" style={{ color: '#ffffff' }}>Active Members</p>
                </div>
                <div className="min-w-0 border-x border-white/30 px-1">
                  <p className="font-display text-base sm:text-2xl font-black truncate" style={{ color: '#ffffff' }}>10,000+</p>
                  <p className="text-[10px] sm:text-[11px] font-bold leading-tight truncate" style={{ color: '#ffffff' }}>Happy Marriages</p>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base sm:text-2xl font-black truncate" style={{ color: '#ffffff' }}>200+</p>
                  <p className="text-[10px] sm:text-[11px] font-bold leading-tight truncate" style={{ color: '#ffffff' }}>Communities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Glassmorphic Login Card */}
          <div className="lg:col-span-6 flex justify-center w-full min-w-0 max-w-full">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 animate-scale-in min-w-0 w-full overflow-hidden">
              {/* Header inside Card */}
              <div className="text-center mb-6">
                <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
                  <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl p-1.5 bg-white shadow-xl group-hover:scale-105 transition-transform border border-slate-100" />
                </Link>
                <h2 className="font-display text-2xl font-bold text-slate-900">Member & Admin Sign In</h2>
                <p className="text-slate-500 text-xs mt-1">Access your personalized portal securely</p>
              </div>


              {/* Mode Toggle Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'password' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" /> Password Login
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('otp'); setOtpSent(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'otp' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" /> OTP Mobile Login
                </button>
              </div>

              {/* Password Login Form */}
              {mode === 'password' && (
                <form onSubmit={handleSubmit(onPasswordLogin)} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="input-label font-bold text-xs text-slate-700 flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                        <Info className="w-3 h-3 text-primary/80" /> Registered Email
                      </span>
                    </label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        autoComplete="off"
                        placeholder="you@example.com"
                        className={`input text-xs py-3 pl-10 pr-4 ${errors.email ? 'input-error' : ''}`}
                        {...register('email', { required: 'Email address is required' })}
                      />
                    </div>
                    {errors.email && <p className="error-msg text-xs text-rose-500 mt-1">⚠ {errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="input-label font-bold text-xs text-slate-700">Password</label>
                      <Link to="/forgot-password" className="text-primary text-[11px] font-bold hover:underline flex items-center gap-1">
                        <Info className="w-3 h-3 text-rose-400" /> Forgot Password?
                      </Link>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={`input text-xs py-3 pl-10 pr-11 w-full ${errors.password ? 'input-error' : ''}`}
                        {...register('password', { required: 'Password is required' })}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPassword((prev) => !prev);
                        }}
                        className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-primary transition z-20 cursor-pointer"
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-primary animate-scale-in" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400 hover:text-primary animate-scale-in" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="error-msg text-xs text-rose-500 mt-1">⚠ {errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3.5 text-xs font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? 'Signing In...' : 'Sign In Now'} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* OTP Login Form */}
              {mode === 'otp' && (
                <div className="space-y-4">
                  <div>
                    <label className="input-label font-bold text-xs text-slate-700">Mobile Phone Number</label>
                    <div className="flex gap-2">
                      <div className="input w-16 text-center text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 bg-slate-50">+91</div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="input text-xs flex-1 py-3"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="btn btn-primary w-full py-3.5 text-xs font-extrabold shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? 'Sending OTP...' : 'Send Login OTP'} <Phone className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="input-label font-bold text-xs text-slate-700">Enter 6-Digit OTP</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="input text-center text-xl font-mono tracking-[0.8rem] py-2.5"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleOtpLogin}
                        disabled={loading}
                        className="btn btn-primary w-full py-3.5 text-xs font-extrabold shadow-lg flex items-center justify-center gap-2"
                      >
                        {loading ? 'Verifying...' : 'Verify OTP & Sign In'} <CheckCircle2 className="w-4 h-4" />
                      </button>


                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="btn btn-ghost w-full py-2 text-xs font-semibold text-slate-500"
                      >
                        Change Phone Number
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Signup Link */}
              <div className="pt-6 mt-6 border-t border-slate-100 text-center">
                <p className="text-slate-600 text-xs">
                  Don't have a profile yet?{' '}
                  <Link to="/register" className="text-primary font-black hover:underline">
                    Register Free Now →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
