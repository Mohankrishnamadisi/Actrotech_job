import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/admin';

const StatCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => (
  <Paper sx={{ p: 2 }} elevation={1}>
    <Typography variant="subtitle2" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h5">{value}</Typography>
  </Paper>
);

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<Record<string, any>>({});
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await adminService.getDashboardStats();
        setStats(s);
        // generate small sample daily registrations
        const sample = Array.from({ length: 14 }).map((_, i) => ({ day: `D${i + 1}`, users: Math.floor(Math.random() * 40) + 5 }));
        setRegistrations(sample);
      } catch (err) {
        // noop
      }
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Overview
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Users" value={stats.totalUsers ?? '—'} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Candidates" value={stats.totalCandidates ?? '—'} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Recruiters" value={stats.totalRecruiters ?? '—'} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Jobs" value={stats.activeJobs ?? '—'} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1">Daily Registrations</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={registrations}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line dataKey="users" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant="subtitle1">Monthly Revenue (sample)</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={registrations.map((r, idx) => ({ label: r.day, value: Math.floor(Math.random() * 2000) + 200 }))}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#2e7d32" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
