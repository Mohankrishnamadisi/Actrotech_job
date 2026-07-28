import { format } from 'date-fns';

export type CommunityCategory =
  | 'Technology'
  | 'Company'
  | 'Role'
  | 'Location'
  | 'College'
  | 'Career Interests';

export type ReferralStatus =
  | 'requested'
  | 'accepted'
  | 'interview_scheduled'
  | 'hired'
  | 'rejected';

export type MentorSessionStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'completed';

export interface ProfessionalProfile {
  userId: string;
  fullName: string;
  professionalHeadline: string;
  bio: string;
  currentCompany: string;
  experience: string;
  education: string[];
  skills: string[];
  projects: string[];
  achievements: string[];
  verifiedCertificates: string[];
  assessmentBadges: string[];
  resumeUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  socialLinks: string[];
  followers: number;
  following: number;
}

export interface NetworkConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'connected' | 'rejected' | 'blocked';
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  category: CommunityCategory;
  description: string;
  members: number;
  tags: string[];
  moderators: string[];
  pinnedPostIds: string[];
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  content: string;
  mediaUrl?: string;
  hashtags: string[];
  mentions: string[];
  likes: number;
  bookmarks: number;
  comments: number;
  poll?: {
    question: string;
    options: Array<{ id: string; label: string; votes: number }>;
  };
  announcement: boolean;
  pinned: boolean;
  createdAt: string;
}

export interface DiscussionTopic {
  id: string;
  title: string;
  question: string;
  tags: string[];
  votes: number;
  answers: number;
  acceptedAnswer?: string;
  trendScore: number;
  contributor: string;
}

export interface ReferralOpportunity {
  id: string;
  creatorId: string;
  company: string;
  role: string;
  eligibility: string;
  deadlineAt: string;
  availablePositions: number;
  referralLink: string;
}

export interface ReferralRequest {
  id: string;
  opportunityId: string;
  candidateId: string;
  employeeId: string;
  status: ReferralStatus;
  bonusAmount: number;
  createdAt: string;
}

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  expertise: string[];
  rating: number;
  sessionsCompleted: number;
}

export interface MentorSession {
  id: string;
  mentorId: string;
  candidateId: string;
  agenda: string;
  scheduledAt: string;
  status: MentorSessionStatus;
  feedback?: string;
  rating?: number;
}

export interface EventItem {
  id: string;
  type: 'Webinar' | 'Hiring Event' | 'Hackathon' | 'Coding Contest' | 'Career Fair' | 'Company Event' | 'Meetup';
  title: string;
  description: string;
  eventAt: string;
  attendees: number;
  rsvp: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Career Articles' | 'Interview Tips' | 'Resume Tips' | 'Salary Guides' | 'Learning Paths' | 'Industry News' | 'AI Generated Insights';
  summary: string;
  publishedAt: string;
  author: string;
}

export interface GamificationState {
  userId: string;
  points: number;
  level: number;
  xp: number;
  dailyStreak: number;
  weeklyChallenge: string;
  communityRank: number;
}

interface StoreModel {
  profiles: ProfessionalProfile[];
  connections: NetworkConnection[];
  communities: Community[];
  posts: CommunityPost[];
  discussions: DiscussionTopic[];
  opportunities: ReferralOpportunity[];
  referrals: ReferralRequest[];
  mentors: MentorProfile[];
  sessions: MentorSession[];
  events: EventItem[];
  knowledgeHub: KnowledgeArticle[];
  gamification: GamificationState[];
  notifications: Array<{ id: string; userId: string; type: string; text: string; at: string }>;
}

const STORAGE_KEY = 'actro_network_community_v1';

const makeId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const seedCommunities: Community[] = [
  {
    id: makeId('com'),
    name: 'React Developers',
    category: 'Technology',
    description: 'Frontend engineering community for React developers.',
    members: 2450,
    tags: ['react', 'frontend', 'typescript'],
    moderators: ['mentor_01'],
    pinnedPostIds: [],
  },
  {
    id: makeId('com'),
    name: 'Python Developers',
    category: 'Technology',
    description: 'Python backend, automation, and data discussions.',
    members: 1980,
    tags: ['python', 'backend', 'ml'],
    moderators: ['mentor_02'],
    pinnedPostIds: [],
  },
  {
    id: makeId('com'),
    name: 'Women in Tech',
    category: 'Career Interests',
    description: 'Growth, mentorship, and support network for women in technology.',
    members: 1630,
    tags: ['inclusion', 'mentorship', 'career'],
    moderators: ['mentor_03'],
    pinnedPostIds: [],
  },
];

const seedDiscussions: DiscussionTopic[] = [
  {
    id: makeId('dsc'),
    title: 'How to prepare for system design rounds in 30 days?',
    question: 'Need a practical roadmap with resources and mock strategy.',
    tags: ['system-design', 'interview'],
    votes: 32,
    answers: 12,
    acceptedAnswer: 'Create weekly architecture drills + 3 mock interviews.',
    trendScore: 91,
    contributor: 'Top Contributor',
  },
  {
    id: makeId('dsc'),
    title: 'Best way to optimize TypeScript build time?',
    question: 'Large monorepo build is slow. Need actionable techniques.',
    tags: ['typescript', 'performance'],
    votes: 24,
    answers: 8,
    trendScore: 84,
    contributor: 'Community Expert',
  },
];

const seedMentors: MentorProfile[] = [
  {
    id: 'mentor_01',
    name: 'Arjun Reddy',
    title: 'Senior Frontend Engineer',
    expertise: ['React', 'System Design', 'Mentoring'],
    rating: 4.8,
    sessionsCompleted: 120,
  },
  {
    id: 'mentor_02',
    name: 'Sana Khan',
    title: 'Principal Backend Engineer',
    expertise: ['Python', 'Cloud', 'Career Growth'],
    rating: 4.9,
    sessionsCompleted: 160,
  },
];

const seedEvents: EventItem[] = [
  {
    id: makeId('evt'),
    type: 'Webinar',
    title: 'AI Hiring Trends 2026',
    description: 'Industry leaders discuss future hiring signals and career readiness.',
    eventAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    attendees: 430,
    rsvp: false,
  },
  {
    id: makeId('evt'),
    type: 'Hackathon',
    title: 'Full Stack Build Sprint',
    description: '48-hour remote hackathon for full stack engineers.',
    eventAt: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    attendees: 520,
    rsvp: false,
  },
];

const seedKnowledge: KnowledgeArticle[] = [
  {
    id: makeId('art'),
    title: 'Resume Optimization for Product Companies',
    category: 'Resume Tips',
    summary: 'Practical checklist to improve shortlisting rate.',
    publishedAt: new Date().toISOString(),
    author: 'Career Team',
  },
  {
    id: makeId('art'),
    title: 'AI Generated Skill Gap Insights for Engineers',
    category: 'AI Generated Insights',
    summary: 'How AI can map your current skills to target role needs.',
    publishedAt: new Date().toISOString(),
    author: 'AI Assistant',
  },
];

const seedStore = (): StoreModel => ({
  profiles: [],
  connections: [],
  communities: seedCommunities,
  posts: [],
  discussions: seedDiscussions,
  opportunities: [],
  referrals: [],
  mentors: seedMentors,
  sessions: [],
  events: seedEvents,
  knowledgeHub: seedKnowledge,
  gamification: [],
  notifications: [],
});

const readStore = (): StoreModel => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as StoreModel;
  } catch {
    const seeded = seedStore();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
};

const writeStore = (store: StoreModel): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const levelFromPoints = (points: number): number => Math.max(1, Math.floor(points / 120) + 1);

class NetworkCommunityService {
  getProfessionalProfile(userId: string, fullName?: string): ProfessionalProfile {
    const store = readStore();
    const found = store.profiles.find((p) => p.userId === userId);
    if (found) return found;

    const created: ProfessionalProfile = {
      userId,
      fullName: fullName || 'Candidate',
      professionalHeadline: 'Software Engineer | Problem Solver | Continuous Learner',
      bio: 'Passionate developer focused on building reliable products and helping communities grow.',
      currentCompany: 'Open to opportunities',
      experience: '3 years',
      education: ['B.Tech Computer Science'],
      skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
      projects: ['ATS Optimization Tool', 'AI Career Planner'],
      achievements: ['Top Contributor', 'Hackathon Finalist'],
      verifiedCertificates: ['Verified React Certificate'],
      assessmentBadges: ['TypeScript Intermediate'],
      resumeUrl: '/resume/sample.pdf',
      portfolioUrl: 'https://portfolio.example.com',
      githubUrl: 'https://github.com/example',
      linkedinUrl: 'https://linkedin.com/in/example',
      websiteUrl: 'https://example.dev',
      socialLinks: ['https://x.com/example'],
      followers: 0,
      following: 0,
    };

    const next = { ...store, profiles: [created, ...store.profiles] };
    writeStore(next);
    return created;
  }

  updateProfessionalProfile(userId: string, patch: Partial<ProfessionalProfile>): ProfessionalProfile {
    const store = readStore();
    const current = this.getProfessionalProfile(userId);
    const updated = { ...current, ...patch, userId };
    const nextProfiles = [updated, ...store.profiles.filter((p) => p.userId !== userId)];
    writeStore({ ...store, profiles: nextProfiles });
    return updated;
  }

  listSuggestedConnections(userId: string): Array<{ id: string; name: string; headline: string; mutualConnections: number }> {
    const names = ['Nisha Verma', 'Rahul Jain', 'Sneha Patil', 'Vikram Das', 'Pooja Sharma'];
    return names.map((name, idx) => ({
      id: `suggested_${idx + 1}`,
      name,
      headline: idx % 2 === 0 ? 'Frontend Engineer' : 'Backend Engineer',
      mutualConnections: 2 + idx,
    })).filter((item) => item.id !== userId);
  }

  sendConnectionRequest(fromUserId: string, toUserId: string): NetworkConnection {
    const store = readStore();
    const existing = store.connections.find((c) => c.fromUserId === fromUserId && c.toUserId === toUserId);
    if (existing) return existing;

    const created: NetworkConnection = {
      id: makeId('con'),
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const next = { ...store, connections: [created, ...store.connections] };
    writeStore(next);
    return created;
  }

  listConnectionRequests(userId: string): NetworkConnection[] {
    return readStore().connections.filter((c) => c.toUserId === userId && c.status === 'pending');
  }

  updateConnectionStatus(connectionId: string, status: 'connected' | 'rejected' | 'blocked'): NetworkConnection | null {
    const store = readStore();
    const target = store.connections.find((c) => c.id === connectionId);
    if (!target) return null;

    const updated = { ...target, status };
    const nextConnections = store.connections.map((c) => (c.id === connectionId ? updated : c));
    writeStore({ ...store, connections: nextConnections });
    return updated;
  }

  removeConnection(connectionId: string): void {
    const store = readStore();
    const next = store.connections.filter((c) => c.id !== connectionId);
    writeStore({ ...store, connections: next });
  }

  listConnections(userId: string): NetworkConnection[] {
    return readStore().connections.filter(
      (c) => (c.fromUserId === userId || c.toUserId === userId) && c.status === 'connected',
    );
  }

  listCommunities(): Community[] {
    return readStore().communities;
  }

  createCommunity(input: Omit<Community, 'id' | 'members' | 'pinnedPostIds'>): Community {
    const store = readStore();
    const created: Community = {
      ...input,
      id: makeId('com'),
      members: 1,
      pinnedPostIds: [],
    };
    writeStore({ ...store, communities: [created, ...store.communities] });
    return created;
  }

  listPosts(communityId?: string): CommunityPost[] {
    const list = readStore().posts;
    return communityId ? list.filter((p) => p.communityId === communityId) : list;
  }

  createPost(input: Omit<CommunityPost, 'id' | 'likes' | 'bookmarks' | 'comments' | 'createdAt'>): CommunityPost {
    const store = readStore();
    const created: CommunityPost = {
      ...input,
      id: makeId('pst'),
      likes: 0,
      bookmarks: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    writeStore({ ...store, posts: [created, ...store.posts] });
    return created;
  }

  interactPost(postId: string, action: 'like' | 'bookmark' | 'comment' | 'pin'): CommunityPost | null {
    const store = readStore();
    const target = store.posts.find((p) => p.id === postId);
    if (!target) return null;

    const updated: CommunityPost = {
      ...target,
      likes: action === 'like' ? target.likes + 1 : target.likes,
      bookmarks: action === 'bookmark' ? target.bookmarks + 1 : target.bookmarks,
      comments: action === 'comment' ? target.comments + 1 : target.comments,
      pinned: action === 'pin' ? true : target.pinned,
    };

    const nextPosts = store.posts.map((p) => (p.id === postId ? updated : p));
    writeStore({ ...store, posts: nextPosts });
    return updated;
  }

  searchCommunities(query: string): Community[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.listCommunities();
    return this.listCommunities().filter((c) =>
      c.name.toLowerCase().includes(q)
      || c.description.toLowerCase().includes(q)
      || c.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  listDiscussions(): DiscussionTopic[] {
    return readStore().discussions.sort((a, b) => b.trendScore - a.trendScore);
  }

  createDiscussion(title: string, question: string, tags: string[]): DiscussionTopic {
    const store = readStore();
    const created: DiscussionTopic = {
      id: makeId('dsc'),
      title,
      question,
      tags,
      votes: 0,
      answers: 0,
      trendScore: 60,
      contributor: 'New Contributor',
    };
    writeStore({ ...store, discussions: [created, ...store.discussions] });
    return created;
  }

  voteDiscussion(id: string): DiscussionTopic | null {
    const store = readStore();
    const target = store.discussions.find((item) => item.id === id);
    if (!target) return null;
    const updated = { ...target, votes: target.votes + 1, trendScore: Math.min(100, target.trendScore + 1) };
    writeStore({
      ...store,
      discussions: store.discussions.map((item) => (item.id === id ? updated : item)),
    });
    return updated;
  }

  listMentors(): MentorProfile[] {
    return readStore().mentors;
  }

  requestMentorSession(candidateId: string, mentorId: string, agenda: string, scheduledAt: string): MentorSession {
    const store = readStore();
    const created: MentorSession = {
      id: makeId('ses'),
      mentorId,
      candidateId,
      agenda,
      scheduledAt,
      status: 'requested',
    };
    writeStore({ ...store, sessions: [created, ...store.sessions] });
    return created;
  }

  listMentorSessions(userId: string): MentorSession[] {
    return readStore().sessions.filter((s) => s.candidateId === userId || s.mentorId === userId);
  }

  updateMentorSession(sessionId: string, status: MentorSessionStatus, feedback?: string, rating?: number): MentorSession | null {
    const store = readStore();
    const target = store.sessions.find((s) => s.id === sessionId);
    if (!target) return null;
    const updated = { ...target, status, feedback: feedback || target.feedback, rating: rating ?? target.rating };
    writeStore({ ...store, sessions: store.sessions.map((s) => (s.id === sessionId ? updated : s)) });
    return updated;
  }

  listEvents(): EventItem[] {
    return readStore().events;
  }

  toggleRsvp(eventId: string): EventItem | null {
    const store = readStore();
    const event = store.events.find((item) => item.id === eventId);
    if (!event) return null;
    const updated = {
      ...event,
      rsvp: !event.rsvp,
      attendees: event.rsvp ? Math.max(0, event.attendees - 1) : event.attendees + 1,
    };
    writeStore({ ...store, events: store.events.map((item) => (item.id === eventId ? updated : item)) });
    return updated;
  }

  listKnowledgeHub(): KnowledgeArticle[] {
    return readStore().knowledgeHub;
  }

  createReferralOpportunity(input: Omit<ReferralOpportunity, 'id' | 'referralLink'>): ReferralOpportunity {
    const created: ReferralOpportunity = {
      ...input,
      id: makeId('opp'),
      referralLink: `${window.location.origin}/#/referral/${makeId('lnk')}`,
    };
    const store = readStore();
    writeStore({ ...store, opportunities: [created, ...store.opportunities] });
    return created;
  }

  listReferralOpportunities(): ReferralOpportunity[] {
    return readStore().opportunities;
  }

  requestReferral(opportunityId: string, candidateId: string, employeeId: string): ReferralRequest {
    const store = readStore();
    const created: ReferralRequest = {
      id: makeId('ref'),
      opportunityId,
      candidateId,
      employeeId,
      status: 'requested',
      bonusAmount: 0,
      createdAt: new Date().toISOString(),
    };
    writeStore({ ...store, referrals: [created, ...store.referrals] });
    return created;
  }

  listReferralRequestsByCandidate(candidateId: string): ReferralRequest[] {
    return readStore().referrals.filter((r) => r.candidateId === candidateId);
  }

  listReferralRequestsByEmployee(employeeId: string): ReferralRequest[] {
    return readStore().referrals.filter((r) => r.employeeId === employeeId);
  }

  updateReferralStatus(referralId: string, status: ReferralStatus, bonusAmount?: number): ReferralRequest | null {
    const store = readStore();
    const target = store.referrals.find((r) => r.id === referralId);
    if (!target) return null;
    const updated = {
      ...target,
      status,
      bonusAmount: bonusAmount ?? target.bonusAmount,
    };
    writeStore({ ...store, referrals: store.referrals.map((r) => (r.id === referralId ? updated : r)) });
    return updated;
  }

  getRecruiterReferralDashboard(employeeId: string): {
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    bonusPaid: number;
    topReferrers: Array<{ name: string; count: number }>;
  } {
    const referrals = this.listReferralRequestsByEmployee(employeeId);
    const successful = referrals.filter((r) => r.status === 'hired').length;
    const pending = referrals.filter((r) => r.status === 'requested' || r.status === 'accepted').length;
    const bonusPaid = referrals
      .filter((r) => r.status === 'hired')
      .reduce((sum, row) => sum + Number(row.bonusAmount || 0), 0);

    return {
      totalReferrals: referrals.length,
      successfulReferrals: successful,
      pendingReferrals: pending,
      bonusPaid,
      topReferrers: [
        { name: 'Employee A', count: 9 },
        { name: 'Employee B', count: 7 },
        { name: 'Employee C', count: 5 },
      ],
    };
  }

  getGamification(userId: string): GamificationState {
    const store = readStore();
    const existing = store.gamification.find((g) => g.userId === userId);
    if (existing) return existing;

    const created: GamificationState = {
      userId,
      points: 120,
      level: 2,
      xp: 120,
      dailyStreak: 3,
      weeklyChallenge: 'Contribute 2 discussions and 3 quality replies',
      communityRank: 18,
    };
    writeStore({ ...store, gamification: [created, ...store.gamification] });
    return created;
  }

  addPoints(userId: string, points: number): GamificationState {
    const current = this.getGamification(userId);
    const updated = {
      ...current,
      points: current.points + points,
      xp: current.xp + points,
      level: levelFromPoints(current.points + points),
    };

    const store = readStore();
    writeStore({
      ...store,
      gamification: [updated, ...store.gamification.filter((g) => g.userId !== userId)],
    });
    return updated;
  }

  getAchievements(): Array<{ key: string; label: string; criteria: string }> {
    return [
      { key: 'top_mentor', label: 'Top Mentor', criteria: 'Complete 30 mentorship sessions with rating >= 4.5' },
      { key: 'top_referrer', label: 'Top Referrer', criteria: '10 successful referrals in one quarter' },
      { key: 'top_contributor', label: 'Top Contributor', criteria: 'High quality discussion and accepted answers' },
      { key: 'community_expert', label: 'Community Expert', criteria: 'Consistent domain contributions and votes' },
      { key: 'career_champion', label: 'Career Champion', criteria: 'Mentorship and referral impact combined' },
      { key: 'hiring_partner', label: 'Hiring Partner', criteria: 'Validated hires through referral funnel' },
    ];
  }

  getNotifications(userId: string): Array<{ id: string; type: string; text: string; at: string }> {
    return readStore().notifications.filter((n) => n.userId === userId);
  }

  pushNotification(userId: string, type: string, text: string): void {
    const store = readStore();
    const row = { id: makeId('ntf'), userId, type, text, at: new Date().toISOString() };
    writeStore({ ...store, notifications: [row, ...store.notifications].slice(0, 500) });
  }

  getAiCommunityRecommendations(userId: string): {
    communities: string[];
    mentors: string[];
    events: string[];
    referralOpportunities: string[];
    careerArticles: string[];
    connections: string[];
  } {
    const profile = this.getProfessionalProfile(userId);
    const skills = profile.skills.map((s) => s.toLowerCase());

    const communityRecommendations = this.listCommunities()
      .filter((community) => community.tags.some((tag) => skills.includes(tag.toLowerCase())))
      .slice(0, 4)
      .map((community) => community.name);

    return {
      communities: communityRecommendations.length ? communityRecommendations : ['React Developers', 'Remote Workers'],
      mentors: this.listMentors().slice(0, 3).map((m) => m.name),
      events: this.listEvents().slice(0, 3).map((e) => e.title),
      referralOpportunities: this.listReferralOpportunities().slice(0, 3).map((r) => `${r.company} - ${r.role}`),
      careerArticles: this.listKnowledgeHub().slice(0, 3).map((a) => a.title),
      connections: this.listSuggestedConnections(userId).slice(0, 4).map((c) => c.name),
    };
  }

  getAnalytics(): {
    communityGrowth: number;
    referralSuccessRate: number;
    mentorshipSessions: number;
    eventAttendance: number;
    userEngagement: number;
    topCommunities: string[];
    topMentors: string[];
  } {
    const store = readStore();
    const totalReferrals = store.referrals.length;
    const successfulReferrals = store.referrals.filter((r) => r.status === 'hired').length;
    const attendance = store.events.reduce((sum, e) => sum + Number(e.attendees || 0), 0);

    return {
      communityGrowth: Math.max(5, Math.round(store.communities.reduce((sum, c) => sum + c.members, 0) / 500)),
      referralSuccessRate: totalReferrals ? Math.round((successfulReferrals / totalReferrals) * 100) : 0,
      mentorshipSessions: store.sessions.length,
      eventAttendance: attendance,
      userEngagement: Math.max(40, Math.min(98, 50 + store.posts.length * 2 + store.discussions.length)),
      topCommunities: store.communities
        .slice()
        .sort((a, b) => b.members - a.members)
        .slice(0, 5)
        .map((c) => c.name),
      topMentors: store.mentors
        .slice()
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)
        .map((m) => m.name),
    };
  }

  getPermissions() {
    return {
      candidate: 'Can join communities, request referrals, request mentorship, RSVP events, post and interact.',
      recruiter: 'Can publish referral opportunities, track referrals, moderate recruiter communities, review talent engagement.',
      mentor: 'Can accept/reject sessions, provide feedback, rate candidates, share growth plans.',
      communityManager: 'Can moderate posts, manage tags, pin announcements, review reports.',
      platformModerator: 'Can review abuse, enforce policies, suspend users/content, manage escalations.',
      superAdmin: 'Full platform governance for networking, referral, mentorship, and analytics.',
    };
  }

  getModerationArchitecture() {
    return {
      reportAbuse: 'Users can report posts, comments, profiles, and messages.',
      spamDetection: 'Keyword and behavior-based score with review queue.',
      contentReview: 'Tiered review by community and platform moderators.',
      communityModerators: 'Assigned by community owners with scoped permissions.',
      platformModerators: 'Global moderation with escalation workflows.',
    };
  }

  generateReports(userId?: string): {
    communityReport: string;
    referralReport: string;
    mentorshipReport: string;
    engagementReport: string;
  } {
    const analytics = this.getAnalytics();
    const date = format(new Date(), 'yyyy-MM-dd HH:mm');
    const candidateReferrals = userId ? this.listReferralRequestsByCandidate(userId).length : readStore().referrals.length;
    const sessions = userId ? this.listMentorSessions(userId).length : readStore().sessions.length;

    return {
      communityReport: [
        '# Community Report',
        `Generated: ${date}`,
        `Community Growth Index: ${analytics.communityGrowth}`,
        `Top Communities: ${analytics.topCommunities.join(', ')}`,
      ].join('\n'),
      referralReport: [
        '# Referral Report',
        `Generated: ${date}`,
        `Referral Success Rate: ${analytics.referralSuccessRate}%`,
        `Referral Records: ${candidateReferrals}`,
      ].join('\n'),
      mentorshipReport: [
        '# Mentorship Report',
        `Generated: ${date}`,
        `Mentorship Sessions: ${sessions}`,
        `Top Mentors: ${analytics.topMentors.join(', ')}`,
      ].join('\n'),
      engagementReport: [
        '# Engagement Report',
        `Generated: ${date}`,
        `User Engagement Index: ${analytics.userEngagement}`,
        `Event Attendance: ${analytics.eventAttendance}`,
      ].join('\n'),
    };
  }

  downloadReport(content: string, formatKind: 'pdf' | 'excel' | 'csv'): string {
    if (formatKind === 'csv') {
      return content
        .split('\n')
        .map((line) => `"${line.replace(/"/g, '""')}"`)
        .join('\n');
    }
    if (formatKind === 'excel') return `EXCEL_EXPORT\n${content}`;
    return `PDF_EXPORT\n${content}`;
  }
}

export const networkCommunityService = new NetworkCommunityService();
