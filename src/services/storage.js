import { STORAGE_KEY } from '../config';

/**
 * Get the full tracker data from localStorage
 */
export function getTrackerData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save tracker data to localStorage
 */
export function saveTrackerData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get just the sheetId
 */
export function getSheetId() {
  const data = getTrackerData();
  return data?.sheetId || null;
}

/**
 * Extract Sheet ID from a Google Sheets URL
 */
export function extractSheetId(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
