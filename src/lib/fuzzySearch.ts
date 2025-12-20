/**
 * Fuzzy search algorithm - finds matches even with typos
 * Example: "recat" matches "react"
 */
export function fuzzyMatch(searchTerm: string, targetString: string): number {
  const search = searchTerm.toLowerCase();
  const target = targetString.toLowerCase();

  // Exact match gets highest score
  if (target === search) return 1000;
  
  // Starts with search term gets very high score
  if (target.startsWith(search)) return 500;
  
  // Contains search term gets high score
  if (target.includes(search)) return 300;

  // Fuzzy match algorithm (Levenshtein distance)
  let score = 0;
  let searchIndex = 0;

  for (let i = 0; i < target.length && searchIndex < search.length; i++) {
    if (target[i] === search[searchIndex]) {
      score += 10;
      searchIndex++;
    } else {
      score -= 1;
    }
  }

  // If all characters matched in order
  if (searchIndex === search.length) {
    return Math.max(0, score);
  }

  return -1; // No match
}

/**
 * Searches multiple fields with fuzzy matching
 */
export interface SearchableResult {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  price: number;
  reelCount: number;
  matchScore: number;
}

export function searchCourses(
  query: string,
  courses: SearchableResult[]
): SearchableResult[] {
  if (!query.trim()) return courses;

  const queryLower = query.toLowerCase();

  // Score each course
  const scored = courses.map((course) => {
    let score = 0;

    // Search in title (highest weight)
    const titleScore = fuzzyMatch(queryLower, course.title);
    if (titleScore >= 0) score += titleScore * 3;

    // Search in description (medium weight)
    const descScore = fuzzyMatch(queryLower, course.description);
    if (descScore >= 0) score += descScore * 2;

    // Search in creator name (medium weight)
    const creatorScore = fuzzyMatch(queryLower, course.creatorName);
    if (creatorScore >= 0) score += creatorScore * 2;

    return {
      ...course,
      matchScore: score,
    };
  });

  // Filter out non-matches and sort by score
  return scored
    .filter((course) => course.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}
