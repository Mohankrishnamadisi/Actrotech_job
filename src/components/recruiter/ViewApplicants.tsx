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
  Chip,
  Box,
  Typography,
  CircularProgress,
  Paper,
  IconButton,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { jobService, applicationService } from '@services/api';
import {
  candidateTagService,
  groupAssignmentsByCandidate,
  filterByTagIds,
} from '@services/candidateTags';
import type { Job, CandidateTag, CandidateTagAssignment } from '@types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ApplicantDetailsModal } from './ApplicantDetailsModal';
import { TagManager } from './TagManager';
import { TagFilterBar } from './TagFilterBar';
import { CandidateTagChips } from './CandidateTagChips';
import { AddToPoolButton } from './talentPool/AddToPoolButton';
import { calculateMatchScore, getMatchScoreHex, type MatchScoreResult } from '@utils/matchScore';

interface ViewApplicantsProps {
  recruiterId: string;
  onChatClick?: (candidateId: string, candidateName: string) => void;
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

type SortMode = 'applied_desc' | 'match_desc' | 'match_asc';
type MatchScoreFilter = 'all' | '90_plus' | '70_89' | 'below_70';

export const ViewApplicants: React.FC<ViewApplicantsProps> = ({ recruiterId, onChatClick }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('applied_desc');
  const [matchScoreFilter, setMatchScoreFilter] = useState<MatchScoreFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<CandidateTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagAssignmentsByCandidate, setTagAssignmentsByCandidate] = useState<
    Record<string, CandidateTagAssignment[]>
  >({});

  useEffect(() => {
    fetchJobs();
    fetchTags();
  }, [recruiterId]);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplicants();
    }
  }, [selectedJobId]);

  useEffect(() => {
    if (applicants.length > 0) {
      fetchTagAssignments();
    } else {
      setTagAssignmentsByCandidate({});
    }
  }, [applicants]);

  const fetchTags = async () => {
    try {
      const data = await candidateTagService.getRecruiterTags(recruiterId);
      setTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchTagAssignments = async () => {
    try {
      const candidateIds = [...new Set(applicants.map((a) => a.user_id))];
      const assignments = await candidateTagService.getAssignmentsForCandidates(candidateIds);
      setTagAssignmentsByCandidate(groupAssignmentsByCandidate(assignments));
    } catch (err) {
      console.error('Error fetching tag assignments:', err);
    }
  };

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

  const handleViewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setViewDialogOpen(true);
  };

  const handleStatusChanged = () => {
    fetchApplicants();
  };

  const handleTagsChanged = () => {
    fetchTags();
    fetchTagAssignments();
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0];

  const getApplicantMatchScore = (applicant: Applicant): MatchScoreResult =>
    calculateMatchScore(
      {
        ...(applicant.profiles || {}),
        expected_ctc: applicant.expected_ctc || applicant.expectedCtc,
        current_ctc: applicant.current_ctc || applicant.currentCtc,
      },
      selectedJob
    );

  const statusFiltered = applicants.filter((app) =>
    statusFilter === 'all' ? true : app.status === statusFilter
  );

  const tagFilteredApplicants = filterByTagIds(
    statusFiltered,
    tagAssignmentsByCandidate,
    selectedTagIds
  );

  const filteredApplicants = [...tagFilteredApplicants]
    .filter((applicant) => {
      const score = getApplicantMatchScore(applicant).score;
      if (matchScoreFilter === '90_plus') return score >= 90;
      if (matchScoreFilter === '70_89') return score >= 70 && score <= 89;
      if (matchScoreFilter === 'below_70') return score < 70;
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'match_desc') {
        return getApplicantMatchScore(b).score - getApplicantMatchScore(a).score;
      }
      if (sortMode === 'match_asc') {
        return getApplicantMatchScore(a).score - getApplicantMatchScore(b).score;
      }
      return new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime();
    });

  const statusCounts = {
    applied: applicants.filter((a) => a.status === 'applied').length,
    under_review: applicants.filter((a) => a.status === 'under_review').length,
    shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    rejected: applicants.filter((a) => a.status === 'rejected').length,
    accepted: applicants.filter((a) => a.status === 'accepted').length,
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
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

  const filteredJobs = jobs.filter((j) =>
    j.title?.toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            width: 320,
            minWidth: 320,
            height: 'calc(100vh - 160px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Card sx={{ flex: '0 0 auto', mb: 2 }}>
            <CardContent sx={{ position: 'sticky', top: 16, zIndex: 5, background: 'transparent' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                Jobs ordered by post date
              </Typography>
              <TextField
                placeholder="Search jobs"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 auto', overflow: 'hidden' }}>
            <CardContent sx={{ height: '100%', p: 1 }}>
              <Box sx={{ height: '100%', overflowY: 'auto', pr: 1 }}>
                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  {filteredJobs.map((job) => (
                    <Box
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: selectedJobId === job.id ? '1px solid #1D4ED8' : '1px solid rgba(148, 163, 184, 0.24)',
                        backgroundColor: selectedJobId === job.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 18px rgba(15,23,42,0.04)',
                        },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Posted {format(new Date(job.created_at as any), 'dd MMM yyyy')}
                      </Typography>
                      <Typography variant="caption" sx={{ float: 'right', color: 'text.secondary' }}>
                        {/* applicant count placeholder */}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* RIGHT CONTENT */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Selected job
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedJob.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedJob.status ? `${selectedJob.status} • ` : ''}
                    Posted {format(new Date(selectedJob.created_at as any), 'dd MMM yyyy')} • {applicants.length}{' '}
                    applicant(s)
                  </Typography>
                </Box>
                <TagManager recruiterId={recruiterId} onTagsChange={handleTagsChanged} />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Card sx={{ flex: '1 1 0', p: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary">Applied</Typography>
                    <Typography variant="h6">{statusCounts.applied}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 0', p: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary">Under Review</Typography>
                    <Typography variant="h6">{statusCounts.under_review}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 0', p: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary">Shortlisted</Typography>
                    <Typography variant="h6">{statusCounts.shortlisted}</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: '1 1 0', p: 1 }}>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" color="text.secondary">Rejected</Typography>
                    <Typography variant="h6">{statusCounts.rejected}</Typography>
                  </CardContent>
                </Card>
              </Box>

              <Tabs
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value)}
                sx={{ mb: 0, borderBottom: '1px solid #e0e0e0' }}
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

              <TagFilterBar
                tags={tags}
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel>Sort By Match Score</InputLabel>
                  <Select
                    value={sortMode}
                    label="Sort By Match Score"
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                  >
                    <MenuItem value="applied_desc">Newest Applied</MenuItem>
                    <MenuItem value="match_desc">Match Score: High to Low</MenuItem>
                    <MenuItem value="match_asc">Match Score: Low to High</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Filter By Match Score</InputLabel>
                  <Select
                    value={matchScoreFilter}
                    label="Filter By Match Score"
                    onChange={(e) => setMatchScoreFilter(e.target.value as MatchScoreFilter)}
                  >
                    <MenuItem value="all">All Scores</MenuItem>
                    <MenuItem value="90_plus">90+ Green</MenuItem>
                    <MenuItem value="70_89">70-89 Orange</MenuItem>
                    <MenuItem value="below_70">Below 70 Red</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Applicants table always inside right panel */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredApplicants.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
              {selectedTagIds.length > 0
                ? 'No applicants match the selected tag filters'
                : `No applicants with status "${statusFilter}"`}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Match Score</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applied</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplicants.map((applicant) => {
                    const matchScore = getApplicantMatchScore(applicant);
                    const matchHex = getMatchScoreHex(matchScore.score);

                    return (
                      <TableRow key={applicant.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500 }}>
                            {applicant.profiles?.name || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell>{applicant.profiles?.email || 'N/A'}</TableCell>
                        <TableCell>
                          <CandidateTagChips
                            assignments={tagAssignmentsByCandidate[applicant.user_id] || []}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={matchScore.label}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: `${matchHex}14`,
                              color: matchHex,
                              border: `1px solid ${matchHex}33`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={applicant.status}
                            size="small"
                            color={getStatusColor(applicant.status)}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          {applicant.applied_at ? format(new Date(applicant.applied_at), 'dd MMM yyyy') : 'Unknown'}
                        </TableCell>
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
                          <AddToPoolButton recruiterId={recruiterId} candidateId={applicant.user_id} />
                          <IconButton
                            size="small"
                            onClick={() => onChatClick?.(applicant.user_id, applicant.profiles?.name || 'Candidate')}
                            title="Send message"
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Enhanced Applicant Details Modal */}
      {selectedApplicant && (
        <ApplicantDetailsModal
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          applicantId={selectedApplicant.id}
          candidateId={selectedApplicant.user_id}
          jobId={selectedJobId}
          recruiterId={recruiterId}
          availableTags={tags}
          onStatusChange={handleStatusChanged}
          onTagsChange={handleTagsChanged}
        />
      )}
    </motion.div>
  );
};
