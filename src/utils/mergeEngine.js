/**
 * Merge engine: reconcile new problems from sheet with existing localStorage data.
 * - New problems get status: "todo", starred: false, notes: ""
 * - Existing problems preserve status, starred, notes
 * - Sheet-sourced fields (name, link, class, etc.) get updated from latest data
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
      });
    } else {
      // Brand new problem
      merged.push({
        ...newP,
        status: 'todo',
        starred: false,
        notes: '',
      });
      newCount++;
    }
  }

  return { merged, newCount };
}
