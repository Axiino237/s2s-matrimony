---
name: matrimony-db-schema
description: PostgreSQL + Prisma database schema patterns for S2S Community Matrimony. Use this skill when working with database models, migrations, relationships, or Prisma queries.
---

# S2S Matrimony — Database Schema Skill

## Prisma Schema Conventions

- All IDs: `String @id @default(uuid())`
- All timestamps: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- Soft deletes: `deletedAt DateTime?`
- All enums defined at top of schema

## Core Enums

```prisma
enum Gender        { MALE FEMALE }
enum MaritalStatus { NEVER_MARRIED DIVORCED WIDOWED SEPARATED }
enum MembershipTier { FREE SILVER GOLD DIAMOND PLATINUM }
enum ProfileStatus  { PENDING ACTIVE SUSPENDED DELETED }
enum PhotoStatus    { PENDING APPROVED REJECTED }
enum InterestStatus { PENDING ACCEPTED REJECTED }
enum PaymentStatus  { PENDING SUCCESS FAILED REFUNDED }
enum NotifType      { INTEREST MATCH CHAT MESSAGE PAYMENT SYSTEM }
enum AdminRole      { SUPER_ADMIN ADMIN MODERATOR SUPPORT_AGENT }
enum VerifyStatus   { UNVERIFIED PENDING VERIFIED REJECTED }
```

## Key Table Relationships

```
User (1) → (1) Profile
Profile (1) → (many) ProfilePhotos
Profile (1) → (1) Education
Profile (1) → (1) Occupation
Profile (1) → (1) FamilyDetail
Profile (1) → (1) Horoscope
Profile (1) → (1) PartnerPreference
Profile (1) → (1) PrivacySetting
User (many) ↔ (many) Roles (via UserRole)
User (1) → (many) Interests (sent)
User (1) → (many) Interests (received)
User (1) → (many) Memberships
User (1) → (many) Payments
Community (1) → (many) SubCommunities
Religion (1) → (many) Castes
Caste (1) → (many) SubCastes
Country (1) → (many) States
State (1) → (many) Cities
```

## Critical Prisma Query Patterns

### Fetch full profile (single query)
```typescript
const profile = await prisma.profile.findUnique({
  where: { id },
  include: {
    user: { select: { email: true, phone: true, lastActive: true } },
    photos: { where: { status: 'APPROVED' }, orderBy: { order: 'asc' } },
    education: true,
    occupation: true,
    family: true,
    horoscope: true,
    partnerPreference: true,
    privacySetting: true,
    community: true,
    caste: true,
    state: true,
    city: true,
  }
});
```

### Search query pattern
```typescript
const profiles = await prisma.profile.findMany({
  where: {
    AND: [
      { gender: filters.gender },
      { age: { gte: filters.ageMin, lte: filters.ageMax } },
      { communityId: filters.communityId },
      { casteId: filters.casteId },
      { maritalStatus: { in: filters.maritalStatus } },
      { stateId: filters.stateId },
      { status: 'ACTIVE' },
      { deletedAt: null },
      // Privacy filter — hide contact if not premium
      ...(isPremium ? [] : [{ privacySetting: { showPhone: false } }]),
    ],
    education: filters.educationId ? { educationId: filters.educationId } : undefined,
    occupation: filters.salary ? {
      salaryMin: { gte: filters.salary }
    } : undefined,
  },
  include: {
    photos: { where: { isMain: true, status: 'APPROVED' }, take: 1 },
    community: { select: { name: true } },
    state: { select: { name: true } },
    city: { select: { name: true } },
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});
```

## Seed Data Order (important — foreign key order)

1. Countries → States → Cities
2. Religions → Castes → SubCastes
3. Communities → SubCommunities
4. EducationMaster
5. OccupationMaster
6. Languages
7. Roles → Permissions → RolePermissions
8. Admin Users
9. MembershipPlans
