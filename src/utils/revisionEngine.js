/**
 * Revision engine — spaced repetition for DSA problems.
 * Schedule: solved → review at 1d, 3d, 7d, 14d, 30d
 * Tougher problems get shorter intervals.
 */

const INTERVALS = [1, 3, 7, 14, 30]; // days
const TOUGH_INTERVALS = [1, 2, 4, 7, 14]; // for tough/brutal rated problems

function getIntervals(userLevel) {
  return (userLevel === 'tough' || userLevel === 'brutal') ? TOUGH_INTERVALS : INTERVALS;
}

/**
 * Calculate next revision date after a problem is solved
 */
export function getNextRevisionDate(solvedAt, reviewCount = 0, userLevel = null) {
  if (!solvedAt) return null;

  const intervals = getIntervals(userLevel);
  const idx = Math.min(reviewCount, intervals.length - 1);
  const daysAhead = intervals[idx];

  const next = new Date(solvedAt);
  next.setDate(next.getDate() + daysAhead);
  return next.toISOString().slice(0, 10);
}

/**
 * Get problems due for revision today
 */
export function getRevisionQueue(problems) {
  const today = new Date().toISOString().slice(0, 10);

  return problems
    .filter(p => {
      if (p.status !== 'done') return false;
      if (!p.revisionDate) return false;
      return p.revisionDate <= today;
    })
    .sort((a, b) => (a.revisionDate || '').localeCompare(b.revisionDate || ''));
}

/**
 * Schedule initial revision when a problem is marked done
 */
export function scheduleRevision(problem) {
  const now = new Date().toISOString();
  return {
    solvedAt: problem.solvedAt || now,
    revisionDate: getNextRevisionDate(now, 0, problem.userLevel),
    reviewCount: 0,
  };
}

/**
 * Advance revision after review ("Got it" → push further, "Need practice" → repeat sooner)
 */
export function advanceRevision(problem, gotIt = true) {
  const reviewCount = (problem.reviewCount || 0) + (gotIt ? 1 : 0);
  const intervals = getIntervals(problem.userLevel);

  if (gotIt && reviewCount >= intervals.length) {
    // Mastered — no more revisions
    return { revisionDate: null, reviewCount };
  }

  const idx = gotIt ? reviewCount : Math.max(0, (problem.reviewCount || 0) - 1);
  const next = new Date();
  next.setDate(next.getDate() + intervals[Math.min(idx, intervals.length - 1)]);

  return {
    revisionDate: next.toISOString().slice(0, 10),
    reviewCount,
  };
}
