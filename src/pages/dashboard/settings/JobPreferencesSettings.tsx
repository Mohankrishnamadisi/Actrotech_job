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
} from '@mui/material';
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

export const JobPreferencesSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<JobPreferencesState>(defaultPreferences);

  useEffect(() => {
    setPreferences(loadPreferences());
  }, []);

  const handleChange = (field: keyof JobPreferencesState, value: string) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    savePreferences(preferences);
    toast.success('Job preferences saved.');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Job Preferences
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Tell us what kinds of roles and work arrangements you want to see.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Desired Role"
            value={preferences.desiredRole}
            onChange={(e) => handleChange('desiredRole', e.target.value)}
            helperText="Example: Frontend Developer, Business Analyst"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Preferred Location"
            value={preferences.preferredLocation}
            onChange={(e) => handleChange('preferredLocation', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Work Mode</InputLabel>
            <Select
              value={preferences.preferredWorkMode}
              label="Work Mode"
              onChange={(e) => handleChange('preferredWorkMode', e.target.value as string)}
            >
              {WORK_MODES.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Experience Level</InputLabel>
            <Select
              value={preferences.experienceLevel}
              label="Experience Level"
              onChange={(e) => handleChange('experienceLevel', e.target.value as string)}
            >
              {EXPERIENCE_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Expected Salary"
            value={preferences.expectedSalary}
            onChange={(e) => handleChange('expectedSalary', e.target.value)}
            helperText="Use numbers or a range like 8-12 LPA"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Industry Preference"
            value={preferences.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave}>
          Save Job Preferences
        </Button>
      </Box>
    </Box>
  );
};
