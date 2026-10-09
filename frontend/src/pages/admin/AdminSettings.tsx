import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save, Award, ShieldCheck, Loader2, Wrench, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useSettingsStore } from '../../store/settings.store';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [siteName, setSiteName] = useState('S2S Matrimony');
  const [supportEmail, setSupportEmail] = useState('support@s2smatrimony.com');
  const [supportPhone, setSupportPhone] = useState('+91 44 1234 5678');
  const [otpExpiry, setOtpExpiry] = useState('5');
  const [eliteThreshold, setEliteThreshold] = useState('50000000');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      const data = res.data?.settings || res.data || {};
      if (data.siteName) setSiteName(data.siteName);
      if (data.supportEmail) setSupportEmail(data.supportEmail);
      if (data.supportPhone) setSupportPhone(data.supportPhone);
      if (data.otpExpiry) setOtpExpiry(String(data.otpExpiry));
      if (data.eliteQualificationThreshold !== undefined) {
        setEliteThreshold(String(data.eliteQualificationThreshold));
      }
      if (data.maintenanceMode !== undefined) {
        setMaintenanceMode(data.maintenanceMode === true || data.maintenanceMode === 'true');
      } else if (data.isMaintenanceMode !== undefined) {
        setMaintenanceMode(data.isMaintenanceMode === true || data.isMaintenanceMode === 'true');
      }
    } catch {
      // Fallback to current settings store
      setMaintenanceMode(useSettingsStore.getState().maintenanceMode);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        siteName,
        supportEmail,
        supportPhone,
        otpExpiry: Number(otpExpiry) || 5,
        eliteQualificationThreshold: Number(eliteThreshold) || 50000000,
        maintenanceMode,
      };

      await api.put('/admin/settings', payload);
      useSettingsStore.getState().setSettings({ maintenanceMode });
      setSaved(true);
      toast.success(
        maintenanceMode
          ? 'Settings saved: Site Maintenance Mode is ACTIVE!'
          : 'Settings saved successfully!',
      );
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const thresholdNum = Number(eliteThreshold) || 0;
  const inCrores = (thresholdNum / 10000000).toFixed(2);
  const inLakhs = (thresholdNum / 100000).toFixed(2);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Admin Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Configure platform-wide settings and qualification rules</p>
      </div>

      {/* Elite Qualification Threshold */}
      <div className="card p-6 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 border-2 border-amber-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
                Elite Financial Qualification Threshold
              </h2>
              <p className="text-xs text-text-secondary">
                Configures the minimum net worth benchmark for Elite category members
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
            Active Rule: ≥ Threshold
          </span>
        </div>

        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Net Worth Threshold (₹)
            </label>
            <div className="relative max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
              <input
                type="number"
                min="0"
                step="100000"
                value={eliteThreshold}
                onChange={(e) => setEliteThreshold(e.target.value)}
                placeholder="50000000"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                Formatted: ₹ {thresholdNum.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-600 font-medium">
                ({inCrores} Crore / {inLakhs} Lakhs)
              </span>
            </div>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-100 space-y-1 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Qualification & Visibility Behavior:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Applies <strong>only</strong> to members in the <strong>Elite</strong> Membership Category.</li>
              <li><strong>Elite + Net Worth ≥ Threshold:</strong> Classified as <em>Elite — Qualified</em> (can see other Elite Qualified members).</li>
              <li><strong>Elite + Net Worth &lt; Threshold:</strong> Classified as <em>Elite — Not Qualified</em> (can see Elite Qualified and Not Qualified members).</li>
              <li><strong>General Members:</strong> Remain General regardless of net worth; only visible to General peers.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="text-text-primary font-semibold text-base border-b border-slate-100 pb-3">General Information</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-text-secondary text-sm font-medium">Site Name</label>
            <input
              type="text"
              className="input py-2 w-full sm:w-72 text-sm"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-text-secondary text-sm font-medium">Support Email</label>
            <input
              type="email"
              className="input py-2 w-full sm:w-72 text-sm"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-text-secondary text-sm font-medium">Support Phone</label>
            <input
              type="tel"
              className="input py-2 w-full sm:w-72 text-sm"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode Configuration */}
      <div className={`card p-6 space-y-4 border transition-colors ${maintenanceMode ? 'bg-amber-50/50 border-amber-300' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${maintenanceMode ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
                Site Maintenance Mode
                {maintenanceMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                    Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-secondary">
                Control application-wide availability for public visitors and members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMaintenanceMode((m) => !m)}
            className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer flex-shrink-0 ${
              maintenanceMode ? 'bg-primary' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                maintenanceMode ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {maintenanceMode && (
          <div className="p-3 bg-amber-100/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Maintenance mode will take effect once saved:</p>
              <p className="text-amber-800">
                Visitors & members will see the maintenance landing page. Admin and Super Admin accounts retain full system access.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <h2 className="text-text-primary font-semibold text-base border-b border-slate-100 pb-3">Security & Notifications</h2>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-text-secondary text-sm font-medium">OTP Expiry (Minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              className="input py-2 w-full sm:w-72 text-sm"
              value={otpExpiry}
              onChange={(e) => setOtpExpiry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary flex items-center gap-2 shadow-sm font-bold text-sm px-6 py-2.5"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? '✓ Saved!' : 'Save All Settings'}
      </button>
    </div>
  );
};

export default AdminSettings;
