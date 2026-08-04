import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const strength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) setTokenValid(false);
  }, [token]);

  const pw_strength = strength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired link.';
      toast.error(msg);
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-20 pb-10">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: "url('/images/south_indian_marriage_bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-purple-950/60 to-slate-950/80" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-purple-400 to-amber-400" />

          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img src="/images/logo.png" alt="S2S Matrimony Logo" className="w-14 h-14 object-contain rounded-xl shadow-lg" />
                <span className="font-display font-bold text-2xl text-slate-900">S2S <span className="text-primary">Matrimony</span></span>
              </Link>
            </div>

            {/* Invalid token */}
            {!tokenValid && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-100 border-4 border-red-200 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Invalid or Expired Link</h2>
                <p className="text-slate-500 text-sm mb-5">
                  This password reset link has expired or already been used. Please request a new one.
                </p>
                <Link to="/forgot-password" className="btn btn-primary px-6 py-2.5 text-sm font-bold">
                  Request New Link →
                </Link>
              </div>
            )}

            {/* Success */}
            {tokenValid && done && (
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Password Updated!</h2>
                <p className="text-slate-500 text-sm mb-2">Your password has been changed successfully.</p>
                <p className="text-xs text-slate-400 mb-5">Redirecting to login in 3 seconds...</p>
                <Link to="/login" className="btn btn-primary px-6 py-2.5 text-sm font-bold">
                  Go to Login →
                </Link>
              </div>
            )}

            {/* Reset Form */}
            {tokenValid && !done && (
              <>
                <div className="text-center mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-slate-900">Set New Password</h1>
                  <p className="text-slate-500 text-sm mt-1.5">Choose a strong, unique password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="input pl-10 pr-10 py-3 text-sm w-full"
                        required
                        minLength={8}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= pw_strength ? strengthColor[pw_strength] : 'bg-slate-200'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs font-semibold ${pw_strength <= 1 ? 'text-red-500' : pw_strength === 2 ? 'text-amber-500' : pw_strength === 3 ? 'text-blue-500' : 'text-emerald-600'}`}>
                          {strengthLabel[pw_strength]} password
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter password"
                        className={`input pl-10 pr-10 py-3 text-sm w-full ${confirm && password !== confirm ? 'border-red-300 focus:border-red-400' : confirm && password === confirm ? 'border-emerald-300 focus:border-emerald-400' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Passwords don't match
                      </p>
                    )}
                    {confirm && password === confirm && (
                      <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || password !== confirm || password.length < 8}
                    className="btn btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Updating Password...</>
                    ) : (
                      <><ShieldCheck className="w-4 h-4" /> Reset Password</>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="pt-5 mt-5 border-t border-slate-100 text-center">
              <Link to="/login" className="text-slate-500 hover:text-primary text-sm font-semibold transition-colors">
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
