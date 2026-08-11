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
    console.log('Cleaning up devStore & Database non-admin members...');
    dev_store_1.devStore.resetStore();
    console.log('devStore reset to initial Super Admin & Admin state.');
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public';
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const adminRoles = await prisma.role.findMany({
            where: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        }).catch(() => []);
        const adminRoleIds = adminRoles.map((r) => r.id);
        const adminUserRoles = await prisma.userRole.findMany({
            where: { roleId: { in: adminRoleIds } },
        }).catch(() => []);
        const adminUserIds = adminUserRoles.map((ur) => ur.userId);
        if (adminUserIds.length > 0) {
            await prisma.profile.deleteMany({
                where: { userId: { in: adminUserIds } },
            }).catch(() => null);
        }
        const deleted = await prisma.user.deleteMany({
            where: {
                id: { notIn: adminUserIds.concat(['super-admin-001', 'admin-001']) },
            },
        }).catch(() => ({ count: 0 }));
        console.log(`Successfully removed ${deleted.count} member profiles & cleaned admin profile entries from database!`);
    }
    catch (err) {
        console.log('DB cleanup skipped or offline:', err?.message || err);
    }
    finally {
        await prisma.$disconnect().catch(() => null);
        await pool.end().catch(() => null);
    }
}
main();
//# sourceMappingURL=clean-members.js.map