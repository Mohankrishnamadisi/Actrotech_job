const ROLE_PATTERNS: Array<{ keywords: string[]; titles: string[] }> = [
  {
    keywords: ['react', 'typescript', 'redux', 'javascript', 'frontend', 'ui'],
    titles: [
      'React Developer',
      'Frontend Developer',
      'Frontend Engineer',
      'UI Developer',
      'Web Developer',
      'JavaScript Developer',
      'Software Engineer - Frontend',
    ],
  },
  {
    keywords: ['node', 'express', 'mongodb', 'postgres', 'backend', 'api'],
    titles: [
      'Backend Developer',
      'Backend Engineer',
      'API Developer',
      'Node.js Developer',
      'Software Engineer - Backend',
      'Web Application Developer',
    ],
  },
  {
    keywords: ['full stack', 'mern', 'mean', 'react', 'node', 'express'],
    titles: [
      'Full Stack Developer',
      'Full Stack Engineer',
      'Software Engineer',
      'Web Application Developer',
      'Frontend Developer',
      'Backend Developer',
    ],
  },
  {
    keywords: ['data', 'machine learning', 'ml', 'ai', 'python', 'tensorflow', 'pytorch'],
    titles: [
      'Data Scientist',
      'Machine Learning Engineer',
      'AI Engineer',
      'Data Analyst',
      'Analytics Engineer',
    ],
  },
  {
    keywords: ['devops', 'sre', 'cloud', 'kubernetes', 'docker', 'infra'],
    titles: [
      'DevOps Engineer',
      'Site Reliability Engineer',
      'Cloud Engineer',
      'Infrastructure Engineer',
      'Platform Engineer',
    ],
  },
  {
    keywords: ['ui', 'ux', 'design', 'figma', 'adobe xd', 'sketch'],
    titles: [
      'UI/UX Designer',
      'UI Designer',
      'UX Designer',
      'Product Designer',
      'Visual Designer',
    ],
  },
];

const BASE_TITLES = [
  'Software Engineer',
  'Software Developer',
  'Frontend Developer',
  'Frontend Engineer',
  'Backend Developer',
  'Backend Engineer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'Web Developer',
  'React Developer',
  'Node.js Developer',
  'Data Scientist',
  'DevOps Engineer',
  'QA Engineer',
];

function normalizeText(value: string | undefined | null) {
  return String(value || '').toLowerCase().replace(/[\s._\-\/]+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value
    .split(/[^a-z0-9]+/i)
    .map((token) => token.toLowerCase().trim())
    .filter(Boolean);
}

function uniqueTitles(titles: string[]) {
  return Array.from(new Set(titles.filter(Boolean))).slice(0, 20);
}

export function generatePreferredJobTitleSuggestions(input: {
  skills?: string[];
  experience?: string;
  currentTitle?: string;
  resumeText?: string;
  profileBio?: string;
}): string[] {
  const skillTokens = (input.skills || []).flatMap((skill) => tokenize(skill));
  const currentTitle = normalizeText(input.currentTitle || '');
  const resumeText = normalizeText(input.resumeText || '');
  const bioText = normalizeText(input.profileBio || '');

  const titleCandidates = new Set<string>();

  if (currentTitle) {
    titleCandidates.add(formatTitleCase(currentTitle));
  }

  ROLE_PATTERNS.forEach((role) => {
    const matched = role.keywords.some((keyword) => skillTokens.includes(keyword));
    if (matched) {
      role.titles.forEach((title) => titleCandidates.add(title));
    }
  });

  if (skillTokens.includes('react')) {
    ['React Developer', 'Frontend Developer', 'Frontend Engineer', 'Web Developer', 'UI Developer'].forEach((title) => titleCandidates.add(title));
  }

  if (skillTokens.includes('node') || skillTokens.includes('express')) {
    ['Backend Developer', 'Node.js Developer', 'Full Stack Developer', 'Software Engineer'].forEach((title) => titleCandidates.add(title));
  }

  const searchText = `${resumeText} ${bioText}`;
  const phraseMatches = searchText.match(/\b(frontend developer|frontend engineer|react developer|full stack developer|backend developer|software engineer|web developer|ui developer|devops engineer|data scientist|machine learning engineer)\b/g);
  if (phraseMatches) {
    phraseMatches.forEach((phrase) => titleCandidates.add(formatTitleCase(phrase)));
  }

  if (currentTitle && !titleCandidates.has(formatTitleCase(currentTitle))) {
    titleCandidates.add(formatTitleCase(currentTitle));
  }

  const suggestions = uniqueTitles([...titleCandidates].map((title) => title.trim()));

  if (suggestions.length === 0) {
    return BASE_TITLES;
  }

  return suggestions;
}

function formatTitleCase(text: string) {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Js\b/, 'JS')
    .replace(/Ui\b/, 'UI')
    .replace(/Ux\b/, 'UX');
}
