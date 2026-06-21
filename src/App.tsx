import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

import { theme } from './styles/theme';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { ProtectedRoute } from '@components/common/ProtectedRoute';

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
import { RecruiterRegister } from '@pages/recruiter/RecruiterRegister';
import { RecruiterDashboard } from '@pages/recruiter/RecruiterDashboard';
import PremiumDashboard from '@pages/dashboard/PremiumDashboard';
import { SettingsLayout } from '@pages/dashboard/settings/SettingsLayout';
import { AccountSettings } from '@pages/dashboard/settings/AccountSettings';
import { CommunicationPrivacySettings } from '@pages/dashboard/settings/CommunicationPrivacySettings';
import { JobPreferencesSettings } from '@pages/dashboard/settings/JobPreferencesSettings';
import { BlockedCompaniesSettings } from '@pages/dashboard/settings/BlockedCompaniesSettings';
import { useSubscription } from '@hooks/index';

const RoleDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { subscription } = useSubscription(user?.id || null);

  if (user?.role === USER_ROLES.RECRUITER) {
    return <Navigate to={ROUTES.RECRUITER_DASHBOARD} replace />;
  }

  if (subscription) {
    return <PremiumDashboard />;
  }

  return <Dashboard />;
};

export const App: React.FC = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'User',
            role: session.user.user_metadata?.role || USER_ROLES.JOB_SEEKER,
            avatar: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at || new Date().toISOString(),
            updatedAt: session.user.updated_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const unsubscribe = authService.onAuthStateChange((session) => {
      const s = session as { user?: { id: string; email?: string; user_metadata?: Record<string, string>; created_at?: string; updated_at?: string } } | null;
      if (s?.user) {
        setUser({
          id: s.user.id,
          email: s.user.email || '',
          name: s.user.user_metadata?.name || 'User',
          role: (s.user.user_metadata?.role as 'job_seeker' | 'recruiter' | 'admin') || USER_ROLES.JOB_SEEKER,
          avatar: s.user.user_metadata?.avatar_url,
          createdAt: s.user.created_at || new Date().toISOString(),
          updatedAt: s.user.updated_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      const sub = unsubscribe as { data?: { subscription?: { unsubscribe: () => void } } };
      sub?.data?.subscription?.unsubscribe();
    };
  }, [setUser, setLoading]);

  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-center" />
        <Router>
          <Routes>
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
              path={ROUTES.DASHBOARD_SETTINGS}
              element={
                <ProtectedRoute>
                  <SettingsLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="account"
                element={<AccountSettings />}
              />
              <Route
                path="privacy"
                element={<CommunicationPrivacySettings />}
              />
              <Route
                path="preferences"
                element={<JobPreferencesSettings />}
              />
              <Route
                path="blocked-companies"
                element={<BlockedCompaniesSettings />}
              />
            </Route>
            <Route
              path={ROUTES.RECRUITER_DASHBOARD}
              element={
                <ProtectedRoute requiredRole={USER_ROLES.RECRUITER}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
