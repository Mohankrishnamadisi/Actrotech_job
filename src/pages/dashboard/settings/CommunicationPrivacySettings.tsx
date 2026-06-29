import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  NotificationsActive as NotificationsIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  Campaign as CampaignIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { STORAGE_KEYS } from '@constants/index';

interface CommunicationPrivacyState {
  emailNotifications: boolean;
  smsAlerts: boolean;
  profileVisibility: boolean;
  marketingEmails: boolean;
}

const defaultState: CommunicationPrivacyState = {
  emailNotifications: true,
  smsAlerts: false,
  profileVisibility: true,
  marketingEmails: false,
};

const getSavedCommunicationPrivacy = (): CommunicationPrivacyState => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    return {
      ...defaultState,
      ...(parsed.communicationPrivacy || {}),
    };
  } catch {
    return defaultState;
  }
};

const saveCommunicationPrivacy = (state: CommunicationPrivacyState) => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    const next = { ...parsed, communicationPrivacy: state };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to persist communication settings', error);
  }
};

interface SettingOption {
  key: keyof CommunicationPrivacyState;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const settings: SettingOption[] = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive job recommendations and updates via email',
    icon: <EmailIcon sx={{ fontSize: 24 }} />,
    color: '#3B82F6',
  },
  {
    key: 'smsAlerts',
    label: 'SMS Alerts',
    description: 'Get urgent job alerts through SMS messages',
    icon: <NotificationsIcon sx={{ fontSize: 24 }} />,
    color: '#10B981',
  },
  {
    key: 'profileVisibility',
    label: 'Profile Visibility',
    description: 'Allow employers to find and contact you',
    icon: <VisibilityIcon sx={{ fontSize: 24 }} />,
    color: '#F59E0B',
  },
  {
    key: 'marketingEmails',
    label: 'Marketing & Updates',
    description: 'Receive news, tips, and promotional content',
    icon: <CampaignIcon sx={{ fontSize: 24 }} />,
    color: '#8B5CF6',
  },
];

export const CommunicationPrivacySettings: React.FC = () => {
  const [settingsState, setSettingsState] = useState<CommunicationPrivacyState>(defaultState);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettingsState(getSavedCommunicationPrivacy());
  }, []);

  const handleToggle = (key: keyof CommunicationPrivacyState) => {
    setSettingsState((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    saveCommunicationPrivacy(settingsState);
    setHasChanges(false);
    toast.success('Communication & privacy settings updated.');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon sx={{ color: '#10B981' }} />
          Communication & Privacy
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Choose how you want to receive alerts and control who can see your profile.
        </Typography>
      </Box>

      {/* Settings Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {settings.map((setting) => (
          <Grid item xs={12} md={6} key={setting.key}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                border: '1px solid',
                borderColor: settingsState[setting.key] ? setting.color : 'divider',
                backgroundColor: settingsState[setting.key] ? `${setting.color}08` : 'transparent',
                '&:hover': {
                  boxShadow: `0 8px 24px ${setting.color}20`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                    {/* Icon */}
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        backgroundColor: `${setting.color}15`,
                        color: setting.color,
                        flexShrink: 0,
                      }}
                    >
                      {setting.icon}
                    </Box>

                    {/* Text */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          color: settingsState[setting.key] ? setting.color : 'text.primary',
                        }}
                      >
                        {setting.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                        {setting.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Toggle */}
                  <Switch
                    checked={settingsState[setting.key]}
                    onChange={() => handleToggle(setting.key)}
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Info Alert */}
      <Alert
        variant="outlined"
        severity="info"
        sx={{
          mb: 4,
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderColor: 'rgba(59, 130, 246, 0.2)',
        }}
      >
        <Typography variant="body2">
          Your privacy settings are kept locally and will be applied across your job search experience. You can update
          these preferences at any time.
        </Typography>
      </Alert>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          disabled={!hasChanges}
          onClick={() => {
            setSettingsState(getSavedCommunicationPrivacy());
            setHasChanges(false);
          }}
        >
          Reset Changes
        </Button>
        <Button
          variant="contained"
          onClick={saveSettings}
          disabled={!hasChanges}
          sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          Save Privacy Settings
        </Button>
      </Box>
    </Box>
  );
};
