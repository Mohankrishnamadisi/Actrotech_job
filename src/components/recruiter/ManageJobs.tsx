import React, { useEffect, useMemo, useState } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  SettingsSuggest as SettingsSuggestIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  LocationOn as LocationOnIcon,
  WorkOutline as WorkOutlineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { jobService } from '@services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { Job } from '../../types';
import { DeleteActionButton } from '@components/common/DeleteActionButton';
import { JobAutomationPanel } from '@components/recruiter/RecruiterAutomationCenter';

interface ManageJobsProps {
  recruiterId: string;
  onJobsChange?: () => void;
}

export const ManageJobs: React.FC<ManageJobsProps> = ({ recruiterId, onJobsChange }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [automationJob, setAutomationJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const jobsPerPage = 8;

  useEffect(() => {
    fetchJobs();
  }, [recruiterId]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getRecruiterJobs(recruiterId);
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (job: Job) => {
    setEditingJob(job);
    setEditFormData(job);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setDeleteConfirmOpen(true);
  };

  const handleAutomationClick = (job: Job) => {
    setAutomationJob(job);
    setAutomationDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingJob) return;

    try {
      await jobService.updateJob(editingJob.id, editFormData);
      toast.success('Job updated successfully!');
      setEditDialogOpen(false);
      fetchJobs();
      onJobsChange?.();
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error('Failed to update job');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await jobService.deleteJob(selectedJobId);
      toast.success('Job deleted successfully!');
      setDeleteConfirmOpen(false);
      fetchJobs();
      onJobsChange?.();
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job');
    }
  };

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !query || [job.title, job.location, job.job_type, job.work_mode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || String(job.status).toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  const paginatedJobs = useMemo(
    () => filteredJobs.slice((page - 1) * jobsPerPage, page * jobsPerPage),
    [filteredJobs, page]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const pageCount = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
    if (page > pageCount) setPage(pageCount);
  }, [filteredJobs.length, page]);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">
            No jobs posted yet. Create your first job posting!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ mb: 2, p: { xs: 2, md: 2.5 }, borderRadius: 3, color: '#fff', background: 'linear-gradient(120deg, #091324 0%, #16335F 58%, #28508A 100%)', position: 'relative', overflow: 'hidden', boxShadow: '0 14px 30px rgba(9,19,36,0.16)' }}>
        <Box sx={{ position: 'absolute', right: -30, top: -65, width: 190, height: 190, borderRadius: '50%', border: '1px solid rgba(125,211,252,0.25)', boxShadow: '0 0 0 20px rgba(125,211,252,0.04), 0 0 0 40px rgba(125,211,252,0.025)' }} />
        <Typography variant="overline" sx={{ color: '#7DD3FC', fontWeight: 800, letterSpacing: '0.12em', position: 'relative' }}>Job board</Typography>
        <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: '1.35rem', md: '1.6rem' }, color: '#fff', position: 'relative' }}>Manage your hiring pipeline</Typography>
        <Typography variant="body2" sx={{ mt: 0.4, color: 'rgba(226,232,240,0.76)', position: 'relative' }}>
          {jobs.length} posted roles · {jobs.filter((job) => job.status === 'published').length} currently live
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid rgba(148,163,184,0.18)', boxShadow: '0 20px 50px rgba(15,23,42,0.06)' }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850, color: '#0f172a' }}>Posted roles</Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>Showing {filteredJobs.length ? (page - 1) * jobsPerPage + 1 : 0}-{Math.min(page * jobsPerPage, filteredJobs.length)} of {filteredJobs.length}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search jobs"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                sx={{ minWidth: { xs: 0, md: 240 }, flex: { xs: 1, md: 'initial' }, '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#64748B' }} /></InputAdornment> }}
              />
              <FormControl size="small" sx={{ minWidth: 145 }}>
                <InputLabel id="job-status-filter-label"><FilterListIcon sx={{ fontSize: 15, verticalAlign: 'middle', mr: 0.4 }} />Status</InputLabel>
                <Select labelId="job-status-filter-label" value={statusFilter} label="Status" onChange={(event) => setStatusFilter(event.target.value)}>
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2.5, overflowX: 'auto', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)' }}>
                  <TableCell sx={{ fontWeight: 800, width: '30%' }}>Job Title</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '16%' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '18%' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '13%' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '13%' }}>Posted</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '10%' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    hover
                    sx={{
                      '&:nth-of-type(even)': { backgroundColor: '#FBFDFF' },
                      '&:hover': { backgroundColor: '#F1F7FF !important' },
                      '& td': { borderBottomColor: '#E7EEF7' },
                    }}
                  >
                    <TableCell sx={{ borderLeft: '3px solid transparent', '&:hover': { borderLeftColor: '#28508A' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ width: 34, height: 34, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: 1.5, color: '#1D4B86', background: 'linear-gradient(135deg, #DCEBFF, #BBD7FF)', fontWeight: 900, fontSize: '0.82rem' }}>
                          {String(job.title || 'J').charAt(0).toUpperCase()}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: '#102A50', fontSize: '0.84rem', lineHeight: 1.25 }} noWrap>{job.title}</Typography>
                          <Typography sx={{ color: '#8090A5', fontSize: '0.67rem', mt: 0.3 }}>Hiring role</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55, color: '#49627F', fontSize: '0.76rem' }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: '#5B8CFF' }} />
                        <span>{job.location || 'Not specified'}</span>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.45 }}>
                        <Chip icon={<WorkOutlineIcon sx={{ fontSize: '14px !important' }} />} label={job.job_type} size="small" variant="outlined" sx={{ minWidth: 102, height: 25, borderColor: '#C8D8EA', color: '#294A72', bgcolor: '#F8FBFF', fontSize: '0.68rem', fontWeight: 800, '& .MuiChip-label': { px: 0.8 } }} />
                        {job.work_mode && (
                          <Chip label={job.work_mode} size="small" variant="outlined" sx={{ minWidth: 102, height: 25, borderColor: '#D3E5E3', color: '#087F73', bgcolor: '#F3FCFA', fontSize: '0.68rem', fontWeight: 800, '& .MuiChip-label': { px: 0.8 } }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={job.status === 'published' ? 'success' : 'warning'}
                        variant="filled"
                        sx={{ fontWeight: 800, textTransform: 'capitalize', bgcolor: job.status === 'published' ? '#E2F7F1' : '#FFF4D8', color: job.status === 'published' ? '#087F73' : '#9A6700', border: '1px solid', borderColor: job.status === 'published' ? '#B7E9DA' : '#F5D58A' }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#49627F', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      {format(new Date(job.created_at ?? job.createdAt ?? new Date().toISOString()), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.35, p: 0.35, borderRadius: 1.5, bgcolor: '#F4F7FB', border: '1px solid #E4EBF4' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(job)}
                        title="Edit job"
                        sx={{ color: '#28508A', transition: 'transform 0.2s ease, background-color 0.2s ease', '&:hover': { bgcolor: '#DCEBFF', transform: 'translateY(-2px) scale(1.08)' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleAutomationClick(job)}
                        title="Job automations"
                        sx={{ color: '#087F73', transition: 'transform 0.2s ease, background-color 0.2s ease', '&:hover': { bgcolor: '#DDF7F0', transform: 'translateY(-2px) scale(1.08)' } }}
                      >
                        <SettingsSuggestIcon fontSize="small" />
                      </IconButton>
                      <Box sx={{ '& button': { width: 32, height: 32, bgcolor: 'transparent', color: '#C2414C', '&:hover': { bgcolor: '#FDE7E9' } } }}>
                        <DeleteActionButton onClick={() => handleDeleteClick(job.id)} ariaLabel="Delete job" />
                      </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                      <SearchIcon sx={{ fontSize: 34, color: '#94A3B8', mb: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#64748B' }}>No jobs match your search or filter.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredJobs.length > jobsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={Math.ceil(filteredJobs.length / jobsPerPage)} page={page} onChange={(_, value) => setPage(value)} color="primary" shape="rounded" size="small" />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Job Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Job Title"
              value={editFormData.title || ''}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="Location"
              value={editFormData.location || ''}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={(editFormData.job_type as string) || ''}
                label="Job Type"
                onChange={(e) => setEditFormData({ ...editFormData, job_type: e.target.value as Job['job_type'] })}
              >
                <MenuItem value="Full-Time">Full-Time</MenuItem>
                <MenuItem value="Part-Time">Part-Time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
                <MenuItem value="Freelance">Freelance</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Work Mode</InputLabel>
              <Select
                value={(editFormData.work_mode as string) || ''}
                label="Work Mode"
                onChange={(e) => setEditFormData({ ...editFormData, work_mode: e.target.value as Job['work_mode'] })}
              >
                <MenuItem value="Onsite">Onsite</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
                <MenuItem value="Hybrid">Hybrid</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Job?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this job? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={automationDialogOpen} onClose={() => setAutomationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Job Automation</DialogTitle>
        <DialogContent dividers>
          {automationJob && (
            <JobAutomationPanel
              recruiterId={recruiterId}
              jobId={String(automationJob.id)}
              jobTitle={String(automationJob.title || 'Untitled Job')}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutomationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
