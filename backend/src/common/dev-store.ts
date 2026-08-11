export interface DevUser {
  id: string;
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: Date;
  age?: number;
  maritalStatus?: string;
  motherTongue?: string;
  about?: string;
  heightCm?: number;
  weight?: number;
  religion?: string;
  community?: string;
  caste?: string;
  subCaste?: string;
  educationDegree?: string;
  college?: string;
  occupation?: string;
  company?: string;
  annualIncome?: string;
  workLocation?: string;
  profileFor?: string;
  registrationData?: string;
  roles?: string[];
  membershipTier?: string;

  // Additional dev fields
  star?: string;
  rasi?: string;
  lagnam?: string;
  gothram?: string;
  dosham?: string;
  timeOfBirth?: string;
  birthTime?: string;
  placeOfBirth?: string;
  birthPlace?: string;
  education?: string;
  educationDetail?: string;
  companyName?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  brothers?: number;
  sisters?: number;
  familyType?: string;
  familyStatus?: string;
  familyValues?: string;
  prefGender?: string;
  prefAgeMin?: number;
  prefAgeMax?: number;
  prefHeightMin?: number;
  prefHeightMax?: number;
  aboutPartner?: string;
  profileCompletionPercent?: number;

  [key: string]: any;
}

export interface DevPlan {
  id: string;
  name: string;
  tier: 'FREE' | 'SILVER' | 'GOLD' | 'ELITE';
  price: string;
  duration: string;
  contactLimit: number;
  members?: string;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
}

class DevStore {
  private users = new Map<string, DevUser>();

  constructor() {
    this.resetStore();
  }

  resetStore() {
    this.users.clear();

    const superAdmin: DevUser = {
      id: 'super-admin-001',
      email: 'superadmin@s2smatrimony.com',
      phone: '+919999999999',
      firstName: 'Super',
      lastName: 'Admin',
      gender: 'MALE',
      roles: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'],
      membershipTier: 'ELITE',
    };

    const admin: DevUser = {
      id: 'admin-001',
      email: 'admin@s2smatrimony.com',
      phone: '+918888888888',
      firstName: 'System',
      lastName: 'Admin',
      gender: 'MALE',
      roles: ['ADMIN', 'MEMBER'],
      membershipTier: 'GOLD',
    };

    this.set(superAdmin.id, superAdmin);
    this.set(admin.id, admin);
    // Note: regular members are created only via the register API
  }


  clearNonAdminProfiles() {
    this.resetStore();
  }

  set(key: string, user: DevUser) {
    if (!user || !key) return;
    const cleanKey = key.toLowerCase();
    this.users.set(cleanKey, user);
    this.users.set(user.id, user);
    if (user.email) this.users.set(user.email.toLowerCase(), user);
    if (user.phone) {
      this.users.set(user.phone, user);
      const digitsOnly = user.phone.replace(/\D/g, '');
      if (digitsOnly) this.users.set(digitsOnly, user);
    }
  }

  get(key: string): DevUser | undefined {
    if (!key) return undefined;
    const cleanKey = key.toLowerCase();
    const digitsOnly = key.replace(/\D/g, '');

    return (
      this.users.get(key) ||
      this.users.get(cleanKey) ||
      (digitsOnly ? this.users.get(digitsOnly) : undefined) ||
      Array.from(this.users.values()).find(
        (u) =>
          u.id === key ||
          (u.email && u.email.toLowerCase() === cleanKey) ||
          (u.phone && (u.phone === key || u.phone.replace(/\D/g, '') === digitsOnly)),
      )
    );
  }

  update(userId: string, patch: Partial<DevUser>): DevUser | undefined {
    const existing = this.get(userId);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.set(existing.id, updated);
    if (updated.email) this.set(updated.email, updated);
    if (updated.phone) this.set(updated.phone, updated);
    return updated;
  }

  getAll(): DevUser[] {
    const unique = new Map<string, DevUser>();
    for (const u of this.users.values()) {
      unique.set(u.id, u);
    }
    return Array.from(unique.values());
  }
}

export const devStore = new DevStore();
export const devInterestsStore: any[] = [];
export const devMessagesStore = new Map<string, any[]>();
export const devUnlockedContactsStore = new Map<string, Set<string>>();
export const devPaymentsStore: any[] = [];

export const devPlansStore: DevPlan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    tier: 'FREE',
    price: '0',
    duration: 'Lifetime',
    contactLimit: 5,
    members: '0',
    features: ['5 Daily Interests', 'Basic Search Filters', '5 Profile Views'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'plan-silver',
    name: 'Silver',
    tier: 'SILVER',
    price: '599',
    duration: '1 Month',
    contactLimit: 50,
    members: '0',
    features: ['50 Daily Interests', 'Advanced Search Filters', '50 Contact Views', 'Direct Chat Messaging'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'plan-gold',
    name: 'Gold',
    tier: 'GOLD',
    price: '999',
    duration: '3 Months',
    contactLimit: 100,
    members: '0',
    features: ['Unlimited Interests', 'Advanced Search & Dosha Filters', '100 Contact Unlocks', 'Direct Chat Messaging', 'Priority Profile Ranking', 'AI Match Score'],
    isActive: true,
    isPopular: true,
  },
  {
    id: 'plan-elite',
    name: 'Elite',
    tier: 'ELITE',
    price: '1799',
    duration: '6 Months',
    contactLimit: 999,
    members: '0',
    features: ['Everything in Gold +', 'Unlimited Contact Unlocks', 'Highlighted Profile Badge', 'Dedicated Relationship Manager', 'Direct Chat & Phone Access'],
    isActive: true,
    isPopular: false,
  },
];
