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
  Tooltip,
  Typography,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Lock as LockIcon,
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
import { getResumeUnlockMap } from '@utils/resumeUnlocks';
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
  const [unlockedApplicants, setUnlockedApplicants] = useState<Record<string, boolean>>({});

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
      const unlockMap = await getResumeUnlockMap(
        recruiterId,
        (result.data || []).map((applicant) => applicant.user_id)
      );
      setUnlockedApplicants(unlockMap);
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '280px minmax(0, 1fr)' },
          gap: { xs: 1.5, lg: 2 },
          alignItems: 'start',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            minWidth: 0,
            minHeight: { lg: 620 },
            height: { lg: 'calc(100vh - 116px)' },
            maxHeight: { lg: 'calc(100vh - 116px)' },
            display: 'flex',
            flexDirection: 'column',
            position: { lg: 'sticky' },
            top: { lg: 96 },
          }}
        >
          <Card
            sx={{
              flex: '0 0 auto',
              mb: 1.25,
              borderRadius: 2,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
            }}
          >
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a' }}>
                Job Openings
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1.25 }}>
                Ordered by latest posting date
              </Typography>
              <TextField
                placeholder="Search jobs"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: '#fff',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: '1 1 auto',
              overflow: 'hidden',
              width: '100%',
              minHeight: { xs: 360, lg: 0 },
              borderRadius: 2,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.08)',
            }}
          >
            <CardContent sx={{ height: '100%', p: 0.75 }}>
              <Box
                sx={{
                  height: '100%',
                  overflowY: 'auto',
                  pr: 0.75,
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { width: 8 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.35)', borderRadius: 99 },
                }}
              >
                <Box sx={{ display: 'grid', gap: 0.9 }}>
                  {filteredJobs.map((job) => (
                    <Box
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      sx={{
                        p: 1.35,
                        minHeight: 74,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        border: selectedJobId === job.id ? '1px solid #0A66C2' : '1px solid rgba(148, 163, 184, 0.22)',
                        background: selectedJobId === job.id
                          ? 'linear-gradient(135deg, rgba(10,102,194,0.13), rgba(14,165,233,0.08))'
                          : '#fff',
                        boxShadow: selectedJobId === job.id
                          ? '0 16px 36px rgba(10, 102, 194, 0.15)'
                          : '0 10px 28px rgba(15, 23, 42, 0.04)',
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 18px 40px rgba(15,23,42,0.09)',
                          borderColor: 'rgba(10,102,194,0.45)',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#020617' }}>{job.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        Posted {job.created_at ? format(new Date(job.created_at as string), 'dd MMM yyyy') : 'Unknown'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ width: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
          <Card
            sx={{
              mb: 1.25,
              borderRadius: 2,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.06)',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, md: 1.75 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.25, mb: 0.75 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: '#0A66C2', fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>Selected job</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#020617', lineHeight: 1.15 }}>{selectedJob.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedJob.status ? `${selectedJob.status} - ` : ''}
                    Posted {selectedJob.created_at ? format(new Date(selectedJob.created_at as string), 'dd MMM yyyy') : 'Unknown'} - {totalApplicants} applicant(s)
                  </Typography>
                </Box>
                {selectedIds.size > 0 && <Chip color="primary" label={selectedText(selectedIds.size)} sx={{ fontWeight: 800, borderRadius: 1 }} />}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(110px, 1fr))' }, gap: 0.8, my: 1.25 }}>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Paper
                    key={status}
                    variant="outlined"
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: '#fff',
                      borderColor: 'rgba(148, 163, 184, 0.25)',
                      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{labelize(status)}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>{count}</Typography>
                  </Paper>
                ))}
              </Box>

              <Tabs value={statusFilter} onChange={(_, value) => setStatusFilter(value)} sx={{ mb: 0, borderBottom: '1px solid #e0e0e0' }} variant="scrollable">
                <Tab label={`All (${applicants.length})`} value="all" sx={{ textTransform: 'none', minHeight: 38, py: 0.75 }} />
                <Tab label={`Applied (${statusCounts.applied})`} value="applied" sx={{ textTransform: 'none', minHeight: 38, py: 0.75 }} />
                <Tab label={`Under Review (${statusCounts.under_review})`} value="under_review" sx={{ textTransform: 'none', minHeight: 38, py: 0.75 }} />
                <Tab label={`Shortlisted (${statusCounts.shortlisted})`} value="shortlisted" sx={{ textTransform: 'none', minHeight: 38, py: 0.75 }} />
                <Tab label={`Rejected (${statusCounts.rejected})`} value="rejected" sx={{ textTransform: 'none', minHeight: 38, py: 0.75 }} />
              </Tabs>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.25 }}>
                <FormControl size="small" sx={{ width: { xs: '100%', sm: 190 } }}>
                  <InputLabel>Sort By Match Score</InputLabel>
                  <Select value={sortMode} label="Sort By Match Score" onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <MenuItem value="applied_desc">Newest Applied</MenuItem>
                    <MenuItem value="match_desc">Match Score: High to Low</MenuItem>
                    <MenuItem value="match_asc">Match Score: Low to High</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ width: { xs: '100%', sm: 190 } }}>
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
            <Paper
              sx={{
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.24)',
                borderRadius: 2,
                boxShadow: '0 24px 70px rgba(15, 23, 42, 0.08)',
                bgcolor: '#fff',
              }}
            >
              <TableContainer
                sx={{
                  width: '100%',
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 280px)',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { height: 10, width: 10 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100,116,139,0.35)', borderRadius: 99 },
                  '&::-webkit-scrollbar-track': { bgcolor: 'rgba(226,232,240,0.7)' },
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    minWidth: 980,
                    tableLayout: 'fixed',
                    '& .MuiTableCell-root': {
                      px: 0.75,
                      py: 0.55,
                      fontSize: 12,
                      lineHeight: 1.25,
                    },
                    '& .MuiCheckbox-root': {
                      p: 0.5,
                    },
                    '& .MuiTableRow-root': {
                      height: 40,
                    },
                    '& .MuiChip-root': {
                      height: 22,
                      maxWidth: '100%',
                    },
                    '& .MuiChip-label': {
                      px: 0.75,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell padding="none" sx={{ bgcolor: '#f8fafc', width: 70, minWidth: 70, maxWidth: 70 }}>
                        <Box sx={{ width: 70, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Checkbox
                            indeterminate={!allVisibleSelected && someVisibleSelected}
                            checked={allVisibleSelected}
                            onChange={toggleVisibleApplicants}
                            inputProps={{ 'aria-label': 'Select all candidates' }}
                            sx={{ width: 32, height: 32 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 150, pl: 3 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 168 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 118 }}>Tags</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 130 }}>Talent Pool</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 112 }}>ATS Stage</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 112 }}>Match Score</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 96 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 102 }}>Applied</TableCell>
                      <TableCell sx={{ fontWeight: 900, bgcolor: '#f8fafc', width: 86 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleApplicants.map((applicant) => {
                      const matchScore = getApplicantMatchScore(applicant);
                      const matchHex = getMatchScoreHex(matchScore.score);
                      const profile = applicant.profiles;
                      const checked = selectedIds.has(applicant.id);
                      const isUnlocked = Boolean(unlockedApplicants[applicant.user_id]);
                      return (
                        <TableRow key={applicant.id} hover selected={checked}>
                          <TableCell padding="none" sx={{ width: 70, minWidth: 70, maxWidth: 70 }}>
                            <Box sx={{ width: 70, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Checkbox checked={checked} onChange={() => toggleApplicant(applicant.id)} inputProps={{ 'aria-label': `Select ${profile?.name || 'candidate'}` }} sx={{ width: 32, height: 32 }} />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ pl: 3 }}><Typography sx={{ fontWeight: 800, color: '#020617', fontSize: 12 }} noWrap>{profile?.name || profile?.full_name || 'Unknown'}</Typography></TableCell>
                          <TableCell>
                            {isUnlocked ? (
                              <Typography variant="body2" sx={{ fontSize: 12 }} noWrap>
                                {profile?.email || 'Not provided'}
                              </Typography>
                            ) : (
                              <Chip
                                icon={<LockIcon />}
                                label="Email Locked"
                                size="small"
                                variant="filled"
                                sx={{ fontWeight: 800 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', minWidth: 0 }}>
                              {getApplicantTags(applicant).slice(0, 3).map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" />)}
                              {getApplicantTags(applicant).length === 0 && <Typography variant="caption" color="text.secondary">No tags</Typography>}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', minWidth: 0 }}>
                              {getApplicantTalentPools(applicant).slice(0, 2).map((pool) => <Chip key={pool} label={pool} size="small" color="info" variant="outlined" />)}
                              {getApplicantTalentPools(applicant).length === 0 && <Typography variant="caption" color="text.secondary">None</Typography>}
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={getApplicantStage(applicant)} size="small" sx={{ borderRadius: 1, fontWeight: 700 }} /></TableCell>
                          <TableCell>
                            <Chip label={matchScore.label} size="small" sx={{ fontWeight: 800, bgcolor: `${matchHex}14`, color: matchHex, border: `1px solid ${matchHex}33` }} />
                          </TableCell>
                          <TableCell><Chip label={labelize(applicant.status)} size="small" color={getStatusColor(applicant.status)} variant="filled" /></TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontSize: 12 }} noWrap>{applicant.applied_at ? format(new Date(applicant.applied_at), 'dd MMM yyyy') : 'Unknown'}</Typography></TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleViewApplicant(applicant)} title="View details"><ViewIcon fontSize="small" /></IconButton>
                            {applicant.resume_url && isUnlocked && (
                              <Tooltip title={isUnlocked ? 'View resume' : 'Unlock candidate to download resume.'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    href={String(applicant.resume_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View resume"
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {applicant.resume_url && !isUnlocked && (
                              <Tooltip title="Unlock candidate to download resume.">
                                <span>
                                  <IconButton size="small" disabled title="Unlock candidate to download resume.">
                                    <LockIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
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
          recruiterId={recruiterId}
          onStatusChange={handleStatusChanged}
          onUnlocked={() => setUnlockedApplicants((current) => ({ ...current, [selectedApplicant.user_id]: true }))}
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
