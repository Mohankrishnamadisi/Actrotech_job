import React from 'react';
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
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from '@mui/material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { EXPERIENCE_LEVELS, JOB_CATEGORIES } from '@constants/index';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  const [formData, setFormData] = React.useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    experience: '',
    skills: [] as string[],
  });

  const [skillInput, setSkillInput] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as any;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSave = async () => {
    try {
      // TODO: Save profile to Supabase
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Layout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 4 }}>
          My Profile
        </Typography>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {/* Avatar */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                }}
              >
                {user?.name.charAt(0).toUpperCase()}
              </Avatar>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                disabled
              />

              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />

              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />

              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  label="Experience Level"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Skills */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button variant="outlined" onClick={handleAddSkill}>
                    Add
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      onDelete={() => handleRemoveSkill(skill)}
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" size="large" fullWidth onClick={handleSave}>
                  Save Changes
                </Button>
                <Button variant="outlined" size="large" fullWidth>
                  Cancel
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};
