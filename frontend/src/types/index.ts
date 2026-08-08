// ============================================================
// S2S Matrimony — Core TypeScript Types
// ============================================================

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT_AGENT' | 'PREMIUM' | 'MEMBER' | 'GUEST';

export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
export type MembershipTier = 'FREE' | 'SILVER' | 'GOLD' | 'ELITE' | 'PLATINUM';
export type ProfileStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type NotifType = 'INTEREST' | 'MATCH' | 'CHAT' | 'MESSAGE' | 'PAYMENT' | 'SYSTEM';

// ---- Auth Types ----
export interface JwtPayload {
  id?: string;
  sub: string;
  email: string;
  phone?: string;
  role?: string;           // legacy single-role field
  roles: Role[];
  permissions: string[];
  routes?: { id: string; slug: string; name: string; path: string; icon?: string }[];
  membershipStatus: MembershipTier;
  profileCompletionPercent?: number;   // 0-100 — gates dashboard access
  communityId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AuthState {
  user: JwtPayload | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginDto {
  email?: string;
  phone?: string;
  password?: string;
}

export interface RegisterDto {
  phone: string;
  email: string;
  password: string;
  gender: Gender;
  firstName: string;
  lastName: string;
  profileFor: 'SELF' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'FRIEND';
}

// ---- Profile Types ----
export interface Profile {
  id: string;
  userId: string;
  memberId?: string;
  branch?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  age: number;
  gender: Gender;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  birthOrder?: number;
  heightCm: number;
  heightDisplay: string;
  weight?: number;
  complexion?: string;
  residentStatus?: string;
  propertyDetails?: string;
  motherTongue?: string;
  about?: string;
  status: ProfileStatus;
  isVerified: boolean;
  isPremium: boolean;
  membershipTier: MembershipTier;
  matchScore?: number;
  profileCompletionPercent: number;
  mainPhoto?: string;
  photos: ProfilePhoto[];
  community?: Community;
  caste?: Caste;
  religion?: Religion;
  education?: Education;
  occupation?: Occupation;
  family?: FamilyDetail;
  horoscope?: Horoscope;
  partnerPreference?: PartnerPreference;
  privacySetting?: PrivacySetting;
  state?: State;
  city?: City;
  lastActive?: string;
  createdAt: string;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnail?: string;
  isMain: boolean;
  order: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Education {
  id: string;
  educationId: string;
  educationName: string;
  fieldOfStudy?: string;
  college?: string;
  year?: number;
}

export interface Occupation {
  id: string;
  occupationId: string;
  occupationName: string;
  company?: string;
  designation?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryDisplay?: string;
  workingLocation?: string;
}

export interface FamilyDetail {
  id: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  siblings?: number;
  brothers?: number;
  brothersMarried?: number;
  elderBrothers?: number;
  elderBrothersMarried?: number;
  youngerBrothers?: number;
  youngerBrothersMarried?: number;
  sisters?: number;
  sistersMarried?: number;
  elderSisters?: number;
  elderSistersMarried?: number;
  youngerSisters?: number;
  youngerSistersMarried?: number;
  familyType?: 'JOINT' | 'NUCLEAR';
  familyStatus?: 'RICH' | 'UPPER_MIDDLE' | 'MIDDLE' | 'LOWER_MIDDLE';
  familyValues?: 'ORTHODOX' | 'MODERATE' | 'LIBERAL';
  nativePlace?: string;
}

export interface Horoscope {
  id: string;
  star?: string;
  starPadam?: number;
  rasi?: string;
  lagnam?: string;
  gothram?: string;
  kuladeivam?: string;
  dosham?: string;
  dasaBalance?: string;
  birthTime?: string;
  birthPlace?: string;
  horoscopeFile?: string;
}

export interface PartnerPreference {
  id: string;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  maritalStatus?: MaritalStatus[];
  educationIds?: string[];
  occupationIds?: string[];
  salaryMin?: number;
  countryIds?: string[];
  stateIds?: string[];
  casteIds?: string[];
  motherTongue?: string[];
  complexion?: string[];
  dosha?: boolean;
  aboutPartner?: string;
}

export interface PrivacySetting {
  id: string;
  showPhone: boolean;
  showEmail: boolean;
  showPhoto: boolean;
  showHoroscope: boolean;
  showLastActive: boolean;
  whoCanViewProfile: 'ALL' | 'PREMIUM' | 'ACCEPTED';
}

// ---- Community Types ----
export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  memberCount?: number;
}

export interface Religion {
  id: string;
  name: string;
  castes?: Caste[];
}

export interface Caste {
  id: string;
  name: string;
  religionId: string;
  subCastes?: SubCaste[];
}

export interface SubCaste {
  id: string;
  name: string;
  casteId: string;
}

// ---- Location Types ----
export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
}

export interface State {
  id: string;
  name: string;
  countryId: string;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
}

// ---- Search Types ----
export interface SearchFilters {
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  maritalStatus?: MaritalStatus[];
  communityId?: string;
  casteIds?: string[];
  educationIds?: string[];
  occupationIds?: string[];
  salaryMin?: number;
  salaryMax?: number;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  motherTongue?: string;
  complexion?: string;
  dosha?: boolean;
  isVerified?: boolean;
  isPremium?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'match_score' | 'last_active';
}

export interface SearchResult {
  data: Profile[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Communication Types ----
export interface Interest {
  id: string;
  senderId: string;
  receiverId: string;
  senderProfile: Partial<Profile>;
  receiverProfile: Partial<Profile>;
  status: InterestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  isRead: boolean;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: Partial<Profile>[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

// ---- Payment Types ----
export interface MembershipPlan {
  id: string;
  name: string;
  tier: MembershipTier;
  price: number;
  durationMonths: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoiceUrl?: string;
  createdAt: string;
}

// ---- Admin Types ----
export interface AdminStats {
  totalUsers: number;
  activeProfiles: number;
  premiumMembers: number;
  totalRevenue: number;
  newToday: number;
  pendingVerifications: number;
  activeChats: number;
  successStories: number;
  revenueGrowth: number;
  userGrowth: number;
}

export interface SuccessStory {
  id: string;
  groomName: string;
  brideName: string;
  marriageDate: string;
  story: string;
  photo?: string;
  communityId?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  categoryId: string;
  category?: BlogCategory;
  authorId: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

// ---- API Response Types ----
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  statusCode: number;
  data: T[];
  meta: PaginationMeta;
}

// ---- Form Types ----
export interface ProfileStep1 {
  profileFor: 'SELF' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'FRIEND';
  gender: Gender;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  communityId: string;
  religionId: string;
  casteId: string;
  subCasteId?: string;
  motherTongue: string;
}
