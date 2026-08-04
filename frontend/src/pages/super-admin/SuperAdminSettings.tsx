import { useState } from 'react';
import { Settings } from 'lucide-react';

const settingsList = [
  { label: 'Site Maintenance Mode', enabled: false },
  { label: 'Email Notifications',   enabled: true  },
  { label: 'SMS Notifications',     enabled: false },
  { label: 'AI Matching',           enabled: true  },
  { label: 'Auto-Verification',     enabled: false },
];

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState(settingsList);

  const toggle = (i: number) =>
    setSettings(s => s.map((item, idx) => idx === i ? { ...item, enabled: !item.enabled } : item));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Global Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Control platform-wide switches and configurations</p>
      </div>

      <div className="card p-0 max-w-2xl overflow-hidden">
        {settings.map((setting, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
          >
            <span className="text-text-primary text-sm font-medium">{setting.label}</span>
            <button
              onClick={() => toggle(i)}
              className={`w-12 h-6 rounded-full relative transition-all duration-200 ${
                setting.enabled ? 'bg-primary' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                  setting.enabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary">Save Settings</button>
    </div>
  );
};

export default SuperAdminSettings;
