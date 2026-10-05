const dotenv = require('dotenv');
dotenv.config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/s2s_matrimony?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const COUNTRIES_DATA = [
  {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    states: [
      'Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Telangana',
      'Maharashtra', 'Delhi', 'Gujarat', 'Uttar Pradesh', 'West Bengal',
      'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Bihar',
      'Odisha', 'Goa', 'Puducherry'
    ]
  },
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    states: [
      'California', 'Texas', 'New York', 'New Jersey', 'Washington',
      'Illinois', 'Georgia', 'Virginia', 'Florida', 'Massachusetts',
      'Pennsylvania', 'North Carolina', 'Ohio', 'Michigan'
    ]
  },
  {
    name: 'United Kingdom',
    code: 'UK',
    flag: '🇬🇧',
    states: [
      'England', 'Greater London', 'Scotland', 'Wales', 'Northern Ireland'
    ]
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    states: [
      'Ontario', 'British Columbia', 'Alberta', 'Quebec'
    ]
  },
  {
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    states: [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia'
    ]
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    flag: '🇦🇪',
    states: [
      'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'
    ]
  },
  {
    name: 'Singapore',
    code: 'SG',
    flag: '🇸🇬',
    states: [
      'Central Singapore', 'Jurong', 'Tampines', 'Woodlands'
    ]
  },
  {
    name: 'Malaysia',
    code: 'MY',
    flag: '🇲🇾',
    states: [
      'Kuala Lumpur', 'Selangor', 'Penang', 'Johor'
    ]
  }
];

async function seedLocations() {
  console.log('Seeding countries and states...');
  
  for (const cData of COUNTRIES_DATA) {
    let country = await prisma.country.findFirst({
      where: {
        OR: [
          { name: { equals: cData.name, mode: 'insensitive' } },
          { code: { equals: cData.code, mode: 'insensitive' } }
        ]
      }
    });

    if (!country) {
      country = await prisma.country.create({
        data: {
          name: cData.name,
          code: cData.code,
          flag: cData.flag,
          isActive: true,
        }
      });
      console.log(`Created country: ${country.name} (${country.code})`);
    } else {
      country = await prisma.country.update({
        where: { id: country.id },
        data: { name: cData.name, code: cData.code, flag: cData.flag, isActive: true }
      });
    }

    for (const stateName of cData.states) {
      let state = await prisma.state.findFirst({
        where: {
          countryId: country.id,
          name: { equals: stateName, mode: 'insensitive' }
        }
      });

      if (!state) {
        state = await prisma.state.create({
          data: {
            name: stateName,
            countryId: country.id,
            isActive: true,
          }
        });
        console.log(`  - Created state: ${state.name} under ${country.name}`);
      }
    }
  }

  // Backfill existing profiles
  const india = await prisma.country.findFirst({ where: { name: 'India' } });
  const tamilNadu = await prisma.state.findFirst({ where: { name: 'Tamil Nadu', countryId: india?.id } });
  const andhra = await prisma.state.findFirst({ where: { name: 'Andhra Pradesh', countryId: india?.id } });

  const profiles = await prisma.profile.findMany({
    include: { horoscope: true, family: true, occupation: true }
  });

  for (const p of profiles) {
    const hData = p.horoscope?.horoscopeData || {};
    const birthPlace = String(p.horoscope?.birthPlace || hData.birthPlace || '').toLowerCase();
    const isAndhra = birthPlace.includes('vijayawada') || birthPlace.includes('visakhapatnam') || birthPlace.includes('tirupati') || birthPlace.includes('guntur') || birthPlace.includes('hyderabad') || birthPlace.includes('andhra');

    const targetState = isAndhra ? andhra : tamilNadu;

    await prisma.profile.update({
      where: { id: p.id },
      data: {
        countryId: india?.id || null,
        stateId: targetState?.id || null,
      }
    });
    console.log(`Updated profile ${p.displayName || p.firstName} -> Country: India, State: ${targetState?.name}`);
  }

  console.log('Seeding and profile backfill completed successfully!');
}

seedLocations()
  .catch((e) => {
    console.error('Error seeding locations:', e);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
