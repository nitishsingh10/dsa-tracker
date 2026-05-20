/**
 * Merge engine: reconcile new problems from sheet with existing localStorage data.
 * User fields preserved across syncs: status, starred, notes, userLevel,
 * timeSpent, sessions, tags, revisionDate, solvedAt
 * Sheet-sourced fields (name, link, class, etc.) get updated from latest data.
 */
export function mergeProblems(existingProblems = [], newProblems = []) {
  // Build a map from existing problems keyed by id
  const existingMap = new Map();
  for (const p of existingProblems) {
    existingMap.set(p.id, p);
  }

  let newCount = 0;
  const merged = [];

  for (const newP of newProblems) {
    const existing = existingMap.get(newP.id);
    if (existing) {
      // Preserve user fields, update sheet fields
      merged.push({
        ...newP,
        status: existing.status,
        starred: existing.starred,
        notes: existing.notes,
        userLevel: existing.userLevel || null,
        timeSpent: existing.timeSpent || 0,
        sessions: existing.sessions || [],
        tags: existing.tags || [],
        revisionDate: existing.revisionDate || null,
        solvedAt: existing.solvedAt || null,
      });
    } else {
      // Brand new problem
      merged.push({
        ...newP,
        status: 'todo',
        starred: false,
        notes: '',
        userLevel: null,
        timeSpent: 0,
        sessions: [],
        tags: [],
        revisionDate: null,
        solvedAt: null,
      });
      newCount++;
    }
  }

  return { merged, newCount };
}
