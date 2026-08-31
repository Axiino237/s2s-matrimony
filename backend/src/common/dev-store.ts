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

  familyWorth?: string;
  individualWorth?: string;
  isElite?: boolean;
  propertyDetails?: string;

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

export interface EliteSettingsConfig {
  minFamilyWorthElite: string; // e.g. "1_CRORE", "2_CRORES", "5_CRORES", "10_CRORES"
  minIndividualWorthElite: string; // e.g. "15_LPA", "25_LPA", "50_LPA", "1_CRORE"
  autoClassifyElite: boolean;
  restrictEliteVisibility: boolean;
}

export const defaultEliteSettings: EliteSettingsConfig = {
  minFamilyWorthElite: '1 Crore+',
  minIndividualWorthElite: '15 Lakhs+',
  autoClassifyElite: true,
  restrictEliteVisibility: true,
};

export interface DevPlan {
  id: string;
  name: string;
  category?: 'GENERAL' | 'ELITE';
  tier: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ELITE';
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
      email: 's2smdoffice@gmail.com',
      phone: '+918438011191',
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
      firstName: 'Community',
      lastName: 'Admin',
      gender: 'MALE',
      roles: ['ADMIN', 'MEMBER'],
      membershipTier: 'GOLD',
    };

    const member: DevUser = {
      id: 'member-001',
      email: 'member@s2smatrimony.com',
      phone: '+917777777777',
      firstName: 'Kavitha',
      lastName: 'Ramasamy',
      gender: 'FEMALE',
      roles: ['MEMBER'],
      membershipTier: 'FREE',
      profileFor: 'SELF',
      maritalStatus: 'NEVER_MARRIED',
      age: 26,
      heightCm: 163,
      motherTongue: 'Tamil',
      religion: 'Hindu',
      community: 'Nadar',
      caste: 'Nadar',
      educationDegree: 'B.E. Computer Science',
      occupation: 'Software Engineer',
      annualIncome: '12-15 LPA',
      workLocation: 'Chennai, Tamil Nadu',
      profileCompletionPercent: 85,
    };

    this.users.set(superAdmin.id, superAdmin);
    this.users.set(admin.id, admin);
    this.users.set(member.id, member);
  }

  clearNonAdminProfiles() {
    this.resetStore();
  }

  set(key: string, user: DevUser): void {
    this.users.set(key, user);
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

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  getAll(): DevUser[] {
    const unique = new Map<string, DevUser>();
    for (const u of this.users.values()) {
      unique.set(u.id, u);
    }
    return Array.from(unique.values());
  }

  getAllUsers(): DevUser[] {
    return this.getAll();
  }
}

export const devStore = new DevStore();

export const devInterestsStore: any[] = [];
export const devMessagesStore = new Map<string, any[]>();
export const devUnlockedContactsStore = new Map<string, Set<string>>();
export const devPaymentsStore: any[] = [];

export const devPlansStore: DevPlan[] = [
  // ── General Category Plans ──
  {
    id: 'gen-free',
    name: 'Free Starter',
    category: 'GENERAL',
    tier: 'FREE',
    price: '0',
    duration: 'Lifetime',
    contactLimit: 5,
    members: '43,540',
    features: ['5 Daily Expressed Interests', 'Basic Search (Age, Religion, Community)', '5 Profile Views per Day', 'Basic Compatibility Score', 'Verified Member Badge'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'gen-silver',
    name: 'Silver Plan',
    category: 'GENERAL',
    tier: 'SILVER',
    price: '599',
    duration: '1 Month',
    contactLimit: 50,
    members: '3,240',
    features: ['50 Daily Expressed Interests', 'Advanced Search & Education Filters', '50 Contact Number & Phone Unlocks', 'Direct Instant Messaging & Live Chat', 'Full Horoscope Overview', 'Verified Search Badge Priority'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'gen-gold',
    name: 'Gold Plan',
    category: 'GENERAL',
    tier: 'GOLD',
    price: '1199',
    duration: '3 Months',
    contactLimit: 150,
    members: '4,180',
    features: ['UNLIMITED Expressed Interests', '150 Direct Contact & Phone Unlocks', 'Unlimited Direct Messaging & Chat', 'Full Horoscope & Porutham Match Reports', 'Priority Search Placement in Results', 'AI Matchmaking & Compatibility Score'],
    isActive: true,
    isPopular: true,
  },
  {
    id: 'gen-platinum',
    name: 'Platinum Plan',
    category: 'GENERAL',
    tier: 'PLATINUM',
    price: '1999',
    duration: '6 Months',
    contactLimit: 300,
    members: '1,520',
    features: ['UNLIMITED Expressed Interests', '300 Direct Contact & Phone Unlocks', 'Unlimited Chat & Priority Messaging', 'Full Horoscope & 10 Porutham Reports', 'TOP 5 Featured Profile Placement', 'Complete Privacy & Contact Protection'],
    isActive: true,
    isPopular: false,
  },

  // ── Elite Category Plans ──
  {
    id: 'elite-silver',
    name: 'Elite Silver',
    category: 'ELITE',
    tier: 'SILVER',
    price: '4999',
    duration: '3 Months',
    contactLimit: 500,
    members: '840',
    features: ['Dedicated Matchmaking Advisor', '15 Curated & Handpicked Introductions', 'Personal Profile Screening & Verification', 'Confidential Contact Information Sharing', 'Full Astrological & Horoscope Matching'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'elite-gold',
    name: 'Elite Gold',
    category: 'ELITE',
    tier: 'GOLD',
    price: '9999',
    duration: '6 Months',
    contactLimit: 1000,
    members: '1,120',
    features: ['Senior Personal Relationship Manager', '35 Handpicked & Pre-Screened Matches', 'Family Meeting Setup & Facilitation', 'Discreet Introductions & Complete Discretion', 'In-Depth Background & Horoscope Verification'],
    isActive: true,
    isPopular: true,
  },
  {
    id: 'elite-platinum',
    name: 'Elite Platinum',
    category: 'ELITE',
    tier: 'PLATINUM',
    price: '18999',
    duration: '12 Months (Till Marriage)',
    contactLimit: 9999,
    members: '460',
    features: ['Senior Director & Dedicated Matchmaking Team', 'UNLIMITED Curated & Vetted Introductions', 'End-to-End Family Coordination & Scheduling', 'Strict NDA & Total Privacy Protection', '24/7 Dedicated Concierge Support'],
    isActive: true,
    isPopular: false,
  },
];
