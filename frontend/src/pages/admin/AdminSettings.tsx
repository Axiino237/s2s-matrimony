import { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings, Save } from 'lucide-react';

interface SettingField {
  label: string;
  value: string;
  type?: string;
}

interface SettingSection {
  section: string;
  fields: SettingField[];
}

const INITIAL_SETTINGS: SettingSection[] = [
  {
    section: 'General',
    fields: [
      { label: 'Site Name', value: 'S2S Matrimony' },
      { label: 'Support Email', value: 'support@s2smatrimony.com', type: 'email' },
      { label: 'Support Phone', value: '+91 44 1234 5678', type: 'tel' },
    ],
  },
  {
    section: 'Notifications',
    fields: [
      { label: 'Welcome Email Template', value: 'Default' },
      { label: 'OTP Expiry (minutes)', value: '5', type: 'number' },
      { label: 'Interest Notification', value: 'Enabled' },
    ],
  },
  {
    section: 'Moderation',
    fields: [
      { label: 'Auto-approve Profiles', value: 'Disabled' },
      { label: 'Max Photos Per Profile', value: '6', type: 'number' },
      { label: 'Min Profile Completion %', value: '50', type: 'number' },
    ],
  },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<SettingSection[]>(INITIAL_SETTINGS);
  const [saved, setSaved] = useState(false);

  const handleChange = (sIdx: number, fIdx: number, val: string) => {
    setSettings(prev => {
      const next = prev.map((s, si) => si !== sIdx ? s : {
        ...s,
        fields: s.fields.map((f, fi) => fi !== fIdx ? f : { ...f, value: val }),
      });
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Admin Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Configure platform-wide settings and preferences</p>
      </div>

      {settings.map((section, sIdx) => (
        <div key={section.section} className="card p-6">
          <h2 className="text-text-primary font-semibold text-base mb-4 pb-3 border-b border-slate-100">{section.section}</h2>
          <div className="space-y-4">
            {section.fields.map((field, fIdx) => (
              <div key={field.label} className="flex items-center justify-between gap-4">
                <label className="text-text-secondary text-sm font-medium flex-1 min-w-0">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  className="input py-1.5 w-52 text-sm"
                  value={field.value}
                  onChange={e => handleChange(sIdx, fIdx, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        className="btn btn-primary flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
};

export default AdminSettings;
