import React, { useState } from 'react';
import { Container, Card, TextField, Button, Typography, Snackbar, Alert, Box } from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { authService } from '@services/supabase';
import { validateEmail } from '@utils/index';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@constants/index';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setSnackbar({ open: true, message: 'Please enter a valid email address', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSnackbar({ open: true, message: 'Password reset link sent successfully. Please check your email.', severity: 'success' });
      // optional: navigate user back to login after a short delay
      setTimeout(() => navigate(ROUTES.LOGIN), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout footer={false}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Forgot Password</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>Enter your registered email to receive a password reset link.</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</Button>
          </Box>
        </Card>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default ForgotPassword;
