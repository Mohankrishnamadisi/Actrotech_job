import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Close as CloseIcon } from '@mui/icons-material';
import { jobService } from '@services/api';
import toast from 'react-hot-toast';

interface JobPostingFormProps {
  open: boolean;
  onClose: () => void;
  recruiterId: string;
  onJobCreated?: () => void;
}

export const JobPostingForm: React.FC<JobPostingFormProps> = ({ open, onClose, recruiterId, onJobCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    job_type: 'Full-Time',
    category: '',
    salary_min: '',
    salary_max: '',
    currency: 'INR',
    experience: '',
    education: '',
    application_deadline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Job title is required';
    if (!formData.description.trim()) return 'Job description is required';
    if (!formData.location.trim()) return 'Location is required';
    if (skills.length === 0) return 'At least one skill is required';
    if (!formData.category) return 'Job category is required';
    if (!formData.experience) return 'Experience level is required';
    if (!formData.education) return 'Education level is required';
    if (formData.salary_min && formData.salary_max && parseInt(formData.salary_min) > parseInt(formData.salary_max)) {
      return 'Minimum salary cannot be greater than maximum salary';
    }
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await jobService.createJob(recruiterId, {
        ...formData,
        skills,
        posted_by: recruiterId,
        status: 'published',
      });

      toast.success('Job posted successfully!');
      handleClose();
      onJobCreated?.();
    } catch (err) {
      console.error('Error posting job:', err);
      setError('Failed to post job. Please try again.');
      toast.error('Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      company: '',
      location: '',
      job_type: 'Full-Time',
      category: '',
      salary_min: '',
      salary_max: '',
      currency: 'INR',
      experience: '',
      education: '',
      application_deadline: '',
    });
    setSkills([]);
    setSkillInput('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 20 }}>Post a New Job</DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')} closable />}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior React Developer"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={5}
                placeholder="Describe the job responsibilities, requirements, and perks..."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Bangalore, India"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select name="job_type" value={formData.job_type} onChange={handleChange} label="Job Type">
                  <MenuItem value="Full-Time">Full-Time</MenuItem>
                  <MenuItem value="Part-Time">Part-Time</MenuItem>
                  <MenuItem value="Contract">Contract</MenuItem>
                  <MenuItem value="Internship">Internship</MenuItem>
                  <MenuItem value="Freelance">Freelance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select name="category" value={formData.category} onChange={handleChange} label="Category">
                  <MenuItem value="IT">IT & Software</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select name="experience" value={formData.experience} onChange={handleChange} label="Experience Level">
                  <MenuItem value="Fresher">Fresher</MenuItem>
                  <MenuItem value="0-1 years">0-1 years</MenuItem>
                  <MenuItem value="1-3 years">1-3 years</MenuItem>
                  <MenuItem value="3-5 years">3-5 years</MenuItem>
                  <MenuItem value="5-10 years">5-10 years</MenuItem>
                  <MenuItem value="10+ years">10+ years</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Education</InputLabel>
                <Select name="education" value={formData.education} onChange={handleChange} label="Education">
                  <MenuItem value="High School">High School</MenuItem>
                  <MenuItem value="Bachelor">Bachelor</MenuItem>
                  <MenuItem value="Master">Master</MenuItem>
                  <MenuItem value="PhD">PhD</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Salary"
                name="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={handleChange}
                InputProps={{ startAdornment: 'INR ' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Salary"
                name="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={handleChange}
                InputProps={{ startAdornment: 'INR ' }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add skill and press Enter"
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" onClick={handleAddSkill}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Application Deadline"
                name="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ minWidth: 120 }}
            endIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </Button>
        </DialogActions>
      </motion.div>
    </Dialog>
  );
};
