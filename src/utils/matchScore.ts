import type { Job } from '@types';
import { parseExperienceRequirement, parseCandidateExperienceMonths } from '@utils/experience';

export type MatchScoreColor = 'success' | 'warning' | 'error';

export interface MatchScoreBreakdownItem {
  label: string;
  weight: number;
  percent: number;
  points: number;
}

export interface MatchScoreResult {
  score: number;
  label: string;
  color: MatchScoreColor;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  breakdown: {
    skills: MatchScoreBreakdownItem;
    experience: MatchScoreBreakdownItem;
    location: MatchScoreBreakdownItem;
    salary: MatchScoreBreakdownItem;
    education: MatchScoreBreakdownItem;
    title: MatchScoreBreakdownItem;
  };
}

type CandidateLike = Record<string, any> | null | undefined;
type JobLike = Partial<Job> | Record<string, any> | null | undefined;

const WEIGHTS = {
  skills: 40,
  experience: 20,
  location: 10,
  salary: 10,
  education: 10,
  title: 10,
} as const;

const emptyBreakdown = (label: string, weight: number): MatchScoreBreakdownItem => ({
  label,
  weight,
  percent: 0,
  points: 0,
});

export function normalizeSkills(skills: unknown): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  if (typeof skills === 'string') {
    return skills
      .split(/[,|;\/\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function calculateSkillMatchScore(jobSkills: unknown, candidateSkills: unknown): number {
  const requiredSkills = normalizeSkills(jobSkills);
  const profileSkills = normalizeSkills(candidateSkills);

  if (!requiredSkills.length) return 100;
  if (!profileSkills.length) return 0;

  const normalizedCandidate = profileSkills.map(normalizeToken);
  const matches = requiredSkills.filter((skill) =>
    normalizedCandidate.some((candidateSkill) => skillsMatch(candidateSkill, normalizeToken(skill)))
  ).length;

  return Math.round((matches / requiredSkills.length) * 100);
}

export function calculateMatchScore(candidate: CandidateLike, job: JobLike): MatchScoreResult {
  const matchedSkills = getMatchedSkills(job?.skills, candidate?.skills);
  const missingSkills = getMissingSkills(job?.skills, candidate?.skills);

  const skillsPercent = calculateSkillMatchScore(job?.skills, candidate?.skills);
  const experiencePercent = scoreExperience(candidate, job);
  const locationPercent = scoreLocation(candidate, job);
  const salaryPercent = scoreSalary(candidate, job);
  const educationPercent = scoreEducation(candidate, job);
  const titlePercent = calculateTitleMatchScore(candidate, job);

  const breakdown = {
    skills: makeBreakdown('Skills Match', WEIGHTS.skills, skillsPercent),
    experience: makeBreakdown('Experience Match', WEIGHTS.experience, experiencePercent),
    location: makeBreakdown('Location Match', WEIGHTS.location, locationPercent),
    salary: makeBreakdown('Salary Match', WEIGHTS.salary, salaryPercent),
    education: makeBreakdown('Education Match', WEIGHTS.education, educationPercent),
    title: makeBreakdown('Title Match', WEIGHTS.title, titlePercent),
  };

  const score = clampScore(
    breakdown.skills.points +
      breakdown.experience.points +
      breakdown.location.points +
      breakdown.salary.points +
      breakdown.education.points +
      breakdown.title.points
  );

  return {
    score,
    label: `${score}% Match`,
    color: getMatchScoreColor(score),
    matchedSkills,
    missingSkills,
    strengths: buildStrengths({
      matchedSkills,
      missingSkills,
      skillsPercent,
      experiencePercent,
      locationPercent,
      salaryPercent,
      educationPercent,
      titlePercent,
      candidate,
      job,
    }),
    breakdown,
  };
}

export function getMatchScoreColor(score: number): MatchScoreColor {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

export function getMatchScoreHex(score: number): string {
  if (score >= 90) return '#057642';
  if (score >= 70) return '#B45309';
  return '#B91C1C';
}

function makeBreakdown(label: string, weight: number, percent: number): MatchScoreBreakdownItem {
  const safePercent = clampScore(percent);
  return {
    label,
    weight,
    percent: safePercent,
    points: Math.round((safePercent / 100) * weight),
  };
}

function getMatchedSkills(jobSkills: unknown, candidateSkills: unknown): string[] {
  const requiredSkills = normalizeSkills(jobSkills);
  const profileSkills = normalizeSkills(candidateSkills);
  const normalizedCandidate = profileSkills.map(normalizeToken);

  return requiredSkills.filter((skill) =>
    normalizedCandidate.some((candidateSkill) => skillsMatch(candidateSkill, normalizeToken(skill)))
  );
}

function getMissingSkills(jobSkills: unknown, candidateSkills: unknown): string[] {
  const requiredSkills = normalizeSkills(jobSkills);
  const profileSkills = normalizeSkills(candidateSkills);
  const normalizedCandidate = profileSkills.map(normalizeToken);

  return requiredSkills.filter(
    (skill) => !normalizedCandidate.some((candidateSkill) => skillsMatch(candidateSkill, normalizeToken(skill)))
  );
}

function scoreExperience(candidate: CandidateLike, job: JobLike): number {
  const required = parseExperienceRequirement(job?.experience ?? job?.experience_years ?? job?.min_experience);
  const candidateMonths = parseCandidateExperienceMonths(candidate);

  if (required.min == null) return 100;
  if (candidateMonths == null) return 0;
  if (candidateMonths >= required.min && (required.max == null || candidateMonths <= required.max + 24)) return 100;
  if (candidateMonths >= required.min * 0.75) return 75;
  if (candidateMonths >= required.min * 0.5) return 50;
  return 20;
}

function scoreLocation(candidate: CandidateLike, job: JobLike): number {
  const jobLocation = normalizeText(job?.location);
  const candidateLocation = normalizeText(
    candidate?.location ||
      [candidate?.city, candidate?.state, candidate?.country].filter(Boolean).join(' ')
  );
  const workMode = normalizeText(job?.work_mode || job?.workMode);

  if (workMode.includes('remote') || jobLocation.includes('remote')) return 100;
  if (!jobLocation) return 100;
  if (!candidateLocation) return 0;
  if (candidateLocation === jobLocation) return 100;
  if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) return 90;

  const jobParts = splitLocation(jobLocation);
  const candidateParts = splitLocation(candidateLocation);
  const overlap = jobParts.filter((part) => candidateParts.includes(part)).length;
  if (overlap > 0) return 70;
  return workMode.includes('hybrid') ? 50 : 0;
}

function scoreSalary(candidate: CandidateLike, job: JobLike): number {
  const expectedSalary = parseSalary(
    candidate?.expected_ctc ??
      candidate?.expectedCtc ??
      candidate?.expected_salary ??
      candidate?.salary_expectation ??
      candidate?.current_ctc ??
      candidate?.currentCtc
  );
  const minSalary = parseSalary(job?.salary_min ?? job?.salaryMin);
  const maxSalary = parseSalary(job?.salary_max ?? job?.salaryMax);

  if (expectedSalary == null || (minSalary == null && maxSalary == null)) return 100;
  if (maxSalary != null && expectedSalary <= maxSalary) return 100;
  if (minSalary != null && maxSalary == null && expectedSalary >= minSalary) return 100;
  if (maxSalary != null && expectedSalary <= maxSalary * 1.15) return 70;
  if (maxSalary != null && expectedSalary <= maxSalary * 1.3) return 40;
  return 0;
}

function scoreEducation(candidate: CandidateLike, job: JobLike): number {
  const required = normalizeText(job?.education || job?.qualification || job?.requirements);
  const educationText = normalizeText(
    Array.isArray(candidate?.education)
      ? candidate.education
          .map((item: any) => [item.degree, item.field, item.school].filter(Boolean).join(' '))
          .join(' ')
      : candidate?.education || candidate?.highest_education || candidate?.qualification
  );

  if (!required) return 100;
  if (!educationText) return 0;
  if (educationText.includes(required) || required.includes(educationText)) return 100;

  const requiredRank = educationRank(required);
  const candidateRank = educationRank(educationText);
  if (requiredRank > 0 && candidateRank >= requiredRank) return 100;

  const requiredWords = keywordSet(required);
  const candidateWords = keywordSet(educationText);
  const overlap = [...requiredWords].filter((word) => candidateWords.has(word)).length;
  if (overlap >= 2) return 80;
  if (overlap === 1) return 50;
  return 0;
}

function buildStrengths(input: {
  matchedSkills: string[];
  missingSkills: string[];
  skillsPercent: number;
  experiencePercent: number;
  locationPercent: number;
  salaryPercent: number;
  educationPercent: number;
  titlePercent: number;
  candidate: CandidateLike;
  job: JobLike;
}): string[] {
  const strengths: string[] = [];

  if (input.skillsPercent >= 80 && input.matchedSkills.length > 0) {
    strengths.push(`Strong skill fit: ${input.matchedSkills.slice(0, 5).join(', ')}`);
  } else if (input.matchedSkills.length > 0) {
    strengths.push(`Matches key skills: ${input.matchedSkills.slice(0, 3).join(', ')}`);
  }

  if (input.titlePercent >= 80) {
    strengths.push('Preferred job titles align closely with the role');
  }
  if (input.experiencePercent >= 100) strengths.push('Experience aligns with the role requirement');
  if (input.locationPercent >= 90) strengths.push('Location or work mode is a strong fit');
  if (input.salaryPercent >= 100) strengths.push('Salary expectation appears aligned');
  if (input.educationPercent >= 80) strengths.push('Education aligns with the job requirement');

  const candidateTitle = input.candidate?.headline || input.candidate?.title;
  const jobTitle = input.job?.title;
  if (candidateTitle && jobTitle && normalizeText(candidateTitle).includes(normalizeText(jobTitle))) {
    strengths.push('Profile headline closely matches the job title');
  }

  if (strengths.length === 0 && input.missingSkills.length > 0) {
    strengths.push('Candidate has partial overlap but needs review against core requirements');
  }

  return strengths.slice(0, 5);
}

function parseExperienceRequirement(value: unknown): { min: number | null; max: number | null } {
  if (value == null || value === '') return { min: null, max: null };
  if (typeof value === 'number') return { min: value, max: null };

  const text = String(value).toLowerCase();
  if (text.includes('fresher') || text.includes('entry') || text.includes('0 year')) {
    return { min: 0, max: 1 };
  }

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length >= 2) return { min: Math.min(numbers[0], numbers[1]), max: Math.max(numbers[0], numbers[1]) };
  if (numbers.length === 1) return { min: numbers[0], max: null };
  return { min: null, max: null };
}

function parseYears(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value).toLowerCase();
  if (text.includes('fresher')) return 0;
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function calculateTitleMatchScore(candidate: CandidateLike, job: JobLike): number {
  const jobTitle = normalizeTitle(job?.title);
  const candidateTitles = normalizeTitleArray(
    candidate?.preferred_job_titles ||
      candidate?.preferredJobTitles ||
      candidate?.headline ||
      candidate?.title ||
      []
  );

  if (!jobTitle || candidateTitles.length === 0) return 0;

  if (candidateTitles.some((title) => title === jobTitle)) return 100;
  if (candidateTitles.some((title) => jobTitle.includes(title) || title.includes(jobTitle))) return 90;
  if (candidateTitles.some((title) => titleGroupMatch(title, jobTitle))) return 85;

  const overlap = candidateTitles.reduce((best, title) => {
    const shared = tokenOverlap(title, jobTitle);
    return Math.max(best, shared);
  }, 0);

  if (overlap >= 3) return 80;
  if (overlap >= 2) return 60;
  if (overlap >= 1) return 35;
  return 0;
}

function normalizeTitle(value: unknown): string {
  return String(value || '').toLowerCase().replace(/[\s._\-\/]+/g, ' ').trim();
}

function normalizeTitleArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(normalizeTitle).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,;\/\n]/)
      .map(normalizeTitle)
      .filter(Boolean);
  }
  return [];
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(a.split(/\W+/).filter(Boolean));
  const bTokens = new Set(b.split(/\W+/).filter(Boolean));
  return [...aTokens].filter((token) => bTokens.has(token)).length;
}

function titleGroupMatch(a: string, b: string): boolean {
  const groups = [
    ['frontend developer', 'frontend engineer', 'ui developer', 'ui/ux developer', 'web developer', 'javascript developer', 'software engineer frontend', 'react developer', 'react engineer', 'ui designer'],
    ['backend developer', 'backend engineer', 'api developer', 'software engineer backend', 'node developer', 'node engineer'],
    ['full stack developer', 'full stack engineer', 'software engineer', 'web application developer', 'backend developer', 'frontend developer'],
    ['data scientist', 'machine learning engineer', 'data analyst', 'ai engineer'],
    ['devops engineer', 'site reliability engineer', 'cloud engineer', 'infrastructure engineer'],
  ];

  return groups.some((group) => group.includes(a) && group.includes(b));
}

function parseSalary(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const text = String(value).toLowerCase().replace(/,/g, '');
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;

  const amount = Number(match[0]);
  if (text.includes('lpa') || text.includes('lakh') || text.includes('lac')) return amount * 100000;
  if (text.includes('cr') || text.includes('crore')) return amount * 10000000;
  return amount;
}

function educationRank(text: string): number {
  if (/\b(phd|doctorate|doctoral)\b/.test(text)) return 5;
  if (/\b(mtech|m\.tech|masters|master|mba|mca|msc|m\.sc|post graduate|pg)\b/.test(text)) return 4;
  if (/\b(btech|b\.tech|bachelors|bachelor|be|b\.e|bca|bsc|b\.sc|graduate)\b/.test(text)) return 3;
  if (/\b(diploma|polytechnic)\b/.test(text)) return 2;
  if (/\b(12th|higher secondary|hsc)\b/.test(text)) return 1;
  return 0;
}

function keywordSet(text: string): Set<string> {
  return new Set(
    text
      .split(/\W+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
  );
}

function splitLocation(value: string): string[] {
  return value
    .split(/[,|/-]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function skillsMatch(candidateSkill: string, requiredSkill: string): boolean {
  return (
    candidateSkill === requiredSkill ||
    candidateSkill.includes(requiredSkill) ||
    requiredSkill.includes(candidateSkill)
  );
}

function normalizeToken(value: unknown): string {
  return normalizeText(value).replace(/[.\s_-]+/g, '');
}

function normalizeText(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .trim();
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export const emptyMatchScore: MatchScoreResult = {
  score: 0,
  label: '0% Match',
  color: 'error',
  matchedSkills: [],
  missingSkills: [],
  strengths: [],
  breakdown: {
    skills: emptyBreakdown('Skills Match', WEIGHTS.skills),
    experience: emptyBreakdown('Experience Match', WEIGHTS.experience),
    location: emptyBreakdown('Location Match', WEIGHTS.location),
    salary: emptyBreakdown('Salary Match', WEIGHTS.salary),
    education: emptyBreakdown('Education Match', WEIGHTS.education),
    title: emptyBreakdown('Title Match', WEIGHTS.title),
  },
};
