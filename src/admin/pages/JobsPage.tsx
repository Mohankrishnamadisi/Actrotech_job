import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { adminService } from '../../services/admin';

const JobsPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const jobs = await adminService.getJobs();
        setRows(jobs || []);
      } catch (err) {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 220 },
    { field: 'title', headerName: 'Title', width: 260 },
    { field: 'company_name', headerName: 'Company', width: 180 },
    { field: 'location', headerName: 'Location', width: 140 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 320,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="contained">Approve</Button>
          <Button size="small" variant="outlined">Reject</Button>
          <Button size="small">Feature</Button>
          <Button size="small" color="error">Delete</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Jobs
      </Typography>
      <Paper sx={{ height: 600, p: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={25}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          getRowId={(r) => r.id}
        />
      </Paper>
    </Box>
  );
};

export default JobsPage;
