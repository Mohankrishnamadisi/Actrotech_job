import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { adminService } from '../../services/admin';

const CandidatesPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const candidates = await adminService.getCandidates();
        setRows(candidates || []);
      } catch (err) {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 220 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'location', headerName: 'Location', width: 160 },
    {
      field: 'skills',
      headerName: 'Skills',
      width: 260,
      valueGetter: (params) => {
        const skills = params.row.skills;
        if (Array.isArray(skills)) return skills.join(', ');
        return skills || '—';
      },
    },
    { field: 'created_at', headerName: 'Created', width: 180 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Candidates
      </Typography>
      <Paper sx={{ height: 600, p: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Paper>
    </Box>
  );
};

export default CandidatesPage;
