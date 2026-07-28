export type BriefPriority = 'high' | 'medium' | 'low';

export interface DailyCareerBriefContext {
  userId: string;
  userName?: string;
  profileStrength: number;
  applicationsCount: number;
  recentApplications7d: number;
  recommendedJobsCount: number;
  recruiterViews: number;
  resumeDownloads: number;
  userSkills: string[];
  weeklyApplicationGoal: number;
}

export interface BriefSummaryCard {
  id: string;
  label: string;
  value: string;
  delta?: string;
  hint: string;
}

export interface OpportunityAlert {
  id: string;
  priority: BriefPriority;
  title: string;
  description: string;
  suggestedAction: string;
  actionKey: BriefActionKey;
}

export interface CareerMomentumMetric {
  id: string;
  label: string;
  progress: number;
  helper: string;
}

export interface FocusAction {
  id: string;
  title: string;
  description: string;
  actionKey: BriefActionKey;
}

export interface QuickAiAction {
  id: string;
  label: string;
  actionKey: BriefActionKey;
}

export interface DailyCareerBrief {
  dateLabel: string;
  recommendations: string[];
  summaryCards: BriefSummaryCard[];
  alerts: OpportunityAlert[];
  momentum: CareerMomentumMetric[];
  focusActions: FocusAction[];
  quickActions: QuickAiAction[];
  motivationalTitle: string;
  motivationalSubtitle: string;
}

export type BriefActionKey =
  | 'improve_resume'
  | 'find_better_jobs'
  | 'ai_career_coach'
  | 'mock_interview'
  | 'resume_review'
  | 'complete_assessment'
  | 'update_profile'
  | 'apply_jobs'
  | 'improve_skills'
  | 'open_notifications';

export interface AiDailyCareerBriefProvider {
  generateBrief(context: DailyCareerBriefContext): Promise<DailyCareerBrief>;
}

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

class MockAiDailyCareerBriefService implements AiDailyCareerBriefProvider {
  async generateBrief(context: DailyCareerBriefContext): Promise<DailyCareerBrief> {
    const today = new Date();
    const dateLabel = today.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const recruiterActivity = context.recruiterViews + context.resumeDownloads;
    const atsScore = clamp(Math.round(context.profileStrength * 0.84 + context.userSkills.length * 2.8), 35, 99);
    const interviewReadiness = clamp(Math.round((context.profileStrength * 0.46) + (context.recentApplications7d * 6.5)), 20, 100);
    const weeklyGoalProgress = clamp(Math.round((context.recentApplications7d / Math.max(1, context.weeklyApplicationGoal)) * 100));
    const matchGrowth = clamp(6 + context.userSkills.length * 1.6, 6, 26);
    const topPercent = clamp(42 - Math.round(context.profileStrength / 4), 6, 42);

    const topSkill = context.userSkills[0] || 'React';
    const missingSkill = context.userSkills.includes('Docker') ? 'Kubernetes' : 'Docker';
    const bestApplyWindow = context.recruiterViews >= 10 ? '9 AM - 12 PM' : '10 AM - 1 PM';

    const recommendations = [
      `- ${Math.max(4, context.recommendedJobsCount)} new jobs match your skills.`,
      `- Resume score increased by ${Math.max(2, Math.round(context.profileStrength / 18))}%.`,
      `- Your profile appeared in recruiter search ${context.recruiterViews} times.`,
      `- ${topSkill} jobs increased by ${Math.round(matchGrowth)}% this week.`,
      `- Completing ${missingSkill} skill may improve your match score.`,
      `- Best time to apply today: ${bestApplyWindow}.`,
      '- Complete one assessment to increase recruiter visibility.',
    ];

    const alerts: OpportunityAlert[] = [
      {
        id: 'a1',
        priority: context.recommendedJobsCount >= 12 ? 'high' : 'medium',
        title: 'High Match Jobs Active',
        description: `${Math.max(4, context.recommendedJobsCount)} roles match your current profile strength and skills.`,
        suggestedAction: 'Apply to at least 3 roles before noon.',
        actionKey: 'find_better_jobs',
      },
      {
        id: 'a2',
        priority: context.profileStrength < 80 ? 'high' : 'medium',
        title: 'Profile Optimization Opportunity',
        description: `Profile strength is ${context.profileStrength}%. Recruiter callbacks improve significantly above 82%.`,
        suggestedAction: 'Update profile summary and add measurable impact points.',
        actionKey: 'update_profile',
      },
      {
        id: 'a3',
        priority: 'medium',
        title: 'Assessment Visibility Boost',
        description: 'Candidates with fresh assessment scores receive more recruiter shortlists this week.',
        suggestedAction: 'Complete one skill assessment today.',
        actionKey: 'complete_assessment',
      },
      {
        id: 'a4',
        priority: recruiterActivity >= 12 ? 'low' : 'medium',
        title: 'Recruiter Follow-up Window',
        description: `Recruiter interactions are at ${recruiterActivity}. Fast responses can improve conversion.`,
        suggestedAction: 'Check notifications and respond to pending recruiter messages.',
        actionKey: 'open_notifications',
      },
      {
        id: 'a5',
        priority: 'low',
        title: 'Skill Demand Shift',
        description: `${missingSkill} appears frequently in matching roles this week.`,
        suggestedAction: `Complete a short ${missingSkill} module and update your profile.`,
        actionKey: 'improve_skills',
      },
    ].slice(0, 5);

    const momentum: CareerMomentumMetric[] = [
      {
        id: 'm1',
        label: 'Application Momentum',
        progress: clamp(Math.round((context.recentApplications7d / Math.max(1, context.weeklyApplicationGoal)) * 100)),
        helper: `${context.recentApplications7d}/${context.weeklyApplicationGoal} weekly applications`,
      },
      {
        id: 'm2',
        label: 'Recruiter Interest',
        progress: clamp(Math.round((recruiterActivity / 25) * 100)),
        helper: `${recruiterActivity} profile interactions`,
      },
      {
        id: 'm3',
        label: 'Profile Health',
        progress: clamp(context.profileStrength),
        helper: `Strength score ${context.profileStrength}%`,
      },
      {
        id: 'm4',
        label: 'Learning Progress',
        progress: clamp(Math.round((context.userSkills.length / 10) * 100)),
        helper: `${context.userSkills.length} skills listed`,
      },
    ];

    const focusActions: FocusAction[] = [
      {
        id: 'f1',
        title: 'Apply 5 Jobs',
        description: 'Focus on high-match roles and apply with customized headlines.',
        actionKey: 'apply_jobs',
      },
      {
        id: 'f2',
        title: 'Complete Assessment',
        description: 'One completed assessment can improve recruiter visibility in search.',
        actionKey: 'complete_assessment',
      },
      {
        id: 'f3',
        title: 'Improve Profile',
        description: 'Add quantifiable achievements to cross 82% profile strength.',
        actionKey: 'update_profile',
      },
    ];

    const quickActions: QuickAiAction[] = [
      { id: 'q1', label: 'Improve Resume', actionKey: 'improve_resume' },
      { id: 'q2', label: 'Find Better Jobs', actionKey: 'find_better_jobs' },
      { id: 'q3', label: 'AI Career Coach', actionKey: 'ai_career_coach' },
      { id: 'q4', label: 'Mock Interview', actionKey: 'mock_interview' },
      { id: 'q5', label: 'Resume Review', actionKey: 'resume_review' },
    ];

    return {
      dateLabel,
      recommendations,
      summaryCards: [
        {
          id: 's1',
          label: 'New Matching Jobs',
          value: `${Math.max(4, context.recommendedJobsCount)}`,
          delta: `+${Math.round(matchGrowth)}%`,
          hint: 'matches today',
        },
        {
          id: 's2',
          label: 'Recruiter Activity',
          value: `${recruiterActivity}`,
          hint: 'profile interactions',
        },
        {
          id: 's3',
          label: 'Profile Strength',
          value: `${context.profileStrength}%`,
          hint: 'optimization score',
        },
        {
          id: 's4',
          label: 'ATS Resume Score',
          value: `${atsScore}%`,
          hint: 'screening readiness',
        },
        {
          id: 's5',
          label: 'Interview Readiness',
          value: `${interviewReadiness}%`,
          hint: 'confidence index',
        },
        {
          id: 's6',
          label: 'Weekly Goal Progress',
          value: `${weeklyGoalProgress}%`,
          hint: 'towards weekly target',
        },
      ],
      alerts,
      momentum,
      focusActions,
      quickActions,
      motivationalTitle: `You are in the Top ${topPercent}% of ${topSkill} candidates.`,
      motivationalSubtitle: `Recruiter engagement is trending up. ${bestApplyWindow} is your best apply window today.`,
    };
  }
}

export const aiDailyCareerBriefService: AiDailyCareerBriefProvider = new MockAiDailyCareerBriefService();
