import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { CategoriesPage } from '../../pages/CategoriesPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { TransactionModal } from '../transactions/TransactionModal';
import { ToastContainer } from '../common/ToastContainer';

export const Layout: React.FC = () => {
  const { currentTab } = useFinance();

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="ft-app-layout">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ft-main-wrapper">
        <Navbar />
        <main className="ft-main-content">{renderCurrentPage()}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Notifications */}
      <TransactionModal />
      <ToastContainer />
    </div>
  );
};
