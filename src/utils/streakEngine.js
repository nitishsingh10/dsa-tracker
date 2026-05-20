/**
 * Streak engine — calculates current streak, longest streak, and goal progress.
 */
import { getActivityLog } from '../services/activityLog';

const GOALS_KEY = 'dsa-goals';

/**
 * Get the user's daily goal (default: 3)
 */
export function getDailyGoal() {
  try {
    return parseInt(localStorage.getItem(GOALS_KEY), 10) || 3;
  } catch {
    return 3;
  }
}

export function setDailyGoal(n) {
  localStorage.setItem(GOALS_KEY, String(Math.max(1, n)));
}

/**
 * Calculate current streak and longest streak
 */
export function calculateStreaks() {
  const log = getActivityLog();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Walk backwards from today
  const d = new Date(today);
  // Check if today has any solves, if not check if yesterday did (streak not broken yet today)
  const todayKey = d.toISOString().slice(0, 10);
  const hasSolvedToday = (log[todayKey]?.solved || 0) > 0;

  if (!hasSolvedToday) {
    // Check yesterday — streak isn't broken until midnight passes with no solve
    d.setDate(d.getDate() - 1);
  }

  // Count consecutive days with solves
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if ((log[key]?.solved || 0) > 0) {
      tempStreak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  currentStreak = tempStreak;

  // Calculate longest streak across all data
  const allDates = Object.keys(log).sort();
  if (allDates.length > 0) {
    tempStreak = 0;
    let prevDate = null;

    for (const dateStr of allDates) {
      if ((log[dateStr]?.solved || 0) === 0) {
        tempStreak = 0;
        prevDate = null;
        continue;
      }

      const curr = new Date(dateStr);
      if (prevDate) {
        const diff = (curr - prevDate) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;
      prevDate = curr;
    }
  }

  if (currentStreak > longestStreak) longestStreak = currentStreak;

  return { currentStreak, longestStreak, hasSolvedToday };
}

/**
 * Get total stats across all time
 */
export function getTotalStats(problems = []) {
  const log = getActivityLog();
  let totalTime = 0;
  let totalDays = 0;

  for (const day of Object.values(log)) {
    if (day.solved > 0) totalDays++;
    totalTime += day.timeSpent || 0;
  }

  // Also sum timeSpent from problems directly (more accurate)
  const problemTime = problems.reduce((s, p) => s + (p.timeSpent || 0), 0);

  return {
    totalTime: Math.max(totalTime, problemTime),
    activeDays: totalDays,
    totalSolved: problems.filter(p => p.status === 'done').length,
  };
}

/**
 * Format seconds into human readable string
 */
export function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

/**
 * Format seconds into compact display (for cards)
 */
export function formatTimeCompact(seconds) {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h${rm}m` : `${h}h`;
}
