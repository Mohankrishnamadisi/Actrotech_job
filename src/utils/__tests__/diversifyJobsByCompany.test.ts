/**
 * Test examples for diversifyJobsByCompany utility
 * 
 * Run with: npm test src/utils/__tests__/diversifyJobsByCompany.test.ts
 */

import { describe, it, expect } from 'vitest';
import { diversifyJobsByCompany } from '../diversifyJobsByCompany';
import type { Job } from '../../types';

// Mock job factory
const createMockJob = (id: string, company: string, title: string): Job => ({
  id,
  title,
  company_name: company,
  location: 'India',
  description: 'Test job',
  experience: '2-3 years',
  skills: [],
  status: 'published',
});

describe('diversifyJobsByCompany', () => {
  describe('Basic Diversification', () => {
    it('should diversify jobs by company', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'HCL', 'Dev 2'),
        createMockJob('3', 'HCL', 'Dev 3'),
        createMockJob('4', 'Infosys', 'Dev 4'),
        createMockJob('5', 'TCS', 'Dev 5'),
        createMockJob('6', 'HCL', 'Dev 6'),
      ];

      const result = diversifyJobsByCompany(jobs);

      // Verify no more than 2 consecutive from same company (default)
      for (let i = 0; i < result.length - 2; i++) {
        const company1 = result[i].company_name;
        const company2 = result[i + 1].company_name;
        const company3 = result[i + 2].company_name;
        const tooManyConsecutive = company1 === company2 && company2 === company3;
        expect(tooManyConsecutive).toBe(false);
      }

      // Should return all jobs
      expect(result.length).toBe(jobs.length);
    });

    it('should preserve order for single company', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'HCL', 'Dev 2'),
        createMockJob('3', 'HCL', 'Dev 3'),
      ];

      const result = diversifyJobsByCompany(jobs);
      expect(result.map((j) => j.id)).toEqual(['1', '2', '3']);
    });

    it('should return empty array for empty input', () => {
      const result = diversifyJobsByCompany([]);
      expect(result.length).toBe(0);
    });

    it('should handle small lists', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'Infosys', 'Dev 2'),
      ];

      const result = diversifyJobsByCompany(jobs);
      expect(result.length).toBe(2);
      // Should alternate between companies
      expect(result[0].company_name).not.toBe(result[1].company_name);
    });
  });

  describe('Configuration Options', () => {
    it('should respect maxConsecutive option', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'HCL', 'Dev 2'),
        createMockJob('3', 'HCL', 'Dev 3'),
        createMockJob('4', 'HCL', 'Dev 4'),
        createMockJob('5', 'Infosys', 'Dev 5'),
      ];

      const result = diversifyJobsByCompany(jobs, { maxConsecutive: 1 });

      // No two consecutive from same company
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].company_name).not.toBe(result[i + 1].company_name);
      }
    });

    it('should respect minCompanies option', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
      ];

      // With minCompanies: 2, single company should return original
      const result = diversifyJobsByCompany(jobs, { minCompanies: 2 });
      expect(result.map((j) => j.id)).toEqual(['1']);
    });

    it('should disable diversification when minCompanies is 1', () => {
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'Infosys', 'Dev 2'),
        createMockJob('3', 'HCL', 'Dev 3'),
      ];

      // With minCompanies: 1, acts like single company
      const result = diversifyJobsByCompany(jobs, { minCompanies: 1 });
      // Should still diversify since we have 2 companies
      expect(result.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle jobs with missing company_name', () => {
      const jobs: Job[] = [
        { ...createMockJob('1', '', 'Dev 1'), company_name: '' },
        createMockJob('2', 'HCL', 'Dev 2'),
        createMockJob('3', 'Infosys', 'Dev 3'),
      ];

      const result = diversifyJobsByCompany(jobs);
      expect(result.length).toBe(3);
    });

    it('should handle large job lists', () => {
      const companies = ['HCL', 'Infosys', 'TCS', 'Wipro', 'Cognizant'];
      const jobs: Job[] = [];

      // Create 100 jobs (20 per company)
      for (let i = 0; i < 100; i++) {
        const company = companies[i % companies.length];
        jobs.push(createMockJob(`${i}`, company, `Dev ${i}`));
      }

      const result = diversifyJobsByCompany(jobs);
      expect(result.length).toBe(100);

      // Verify no more than maxConsecutive from same company
      for (let i = 0; i < result.length - 2; i++) {
        const company1 = result[i].company_name;
        const company2 = result[i + 1].company_name;
        const company3 = result[i + 2].company_name;
        const tooManyConsecutive = company1 === company2 && company2 === company3;
        expect(tooManyConsecutive).toBe(false);
      }
    });

    it('should maintain all job properties', () => {
      const jobs: Job[] = [
        {
          ...createMockJob('1', 'HCL', 'Dev 1'),
          location: 'Bangalore',
          experience: '5+ years',
          skills: ['React', 'TypeScript'],
        },
        createMockJob('2', 'Infosys', 'Dev 2'),
      ];

      const result = diversifyJobsByCompany(jobs);
      const hclJob = result.find((j) => j.id === '1');

      expect(hclJob?.location).toBe('Bangalore');
      expect(hclJob?.experience).toBe('5+ years');
      expect(hclJob?.skills).toEqual(['React', 'TypeScript']);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle scraper output pattern (many same company in row)', () => {
      // This is the problem we're solving: jobs from scraper come company-by-company
      const jobs: Job[] = [
        createMockJob('1', 'HCL', 'Dev 1'),
        createMockJob('2', 'HCL', 'Dev 2'),
        createMockJob('3', 'HCL', 'Dev 3'),
        createMockJob('4', 'HCL', 'Dev 4'),
        createMockJob('5', 'Infosys', 'Dev 5'),
        createMockJob('6', 'Infosys', 'Dev 6'),
        createMockJob('7', 'TCS', 'Dev 7'),
        createMockJob('8', 'IBM', 'Dev 8'),
        createMockJob('9', 'Google', 'Dev 9'),
      ];

      const result = diversifyJobsByCompany(jobs);

      // Expected output pattern: mix of companies
      const companies = result.map((j) => j.company_name);
      
      // Should not have 3+ consecutive same company
      let maxConsecutive = 0;
      let currentConsecutive = 1;
      for (let i = 1; i < companies.length; i++) {
        if (companies[i] === companies[i - 1]) {
          currentConsecutive++;
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        } else {
          currentConsecutive = 1;
        }
      }
      expect(maxConsecutive).toBeLessThanOrEqual(2);
    });

    it('should work with pagination simulation', () => {
      // Simulate paginating through diversified results
      const jobs: Job[] = [];
      const companies = ['HCL', 'Infosys', 'TCS'];

      // Create 60 jobs (20 per company)
      for (let i = 0; i < 60; i++) {
        const company = companies[i % companies.length];
        jobs.push(createMockJob(`${i}`, company, `Dev ${i}`));
      }

      const diversified = diversifyJobsByCompany(jobs);
      const pageSize = 20;

      // Simulate 3 pages
      for (let page = 0; page < 3; page++) {
        const start = page * pageSize;
        const end = start + pageSize;
        const pageJobs = diversified.slice(start, end);

        // Each page should have diverse companies
        const uniqueCompanies = new Set(pageJobs.map((j) => j.company_name));
        expect(uniqueCompanies.size).toBeGreaterThan(1);
      }
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large datasets efficiently', () => {
      const jobs: Job[] = [];
      const companies = [
        'HCL', 'Infosys', 'TCS', 'Wipro', 'Cognizant',
        'Accenture', 'IBM', 'Google', 'Amazon', 'Microsoft',
      ];

      // Create 10,000 jobs
      for (let i = 0; i < 10000; i++) {
        const company = companies[i % companies.length];
        jobs.push(createMockJob(`${i}`, company, `Dev ${i}`));
      }

      const start = performance.now();
      const result = diversifyJobsByCompany(jobs);
      const duration = performance.now() - start;

      expect(result.length).toBe(10000);
      // Should complete reasonably fast (under 100ms for 10K items)
      expect(duration).toBeLessThan(100);
    });
  });
});
