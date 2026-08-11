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
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/s2s_matrimony?schema=public",
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const ALL_COMMUNITIES = [
    {
        name: 'Nadar Matrimony',
        slug: 'nadar',
        description: 'Nadar Community Matrimony Portal',
        subCommunities: [
            'Karukkuvattai Nadar',
            'Maraimar Nadar',
            'Nattathi Nadar',
            'Kalla Nadar',
            'Servai Nadar',
            'Mel-Nattar Nadar',
            'Christian Nadar',
            'Hindu Nadar',
            'Nadar Sanar',
            'Gramani',
            'Evur Nadar',
            'General Nadar',
        ],
    },
    {
        name: 'Mudaliar Matrimony',
        slug: 'mudaliar',
        description: 'Mudaliar Community Matrimony Portal',
        subCommunities: [
            'Arcot Mudaliar',
            'Thondaimandalam Mudaliar',
            'Sengunthar / Kaikolar',
            'Agamudayar Mudaliar',
            'Vellala Mudaliar',
            'Saiva Mudaliar',
            'Isai Vellalar',
            'Palayakarar Mudaliar',
            'Nankudi Vellalar',
            'Shozia Mudaliar',
            'Thuluva Mudaliar',
            'Kondaikatti Mudaliar',
            'Nattar Mudaliar',
            'General Mudaliar',
        ],
    },
    {
        name: 'Gounder Matrimony',
        slug: 'gounder',
        description: 'Gounder Community Matrimony Portal',
        subCommunities: [
            'Kongu Vellala Gounder',
            'Vettuva Gounder',
            'Nattu Gounder',
            'Kurumba Gounder',
            'Vanniya Gounder',
            'Urali Gounder',
            'Padayachi Gounder',
            'Anuppa Gounder',
            'Kammasandra Gounder',
            'Punnan Gounder',
            'General Gounder',
        ],
    },
    {
        name: 'Pillai Matrimony',
        slug: 'pillai',
        description: 'Pillai Community Matrimony Portal',
        subCommunities: [
            'Saiva Pillai',
            'Karkathar Pillai',
            'Sozhia Pillai',
            'Seer Karuneegar',
            'Tirunelveli Saiva Pillai',
            'Veerakodi Vellalar',
            'Desikar Pillai',
            'Illathupillai',
            'Pandiya Vellalar',
            'Othuvar Pillai',
            'Agamudayar Pillai',
            'Kodikal Pillai',
            'Kanakku Pillai',
            'Nanjil Pillai',
            'General Pillai',
        ],
    },
    {
        name: 'Chettiar Matrimony',
        slug: 'chettiar',
        description: 'Chettiar Community Matrimony Portal',
        subCommunities: [
            'Nattukottai Chettiar (Nagarathar)',
            'Devanga Chettiar',
            'Elur Chettiar',
            'Vaniyar Chettiar',
            'Beri Chettiar',
            'Komati Chettiar',
            '24 Manai Telugu Chettiar',
            'Arya Vysya Chettiar',
            'Vallanattu Chettiar',
            'Saiva Chettiar',
            'Pannirandam Chettiar',
            'Kasukkara Chettiar',
            'Ayira Vysya Chettiar',
            'Padamasali Chettiar',
            'Agaram Chettiar',
            'General Chettiar',
        ],
    },
    {
        name: 'Vanniyar Matrimony',
        slug: 'vanniyar',
        description: 'Vanniyar Community Matrimony Portal',
        subCommunities: [
            'Vanniya Kula Kshatriyar',
            'Padayachi',
            'Gounder Vanniyar',
            'Naicker Vanniyar',
            'Palli',
            'Arcot Vanniyar',
            'General Vanniyar',
        ],
    },
    {
        name: 'Thevar / Mukkulathor Matrimony',
        slug: 'thevar',
        description: 'Thevar / Mukkulathor Community Matrimony Portal',
        subCommunities: [
            'Kallar (Ambalakarar)',
            'Kallar (Pramalai)',
            'Kallar (Esanattu)',
            'Maravar (Sembanattu)',
            'Maravar (Appanattu)',
            'Maravar (Kondayan)',
            'Agamudayar (Rajakula)',
            'Servai',
            'General Thevar',
        ],
    },
    {
        name: 'Naidu Matrimony',
        slug: 'naidu',
        description: 'Naidu Community Matrimony Portal',
        subCommunities: [
            'Kamma Naidu',
            'Balija Naidu',
            'Gavara Naidu',
            'Kapu Naidu',
            'Kambalathar Naidu',
            'Velama Naidu',
            'Muthuraja Naidu',
            'Ganjam Naidu',
            'Padma Naidu',
            'Rajus Naidu',
            'General Naidu',
        ],
    },
    {
        name: 'Iyer Matrimony',
        slug: 'iyer',
        description: 'Iyer Community Matrimony Portal',
        subCommunities: [
            'Vadama Iyer (Kankaneyar)',
            'Vadama Iyer (Vadamal)',
            'Brahacharanam Iyer',
            'Astasahasram Iyer',
            'Sholiya Iyer',
            'Kaniyalar Iyer',
            'Gurukkal',
            'Dikshitar',
            'General Iyer',
        ],
    },
    {
        name: 'Iyengar Matrimony',
        slug: 'iyengar',
        description: 'Iyengar Community Matrimony Portal',
        subCommunities: [
            'Vadakalai Iyengar',
            'Thenkalai Iyengar',
            'General Iyengar',
        ],
    },
    {
        name: 'Vellalar Matrimony',
        slug: 'vellalar',
        description: 'Vellalar Community Matrimony Portal',
        subCommunities: [
            'Thondaimandala Vellalar',
            'Saiva Vellalar',
            'Soliya Vellalar',
            'Kodikal Vellalar',
            'Karkathar Vellalar',
            'Chettia Vellalar',
            'Arcot Vellalar',
            'Nanjil Vellalar',
            'Veerakodi Vellalar',
            'Pandiya Vellalar',
            'Poduval Vellalar',
            'General Vellalar',
        ],
    },
    {
        name: 'Reddiyar Matrimony',
        slug: 'reddiyar',
        description: 'Reddiyar Community Matrimony Portal',
        subCommunities: [
            'Kanjam Reddiyar',
            'Kamma Reddiyar',
            'Reddiar Ganjam',
            'Pokanati Reddiyar',
            'Dommara Reddiyar',
            'Desoor Reddiyar',
            'General Reddiyar',
        ],
    },
    {
        name: 'Yadav / Konar Matrimony',
        slug: 'yadav-konar',
        description: 'Yadav / Konar Community Matrimony Portal',
        subCommunities: [
            'Tamil Konar',
            'Ayar / Idaiyar',
            'Vaduga Yadav',
            'Gollavaru',
            'Asthanara Yadav',
            'General Konar',
        ],
    },
    {
        name: 'Viswakarma Matrimony',
        slug: 'viswakarma',
        description: 'Viswakarma Community Matrimony Portal',
        subCommunities: [
            'Thattan (Goldsmith)',
            'Thatchan (Woodcraft)',
            'Kollar (Blacksmith)',
            'Kalthatchan (Stonemason)',
            'Kannan (Brass/Copper)',
            'Silpi',
            'Kammalar',
            'General Viswakarma',
        ],
    },
    {
        name: 'Sourashtra Matrimony',
        slug: 'sourashtra',
        description: 'Sourashtra Community Matrimony Portal',
        subCommunities: [
            'Palkar Sourashtra',
            'Madurai Sourashtra',
            'Salem Sourashtra',
            'Tanjore Sourashtra',
            'General Sourashtra',
        ],
    },
    {
        name: 'Nair Matrimony',
        slug: 'nair',
        description: 'Nair Community Matrimony Portal',
        subCommunities: [
            'Kiryathil Nair',
            'Illathu Nair',
            'Menon Nair',
            'Vaniya Nair',
            'Vilakkithala Nair',
            'Veluthedathu Nair',
            'General Nair',
        ],
    },
    {
        name: 'Menon Matrimony',
        slug: 'menon',
        description: 'Menon Community Matrimony Portal',
        subCommunities: [
            'General Menon',
            'Kurup Menon',
            'Kaimal Menon',
        ],
    },
    {
        name: 'Christian Matrimony',
        slug: 'christian',
        description: 'Christian Matrimony Portal',
        subCommunities: [
            'Roman Catholic (RC)',
            'Church of South India (CSI)',
            'Pentecostal',
            'Protestant',
            'Mar Thoma',
            'Syrian Catholic',
            'Jacobite',
            'Evangelist',
            'Knanaya',
            'Seventh Day Adventist',
            'Orthodox',
            'Church of God',
            'Salvation Army',
            'General Christian',
        ],
    },
    {
        name: 'Muslim Matrimony',
        slug: 'muslim',
        description: 'Muslim Matrimony Portal',
        subCommunities: [
            'Tamil Muslim / Marakkayar',
            'Lebbai',
            'Rowther',
            'Dekkani Muslim',
            'Syed',
            'Pathan',
            'Sheikh',
            'Hanafi',
            'Shafi',
            'Sunni',
            'Shia',
            'General Muslim',
        ],
    },
    {
        name: 'Devendra Kula Vellalar Matrimony',
        slug: 'devendra-kula-vellalar',
        description: 'Devendra Kula Vellalar Community Matrimony Portal',
        subCommunities: [
            'Kudumbar',
            'Pannadi',
            'Kadaiyar',
            'Vathiriyar',
            'Pallan',
            'General Devendra Kula Vellalar',
        ],
    },
    {
        name: 'Adidravidar Matrimony',
        slug: 'adidravidar',
        description: 'Adidravidar Community Matrimony Portal',
        subCommunities: [
            'Paraiyar',
            'Sambavar',
            'Valluvan',
            'General Adidravidar',
        ],
    },
    {
        name: 'Arunthathiyar Matrimony',
        slug: 'arunthathiyar',
        description: 'Arunthathiyar Community Matrimony Portal',
        subCommunities: [
            'Chakkiliyar',
            'Madiga',
            'Pagadai',
            'General Arunthathiyar',
        ],
    },
    {
        name: 'Muthuraja / Mutharaiyar Matrimony',
        slug: 'muthuraja',
        description: 'Muthuraja / Mutharaiyar Community Matrimony Portal',
        subCommunities: [
            'Ambalakarar',
            'Servai Mutharaiyar',
            'Valaiyar',
            'Palayakarar',
            'General Muthuraja',
        ],
    },
    {
        name: 'Naicker Matrimony',
        slug: 'naicker',
        description: 'Naicker Community Matrimony Portal',
        subCommunities: [
            'Kambalathu Naicker',
            'Thottiya Naicker',
            'Raja Kambalam',
            'Vettakarar',
            'General Naicker',
        ],
    },
    {
        name: 'Boyar / Uppara Matrimony',
        slug: 'boyar-uppara',
        description: 'Boyar / Uppara Community Matrimony Portal',
        subCommunities: [
            'Boyar',
            'Uppara',
            'Gazula Boyar',
            'General Boyar',
        ],
    },
    {
        name: 'Parkavakulam Matrimony',
        slug: 'parkavakulam',
        description: 'Parkavakulam (Udayar / Moopanar / Nainar) Matrimony Portal',
        subCommunities: [
            'Nathaman Udayar',
            'Maliyaman Udayar',
            'Sudurman Udayar',
            'Moopanar',
            'Nainar',
            'General Parkavakulam',
        ],
    },
    {
        name: 'Sengunthar Matrimony',
        slug: 'sengunthar',
        description: 'Sengunthar / Kaikolar Community Matrimony Portal',
        subCommunities: [
            'Kaikolar',
            'Senguntha Mudaliar',
            'General Sengunthar',
        ],
    },
    {
        name: 'Kamma Matrimony',
        slug: 'kamma',
        description: 'Kamma Community Matrimony Portal',
        subCommunities: [
            'Kamma Naidu',
            'Choudhary',
            'General Kamma',
        ],
    },
    {
        name: 'Kapu Matrimony',
        slug: 'kapu',
        description: 'Kapu Community Matrimony Portal',
        subCommunities: [
            'Telaga',
            'Balija Kapu',
            'Turpu Kapu',
            'Munnuru Kapu',
            'General Kapu',
        ],
    },
    {
        name: 'Ezhava / Thiyya Matrimony',
        slug: 'ezhava-thiyya',
        description: 'Ezhava / Thiyya Community Matrimony Portal',
        subCommunities: [
            'Thiyya',
            'Ezhava',
            'Billava',
            'General Ezhava',
        ],
    },
    {
        name: 'Brahmin - Other Matrimony',
        slug: 'brahmin-other',
        description: 'Brahmin (Other Sub-castes) Matrimony Portal',
        subCommunities: [
            'Madhwa Brahmin',
            'Telugu Brahmin (Niyogi)',
            'Telugu Brahmin (Vaidiki)',
            'Kannada Brahmin (Shivalli)',
            'Kannada Brahmin (Havyaka)',
            'Maratha Brahmin (Deshastha)',
            'Maratha Brahmin (Chitpavan)',
            'Nagar Brahmin',
            'Gaur Brahmin',
            'Saraswat Brahmin',
            'General Brahmin',
        ],
    },
    {
        name: 'Maratha / Kshatriya Matrimony',
        slug: 'maratha-kshatriya',
        description: 'Maratha / Kshatriya Matrimony Portal',
        subCommunities: [
            'Maratha',
            'Rajput',
            'Kshatriya',
            'Arya Maratha',
            'General Maratha',
        ],
    },
    {
        name: 'Jain Matrimony',
        slug: 'jain',
        description: 'Jain Matrimony Portal',
        subCommunities: [
            'Digambar Jain',
            'Shwetambar Jain',
            'Porwal Jain',
            'Oswal Jain',
            'General Jain',
        ],
    },
    {
        name: 'Sikh Matrimony',
        slug: 'sikh',
        description: 'Sikh Matrimony Portal',
        subCommunities: [
            'Jat Sikh',
            'Khatri Sikh',
            'Ramgharia Sikh',
            'Arora Sikh',
            'General Sikh',
        ],
    },
    {
        name: 'Weaver / Saliyar Matrimony',
        slug: 'weaver-saliyar',
        description: 'Weaver / Saliyar Community Matrimony Portal',
        subCommunities: [
            'Padmasali',
            'Devanga',
            'Pattusali',
            'Adaviyar',
            'Saliyar',
            'General Weaver',
        ],
    },
    {
        name: 'Fisherfolk / Mukkuvar Matrimony',
        slug: 'fisherfolk',
        description: 'Fisherfolk / Mukkuvar / Meenavar Matrimony Portal',
        subCommunities: [
            'Meenavar',
            'Parvatha Rajakulam',
            'Mukkuvar',
            'Pattinavar',
            'Valaiyar',
            'General Fisherfolk',
        ],
    },
    {
        name: 'Vannar / Dhobi Matrimony',
        slug: 'vannar-dhobi',
        description: 'Vannar / Dhobi / Rajaka Community Matrimony Portal',
        subCommunities: [
            'Vannar',
            'Dhobi',
            'Agasa',
            'Veluthedathu',
            'General Vannar',
        ],
    },
    {
        name: 'Maruthuvar Matrimony',
        slug: 'maruthuvar',
        description: 'Maruthuvar / Navithar Community Matrimony Portal',
        subCommunities: [
            'Maruthuvar',
            'Velakkathala',
            'Ambattan',
            'Mangala',
            'General Maruthuvar',
        ],
    },
    {
        name: 'Kulalar / Potter Matrimony',
        slug: 'kulalar-potter',
        description: 'Kulalar / Velar / Kuyavar Matrimony Portal',
        subCommunities: [
            'Kulalar',
            'Velar',
            'Kuyavar',
            'General Kulalar',
        ],
    },
    {
        name: 'Badaga Matrimony',
        slug: 'badaga',
        description: 'Badaga Nilgiris Community Matrimony Portal',
        subCommunities: [
            'Badaga',
            'General Badaga',
        ],
    },
    {
        name: 'Tribal / Indigenous Matrimony',
        slug: 'tribal',
        description: 'Tribal / Indigenous Community Matrimony Portal',
        subCommunities: [
            'Kota',
            'Toda',
            'Kurumba',
            'Irula',
            'Kanikaran',
            'General Tribal',
        ],
    },
    {
        name: 'Lingayat Matrimony',
        slug: 'lingayat',
        description: 'Lingayat / Veerashaiva Community Matrimony Portal',
        subCommunities: [
            'Veerashaiva',
            'Lingayat',
            'General Lingayat',
        ],
    },
    {
        name: 'Inter-Caste / Caste No Bar Matrimony',
        slug: 'caste-no-bar',
        description: 'Inter-Caste & Open Matrimony Portal',
        subCommunities: [
            'Inter-Caste',
            'Caste No Bar',
        ],
    },
];
async function main() {
    console.log('🌱 Starting Exhaustive Database Seeding for S2S Matrimony...');
    const superAdminRole = await prisma.role.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: { displayName: 'Super Admin', description: 'Global platform owner' },
        create: { name: 'SUPER_ADMIN', displayName: 'Super Admin', description: 'Global platform owner', isSystem: true },
    });
    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: { displayName: 'Admin', description: 'Platform Administrator' },
        create: { name: 'ADMIN', displayName: 'Admin', description: 'Platform Administrator', isSystem: true },
    });
    const moderatorRole = await prisma.role.upsert({
        where: { name: 'MODERATOR' },
        update: { displayName: 'Moderator', description: 'Photo & Verification Moderator' },
        create: { name: 'MODERATOR', displayName: 'Moderator', description: 'Photo & Verification Moderator', isSystem: true },
    });
    const supportRole = await prisma.role.upsert({
        where: { name: 'SUPPORT_AGENT' },
        update: { displayName: 'Support Agent', description: 'Customer Support Representative' },
        create: { name: 'SUPPORT_AGENT', displayName: 'Support Agent', description: 'Customer Support Representative', isSystem: true },
    });
    const memberRole = await prisma.role.upsert({
        where: { name: 'MEMBER' },
        update: { displayName: 'Member', description: 'Standard Registered User' },
        create: { name: 'MEMBER', displayName: 'Member', description: 'Standard Registered User', isSystem: true },
    });
    const modulesList = [
        { slug: 'users', name: 'User Management', path: '/admin/users', icon: 'Users', sortOrder: 1 },
        { slug: 'profiles', name: 'Profile Moderation', path: '/admin/profiles', icon: 'UserCheck', sortOrder: 2 },
        { slug: 'plans', name: 'Membership Plans', path: '/admin/plans', icon: 'Crown', sortOrder: 3 },
        { slug: 'payments', name: 'Finance & Payments', path: '/admin/payments', icon: 'CreditCard', sortOrder: 4 },
        { slug: 'ai_biodata', name: 'AI Biodata Engine', path: '/admin/ai-biodata', icon: 'Sparkles', sortOrder: 5 },
        { slug: 'banners', name: 'Banners & Marketing', path: '/admin/banners', icon: 'Image', sortOrder: 6 },
        { slug: 'blogs', name: 'Blog & Articles CMS', path: '/admin/blogs', icon: 'FileText', sortOrder: 7 },
        { slug: 'stories', name: 'Success Stories', path: '/admin/success-stories', icon: 'Heart', sortOrder: 8 },
        { slug: 'reports', name: 'Safety & Reports', path: '/admin/reports', icon: 'AlertTriangle', sortOrder: 9 },
        { slug: 'communities', name: 'Communities Portal', path: '/super-admin/communities', icon: 'Globe', sortOrder: 10 },
        { slug: 'admins', name: 'Admins & Staff Access', path: '/super-admin/admins', icon: 'Shield', sortOrder: 11 },
        { slug: 'settings', name: 'Global Settings', path: '/super-admin/settings', icon: 'Settings', sortOrder: 12 },
    ];
    const actionsList = [
        { slug: 'read', name: 'View / Read', description: 'View and read data' },
        { slug: 'write', name: 'Create / Edit', description: 'Create and edit data' },
        { slug: 'delete', name: 'Delete / Remove', description: 'Permanently remove data' },
        { slug: 'verify', name: 'Approve / Verify', description: 'Approve or verify data' },
        { slug: 'ban', name: 'Ban / Suspend', description: 'Suspend or ban users' },
        { slug: 'publish', name: 'Publish', description: 'Publish CMS content' },
        { slug: 'manage', name: 'Full Control', description: 'Manage full configuration' },
    ];
    const moduleRecords = {};
    for (const mod of modulesList) {
        moduleRecords[mod.slug] = await prisma.module.upsert({
            where: { slug: mod.slug },
            update: mod,
            create: mod,
        });
    }
    const actionRecords = {};
    for (const act of actionsList) {
        actionRecords[act.slug] = await prisma.action.upsert({
            where: { slug: act.slug },
            update: act,
            create: act,
        });
    }
    const permissionsList = [
        { name: 'users:read', displayName: 'View Users', group: 'Users', description: 'View user accounts', moduleSlug: 'users', actionSlug: 'read' },
        { name: 'users:write', displayName: 'Edit Users', group: 'Users', description: 'Modify user details', moduleSlug: 'users', actionSlug: 'write' },
        { name: 'users:ban', displayName: 'Ban Users', group: 'Users', description: 'Suspend or ban user accounts', moduleSlug: 'users', actionSlug: 'ban' },
        { name: 'users:verify', displayName: 'Verify Users', group: 'Users', description: 'Manually verify user accounts', moduleSlug: 'users', actionSlug: 'verify' },
        { name: 'profiles:read', displayName: 'View Profiles', group: 'Profiles', description: 'View profile details', moduleSlug: 'profiles', actionSlug: 'read' },
        { name: 'profiles:write', displayName: 'Edit Profiles', group: 'Profiles', description: 'Edit member profiles', moduleSlug: 'profiles', actionSlug: 'write' },
        { name: 'profiles:verify', displayName: 'Approve Profile Verification', group: 'Profiles', description: 'Approve ID verification', moduleSlug: 'profiles', actionSlug: 'verify' },
        { name: 'profiles:moderate', displayName: 'Moderate Content', group: 'Profiles', description: 'Approve or reject photos', moduleSlug: 'profiles', actionSlug: 'verify' },
        { name: 'profiles:delete', displayName: 'Delete Profiles', group: 'Profiles', description: 'Permanently remove profiles', moduleSlug: 'profiles', actionSlug: 'delete' },
        { name: 'payments:view', displayName: 'View Financials', group: 'Payments', description: 'View revenue and transactions', moduleSlug: 'payments', actionSlug: 'read' },
        { name: 'payments:refund', displayName: 'Process Refunds', group: 'Payments', description: 'Issue customer refunds', moduleSlug: 'payments', actionSlug: 'write' },
        { name: 'payments:manage', displayName: 'Manage Plans', group: 'Payments', description: 'Manage pricing & packages', moduleSlug: 'payments', actionSlug: 'manage' },
        { name: 'communities:read', displayName: 'View Communities', group: 'Communities', description: 'View community portals', moduleSlug: 'communities', actionSlug: 'read' },
        { name: 'communities:write', displayName: 'Edit Communities', group: 'Communities', description: 'Add/edit communities & sub-castes', moduleSlug: 'communities', actionSlug: 'write' },
        { name: 'communities:delete', displayName: 'Delete Communities', group: 'Communities', description: 'Remove community portals', moduleSlug: 'communities', actionSlug: 'delete' },
        { name: 'blogs:read', displayName: 'View Articles', group: 'Content', description: 'Read blog posts & CMS', moduleSlug: 'blogs', actionSlug: 'read' },
        { name: 'blogs:write', displayName: 'Write Articles', group: 'Content', description: 'Create & edit blog posts', moduleSlug: 'blogs', actionSlug: 'write' },
        { name: 'blogs:publish', displayName: 'Publish Articles', group: 'Content', description: 'Publish CMS content', moduleSlug: 'blogs', actionSlug: 'publish' },
        { name: 'blogs:delete', displayName: 'Delete Articles', group: 'Content', description: 'Remove blog posts', moduleSlug: 'blogs', actionSlug: 'delete' },
        { name: 'reports:view', displayName: 'View Reports', group: 'Reports', description: 'View user safety reports', moduleSlug: 'reports', actionSlug: 'read' },
        { name: 'reports:handle', displayName: 'Resolve Reports', group: 'Reports', description: 'Take action on reported profiles', moduleSlug: 'reports', actionSlug: 'write' },
        { name: 'reports:delete', displayName: 'Dismiss Reports', group: 'Reports', description: 'Dismiss invalid reports', moduleSlug: 'reports', actionSlug: 'delete' },
        { name: 'settings:read', displayName: 'View Settings', group: 'Settings', description: 'View system configuration', moduleSlug: 'settings', actionSlug: 'read' },
        { name: 'settings:manage', displayName: 'Manage Settings', group: 'Settings', description: 'Configure global platform settings', moduleSlug: 'settings', actionSlug: 'manage' },
        { name: 'admins:manage', displayName: 'Manage Staff', group: 'Settings', description: 'Manage staff roles & RBAC permissions', moduleSlug: 'admins', actionSlug: 'manage' },
        { name: 'global:settings', displayName: 'Super Admin Controls', group: 'Settings', description: 'Access super admin system tools', moduleSlug: 'settings', actionSlug: 'manage' },
    ];
    const permissionRecords = {};
    for (const perm of permissionsList) {
        const modId = moduleRecords[perm.moduleSlug]?.id || null;
        const actId = actionRecords[perm.actionSlug]?.id || null;
        const p = await prisma.permission.upsert({
            where: { name: perm.name },
            update: {
                name: perm.name,
                displayName: perm.displayName,
                group: perm.group,
                description: perm.description,
                moduleId: modId,
                actionId: actId,
            },
            create: {
                name: perm.name,
                displayName: perm.displayName,
                group: perm.group,
                description: perm.description,
                moduleId: modId,
                actionId: actId,
            },
        });
        permissionRecords[perm.name] = p;
    }
    const assignPermissions = async (roleId, permKeys) => {
        for (const key of permKeys) {
            const perm = permissionRecords[key];
            if (perm) {
                await prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId, permissionId: perm.id } },
                    update: {},
                    create: { roleId, permissionId: perm.id },
                });
            }
        }
    };
    await assignPermissions(superAdminRole.id, Object.keys(permissionRecords));
    await assignPermissions(adminRole.id, [
        'users:read', 'users:write', 'users:verify',
        'profiles:read', 'profiles:write', 'profiles:verify', 'profiles:moderate',
        'payments:view', 'communities:read', 'communities:write',
        'blogs:read', 'blogs:write', 'blogs:publish',
        'reports:view', 'reports:handle', 'settings:read',
    ]);
    await assignPermissions(moderatorRole.id, [
        'profiles:read', 'profiles:verify', 'profiles:moderate', 'reports:view', 'reports:handle',
    ]);
    await assignPermissions(supportRole.id, [
        'users:read', 'profiles:read', 'reports:view', 'payments:view',
    ]);
    await assignPermissions(memberRole.id, ['profiles:read']);
    console.log('✅ Roles & Exhaustive RBAC Permissions seeded');
    const plans = [
        {
            name: 'Free Plan',
            tier: client_1.MembershipTier.FREE,
            price: 0,
            durationMonths: 12,
            features: ['5 Daily Interests', 'Basic Search Filters', '5 Profile Views / day'],
            maxInterests: 5,
            maxContacts: 0,
            hasChat: false,
            hasAiMatch: false,
            displayOrder: 1,
        },
        {
            name: 'Silver Plan',
            tier: client_1.MembershipTier.SILVER,
            price: 599,
            durationMonths: 1,
            features: ['50 Daily Interests', 'Advanced Search Filters', '50 Contact Views', 'Direct Chat'],
            maxInterests: 50,
            maxContacts: 50,
            hasChat: true,
            hasAiMatch: false,
            displayOrder: 2,
        },
        {
            name: 'Elite Plan (Popular)',
            tier: client_1.MembershipTier.ELITE,
            price: 999,
            durationMonths: 3,
            features: ['Unlimited Interests', 'Advanced Search & Dosha Filters', '100 Contact Unlocks', 'Direct Chat', 'Priority Profile Ranking', 'AI Match Score'],
            maxInterests: -1,
            maxContacts: 100,
            hasChat: true,
            hasAiMatch: true,
            isPopular: true,
            displayOrder: 3,
        },
        {
            name: 'Platinum Plan',
            tier: client_1.MembershipTier.PLATINUM,
            price: 1799,
            durationMonths: 6,
            features: ['Everything in Elite', 'Unlimited Contact Unlocks', 'Dedicated Match Manager', 'Horoscope Matching Report', 'Video Profile Highlight'],
            maxInterests: -1,
            maxContacts: -1,
            hasChat: true,
            hasAiMatch: true,
            hasVideoProfile: true,
            displayOrder: 4,
        },
    ];
    for (const plan of plans) {
        await prisma.membershipPlan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
    }
    console.log('✅ Membership Plans seeded');
    const hindu = await prisma.religion.upsert({
        where: { name: 'Hindu' },
        update: {},
        create: { name: 'Hindu' },
    });
    const christian = await prisma.religion.upsert({
        where: { name: 'Christian' },
        update: {},
        create: { name: 'Christian' },
    });
    const muslim = await prisma.religion.upsert({
        where: { name: 'Muslim' },
        update: {},
        create: { name: 'Muslim' },
    });
    const jain = await prisma.religion.upsert({
        where: { name: 'Jain' },
        update: {},
        create: { name: 'Jain' },
    });
    const sikh = await prisma.religion.upsert({
        where: { name: 'Sikh' },
        update: {},
        create: { name: 'Sikh' },
    });
    console.log('✅ Religions seeded');
    let communityCount = 0;
    let subCommunityCount = 0;
    for (const comm of ALL_COMMUNITIES) {
        const parentCommunity = await prisma.community.upsert({
            where: { slug: comm.slug },
            update: { name: comm.name, description: comm.description },
            create: { name: comm.name, slug: comm.slug, description: comm.description },
        });
        communityCount++;
        const religionId = comm.slug === 'christian' ? christian.id : comm.slug === 'muslim' ? muslim.id : comm.slug === 'jain' ? jain.id : comm.slug === 'sikh' ? sikh.id : hindu.id;
        const casteName = comm.name.replace(' Matrimony', '');
        let casteRecord = await prisma.caste.findFirst({ where: { name: casteName } });
        if (!casteRecord) {
            casteRecord = await prisma.caste.create({
                data: { name: casteName, religionId, communityId: parentCommunity.id },
            });
        }
        for (const rawSubName of comm.subCommunities) {
            const subName = `${rawSubName} (${casteName})`;
            const subSlug = `${comm.slug}-${rawSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            const existingComm = await prisma.community.findFirst({ where: { slug: subSlug } });
            if (existingComm) {
                await prisma.community.update({
                    where: { id: existingComm.id },
                    data: { name: subName, parentId: parentCommunity.id },
                });
            }
            else {
                await prisma.community.create({
                    data: { name: subName, slug: subSlug, parentId: parentCommunity.id, description: `${rawSubName} Sub-Community` },
                });
            }
            subCommunityCount++;
            if (casteRecord?.id) {
                const existingSubCaste = await prisma.subCaste.findFirst({
                    where: { name: rawSubName, casteId: casteRecord.id },
                });
                if (!existingSubCaste) {
                    await prisma.subCaste.create({
                        data: { name: rawSubName, casteId: casteRecord.id },
                    });
                }
            }
        }
    }
    console.log(`✅ Seeded ${communityCount} Main Communities and ${subCommunityCount} Sub-Communities / Sub-Castes!`);
    const passwordHash = await bcrypt.hash('admin123', 10);
    const superAdminUser = await prisma.user.upsert({
        where: { email: 'superadmin@s2smatrimony.com' },
        update: {},
        create: {
            email: 'superadmin@s2smatrimony.com',
            phone: '+919999999999',
            passwordHash,
            isEmailVerified: true,
            isPhoneVerified: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: superAdminUser.id, roleId: superAdminRole.id } },
        update: {},
        create: { userId: superAdminUser.id, roleId: superAdminRole.id },
    });
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@s2smatrimony.com' },
        update: {},
        create: {
            email: 'admin@s2smatrimony.com',
            phone: '+918888888888',
            passwordHash,
            isEmailVerified: true,
            isPhoneVerified: true,
        },
    });
    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id },
    });
    console.log('✅ Super Admin & Admin users seeded');
    console.log('🎉 Clean Database Seeding Complete! (Ready for real user registrations)');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map