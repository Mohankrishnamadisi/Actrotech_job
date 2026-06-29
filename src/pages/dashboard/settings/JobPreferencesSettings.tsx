import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, EXPERIENCE_LEVELS, WORK_MODES } from '@constants/index';

interface JobPreferencesState {
  desiredRole: string;
  preferredLocation: string;
  preferredWorkMode: string;
  experienceLevel: string;
  expectedSalary: string;
  industry: string;
}

const defaultPreferences: JobPreferencesState = {
  desiredRole: '',
  preferredLocation: '',
  preferredWorkMode: '',
  experienceLevel: '',
  expectedSalary: '',
  industry: '',
};

const loadPreferences = (): JobPreferencesState => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    return {
      ...defaultPreferences,
      ...(parsed.jobPreferences || {}),
    };
  } catch {
    return defaultPreferences;
  }
};

const savePreferences = (preferences: JobPreferencesState) => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    const next = { ...parsed, jobPreferences: preferences };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to persist job preferences', error);
  }
};

interface PreferenceField {
  key: keyof JobPreferencesState;
  label: string;
  icon: React.ReactNode;
  helperText?: string;
  placeholder?: string;
}

export const JobPreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<JobPreferencesState>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  const handleChange = (field: keyof JobPreferencesState, value: string) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePreferences(preferences);
    setHasChanges(false);
    toast.success('Job preferences saved.');
  };

  const handleReset = () => {
    setPreferences(loadPreferences());
    setHasChanges(false);
  };

  const textFields: PreferenceField[] = [
    {
      key: 'desiredRole',
      label: 'Desired Role',
      icon: <WorkIcon />,
      helperText: 'Example: Frontend Developer, Business Analyst',
      placeholder: 'Enter your target job title',
    },
    {
      key: 'preferredLocation',
      label: 'Preferred Location',
      icon: <LocationIcon />,
      helperText: 'City or cities where you want to work',
      placeholder: 'e.g., Bangalore, Hyderabad',
    },
    {
      key: 'expectedSalary',
      label: 'Expected Salary',
      icon: <MoneyIcon />,
      helperText: 'Use numbers or a range like 8-12 LPA',
      placeholder: 'e.g., 8-12 LPA',
    },
    {
      key: 'industry',
      label: 'Industry Preference',
      icon: <BusinessIcon />,
      helperText: 'Preferred industry or sector',
      placeholder: 'e.g., IT, Finance, Healthcare',
    },
  ];

  const selectFields = [
    {
      key: 'preferredWorkMode',
      label: 'Work Mode',
      icon: <SpeedIcon />,
      options: WORK_MODES,
    },
    {
      key: 'experienceLevel',
      label: 'Experience Level',
      icon: <TrendingUpIcon />,
      options: EXPERIENCE_LEVELS,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon sx={{ color: '#F59E0B' }} />
          Job Preferences
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Tell us what kinds of roles and work arrangements you want to see in your job recommendations.
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert
        variant="outlined"
        severity="info"
        sx={{
          mb: 4,
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
        }}
      >
        <Typography variant="body2">
          Your job preferences help us provide better recommendations. Update these settings to get jobs that match
          your career goals.
        </Typography>
      </Alert>

      {/* Text Field Preferences */}
      <Card
        variant="outlined"
        sx={{
          mb: 4,
          borderColor: 'rgba(245, 158, 11, 0.2)',
          backgroundColor: 'rgba(245, 158, 11, 0.03)',
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
              color: '#F59E0B',
            }}
          >
            <WorkIcon sx={{ fontSize: 20 }} />
            Role & Location Details
          </Typography>

          <Grid container spacing={3}>
            {textFields.map((field) => (
              <Grid item xs={12} md={6} key={field.key}>
                <TextField
                  fullWidth
                  label={field.label}
                  value={preferences[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  helperText={field.helperText}
                  InputProps={{
                    startAdornment: (
                      <Box
                        sx={{
                          mr: 1,
                          display: 'flex',
                          alignItems: 'center',
                          color: '#F59E0B',
                        }}
                      >
                        {field.icon}
                      </Box>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Select Field Preferences */}
      <Card
        variant="outlined"
        sx={{
          borderColor: 'rgba(16, 185, 129, 0.2)',
          backgroundColor: 'rgba(16, 185, 129, 0.03)',
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
              color: '#10B981',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 20 }} />
            Career Level & Arrangements
          </Typography>

          <Grid container spacing={3}>
            {selectFields.map((field) => (
              <Grid item xs={12} md={6} key={field.key}>
                <FormControl fullWidth>
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    value={preferences[field.key as keyof JobPreferencesState]}
                    label={field.label}
                    onChange={(e) => handleChange(field.key as keyof JobPreferencesState, e.target.value)}
                    startAdornment={
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', color: '#10B981' }}>
                        {field.icon}
                      </Box>
                    }
                  >
                    <MenuItem value="">
                      <em>Select {field.label}</em>
                    </MenuItem>
                    {field.options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          color="inherit"
          disabled={!hasChanges}
          onClick={handleReset}
        >
          Reset Changes
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges}
          sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          Save Job Preferences
        </Button>
      </Box>
    </Box>
  );
};
