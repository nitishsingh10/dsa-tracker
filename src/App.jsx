import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TrackerProvider, useTracker } from './contexts/TrackerContext';
import LoginScreen from './components/LoginScreen';
import SheetPrompt from './components/SheetPrompt';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProblemList from './components/ProblemList';
import Analytics from './components/Analytics';
import FocusMode from './components/FocusMode';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import useKeyboard from './hooks/useKeyboard';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <TrackerProvider>
      <TrackerContent />
    </TrackerProvider>
  );
}

function TrackerContent() {
  const { sheetId, toast, setToast, focusProblem, setFocusProblem, getRandomProblem } = useTracker();
  const [activeTab, setActiveTab] = useState('problems');
  const [showSettings, setShowSettings] = useState(false);

  const handleSearch = useCallback(() => {
    const el = document.getElementById('search-input');
    if (el) el.focus();
  }, []);

  const handleRandom = useCallback(() => {
    const p = getRandomProblem();
    if (p) setFocusProblem(p);
  }, [getRandomProblem, setFocusProblem]);

  const handleEscape = useCallback(() => {
    if (focusProblem) return; // FocusMode handles its own Esc
    if (showSettings) setShowSettings(false);
  }, [focusProblem, showSettings]);

  useKeyboard({
    onSearch: handleSearch,
    onRandom: handleRandom,
    onEscape: handleEscape,
  });

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenSettings={() => setShowSettings(true)} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!sheetId ? <SheetPrompt /> : (
          <>
            {activeTab === 'problems' && (
              <>
                <Dashboard />
                <ProblemList />
              </>
            )}
            {activeTab === 'analytics' && <Analytics />}
          </>
        )}
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      {focusProblem && <FocusMode />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
