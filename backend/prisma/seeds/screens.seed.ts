import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCREENS = [
  { name: "Landing Page",     slug: "landing",          route: "/",                         icon: "Home",            sortOrder: 1  },
  { name: "About",            slug: "about",            route: "/about",                    icon: "Info",            sortOrder: 2  },
  { name: "Community",        slug: "community",        route: "/community",                icon: "Users",           sortOrder: 3  },
  { name: "Contact",          slug: "contact",          route: "/contact",                  icon: "Phone",           sortOrder: 4  },
  { name: "Membership Plans", slug: "membership",       route: "/membership",               icon: "CreditCard",      sortOrder: 5  },
  { name: "Blog List",        slug: "blog-list",        route: "/blogs",                    icon: "BookOpen",        sortOrder: 6  },
  { name: "Blog Detail",      slug: "blog-detail",      route: "/blogs/:slug",              icon: "FileText",        sortOrder: 7  },
  { name: "Success Stories",  slug: "success-stories",  route: "/success-stories",          icon: "Heart",           sortOrder: 8  },
  { name: "Not Found",        slug: "not-found",        route: "/404",                      icon: "AlertCircle",     sortOrder: 9  },
  { name: "Unauthorized",     slug: "unauthorized",     route: "/unauthorized",             icon: "Lock",            sortOrder: 10 },
  { name: "Login",            slug: "login",            route: "/login",                    icon: "LogIn",           sortOrder: 11 },
  { name: "Register",         slug: "register",         route: "/register",                 icon: "UserPlus",        sortOrder: 12 },
  { name: "OTP Verify",       slug: "otp-verify",       route: "/verify-otp",               icon: "Shield",          sortOrder: 13 },
  { name: "Forgot Password",  slug: "forgot-password",  route: "/forgot-password",          icon: "Key",             sortOrder: 14 },
  { name: "Reset Password",   slug: "reset-password",   route: "/reset-password",           icon: "RefreshCw",       sortOrder: 15 },
  { name: "Dashboard",           slug: "member-dashboard",    route: "/member/dashboard",          icon: "LayoutDashboard", sortOrder: 20 },
  { name: "Profile View",        slug: "profile-view",         route: "/member/profile",            icon: "User",            sortOrder: 21 },
  { name: "Profile Edit",        slug: "profile-edit",         route: "/member/profile/edit",       icon: "Edit",            sortOrder: 22 },
  { name: "Profile Complete",    slug: "profile-complete",     route: "/member/profile/complete",   icon: "CheckCircle",     sortOrder: 23 },
  { name: "Biodata Entry",       slug: "biodata-entry",        route: "/member/biodata",            icon: "FileText",        sortOrder: 24 },
  { name: "Profile Viewers",     slug: "profile-viewers",      route: "/member/profile/viewers",    icon: "Eye",             sortOrder: 25 },
  { name: "Search",              slug: "search",               route: "/member/search",             icon: "Search",          sortOrder: 26 },
  { name: "Matches",             slug: "matches",              route: "/member/matches",            icon: "Users",           sortOrder: 27 },
  { name: "Messages",            slug: "messages",             route: "/member/messages",           icon: "MessageCircle",   sortOrder: 28 },
  { name: "Chat",                slug: "chat",                 route: "/member/chat/:id",           icon: "MessageSquare",   sortOrder: 29 },
  { name: "Interests",           slug: "interests",            route: "/member/interests",          icon: "Heart",           sortOrder: 30 },
  { name: "Premium Plans",       slug: "premium",              route: "/member/premium",            icon: "Star",            sortOrder: 31 },
  { name: "Payment Success",     slug: "payment-success",      route: "/member/payment/success",    icon: "CheckCircle",     sortOrder: 32 },
  { name: "Payment History",     slug: "payment-history",      route: "/member/payments",           icon: "Receipt",         sortOrder: 33 },
  { name: "Admin Dashboard",       slug: "admin-dashboard",       route: "/admin",                   icon: "LayoutDashboard", sortOrder: 40 },
  { name: "Admin Users",           slug: "admin-users",            route: "/admin/users",             icon: "Users",           sortOrder: 41 },
  { name: "Admin Profiles",        slug: "admin-profiles",         route: "/admin/profiles",          icon: "User",            sortOrder: 42 },
  { name: "Admin Biodata List",    slug: "admin-biodata",          route: "/admin/biodata",           icon: "FileText",        sortOrder: 43 },
  { name: "Admin AI Biodata",      slug: "admin-ai-biodata",       route: "/admin/ai-biodata",        icon: "Cpu",             sortOrder: 44 },
  { name: "Admin Plans",           slug: "admin-plans",            route: "/admin/plans",             icon: "CreditCard",      sortOrder: 45 },
  { name: "Admin Payments",        slug: "admin-payments",         route: "/admin/payments",          icon: "DollarSign",      sortOrder: 46 },
  { name: "Admin Reports",         slug: "admin-reports",          route: "/admin/reports",           icon: "AlertTriangle",   sortOrder: 47 },
  { name: "Admin Banners",         slug: "admin-banners",          route: "/admin/banners",           icon: "Image",           sortOrder: 48 },
  { name: "Admin Blogs",           slug: "admin-blogs",            route: "/admin/blogs",             icon: "BookOpen",        sortOrder: 49 },
  { name: "Admin Communities",     slug: "admin-communities",      route: "/admin/communities",       icon: "Globe",           sortOrder: 50 },
  { name: "Admin Success Stories", slug: "admin-success-stories",  route: "/admin/success-stories",   icon: "Heart",           sortOrder: 51 },
  { name: "Admin Testimonials",    slug: "admin-testimonials",     route: "/admin/testimonials",      icon: "MessageSquare",   sortOrder: 52 },
  { name: "Admin FAQ",             slug: "admin-faq",              route: "/admin/faq",               icon: "HelpCircle",      sortOrder: 53 },
  { name: "Admin Static Pages",    slug: "admin-static-pages",     route: "/admin/static-pages",      icon: "FileText",        sortOrder: 54 },
  { name: "Admin Logs",            slug: "admin-logs",             route: "/admin/logs",              icon: "Activity",        sortOrder: 55 },
  { name: "Admin Settings",        slug: "admin-settings",         route: "/admin/settings",          icon: "Settings",        sortOrder: 56 },
  { name: "Super Admin Dashboard",       slug: "super-admin-dashboard",       route: "/super-admin",                  icon: "Crown",      sortOrder: 60 },
  { name: "Super Admin Admins",          slug: "super-admin-admins",           route: "/super-admin/admins",           icon: "UserCog",    sortOrder: 61 },
  { name: "Super Admin Users",           slug: "super-admin-users",            route: "/super-admin/users",            icon: "Users",      sortOrder: 62 },
  { name: "Super Admin Communities",     slug: "super-admin-communities",      route: "/super-admin/communities",      icon: "Globe",      sortOrder: 63 },
  { name: "Super Admin Plans",           slug: "super-admin-plans",            route: "/super-admin/plans",            icon: "CreditCard", sortOrder: 64 },
  { name: "Super Admin Revenue",         slug: "super-admin-revenue",          route: "/super-admin/revenue",          icon: "TrendingUp", sortOrder: 65 },
  { name: "Super Admin System Settings", slug: "super-admin-system-settings",  route: "/super-admin/system-settings",  icon: "Server",     sortOrder: 66 },
  { name: "Super Admin Audit Logs",      slug: "super-admin-audit-logs",       route: "/super-admin/audit-logs",       icon: "Activity",   sortOrder: 67 },
  { name: "Super Admin Settings",        slug: "super-admin-settings",         route: "/super-admin/settings",         icon: "Settings",   sortOrder: 68 },
  { name: "Blank Biodata Print", slug: "print-biodata", route: "/print/biodata", icon: "Printer", sortOrder: 70 },
];

const ROLES = [
  { name: "SUPER_ADMIN",   displayName: "Super Admin",   description: "Full platform access",        isSystem: true },
  { name: "ADMIN",         displayName: "Admin",         description: "Community admin access",      isSystem: true },
  { name: "MODERATOR",     displayName: "Moderator",     description: "Content moderation access",  isSystem: true },
  { name: "SUPPORT_AGENT", displayName: "Support Agent", description: "Customer support access",    isSystem: true },
  { name: "MEMBER",        displayName: "Member",        description: "Regular member access",      isSystem: true },
];

const ROLE_SCREEN_ACCESS: Record<string, string[]> = {
  MEMBER: [
    "member-dashboard","profile-view","profile-edit","profile-complete",
    "biodata-entry","profile-viewers","search","matches",
    "messages","chat","interests","premium","payment-success","payment-history",
  ],
  SUPPORT_AGENT: ["admin-dashboard","admin-users","admin-profiles","admin-reports","admin-logs"],
  MODERATOR: [
    "admin-dashboard","admin-users","admin-profiles","admin-biodata","admin-ai-biodata",
    "admin-reports","admin-banners","admin-blogs","admin-communities","admin-success-stories",
    "admin-testimonials","admin-faq","admin-static-pages","admin-logs",
  ],
  ADMIN: [
    "admin-dashboard","admin-users","admin-profiles","admin-biodata","admin-ai-biodata",
    "admin-plans","admin-payments","admin-reports","admin-banners","admin-blogs",
    "admin-communities","admin-success-stories","admin-testimonials","admin-faq",
    "admin-static-pages","admin-logs","admin-settings",
  ],
  SUPER_ADMIN: [],
};

async function main() {
  console.log("Seeding screens...");
  for (const s of SCREENS) {
    await prisma.screen.upsert({ where: { slug: s.slug }, create: s, update: {} });
  }
  console.log(`${SCREENS.length} screens seeded`);

  console.log("Seeding roles...");
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { name: r.name }, create: r, update: {} });
  }
  console.log(`${ROLES.length} roles seeded`);

  console.log("Assigning screen permissions...");
  for (const [roleName, screenSlugs] of Object.entries(ROLE_SCREEN_ACCESS)) {
    if (!screenSlugs.length) continue;
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    const permName = `${roleName.toLowerCase()}:screen-access`;
    const perm = await prisma.permission.upsert({
      where: { name: permName },
      create: { name: permName, displayName: `${roleName} Screen Access`, group: "Screen Access" },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      create: { roleId: role.id, permissionId: perm.id },
      update: {},
    });
    for (const slug of screenSlugs) {
      const screen = await prisma.screen.findUnique({ where: { slug } });
      if (!screen) { console.warn(`  Screen not found: ${slug}`); continue; }
      await prisma.screenPermission.upsert({
        where: { screenId_permissionId: { screenId: screen.id, permissionId: perm.id } },
        create: { screenId: screen.id, permissionId: perm.id },
        update: {},
      });
    }
    console.log(`  ${roleName}: ${screenSlugs.length} screens`);
  }
  console.log("Seed complete!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
