import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useSettingsStore } from './store/settings.store';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import MemberLayout from './components/layout/MemberLayout';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileCompletionGuard from './components/auth/ProfileCompletionGuard';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import CommunityPage from './pages/public/CommunityPage';
import SuccessStoriesPage from './pages/public/SuccessStoriesPage';
import MembershipPage from './pages/public/MembershipPage';
import BlogListPage from './pages/public/BlogListPage';
import BlogDetailPage from './pages/public/BlogDetailPage';
import ContactPage from './pages/public/ContactPage';
import AboutPage from './pages/public/AboutPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpVerifyPage from './pages/auth/OtpVerifyPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Member Pages
import DashboardPage from './pages/member/dashboard/DashboardPage';
import ProfileViewPage from './pages/member/profile/ProfileViewPage';
import ProfileEditPage from './pages/member/profile/ProfileEditPage';
import ProfileCompletePage from './pages/member/profile/ProfileCompletePage';
import BiodataEntryPage from './pages/member/profile/BiodataEntryPage';
import SearchPage from './pages/member/search/SearchPage';
import MatchesPage from './pages/member/search/MatchesPage';
import MessagesPage from './pages/member/messages/MessagesPage';
import ChatPage from './pages/member/messages/ChatPage';
import InterestsPage from './pages/member/messages/InterestsPage';
import PremiumPage from './pages/member/premium/PremiumPage';
import PaymentSuccessPage from './pages/member/premium/PaymentSuccessPage';
import ProfileViewersPage from './pages/member/profile/ProfileViewersPage';
import PaymentHistoryPage from './pages/member/payments/PaymentHistoryPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProfiles from './pages/admin/AdminProfiles';
import AdminCommunities from './pages/admin/AdminCommunities';
import AdminPlans from './pages/admin/AdminPlans';
import AdminPayments from './pages/admin/AdminPayments';
import AdminBanners from './pages/admin/AdminBanners';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminSuccessStories from './pages/admin/AdminSuccessStories';
import AdminReports from './pages/admin/AdminReports';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAiBiodata from './pages/admin/AdminAiBiodata';
import AdminFaq from './pages/admin/AdminFaq';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminStaticPages from './pages/admin/AdminStaticPages';
import AdminBiodataListPage from './pages/admin/AdminBiodataListPage';
import BlankBiodataFormPrintPage from './pages/print/BlankBiodataFormPrintPage';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import SuperAdminCommunities from './pages/super-admin/SuperAdminCommunities';
import SuperAdminAdmins from './pages/super-admin/SuperAdminAdmins';
import SuperAdminRevenue from './pages/super-admin/SuperAdminRevenue';
import SuperAdminSettings from './pages/super-admin/SuperAdminSettings';
import SuperAdminPlans from './pages/super-admin/SuperAdminPlans';
import SuperAdminAuditLogs from './pages/super-admin/SuperAdminAuditLogs';
import SuperAdminSystemSettings from './pages/super-admin/SuperAdminSystemSettings';

import SuperAdminUsers from './pages/super-admin/SuperAdminUsers';

// Error Pages
import NotFoundPage from './pages/public/NotFoundPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    useSettingsStore.getState().fetchSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public & Auth Routes ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/community/:slug" element={<CommunityPage />} />
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ── Standalone Public Biodata Form (No Website Header/Navbar) ── */}
          <Route path="/fill-biodata" element={<BiodataEntryPage />} />

          {/* ── Blank Biodata Form Print Page (No Layout – opens in new tab, auto-prints) ── */}
          <Route path="/print/blank-biodata" element={<BlankBiodataFormPrintPage />} />

          {/* ── Additional Auth Routes ── */}
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ── Member Routes (Protected) ── */}
          <Route element={<ProtectedRoute roles={['MEMBER', 'PREMIUM', 'ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<MemberLayout />}>
              {/* Profile completion wizard — accessible without profile guard */}
              <Route path="/complete-profile" element={<ProfileCompletePage />} />
              
              {/* Profile-gated routes */}
              <Route element={<ProfileCompletionGuard />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfileViewPage />} />
                <Route path="/profile/:id" element={<ProfileViewPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:chatId" element={<ChatPage />} />
                <Route path="/interests" element={<InterestsPage />} />
                <Route path="/profile-viewers" element={<ProfileViewersPage />} />
                <Route path="/notifications" element={<DashboardPage />} />
                <Route path="/contact-history" element={<DashboardPage />} />
                <Route path="/payment-history" element={<PaymentHistoryPage />} />
                <Route path="/settings" element={<ProfileEditPage />} />
              </Route>

              {/* Edit profile — accessible even if not 100% complete */}
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/profile/biodata-form" element={<BiodataEntryPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
            </Route>
          </Route>

          {/* ── Admin Routes (Protected) ── */}
          <Route element={<ProtectedRoute roles={['ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'SUPER_ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<SuperAdminUsers />} />
              <Route path="/admin/profiles" element={<AdminProfiles />} />
              <Route path="/admin/communities" element={<SuperAdminCommunities />} />
              <Route path="/admin/plans" element={<SuperAdminPlans />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/banners" element={<AdminBanners />} />
              <Route path="/admin/blogs" element={<AdminBlogs />} />
              <Route path="/admin/success-stories" element={<AdminSuccessStories />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/ai-biodata" element={<AdminAiBiodata />} />
              <Route path="/admin/biodata-entry" element={<BiodataEntryPage />} />
              <Route path="/admin/biodata-list" element={<AdminBiodataListPage />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/faq" element={<AdminFaq />} />
              <Route path="/admin/testimonials" element={<AdminTestimonials />} />
              <Route path="/admin/static-pages" element={<AdminStaticPages />} />
            </Route>
          </Route>

          {/* ── Super Admin Routes (Protected strictly for SUPER_ADMIN) ── */}
          <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/super-admin/admins" element={<SuperAdminAdmins />} />
              <Route path="/super-admin/revenue" element={<SuperAdminRevenue />} />
              <Route path="/super-admin/communities" element={<SuperAdminCommunities />} />
              <Route path="/super-admin/users" element={<SuperAdminUsers />} />
              <Route path="/super-admin/profiles" element={<AdminProfiles />} />
              <Route path="/super-admin/plans" element={<SuperAdminPlans />} />
              <Route path="/super-admin/payments" element={<AdminPayments />} />
              <Route path="/super-admin/banners" element={<AdminBanners />} />
              <Route path="/super-admin/ai-biodata" element={<AdminAiBiodata />} />
              <Route path="/super-admin/biodata-entry" element={<BiodataEntryPage />} />
              <Route path="/super-admin/biodata-list" element={<AdminBiodataListPage />} />
              <Route path="/super-admin/blogs" element={<AdminBlogs />} />
              <Route path="/super-admin/success-stories" element={<AdminSuccessStories />} />

              <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
              <Route path="/super-admin/system-settings" element={<SuperAdminSystemSettings />} />
              <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
              <Route path="/super-admin/logs" element={<AdminLogs />} />
            </Route>
          </Route>

          {/* URL Aliases */}
          <Route path="/super admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/super_admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />

          {/* ── Error Routes ── */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1330',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#00D4AA', secondary: '#1A1330' } },
          error: { iconTheme: { primary: '#FF4D4D', secondary: '#1A1330' } },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
