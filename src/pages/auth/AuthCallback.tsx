import React, { useEffect } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService, supabase } from '@services/supabase';
import { userService, recruiterService } from '@services/api';
import type { Recruiter } from '@types';
import { useAuthStore } from '@store/index';
import { ROUTES, USER_ROLES } from '@constants/index';

const restoreSessionFromHashToken = async () => {
  const fullHash = window.location.hash || '';
  const secondHashIndex = fullHash.indexOf('#', 1);
  if (secondHashIndex === -1) {
    return;
  }

  const tokenFragment = fullHash.slice(secondHashIndex + 1);
  const params = new URLSearchParams(tokenFragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }
};

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      try {
        await restoreSessionFromHashToken();
        const session = await authService.getSession();
        const user = (session as any)?.user;
        if (!user) {
          navigate(ROUTES.LOGIN);
          return;
        }

        const userId = user.id;
        const role = user.user_metadata?.role || USER_ROLES.JOB_SEEKER;

        // Ensure profile exists
        if (role === USER_ROLES.RECRUITER) {
          const recruiter = await recruiterService.getRecruiterProfile(userId);
          if (!recruiter) {
            await recruiterService.createRecruiterProfile(userId, {
              company_email: user.email,
            } as Record<string, unknown>);
          } else {
            try {
              await userService.ensureRecruiterProfile(userId, {
                name: user.user_metadata?.name || 'Recruiter',
                email: user.email,
              } as Partial<Recruiter> & Record<string, unknown>);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn('Failed to ensure recruiter profile on OAuth callback', err);
            }
          }
          setUser({ id: userId, email: user.email || '', name: user.user_metadata?.name || 'Recruiter', role: USER_ROLES.RECRUITER, createdAt: user.created_at || new Date().toISOString(), updatedAt: user.updated_at || new Date().toISOString(), });
          navigate(ROUTES.RECRUITER_DASHBOARD);
          return;
        }

        // Job seeker
        const profile = await userService.getProfile(userId);
        if (!profile) {
          await userService.createProfile(userId, {
            name: user.user_metadata?.name || 'User',
            email: user.email,
            role: USER_ROLES.JOB_SEEKER,
          } as Record<string, unknown>);
        }
        setUser({ id: userId, email: user.email || '', name: user.user_metadata?.name || 'User', role: USER_ROLES.JOB_SEEKER, createdAt: user.created_at || new Date().toISOString(), updatedAt: user.updated_at || new Date().toISOString(), });
        navigate(ROUTES.DASHBOARD);
      } catch (err) {
        console.error('OAuth callback handling failed:', err);
        navigate(ROUTES.LOGIN);
      }
    })();
  }, [navigate, setUser]);

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
      <CircularProgress />
      <Typography>Finalizing sign in... Redirecting shortly.</Typography>
    </Box>
  );
};

export default AuthCallback;
