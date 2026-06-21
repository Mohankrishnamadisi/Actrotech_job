import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import toast from 'react-hot-toast';
import { STORAGE_KEYS } from '@constants/index';

const loadBlockedCompanies = (): string[] => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    return parsed.blockedCompanies || [];
  } catch {
    return [];
  }
};

const saveBlockedCompanies = (companies: string[]) => {
  try {
    const store = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const parsed = store ? JSON.parse(store) : {};
    const next = { ...parsed, blockedCompanies: companies };
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(next));
  } catch (error) {
    console.error('Failed to persist blocked companies', error);
  }
};

export const BlockedCompaniesSettings: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');

  useEffect(() => {
    setCompanies(loadBlockedCompanies());
  }, []);

  const handleAddCompany = () => {
    const trimmed = companyInput.trim();
    if (!trimmed) {
      toast.error('Enter a company name or domain to block.');
      return;
    }
    if (companies.includes(trimmed)) {
      toast.error('This company is already blocked.');
      return;
    }
    const next = [trimmed, ...companies];
    setCompanies(next);
    setCompanyInput('');
    saveBlockedCompanies(next);
    toast.success('Company blocked successfully.');
  };

  const handleRemoveCompany = (company: string) => {
    const next = companies.filter((item) => item !== company);
    setCompanies(next);
    saveBlockedCompanies(next);
    toast.success('Block removed.');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Blocked Companies
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Block companies you no longer want to see in your recommendations or notifications.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
        <TextField
          fullWidth
          label="Company name or domain"
          value={companyInput}
          onChange={(e) => setCompanyInput(e.target.value)}
          placeholder="Example: Acme Corp or acme.com"
        />
        <Button variant="contained" onClick={handleAddCompany} sx={{ whiteSpace: 'nowrap' }}>
          Block Company
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {companies.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {companies.map((company) => (
            <Chip
              key={company}
              label={company}
              onDelete={() => handleRemoveCompany(company)}
              color="secondary"
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No blocked companies yet. Add a company to hide its jobs and recommendations.
        </Typography>
      )}
    </Box>
  );
};
