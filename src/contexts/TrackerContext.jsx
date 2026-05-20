import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchSheetData } from '../services/sheetsApi';
import { parseSheetData } from '../utils/parseSheet';
import { mergeProblems } from '../utils/mergeEngine';
import { getTrackerData, saveTrackerData, extractSheetId } from '../services/storage';

const TrackerContext = createContext(null);

export function TrackerProvider({ children }) {
  const { token } = useAuth();
  const [sheetId, setSheetIdState] = useState(null);
  const [problems, setProblems] = useState([]);
  const [classNotes, setClassNotes] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const data = getTrackerData();
    if (data) {
      setSheetIdState(data.sheetId || null);
      setProblems(data.problems || []);
      setClassNotes(data.classNotes || []);
      setLastSynced(data.lastSynced || null);
    }
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Sync sheet data
  const sync = useCallback(async (overrideSheetId) => {
    const id = overrideSheetId || sheetId;
    if (!id || !token) return;

    setSyncing(true);
    try {
      const { values, metadata } = await fetchSheetData(id, token);
      const { problems: newProblems, classNotes: newClassNotes } = parseSheetData(values, metadata);
      const { merged, newCount } = mergeProblems(problems, newProblems);
      const now = new Date().toISOString();

      setProblems(merged);
      setClassNotes(newClassNotes);
      setLastSynced(now);

      const data = { sheetId: id, lastSynced: now, problems: merged, classNotes: newClassNotes };
      saveTrackerData(data);

      if (newCount > 0) {
        showToast(`${newCount} new problem${newCount > 1 ? 's' : ''} added!`);
      } else {
        showToast('Already up to date');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }, [sheetId, token, problems, showToast]);

  const setSheetUrl = useCallback(async (url) => {
    const id = extractSheetId(url);
    if (!id) {
      showToast('Invalid Google Sheet URL', 'error');
      return false;
    }
    setSheetIdState(id);
    const data = { sheetId: id, lastSynced: null, problems: [], classNotes: [] };
    saveTrackerData(data);
    await sync(id);
    return true;
  }, [sync, showToast]);

  useEffect(() => {
    if (sheetId && token) sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, token]);

  const updateProblem = useCallback((id, fields) => {
    setProblems(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...fields } : p);
      const data = { sheetId, lastSynced, problems: updated, classNotes };
      saveTrackerData(data);
      return updated;
    });
  }, [sheetId, lastSynced, classNotes]);

  return (
    <TrackerContext.Provider value={{
      sheetId, problems, classNotes, lastSynced, syncing, toast, setToast,
      sync, setSheetUrl, updateProblem,
    }}>
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used within TrackerProvider');
  return ctx;
}
