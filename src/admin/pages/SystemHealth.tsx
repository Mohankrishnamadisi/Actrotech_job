import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import { adminService } from '../../services/admin';

const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshHealth = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSystemHealth();
      setHealth(data);
    } catch (err) {
      setHealth({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Health
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" onClick={refreshHealth} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh Health Status'}
        </Button>
      </Paper>

      {health ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overview
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Total Users" secondary={health.userCount ?? '—'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Total Jobs" secondary={health.jobCount ?? '—'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Total Applications" secondary={health.applicationCount ?? '—'} />
            </ListItem>
          </List>

          {health.integrity ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Data Integrity Results
              </Typography>
              <List>
                {Object.entries(health.integrity).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText primary={key} secondary={JSON.stringify(value)} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </Paper>
      ) : null}
    </Box>
  );
};

export default SystemHealthPage;
