import { Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Footer } from './components/Footer';
import { TopNavigation } from './components/TopNavigation';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const { connectionError } = useAuth();
  // Check if we are in mock mode by checking if console has logged the warning (rough check) or just assume valid for now
  // Actually, let's just show a "Mock Mode" banner instead of error if we are using it.
  // Since we can't easily import the const from supabase.ts (it's not exported), we will trust the lack of error.

  return (
    <div className="min-h-screen bg-[#eaecf0] font-sans">

      


      {connectionError && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 sticky top-0 z-[100]">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-amber-800">
                <span className="font-bold">Connection Warning:</span> Unable to reach the backend server. Some features may be unavailable.
              </p>
              <p className="mt-3 text-sm md:mt-0 md:ml-6">
                <button
                  onClick={() => window.location.reload()}
                  className="whitespace-nowrap font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  Reload Page
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Top Navigation */}
      <TopNavigation />

      <main className="w-full flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
