import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Card,
  CardContent,
  Alert,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Block as BlockIcon,
  Add as AddIcon,
  Business as BusinessIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
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

  const handleClearAll = () => {
    setCompanies([]);
    saveBlockedCompanies([]);
    toast.success('All blocks removed.');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockIcon sx={{ color: '#EF4444' }} />
          Blocked Companies
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Block companies you no longer want to see in your recommendations or notifications.
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert
        variant="outlined"
        severity="warning"
        sx={{
          mb: 4,
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}
      >
        <Typography variant="body2">
          Blocked companies will not appear in your job recommendations. You can remove blocks at any time.
        </Typography>
      </Alert>

      {/* Add Company Section */}
      <Card
        variant="outlined"
        sx={{
          mb: 4,
          borderColor: 'rgba(239, 68, 68, 0.2)',
          backgroundColor: 'rgba(239, 68, 68, 0.03)',
        }}
      >
        <CardContent>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#EF4444',
            }}
          >
            <BusinessIcon sx={{ fontSize: 20 }} />
            Add Company to Block
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="Company name or domain"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCompany();
                }
              }}
              placeholder="Example: Acme Corp or acme.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ color: '#EF4444', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddCompany}
              sx={{
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
              }}
              startIcon={<AddIcon />}
            >
              Block
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Blocked Companies List */}
      <Card
        variant="outlined"
        sx={{
          borderColor: companies.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'divider',
          backgroundColor: companies.length > 0 ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: companies.length > 0 ? '#EF4444' : 'text.secondary',
              }}
            >
              <BlockIcon sx={{ fontSize: 20 }} />
              {companies.length > 0 ? `Blocked Companies (${companies.length})` : 'No Blocked Companies'}
            </Typography>
            {companies.length > 0 && (
              <Button
                size="small"
                variant="text"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleClearAll}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            )}
          </Box>

          {companies.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {companies.map((company) => (
                <Chip
                  key={company}
                  label={company}
                  onDelete={() => handleRemoveCompany(company)}
                  icon={<BusinessIcon />}
                  sx={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    borderColor: '#EF4444',
                    border: '1px solid',
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      color: 'inherit',
                      '&:hover': {
                        color: '#DC2626',
                      },
                    },
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
              }}
            >
              <BlockIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No blocked companies yet. Add a company to hide its jobs and recommendations.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
