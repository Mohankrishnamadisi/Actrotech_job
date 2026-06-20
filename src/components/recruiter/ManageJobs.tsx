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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { jobService } from '@services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ManageJobsProps {
  recruiterId: string;
  onJobsChange?: () => void;
}

interface Job {
  id: string;
  title: string;
  location: string;
  job_type: string;
  status: string;
  created_at: string;
  description: string;
  skills: string[];
  experience: string;
  education: string;
  [key: string]: unknown;
}

export const ManageJobs: React.FC<ManageJobsProps> = ({ recruiterId, onJobsChange }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});

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

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await jobService.updateJob(jobId, { status: newStatus });
      toast.success(`Job status changed to ${newStatus}`);
      fetchJobs();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update job status');
    }
  };

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
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Manage Posted Jobs ({jobs.length})
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Job Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Posted</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>{job.title}</Typography>
                    </TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      <Chip label={job.job_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={job.status === 'published' ? 'success' : 'warning'}
                        variant={job.status === 'published' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(job.created_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(job)}
                        title="Edit job"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(job.id)}
                        title="Delete job"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
    </motion.div>
  );
};
