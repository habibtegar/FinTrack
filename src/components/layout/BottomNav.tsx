import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  User,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { NavigationTab } from '../../types/finance';

interface BottomNavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  isActive: (tab: NavigationTab) => boolean;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab } = useFinance();

  const navItems: BottomNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      isActive: (tab) => tab === 'dashboard',
    },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: <ArrowLeftRight size={20} />,
      isActive: (tab) => tab === 'transactions' || tab === 'categories',
    },
    {
      id: 'analytics',
      label: 'Analisis',
      icon: <PieChart size={20} />,
      isActive: (tab) => tab === 'analytics',
    },
    {
      id: 'settings',
      label: 'Profil',
      icon: <User size={20} />,
      isActive: (tab) => tab === 'settings',
    },
  ];

  return (
    <nav className="ft-bottom-nav" aria-label="Navigasi Bawah">
      <div className="ft-bottom-nav-inner">
        {navItems.map((item) => {
          const active = item.isActive(currentTab);
          return (
            <button
              key={item.id}
              type="button"
              className={`ft-bottom-nav-item ${active ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="ft-bottom-nav-icon-wrap">
                {item.icon}
                {active && <span className="ft-bottom-nav-active-pill" />}
              </div>
              <span className="ft-bottom-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
