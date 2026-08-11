"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const profiles_service_1 = require("../src/profiles/profiles.service");
dotenv.config();
async function main() {
    console.log('=== TESTING BACKEND PROFILES SERVICE API RESPONSE ===\n');
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    const prismaService = prisma;
    const profilesService = new profiles_service_1.ProfilesService(prismaService);
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
    await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
    await prisma.$disconnect().catch(() => null);
    await pool.end().catch(() => null);
}
main();
//# sourceMappingURL=test-api-response.js.map