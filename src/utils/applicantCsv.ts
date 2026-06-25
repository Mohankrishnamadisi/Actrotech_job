import type { BulkApplicant } from '@components/recruiter/bulkActionsApi';
import { getApplicantStage, toStringArray } from '@components/recruiter/bulkActionsApi';

const csvEscape = (value: unknown): string => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const getLocation = (profile: BulkApplicant['profiles']): string =>
  String(profile?.location || [profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || '');

import { formatExperienceString } from '@utils/experience';

const getExperience = (applicant: BulkApplicant): string => {
  const profile = applicant.profiles;
  if (!profile) return '';
  if (profile.experience_years != null || profile.experience_months != null) {
    return formatExperienceString(profile.experience_years, profile.experience_months);
  }
  return String(profile.experience || applicant.experience || '');
};

export function buildApplicantsCsv(applicants: BulkApplicant[]): string {
  const columns = ['Name', 'Email', 'Phone', 'Location', 'Experience', 'Skills', 'Status', 'Match Score', 'Priority'];
  const rows = applicants.map((applicant) => {
    const profile = applicant.profiles;
    const skills = toStringArray(profile?.skills).join(', ');
    const matchScore = applicant.match_score == null ? '' : `${applicant.match_score}%`;
    return [
      profile?.name || profile?.full_name || 'Unknown',
      '**********',
      '**********',
      getLocation(profile),
      getExperience(applicant),
      skills,
      getApplicantStage(applicant),
      matchScore,
      (applicant.priority_application || applicant.priorityApplication) ? 'YES' : 'NO',
    ].map(csvEscape);
  });

  return [columns.map(csvEscape), ...rows].map((row) => row.join(',')).join('\n');
}

export function downloadApplicantsCsv(applicants: BulkApplicant[], filename = 'selected-candidates.csv'): void {
  const blob = new Blob([buildApplicantsCsv(applicants)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
