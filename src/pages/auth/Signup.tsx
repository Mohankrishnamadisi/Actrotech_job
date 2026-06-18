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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Google as GoogleIcon } from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { ROUTES, USER_ROLES } from '@constants/index';
import { validateEmail, validatePassword } from '@utils/index';
import toast from 'react-hot-toast';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading, setError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: USER_ROLES.JOB_SEEKER,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoadingState] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as any;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoadingState(true);
    setLoading(true);

    try {
      const response = await authService.signUp(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
      });

      if (response.user) {
        setUser({
          id: response.user.id,
          email: response.user.email || formData.email,
          name: formData.name,
          role: formData.role as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        toast.success('Sign up successful! Please verify your email.');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoadingState(true);
    try {
      const response = await authService.signInWithGoogle();
      if (response) {
        toast.success('Signed up with Google');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign up failed';
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
              Create Account
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Join thousands of job seekers and recruiters
            </Typography>
          </Box>

          <form onSubmit={handleSignup}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 2 }}
            />

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
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>I am a</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="I am a"
              >
                <MenuItem value={USER_ROLES.JOB_SEEKER}>Job Seeker</MenuItem>
                <MenuItem value={USER_ROLES.RECRUITER}>Recruiter</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, mb: 2 }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignup}
            disabled={loading}
            sx={{ mb: 3 }}
          >
            Sign Up with Google
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to={ROUTES.LOGIN}>
                Login
              </Link>
            </Typography>
          </Box>
        </Card>
      </Container>
    </Layout>
  );
};
