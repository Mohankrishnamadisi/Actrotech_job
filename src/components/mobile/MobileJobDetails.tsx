import React from 'react';
import { Box, Container, Card, CardContent, Typography, Button, Chip, Grid, Divider } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { MobileLayout } from '@components/layout/MobileLayout';
import { useAuthStore } from '@store/index';
import { ROUTES } from '@constants/index';
import Swal from 'sweetalert2';

interface JobDetailsProps {
  jobId?: string;
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  isSaved?: boolean;
  onApply?: () => void;
  onSave?: () => void;
}

export const MobileJobDetails: React.FC<JobDetailsProps> = ({
  jobId,
  title = 'Job Title',
  company = 'Company Name',
  location = 'Location',
  jobType = 'Full-time',
  salary = 'Not specified',
  description = '',
  requirements = [],
  benefits = [],
  isSaved = false,
  onApply,
  onSave,
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [saved, setSaved] = React.useState(isSaved);

  const handleApply = () => {
    if (!user) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to apply for this job',
        icon: 'info',
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        background: '#FFFFFF',
        color: '#172033',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(ROUTES.LOGIN);
        }
      });
      return;
    }

    if (onApply) {
      onApply();
    }
  };

  const handleSave = () => {
    if (!user) {
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to save jobs',
        icon: 'info',
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel',
        showCancelButton: true,
        background: '#FFFFFF',
        color: '#172033',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(ROUTES.LOGIN);
        }
      });
      return;
    }

    setSaved(!saved);
    if (onSave) {
      onSave();
    }
  };

  return (
    <MobileLayout>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.primary', textTransform: 'none' }}
          >
            Back
          </Button>
          <Button
            onClick={handleSave}
            startIcon={saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            sx={{ color: saved ? 'warning.main' : 'text.secondary' }}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </Box>

        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {company}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`📍 ${location}`} variant="outlined" size="small" />
              <Chip label={jobType} size="small" />
              <Chip label={`💰 ${salary}`} color="primary" variant="outlined" size="small" />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleApply}
                variant="contained"
                fullWidth
                sx={{ py: 1.25 }}
              >
                Apply Now
              </Button>
              <Button
                onClick={handleSave}
                variant="outlined"
                sx={{ py: 1.25 }}
              >
                <BookmarkBorderIcon />
              </Button>
            </Box>
          </CardContent>
        </Card>

        {description && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                About This Job
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {description}
              </Typography>
            </CardContent>
          </Card>
        )}

        {requirements.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Requirements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {requirements.map((req, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                      •
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {req}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {benefits.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Benefits
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {benefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                      ✓
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {benefit}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            onClick={handleApply}
            variant="contained"
            fullWidth
            size="large"
            sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem' }}
          >
            Apply Now
          </Button>
        </Box>
      </Container>
    </MobileLayout>
  );
};
