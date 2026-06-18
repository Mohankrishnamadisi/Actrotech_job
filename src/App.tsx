import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

import { theme } from '@styles/theme';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { ProtectedRoute } from '@components/common/ProtectedRoute';

// Pages
import { Home } from '@pages/Home';
import { Jobs } from '@pages/Jobs';
import { JobDetails } from '@pages/JobDetails';
import { Pricing } from '@pages/Pricing';
import { About } from '@pages/About';
import { Contact } from '@pages/Contact';
import { PrivacyPolicy } from '@pages/PrivacyPolicy';
import { TermsConditions } from '@pages/TermsConditions';
import { Login } from '@pages/auth/Login';
import { Signup } from '@pages/auth/Signup';
import { Dashboard } from '@pages/dashboard/Dashboard';
import { ProfilePage } from '@pages/dashboard/Profile';

export const App: React.FC = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth
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

    // Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange((session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'User',
          role: session.user.user_metadata?.role || USER_ROLES.JOB_SEEKER,
          createdAt: session.user.created_at || new Date().toISOString(),
          updatedAt: session.user.updated_at || new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe?.subscription?.unsubscribe();
    };
  }, [setUser, setLoading]);

  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-center" />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.JOBS} element={<Jobs />} />
            <Route path={ROUTES.JOB_DETAILS} element={<JobDetails />} />
            <Route path={ROUTES.PRICING} element={<Pricing />} />
            <Route path={ROUTES.ABOUT} element={<About />} />
            <Route path={ROUTES.CONTACT} element={<Contact />} />
            <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
            <Route path={ROUTES.TERMS_CONDITIONS} element={<TermsConditions />} />

            {/* Auth Routes */}
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.SIGNUP} element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
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

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
