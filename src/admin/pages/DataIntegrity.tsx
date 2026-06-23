import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import { adminService } from '../../services/admin';

const DataIntegrity: React.FC = () => {
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    try {
      const res = await adminService.runIntegrityChecks();
      setResults(res);
    } catch (err) {
      setResults({ error: String(err) });
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    // noop
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Integrity Checker
      </Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Button variant="contained" onClick={runChecks} disabled={running}>
          {running ? 'Running checks…' : 'Run Integrity Checks'}
        </Button>
      </Paper>

      {results && (
        <Paper sx={{ p: 2 }}>
          <List>
            {Object.entries(results).map(([k, v]) => (
              <ListItem key={k}>
                <ListItemText primary={k} secondary={JSON.stringify(v)} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default DataIntegrity;
