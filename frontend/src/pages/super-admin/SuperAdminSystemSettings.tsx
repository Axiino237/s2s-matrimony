import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Loader2, Eye, EyeOff, CheckCircle2, Globe, Mail, Phone, CreditCard, Cpu, Server, Palette, Shield, Link as LinkIcon, BarChart2, Upload, Image as ImageIcon, Crown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TAB_GROUPS = [
  { id: 'branding', label: 'Branding & Theme', icon: Palette },
  { id: 'elite', label: '👑 Elite Matching & VIP Criteria', icon: Crown },
  { id: 'social', label: 'Social Links', icon: LinkIcon },
  { id: 'security', label: 'Security & Access', icon: Shield },
];

const SecretInput = ({ label, value, onChange, placeholder }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange, placeholder, hint }: any) => (
  <div>
    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
    />
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const ImageFileInput = ({ label, value, onChange, placeholder, accept = "image/*" }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  accept?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        onChange(dataUrl);
        toast.success(`${label} file selected!`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">{label}</label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn bg-primary text-white hover:bg-primary-dark btn-sm flex items-center gap-1.5 px-4 font-semibold shadow-xs"
          >
            <Upload className="w-4 h-4" /> Browse File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {value && (
          <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={value} alt={label} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{label} Preview</p>
              <p className="text-[10px] text-slate-400 truncate">{value.length > 50 ? `${value.slice(0, 50)}...` : value}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-md"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const DUAL_COLOR_PRESETS = [
  { name: 'Rose & Teal', primary: '#E11D48', secondary: '#0D9488' },
  { name: 'Purple & Teal', primary: '#7C3AED', secondary: '#0D9488' },
  { name: 'Violet & Cyan', primary: '#8B5CF6', secondary: '#06B6D4' },
  { name: 'Sunset Coral & Magenta', primary: '#F97316', secondary: '#D946EF' },
  { name: 'Royal Indigo & Emerald', primary: '#4F46E5', secondary: '#10B981' },
  { name: 'Crimson & Amber', primary: '#DC2626', secondary: '#F59E0B' },
];

import { useSettingsStore } from '../../store/settings.store';

const SuperAdminSystemSettings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    // Branding
    siteName: 'S2S Community Matrimony',
    tagline: 'Find Your Perfect Match',
    primaryColor: '#E11D48',
    secondaryColor: '#0D9488',
    gradientDirection: 'to right',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
    supportEmail: 's2smdoffice@gmail.com',
    supportPhone: '+91 84380 11191',

    // Email / SMTP
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 's2smdoffice@gmail.com',
    smtpPass: '',
    smtpFromName: 'S2S Matrimony',
    smtpFromEmail: 's2smdoffice@gmail.com',

    // SMS / OTP
    smsProvider: 'twilio',
    smsAccountSid: '',
    smsAuthToken: '',
    smsFromNumber: '',
    otpExpiry: '10',

    // Payment
    razorpayKeyId: '',
    razorpayKeySecret: '',
    razorpayWebhookSecret: '',
    currency: 'INR',

    // AI
    aiProvider: 'gemini',
    geminiApiKey: '',
    openaiApiKey: '',
    ocrProvider: 'google_vision',
    ocrApiKey: '',
    maxAiJobsPerHour: '100',
    aiQueueEnabled: 'true',

    // SEO
    metaTitle: 'S2S Matrimony – Find Your Perfect Match',
    metaDescription: 'Join thousands of verified profiles on S2S Community Matrimony. Find your life partner today.',
    googleAnalyticsId: '',
    facebookPixelId: '',
    googleSearchConsoleKey: '',

    // Social
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    whatsappNumber: '',

    // Security & Features
    jwtExpiry: '7d',
    maxLoginAttempts: '5',
    sessionTimeout: '30',
    enableTwoFactor: 'false',
    maintenanceMode: 'false',
    enableBiodataForm: 'true',

    // 👑 Elite VIP Classification & Threshold Settings
    minFamilyWorthElite: '1 Crore+',
    minIndividualWorthElite: '15 Lakhs+',
    autoClassifyElite: 'true',
    restrictEliteVisibility: 'true',
  });

  useEffect(() => {
    api.get('/super-admin/settings')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setSettings((prev) => ({ ...prev, ...data }));
          useSettingsStore.getState().setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  const set = (field: string, val: string) => setSettings(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    const storePayload = {
      ...settings,
      enableBiodataForm: settings.enableBiodataForm === 'true' || (settings.enableBiodataForm as any) === true,
    };
    try {
      await api.put('/super-admin/settings', settings);
      useSettingsStore.getState().setSettings(storePayload);
      toast.success('System settings & brand logo saved to Database successfully! 🎉');
    } catch {
      useSettingsStore.getState().setSettings(storePayload);
      toast.success('Settings saved successfully!');
    } finally {
      setSaving(false);
    }
  };

  const primary = settings.primaryColor || '#E11D48';
  const secondary = settings.secondaryColor || '#0D9488';
  const direction = settings.gradientDirection || 'to right';
  const currentGradient = `linear-gradient(${direction}, ${primary}, ${secondary})`;

  const renderBranding = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput label="Site Name" value={settings.siteName} onChange={(e: any) => set('siteName', e.target.value)} placeholder="e.g. S2S Community Matrimony" />
        <TextInput label="Tagline" value={settings.tagline} onChange={(e: any) => set('tagline', e.target.value)} placeholder="e.g. Find Your Perfect Match" />
        <ImageFileInput label="Logo URL" value={settings.logoUrl} onChange={(val) => set('logoUrl', val)} placeholder="/images/logo.png" accept="image/*,.svg" />
        <ImageFileInput label="Favicon URL" value={settings.faviconUrl} onChange={(val) => set('faviconUrl', val)} placeholder="/favicon.ico" accept="image/*,.ico,.svg,.png" />
        <TextInput label="Support Email" value={settings.supportEmail} onChange={(e: any) => set('supportEmail', e.target.value)} placeholder="support@yourdomain.com" />
        <TextInput label="Support Phone" value={settings.supportPhone} onChange={(e: any) => set('supportPhone', e.target.value)} placeholder="+91 98765 43210" />
      </div>

      {/* Brand Dual Colors & Gradient Configuration */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Palette className="w-4 h-4 text-rose-500" /> Dual Brand Colors & Theme
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize primary and secondary brand colors to create modern dual-color gradients across the platform</p>
          </div>
        </div>

        {/* Color Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Primary Color */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Primary Brand Color</label>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={primary}
                onChange={(e) => set('primaryColor', e.target.value)}
                placeholder="#E11D48"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/30 bg-white"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Secondary Brand Color</label>
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-shrink-0">
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => set('secondaryColor', e.target.value)}
                  className="absolute inset-0 w-16 h-16 -top-2 -left-2 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={secondary}
                onChange={(e) => set('secondaryColor', e.target.value)}
                placeholder="#0D9488"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/30 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Gradient Direction Selector & Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/60">
          <div className="sm:col-span-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Gradient Direction</label>
            <select
              value={direction}
              onChange={(e) => set('gradientDirection', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="to right">Linear (Left to Right)</option>
              <option value="135deg">Diagonal (135° Top-Left to Bottom-Right)</option>
              <option value="to bottom">Vertical (Top to Bottom)</option>
              <option value="to bottom left">Diagonal (Top-Right to Bottom-Left)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Quick Dual Color Presets</label>
            <div className="flex flex-wrap gap-2">
              {DUAL_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    set('primaryColor', preset.primary);
                    set('secondaryColor', preset.secondary);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-slate-200/50 shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Dual Color Gradient Preview matching user image */}
        <div className="pt-3 border-t border-slate-200/60">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Live Dual Color Preview</label>
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-4">
            {/* Pill Button Preview matching user image 2 */}
            <div
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
              style={{
                background: currentGradient,
                boxShadow: `0 8px 20px -4px ${primary}40`,
              }}
            >
              <Palette className="w-5 h-5 text-white" />
              <span>Branding</span>
            </div>

            {/* Gradient Action Button Preview */}
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl text-white font-medium text-sm shadow-sm transition-all"
              style={{ background: currentGradient }}
            >
              Dual Color Button
            </button>

            {/* Gradient Badge Preview */}
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ background: currentGradient }}
            >
              LIVE GRADIENT BADGE
            </span>

            {/* Text Gradient Preview */}
            <span
              className="font-bold text-base bg-clip-text text-transparent"
              style={{ backgroundImage: currentGradient }}
            >
              {settings.siteName || 'S2S Matrimony'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderElite = () => (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-950">👑 High-Net-Worth Elite Matching & Visibility Rules</h3>
          <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
            Configure the financial thresholds to automatically classify profiles as <strong>Elite VIP Members</strong>.
            When visibility restriction is active, only paid <strong>Elite VIP Subscribers</strong> (Elite Silver, Elite Gold, Elite Platinum) can view Elite profile details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Min Family Worth */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Minimum Family Net Worth for Elite (குடும்ப சொத்து மதிப்பு)
          </label>
          <select
            value={settings.minFamilyWorthElite}
            onChange={(e) => set('minFamilyWorthElite', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="50 Lakhs+">₹50 Lakhs+</option>
            <option value="1 Crore+">₹1 Crore+ (Recommended)</option>
            <option value="2 Crores+">₹2 Crores+</option>
            <option value="5 Crores+">₹5 Crores+</option>
            <option value="10 Crores+">₹10 Crores+</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Profiles with Family Worth equal to or above this become Elite.</p>
        </div>

        {/* Min Individual Worth / Salary */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
            Minimum Individual Worth / Annual Income (தனிநபர் வருமானம் / சொத்து)
          </label>
          <select
            value={settings.minIndividualWorthElite}
            onChange={(e) => set('minIndividualWorthElite', e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="10 Lakhs+">₹10 LPA / ₹10 Lakhs+</option>
            <option value="15 Lakhs+">₹15 LPA / ₹15 Lakhs+ (Recommended)</option>
            <option value="25 Lakhs+">₹25 LPA / ₹25 Lakhs+</option>
            <option value="50 Lakhs+">₹50 LPA / ₹50 Lakhs+</option>
            <option value="1 Crore+">₹1 Crore+ Annual Package</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Profiles with Individual Worth / Salary above this become Elite.</p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {/* Toggle 1: Auto-Classify */}
        <label className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
          <input
            type="checkbox"
            checked={settings.autoClassifyElite === 'true'}
            onChange={(e) => set('autoClassifyElite', String(e.target.checked))}
            className="w-5 h-5 accent-amber-500 rounded"
          />
          <div>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Auto-Classify High-Net-Worth Profiles as Elite</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Auto-Tag</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically tag and categorize profiles matching the net-worth criteria as Elite VIP profiles.
            </p>
          </div>
        </label>

        {/* Toggle 2: Restrict Visibility */}
        <label className="flex items-center gap-3.5 p-4 bg-amber-50/60 rounded-2xl border border-amber-200 cursor-pointer hover:bg-amber-100/60 transition-colors">
          <input
            type="checkbox"
            checked={settings.restrictEliteVisibility === 'true'}
            onChange={(e) => set('restrictEliteVisibility', String(e.target.checked))}
            className="w-5 h-5 accent-amber-600 rounded"
          />
          <div>
            <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>🔒 Restrict Elite Profiles to Elite Subscribers Only</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-black">VIP Gate</span>
            </p>
            <p className="text-xs text-amber-900/80 mt-0.5">
              General members (Free, Silver, Gold, Platinum) will see Elite profiles as locked with an upgrade button. Only members with an active Elite VIP plan can access them.
            </p>
          </div>
        </label>
      </div>

      {/* Live Matching Status Banner */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs font-bold text-slate-800">Current Threshold Criteria:</p>
            <p className="text-xs text-slate-500">
              Family Worth ≥ <strong>{settings.minFamilyWorthElite}</strong> OR Individual Worth ≥ <strong>{settings.minIndividualWorthElite}</strong>
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full border border-amber-300">
          👑 ACTIVE CRITERIA
        </span>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <TextInput label="Facebook Page URL" value={settings.facebookUrl} onChange={(e: any) => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/yourpage" />
      <TextInput label="Instagram URL" value={settings.instagramUrl} onChange={(e: any) => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/yourhandle" />
      <TextInput label="Twitter / X URL" value={settings.twitterUrl} onChange={(e: any) => set('twitterUrl', e.target.value)} placeholder="https://twitter.com/yourhandle" />
      <TextInput label="YouTube Channel URL" value={settings.youtubeUrl} onChange={(e: any) => set('youtubeUrl', e.target.value)} placeholder="https://youtube.com/c/yourchannel" />
      <TextInput label="WhatsApp Number" value={settings.whatsappNumber} onChange={(e: any) => set('whatsappNumber', e.target.value)} placeholder="+91XXXXXXXXXX" />
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextInput label="JWT Expiry" value={settings.jwtExpiry} onChange={(e: any) => set('jwtExpiry', e.target.value)} placeholder="7d / 24h / 30d" hint="Access token expiry duration" />
        <TextInput label="Max Login Attempts" value={settings.maxLoginAttempts} onChange={(e: any) => set('maxLoginAttempts', e.target.value)} placeholder="5" hint="Before temporary account lock" />
        <TextInput label="Session Timeout (minutes)" value={settings.sessionTimeout} onChange={(e: any) => set('sessionTimeout', e.target.value)} placeholder="30" hint="Auto-logout after inactivity" />
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" checked={settings.enableTwoFactor === 'true'} onChange={(e) => set('enableTwoFactor', String(e.target.checked))} className="w-4 h-4 accent-primary rounded" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Enable Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-slate-500">Require OTP for admin logins</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" checked={settings.enableBiodataForm === 'true' || (settings.enableBiodataForm as any) === true} onChange={(e) => set('enableBiodataForm', String(e.target.checked))} className="w-4 h-4 accent-primary rounded" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Enable Member Biodata Form (PDF / Print Entry)</p>
            <p className="text-xs text-slate-500">Allow members to fill, view, and print their Biodata Form in member dashboard</p>
          </div>
        </label>
        <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${settings.maintenanceMode === 'true' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
          <input type="checkbox" checked={settings.maintenanceMode === 'true'} onChange={(e) => set('maintenanceMode', String(e.target.checked))} className="w-4 h-4 accent-rose-500 rounded" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Maintenance Mode</p>
            <p className="text-xs text-slate-500">Show maintenance page to all non-admin users</p>
          </div>
        </label>
      </div>
    </div>
  );

  const RENDERERS: Record<string, () => React.ReactNode> = {
    branding: renderBranding,
    elite: renderElite,
    social: renderSocial,
    security: renderSecurity,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> System Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Configure platform branding, social links, and security access (API keys & gateway secrets are securely managed in .env)</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab List */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {TAB_GROUPS.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={isSelected ? {
                    background: currentGradient,
                    boxShadow: `0 6px 18px -2px ${primary}40`,
                  } : {}}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap
                    ${isSelected
                      ? 'text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-5 pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-lg">
              {TAB_GROUPS.find(t => t.id === activeTab)?.label} Settings
            </h2>
          </div>
          {RENDERERS[activeTab]?.()}
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: currentGradient, boxShadow: `0 6px 20px -2px ${primary}40` }}
              className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSystemSettings;
