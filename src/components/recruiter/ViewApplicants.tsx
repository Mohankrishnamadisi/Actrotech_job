import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { jobService } from '@services/api';
import type { Job } from '@types';
import { calculateMatchScore, getMatchScoreHex, type MatchScoreResult } from '@utils/matchScore';
import { downloadApplicantsCsv } from '@utils/applicantCsv';
import { ApplicantDetailsModal } from './ApplicantDetailsModal';
import { BulkActionsToolbar, type BulkToolbarAction } from './BulkActionsToolbar';
import { BulkConfirmationDialog } from './BulkConfirmationDialog';
import { BulkMessageDialog } from './BulkMessageDialog';
import {
  bulkMoveToAtsStage,
  bulkSendMessage,
  bulkSetTags,
  bulkSetTalentPools,
  bulkUpdateApplicationStatus,
  getApplicantStage,
  getApplicantTags,
  getApplicantTalentPools,
  getJobApplicantsPaginated,
  type BulkApplicant,
} from './bulkActionsApi';

interface ViewApplicantsProps {
  recruiterId: string;
  onChatClick?: (candidateId: string, candidateName: string) => void;
}

type SortMode = 'applied_desc' | 'match_desc' | 'match_asc';
type MatchScoreFilter = 'all' | '90_plus' | '70_89' | 'below_70';

interface PendingConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: 'primary' | 'error' | 'warning' | 'success';
  run: () => Promise<void>;
}

const pageSizeOptions = [10, 25, 50, 100];

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

const labelize = (value: string): string => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const selectedText = (count: number) => `${count} ${count === 1 ? 'Candidate' : 'Candidates'} Selected`;

export const ViewApplicants: React.FC<ViewApplicantsProps> = ({ recruiterId, onChatClick }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [applicants, setApplicants] = useState<BulkApplicant[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<BulkApplicant | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('applied_desc');
  const [matchScoreFilter, setMatchScoreFilter] = useState<MatchScoreFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [messageOpen, setMessageOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [recruiterId]);

  useEffect(() => {
    if (selectedJobId) fetchApplicants();
  }, [selectedJobId, page, rowsPerPage]);

  useEffect(() => {
    setSelectedIds(new Set());
    setPage(0);
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getRecruiterJobs(recruiterId);
      setJobs(data || []);
      if (data && data.length > 0) setSelectedJobId(data[0].id);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      toast.error('Failed to fetch jobs');
    }
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const result = await getJobApplicantsPaginated(selectedJobId, page + 1, rowsPerPage);
      setApplicants(result.data || []);
      setTotalApplicants(result.total);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      toast.error('Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0];

  const getApplicantMatchScore = (applicant: BulkApplicant): MatchScoreResult =>
    calculateMatchScore(
      {
        ...(applicant.profiles || {}),
        expected_ctc: applicant.expected_ctc || applicant.expectedCtc,
        current_ctc: applicant.current_ctc || applicant.currentCtc,
      },
      selectedJob
    );

  const enrichedApplicants = useMemo(
    () => applicants.map((applicant) => ({ ...applicant, match_score: getApplicantMatchScore(applicant).score })),
    [applicants, selectedJob]
  );

  const visibleApplicants = useMemo(() => {
    return [...enrichedApplicants]
      .filter((applicant) => (statusFilter === 'all' ? true : applicant.status === statusFilter))
      .filter((applicant) => {
        const score = applicant.match_score || 0;
        if (matchScoreFilter === '90_plus') return score >= 90;
        if (matchScoreFilter === '70_89') return score >= 70 && score <= 89;
        if (matchScoreFilter === 'below_70') return score < 70;
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'match_desc') return (b.match_score || 0) - (a.match_score || 0);
        if (sortMode === 'match_asc') return (a.match_score || 0) - (b.match_score || 0);
        return new Date(b.applied_at || 0).getTime() - new Date(a.applied_at || 0).getTime();
      });
  }, [enrichedApplicants, matchScoreFilter, sortMode, statusFilter]);

  const selectedApplicants = useMemo(
    () => enrichedApplicants.filter((applicant) => selectedIds.has(applicant.id)),
    [enrichedApplicants, selectedIds]
  );

  const visibleIds = visibleApplicants.map((applicant) => applicant.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const statusCounts = {
    applied: applicants.filter((a) => a.status === 'applied').length,
    under_review: applicants.filter((a) => a.status === 'under_review').length,
    shortlisted: applicants.filter((a) => a.status === 'shortlisted').length,
    rejected: applicants.filter((a) => a.status === 'rejected').length,
    accepted: applicants.filter((a) => a.status === 'accepted').length,
  };

  const availableTags = useMemo(
    () => Array.from(new Set(enrichedApplicants.flatMap((applicant) => getApplicantTags(applicant)))),
    [enrichedApplicants]
  );

  const availablePools = useMemo(
    () => Array.from(new Set(enrichedApplicants.flatMap((applicant) => getApplicantTalentPools(applicant)))),
    [enrichedApplicants]
  );

  const filteredJobs = jobs.filter((job) =>
    job.title?.toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const runBulkAction = async (successMessage: string, action: () => Promise<void>) => {
    setProcessing(true);
    try {
      await action();
      toast.success(successMessage);
      setSelectedIds(new Set());
      await fetchApplicants();
    } catch (err) {
      console.error('Bulk action failed:', err);
      toast.error('Bulk action failed. Please check your application metadata columns.');
    } finally {
      setProcessing(false);
      setConfirmation(null);
    }
  };

  const confirmAction = (nextConfirmation: PendingConfirmation) => setConfirmation(nextConfirmation);

  const handleToolbarAction = (action: BulkToolbarAction) => {
    const count = selectedApplicants.length;
    const applicationIds = selectedApplicants.map((applicant) => applicant.id);
    if (count === 0) return;

    if (action.type === 'shortlist') {
      void runBulkAction(`Shortlisted ${count} candidates`, () => bulkUpdateApplicationStatus(applicationIds, 'shortlisted', selectedJobId));
      return;
    }

    if (action.type === 'reject') {
      confirmAction({
        title: 'Reject Candidates',
        message: `Are you sure you want to reject ${count} candidates?`,
        confirmLabel: 'Reject',
        confirmColor: 'error',
        run: () => runBulkAction(`Rejected ${count} candidates`, () => bulkUpdateApplicationStatus(applicationIds, 'rejected', selectedJobId)),
      });
      return;
    }

    if (action.type === 'move_stage') {
      const run = () => runBulkAction(`Moved ${count} candidates to ${action.stage}`, () => bulkMoveToAtsStage(applicationIds, action.stage, selectedJobId));
      if (action.stage === 'Rejected') {
        confirmAction({
          title: 'Reject Candidates',
          message: `Are you sure you want to reject ${count} candidates?`,
          confirmLabel: 'Reject',
          confirmColor: 'error',
          run,
        });
      } else {
        void run();
      }
      return;
    }

    if (action.type === 'add_tags') {
      void runBulkAction(`Tags added to ${count} candidates`, () => bulkSetTags(selectedApplicants, action.values, 'add'));
      return;
    }

    if (action.type === 'remove_tags') {
      void runBulkAction(`Tags removed from ${count} candidates`, () => bulkSetTags(selectedApplicants, action.values, 'remove'));
      return;
    }

    if (action.type === 'add_pool') {
      void runBulkAction(`Added ${count} candidates to talent pool`, () => bulkSetTalentPools(selectedApplicants, action.values, 'add'));
      return;
    }

    if (action.type === 'remove_pool') {
      void runBulkAction(`Removed ${count} candidates from talent pool`, () => bulkSetTalentPools(selectedApplicants, action.values, 'remove'));
      return;
    }

    if (action.type === 'message') {
      setMessageOpen(true);
      return;
    }

    if (action.type === 'export_csv') {
      downloadApplicantsCsv(selectedApplicants, `${selectedJob?.title || 'selected'}-candidates.csv`);
      toast.success(`Exported ${count} candidates`);
    }
  };

  const handleSendBulkMessage = (message: string) => {
    void runBulkAction(`Message sent to ${selectedApplicants.length} candidates`, () => bulkSendMessage(recruiterId, selectedApplicants, message));
    setMessageOpen(false);
  };

  const toggleApplicant = (applicantId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(applicantId)) next.delete(applicantId);
      else next.add(applicantId);
      return next;
    });
  };

  const toggleVisibleApplicants = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleViewApplicant = (applicant: BulkApplicant) => {
    setSelectedApplicant(applicant);
    setViewDialogOpen(true);
  };

  const handleStatusChanged = () => {
    void fetchApplicants();
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="textSecondary">No jobs posted yet. Post a job first to view applicants.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>
        <Box sx={{ width: { xs: '100%', lg: 320 }, minWidth: { lg: 320 }, height: { lg: 'calc(100vh - 160px)' }, display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flex: '0 0 auto', mb: 2 }}>
            <CardContent sx={{ position: 'sticky', top: 16, zIndex: 5, background: 'transparent' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>Jobs ordered by post date</Typography>
              <TextField
                placeholder="Search jobs"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 auto', overflow: 'hidden', width: '100%' }}>
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
                        border: selectedJobId === job.id ? '1px solid #0A66C2' : '1px solid rgba(148, 163, 184, 0.28)',
                        backgroundColor: selectedJobId === job.id ? 'rgba(10, 102, 194, 0.08)' : '#fff',
                        transition: 'all 0.18s ease',
                        '&:hover': { boxShadow: '0 6px 18px rgba(15,23,42,0.06)' },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{job.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Posted {job.created_at ? format(new Date(job.created_at as string), 'dd MMM yyyy') : 'Unknown'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1, width: '100%' }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Selected job</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedJob.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedJob.status ? `${selectedJob.status} - ` : ''}
                    Posted {selectedJob.created_at ? format(new Date(selectedJob.created_at as string), 'dd MMM yyyy') : 'Unknown'} - {totalApplicants} applicant(s)
                  </Typography>
                </Box>
                {selectedIds.size > 0 && <Chip color="primary" label={selectedText(selectedIds.size)} sx={{ fontWeight: 800, borderRadius: 1 }} />}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1, mb: 2 }}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Paper key={status} variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">{labelize(status)}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{count}</Typography>
                  </Paper>
                ))}
              </Box>

              <Tabs value={statusFilter} onChange={(_, value) => setStatusFilter(value)} sx={{ mb: 0, borderBottom: '1px solid #e0e0e0' }} variant="scrollable">
                <Tab label={`All (${applicants.length})`} value="all" sx={{ textTransform: 'none' }} />
                <Tab label={`Applied (${statusCounts.applied})`} value="applied" sx={{ textTransform: 'none' }} />
                <Tab label={`Under Review (${statusCounts.under_review})`} value="under_review" sx={{ textTransform: 'none' }} />
                <Tab label={`Shortlisted (${statusCounts.shortlisted})`} value="shortlisted" sx={{ textTransform: 'none' }} />
                <Tab label={`Rejected (${statusCounts.rejected})`} value="rejected" sx={{ textTransform: 'none' }} />
              </Tabs>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel>Sort By Match Score</InputLabel>
                  <Select value={sortMode} label="Sort By Match Score" onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <MenuItem value="applied_desc">Newest Applied</MenuItem>
                    <MenuItem value="match_desc">Match Score: High to Low</MenuItem>
                    <MenuItem value="match_asc">Match Score: Low to High</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Filter By Match Score</InputLabel>
                  <Select value={matchScoreFilter} label="Filter By Match Score" onChange={(event) => setMatchScoreFilter(event.target.value as MatchScoreFilter)}>
                    <MenuItem value="all">All Scores</MenuItem>
                    <MenuItem value="90_plus">90+ Green</MenuItem>
                    <MenuItem value="70_89">70-89 Orange</MenuItem>
                    <MenuItem value="below_70">Below 70 Red</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          <BulkActionsToolbar
            selectedCount={selectedIds.size}
            availableTags={availableTags}
            availablePools={availablePools}
            processing={processing}
            onAction={handleToolbarAction}
            onClear={() => setSelectedIds(new Set())}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : visibleApplicants.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>No applicants match the selected filters.</Typography>
          ) : (
            <Paper sx={{ overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.24)' }}>
              <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={!allVisibleSelected && someVisibleSelected}
                          checked={allVisibleSelected}
                          onChange={toggleVisibleApplicants}
                          inputProps={{ 'aria-label': 'Select all candidates' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Tags</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Talent Pool</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>ATS Stage</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Match Score</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Applied</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleApplicants.map((applicant) => {
                      const matchScore = getApplicantMatchScore(applicant);
                      const matchHex = getMatchScoreHex(matchScore.score);
                      const profile = applicant.profiles;
                      const checked = selectedIds.has(applicant.id);
                      return (
                        <TableRow key={applicant.id} hover selected={checked}>
                          <TableCell padding="checkbox">
                            <Checkbox checked={checked} onChange={() => toggleApplicant(applicant.id)} inputProps={{ 'aria-label': `Select ${profile?.name || 'candidate'}` }} />
                          </TableCell>
                          <TableCell><Typography sx={{ fontWeight: 700 }}>{profile?.name || profile?.full_name || 'Unknown'}</Typography></TableCell>
                          <TableCell>{profile?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minWidth: 120 }}>
                              {getApplicantTags(applicant).slice(0, 3).map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                              {getApplicantTags(applicant).length === 0 && <Typography variant="caption" color="text.secondary">No tags</Typography>}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', minWidth: 120 }}>
                              {getApplicantTalentPools(applicant).slice(0, 2).map((pool) => <Chip key={pool} label={pool} size="small" color="info" variant="outlined" />)}
                              {getApplicantTalentPools(applicant).length === 0 && <Typography variant="caption" color="text.secondary">None</Typography>}
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={getApplicantStage(applicant)} size="small" sx={{ borderRadius: 1, fontWeight: 700 }} /></TableCell>
                          <TableCell>
                            <Chip label={matchScore.label} size="small" sx={{ fontWeight: 800, bgcolor: `${matchHex}14`, color: matchHex, border: `1px solid ${matchHex}33` }} />
                          </TableCell>
                          <TableCell><Chip label={labelize(applicant.status)} size="small" color={getStatusColor(applicant.status)} variant="filled" /></TableCell>
                          <TableCell>{applicant.applied_at ? format(new Date(applicant.applied_at), 'dd MMM yyyy') : 'Unknown'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleViewApplicant(applicant)} title="View details"><ViewIcon fontSize="small" /></IconButton>
                            {applicant.resume_url && <IconButton size="small" href={applicant.resume_url} target="_blank" rel="noopener noreferrer" title="Download resume"><DownloadIcon fontSize="small" /></IconButton>}
                            <IconButton size="small" onClick={() => onChatClick?.(applicant.user_id, profile?.name || 'Candidate')} title="Send message"><MessageIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalApplicants}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={pageSizeOptions}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          )}
        </Box>
      </Box>

      {selectedIds.size > 0 && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            left: { xs: 16, md: '50%' },
            right: { xs: 16, md: 'auto' },
            bottom: 18,
            transform: { md: 'translateX(-50%)' },
            zIndex: 1300,
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 2,
            border: '1px solid rgba(10, 102, 194, 0.18)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{selectedText(selectedIds.size)}</Typography>
          <Button size="small" variant="contained" disabled={processing} onClick={() => handleToolbarAction({ type: 'shortlist' })}>Shortlist</Button>
          <Button size="small" color="error" disabled={processing} onClick={() => handleToolbarAction({ type: 'reject' })}>Reject</Button>
          <Button size="small" disabled={processing} onClick={() => setSelectedIds(new Set())}>Deselect All</Button>
        </Paper>
      )}

      {selectedApplicant && (
        <ApplicantDetailsModal
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          applicantId={selectedApplicant.id}
          candidateId={selectedApplicant.user_id}
          jobId={selectedJobId}
          onStatusChange={handleStatusChanged}
        />
      )}

      <BulkMessageDialog
        open={messageOpen}
        selectedCount={selectedApplicants.length}
        loading={processing}
        onClose={() => setMessageOpen(false)}
        onSend={handleSendBulkMessage}
      />

      <BulkConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmation?.title || ''}
        message={confirmation?.message || ''}
        confirmLabel={confirmation?.confirmLabel}
        confirmColor={confirmation?.confirmColor}
        loading={processing}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void confirmation?.run()}
      />
    </motion.div>
  );
};

