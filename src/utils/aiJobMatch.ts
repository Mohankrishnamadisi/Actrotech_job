import { getMatchScoreColor, normalizeSkills } from './matchScore';
import type { MatchScoreColor } from './matchScore';

export interface AIMatchResult {
  score: number;
  label: string;
  color: MatchScoreColor;
  skillsPercent: number;
  experiencePercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

function normalizeToken(value: unknown): string {
  return String(value || '').toLowerCase().trim().replace(/[.\s_-]+/g, '');
}

function skillsMatch(candidateSkill: string, requiredSkill: string): boolean {
  return (
    candidateSkill === requiredSkill ||
    candidateSkill.includes(requiredSkill) ||
    requiredSkill.includes(candidateSkill)
  );
}

function parseExperienceRequirement(value: unknown): { min: number | null; max: number | null } {
  if (value == null || value === '') return { min: null, max: null };
  if (typeof value === 'number') return { min: value, max: null };

  const text = String(value).toLowerCase();
  if (text.includes('fresher') || text.includes('entry') || text.includes('0 year')) {
    return { min: 0, max: 1 };
  }

  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
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

export function computeAIMatch(candidate: Record<string, any> | null | undefined, job: Record<string, any> | null | undefined): AIMatchResult {
  const jobSkills = normalizeSkills(job?.skills || []);
  const candidateSkills = normalizeSkills(candidate?.skills || []);

  const normalizedCandidate = candidateSkills.map(normalizeToken);
  const normalizedRequired = jobSkills.map(normalizeToken);

  const matchedSkills = jobSkills.filter((skill) =>
    normalizedCandidate.some((cs) => skillsMatch(cs, normalizeToken(skill)))
  );
  const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));

  const skillsPercent = jobSkills.length === 0 ? 100 : Math.round((matchedSkills.length / jobSkills.length) * 100);

  const requiredExp = parseExperienceRequirement(job?.experience ?? job?.experience_years ?? job?.min_experience);
  const candidateYears = parseYears(candidate?.experience_years ?? candidate?.total_experience ?? candidate?.experience ?? candidate?.work_experience);

  let experiencePercent = 0;
  if (requiredExp.min == null) {
    experiencePercent = 100;
  } else if (candidateYears == null) {
    experiencePercent = 0;
  } else if (candidateYears >= requiredExp.min) {
    experiencePercent = 100;
  } else {
    experiencePercent = Math.round((candidateYears / Math.max(1, requiredExp.min)) * 100);
  }

  // Weights: skills 70%, experience 30%
  const score = Math.max(0, Math.min(100, Math.round(skillsPercent * 0.7 + experiencePercent * 0.3)));

  const suggestions: string[] = [];
  if (missingSkills.length > 0) suggestions.push(`Consider adding or improving: ${missingSkills.slice(0, 6).join(', ')}`);
  if (requiredExp.min != null && candidateYears != null && candidateYears < requiredExp.min) {
    const diff = Math.round(requiredExp.min - candidateYears);
    suggestions.push(`Gain ~${diff} more year${diff === 1 ? '' : 's'} of experience or highlight relevant projects`);
  }
  if (suggestions.length === 0) suggestions.push('Your profile looks well matched. Keep it updated!');

  return {
    score,
    label: `${score}% Match`,
    color: getMatchScoreColor(score),
    skillsPercent,
    experiencePercent,
    matchedSkills,
    missingSkills,
    suggestions,
  };
}

export default computeAIMatch;
