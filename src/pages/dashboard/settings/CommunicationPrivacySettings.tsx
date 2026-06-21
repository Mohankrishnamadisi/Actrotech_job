import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Divider,
} from '@mui/material';
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

export const CommunicationPrivacySettings: React.FC = () => {
  const [settings, setSettings] = useState<CommunicationPrivacyState>(defaultState);

  useEffect(() => {
    setSettings(getSavedCommunicationPrivacy());
  }, []);

  const handleToggle = (key: keyof CommunicationPrivacyState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = () => {
    saveCommunicationPrivacy(settings);
    toast.success('Communication & privacy settings updated.');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Communication & Privacy
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Choose how you want to receive alerts and control who can see your profile.
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={settings.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            color="primary"
          />
        }
        label="Email notifications"
      />

      <FormControlLabel
        control={
          <Switch checked={settings.smsAlerts} onChange={() => handleToggle('smsAlerts')} color="primary" />
        }
        label="SMS alerts"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.profileVisibility}
            onChange={() => handleToggle('profileVisibility')}
            color="primary"
          />
        }
        label="Findability by employers"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
            color="primary"
          />
        }
        label="Marketing and updates"
      />

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Your privacy settings are kept locally for now and will be applied across your job search experience.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={saveSettings}>
          Save Privacy Settings
        </Button>
      </Box>
    </Box>
  );
};
