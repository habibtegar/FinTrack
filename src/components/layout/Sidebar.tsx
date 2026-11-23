import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  PieChart,
  Settings,
  X,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import type { NavigationTab } from '../../types/finance';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    transactions,
  } = useFinance();

  const { user, logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={19} />,
    },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: <ArrowLeftRight size={19} />,
      badge: transactions.length,
    },
    {
      id: 'categories',
      label: 'Kategori',
      icon: <Tags size={19} />,
    },
    {
      id: 'analytics',
      label: 'Analisis',
      icon: <PieChart size={19} />,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings size={19} />,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
  };

  const userName = user?.name || 'Pengguna FinTrack';
  const userEmail = user?.email || 'user@fintrack.id';
  const userAvatar = user?.avatar || userName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="ft-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`ft-sidebar ${isMobileSidebarOpen ? 'ft-sidebar-open' : ''}`}>
        {/* Brand Header */}
        <div className="ft-sidebar-header">
          <div className="ft-brand">
            <div className="ft-brand-icon">
              <TrendingUp size={22} className="ft-brand-svg" />
            </div>
            <div className="ft-brand-text">
              <span className="ft-brand-title">FinTrack</span>
              <span className="ft-brand-sub">Personal Finance</span>
            </div>
          </div>
          <button
            type="button"
            className="ft-sidebar-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Tutup menu sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Compact Navigation Links */}
        <nav className="ft-sidebar-nav">
          <p className="ft-nav-group-label">MENU UTAMA</p>
          <ul className="ft-nav-list">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <li key={item.id} className="ft-nav-item">
                  <button
                    type="button"
                    className={`ft-nav-link ${isActive ? 'ft-nav-link-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="ft-nav-icon">{item.icon}</span>
                    <span className="ft-nav-text">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`ft-nav-badge ${isActive ? 'ft-nav-badge-active' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Refined Sidebar Footer: User Profile & Logout */}
        <div className="ft-sidebar-footer">
          <div className="ft-sidebar-user-card">
            <div
              className="ft-sidebar-user-info"
              onClick={() => handleNavClick('settings')}
              role="button"
              tabIndex={0}
              title="Buka Pengaturan Akun"
            >
              <div className="ft-sidebar-avatar">
                <span>{userAvatar}</span>
              </div>
              <div className="ft-sidebar-user-details">
                <span className="ft-sidebar-user-name">{userName}</span>
                <span className="ft-sidebar-user-email">{userEmail}</span>
              </div>
            </div>

            <button
              type="button"
              className="ft-sidebar-logout-btn"
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Keluar dari Akun"
              aria-label="Keluar dari akun"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Keluar dari Akun"
        message={`Apakah Anda yakin ingin keluar dari akun FinTrack (${userEmail})? Sesi Anda akan diakhiri.`}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </>
  );
};
