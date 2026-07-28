/**
 * Diversifies jobs by company to create a more pleasant browsing experience.
 * Prevents consecutive jobs from the same company while preserving filters,
 * pagination, and search results.
 *
 * Algorithm:
 * 1. Group jobs by company
 * 2. Distribute companies using a rotation pattern
 * 3. Avoid long consecutive runs from the same company
 * 4. Preserve newest jobs within each company group
 *
 * @example
 * const diversified = diversifyJobsByCompany(jobs);
 *
 * @example With window fetching (recommended for pagination):
 * // Fetch 2-3x the requested page size
 * const largerWindow = await jobService.getJobs(filters, page, 50);
 * const diversified = diversifyJobsByCompany(largerWindow.data);
 * const paginatedResult = diversified.slice(0, 20); // Return requested page size
 */

import type { Job } from '../types';

export interface DiversificationOptions {
  /**
   * Maximum consecutive jobs from the same company.
   * Default: 2
   */
  maxConsecutive?: number;

  /**
   * Minimum unique companies to consider (if below threshold, return original order)
   * Default: 2
   */
  minCompanies?: number;

  /**
   * Field to use for company grouping. Default: 'company_name'
   */
  companyField?: keyof Job | string;
}

/**
 * Diversifies an array of jobs by company to improve user experience.
 *
 * @param jobs - Array of jobs to diversify
 * @param options - Optional configuration
 * @returns Diversified array of jobs
 */
export function diversifyJobsByCompany(
  jobs: Job[],
  options: DiversificationOptions = {}
): Job[] {
  const { maxConsecutive = 2, minCompanies = 2, companyField = 'company_name' } = options;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return jobs;
  }

  // Group jobs by company
  const companyClusters = groupJobsByCompany(jobs, companyField);

  // If only one or fewer companies, return original order
  if (companyClusters.size < minCompanies) {
    return jobs;
  }

  // If very small list, return original order to preserve relevance
  if (jobs.length <= 3) {
    return jobs;
  }

  // Apply diversification algorithm
  return diversifyByRoundRobin(companyClusters, maxConsecutive);
}

/**
 * Groups jobs by company, preserving order within each group.
 */
function groupJobsByCompany(jobs: Job[], companyField: keyof Job | string): Map<string, Job[]> {
  const groups = new Map<string, Job[]>();

  for (const job of jobs) {
    const company = String(job[companyField as keyof Job] || 'Unknown').trim();

    if (!groups.has(company)) {
      groups.set(company, []);
    }
    groups.get(company)!.push(job);
  }

  return groups;
}

/**
 * Implements a round-robin diversification algorithm with consecutive run prevention.
 *
 * Strategy:
 * - Rotate through companies in rounds
 * - Allow maxConsecutive jobs from same company
 * - After reaching consecutive limit, skip to next company
 * - Continue until all jobs are placed
 */
function diversifyByRoundRobin(
  companyClusters: Map<string, Job[]>,
  maxConsecutive: number
): Job[] {
  const result: Job[] = [];
  const companies = Array.from(companyClusters.keys());
  const indices = new Map<string, number>(companies.map((c) => [c, 0]));
  let currentCompanyIdx = 0;
  let consecutiveCount = 0;
  let lastCompany: string | null = null;

  // Calculate total jobs for termination condition
  const totalJobs = Array.from(companyClusters.values()).reduce((sum, jobs) => sum + jobs.length, 0);

  while (result.length < totalJobs) {
    let found = false;
    let attempts = 0;
    const maxAttempts = companies.length;

    // Try to find a company that can contribute jobs
    while (attempts < maxAttempts) {
      const company = companies[currentCompanyIdx % companies.length];
      const clusterIndex = indices.get(company) || 0;
      const cluster = companyClusters.get(company);

      if (cluster && clusterIndex < cluster.length) {
        // Check if we can add from this company
        if (company !== lastCompany) {
          // Different company - always add
          result.push(cluster[clusterIndex]);
          indices.set(company, clusterIndex + 1);
          lastCompany = company;
          consecutiveCount = 1;
          found = true;
        } else if (consecutiveCount < maxConsecutive) {
          // Same company but haven't hit consecutive limit
          result.push(cluster[clusterIndex]);
          indices.set(company, clusterIndex + 1);
          consecutiveCount++;
          found = true;
        }
        // else: same company and hit limit, skip to next

        if (found) {
          currentCompanyIdx++;
          break;
        }
      }

      currentCompanyIdx++;
      attempts++;
    }

    // Safety check: if no job was added in a full round, add next available
    if (!found) {
      for (const company of companies) {
        const clusterIndex = indices.get(company) || 0;
        const cluster = companyClusters.get(company);

        if (cluster && clusterIndex < cluster.length) {
          result.push(cluster[clusterIndex]);
          indices.set(company, clusterIndex + 1);
          lastCompany = company;
          consecutiveCount = 1;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Diversifies jobs while maintaining pagination windows.
 *
 * Use this when fetching a larger window for pagination:
 * 1. Fetch a larger window from Supabase (e.g., 50 jobs instead of 20)
 * 2. Diversify the window
 * 3. Extract the requested page
 *
 * @example
 * const windowSize = 50;
 * const requestedPageSize = 20;
 * const { data: windowJobs } = await jobService.getJobs(filters, page, windowSize);
 * const diversified = diversifyJobsByCompany(windowJobs);
 * const pageJobs = diversified.slice(0, requestedPageSize);
 *
 * @param jobs - Jobs fetched from database
 * @param pageSize - Original requested page size
 * @param options - Optional diversification options
 * @returns Diversified jobs suitable for returning to UI
 */
export function diversifyWithPagination(
  jobs: Job[],
  pageSize: number,
  options: DiversificationOptions = {}
): Job[] {
  const diversified = diversifyJobsByCompany(jobs, options);
  return diversified.slice(0, pageSize);
}
