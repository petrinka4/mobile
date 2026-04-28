
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}


export function fuzzyMatch(text, query, threshold = 2) {
  const t = text.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  
  const words = t.split(/\s+/);
  return words.some(word => levenshtein(word, q) <= threshold);
}

export function filterHabits(habits, { query, frequency, sortBy }) {
  let result = [...habits];

  
  if (query && query.trim()) {
    result = result.filter(h =>
      fuzzyMatch(h.name, query) || fuzzyMatch(h.description || '', query)
    );
  }

  
  if (frequency && frequency !== 'all') {
    result = result.filter(h => h.frequency === frequency);
  }

  
  if (sortBy === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'streak') {
    result.sort((a, b) => (b.streak || 0) - (a.streak || 0));
  } else if (sortBy === 'progress') {
    result.sort((a, b) => {
      const pa = a.goal_days > 0 ? a.completed / a.goal_days : 0;
      const pb = b.goal_days > 0 ? b.completed / b.goal_days : 0;
      return pb - pa;
    });
  } else { 
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return result;
}