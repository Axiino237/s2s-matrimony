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
dotenv.config();
async function main() {
    console.log('=== PROFILES TABLE IN POSTGRESQL DATABASE ===');
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const profiles = await prisma.profile.findMany({
            include: {
                user: true,
                horoscope: true,
                education: true,
                occupation: true,
                family: true,
                photos: true,
                partnerPreference: true,
                privacySetting: true,
            },
        });
        console.log(`Total Profiles in DB: ${profiles.length}`);
        profiles.forEach((p, i) => {
            console.log(`\n=================== PROFILE #${i + 1} ===================`);
            console.log(`Profile ID: ${p.id}`);
            console.log(`User ID   : ${p.userId} (${p.user?.email || 'N/A'})`);
            console.log(`Name      : ${p.displayName || `${p.firstName} ${p.lastName}`}`);
            console.log(`Gender    : ${p.gender}`);
            console.log(`DOB       : ${p.dateOfBirth?.toISOString().split('T')[0]}`);
            console.log(`Status    : ${p.status}`);
            console.log(`Completion: ${p.profileCompletionPercent}%`);
            console.log(`Gothram   : ${p.gothram || 'N/A'}`);
            console.log(`---------------- Horoscope ----------------`);
            if (p.horoscope) {
                console.log(`Star      : ${p.horoscope.star || 'N/A'}`);
                console.log(`Rasi      : ${p.horoscope.rasi || 'N/A'}`);
                console.log(`Lagnam    : ${p.horoscope.lagnam || 'N/A'}`);
                console.log(`Dosham    : ${p.horoscope.dosham || 'N/A'}`);
                console.log(`HoroscopeData JSON: ${JSON.stringify(p.horoscope.horoscopeData || {})}`);
            }
            else {
                console.log(`Horoscope: (None)`);
            }
            console.log(`---------------- Education ----------------`);
            if (p.education) {
                console.log(`Degree    : ${p.education.degree || 'N/A'}`);
                console.log(`College   : ${p.education.college || 'N/A'}`);
            }
            else {
                console.log(`Education: (None)`);
            }
            console.log(`---------------- Occupation ----------------`);
            if (p.occupation) {
                console.log(`Designation: ${p.occupation.designation || 'N/A'}`);
                console.log(`Company    : ${p.occupation.company || 'N/A'}`);
                console.log(`Location   : ${p.occupation.workingLocation || 'N/A'}`);
            }
            else {
                console.log(`Occupation: (None)`);
            }
            console.log(`---------------- Family ----------------`);
            if (p.family) {
                console.log(`Father    : ${p.family.fatherName || 'N/A'} (${p.family.fatherOccupation || 'N/A'})`);
                console.log(`Mother    : ${p.family.motherName || 'N/A'} (${p.family.motherOccupation || 'N/A'})`);
            }
            else {
                console.log(`Family: (None)`);
            }
        });
    }
    catch (err) {
        console.log('PostgreSQL DB Error:', err?.message || err);
    }
    finally {
        await prisma.$disconnect().catch(() => null);
        await pool.end().catch(() => null);
    }
}
main();
//# sourceMappingURL=list-profiles.js.map