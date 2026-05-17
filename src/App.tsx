/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './components/AuthPage';
import { Layout } from './components/Layout';
import { FinanceDashboard } from './components/FinanceDashboard';
import { CardPage } from './components/CardPage';
import { AnalysisPage } from './components/AnalysisPage';
import { ProfilePage } from './components/ProfilePage';
import { TimeDashboard } from './components/TimeDashboard';
import type { AppMode, ActiveTab } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AppMode>('finance');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Layout mode={mode} onModeChange={setMode} activeTab={activeTab} onTabChange={setActiveTab}>
      {mode === 'finance' ? (
        <>
          {activeTab === 'dashboard' && <FinanceDashboard />}
          {activeTab === 'card' && <CardPage />}
          {activeTab === 'analysis' && <AnalysisPage />}
          {activeTab === 'profile' && <ProfilePage />}
        </>
      ) : (
        <>
          {activeTab === 'dashboard' && <TimeDashboard />}
          {activeTab === 'profile' && <ProfilePage />}
          {/* For Tempo, we reuse Profile, and Dashboard is the task list */}
          {(activeTab === 'card' || activeTab === 'analysis') && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
              <p>Funcionalidade em desenvolvimento para o modo Tempo.</p>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 text-brand-primary"
              >
                Voltar ao Início
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
