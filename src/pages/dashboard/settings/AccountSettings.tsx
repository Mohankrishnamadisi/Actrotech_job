import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Card,
  CardContent,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: 'primary.main' }} />
          Account Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Update your display name, contact details, and security settings.
        </Typography>
      </Box>

      {/* Profile Information Section */}
      <Card
        variant="outlined"
        sx={{
          mb: 3,
          borderColor: 'rgba(59, 130, 246, 0.2)',
          backgroundColor: 'rgba(59, 130, 246, 0.03)',
        }}
      >
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'primary.main',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 20 }} />
            Profile Information
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <PersonIcon
                      sx={{
                        mr: 1,
                        color: 'action.active',
                        fontSize: 20,
                      }}
                    />
                  ),
                }}
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
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <EmailIcon
                      sx={{
                        mr: 1,
                        color: 'action.active',
                        fontSize: 20,
                      }}
                    />
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <PhoneIcon
                      sx={{
                        mr: 1,
                        color: 'action.active',
                        fontSize: 20,
                      }}
                    />
                  ),
                }}
                helperText="A verified phone number improves security and notifications."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card
        variant="outlined"
        sx={{
          borderColor: 'rgba(239, 68, 68, 0.2)',
          backgroundColor: 'rgba(239, 68, 68, 0.03)',
        }}
      >
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#EF4444',
            }}
          >
            <LockIcon sx={{ fontSize: 20 }} />
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
                variant="outlined"
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
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {saving && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};
