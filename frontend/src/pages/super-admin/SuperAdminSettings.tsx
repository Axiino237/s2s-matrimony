import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSettingsStore } from '../../store/settings.store';

interface SettingItem {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SuperAdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<SettingItem[]>([
    {
      key: 'maintenanceMode',
      label: 'Site Maintenance Mode',
      description: 'Show maintenance page to visitors & regular members. Admin access remains active.',
      enabled: false,
    },
    {
      key: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Send transactional emails, matches & interest alerts to members.',
      enabled: true,
    },
    {
      key: 'smsNotifications',
      label: 'SMS Notifications',
      description: 'Send SMS OTP and critical account alerts via SMS gateway.',
      enabled: false,
    },
    {
      key: 'aiMatching',
      label: 'AI Matching',
      description: 'Enable AI-powered compatibility scoring and automated biodata recommendations.',
      enabled: true,
    },
    {
      key: 'autoVerification',
      label: 'Auto-Verification',
      description: 'Automatically verify profiles that pass identity and photo quality checks.',
      enabled: false,
    },
  ]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/super-admin/settings');
      const data = res.data?.settings || res.data || {};

      setSettings((prev) =>
        prev.map((item) => {
          let val = data[item.key];
          if (val === undefined && item.key === 'maintenanceMode') {
            val = data.isMaintenanceMode;
          }
          if (val !== undefined) {
            return {
              ...item,
              enabled: val === true || val === 'true',
            };
          }
          return item;
        }),
      );
    } catch {
      // Fallback to current settings store
      const storeMaint = useSettingsStore.getState().maintenanceMode;
      setSettings((prev) =>
        prev.map((item) => (item.key === 'maintenanceMode' ? { ...item, enabled: storeMaint } : item)),
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) => {
    setSettings((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, enabled: !item.enabled } : item)),
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, any> = {};
      settings.forEach((s) => {
        payload[s.key] = s.enabled;
      });

      await api.put('/super-admin/settings', payload);

      // Immediately sync with global frontend store
      const isMaint = Boolean(payload.maintenanceMode);
      useSettingsStore.getState().setSettings({ maintenanceMode: isMaint });

      setSaved(true);
      toast.success(
        isMaint
          ? 'Settings saved: Site Maintenance Mode is now ACTIVE across the application!'
          : 'Settings saved: Platform is live and fully accessible.',
      );
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save settings. Please check your network connection.');
    } finally {
      setSaving(false);
    }
  };

  const isMaintenanceActive = settings.find((s) => s.key === 'maintenanceMode')?.enabled || false;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Global Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Control platform-wide switches and configurations</p>
      </div>

      {/* Maintenance Mode Notice Banner */}
      {isMaintenanceActive && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-amber-900 text-sm">Site Maintenance Mode is Selected</p>
            <p className="text-amber-800 leading-relaxed">
              When saved, non-admin visitors and regular members will be redirected to the Maintenance Page.
              Super Admins and Admins retain full management portal access.
            </p>
          </div>
        </div>
      )}

      {/* Settings Switches Card */}
      <div className="card p-0 overflow-hidden shadow-xs border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-sm font-medium">Loading platform configurations...</span>
          </div>
        ) : (
          settings.map((setting, i) => (
            <div
              key={setting.key}
              className={`flex items-center justify-between px-5 py-4.5 border-b border-slate-100 last:border-0 transition-colors ${
                setting.key === 'maintenanceMode' && setting.enabled
                  ? 'bg-amber-50/40 hover:bg-amber-50/60'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-text-primary text-sm font-bold">{setting.label}</span>
                  {setting.key === 'maintenanceMode' && setting.enabled && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      ON
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">{setting.description}</p>
              </div>

              <button
                type="button"
                onClick={() => toggle(i)}
                className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  setting.enabled ? 'bg-primary' : 'bg-slate-200'
                }`}
                title={`Toggle ${setting.label}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                    setting.enabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn btn-primary flex items-center gap-2 shadow-sm font-bold text-sm px-6 py-2.5 disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? '✓ Settings Saved!' : 'Save Settings'}
        </button>

        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Platform configurations synced</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSettings;
