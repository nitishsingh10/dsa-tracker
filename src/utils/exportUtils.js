/**
 * Export utilities — CSV and shareable stats card
 */
import { calculateStreaks, getTotalStats, formatTime } from '../utils/streakEngine';
import { getActivityRange } from '../services/activityLog';

/**
 * Export problems as CSV
 */
export function exportCSV(problems) {
  const headers = ['Problem', 'Topic', 'Difficulty', 'Platform', 'Type', 'Status', 'Toughness', 'Time Spent (min)', 'Starred', 'Notes', 'Link'];

  const rows = problems.map(p => [
    p.problemName,
    (p.className || '').replace(/^Class\s*\d+\s*:\s*/i, '').replace(/\s+\d+$/, '').trim(),
    p.difficulty,
    p.platform,
    p.type,
    p.status,
    p.userLevel || '',
    Math.round((p.timeSpent || 0) / 60),
    p.starred ? 'Yes' : 'No',
    (p.notes || '').replace(/"/g, '""'),
    p.link || '',
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  downloadFile(csv, 'dsa-tracker-export.csv', 'text/csv');
}

/**
 * Export progress summary as JSON
 */
export function exportJSON(problems) {
  const data = {
    exportDate: new Date().toISOString(),
    totalProblems: problems.length,
    solved: problems.filter(p => p.status === 'done').length,
    inProgress: problems.filter(p => p.status === 'in-progress').length,
    problems: problems.map(p => ({
      name: p.problemName,
      difficulty: p.difficulty,
      platform: p.platform,
      status: p.status,
      userLevel: p.userLevel,
      timeSpent: p.timeSpent || 0,
      starred: p.starred,
      notes: p.notes,
      link: p.link,
      tags: p.tags || [],
    })),
  };

  downloadFile(JSON.stringify(data, null, 2), 'dsa-tracker-export.json', 'application/json');
}

/**
 * Generate a text-based stats summary
 */
export function generateStatsSummary(problems) {
  const streaks = calculateStreaks();
  const stats = getTotalStats(problems);
  const total = problems.length;
  const done = problems.filter(p => p.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const easy = problems.filter(p => p.status === 'done' && p.difficulty === 'Easy').length;
  const medium = problems.filter(p => p.status === 'done' && p.difficulty === 'Medium').length;
  const hard = problems.filter(p => p.status === 'done' && p.difficulty === 'Hard').length;

  return [
    `🏆 DSA Tracker Progress`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📊 ${done}/${total} solved (${pct}%)`,
    `🟢 Easy: ${easy}  🟡 Medium: ${medium}  🔴 Hard: ${hard}`,
    `🔥 Current streak: ${streaks.currentStreak} days`,
    `⏱  Time invested: ${formatTime(stats.totalTime)}`,
    `📅 Active days: ${stats.activeDays}`,
    ``,
    `#DSATracker #CodingProgress`,
  ].join('\n');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
