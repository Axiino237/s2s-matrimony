import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, UserCheck, Users, HeartHandshake, Smile, Sparkles, Lock, Mail, Phone, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, Star, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const STEPS = ['Profile For', 'Personal Info', 'Contact & Password'];

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      profileFor: 'SELF',
      gender: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    }
  });

  const profileFor = watch('profileFor');
  const gender = watch('gender');

  const onSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      const { confirmPassword, agreeTerms, ...registerPayload } = data;
      const formattedPhone = data.phone?.startsWith('+91') ? data.phone : `+91${data.phone}`;

      const res = await api.post('/auth/register', {
        ...registerPayload,
        phone: formattedPhone,
      });

      const responseData = res.data.user ? res.data : res.data.data;
      if (responseData?.accessToken && responseData?.user) {
        useAuthStore.getState().setAccessToken(responseData.accessToken);
        useAuthStore.getState().setUser(responseData.user);
      }

      toast.success('Account created! Check your phone for OTP.');
      navigate('/verify-otp', { 
        state: { 
          phone: formattedPhone,
          firstName: data.firstName,
          lastName: data.lastName,
        } 
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = Array.isArray(error?.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error?.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const profileForOptions = [
    { value: 'SELF', label: 'Myself', icon: User, color: 'text-primary' },
    { value: 'SON', label: 'My Son', icon: UserCheck, color: 'text-blue-600' },
    { value: 'DAUGHTER', label: 'My Daughter', icon: Sparkles, color: 'text-rose-500' },
    { value: 'BROTHER', label: 'My Brother', icon: Users, color: 'text-indigo-600' },
    { value: 'SISTER', label: 'My Sister', icon: Smile, color: 'text-pink-500' },
    { value: 'FRIEND', label: 'Friend', icon: HeartHandshake, color: 'text-amber-500' },
  ];

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
                <img src="/images/logo.png" alt="S2S Matrimony Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-2xl border-2 border-amber-400/60 p-2 bg-white" />
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
            <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-200/80 animate-scale-in">
              {/* Header inside Card — Big Logo centered at Top */}
              <div className="text-center mb-6">
                <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
                  <img src="/images/logo.png" alt="S2S Matrimony Logo" className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl p-1.5 bg-white shadow-xl group-hover:scale-105 transition-transform border border-slate-100" />
                </Link>
                <h2 className="font-display text-2xl font-bold text-slate-900">Create Free Account</h2>
                <p className="text-slate-500 text-xs mt-1">Join 50,000+ members and find your match</p>
              </div>

              {/* Step Progress Bar */}
              <div className="flex items-center mb-6 px-1">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className={`step-circle ${i < step ? 'step-completed' : i === step ? 'step-active' : 'step-inactive'}`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 flex flex-col items-start ml-2 last:hidden">
                      <span className={`text-[11px] font-bold ${i <= step ? 'text-text-primary' : 'text-text-muted'}`}>{s}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 rounded-full ${i < step ? 'bg-success' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <>
                  {/* Step 0: Profile For */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-text-primary font-semibold text-lg mb-4">This profile is for?</h2>
                <div className="grid grid-cols-3 gap-3">
                  {profileForOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = profileFor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue('profileFor', opt.value)}
                        className={`p-3.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-text-primary font-bold shadow-sm'
                            : 'border-slate-200 text-text-secondary hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : opt.color}`} />
                        <div className="text-xs font-semibold">{opt.label}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="input-label text-text-secondary text-xs font-bold uppercase tracking-wider block mb-2">Gender of Profile</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'MALE', label: 'Male (Groom)', icon: User, color: 'text-blue-600' },
                      { value: 'FEMALE', label: 'Female (Bride)', icon: Sparkles, color: 'text-rose-500' },
                    ].map((g) => {
                      const GIcon = g.icon;
                      const isSelected = gender === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setValue('gender', g.value)}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary shadow-sm'
                              : 'border-slate-200 text-text-secondary hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <GIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : g.color}`} />
                          <span>{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!gender) {
                      toast.error('Please select gender');
                      return;
                    }
                    setStep(1);
                  }}
                  className="btn btn-primary btn-md w-full mt-4 flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Next: Personal Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-text-primary font-semibold text-lg mb-4">Personal Details</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">First Name</label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className="input w-full"
                      placeholder="e.g. Ramesh"
                    />
                    {errors.firstName && (
                      <span className="input-error">{errors.firstName.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="input-label">Last Name</label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className="input w-full"
                      placeholder="e.g. Kumar"
                    />
                    {errors.lastName && (
                      <span className="input-error">{errors.lastName.message}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="input-label">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    className="input w-full"
                  />
                  {errors.dateOfBirth && (
                    <span className="input-error">{errors.dateOfBirth.message}</span>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="btn btn-ghost btn-md flex-1 border border-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn btn-primary btn-md flex-1 flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Next: Contact Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Password */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-text-primary font-semibold text-lg mb-4">Contact & Password</h2>

                <div>
                  <label className="input-label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> Phone Number</label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-text-secondary text-sm font-semibold flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      {...register('phone', {
                        required: 'Phone is required',
                        pattern: { value: /^[6-9]\d{9}$/, message: 'Enter 10-digit mobile number' }
                      })}
                      className="input flex-1"
                      placeholder="7397349160"
                    />
                  </div>
                  {errors.phone && <span className="input-error">{errors.phone.message}</span>}
                </div>

                <div>
                  <label className="input-label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> Email Address</label>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                    })}
                    className="input w-full"
                    placeholder="name@example.com"
                  />
                  {errors.email && <span className="input-error">{errors.email.message}</span>}
                </div>

                <div>
                  <label className="input-label flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'At least 8 characters' }
                      })}
                      className="input w-full pr-11"
                      placeholder="••••••••"
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
                  {errors.password && <span className="input-error">{errors.password.message}</span>}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all">
                    <input
                      type="checkbox"
                      {...register('agreeTerms', {
                        required: 'You must agree to the Terms & Conditions to register.'
                      })}
                      className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toast('📜 S2S Matrimony Terms: You agree to provide authentic profile details and follow our community guidelines.', { duration: 5000 });
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toast('🔒 Privacy Policy: Your mobile number and personal data are kept 100% encrypted & secure.', { duration: 5000 });
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Privacy Policy
                      </button>.
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                      ⚠ {errors.agreeTerms.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-ghost btn-md flex-1 border border-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-md flex-1 flex items-center justify-center gap-2 shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Register Free</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
                </>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200/80 text-center">
                <p className="text-slate-600 text-xs font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    Sign In Now →
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

export default RegisterPage;
