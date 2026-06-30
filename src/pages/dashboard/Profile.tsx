import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Avatar,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Switch,
  Chip,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  LinkedIn as LinkedInIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { ProfileSkeleton } from '@components/common/LoadingSkeleton';
import { useAuthStore } from '@store/index';
import { userService } from '@services/api';
import { EXPERIENCE_LEVELS, GENDER_OPTIONS, INDIAN_STATES } from '@constants/index';
import { calculateProfileCompletion, getProfileCompletionGradient } from '../../utils/index';
import { generatePreferredJobTitleSuggestions } from '../../utils/titleSuggestions';
import { formatExperienceString, getTotalExperienceMonths, parseExperienceStringParts } from '../../utils/experience';
import { DeleteActionButton } from '@components/common/DeleteActionButton';
import toast from 'react-hot-toast';
import type { Certification, Project, Education, WorkExperience } from '../../types';

const MotionPaper = motion(Paper);

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>{value === index && children}</Box>
);

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [preferredTitleInput, setPreferredTitleInput] = useState('');
  const [preferredTitleSuggestions, setPreferredTitleSuggestions] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    bio: '',
    currentDesignation: '',
    isFresher: false,
    experience: '',
    experienceYears: '' as string | number,
    experienceMonths: '' as string | number,
    skills: [] as string[],
    preferredJobTitles: [] as string[],
    education: [] as Education[],
    workExperience: [] as WorkExperience[],
    certifications: [] as Certification[],
    projects: [] as Project[],
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
  });

  const [newEducation, setNewEducation] = useState({ degree: '', school: '', year: '' });
  const [newWorkExp, setNewWorkExp] = useState({ company: '', position: '', duration: '', description: '' });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });
  const [newProject, setNewProject] = useState({ title: '', description: '', url: '' });
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [editingWorkExpId, setEditingWorkExpId] = useState<string | null>(null);
  const [educationDialogOpen, setEducationDialogOpen] = useState(false);
  const [workExpDialogOpen, setWorkExpDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        if (profile) {
          const parsedExperience = parseExperienceStringParts(profile.experience || '');
          setFormData({
            fullName: profile.name || user.name,
            email: profile.email || user.email,
            phone: profile.phone || '',
            gender: profile.gender || '',
            dateOfBirth: profile.date_of_birth || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            country: profile.country || 'India',
            bio: profile.bio || '',
            currentDesignation: profile.current_designation || profile.currentDesignation || '',
            isFresher: profile.is_fresher || profile.isFresher || false,
            experience:
              profile.is_fresher || profile.isFresher
                ? 'Fresher'
                : profile.experience || formatExperienceString(profile.experience_years, profile.experience_months),
            experienceYears:
              profile.experience_years != null
                ? profile.experience_years
                : parsedExperience.years ?? '',
            experienceMonths:
              profile.experience_months != null
                ? profile.experience_months
                : parsedExperience.months ?? '',
            skills: profile.skills || [],
            preferredJobTitles: profile.preferred_job_titles || [],
            education: profile.education_details || [],
            workExperience: profile.work_experience || [],
            certifications: profile.certifications || [],
            projects: profile.projects || [],
            linkedinUrl: profile.linkedin_url || '',
            portfolioUrl: profile.portfolio_url || '',
            githubUrl: profile.github_url || '',
          });
          setProfileImageUrl(profile.profile_image_url || '');
          setResumeUrl(profile.resume_url || '');
        }
      } catch {
        // Profile may not exist yet
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.id, user?.name, user?.email]);

  useEffect(() => {
    const suggestions = generatePreferredJobTitleSuggestions({
      skills: formData.skills,
      experience: formData.experience,
      profileBio: formData.bio,
    }).filter(
      (title: string) => !formData.preferredJobTitles.some((selected) => selected.toLowerCase() === title.toLowerCase())
    );
    setPreferredTitleSuggestions(suggestions.slice(0, 10));
  }, [formData.skills, formData.experience, formData.bio, formData.preferredJobTitles]);

  const completion = calculateProfileCompletion({
    fullName: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    gender: formData.gender,
    dateOfBirth: formData.dateOfBirth,
    address: formData.address,
    city: formData.city,
    state: formData.state,
    country: formData.country,
    bio: formData.bio,
    experience: formData.experience,
    skills: formData.skills,
    education: formData.education,
    workExperience: formData.workExperience,
    resumeUrl: resumeUrl || resume,
    socialLinks: formData.linkedinUrl || formData.portfolioUrl,
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target as { name?: string; value: unknown };
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target as { name?: string; checked: boolean };
    if (!name) return;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
      experience:
        name === 'isFresher'
          ? checked
            ? 'Fresher'
            : formatExperienceString(prev.experienceYears, prev.experienceMonths)
          : prev.experience,
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target as { name?: string; value: unknown };
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPreferredTitle = (title: string) => {
    const normalized = title.trim();
    if (!normalized) return;
    setFormData((prev) => {
      const existing = prev.preferredJobTitles.map((item) => item.toLowerCase());
      if (existing.includes(normalized.toLowerCase())) return prev;
      if (prev.preferredJobTitles.length >= 20) return prev;
      return { ...prev, preferredJobTitles: [...prev.preferredJobTitles, normalized] };
    });
  };

  const removePreferredTitle = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredJobTitles: prev.preferredJobTitles.filter((item) => item.toLowerCase() !== title.toLowerCase()),
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      let newResumeUrl = resumeUrl;
      let newImageUrl = profileImageUrl;

      if (resume) newResumeUrl = await userService.uploadResume(user.id, resume);
      if (profileImage) newImageUrl = await userService.uploadProfileImage(user.id, profileImage);

      const updatedProfile = await userService.updateProfile(user.id, {
        name: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        bio: formData.bio,
        current_designation: formData.currentDesignation,
        is_fresher: formData.isFresher,
        experience: formData.isFresher ? 'Fresher' : formatExperienceString(formData.experienceYears, formData.experienceMonths),
        experience_years: formData.isFresher ? 0 : Number(formData.experienceYears) || 0,
        experience_months: formData.isFresher ? 0 : Number(formData.experienceMonths) || 0,
        total_experience_months: formData.isFresher
          ? 0
          : getTotalExperienceMonths(formData.experienceYears, formData.experienceMonths),
        skills: formData.skills,
        preferred_job_titles: formData.preferredJobTitles,
        education_details: formData.education,
        work_experience: formData.workExperience,
        certifications: formData.certifications,
        projects: formData.projects,
        linkedin_url: formData.linkedinUrl,
        portfolio_url: formData.portfolioUrl,
        github_url: formData.githubUrl,
        resume_url: newResumeUrl,
        profile_image_url: newImageUrl,
      });

      setResumeUrl(updatedProfile.resume_url || updatedProfile.resumeUrl || newResumeUrl);
      setProfileImageUrl(updatedProfile.profile_image_url || updatedProfile.profileImageUrl || newImageUrl);
      setFormData((prev) => ({
        ...prev,
        fullName: updatedProfile.name || prev.fullName,
        phone: updatedProfile.phone || prev.phone,
        gender: updatedProfile.gender || prev.gender,
        dateOfBirth: updatedProfile.date_of_birth || updatedProfile.dateOfBirth || prev.dateOfBirth,
        address: updatedProfile.address || prev.address,
        city: updatedProfile.city || prev.city,
        state: updatedProfile.state || prev.state,
        country: updatedProfile.country || prev.country,
        bio: updatedProfile.bio || prev.bio,
        currentDesignation: updatedProfile.current_designation || updatedProfile.currentDesignation || prev.currentDesignation,
        experience: updatedProfile.experience || prev.experience,
        experienceYears:
          updatedProfile.experience_years != null
            ? updatedProfile.experience_years
            : parseExperienceStringParts(updatedProfile.experience || prev.experience).years ?? prev.experienceYears,
        experienceMonths:
          updatedProfile.experience_months != null
            ? updatedProfile.experience_months
            : parseExperienceStringParts(updatedProfile.experience || prev.experience).months ?? prev.experienceMonths,
        skills: updatedProfile.skills || prev.skills,
        preferredJobTitles: updatedProfile.preferred_job_titles || updatedProfile.preferredJobTitles || prev.preferredJobTitles,
        education: updatedProfile.education_details || updatedProfile.education || prev.education,
        workExperience: updatedProfile.work_experience || updatedProfile.workExperience || prev.workExperience,
        certifications: updatedProfile.certifications || prev.certifications,
        projects: updatedProfile.projects || prev.projects,
        linkedinUrl: updatedProfile.linkedin_url || updatedProfile.linkedinUrl || prev.linkedinUrl,
        portfolioUrl: updatedProfile.portfolio_url || updatedProfile.portfolioUrl || prev.portfolioUrl,
        githubUrl: updatedProfile.github_url || updatedProfile.githubUrl || prev.githubUrl,
      }));
      setUser({ ...user, name: formData.fullName, avatar: newImageUrl || user.avatar });
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <ProfileSkeleton />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>My Profile</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Complete your profile to help employers find you
          </Typography>
          <Card
            sx={{
              p: 3,
              borderRadius: 3,
              background: getProfileCompletionGradient(completion),
              color: '#fff',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>Profile Completion</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Optional fields like social links, projects, certifications, and work experience do not block 100% completion.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>{completion}%</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {completion === 100 ? 'Perfect profile' : completion < 60 ? 'Add more details' : 'Almost there'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', mb: 1 }}>
              <Box
                sx={{
                  width: `${completion}%`,
                  height: '100%',
                  background: 'rgba(255,255,255,0.95)',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Card>
        </Box>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={profileImage ? URL.createObjectURL(profileImage) : profileImageUrl}
                  sx={{
                    width: 100, height: 100, mx: 'auto', mb: 2,
                    background: '#1D4ED8',
                    fontSize: '2.5rem', border: '3px solid #DBEAFE',
                  }}
                >
                  {formData.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <input type="file" id="profile-image" accept="image/*" hidden
                  onChange={(e) => e.target.files?.[0] && setProfileImage(e.target.files[0])} />
                <Button component="label" htmlFor="profile-image" variant="outlined" size="small"
                  startIcon={<CloudUploadIcon />}>Upload Photo (Optional)</Button>
              </Box>

              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
                <Tab label="Personal" />
                <Tab label="Education & Experience" />
                <Tab label="Skills & Projects" />
                <Tab label="Resume & Links" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" name="email" value={formData.email} disabled />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select name="gender" value={formData.gender} onChange={handleSelectChange} label="Gender">
                        {GENDER_OPTIONS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date of Birth" name="dateOfBirth" type="date"
                      value={formData.dateOfBirth} onChange={handleInputChange} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleInputChange} multiline rows={2} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select name="state" value={formData.state} onChange={handleSelectChange} label="State">
                        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Country" name="country" value={formData.country} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Current Designation" name="currentDesignation" value={formData.currentDesignation} onChange={handleInputChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Bio" name="bio" multiline rows={3} value={formData.bio}
                      onChange={handleInputChange} placeholder="Tell employers about yourself..." />
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Experience</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFresher}
                          onChange={handleToggleChange}
                          name="isFresher"
                          color="primary"
                        />
                      }
                      label="I am a Fresher"
                    />
                  </Box>
                  {!formData.isFresher ? (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Years</InputLabel>
                          <Select
                            name="experienceYears"
                            value={formData.experienceYears}
                            onChange={handleSelectChange}
                            label="Years"
                          >
                            {Array.from({ length: 31 }, (_, i) => i).map((years) => (
                              <MenuItem key={years} value={years}>
                                {years}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Months</InputLabel>
                          <Select
                            name="experienceMonths"
                            value={formData.experienceMonths}
                            onChange={handleSelectChange}
                            label="Months"
                          >
                            {Array.from({ length: 12 }, (_, i) => i).map((months) => (
                              <MenuItem key={months} value={months}>
                                {months}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pt: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Total Experience
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatExperienceString(formData.experienceYears, formData.experienceMonths) || 'Not specified'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  ) : (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Select Fresher if you have no prior work experience. This will save your profile as a fresher and skip the years/months fields.
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Education</Typography>
                    <Button size="small" variant="contained" onClick={() => { setNewEducation({ degree: '', school: '', year: '' }); setEditingEducationId(null); setEducationDialogOpen(true); }}>Add</Button>
                  </Box>
                  {formData.education.map((edu) => (
                    <MotionPaper key={edu.id} elevation={1} sx={{ p: 2, mb: 1 }} whileHover={{ scale: 1.01 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{edu.degree}</Typography>
                          <Typography variant="body2" color="text.secondary">{edu.school} · {edu.year}</Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => { setNewEducation(edu); setEditingEducationId(edu.id); setEducationDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          <DeleteActionButton onClick={() => setFormData((p) => ({ ...p, education: p.education.filter((e) => e.id !== edu.id) }))} ariaLabel="Delete education" />
                        </Box>
                      </Box>
                    </MotionPaper>
                  ))}
                </Box>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Work Experience</Typography>
                    <Button size="small" variant="contained" onClick={() => { setNewWorkExp({ company: '', position: '', duration: '', description: '' }); setEditingWorkExpId(null); setWorkExpDialogOpen(true); }}>Add</Button>
                  </Box>
                  {formData.workExperience.map((exp) => (
                    <MotionPaper key={exp.id} elevation={1} sx={{ p: 2, mb: 1 }} whileHover={{ scale: 1.01 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{exp.position}</Typography>
                          <Typography variant="body2" color="text.secondary">{exp.company} · {exp.duration}</Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => { setNewWorkExp({ company: exp.company, position: exp.position, duration: exp.duration, description: exp.description || '' }); setEditingWorkExpId(exp.id); setWorkExpDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          <DeleteActionButton onClick={() => setFormData((p) => ({ ...p, workExperience: p.workExperience.filter((e) => e.id !== exp.id) }))} ariaLabel="Delete work experience" />
                        </Box>
                      </Box>
                    </MotionPaper>
                  ))}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <TextField fullWidth size="small" placeholder="Add a skill..." value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), skillInput.trim() && setFormData((p) => ({ ...p, skills: [...p.skills, skillInput.trim()] })), setSkillInput(''))} />
                    <Button variant="contained" onClick={() => { if (skillInput.trim()) { setFormData((p) => ({ ...p, skills: [...p.skills, skillInput.trim()] })); setSkillInput(''); } }}>Add</Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {formData.skills.map((skill) => (
                      <Chip key={skill} label={skill} color="primary" icon={<CheckIcon />}
                        onDelete={() => setFormData((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Preferred Job Titles</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Add the titles you want to be matched with. Use suggestions or enter your own.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add a preferred title..."
                      value={preferredTitleInput}
                      onChange={(e) => setPreferredTitleInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(),
                        preferredTitleInput.trim() &&
                          (addPreferredTitle(preferredTitleInput), setPreferredTitleInput('')))
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (preferredTitleInput.trim()) {
                          addPreferredTitle(preferredTitleInput);
                          setPreferredTitleInput('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {formData.preferredJobTitles.map((title) => (
                      <Chip
                        key={title}
                        label={title}
                        color="secondary"
                        onDelete={() => removePreferredTitle(title)}
                      />
                    ))}
                    <Chip label={`${formData.preferredJobTitles.length}/20 selected`} size="small" variant="outlined" />
                  </Box>
                  {preferredTitleSuggestions.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {preferredTitleSuggestions.length} suggested title{preferredTitleSuggestions.length === 1 ? '' : 's'} available
                      </Typography>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Suggested Titles</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {preferredTitleSuggestions.map((suggestion) => (
                          <Chip
                            key={suggestion}
                            label={suggestion}
                            variant="outlined"
                            onClick={() => addPreferredTitle(suggestion)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Certifications</Typography>
                    <Button size="small" variant="contained" onClick={() => { setNewCert({ name: '', issuer: '', year: '' }); setCertDialogOpen(true); }}>Add</Button>
                  </Box>
                  {formData.certifications.map((cert) => (
                    <MotionPaper key={cert.id} elevation={1} sx={{ p: 2, mb: 1 }} whileHover={{ scale: 1.01 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{cert.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{cert.issuer} · {cert.year}</Typography>
                        </Box>
                        <DeleteActionButton onClick={() => setFormData((p) => ({ ...p, certifications: p.certifications.filter((c) => c.id !== cert.id) }))} ariaLabel="Delete certification" />
                      </Box>
                    </MotionPaper>
                  ))}
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Projects</Typography>
                    <Button size="small" variant="contained" onClick={() => { setNewProject({ title: '', description: '', url: '' }); setProjectDialogOpen(true); }}>Add</Button>
                  </Box>
                  {formData.projects.map((proj) => (
                    <MotionPaper key={proj.id} elevation={1} sx={{ p: 2, mb: 1 }} whileHover={{ scale: 1.01 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{proj.title}</Typography>
                          <Typography variant="body2" color="text.secondary">{proj.description}</Typography>
                        </Box>
                        <DeleteActionButton onClick={() => setFormData((p) => ({ ...p, projects: p.projects.filter((pr) => pr.id !== proj.id) }))} ariaLabel="Delete project" />
                      </Box>
                    </MotionPaper>
                  ))}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Box sx={{ mb: 4, p: 3, border: '2px dashed', borderColor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
                  <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" hidden
                    onChange={(e) => e.target.files?.[0] && setResume(e.target.files[0])} />
                  <Button component="label" htmlFor="resume-upload" variant="contained" startIcon={<CloudUploadIcon />}>Upload Resume</Button>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>PDF or Word (Max 10MB)</Typography>
                  {(resume || resumeUrl) && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                      ✓ {resume?.name || 'Resume uploaded'}
                    </Typography>
                  )}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Social Links</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="LinkedIn URL" name="linkedinUrl" value={formData.linkedinUrl}
                      onChange={handleInputChange} InputProps={{ startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'primary.main' }} /> }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Portfolio URL" name="portfolioUrl" value={formData.portfolioUrl}
                      onChange={handleInputChange} InputProps={{ startAdornment: <LanguageIcon sx={{ mr: 1, color: 'primary.main' }} /> }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="GitHub URL" name="githubUrl" value={formData.githubUrl} onChange={handleInputChange} />
                  </Grid>
                </Grid>
              </TabPanel>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        <Dialog open={educationDialogOpen} onClose={() => setEducationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingEducationId ? 'Edit Education' : 'Add Education'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField fullWidth label="Degree" value={newEducation.degree} onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="School/University" value={newEducation.school} onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Year" type="number" value={newEducation.year} onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEducationDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (!newEducation.degree || !newEducation.school || !newEducation.year) return toast.error('Fill all fields');
              if (editingEducationId) {
                setFormData((p) => ({ ...p, education: p.education.map((e) => e.id === editingEducationId ? { ...e, ...newEducation } : e) }));
              } else {
                setFormData((p) => ({ ...p, education: [...p.education, { id: Date.now().toString(), ...newEducation }] }));
              }
              setEducationDialogOpen(false);
            }}>Save</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={workExpDialogOpen} onClose={() => setWorkExpDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingWorkExpId ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField fullWidth label="Company" value={newWorkExp.company} onChange={(e) => setNewWorkExp({ ...newWorkExp, company: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Designation / Position" value={newWorkExp.position} onChange={(e) => setNewWorkExp({ ...newWorkExp, position: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Duration" value={newWorkExp.duration} onChange={(e) => setNewWorkExp({ ...newWorkExp, duration: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Description" multiline rows={3} value={newWorkExp.description} onChange={(e) => setNewWorkExp({ ...newWorkExp, description: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkExpDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (!newWorkExp.company || !newWorkExp.position || !newWorkExp.duration) return toast.error('Fill required fields');
              if (editingWorkExpId) {
                setFormData((p) => ({ ...p, workExperience: p.workExperience.map((e) => e.id === editingWorkExpId ? { ...e, ...newWorkExp } : e) }));
              } else {
                setFormData((p) => ({ ...p, workExperience: [...p.workExperience, { id: Date.now().toString(), ...newWorkExp }] }));
              }
              setWorkExpDialogOpen(false);
            }}>Save</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={certDialogOpen} onClose={() => setCertDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Certification</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField fullWidth label="Certification Name" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Issuer" value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Year" value={newCert.year} onChange={(e) => setNewCert({ ...newCert, year: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCertDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (!newCert.name || !newCert.issuer) return toast.error('Fill required fields');
              setFormData((p) => ({ ...p, certifications: [...p.certifications, { id: Date.now().toString(), ...newCert }] }));
              setCertDialogOpen(false);
            }}>Add</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Project</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <TextField fullWidth label="Project Title" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Description" multiline rows={3} value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Project URL" value={newProject.url} onChange={(e) => setNewProject({ ...newProject, url: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (!newProject.title) return toast.error('Project title required');
              setFormData((p) => ({ ...p, projects: [...p.projects, { id: Date.now().toString(), ...newProject }] }));
              setProjectDialogOpen(false);
            }}>Add</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};
