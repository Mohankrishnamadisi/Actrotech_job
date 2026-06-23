import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { adminService } from '../../services/admin';

const UsersPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const users = await adminService.getUsers();
        setRows(users || []);
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
    { field: 'role', headerName: 'Role', width: 140 },
    { field: 'created_at', headerName: 'Created', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 260,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="contained">View</Button>
          <Button size="small" variant="outlined">Edit</Button>
          <Button size="small" color="error" variant="outlined">Disable</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users
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

export default UsersPage;
