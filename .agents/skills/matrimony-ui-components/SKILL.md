---
name: matrimony-ui-components
description: React + Tailwind UI component patterns, design system, and conventions for S2S Community Matrimony frontend. Use this skill when creating any React component, page, or UI element.
---

# S2S Matrimony — UI Components Skill

## Design System

### Color Palette (Matrimony Theme)
```css
:root {
  --primary: #C41E3A;       /* Deep Red - primary brand */
  --primary-dark: #8B0000;  /* Dark Red */
  --primary-light: #FF6B6B; /* Light Red/Pink */
  --secondary: #FFD700;     /* Gold - premium */
  --accent: #FF8C42;        /* Orange accent */
  --bg-dark: #0F0A1E;       /* Deep dark bg */
  --bg-card: #1A1330;       /* Card bg */
  --text-primary: #FFFFFF;
  --text-secondary: #B0A8CC;
  --success: #00D4AA;
  --border: rgba(255,255,255,0.1);
}
```

### Typography
- Font: `'Inter', sans-serif` (Google Fonts)
- Display: `'Playfair Display', serif` (for hero headings)

## Key Reusable Components

### ProfileCard Component
```tsx
interface ProfileCardProps {
  profile: Profile;
  onInterest?: () => void;
  onShortlist?: () => void;
  isPremium?: boolean;
}

export const ProfileCard = ({ profile, onInterest, onShortlist }: ProfileCardProps) => (
  <div className="group relative bg-gradient-to-br from-[#1A1330] to-[#0F0A1E] 
    border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 
    transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1">
    {/* Photo */}
    <div className="relative aspect-[3/4] overflow-hidden">
      <img src={profile.mainPhoto} alt={profile.name} className="w-full h-full object-cover 
        group-hover:scale-105 transition-transform duration-500" />
      {profile.isVerified && (
        <span className="absolute top-2 right-2 bg-success text-white text-xs px-2 py-1 rounded-full">
          ✓ Verified
        </span>
      )}
      {profile.isPremium && (
        <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-400 
          text-black text-xs font-bold px-2 py-1 rounded-full">★ Premium</span>
      )}
    </div>
    {/* Info */}
    <div className="p-4">
      <h3 className="text-white font-semibold text-lg">{profile.name}</h3>
      <p className="text-text-secondary text-sm mt-1">
        {profile.age} yrs • {profile.height} • {profile.city}
      </p>
      <p className="text-text-secondary text-sm">{profile.education} • {profile.occupation}</p>
      {/* Match Score */}
      {profile.matchScore && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-white/10 rounded-full h-2">
            <div className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full"
              style={{ width: `${profile.matchScore}%` }} />
          </div>
          <span className="text-primary text-sm font-bold">{profile.matchScore}%</span>
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button onClick={onInterest}
          className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-xl
            transition-colors text-sm font-medium">
          Send Interest
        </button>
        <button onClick={onShortlist}
          className="p-2 border border-white/20 hover:border-primary rounded-xl text-white 
            hover:text-primary transition-colors">
          ♡
        </button>
      </div>
    </div>
  </div>
);
```

### Premium Badge Component
```tsx
export const PremiumBadge = ({ tier }: { tier: 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM' }) => {
  const styles = {
    SILVER:   'from-gray-300 to-gray-500 text-gray-900',
    GOLD:     'from-yellow-400 to-amber-500 text-yellow-900',
    DIAMOND:  'from-blue-300 to-cyan-500 text-blue-900',
    PLATINUM: 'from-purple-400 to-violet-600 text-white',
  };
  return (
    <span className={`bg-gradient-to-r ${styles[tier]} text-xs font-bold px-3 py-1 rounded-full`}>
      {tier}
    </span>
  );
};
```

### Multi-Step Form Wizard
```tsx
export const StepWizard = ({ steps, currentStep, onNext, onBack }: WizardProps) => (
  <div>
    {/* Progress Bar */}
    <div className="flex items-center mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
            ${i < currentStep ? 'bg-success text-white' : 
              i === currentStep ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
            {i < currentStep ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-1 mx-2 rounded-full
              ${i < currentStep ? 'bg-success' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
    {/* Step Content */}
    <div className="animate-fadeIn">{steps[currentStep].component}</div>
    {/* Navigation */}
    <div className="flex justify-between mt-8">
      <button onClick={onBack} disabled={currentStep === 0}
        className="px-6 py-2 border border-white/20 rounded-xl text-white disabled:opacity-30">
        Back
      </button>
      <button onClick={onNext}
        className="px-6 py-2 bg-primary rounded-xl text-white font-medium">
        {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
      </button>
    </div>
  </div>
);
```

### Admin Data Table
```tsx
export const DataTable = ({ columns, data, onSort, onFilter, pagination }: TableProps) => (
  <div className="bg-[#1A1330] rounded-2xl border border-white/10 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-white/5 border-b border-white/10">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-text-secondary text-sm font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-white/5 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-white text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {pagination && <Pagination {...pagination} />}
  </div>
);
```

## Tailwind Config Extensions

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{tsx,ts,jsx,js}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#C41E3A', dark: '#8B0000', light: '#FF6B6B' },
        secondary: '#FFD700',
        accent: '#FF8C42',
        bg: { dark: '#0F0A1E', card: '#1A1330' },
        success: '#00D4AA',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideUp: 'slideUp 0.4s ease-out',
        pulse: 'pulse 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
};
```

## Page Layout Convention

```tsx
// All member pages use MemberLayout
// All admin pages use AdminLayout
// All public pages use PublicLayout

export const MemberLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-bg-dark text-white">
    <MemberNavbar />
    <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    <Footer />
  </div>
);

export const AdminLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen bg-bg-dark text-white">
    <AdminSidebar />
    <div className="flex-1 flex flex-col">
      <AdminTopbar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  </div>
);
```
