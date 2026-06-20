import React, { useEffect, useState } from 'react';
import { Container, Card, TextField, Button, Typography, Snackbar, Alert, Box } from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { authService } from '@services/supabase';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@constants/index';

export const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const navigate = useNavigate();

  const validate = () => {
    if (newPassword.length < 8) {
      setSnackbar({ open: true, message: 'Password must be at least 8 characters', severity: 'error' });
      return false;
    }
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.updatePassword(newPassword);
      setSnackbar({ open: true, message: 'Password updated successfully. Please login with your new password.', severity: 'success' });
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Optionally verify session exists
    (async () => {
      try {
        const session = await authService.getSession();
        if (!session) {
          setSnackbar({ open: true, message: 'No active password recovery session found. Please use the reset link from your email.', severity: 'error' });
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return (
    <Layout footer={false}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>Reset Password</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>Set a new password for your account.</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ mb: 2 }} />
            <Button type="submit" variant="contained" fullWidth disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
          </Box>
        </Card>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Layout>
  );
};

export default ResetPassword;
