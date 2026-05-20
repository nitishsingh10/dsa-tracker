import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TrackerProvider, useTracker } from './contexts/TrackerContext';
import LoginScreen from './components/LoginScreen';
import SheetPrompt from './components/SheetPrompt';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProblemList from './components/ProblemList';
import Toast from './components/Toast';

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
  const { sheetId, toast, setToast } = useTracker();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {!sheetId ? <SheetPrompt /> : (
          <>
            <Dashboard />
            <ProblemList />
          </>
        )}
      </main>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
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
