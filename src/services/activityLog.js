/**
 * Activity log — tracks daily problem-solving activity for streaks & heatmap.
 * Stored in localStorage under 'dsa-activity'.
 * Structure: { [YYYY-MM-DD]: { solved: number, timeSpent: number, problems: [id, ...] } }
 */

const ACTIVITY_KEY = 'dsa-activity';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function getActivityLog() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveActivityLog(log) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
}

/**
 * Record that a problem was solved today
 */
export function logSolve(problemId) {
  const log = getActivityLog();
  const today = getToday();

  if (!log[today]) {
    log[today] = { solved: 0, timeSpent: 0, problems: [] };
  }

  if (!log[today].problems.includes(problemId)) {
    log[today].solved += 1;
    log[today].problems.push(problemId);
  }

  saveActivityLog(log);
  return log;
}

/**
 * Add time to today's log
 */
export function logTime(seconds) {
  const log = getActivityLog();
  const today = getToday();

  if (!log[today]) {
    log[today] = { solved: 0, timeSpent: 0, problems: [] };
  }

  log[today].timeSpent += seconds;
  saveActivityLog(log);
  return log;
}

/**
 * Get activity for the last N days (for heatmap)
 */
export function getActivityRange(days = 90) {
  const log = getActivityLog();
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({
      date: key,
      day: d.getDay(),
      solved: log[key]?.solved || 0,
      timeSpent: log[key]?.timeSpent || 0,
    });
  }

  return result;
}

/**
 * Get total problems solved today
 */
export function getTodaySolveCount() {
  const log = getActivityLog();
  return log[getToday()]?.solved || 0;
}
