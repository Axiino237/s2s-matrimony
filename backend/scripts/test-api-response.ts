import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { ProfilesService } from '../src/profiles/profiles.service';

dotenv.config();

async function main() {
  console.log('=== TESTING BACKEND PROFILES SERVICE API RESPONSE ===\n');

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Instantiate ProfilesService
  const prismaService: any = prisma;
  const profilesService = new ProfilesService(prismaService);

  // 1. Create a test MEMBER user in DB
  const memberRole = await prisma.role.findUnique({ where: { name: 'MEMBER' } }).catch(() => null);

  let user = await prisma.user.findFirst({
    where: { email: 'aravindhan.test@s2smatrimony.com' },
  }).catch(() => null);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'aravindhan.test@s2smatrimony.com',
        phone: '+919700000001',
        isPhoneVerified: true,
        userRoles: memberRole ? { create: { roleId: memberRole.id } } : undefined,
        profile: {
          create: {
            firstName: 'Aravindhan',
            lastName: 'Ravi',
            displayName: 'Aravindhan Ravi',
            gender: 'MALE',
            dateOfBirth: new Date('1998-06-15'),
            age: 28,
            motherTongue: 'Tamil',
            status: 'ACTIVE',
            profileCompletionPercent: 40,
          },
        },
      },
    });
  }

  const testPayload = {
    firstName: 'Aravindhan',
    lastName: 'Ravi',
    gender: 'MALE',
    dateOfBirth: '1998-06-15',
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Tamil',
    religion: 'Hindu',
    community: 'Kongu Vellalar',
    subCaste: 'Gounder',
    about: 'Looking for a caring, family-oriented life partner.',
    heightCm: 175,
    weight: 70,
    star: 'Rohini',
    rasi: 'Rishabam',
    lagnam: 'Simmam',
    gothram: 'Shiva',
    dosham: 'No Dosham',
    educationDegree: 'B.E / B.Tech',
    college: 'Anna University',
    educationDetail: 'Computer Science & Engineering',
    occupation: 'Software Engineer',
    company: 'Tech MNC',
    annualIncome: '1200000',
    workLocation: 'Chennai',
    fatherName: 'Ravi',
    fatherOccupation: 'Business',
    motherName: 'Lakshmi',
    motherOccupation: 'Homemaker',
  };

  console.log(`Updating profile for user ID: ${user.id}...`);
  await profilesService.updateProfile(user.id, testPayload);

  console.log('\nCalling getProfileByUserId API...');
  const profileResponse = await profilesService.getProfileByUserId(user.id);

  console.log('\n=== COMPLETE API JSON RESPONSE RETURNED TO FRONTEND ===');
  console.log(JSON.stringify(profileResponse, null, 2));

  // Clean up test user
  await prisma.user.delete({ where: { id: user.id } }).catch(() => null);

  await prisma.$disconnect().catch(() => null);
  await pool.end().catch(() => null);
}

main();
