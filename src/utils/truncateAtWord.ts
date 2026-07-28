/**
 * Truncates text at word boundaries without breaking words
 * Removes HTML tags and handles whitespace properly
 * Only appends ellipsis if truncation actually occurred
 *
 * @param text - Raw text possibly containing HTML
 * @param maxCharacters - Maximum characters before truncation
 * @returns Truncated text with ellipsis only if needed
 *
 * @example
 * // Without truncation
 * truncateAtWord('Short text', 100) // 'Short text'
 *
 * @example
 * // With truncation at word boundary
 * truncateAtWord('We are hiring a Senior Critical Environment Technician...', 30)
 * // 'We are hiring a Senior...'
 */
export const truncateAtWord = (text: string | undefined, maxCharacters: number = 180): string => {
  if (!text) return '';

  // Remove HTML tags
  const cleanText = text.replace(/<[^>]*>/g, '').trim();

  // If text fits within limit, return as-is (no ellipsis needed)
  if (cleanText.length <= maxCharacters) {
    return cleanText;
  }

  // Find truncation point - go back to last space before maxCharacters
  let truncated = cleanText.substring(0, maxCharacters);

  // Find the last space before the truncation point
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // If we found a space, truncate there; otherwise truncate at maxCharacters
  if (lastSpaceIndex > 0) {
    truncated = truncated.substring(0, lastSpaceIndex);
  } else {
    truncated = truncated.substring(0, maxCharacters);
  }

  // Only add ellipsis if we actually truncated
  return truncated.trim() + '...';
};
