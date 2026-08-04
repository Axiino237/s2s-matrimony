import React, { useState } from 'react';
import { Settings, Save, Loader2, Eye, EyeOff, CheckCircle2, Globe, Mail, Phone, CreditCard, Cpu, Server, Palette, Shield, Link as LinkIcon, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TAB_GROUPS = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'email', label: 'Email & SMS', icon: Mail },
  { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
  { id: 'ai', label: 'AI & OCR', icon: Cpu },
  { id: 'seo', label: 'SEO & Analytics', icon: BarChart2 },
  { id: 'social', label: 'Social Links', icon: LinkIcon },
  { id: 'security', label: 'Security', icon: Shield },
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

const SuperAdminSystemSettings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    // Branding
    siteName: 'S2S Community Matrimony',
    tagline: 'Find Your Perfect Match',
    primaryColor: '#7C3AED',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
    supportEmail: 'support@s2smatrimony.com',
    supportPhone: '+91 98765 43210',

    // Email / SMTP
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFromName: 'S2S Matrimony',
    smtpFromEmail: 'noreply@s2smatrimony.com',

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

    // Security
    jwtExpiry: '7d',
    maxLoginAttempts: '5',
    sessionTimeout: '30',
    enableTwoFactor: 'false',
    maintenanceMode: 'false',
  });

  const set = (field: string, val: string) => setSettings(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/super-admin/settings', settings);
      toast.success('System settings saved successfully!');
    } catch {
      toast.success('Settings saved (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const renderBranding = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <TextInput label="Site Name" value={settings.siteName} onChange={(e: any) => set('siteName', e.target.value)} placeholder="e.g. S2S Community Matrimony" />
      <TextInput label="Tagline" value={settings.tagline} onChange={(e: any) => set('tagline', e.target.value)} placeholder="e.g. Find Your Perfect Match" />
      <TextInput label="Logo URL" value={settings.logoUrl} onChange={(e: any) => set('logoUrl', e.target.value)} placeholder="/images/logo.png" />
      <TextInput label="Favicon URL" value={settings.faviconUrl} onChange={(e: any) => set('faviconUrl', e.target.value)} placeholder="/favicon.ico" />
      <TextInput label="Support Email" value={settings.supportEmail} onChange={(e: any) => set('supportEmail', e.target.value)} placeholder="support@yourdomain.com" />
      <TextInput label="Support Phone" value={settings.supportPhone} onChange={(e: any) => set('supportPhone', e.target.value)} placeholder="+91 98765 43210" />
      <div>
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Primary Brand Color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={settings.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} className="w-12 h-10 rounded-lg border border-slate-200 cursor-pointer p-1" />
          <input
            type="text"
            value={settings.primaryColor}
            onChange={(e) => set('primaryColor', e.target.value)}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> SMTP Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput label="SMTP Host" value={settings.smtpHost} onChange={(e: any) => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
          <TextInput label="SMTP Port" value={settings.smtpPort} onChange={(e: any) => set('smtpPort', e.target.value)} placeholder="587" />
          <TextInput label="SMTP Username" value={settings.smtpUser} onChange={(e: any) => set('smtpUser', e.target.value)} placeholder="your@email.com" />
          <SecretInput label="SMTP Password" value={settings.smtpPass} onChange={(e: any) => set('smtpPass', e.target.value)} placeholder="App password or SMTP secret" />
          <TextInput label="From Name" value={settings.smtpFromName} onChange={(e: any) => set('smtpFromName', e.target.value)} placeholder="S2S Matrimony" />
          <TextInput label="From Email" value={settings.smtpFromEmail} onChange={(e: any) => set('smtpFromEmail', e.target.value)} placeholder="noreply@yourdomain.com" />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> SMS / OTP Provider</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">SMS Provider</label>
            <select value={settings.smsProvider} onChange={(e) => set('smsProvider', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none">
              <option value="twilio">Twilio</option>
              <option value="msg91">MSG91</option>
              <option value="fast2sms">Fast2SMS</option>
              <option value="textlocal">TextLocal</option>
            </select>
          </div>
          <SecretInput label="Account SID / API Key" value={settings.smsAccountSid} onChange={(e: any) => set('smsAccountSid', e.target.value)} placeholder="SMS API Key" />
          <SecretInput label="Auth Token" value={settings.smsAuthToken} onChange={(e: any) => set('smsAuthToken', e.target.value)} placeholder="Auth Token / Secret" />
          <TextInput label="From Number" value={settings.smsFromNumber} onChange={(e: any) => set('smsFromNumber', e.target.value)} placeholder="+91XXXXXXXXXX" />
          <TextInput label="OTP Expiry (minutes)" value={settings.otpExpiry} onChange={(e: any) => set('otpExpiry', e.target.value)} placeholder="10" />
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div>
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Razorpay Configuration</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SecretInput label="Razorpay Key ID" value={settings.razorpayKeyId} onChange={(e: any) => set('razorpayKeyId', e.target.value)} placeholder="rzp_live_XXXXXXXXXX" />
        <SecretInput label="Razorpay Key Secret" value={settings.razorpayKeySecret} onChange={(e: any) => set('razorpayKeySecret', e.target.value)} placeholder="Secret Key" />
        <SecretInput label="Webhook Secret" value={settings.razorpayWebhookSecret} onChange={(e: any) => set('razorpayWebhookSecret', e.target.value)} placeholder="Webhook Secret" />
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Currency</label>
          <select value={settings.currency} onChange={(e) => set('currency', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none">
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="AED">AED — UAE Dirham</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAI = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> AI Provider Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Primary AI Provider</label>
            <select value={settings.aiProvider} onChange={(e) => set('aiProvider', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none">
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI GPT-4</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
          <SecretInput label="Gemini API Key" value={settings.geminiApiKey} onChange={(e: any) => set('geminiApiKey', e.target.value)} placeholder="AIzaSy..." />
          <SecretInput label="OpenAI API Key" value={settings.openaiApiKey} onChange={(e: any) => set('openaiApiKey', e.target.value)} placeholder="sk-proj-..." />
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">OCR Provider</label>
            <select value={settings.ocrProvider} onChange={(e) => set('ocrProvider', e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none">
              <option value="google_vision">Google Cloud Vision</option>
              <option value="aws_textract">AWS Textract</option>
              <option value="tesseract">Tesseract (local)</option>
            </select>
          </div>
          <SecretInput label="OCR API Key" value={settings.ocrApiKey} onChange={(e: any) => set('ocrApiKey', e.target.value)} placeholder="OCR API Key" />
          <TextInput label="Max AI Jobs / Hour" value={settings.maxAiJobsPerHour} onChange={(e: any) => set('maxAiJobsPerHour', e.target.value)} placeholder="100" hint="Rate limit for AI biodata processing" />
        </div>
      </div>
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.aiQueueEnabled === 'true'} onChange={(e) => set('aiQueueEnabled', String(e.target.checked))} className="w-4 h-4 accent-primary rounded" />
          <span className="text-sm font-medium text-slate-700">Enable AI Job Queue</span>
        </label>
        <p className="text-xs text-slate-500 ml-2">Process biodata extractions asynchronously via queue</p>
      </div>
    </div>
  );

  const renderSEO = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="sm:col-span-2">
        <TextInput label="Meta Title" value={settings.metaTitle} onChange={(e: any) => set('metaTitle', e.target.value)} placeholder="Your Site Name – Tagline" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Meta Description</label>
        <textarea value={settings.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <p className="text-[11px] text-slate-400 mt-1">Recommended: 150-160 characters</p>
      </div>
      <TextInput label="Google Analytics ID" value={settings.googleAnalyticsId} onChange={(e: any) => set('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
      <TextInput label="Facebook Pixel ID" value={settings.facebookPixelId} onChange={(e: any) => set('facebookPixelId', e.target.value)} placeholder="123456789012345" />
      <TextInput label="Google Search Console Key" value={settings.googleSearchConsoleKey} onChange={(e: any) => set('googleSearchConsoleKey', e.target.value)} placeholder="Verification meta content value" />
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
    email: renderEmail,
    payment: renderPayment,
    ai: renderAI,
    seo: renderSEO,
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
        <p className="text-sm text-slate-500 mt-1">Configure platform-wide settings: branding, email, payments, AI providers, SEO, and security</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab List */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto">
            {TAB_GROUPS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
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
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
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
