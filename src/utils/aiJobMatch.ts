import { getMatchScoreColor, normalizeSkills } from './matchScore';
import type { MatchScoreColor } from './matchScore';
import { parseExperienceRequirement, parseCandidateExperienceMonths } from '@utils/experience';

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
  const candidateMonths = parseCandidateExperienceMonths(candidate);

  let experiencePercent = 0;
  if (requiredExp.min == null) {
    experiencePercent = 100;
  } else if (candidateMonths == null) {
    experiencePercent = 0;
  } else if (candidateMonths >= requiredExp.min) {
    experiencePercent = 100;
  } else {
    experiencePercent = Math.round((candidateMonths / Math.max(1, requiredExp.min)) * 100);
  }

  // Weights: skills 70%, experience 30%
  const score = Math.max(0, Math.min(100, Math.round(skillsPercent * 0.7 + experiencePercent * 0.3)));

  const suggestions: string[] = [];
  if (missingSkills.length > 0) suggestions.push(`Consider adding or improving: ${missingSkills.slice(0, 6).join(', ')}`);
  if (requiredExp.min != null && candidateMonths != null && candidateMonths < requiredExp.min) {
    const diffMonths = requiredExp.min - candidateMonths;
    const diffYears = Math.floor(diffMonths / 12);
    const diffRemainingMonths = diffMonths % 12;
    const diffText = diffYears > 0
      ? `${diffYears} year${diffYears === 1 ? '' : 's'}${diffRemainingMonths > 0 ? ` ${diffRemainingMonths} month${diffRemainingMonths === 1 ? '' : 's'}` : ''}`
      : `${diffRemainingMonths} month${diffRemainingMonths === 1 ? '' : 's'}`;
    suggestions.push(`Gain ~${diffText} more experience or highlight relevant projects`);
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
