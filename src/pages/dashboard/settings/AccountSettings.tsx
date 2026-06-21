import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, TextField, Button, Divider } from '@mui/material';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/index';
import { userService } from '@services/api';
import { authService } from '@services/supabase';
import { validatePassword, validatePhone } from '@utils/index';

export const AccountSettings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name,
        email: user.email,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New password and confirmation do not match.');
        return;
      }
      if (formData.newPassword && !validatePassword(formData.newPassword)) {
        toast.error('Password must contain at least 8 characters with uppercase, lowercase, and numbers.');
        return;
      }
    }

    setSaving(true);
    try {
      const updates: Record<string, string> = {
        name: formData.fullName,
      };
      if (formData.phone) {
        updates.phone = formData.phone;
      }

      const updatedProfile = await userService.updateProfile(user.id, updates);
      const updatedUser = {
        ...user,
        name: updatedProfile.name || user.name,
        phone: updatedProfile.phone || formData.phone || user.phone,
      };

      if (formData.newPassword) {
        await authService.updatePassword(formData.newPassword);
        toast.success('Password updated successfully.');
      }

      setUser(updatedUser);
      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      toast.success('Account settings saved.');
    } catch (error) {
      console.error('Account settings update failed:', error);
      toast.error('Failed to save account settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Account Settings
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Update your display name, contact details, and security settings.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            helperText="Your display name in the account menu"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            disabled
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            helperText="A verified phone number improves security and notifications."
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Change Password
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Update your login password to keep your account secure.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            helperText="At least 8 characters, with uppercase, lowercase and numbers."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};
