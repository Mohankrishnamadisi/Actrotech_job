import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  TrackChanges as TrackChangesIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/index';
import { userService } from '@services/api';
import {
  clamp,
  getWeightsForRole,
  mergePremiumDashboardConfig,
  persistLocalPremiumConfig,
  readLocalPreferencesRole,
  readLocalPremiumConfig,
  ROLE_WEIGHT_PRESETS,
  type DemandWeights,
  type WeeklyGoalTargets,
  type PremiumDashboardConfig,
} from '@utils/premiumDashboardConfig';

export const PremiumIntelligenceSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('General');
  const [roleWeightMap, setRoleWeightMap] = useState<Record<string, DemandWeights>>({});
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyGoalTargets>({ applications: 6, interactions: 10, pipeline: 4 });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const profile = await userService.getProfile(user.id);
        const apiConfig = (profile?.dashboard_preferences || profile?.premium_dashboard_config || profile?.dashboard_config || {}) as Partial<PremiumDashboardConfig>;
        const localConfig = readLocalPremiumConfig();
        const merged = mergePremiumDashboardConfig(apiConfig, localConfig, readLocalPreferencesRole());
        setSelectedRole(merged.selectedRole);
        setRoleWeightMap(merged.roleWeights);
        setWeeklyTargets(merged.weeklyTargets);
      } catch {
        const merged = mergePremiumDashboardConfig({}, readLocalPremiumConfig(), readLocalPreferencesRole());
        setSelectedRole(merged.selectedRole);
        setRoleWeightMap(merged.roleWeights);
        setWeeklyTargets(merged.weeklyTargets);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const roleOptions = useMemo(() => {
    const set = new Set<string>(['General', ...Object.keys(ROLE_WEIGHT_PRESETS), selectedRole]);
    return Array.from(set);
  }, [selectedRole]);

  const activeWeights = useMemo(() => getWeightsForRole(selectedRole, roleWeightMap), [roleWeightMap, selectedRole]);

  const updateWeight = (key: keyof DemandWeights, value: number) => {
    setRoleWeightMap((prev) => {
      const current = getWeightsForRole(selectedRole, prev);
      return {
        ...prev,
        [selectedRole]: {
          ...current,
          [key]: clamp(value, 0.1, 5),
        },
      };
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const payload: PremiumDashboardConfig = {
      selectedRole,
      roleWeights: roleWeightMap,
      weeklyTargets,
    };

    setSaving(true);
    setSaveMessage(null);
    persistLocalPremiumConfig(payload);

    try {
      await userService.updateProfile(user.id, {
        dashboard_preferences: payload,
      });
      setSaveMessage('Saved to cloud and synced across devices.');
      toast.success('Premium intelligence settings saved.');
    } catch {
      setSaveMessage('Saved locally. Cloud sync unavailable right now.');
      toast.success('Settings saved locally.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading premium intelligence settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ color: '#7C3AED' }} />
          Premium Intelligence Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Centralized controls for Demand Score formula, role presets, and weekly tracker goals.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ color: '#7C3AED' }} />
                Role-wise Demand Score Formula
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Active role preset
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={selectedRole}
                    onChange={(event: SelectChangeEvent<string>) => setSelectedRole(event.target.value)}
                    sx={{ mt: 0.6 }}
                  >
                    {roleOptions.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Profile weight"
                    type="number"
                    value={activeWeights.profileStrength}
                    inputProps={{ step: 0.05, min: 0.1, max: 5 }}
                    onChange={(e) => updateWeight('profileStrength', Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Applications"
                    type="number"
                    value={activeWeights.applications}
                    inputProps={{ step: 0.05, min: 0.1, max: 5 }}
                    onChange={(e) => updateWeight('applications', Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Interactions"
                    type="number"
                    value={activeWeights.interactions}
                    inputProps={{ step: 0.05, min: 0.1, max: 5 }}
                    onChange={(e) => updateWeight('interactions', Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Skills"
                    type="number"
                    value={activeWeights.skills}
                    inputProps={{ step: 0.05, min: 0.1, max: 5 }}
                    onChange={(e) => updateWeight('skills', Number(e.target.value))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrackChangesIcon sx={{ color: '#2563EB' }} />
                Weekly Sprint Goals
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Weekly applications goal"
                    type="number"
                    value={weeklyTargets.applications}
                    inputProps={{ min: 1, max: 50 }}
                    onChange={(e) => setWeeklyTargets((prev) => ({ ...prev, applications: clamp(Number(e.target.value) || prev.applications, 1, 50) }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Recruiter interactions goal"
                    type="number"
                    value={weeklyTargets.interactions}
                    inputProps={{ min: 1, max: 80 }}
                    onChange={(e) => setWeeklyTargets((prev) => ({ ...prev, interactions: clamp(Number(e.target.value) || prev.interactions, 1, 80) }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Interview pipeline goal"
                    type="number"
                    value={weeklyTargets.pipeline}
                    inputProps={{ min: 1, max: 20 }}
                    onChange={(e) => setWeeklyTargets((prev) => ({ ...prev, pipeline: clamp(Number(e.target.value) || prev.pipeline, 1, 20) }))}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ fontWeight: 700 }}>
          {saving ? 'Saving...' : 'Save Premium Intelligence Settings'}
        </Button>
      </Box>

      {saveMessage ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {saveMessage}
        </Alert>
      ) : null}
    </Box>
  );
};

export default PremiumIntelligenceSettings;
