import React from 'react';
import { Crown } from 'lucide-react';

export type TierType = 'FREE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'ELITE' | 'PLATINUM' | string;

export interface MembershipBadgeProps {
  tier?: TierType | null;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const formatTierName = (tier?: string | null): string => {
  const t = (tier || 'FREE').toUpperCase();
  switch (t) {
    case 'FREE':
      return 'Free Member';
    case 'SILVER':
      return '★ Silver Member';
    case 'GOLD':
      return '★ Gold Member';
    case 'DIAMOND':
      return '★ Diamond Member';
    case 'ELITE':
      return '★ Elite Member';
    case 'PLATINUM':
      return '★ Platinum Member';
    default:
      return `★ ${t.charAt(0) + t.slice(1).toLowerCase()} Member`;
  }
};

export const getTierBadgeClass = (tier?: string | null): string => {
  const t = (tier || 'FREE').toUpperCase();
  switch (t) {
    case 'SILVER':
      return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-sm border border-slate-300/40';
    case 'GOLD':
      return 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-white shadow-sm border border-amber-300/40 font-semibold';
    case 'DIAMOND':
      return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm border border-blue-400/40 font-semibold';
    case 'ELITE':
      return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm border border-purple-400/40 font-semibold';
    case 'PLATINUM':
      return 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-sm border border-cyan-400/40 font-semibold';
    case 'FREE':
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200/80 font-medium';
  }
};

export const isPaidTier = (tier?: string | null): boolean => {
  const t = (tier || 'FREE').toUpperCase();
  return t !== 'FREE' && t !== 'NONE' && t !== '';
};

export const MembershipBadge: React.FC<MembershipBadgeProps> = ({
  tier = 'FREE',
  size = 'xs',
  className = '',
  showIcon = false,
}) => {
  const normalizedTier = (tier || 'FREE').toUpperCase();
  const isPremium = isPaidTier(normalizedTier);

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const styleClass = getTierBadgeClass(normalizedTier);
  const label = formatTierName(normalizedTier);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold transition-all ${sizeClasses[size]} ${styleClass} ${className}`}
    >
      {showIcon && isPremium && <Crown className="w-3 h-3 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
};

export default MembershipBadge;
