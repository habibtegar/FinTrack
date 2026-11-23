import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, authView } = useAuth();

  if (isLoading) {
    return (
      <div className="ft-splash-loader">
        <div className="ft-splash-spinner" />
        <span className="ft-splash-text">Memuat FinTrack...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return authView === 'login' ? <LoginPage /> : <RegisterPage />;
  }

  return (
    <FinanceProvider key={user.id}>
      <Layout />
    </FinanceProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
