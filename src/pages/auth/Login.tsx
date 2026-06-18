import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  Alert,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES } from '@constants/index';
import { validateEmail } from '@utils/index';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading, setError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoadingState] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoadingState(true);
    setLoading(true);

    try {
      const response = await authService.signIn(formData.email, formData.password);

      if (response.user) {
        setUser({
          id: response.user.id,
          email: response.user.email || formData.email,
          name: response.user.user_metadata?.name || 'User',
          role: response.user.user_metadata?.role || 'job_seeker',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        toast.success('Login successful!');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingState(true);
    try {
      await authService.signInWithGoogle();
      toast.success('Logged in with Google');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      toast.error(errorMessage);
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <Layout footer={false}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Login
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Welcome back! Sign in to your account
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 1 }}
            />

            <Link
              component={RouterLink}
              to={ROUTES.FORGOT_PASSWORD}
              sx={{ fontSize: '0.875rem', display: 'block', mb: 3 }}
            >
              Forgot Password?
            </Link>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Login with Google
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don't have an account?{' '}
              <Link component={RouterLink} to={ROUTES.SIGNUP}>
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Card>
      </Container>
    </Layout>
  );
};
