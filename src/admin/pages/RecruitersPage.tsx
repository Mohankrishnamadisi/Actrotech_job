import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { adminService } from '../../services/admin';

const RecruitersPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const recruiters = await adminService.getRecruiters();
        setRows(recruiters || []);
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
    { field: 'company_name', headerName: 'Company', width: 220 },
    { field: 'industry', headerName: 'Industry', width: 160 },
    { field: 'created_at', headerName: 'Created', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 260,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="contained">
            View
          </Button>
          <Button size="small" variant="outlined">
            Edit
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Recruiters
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

export default RecruitersPage;
