import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';

import { getTheme } from './styles/theme';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { ProtectedRoute } from '@components/common/ProtectedRoute';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext';

import { Home } from '@pages/Home';
import { Jobs } from '@pages/Jobs';
import { JobDetails } from '@pages/JobDetails';
import { Pricing } from '@pages/Pricing';
import { PrivacyPolicy } from '@pages/PrivacyPolicy';
import { TermsConditions } from '@pages/TermsConditions';
import { Login } from '@pages/auth/Login';
import { Signup } from '@pages/auth/Signup';
import { ForgotPassword } from '@pages/auth/ForgotPassword';
import { ResetPassword } from '@pages/auth/ResetPassword';
import { AuthCallback } from '@pages/auth/AuthCallback';
import { Dashboard } from '@pages/dashboard/Dashboard';
import { ProfilePage } from '@pages/dashboard/Profile';
import { ApplicationsPage } from '@pages/dashboard/Applications';
import { SavedJobsPage } from '@pages/dashboard/SavedJobs';
import { NotificationsPage } from '@pages/dashboard/Notifications';
import { RecruiterRegister } from '@pages/recruiter/RecruiterRegister';
import { RecruiterDashboard } from '@pages/recruiter/RecruiterDashboard';
import PremiumDashboard from '@pages/dashboard/PremiumDashboard';
import { SettingsLayout } from '@pages/dashboard/settings/SettingsLayout';
import { AccountSettings } from '@pages/dashboard/settings/AccountSettings';
import { CommunicationPrivacySettings } from '@pages/dashboard/settings/CommunicationPrivacySettings';
import { JobPreferencesSettings } from '@pages/dashboard/settings/JobPreferencesSettings';
import { BlockedCompaniesSettings } from '@pages/dashboard/settings/BlockedCompaniesSettings';
import { useSubscription } from '@hooks/index';
import { useNotificationAlerts } from '@hooks/useNotificationAlerts';
import RecommendedJobs from '@pages/dashboard/RecommendedJobs';
import RemoteJobs from '@pages/dashboard/RemoteJobs';
import MockInterviews from '@pages/dashboard/tools/MockInterviews';
import ResumeReview from '@pages/dashboard/tools/ResumeReview';
import PriorityApply from '@pages/dashboard/tools/PriorityApply';
import MessagingPage from '@pages/Messaging';
import AdminLayout from './admin/AdminLayout';
import DashboardOverview from './admin/pages/DashboardOverview';
import UsersPage from './admin/pages/UsersPage';
import RecruitersPage from './admin/pages/RecruitersPage';
import CandidatesPage from './admin/pages/CandidatesPage';
import JobsPage from './admin/pages/JobsPage';
import AdminApplicationsPage from './admin/pages/ApplicationsPage';
import AnalyticsPage from './admin/pages/Analytics';
import BulkImport from './admin/pages/BulkImport';
import DataIntegrity from './admin/pages/DataIntegrity';
import SystemHealthPage from './admin/pages/SystemHealth';
import SettingsPage from './admin/pages/Settings';

const RoleDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);

  if (user?.role === USER_ROLES.ADMIN) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }

  if (user?.role === USER_ROLES.RECRUITER) {
    return <Navigate to={ROUTES.RECRUITER_DASHBOARD} replace />;
  }

  if (subscription) {
    return <PremiumDashboard />;
  }

  return <Dashboard />;
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.JOBS} element={<Jobs />} />
        <Route path={ROUTES.JOB_DETAILS} element={<JobDetails />} />
        <Route path={ROUTES.PRICING} element={<Pricing />} />
        <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
        <Route path={ROUTES.TERMS_CONDITIONS} element={<TermsConditions />} />

        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
        <Route path={ROUTES.RECRUITER_REGISTER} element={<RecruiterRegister />} />

        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD_PROFILE}
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD_APPLICATIONS}
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD_SAVED_JOBS}
          element={
            <ProtectedRoute>
              <SavedJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD_NOTIFICATIONS}
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.DASHBOARD_SETTINGS}
          element={
            <ProtectedRoute>
              <SettingsLayout />
            </ProtectedRoute>
          }
        >
          <Route path="account" element={<AccountSettings />} />
          <Route path="privacy" element={<CommunicationPrivacySettings />} />
          <Route path="preferences" element={<JobPreferencesSettings />} />
          <Route path="blocked-companies" element={<BlockedCompaniesSettings />} />
        </Route>
        <Route
          path="/dashboard/recommended-jobs"
          element={
            <ProtectedRoute>
              <RecommendedJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/remote-jobs"
          element={
            <ProtectedRoute>
              <RemoteJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/mock-interviews"
          element={
            <ProtectedRoute>
              <MockInterviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/resume-review"
          element={
            <ProtectedRoute>
              <ResumeReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/priority-apply"
          element={
            <ProtectedRoute>
              <PriorityApply />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.RECRUITER_DASHBOARD}
          element={
            <ProtectedRoute requiredRole={USER_ROLES.RECRUITER}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<DashboardOverview />} />
          <Route path={ROUTES.ADMIN_USERS} element={<UsersPage />} />
          <Route path={ROUTES.ADMIN_RECRUITERS} element={<RecruitersPage />} />
          <Route path={ROUTES.ADMIN_CANDIDATES} element={<CandidatesPage />} />
          <Route path={ROUTES.ADMIN_JOBS} element={<JobsPage />} />
          <Route path={ROUTES.ADMIN_APPLICATIONS} element={<AdminApplicationsPage />} />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.ADMIN_BULK_IMPORT} element={<BulkImport />} />
          <Route path={ROUTES.ADMIN_DATA_INTEGRITY} element={<DataIntegrity />} />
          <Route path={ROUTES.ADMIN_SYSTEM_HEALTH} element={<SystemHealthPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
        </Route>
        <Route
          path={ROUTES.MESSAGING}
          element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent: React.FC = () => {
  const { themeMode } = useThemeMode();
  const { setUser, setLoading, user } = useAuthStore();

  useNotificationAlerts(user?.id || null);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        try {
          const session = await authService.getSession();
          // eslint-disable-next-line no-console
          console.log('Auth session on init:', session);
          if (session?.user) {
            let profile: any = null;
            try {
              const { userService } = await import('./services/api');
              profile = await userService.getProfile(session.user.id);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('Failed to load profile on initAuth', err);
            }
            // eslint-disable-next-line no-console
            console.log('Profile on init:', profile);

            const finalRole = profile?.role || session.user.user_metadata?.role || USER_ROLES.JOB_SEEKER;

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.user_metadata?.name || 'User',
              role: finalRole,
              avatar: session.user.user_metadata?.avatar_url,
              createdAt: profile?.created_at || session.user.created_at || new Date().toISOString(),
              updatedAt: profile?.updated_at || session.user.updated_at || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    let subscription: { data?: { subscription?: { unsubscribe: () => void } } } | null = null;
    try {
      subscription = authService.onAuthStateChange(async (session) => {
        const s = session as { user?: { id: string; email?: string; user_metadata?: Record<string, string>; created_at?: string; updated_at?: string } } | null;
        // eslint-disable-next-line no-console
        console.log('Auth state change:', s);
        if (s?.user) {
          let profile: any = null;
          try {
            const { userService } = await import('./services/api');
            profile = await userService.getProfile(s.user.id);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load profile onAuthStateChange', err);
          }
          // eslint-disable-next-line no-console
          console.log('Profile on auth change:', profile);

          const finalRole = profile?.role || (s.user.user_metadata?.role as 'job_seeker' | 'recruiter' | 'admin') || USER_ROLES.JOB_SEEKER;

          setUser({
            id: s.user.id,
            email: s.user.email || '',
            name: profile?.name || s.user.user_metadata?.name || 'User',
            role: finalRole,
            avatar: s.user.user_metadata?.avatar_url,
            createdAt: profile?.created_at || s.user.created_at || new Date().toISOString(),
            updatedAt: profile?.updated_at || s.user.updated_at || new Date().toISOString(),
          });
        } else {
          setUser(null);
        }
      });
    } catch (error) {
      console.error('Auth state listener error:', error);
    }

    return () => {
      try {
        const sub = subscription as { data?: { subscription?: { unsubscribe: () => void } } };
        sub?.data?.subscription?.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth:', error);
      }
    };
  }, [setUser, setLoading]);

  return (
    <ThemeProvider theme={getTheme(themeMode)}>
      <CssBaseline />
      <Toaster position="top-center" />
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  );
};

export const App: React.FC = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <ThemeModeProvider>
        <AppContent />
      </ThemeModeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
