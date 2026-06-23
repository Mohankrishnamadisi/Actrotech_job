import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Job } from '@types';
import { jobService } from '@services/api';
import {
  talentPoolService,
  type TalentPoolFilters,
} from '@services/talentPool';
import type { PaginatedResult, TalentPool, TalentPoolCandidate } from '@types';

const DEFAULT_PAGE_SIZE = 12;

interface UseTalentPoolOptions {
  recruiterId: string;
  pageSize?: number;
}

export function useTalentPool({ recruiterId, pageSize = DEFAULT_PAGE_SIZE }: UseTalentPoolOptions) {
  const [pools, setPools] = useState<TalentPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<TalentPoolCandidate[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<TalentPoolCandidate>, 'data'>>({
    total: 0,
    page: 1,
    pageSize,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<TalentPoolFilters>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matchJobId, setMatchJobId] = useState<string>('');

  const [poolsLoading, setPoolsLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPool = pools.find((p) => p.id === selectedPoolId) ?? null;

  const loadPools = useCallback(async () => {
    if (!recruiterId) return;
    setPoolsLoading(true);
    setError(null);
    try {
      const data = await talentPoolService.getPools(recruiterId);
      setPools(data);
      setSelectedPoolId((prev) => {
        if (prev && data.some((p) => p.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Error loading talent pools:', err);
      setError('Failed to load talent pools');
      toast.error('Failed to load talent pools');
    } finally {
      setPoolsLoading(false);
    }
  }, [recruiterId]);

  const loadJobs = useCallback(async () => {
    if (!recruiterId) return;
    try {
      const data = await jobService.getRecruiterJobs(recruiterId);
      const active = (data || []).filter((j) => j.status === 'published' || !j.status);
      setJobs(active);
      if (active.length > 0) {
        setMatchJobId((prev) => prev || active[0].id);
      }
    } catch (err) {
      console.error('Error loading jobs for match score:', err);
    }
  }, [recruiterId]);

  const loadCandidates = useCallback(
    async (page = 1) => {
      if (!selectedPoolId) {
        setCandidates([]);
        setPagination({ total: 0, page: 1, pageSize, totalPages: 1 });
        return;
      }

      setCandidatesLoading(true);
      setError(null);
      try {
        const result = await talentPoolService.getPoolCandidates(
          selectedPoolId,
          filters,
          page,
          pageSize
        );
        setCandidates(result.data);
        setPagination({
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
      } catch (err) {
        console.error('Error loading pool candidates:', err);
        setError('Failed to load candidates');
        toast.error('Failed to load candidates');
      } finally {
        setCandidatesLoading(false);
      }
    },
    [selectedPoolId, filters, pageSize]
  );

  useEffect(() => {
    loadPools();
    loadJobs();
  }, [loadPools, loadJobs]);

  useEffect(() => {
    loadCandidates(1);
  }, [loadCandidates]);

  const createPool = async (payload: { name: string; description?: string }) => {
    setActionLoading(true);
    try {
      const created = await talentPoolService.createPool(recruiterId, payload);
      await loadPools();
      setSelectedPoolId(created.id);
      toast.success('Pool created');
      return created;
    } catch (err) {
      console.error('Error creating pool:', err);
      toast.error('Failed to create pool');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const updatePool = async (poolId: string, payload: { name?: string; description?: string }) => {
    setActionLoading(true);
    try {
      await talentPoolService.updatePool(poolId, payload);
      await loadPools();
      toast.success('Pool updated');
    } catch (err) {
      console.error('Error updating pool:', err);
      toast.error('Failed to update pool');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const deletePool = async (poolId: string) => {
    setActionLoading(true);
    try {
      await talentPoolService.deletePool(poolId);
      await loadPools();
      toast.success('Pool deleted');
    } catch (err) {
      console.error('Error deleting pool:', err);
      toast.error('Failed to delete pool');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const addCandidate = async (poolId: string, candidateId: string, notes?: string) => {
    setActionLoading(true);
    try {
      await talentPoolService.addCandidateToPool(poolId, candidateId, notes);
      await loadPools();
      if (poolId === selectedPoolId) await loadCandidates(pagination.page);
      toast.success('Candidate added to pool');
    } catch (err) {
      console.error('Error adding candidate:', err);
      toast.error('Failed to add candidate');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const removeCandidate = async (entryId: string) => {
    setActionLoading(true);
    try {
      await talentPoolService.removeCandidateFromPool(entryId);
      await loadPools();
      await loadCandidates(pagination.page);
      toast.success('Candidate removed from pool');
    } catch (err) {
      console.error('Error removing candidate:', err);
      toast.error('Failed to remove candidate');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const moveCandidate = async (entryId: string, targetPoolId: string) => {
    setActionLoading(true);
    try {
      await talentPoolService.moveCandidateBetweenPools(entryId, targetPoolId);
      await loadPools();
      await loadCandidates(pagination.page);
      toast.success('Candidate moved');
    } catch (err) {
      console.error('Error moving candidate:', err);
      toast.error('Failed to move candidate. They may already exist in the target pool.');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const setPage = (page: number) => loadCandidates(page);

  const updateFilters = useCallback((next: TalentPoolFilters) => {
    setFilters(next);
  }, []);

  const matchJob = jobs.find((j) => j.id === matchJobId) ?? null;

  return {
    pools,
    selectedPool,
    selectedPoolId,
    setSelectedPoolId,
    candidates,
    pagination,
    filters,
    updateFilters,
    setPage,
    jobs,
    matchJob,
    matchJobId,
    setMatchJobId,
    poolsLoading,
    candidatesLoading,
    actionLoading,
    error,
    loadPools,
    loadCandidates,
    createPool,
    updatePool,
    deletePool,
    addCandidate,
    removeCandidate,
    moveCandidate,
  };
}
