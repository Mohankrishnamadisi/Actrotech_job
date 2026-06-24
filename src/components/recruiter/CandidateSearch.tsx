import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { candidateService, savedService } from '@services/api';
import { AddToPoolButton } from './talentPool/AddToPoolButton';
import { ResumeUnlockContact } from './ResumeUnlockContact';
import { getResumeUnlockMap } from '@utils/resumeUnlocks';
import toast from 'react-hot-toast';

interface CandidateSearchProps {
  recruiterId: string;
  onChatClick?: (candidateId: string, candidateName: string) => void;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  headline: string;
  location: string;
  skills: string[];
  experience_years: number;
  avatar?: string;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  resume_url?: string | null;
  experience?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  current_company?: string | null;
  current_ctc?: string | null;
  expected_ctc?: string | null;
  date_of_birth?: string | null;
  education?: string | null;
  gender?: string | null;
  notice_period?: string | null;
  work_experience?: Array<Record<string, any>>;
  education_details?: Array<Record<string, any>>;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  subscriptionPlan?: string;
  isPremiumCandidate?: boolean;
  [key: string]: any;
}

export const CandidateSearch: React.FC<CandidateSearchProps> = ({ recruiterId, onChatClick }) => {
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());
  const [unlockedCandidates, setUnlockedCandidates] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState({
    title: '',
    location: '',
    skills: '',
    experience: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const searchFilters: Record<string, unknown> = {};
      if (filters.title.trim()) searchFilters.title = filters.title.trim();
      if (filters.location.trim()) searchFilters.location = filters.location.trim();

      const skillValues = filters.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      if (skillValues.length) searchFilters.skills = skillValues;

      const experienceValue = Number(filters.experience);
      if (!Number.isNaN(experienceValue) && filters.experience !== '') {
        searchFilters.experience = experienceValue;
      }

      const result = await candidateService.searchCandidates(searchFilters);
      const candidates = (result.data || []) as any as Candidate[];
      setSearchResults(candidates);
      const unlockMap = await getResumeUnlockMap(recruiterId, candidates.map((candidate) => candidate.id));
      setUnlockedCandidates(unlockMap);

      if (candidates.length === 0) {
        toast('No candidates found matching your criteria', {
          duration: 4000,
          position: 'top-center',
          icon: '🔍',
        });
      }
    } catch (err) {
      console.error('Error searching candidates:', err);
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidate = async (candidate: Candidate) => {
    try {
      const profile = await candidateService.getCandidateProfile(candidate.id);
      setSelectedCandidate(profile as Candidate);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error loading candidate profile:', err);
      toast.error('Failed to load candidate profile');
    }
  };

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      if (savedCandidates.has(candidateId)) {
        await savedService.unsaveJob(recruiterId, candidateId);
        setSavedCandidates((prev) => new Set([...prev].filter((id) => id !== candidateId)));
        toast.success('Candidate removed from saved');
      } else {
        await savedService.saveJob(recruiterId, candidateId);
        setSavedCandidates((prev) => new Set([...prev, candidateId]));
        toast.success('Candidate saved successfully!');
      }
    } catch (err) {
      console.error('Error saving candidate:', err);
      toast.error('Failed to save candidate');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Search & Browse Candidates
          </Typography>

          {/* Search Form */}
          <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f9f9f9' }}>
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title / Headline"
                    value={filters.title}
                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                    size="small"
                    placeholder="e.g., React Developer"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    size="small"
                    placeholder="e.g., Bangalore"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Skills (comma separated)"
                    value={filters.skills}
                    onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                    size="small"
                    placeholder="e.g., React, JavaScript, TypeScript"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Experience (years)"
                    type="number"
                    value={filters.experience}
                    onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                    size="small"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={loading}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #4338CA 100%)',
                  boxShadow: '0 16px 32px rgba(59, 130, 246, 0.18)',
                  py: 1.25,
                }}
              >
                {loading ? 'Searching...' : 'Search Candidates'}
              </Button>
            </Box>
          </Paper>

          {/* Search Results */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : searchResults.length === 0 && Object.values(filters).some((f) => f) ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              No candidates found. Try adjusting your search criteria.
            </Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {searchResults.map((candidate) => (
                <motion.div key={candidate.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ListItem
                    sx={{
                      mb: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: '#f9f9f9' },
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <AddToPoolButton recruiterId={recruiterId} candidateId={candidate.id} />
                        <IconButton
                          edge="end"
                          onClick={() => handleSaveCandidate(candidate.id)}
                          title={savedCandidates.has(candidate.id) ? 'Unsave' : 'Save'}
                        >
                          {savedCandidates.has(candidate.id) ? (
                            <BookmarkIcon sx={{ color: '#1976d2' }} />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleViewCandidate(candidate)}
                          title="View profile"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => onChatClick?.(candidate.id, candidate.name)}
                          title="Send message"
                        >
                          <MessageIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar src={candidate.avatar} alt={candidate.name} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
                          {candidate.isPremiumCandidate && (
                            <Chip
                              label={candidate.subscriptionPlan?.toUpperCase() || 'PREMIUM'}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          )}
                          <Chip
                            icon={unlockedCandidates[candidate.id] ? <CheckCircleIcon /> : <LockIcon />}
                            label={unlockedCandidates[candidate.id] ? 'Unlocked' : 'Locked'}
                            size="small"
                            color={unlockedCandidates[candidate.id] ? 'success' : 'default'}
                            variant={unlockedCandidates[candidate.id] ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 800 }}
                          />
                          {candidate.experience_years && (
                            <Chip
                              label={`${candidate.experience_years}y exp`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            {candidate.headline}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            📍 {candidate.location || 'Location not specified'}
                          </Typography>
                          {candidate.skills && candidate.skills.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                              {candidate.skills.slice(0, 3).map((skill) => (
                                <Chip
                                  key={skill}
                                  label={skill}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 24 }}
                                />
                              ))}
                              {candidate.skills.length > 3 && (
                                <Chip
                                  label={`+${candidate.skills.length - 3}`}
                                  size="small"
                                  variant="filled"
                                  sx={{ height: 24 }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Candidate Profile Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          {selectedCandidate && (
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px 12px 0 0',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedCandidate.avatar}
                  sx={{
                    width: 70,
                    height: 70,
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
                    {selectedCandidate.name}
                  </Typography>
                  <Typography sx={{ opacity: 0.9, fontSize: 14 }}>
                    {selectedCandidate.headline}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setViewDialogOpen(false)}
                sx={{ color: 'white' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#fafafa' }}>
          {selectedCandidate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Key Info Section */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {selectedCandidate.experience_years && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WorkIcon sx={{ fontSize: 20, color: '#667eea' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        EXPERIENCE
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {selectedCandidate.experience_years} years
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Contact Section - Resume Unlock */}
              <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ fontSize: 20, color: '#667eea' }} />
                  Contact Information
                </Typography>
                {unlockedCandidates[selectedCandidate.id] ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedCandidate.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <EmailIcon sx={{ color: '#667eea', fontSize: 20 }} />
                        <Typography sx={{ wordBreak: 'break-all' }}>
                          {selectedCandidate.email}
                        </Typography>
                      </Box>
                    )}
                    {selectedCandidate.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PhoneIcon sx={{ color: '#667eea', fontSize: 20 }} />
                        <Typography>{selectedCandidate.phone}</Typography>
                      </Box>
                    )}
                    {selectedCandidate.resume_url && (
                      <Button
                        href={selectedCandidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<DownloadIcon />}
                        sx={{ mt: 1, textTransform: 'none' }}
                      >
                        View Resume
                      </Button>
                    )}
                  </Box>
                ) : (
                  <ResumeUnlockContact
                    recruiterId={recruiterId}
                    candidateId={selectedCandidate.id}
                    onUnlocked={(contact) => {
                      setUnlockedCandidates((current) => ({ ...current, [selectedCandidate.id]: true }));
                      setSelectedCandidate((current) =>
                        current
                          ? {
                              ...current,
                              email: contact.email || current.email,
                              phone: contact.phone || current.phone,
                            }
                          : current
                      );
                    }}
                  />
                )}
              </Box>

              {/* Profile Details Section */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
                {selectedCandidate.current_company && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      CURRENT COMPANY
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.current_company}</Typography>
                  </Box>
                )}
                {selectedCandidate.current_ctc && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      CURRENT CTC
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.current_ctc}</Typography>
                  </Box>
                )}
                {selectedCandidate.expected_ctc && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      EXPECTED CTC
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.expected_ctc}</Typography>
                  </Box>
                )}
                {selectedCandidate.date_of_birth && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      DATE OF BIRTH
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{new Date(selectedCandidate.date_of_birth).toLocaleDateString()}</Typography>
                  </Box>
                )}
                {selectedCandidate.gender && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      GENDER
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.gender}</Typography>
                  </Box>
                )}
                {selectedCandidate.notice_period && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      NOTICE PERIOD
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.notice_period}</Typography>
                  </Box>
                )}
                {selectedCandidate.education && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      EDUCATION
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.education}</Typography>
                  </Box>
                )}
                {selectedCandidate.experience && !selectedCandidate.experience_years && (
                  <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
                      EXPERIENCE
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>{selectedCandidate.experience}</Typography>
                  </Box>
                )}
              </Box>

              {/* Address Section */}
              {(selectedCandidate.address || selectedCandidate.city || selectedCandidate.state || selectedCandidate.country) && (
                <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Location
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    {selectedCandidate.address || ''}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>
                    {[selectedCandidate.city, selectedCandidate.state, selectedCandidate.country]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Box>
              )}

              {/* Education Timeline */}
              {Array.isArray(selectedCandidate.education_details) && selectedCandidate.education_details.length > 0 && (
                <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Education Details
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {selectedCandidate.education_details.map((item, index) => (
                      <Box key={index} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 700 }}>{item.degree || item.qualification || item.field || 'Education'}</Typography>
                        <Typography sx={{ color: 'text.secondary', mb: 0.5 }}>
                          {item.institution || item.school || item.college || ''}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {[item.year, item.grade].filter(Boolean).join(' • ')}
                        </Typography>
                        {item.description && (
                          <Typography sx={{ color: 'text.secondary', mt: 1 }}>{item.description}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Work Experience Timeline */}
              {Array.isArray(selectedCandidate.work_experience) && selectedCandidate.work_experience.length > 0 && (
                <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Work Experience
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {selectedCandidate.work_experience.map((item, index) => (
                      <Box key={index} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography sx={{ fontWeight: 700 }}>{item.title || item.role || item.position || 'Role'}</Typography>
                        <Typography sx={{ color: 'text.secondary', mb: 0.5 }}>
                          {item.company || item.organization || ''}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                          {[item.start_date, item.end_date].filter(Boolean).join(' - ')}
                        </Typography>
                        {item.description && (
                          <Typography sx={{ color: 'text.secondary', mt: 1 }}>{item.description}</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Skills Section */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 20, color: '#667eea' }} />
                    Skills & Expertise
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCandidate.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        sx={{
                          bgcolor: '#f0f4ff',
                          color: '#667eea',
                          fontWeight: 600,
                          border: '1px solid #e0e7ff',
                          '&:hover': { bgcolor: '#e0e7ff' },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Additional Info */}
              {selectedCandidate.bio && (
                <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    About
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {selectedCandidate.bio}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#f9fafb', gap: 1, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedCandidate && (
            <>
              <Tooltip title="Save this candidate">
                <IconButton
                  onClick={() => handleSaveCandidate(selectedCandidate.id)}
                  color={savedCandidates.has(selectedCandidate.id) ? 'primary' : 'default'}
                >
                  {savedCandidates.has(selectedCandidate.id) ? (
                    <BookmarkIcon />
                  ) : (
                    <BookmarkBorderIcon />
                  )}
                </IconButton>
              </Tooltip>
              {unlockedCandidates[selectedCandidate.id] && (
                <AddToPoolButton
                  candidateId={selectedCandidate.id}
                  recruiterId={recruiterId}
                />
              )}
              <Button
                variant="contained"
                onClick={() => {
                  onChatClick?.(selectedCandidate.id, selectedCandidate.name);
                  setViewDialogOpen(false);
                }}
                startIcon={<MessageIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Send Message
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
