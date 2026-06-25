function safeNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function formatExperienceString(years?: number | string | null, months?: number | string | null): string {
  const y = safeNumber(years) ?? 0;
  const m = safeNumber(months) ?? 0;
  if (y <= 0 && m <= 0) return '';
  const parts: string[] = [];
  if (y > 0) parts.push(`${Math.floor(y)} year${Math.floor(y) === 1 ? '' : 's'}`);
  if (m > 0) parts.push(`${Math.floor(m)} month${Math.floor(m) === 1 ? '' : 's'}`);
  return parts.join(' ');
}

export function getTotalExperienceMonths(years?: number | string | null, months?: number | string | null): number {
  const y = safeNumber(years) ?? 0;
  const m = safeNumber(months) ?? 0;
  return y * 12 + m;
}

export function parseExperienceStringParts(value: unknown): { years: number | null; months: number | null } {
  if (value == null) return { years: null, months: null };
  if (typeof value === 'object' && 'years' in (value as any) && 'months' in (value as any)) {
    return {
      years: safeNumber((value as any).years),
      months: safeNumber((value as any).months),
    };
  }
  const text = String(value).toLowerCase().trim();
  if (!text) return { years: null, months: null };

  const yearsMatch = text.match(/(\d+)\s*years?/);
  const monthsMatch = text.match(/(\d+)\s*months?/);
  const years = yearsMatch ? Number(yearsMatch[1]) : null;
  const months = monthsMatch ? Number(monthsMatch[1]) : null;

  if (years != null || months != null) {
    return { years: years ?? 0, months: months ?? 0 };
  }

  const numericValues = [...text.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (numericValues.length >= 2) {
    return { years: numericValues[0], months: numericValues[1] };
  }
  if (numericValues.length === 1) {
    return { years: numericValues[0], months: 0 };
  }

  return { years: null, months: null };
}

function parseDurationText(value: unknown): { minMonths: number | null; maxMonths: number | null } {
  if (value == null) return { minMonths: null, maxMonths: null };
  const text = String(value).toLowerCase().trim();
  if (!text) return { minMonths: null, maxMonths: null };

  if (text.includes('fresher') || text.includes('entry')) {
    return { minMonths: 0, maxMonths: 12 };
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/);
  const yearMatch = text.match(/(\d+(?:\.\d+)?)\s*years?/);
  const monthMatch = text.match(/(\d+(?:\.\d+)?)\s*months?/);
  const anyNumberMatch = text.match(/\d+(?:\.\d+)?/g);

  const parseSingleDuration = (raw: string | null): number => {
    if (!raw) return 0;
    return Math.round(Number(raw) * 12);
  };

  if (rangeMatch) {
    const minValue = Number(rangeMatch[1]);
    const maxValue = Number(rangeMatch[2]);
    if (text.includes('month')) {
      return {
        minMonths: Math.round(minValue),
        maxMonths: Math.round(maxValue),
      };
    }
    return {
      minMonths: Math.round(minValue * 12),
      maxMonths: Math.round(maxValue * 12),
    };
  }

  const years = yearMatch ? Number(yearMatch[1]) : null;
  const months = monthMatch ? Number(monthMatch[1]) : null;

  if (years != null || months != null) {
    return {
      minMonths: Math.round((years || 0) * 12 + (months || 0)),
      maxMonths: Math.round((years || 0) * 12 + (months || 0)),
    };
  }

  if (anyNumberMatch?.length) {
    const parsed = Number(anyNumberMatch[0]);
    if (text.includes('month')) {
      return { minMonths: Math.round(parsed), maxMonths: Math.round(parsed) };
    }
    return { minMonths: Math.round(parsed * 12), maxMonths: Math.round(parsed * 12) };
  }

  return { minMonths: null, maxMonths: null };
}

export function parseExperienceRequirement(value: unknown): { min: number | null; max: number | null } {
  const { minMonths, maxMonths } = parseDurationText(value);
  return { min: minMonths, max: maxMonths };
}

export function parseCandidateExperienceMonths(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : null;

  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const total = safeNumber(candidate.total_experience_months);
    if (total != null) return total;
    const years = safeNumber(candidate.experience_years);
    const months = safeNumber(candidate.experience_months);
    if (years != null || months != null) {
      return (years || 0) * 12 + (months || 0);
    }
    return parseCandidateExperienceMonths(candidate.experience ?? candidate.experience_string ?? null);
  }

  const text = String(value).trim();
  if (!text) return null;
  const { minMonths } = parseDurationText(text);
  return minMonths;
}
