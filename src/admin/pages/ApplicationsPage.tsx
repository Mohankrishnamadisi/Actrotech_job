import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { adminService } from '../../services/admin';

const ApplicationsPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const applications = await adminService.getApplications();
        setRows(applications || []);
      } catch (err) {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 220 },
    {
      field: 'jobTitle',
      headerName: 'Job',
      width: 260,
      valueGetter: (params) => params.row.jobs?.title || params.row.job_title || '—',
    },
    {
      field: 'candidate',
      headerName: 'Candidate',
      width: 240,
      valueGetter: (params) => params.row.profiles?.email || params.row.profiles?.name || '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
    },
    { field: 'applied_at', headerName: 'Applied At', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button size="small" variant="outlined">
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Applications
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

export default ApplicationsPage;
