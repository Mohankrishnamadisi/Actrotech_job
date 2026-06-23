import React, { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import Papa from 'papaparse';
import { adminService } from '../../services/admin';

const BulkImport: React.FC = () => {
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data as any[]);
        setErrors((results.errors || []).map((er: any) => er.message));
      },
    });
  };

  const doImport = async () => {
    try {
      await adminService.bulkImportJobs(preview);
      alert('Import requested — check import summary in logs');
    } catch (err) {
      alert('Import failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bulk Job Import
      </Typography>
      <Paper sx={{ p: 2 }}>
        <input type="file" accept=".csv,.xlsx" onChange={handleFile} />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={doImport} disabled={preview.length === 0}>
            Import {preview.length} rows
          </Button>
        </Box>
        {errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">{errors.join(', ')}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BulkImport;
