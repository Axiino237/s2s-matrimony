"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
async function main() {
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public",
    });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const userA = await prisma.user.findUnique({ where: { email: 'aravinthvijay127@gmail.com' } });
        if (!userA) {
            console.log('User A not found');
            return;
        }
        const femaleProfile = await prisma.profile.findFirst({
            where: { gender: 'FEMALE' },
            include: { user: true },
        });
        if (!femaleProfile || !femaleProfile.user) {
            console.log('Female profile not found');
            return;
        }
        const senderUserId = femaleProfile.userId;
        const receiverUserId = userA.id;
        const interest = await prisma.interest.upsert({
            where: {
                senderId_receiverId: {
                    senderId: senderUserId,
                    receiverId: receiverUserId,
                },
            },
            update: { status: 'PENDING', message: 'Hello! I found your profile matching our family background.' },
            create: {
                senderId: senderUserId,
                receiverId: receiverUserId,
                status: 'PENDING',
                message: 'Hello! I found your profile matching our family background.',
            },
        });
        const senderName = `${femaleProfile.firstName} ${femaleProfile.lastName}`.trim() || 'Deepika Devendra';
        await prisma.notification.create({
            data: {
                userId: receiverUserId,
                type: 'INTEREST',
                title: 'New Interest Expressed',
                message: `${senderName} expressed interest in your profile!`,
                data: { senderUserId, interestId: interest.id },
            },
        });
        console.log('SUCCESSFULLY_SEEDED_INTEREST_AND_NOTIFICATION');
    }
    catch (err) {
        console.error('Error seeding interest:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=seed-interest.js.map