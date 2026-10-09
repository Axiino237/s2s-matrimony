import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, RefreshCw, ShieldAlert, Mail, Phone, Lock, HeartHandshake } from 'lucide-react';
import { useSettingsStore } from '../../store/settings.store';
import toast from 'react-hot-toast';

const MaintenancePage: React.FC = () => {
  const { siteName, logoUrl, supportEmail, supportPhone, fetchSettings } = useSettingsStore();
  const [checking, setChecking] = useState(false);

  const handleCheckAgain = async () => {
    setChecking(true);
    const toastId = toast.loading('Checking platform status...');
    try {
      await fetchSettings();
      const current = useSettingsStore.getState().maintenanceMode;
      if (!current) {
        toast.success('Maintenance mode has ended! Welcome back.', { id: toastId });
        window.location.href = '/';
      } else {
        toast('Platform is still under maintenance. Please check back shortly.', {
          id: toastId,
          icon: '⏳',
        });
      }
    } catch {
      toast('Platform is still under maintenance.', { id: toastId, icon: '⏳' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Brand Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl || '/images/logo.png'}
            alt={siteName}
            className="w-10 h-10 object-contain rounded-xl shadow-xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900 tracking-tight">{siteName}</h1>
            <p className="text-[11px] text-slate-500 font-medium">Trusted Community Matrimony</p>
          </div>
        </div>

        {/* Administrative Access Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
        >
          <Lock className="w-3.5 h-3.5 text-primary" />
          <span>Admin Portal</span>
        </Link>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-xl w-full mx-auto my-auto text-center space-y-6 animate-fade-in py-8">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border border-rose-200/80 flex items-center justify-center text-primary shadow-inner">
            <Wrench className="w-12 h-12 text-rose-600 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-xs font-bold border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Scheduled Platform Maintenance</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            We'll Be Back Soon!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            {siteName} is currently undergoing scheduled platform upgrades to improve matching performance and security.
            Visitor and member access is temporarily paused.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCheckAgain}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking Status...' : 'Check Again'}</span>
          </button>

          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all"
          >
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Admin / Super Admin Login</span>
          </Link>
        </div>

        {/* Contact Info Box */}
        {(supportEmail || supportPhone) && (
          <div className="pt-4 border-t border-slate-200/60 max-w-md mx-auto">
            <p className="text-xs text-slate-500 mb-2 font-medium">Need immediate assistance with your account?</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{supportEmail}</span>
                </a>
              )}
              {supportPhone && (
                <a
                  href={`tel:${supportPhone}`}
                  className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>{supportPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <HeartHandshake className="w-4 h-4 text-rose-400" />
        <span>Thank you for your patience and understanding — {siteName} Team</span>
      </div>
    </div>
  );
};

export default MaintenancePage;
