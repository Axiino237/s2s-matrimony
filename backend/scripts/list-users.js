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
const dev_store_1 = require("../src/common/dev-store");
dotenv.config();
async function main() {
    console.log('=== USERS IN DEV STORE ===');
    const devUsers = dev_store_1.devStore.getAll();
    console.log(JSON.stringify(devUsers, null, 2));
    console.log('\n=== USERS IN POSTGRESQL DATABASE ===');
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const users = await prisma.user.findMany({
            include: {
                profile: {
                    include: {
                        horoscope: true,
                        education: true,
                        occupation: true,
                        family: true,
                    },
                },
                userRoles: {
                    include: { role: true },
                },
            },
        });
        console.log(`Total DB Users: ${users.length}`);
        users.forEach((u, i) => {
            console.log(`\n--- [User #${i + 1}] ---`);
            console.log(`ID: ${u.id}`);
            console.log(`Email: ${u.email}`);
            console.log(`Phone: ${u.phone}`);
            console.log(`Roles: ${u.userRoles.map((ur) => ur.role.name).join(', ') || 'None'}`);
            if (u.profile) {
                console.log(`Profile Name: ${u.profile.displayName || `${u.profile.firstName} ${u.profile.lastName}`}`);
                console.log(`Gender: ${u.profile.gender}`);
                console.log(`DOB: ${u.profile.dateOfBirth?.toISOString().split('T')[0]}`);
                console.log(`Gothram: ${u.profile.gothram || 'N/A'}`);
                if (u.profile.horoscope) {
                    console.log(`Horoscope -> Star: ${u.profile.horoscope.star || 'N/A'}, Rasi: ${u.profile.horoscope.rasi || 'N/A'}, Lagnam: ${u.profile.horoscope.lagnam || 'N/A'}`);
                }
                else {
                    console.log(`Horoscope: (None)`);
                }
            }
            else {
                console.log(`Profile: (None)`);
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
//# sourceMappingURL=list-users.js.map