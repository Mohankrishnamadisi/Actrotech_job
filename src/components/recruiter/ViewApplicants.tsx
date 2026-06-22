import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { jobService, applicationService } from '@services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ViewApplicantsProps {
  recruiterId: string;
  onChatClick?: (candidateId: string, candidateName: string) => void;
}

interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

interface Applicant {
  id: string;
  job_id: string;
  user_id: string;
  resume_url: string;
  cover_letter: string;
  status: string;
  applied_at: string;
  profiles?: { name: string; email: string };
  [key: string]: unknown;
}

export const ViewApplicants: React.FC<ViewApplicantsProps> = ({ recruiterId, onChatClick }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [recruiterId]);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplicants();
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getRecruiterJobs(recruiterId);
      setJobs(data || []);
      if (data && data.length > 0) {
        setSelectedJobId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      toast.error('Failed to fetch jobs');
    }
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const data = await applicationService.getJobApplications(selectedJobId);
      setApplicants(data || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      toast.error('Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await applicationService.updateApplicationStatus(applicationId, newStatus);
      toast.success(`Application status changed to ${newStatus}`);
      fetchApplicants();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update application status');
    }
  };

  const handleViewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setViewDialogOpen(true);
  };

  const filteredApplicants = applicants.filter((app) =>
    statusFilter === 'all' ? true : app.status === statusFilter
  );

  const statusCounts = {
    applied: applicants.filter((a) => a.status === 'applied').length,
    under_review: applicants.filter((a) => a.status === 'under_review').length,
    shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    rejected: applicants.filter((a) => a.status === 'rejected').length,
    accepted: applicants.filter((a) => a.status === 'accepted').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'shortlisted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'accepted':
        return 'success';
      default:
        return 'default';
    }
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No jobs posted yet. Post a job first to view applicants.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            View Applicants
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <Card
                sx={{
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
                    Jobs ordered by post date
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    {jobs.map((job) => (
                      <Box
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: selectedJobId === job.id ? '1px solid #1D4ED8' : '1px solid rgba(148, 163, 184, 0.24)',
                          backgroundColor: selectedJobId === job.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.06)',
                          },
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {job.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Posted {format(new Date(job.created_at), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={8}>
              <Card
                sx={{
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                      Selected job
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedJob.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {selectedJob.status ? `${selectedJob.status} • ` : ''}
                      Posted {format(new Date(selectedJob.created_at), 'dd MMM yyyy')} • {applicants.length}{' '}
                      applicant(s)
                    </Typography>
                  </Box>

                  <Tabs
                    value={statusFilter}
                    onChange={(_, value) => setStatusFilter(value)}
                    sx={{ mb: 2, borderBottom: '1px solid #e0e0e0' }}
                  >
                    <Tab
                      label={`All (${applicants.length})`}
                      value="all"
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      label={`Applied (${statusCounts.applied})`}
                      value="applied"
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      label={`Under Review (${statusCounts.under_review})`}
                      value="under_review"
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      label={`Shortlisted (${statusCounts.shortlisted})`}
                      value="shortlisted"
                      sx={{ textTransform: 'none' }}
                    />
                    <Tab
                      label={`Rejected (${statusCounts.rejected})`}
                      value="rejected"
                      sx={{ textTransform: 'none' }}
                    />
                  </Tabs>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredApplicants.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No applicants with status "{statusFilter}"
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applied</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplicants.map((applicant) => (
                    <TableRow key={applicant.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500 }}>
                          {applicant.profiles?.name || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>{applicant.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={applicant.status}
                          size="small"
                          color={getStatusColor(applicant.status) as any}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{format(new Date(applicant.applied_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleViewApplicant(applicant)}
                          title="View details"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        {applicant.resume_url && (
                          <IconButton
                            size="small"
                            href={applicant.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download resume"
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => onChatClick?.(applicant.user_id, applicant.profiles?.name || 'Candidate')}
                          title="Send message"
                        >
                          <MessageIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Applicant Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Applicant Details</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedApplicant && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Name
                </Typography>
                <Typography>{selectedApplicant.profiles?.name || 'Unknown'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Email
                </Typography>
                <Typography>{selectedApplicant.profiles?.email || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Status
                </Typography>
                <Chip label={selectedApplicant.status} color={getStatusColor(selectedApplicant.status) as any} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Cover Letter
                </Typography>
                <Typography>{selectedApplicant.cover_letter || 'No cover letter provided'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Applied On
                </Typography>
                <Typography>{format(new Date(selectedApplicant.applied_at), 'dd MMM yyyy hh:mm a')}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedApplicant && (
            <>
              <Button
                color="success"
                variant="outlined"
                onClick={() => {
                  handleStatusChange(selectedApplicant.id, 'shortlisted');
                  setViewDialogOpen(false);
                }}
              >
                Shortlist
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  handleStatusChange(selectedApplicant.id, 'rejected');
                  setViewDialogOpen(false);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
