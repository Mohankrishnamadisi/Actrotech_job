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
  SelectChangeEvent,
  MenuItem,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { jobService } from '@services/api';
import toast from 'react-hot-toast';

const MotionBox = motion(Box);

interface JobPostingFormProps {
  open: boolean;
  onClose: () => void;
  recruiterId: string;
  onJobCreated?: () => void;
}

interface JobFormData {
  title: string;
  description: string;
  company_name: string;
  location: string;
  job_type: 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship' | 'Freelance';
  work_mode: 'Onsite' | 'Remote' | 'Hybrid';
  category: string;
  salary_min: string;
  salary_max: string;
  currency: string;
  experience: string;
  education: string;
  application_deadline: string;
  positions_available: string;
}

export const JobPostingForm: React.FC<JobPostingFormProps> = ({ open, onClose, recruiterId, onJobCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    company_name: '',
    location: '',
    job_type: 'Full-Time',
    work_mode: 'Onsite',
    category: '',
    salary_min: '',
    salary_max: '',
    currency: 'INR',
    experience: '',
    education: '',
    application_deadline: '',
    positions_available: '1',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const name = (e.target as HTMLInputElement).name;
    const value = e.target.value;
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

  const handleAddQuestion = () => {
    if (questionInput.trim() && !screeningQuestions.includes(questionInput.trim())) {
      setScreeningQuestions([...screeningQuestions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (question: string) => {
    setScreeningQuestions(screeningQuestions.filter((q) => q !== question));
  };

  const validateForm = () => {
    if (!formData.company_name.trim()) return 'Company name is required';
    if (!formData.title.trim()) return 'Job title is required';
    if (!formData.description.trim()) return 'Job description is required';
    if (!formData.location.trim()) return 'Location is required';
    if (!formData.job_type) return 'Job type is required';
    if (!formData.work_mode) return 'Work mode is required';
    if (!formData.positions_available || Number(formData.positions_available) <= 0) return 'Number of positions must be at least 1';
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
    if (!recruiterId) {
      setError('You must be signed in as a recruiter to post a job.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await jobService.createJob(recruiterId, {
        company_name: formData.company_name,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        job_type: formData.job_type,
        work_mode: formData.work_mode,
        category: formData.category,
        education: formData.education,
        application_deadline: formData.application_deadline,
        currency: formData.currency,
        salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? Number(formData.salary_max) : undefined,
        positions_available: formData.positions_available ? Number(formData.positions_available) : 1,
        experience: formData.experience,
        skills,
        screening_questions: screeningQuestions,
        posted_by: recruiterId,
        status: 'published',
      });

      toast.success('Job posted successfully!');
      handleClose();
      onJobCreated?.();
    } catch (err) {
      console.error('Error posting job:', err);
      const message =
        (err && (err as any).message) ||
        (err && (err as any).error && (err as any).error.message) ||
        JSON.stringify(err);
      setError(String(message));
      toast.error(String(message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      company_name: '',
      location: '',
      job_type: 'Full-Time',
      work_mode: 'Onsite',
      category: '',
      salary_min: '',
      salary_max: '',
      currency: 'INR',
      experience: '',
      education: '',
      application_deadline: '',
      positions_available: '1',
    });
    setSkills([]);
    setSkillInput('');
    setScreeningQuestions([]);
    setQuestionInput('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
          boxShadow: '0 30px 90px rgba(15, 23, 42, 0.12)',
        },
      }}
    >
      <MotionBox
        component="div"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: 22,
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 45%, #2563EB 100%)',
            color: '#FFFFFF',
            py: 2,
            textAlign: 'center',
            letterSpacing: 0.6,
            boxShadow: 'inset 0 -4px 0 rgba(255,255,255,0.18)',
          }}
        >
          Post a Job
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            py: 3,
            background: '#F8FAFC',
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(100,116,139,0.6) transparent',
            '&::-webkit-scrollbar': {
              width: 10,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(15, 23, 42, 0.04)',
              borderRadius: 5,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(100, 116, 139, 0.6)',
              borderRadius: 5,
            },
          }}
        >
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')} />}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g., Acme Solutions"
              />
            </Grid>

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
                <InputLabel>Work Mode</InputLabel>
                <Select name="work_mode" value={formData.work_mode} onChange={handleChange} label="Work Mode">
                  <MenuItem value="Onsite">Onsite</MenuItem>
                  <MenuItem value="Remote">Remote</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
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
                label="Number of Positions"
                name="positions_available"
                type="number"
                value={formData.positions_available}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                placeholder="1"
              />
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
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Custom Screening Questions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuestion();
                    }
                  }}
                  placeholder="Enter a screening question"
                />
                <Button variant="outlined" onClick={handleAddQuestion}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {screeningQuestions.map((question) => (
                  <Chip
                    key={question}
                    label={question}
                    onDelete={() => handleRemoveQuestion(question)}
                    color="secondary"
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
      </MotionBox>
    </Dialog>
  );
};
