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
import { motion } from 'framer-motion';
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
      <Box
        sx={{
          minHeight: '100vh',
          py: 10,
          background: 'radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(245,158,11,0.14), transparent 30%), linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)',
        }}
      >
        <Container maxWidth="sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card
              sx={{
                p: 4,
                borderRadius: 5,
                border: '1px solid rgba(37, 99, 235, 0.12)',
                boxShadow: '0 28px 80px rgba(15, 23, 42, 0.08)',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.95)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at top right, rgba(59,130,246,0.14), transparent 30%), radial-gradient(circle at bottom left, rgba(245,158,11,0.12), transparent 28%)',
                  pointerEvents: 'none',
                }}
              />
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  Welcome Back
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
                  Securely access your dashboard and discover premium opportunities.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Premium jobs, smart matching, and lightning-fast applications.
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
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 14px 30px rgba(37, 99, 235, 0.18)',
                  }}
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
                sx={{ mb: 3, textTransform: 'none' }}
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
          </motion.div>
        </Container>
      </Box>
    </Layout>
  );
};
