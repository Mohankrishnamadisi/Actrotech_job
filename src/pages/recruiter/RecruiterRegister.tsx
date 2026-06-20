import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CloudUpload as CloudUploadIcon,
  Business as BusinessIcon,
  ContactPhone as ContactIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { authService } from '@services/supabase';
import { recruiterService, userService } from '@services/api';
import { ROUTES, USER_ROLES, INDUSTRY_TYPES } from '@constants/index';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateGST,
  validateFileSize,
} from '@utils/index';
import toast from 'react-hot-toast';

const MotionCard = motion(Card);

export const RecruiterRegister: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setLoading } = useAuthStore();
  const [loading, setLoadingState] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [existingDialogOpen, setExistingDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    gstNumber: '',
    cinNumber: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companyAddress: '',
    companyDescription: '',
    industryType: '',
    hrContactPerson: '',
    hrEmail: '',
    hrPhone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!validateGST(formData.gstNumber)) newErrors.gstNumber = 'Valid 15-character GST number required';
    if (!validateEmail(formData.companyEmail)) newErrors.companyEmail = 'Valid company email required';
    if (!validatePhone(formData.companyPhone)) newErrors.companyPhone = 'Valid 10-digit phone required';
    if (!validateURL(formData.companyWebsite)) newErrors.companyWebsite = 'Valid website URL required';
    if (!formData.companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
    if (!formData.companyDescription.trim()) newErrors.companyDescription = 'Company description is required';
    if (!formData.industryType) newErrors.industryType = 'Industry type is required';
    if (!formData.hrContactPerson.trim()) newErrors.hrContactPerson = 'HR contact person is required';
    if (!validateEmail(formData.hrEmail)) newErrors.hrEmail = 'Valid HR email required';
    if (!validatePhone(formData.hrPhone)) newErrors.hrPhone = 'Valid HR phone required';
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Min 8 chars with uppercase, lowercase & number';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoadingState(true);
    setLoading(true);

    try {
      const response = await authService.signUp(formData.hrEmail, formData.password, {
        name: formData.hrContactPerson,
        role: USER_ROLES.RECRUITER,
      });

      if (response.user) {
        let logoUrl = '';
        if (companyLogo) {
          logoUrl = await userService.uploadCompanyLogo(response.user.id, companyLogo);
        }

        await recruiterService.createRecruiterProfile(response.user.id, {
          company_name: formData.companyName,
          company_website: formData.companyWebsite,
          company_logo_url: logoUrl,
          industry: formData.industryType,
          description: formData.companyDescription,
          location: formData.companyAddress,
          company_email: formData.companyEmail,
          company_phone: formData.companyPhone,
          gst_number: formData.gstNumber,
          cin_number: formData.cinNumber || undefined,
          hr_contact_person: formData.hrContactPerson,
          hr_email: formData.hrEmail,
          hr_phone: formData.hrPhone,
        } as Record<string, unknown>);

        setUser({
          id: response.user.id,
          email: formData.hrEmail,
          name: formData.hrContactPerson,
          role: USER_ROLES.RECRUITER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setSnackbarMessage('Registration successful.');
        setSnackbarOpen(true);
        setVerifyDialogOpen(true);
        navigate(ROUTES.RECRUITER_DASHBOARD);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Recruiter registration error:', error);
      if (/already/i.test(msg)) {
        setExistingDialogOpen(true);
      } else {
        setSnackbarMessage(msg || 'Registration failed');
        setSnackbarOpen(true);
      }
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  return (
    <Layout footer={false}>
      <Box
        sx={{
          minHeight: '100vh',
          py: 4,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FAFC 55%)',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 750,
                mb: 1,
                color: 'text.primary',
              }}
            >
              Recruiter Registration
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Register your company and start posting jobs to find top talent
            </Typography>
          </Box>

          <MotionCard
            sx={{ p: { xs: 3, md: 4 } }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon color="primary" /> Company Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Company Name *" name="companyName" value={formData.companyName}
                  onChange={handleChange} error={!!errors.companyName} helperText={errors.companyName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="GST Number *" name="gstNumber" value={formData.gstNumber}
                  onChange={handleChange} error={!!errors.gstNumber} helperText={errors.gstNumber}
                  placeholder="22AAAAA0000A1Z5" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="CIN Number (Optional)" name="cinNumber" value={formData.cinNumber}
                  onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.industryType}>
                  <InputLabel>Industry Type *</InputLabel>
                  <Select name="industryType" value={formData.industryType} onChange={handleChange} label="Industry Type *">
                    {INDUSTRY_TYPES.map((i) => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Company Email *" name="companyEmail" type="email"
                  value={formData.companyEmail} onChange={handleChange}
                  error={!!errors.companyEmail} helperText={errors.companyEmail} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Company Phone *" name="companyPhone" value={formData.companyPhone}
                  onChange={handleChange} error={!!errors.companyPhone} helperText={errors.companyPhone}
                  InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Company Website *" name="companyWebsite" value={formData.companyWebsite}
                  onChange={handleChange} error={!!errors.companyWebsite} helperText={errors.companyWebsite}
                  placeholder="https://company.com" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Company Address *" name="companyAddress" value={formData.companyAddress}
                  onChange={handleChange} error={!!errors.companyAddress} helperText={errors.companyAddress} multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Company Description *" name="companyDescription"
                  value={formData.companyDescription} onChange={handleChange}
                  error={!!errors.companyDescription} helperText={errors.companyDescription} multiline rows={3} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '2px dashed', borderColor: 'primary.main', borderRadius: 2, textAlign: 'center' }}>
                  <input type="file" id="company-logo" accept="image/*" hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && validateFileSize(file, 5)) setCompanyLogo(file);
                      else if (file) toast.error('Logo must be under 5MB');
                    }} />
                  <Button component="label" htmlFor="company-logo" variant="outlined" startIcon={<CloudUploadIcon />}>
                    Upload Company Logo
                  </Button>
                  {companyLogo && (
                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                      ✓ {companyLogo.name}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContactIcon color="primary" /> HR Contact & Account
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="HR Contact Person *" name="hrContactPerson"
                  value={formData.hrContactPerson} onChange={handleChange}
                  error={!!errors.hrContactPerson} helperText={errors.hrContactPerson} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="HR Email *" name="hrEmail" type="email"
                  value={formData.hrEmail} onChange={handleChange}
                  error={!!errors.hrEmail} helperText={errors.hrEmail} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="HR Phone *" name="hrPhone" value={formData.hrPhone}
                  onChange={handleChange} error={!!errors.hrPhone} helperText={errors.hrPhone}
                  InputProps={{ startAdornment: <InputAdornment position="start">+91</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Account Password *" name="password" type="password"
                  value={formData.password} onChange={handleChange}
                  error={!!errors.password} helperText={errors.password} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Confirm Password *" name="confirmPassword" type="password"
                  value={formData.confirmPassword} onChange={handleChange}
                  error={!!errors.confirmPassword} helperText={errors.confirmPassword} />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 4, py: 1.5 }}>
              {loading ? 'Registering...' : 'Register as Recruiter'}
            </Button>
            </Box>
          </MotionCard>
        </Container>
      </Box>
          <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogContent>
              A confirmation email has been sent to your registered email address. Please verify your email before logging in.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => window.open('https://mail.google.com', '_blank')}>Open Gmail</Button>
              <Button onClick={() => setVerifyDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={existingDialogOpen} onClose={() => setExistingDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Account Already Exists</DialogTitle>
            <DialogContent>
              You have already registered with this email address. If you have already verified your email, please login to continue.
            </DialogContent>
            <DialogActions>
              <Button onClick={() => navigate(ROUTES.LOGIN)}>Login</Button>
              <Button onClick={() => setExistingDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
            <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
    </Layout>
  );
};
