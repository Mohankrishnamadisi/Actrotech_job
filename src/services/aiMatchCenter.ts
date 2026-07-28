import type { Job } from '@types';

export type MatchQuality = 'excellent' | 'good' | 'average' | 'needs_improvement';
export type SelectionProbabilityBand = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';

export interface AiMatchCandidateContext {
  userId: string;
  skills: string[];
  experienceYears: number;
  education: string[];
  preferredLocations: string[];
  preferredSalaryMin?: number;
  preferredSalaryMax?: number;
  preferredWorkMode?: 'Remote' | 'Hybrid' | 'Onsite' | '';
  resumeScore: number;
  assessmentScore: number;
  profileCompletion: number;
  communicationScore: number;
}

export interface MatchBreakdown {
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  locationMatch: number;
  salaryMatch: number;
  workModeMatch: number;
  resumeMatch: number;
  assessmentMatch: number;
  profileCompletionMatch: number;
  communicationScore: number;
}

export interface MatchBreakdownEntry {
  key: keyof MatchBreakdown;
  label: string;
  value: number;
  quality: MatchQuality;
}

export interface AiMatchAnalysis {
  overallMatchScore: number;
  selectionProbability: number;
  selectionBand: SelectionProbabilityBand;
  breakdown: MatchBreakdown;
  breakdownEntries: MatchBreakdownEntry[];
  explanation: string[];
  requiredSkills: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  trendingSkills: string[];
  improvements: string[];
  aiRecommendation: string;
  bestMatchingSkill: string;
  weakestArea: string;
}

export interface AiMatchJobCardModel {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  salaryLabel: string;
  employmentType: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';
  postedDateLabel: string;
  rawJob: Job;
  analysis: AiMatchAnalysis;
}

export interface AiMatchCenterSummary {
  averageMatchScore: number;
  averageSelectionProbability: number;
  bestMatchingSkill: string;
  weakestArea: string;
  recommendedLearning: string;
  profileImprovement: string;
}

export interface AiMatchScoringProvider {
  scoreJobs(context: AiMatchCandidateContext, jobs: Job[]): AiMatchJobCardModel[];
  summarize(items: AiMatchJobCardModel[]): AiMatchCenterSummary;
}

const breakdownLabels: Record<keyof MatchBreakdown, string> = {
  skillsMatch: 'Skills Match',
  experienceMatch: 'Experience Match',
  educationMatch: 'Education Match',
  locationMatch: 'Location Match',
  salaryMatch: 'Salary Match',
  workModeMatch: 'Work Mode Match',
  resumeMatch: 'Resume Match',
  assessmentMatch: 'Assessment Match',
  profileCompletionMatch: 'Profile Completion Match',
  communicationScore: 'Communication Score',
};

const trendingSkillsSeed = [
  'Docker',
  'Kubernetes',
  'AWS',
  'System Design',
  'TypeScript',
  'Prompt Engineering',
  'MLOps',
  'Data Engineering',
  'CI/CD',
  'React',
];

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const toSkillSet = (skills: unknown): string[] => {
  if (!Array.isArray(skills)) return [];
  return skills.map((skill) => String(skill || '').trim()).filter(Boolean);
};

const parseExperienceYears = (job: Job): number => {
  const raw = String(job.experience || '').trim();
  if (!raw) return 0;
  const nums = raw.match(/\d+/g);
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return Number(nums[0]) || 0;
  return Math.max(Number(nums[0]) || 0, Number(nums[1]) || 0);
};

const normalizeWorkMode = (job: Job): 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown' => {
  const value = String(job.work_mode || job.workMode || '').toLowerCase();
  if (value.includes('remote')) return 'Remote';
  if (value.includes('hybrid')) return 'Hybrid';
  if (value.includes('onsite') || value.includes('on-site')) return 'Onsite';
  return 'Unknown';
};

const normalizeEmploymentType = (job: Job): string => {
  return String(job.job_type || job.work_type || job.jobType || 'Full-Time');
};

const normalizeSalary = (job: Job): { min?: number; max?: number; label: string } => {
  const min = Number(job.salaryMin ?? job.salary_min ?? 0) || undefined;
  const max = Number(job.salaryMax ?? job.salary_max ?? 0) || undefined;
  if (min && max) return { min, max, label: `${job.currency || 'INR'} ${min.toLocaleString()} - ${max.toLocaleString()}` };
  if (min) return { min, label: `${job.currency || 'INR'} ${min.toLocaleString()}+` };
  return { label: 'Not disclosed' };
};

const qualityFromScore = (score: number): MatchQuality => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'needs_improvement';
};

const selectionBand = (score: number): SelectionProbabilityBand => {
  if (score >= 86) return 'very_high';
  if (score >= 74) return 'high';
  if (score >= 58) return 'medium';
  if (score >= 42) return 'low';
  return 'very_low';
};

const recommendationByScore = (score: number): string => {
  if (score >= 85) return 'Excellent Match - Apply Immediately';
  if (score >= 72) return 'Strong Match - Apply Today';
  if (score >= 55) return 'Good Match - Improve Resume Before Applying';
  return 'Weak Match - Complete Missing Skills First';
};

const compareLocation = (preferredLocations: string[], jobLocation: string): number => {
  if (preferredLocations.length === 0) return 70;
  const lower = jobLocation.toLowerCase();
  const hit = preferredLocations.some((loc) => lower.includes(String(loc).toLowerCase()));
  return hit ? 95 : 48;
};

const compareSalary = (
  preferredSalaryMin: number | undefined,
  preferredSalaryMax: number | undefined,
  offeredMin: number | undefined,
  offeredMax: number | undefined,
): number => {
  if (!offeredMin && !offeredMax) return 68;
  if (!preferredSalaryMin && !preferredSalaryMax) return 74;

  const offerLow = offeredMin || offeredMax || 0;
  const offerHigh = offeredMax || offeredMin || 0;
  const expectedLow = preferredSalaryMin || preferredSalaryMax || 0;
  const expectedHigh = preferredSalaryMax || preferredSalaryMin || expectedLow;

  if (offerHigh >= expectedLow && offerLow <= expectedHigh) return 92;
  if (offerHigh >= expectedLow * 0.9) return 76;
  return 45;
};

const buildExplanation = (context: AiMatchCandidateContext, breakdown: MatchBreakdown, missingSkills: string[], bestSkill: string): string[] => {
  const lines: string[] = [];

  if (breakdown.skillsMatch >= 90) {
    lines.push(`Your ${bestSkill} skills strongly match this role requirements.`);
  } else if (breakdown.skillsMatch >= 70) {
    lines.push('Most of your skills align with this job, with room for improvement.');
  } else {
    lines.push('Core skill alignment is moderate; bridge key missing skills before applying.');
  }

  if (breakdown.experienceMatch >= 85) {
    lines.push('Experience requirement is fully aligned with your current profile.');
  } else {
    lines.push('Experience alignment can improve with stronger project outcomes in profile.');
  }

  if (breakdown.salaryMatch >= 80) {
    lines.push('Preferred salary expectation aligns with the offered compensation range.');
  } else {
    lines.push('Salary range may need negotiation or profile strengthening.');
  }

  if (breakdown.workModeMatch >= 85) {
    lines.push('Work mode preference matches this role.');
  }

  if (missingSkills.length > 0) {
    lines.push(`Missing skill signal: ${missingSkills.slice(0, 2).join(', ')}.`);
  }

  if (context.profileCompletion < 80) {
    lines.push('Profile completion can improve shortlist probability for this role.');
  }

  if (context.resumeScore < 82) {
    lines.push('Resume ATS score can improve with quantified impact bullets.');
  }

  return lines.slice(0, 7);
};

const toPostedDateLabel = (job: Job): string => {
  const value = String(job.created_at || job.createdAt || '').trim();
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

class MockAiMatchCenterService implements AiMatchScoringProvider {
  scoreJobs(context: AiMatchCandidateContext, jobs: Job[]): AiMatchJobCardModel[] {
    const normalizedSkills = context.skills.map((skill) => skill.toLowerCase());

    return jobs.slice(0, 20).map((job) => {
      const requiredSkills = toSkillSet(job.skills);
      const requiredLower = requiredSkills.map((skill) => skill.toLowerCase());
      const matchedSkills = requiredLower.filter((skill) => normalizedSkills.includes(skill));
      const missingSkills = requiredSkills.filter((skill) => !normalizedSkills.includes(skill.toLowerCase()));

      const skillsMatch = requiredSkills.length === 0
        ? 70
        : clamp(Math.round((matchedSkills.length / requiredSkills.length) * 100));

      const reqExperience = parseExperienceYears(job);
      const expDelta = Math.abs(context.experienceYears - reqExperience);
      const experienceMatch = clamp(100 - (expDelta * 12), 40, 100);

      const jobEducation = String(job.education || '').toLowerCase();
      const candidateEducation = context.education.map((item) => item.toLowerCase());
      const educationHit = jobEducation ? candidateEducation.some((item) => item.includes(jobEducation) || jobEducation.includes(item)) : true;
      const educationMatch = educationHit ? 90 : 58;

      const locationMatch = compareLocation(context.preferredLocations, String(job.location || ''));

      const salaryInfo = normalizeSalary(job);
      const salaryMatch = compareSalary(context.preferredSalaryMin, context.preferredSalaryMax, salaryInfo.min, salaryInfo.max);

      const mode = normalizeWorkMode(job);
      const workModeMatch = !context.preferredWorkMode
        ? 72
        : context.preferredWorkMode === mode ? 94 : 52;

      const breakdown: MatchBreakdown = {
        skillsMatch,
        experienceMatch,
        educationMatch,
        locationMatch,
        salaryMatch,
        workModeMatch,
        resumeMatch: clamp(context.resumeScore),
        assessmentMatch: clamp(context.assessmentScore),
        profileCompletionMatch: clamp(context.profileCompletion),
        communicationScore: clamp(context.communicationScore),
      };

      const weighted = (
        breakdown.skillsMatch * 0.25
        + breakdown.experienceMatch * 0.12
        + breakdown.educationMatch * 0.08
        + breakdown.locationMatch * 0.08
        + breakdown.salaryMatch * 0.08
        + breakdown.workModeMatch * 0.08
        + breakdown.resumeMatch * 0.1
        + breakdown.assessmentMatch * 0.08
        + breakdown.profileCompletionMatch * 0.07
        + breakdown.communicationScore * 0.06
      );

      const overallMatchScore = clamp(Math.round(weighted));
      const probability = clamp(Math.round((overallMatchScore * 0.78) + (breakdown.resumeMatch * 0.1) + (breakdown.profileCompletionMatch * 0.12)));
      const bestMatchingSkill = requiredSkills.find((skill) => normalizedSkills.includes(skill.toLowerCase())) || (context.skills[0] || 'Core Skills');

      const breakdownEntries: MatchBreakdownEntry[] = (Object.keys(breakdown) as Array<keyof MatchBreakdown>).map((key) => ({
        key,
        label: breakdownLabels[key],
        value: breakdown[key],
        quality: qualityFromScore(breakdown[key]),
      }));

      const weakBreakdown = [...breakdownEntries].sort((a, b) => a.value - b.value)[0];

      const improvements: string[] = [];
      if (missingSkills.length > 0) improvements.push(`Complete ${missingSkills[0]} skill or assessment`);
      if (breakdown.resumeMatch < 80) improvements.push('Improve resume summary and ATS keywords');
      if (breakdown.profileCompletionMatch < 80) improvements.push('Increase profile completion with portfolio and projects');
      if (breakdown.assessmentMatch < 75) improvements.push('Complete one relevant assessment to boost credibility');
      if (breakdown.communicationScore < 75) improvements.push('Enhance communication section with measurable outcomes');
      if (improvements.length === 0) improvements.push('Apply early and tailor cover letter for this role');

      return {
        id: String(job.id),
        title: String(job.title || 'Role'),
        companyName: String(job.company_name || 'Company'),
        companyLogo: String(job.companyLogo || job.company_logo_url || '').trim() || undefined,
        location: String(job.location || 'Location not specified'),
        salaryLabel: salaryInfo.label,
        employmentType: normalizeEmploymentType(job),
        workMode: mode,
        postedDateLabel: toPostedDateLabel(job),
        rawJob: job,
        analysis: {
          overallMatchScore,
          selectionProbability: probability,
          selectionBand: selectionBand(probability),
          breakdown,
          breakdownEntries,
          explanation: buildExplanation(context, breakdown, missingSkills, bestMatchingSkill),
          requiredSkills,
          missingSkills,
          recommendedSkills: [...new Set([...missingSkills, ...context.skills])].slice(0, 6),
          trendingSkills: trendingSkillsSeed.filter((skill) => !context.skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())).slice(0, 6),
          improvements: improvements.slice(0, 5),
          aiRecommendation: recommendationByScore(overallMatchScore),
          bestMatchingSkill,
          weakestArea: weakBreakdown.label,
        },
      };
    }).sort((a, b) => b.analysis.overallMatchScore - a.analysis.overallMatchScore);
  }

  summarize(items: AiMatchJobCardModel[]): AiMatchCenterSummary {
    if (items.length === 0) {
      return {
        averageMatchScore: 0,
        averageSelectionProbability: 0,
        bestMatchingSkill: 'N/A',
        weakestArea: 'N/A',
        recommendedLearning: 'Add more skills and profile details to generate insights.',
        profileImprovement: 'Update profile with resume, projects and preferences.',
      };
    }

    const avgMatch = Math.round(items.reduce((sum, item) => sum + item.analysis.overallMatchScore, 0) / items.length);
    const avgProbability = Math.round(items.reduce((sum, item) => sum + item.analysis.selectionProbability, 0) / items.length);

    const skillCount = new Map<string, number>();
    const weakCount = new Map<string, number>();

    items.forEach((item) => {
      skillCount.set(item.analysis.bestMatchingSkill, (skillCount.get(item.analysis.bestMatchingSkill) || 0) + 1);
      weakCount.set(item.analysis.weakestArea, (weakCount.get(item.analysis.weakestArea) || 0) + 1);
    });

    const bestSkill = [...skillCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const weakestArea = [...weakCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      averageMatchScore: avgMatch,
      averageSelectionProbability: avgProbability,
      bestMatchingSkill: bestSkill,
      weakestArea,
      recommendedLearning: weakestArea === 'Skills Match' ? 'Complete one missing core skill assessment.' : `Improve ${weakestArea} across top job matches.`,
      profileImprovement: avgMatch >= 80 ? 'Great profile momentum. Keep resume updated weekly.' : 'Increase profile completion and portfolio signals to improve match quality.',
    };
  }
}

export const aiMatchCenterService: AiMatchScoringProvider = new MockAiMatchCenterService();
