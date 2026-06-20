import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { candidateService, savedService } from '@services/api';
import toast from 'react-hot-toast';

interface CandidateSearchProps {
  recruiterId: string;
  onChatClick?: (candidateId: string, candidateName: string) => void;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  headline: string;
  location: string;
  skills: string[];
  experience_years: number;
  avatar?: string;
  [key: string]: unknown;
}

export const CandidateSearch: React.FC<CandidateSearchProps> = ({ recruiterId, onChatClick }) => {
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());

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
      if (filters.title) searchFilters.title = filters.title;
      if (filters.location) searchFilters.location = filters.location;
      if (filters.skills) searchFilters.skills = filters.skills.split(',').map((s) => s.trim());
      if (filters.experience) searchFilters.experience = parseInt(filters.experience);

      const result = await candidateService.searchCandidates(searchFilters);
      setSearchResults(result.data || []);

      if (result.data && result.data.length === 0) {
        toast.info('No candidates found matching your criteria');
      }
    } catch (err) {
      console.error('Error searching candidates:', err);
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setViewDialogOpen(true);
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

      {/* View Candidate Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Candidate Profile</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedCandidate && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={selectedCandidate.avatar}
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                />
                <Typography sx={{ fontWeight: 600, fontSize: 18 }}>{selectedCandidate.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedCandidate.headline}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Email
                </Typography>
                <Typography>{selectedCandidate.email}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Location
                </Typography>
                <Typography>{selectedCandidate.location || 'N/A'}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedCandidate.skills?.map((skill) => (
                    <Chip key={skill} label={skill} size="small" />
                  ))}
                </Box>
              </Box>

              {selectedCandidate.experience_years && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Experience
                  </Typography>
                  <Typography>{selectedCandidate.experience_years} years</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedCandidate && (
            <Button
              variant="contained"
              onClick={() => {
                onChatClick?.(selectedCandidate.id, selectedCandidate.name);
                setViewDialogOpen(false);
              }}
              startIcon={<MessageIcon />}
            >
              Send Message
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};
