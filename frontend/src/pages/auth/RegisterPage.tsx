import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  User, UserCheck, Users, HeartHandshake, Smile, Sparkles, Lock, Mail, Phone, 
  ArrowRight, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, Star, MessageSquare, 
  ExternalLink, X, CheckCircle2, AlertCircle 
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { useSettingsStore } from '../../store/settings.store';

const STEPS = ['Profile For', 'Personal Info', 'Contact & Password'];

const RegisterPage = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policyModal, setPolicyModal] = useState<'terms' | 'privacy' | null>(null);
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlan = (location.state as any)?.selectedPlan;

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    trigger,
    formState: { errors } 
  } = useForm({
    mode: 'onTouched',
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

  // Prevent browser credential manager (Chrome localhost saved passwords) from autofilling admin credentials
  useEffect(() => {
    const clearAutofillAdmin = () => {
      const currentEmail = watch('email');
      if (
        currentEmail === 'superadmin@s2smatrimony.com' ||
        currentEmail === 'admin@s2smatrimony.com'
      ) {
        setValue('email', '', { shouldValidate: false });
        setValue('password', '', { shouldValidate: false });
        setValue('confirmPassword', '', { shouldValidate: false });
      }
    };
    clearAutofillAdmin();
    const t1 = setTimeout(clearAutofillAdmin, 50);
    const t2 = setTimeout(clearAutofillAdmin, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step, setValue, watch]);

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
          devOtp: res.data?.otp || responseData?.otp || '123456',
        } 
      });
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string | string[] } } };
      const msg = Array.isArray(error?.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error?.response?.data?.message || error?.message || 'Registration failed.';
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
            <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-slate-200/80 animate-scale-in">
              {/* Header inside Card — Big Logo centered at Top */}
              <div className="text-center mb-6">
                <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
                  <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-3xl p-1.5 bg-white shadow-xl group-hover:scale-105 transition-transform border border-slate-100" />
                </Link>
                <h2 className="font-display text-2xl font-bold text-slate-900">Create Free Account</h2>
                <p className="text-slate-500 text-xs mt-1">Join 50,000+ members and find your match</p>
                {selectedPlan && (
                  <div className="mt-3.5 p-3 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-sm animate-fade-in text-left">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Selected Plan: <strong className="font-bold text-amber-950">{selectedPlan}</strong></span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded-full">
                      Ready
                    </span>
                  </div>
                )}
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

              <form 
                autoComplete="off"
                onSubmit={handleSubmit(onSubmit, (formErrors) => {
                if (formErrors.profileFor || formErrors.gender) {
                  setStep(0);
                } else if (formErrors.firstName || formErrors.lastName || formErrors.dateOfBirth) {
                  setStep(1);
                }
              })} noValidate>
                {/* Browser password autofill deterrent */}
                <input type="text" name="fakeusernameremembered" className="hidden" tabIndex={-1} autoComplete="off" />
                <input type="password" name="fakepasswordremembered" className="hidden" tabIndex={-1} autoComplete="off" />
                <>
                  {/* Step 0: Profile For */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <h2 className="text-text-primary font-semibold text-lg mb-4">This profile is for?</h2>
                      
                      <input
                        type="hidden"
                        {...register('profileFor', { required: 'Please select who this profile is for' })}
                      />
                      <input
                        type="hidden"
                        {...register('gender', { required: 'Please select gender (Male or Female)' })}
                      />

                      <div className="grid grid-cols-3 gap-3">
                        {profileForOptions.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = profileFor === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setValue('profileFor', opt.value, { shouldValidate: true })}
                              className={`p-3.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-text-primary font-bold shadow-sm ring-1 ring-primary/40'
                                  : 'border-slate-200 text-text-secondary hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : opt.color}`} />
                              <div className="text-xs font-semibold">{opt.label}</div>
                            </button>
                          );
                        })}
                      </div>
                      {errors.profileFor && (
                        <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                          <span>{errors.profileFor.message}</span>
                        </p>
                      )}

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
                                onClick={() => setValue('gender', g.value, { shouldValidate: true })}
                                className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40'
                                    : errors.gender
                                    ? 'border-rose-400 bg-rose-50/20 text-text-secondary'
                                    : 'border-slate-200 text-text-secondary hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <GIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : g.color}`} />
                                <span>{g.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {errors.gender && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.gender.message}</span>
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const valid = await trigger(['profileFor', 'gender']);
                          if (!valid) return;
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
                            {...register('firstName', {
                              required: 'First name is required',
                              validate: (val: string) => {
                                if (!val || !val.trim()) return 'First name is required';
                                if (val.trim().length < 2) return 'At least 2 characters';
                                if (val.trim().length > 50) return 'Cannot exceed 50 characters';
                                if (!/^[A-Za-z\s.'-]+$/.test(val.trim())) return 'Only letters allowed';
                                return true;
                              },
                            })}
                            className={`input w-full ${
                              errors.firstName ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                            }`}
                            placeholder="e.g. Ramesh"
                          />
                          {errors.firstName && (
                            <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                              <span>{errors.firstName.message}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="input-label">Last Name</label>
                          <input
                            {...register('lastName', {
                              required: 'Last name is required',
                              validate: (val: string) => {
                                if (!val || !val.trim()) return 'Last name is required';
                                if (val.trim().length < 1) return 'Last name is required';
                                if (val.trim().length > 50) return 'Cannot exceed 50 characters';
                                if (!/^[A-Za-z\s.'-]+$/.test(val.trim())) return 'Only letters allowed';
                                return true;
                              },
                            })}
                            className={`input w-full ${
                              errors.lastName ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                            }`}
                            placeholder="e.g. Kumar"
                          />
                          {errors.lastName && (
                            <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                              <span>{errors.lastName.message}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="input-label">Date of Birth</label>
                        <input
                          type="date"
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          {...register('dateOfBirth', {
                            required: 'Date of birth is required',
                            validate: (val: string) => {
                              if (!val) return 'Date of birth is required';
                              const dob = new Date(val);
                              if (isNaN(dob.getTime())) return 'Please enter a valid date';
                              const today = new Date();
                              if (dob > today) return 'Date of birth cannot be in the future';
                              let age = today.getFullYear() - dob.getFullYear();
                              const m = today.getMonth() - dob.getMonth();
                              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                                age--;
                              }
                              if (age < 18) return 'Must be at least 18 years old to register';
                              if (age > 100) return 'Please enter a valid date (maximum age 100)';
                              return true;
                            },
                          })}
                          className={`input w-full ${
                            errors.dateOfBirth ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                          }`}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.dateOfBirth.message}</span>
                          </p>
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
                          onClick={async () => {
                            const valid = await trigger(['firstName', 'lastName', 'dateOfBirth']);
                            if (!valid) return;
                            setStep(2);
                          }}
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
                        <label className="input-label flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                        </label>
                        <div className="flex gap-2">
                          <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-text-secondary text-sm font-semibold flex items-center">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            {...register('phone', {
                              required: 'Mobile number is required',
                              validate: (val: string) => {
                                if (!val || !val.trim()) return 'Mobile number is required';
                                const clean = val.replace(/\D/g, '');
                                if (clean.length !== 10) return 'Enter a valid 10-digit mobile number';
                                if (!/^[6-9]/.test(clean)) return 'Mobile number must start with 6, 7, 8, or 9';
                                return true;
                              },
                            })}
                            className={`input flex-1 ${
                              errors.phone ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                            }`}
                            placeholder="Enter 10-digit mobile number"
                            autoComplete="tel"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.phone.message}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="input-label flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                        </label>
                        <input
                          type="email"
                          autoComplete="new-password"
                          {...register('email', {
                            required: 'Email address is required',
                            validate: (val: string) => {
                              if (!val || !val.trim()) return 'Email address is required';
                              const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                              if (!regex.test(val.trim())) return 'Please enter a valid email address (e.g. name@example.com)';
                              return true;
                            },
                          })}
                          className={`input w-full ${
                            errors.email ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                          }`}
                          placeholder="e.g. name@example.com"
                        />
                        {errors.email && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.email.message}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="input-label flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-primary" /> Password
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            {...register('password', {
                              required: 'Password is required',
                              validate: (val: string) => {
                                if (!val) return 'Password is required';
                                if (val.length < 8) return 'Password must be at least 8 characters long';
                                if (!/[A-Za-z]/.test(val)) return 'Password must contain at least one letter';
                                if (!/\d/.test(val)) return 'Password must contain at least one number';
                                return true;
                              },
                            })}
                            className={`input w-full pr-11 ${
                              errors.password ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                            }`}
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
                        {errors.password && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.password.message}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="input-label flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-primary" /> Confirm Password
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            {...register('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: (val: string) =>
                                val === watch('password') || 'Passwords do not match',
                            })}
                            className={`input w-full pr-11 ${
                              errors.confirmPassword ? '!border-rose-500 !ring-1 !ring-rose-500/30 bg-rose-50/20' : ''
                            }`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowConfirmPassword((prev) => !prev);
                            }}
                            className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-slate-400 hover:text-primary transition z-20 cursor-pointer"
                            title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5 text-primary animate-scale-in" />
                            ) : (
                              <Eye className="w-5 h-5 text-slate-400 hover:text-primary animate-scale-in" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.confirmPassword.message}</span>
                          </p>
                        )}
                      </div>

                      {/* Terms and Conditions Checkbox */}
                      <div className="pt-1">
                        <label className={`flex items-start gap-2.5 cursor-pointer p-3 rounded-xl transition-all border ${
                          errors.agreeTerms ? 'bg-rose-50/40 border-rose-400' : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200 hover:border-amber-300'
                        }`}>
                          <input
                            type="checkbox"
                            {...register('agreeTerms', {
                              required: 'You must agree to the Terms & Conditions and Privacy Policy to register',
                            })}
                            className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 leading-relaxed font-medium">
                            I agree to the{' '}
                            <a
                              href="/terms"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                setPolicyModal('terms');
                              }}
                              className="text-primary font-bold hover:underline"
                              title="Click to view Terms & Conditions"
                            >
                              Terms & Conditions
                            </a>{' '}
                            and{' '}
                            <a
                              href="/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                setPolicyModal('privacy');
                              }}
                              className="text-primary font-bold hover:underline"
                              title="Click to view Privacy Policy"
                            >
                              Privacy Policy
                            </a>.
                          </span>
                        </label>
                        {errors.agreeTerms && (
                          <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1 animate-slide-up">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                            <span>{errors.agreeTerms.message}</span>
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

      {/* Terms & Privacy Reader Modal */}
      {policyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPolicyModal(null)}
        >
          <div 
            className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPolicyModal('terms')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    policyModal === 'terms'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  📜 Terms & Conditions
                </button>
                <button
                  type="button"
                  onClick={() => setPolicyModal('privacy')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    policyModal === 'privacy'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  🔒 Privacy Policy
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={policyModal === 'terms' ? '/terms' : '/privacy'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary font-medium px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
                  title="Open full page in a new tab"
                >
                  <span>Open in full tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPolicyModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[60vh]">
              {policyModal === 'terms' ? (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">S2S Matrimony Terms of Service</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Please review the terms binding member accounts and interactions.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-1">
                      <span className="font-bold text-amber-900 block">1. Genuine Matrimonial Purpose</span>
                      <p className="text-xs text-amber-800">
                        This platform is exclusively for individuals and families genuinely seeking matrimonial alliances. Any commercial solicitation, dating, or fraudulent profiles will be permanently banned.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">2. Age and Legal Eligibility</span>
                      <p className="text-xs text-slate-600">
                        By registering, you confirm you are legally eligible to marry under the laws of India (minimum 18 years for women, 21 years for men) and are not currently married unless legally divorced.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">3. Code of Conduct & Respect</span>
                      <p className="text-xs text-slate-600">
                        Members agree to communicate courteously and respectfully. Harassment, obscene language, extortion, asking for financial transfers, or sharing false photos is strictly prohibited and subject to immediate termination.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">4. Profile Verification & Identity</span>
                      <p className="text-xs text-slate-600">
                        We reserve the right to verify phone numbers via OTP and verify government ID badges to ensure authenticity of profiles.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">5. Memberships and Subscriptions</span>
                      <p className="text-xs text-slate-600">
                        Free tier members can browse and register. Premium plans unlock direct contacts and chats according to plan quotas.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900">S2S Matrimony Privacy Policy</h3>
                    <p className="text-xs text-slate-500 mt-0.5">How your sensitive profile data and photos are protected.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-900 block">1. Contact Number Protection</span>
                      <p className="text-xs text-emerald-800">
                        Your mobile number and email are never shown to the public or crawlers. Only mutually connected members can view authorized contact details.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">2. Photo Privacy Controls</span>
                      <p className="text-xs text-slate-600">
                        You can set photo visibility to "All Members", "Only Accepted Matches", or apply automated anti-tampering watermarks to prevent misuse.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">3. Zero Third-Party Advertising Sale</span>
                      <p className="text-xs text-slate-600">
                        We never sell, rent, or trade your horoscope, caste, or contact details to third-party telemarketers or advertisers.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">4. 256-bit Encryption</span>
                      <p className="text-xs text-slate-600">
                        All communications, passwords, and verification documents are encrypted and secured under strict DPDP Act compliance.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">5. Right to Delete Profile</span>
                      <p className="text-xs text-slate-600">
                        You can permanently delete your matrimonial profile and all associated data at any time from your account settings.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <a
                href={policyModal === 'terms' ? '/terms' : '/privacy'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 sm:hidden"
              >
                <span>Read Full Web Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPolicyModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('agreeTerms', true, { shouldValidate: true });
                    setPolicyModal(null);
                    toast.success('Terms and Privacy Policy agreed!');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-600 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>I Agree & Accept</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
