import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Check, Sparkles, ChevronDown, User, LogOut, ShieldCheck } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getTodayDateString } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Ringkasan Dashboard',
    subtitle: 'Pantau arus kas, saldo, dan transaksi terbaru Anda',
  },
  transactions: {
    title: 'Daftar Transaksi',
    subtitle: 'Kelola seluruh riwayat pemasukan dan pengeluaran',
  },
  categories: {
    title: 'Manajemen Kategori',
    subtitle: 'Atur kategori belanja dan sumber pemasukan sesuai kebutuhan',
  },
  analytics: {
    title: 'Statistik & Analisis',
    subtitle: 'Visualisasi grafik mendalam tentang alokasi dana Anda',
  },
  settings: {
    title: 'Profil & Pengaturan',
    subtitle: 'Sesuaikan profil, preferensi, dan kelola akun Anda',
  },
};

export const Navbar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    setIsMobileSidebarOpen,
    healthInsight,
    userProfile,
  } = useFinance();
  const { user, logout } = useAuth();

  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close notification or profile popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const pageInfo = TAB_TITLES[currentTab] || {
    title: 'FinTrack',
    subtitle: 'Kelola Keuangan dengan Mudah',
  };

  const todayStr = formatDate(getTodayDateString(), userProfile.dateFormat);

  const userName = user?.name || userProfile.name || 'Pengguna FinTrack';
  const userEmail = user?.email || userProfile.email || 'user@fintrack.id';

  const isImageAvatar = Boolean(
    user?.avatar &&
      (user.avatar.startsWith('http://') ||
        user.avatar.startsWith('https://') ||
        user.avatar.startsWith('data:') ||
        user.avatar.startsWith('/'))
  );

  const userAvatar =
    !isImageAvatar && user?.avatar
      ? user.avatar
      : userProfile.avatar ||
        userName
          .trim()
          .split(' ')
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() ||
        'U';

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
  };

  return (
    <header className="ft-navbar">
      <div className="ft-navbar-left">
        <button
          type="button"
          className="ft-hamburger-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Buka menu navigasi"
        >
          <Menu size={22} />
        </button>

        <div className="ft-navbar-titles">
          <h1 className="ft-navbar-page-title">{pageInfo.title}</h1>
          <p className="ft-navbar-page-sub">{pageInfo.subtitle}</p>
        </div>
      </div>

      <div className="ft-navbar-right">
        {/* Date badge */}
        <div className="ft-navbar-date">
          <span>{todayStr}</span>
        </div>

        {/* Notification Bell */}
        <div className="ft-navbar-notif-wrapper" ref={notificationRef}>
          <button
            type="button"
            className="ft-icon-btn ft-notif-btn"
            onClick={() => {
              setShowNotificationMenu((prev) => !prev);
              setShowProfileMenu(false);
            }}
            aria-label="Notifikasi dan Wawasan Keuangan"
          >
            <Bell size={19} />
            <span className="ft-notif-indicator" />
          </button>

          {showNotificationMenu && (
            <div className="ft-notif-dropdown">
              <div className="ft-notif-dropdown-header">
                <div>
                  <h4 className="ft-notif-dropdown-title">Notifikasi & Wawasan</h4>
                  <p className="ft-notif-dropdown-subtitle">Status kondisi keuangan aktif</p>
                </div>
                <span className="ft-notif-badge">1 Baru</span>
              </div>

              <div className="ft-notif-list">
                <div className="ft-notif-card">
                  <div className="ft-notif-card-icon">
                    <Sparkles size={16} />
                  </div>
                  <div className="ft-notif-card-body">
                    <p className="ft-notif-card-title">{healthInsight.headline}</p>
                    <p className="ft-notif-card-desc">{healthInsight.detail}</p>
                    <span className="ft-notif-card-time">Baru saja dihitung</span>
                  </div>
                </div>

                <div className="ft-notif-card read">
                  <div className="ft-notif-card-icon default">
                    <Check size={16} />
                  </div>
                  <div className="ft-notif-card-body">
                    <p className="ft-notif-card-title">Pencatatan Sinkron</p>
                    <p className="ft-notif-card-desc">
                      Data Anda tersimpan dengan aman di penyimpanan lokal peramban.
                    </p>
                    <span className="ft-notif-card-time">Hari ini</span>
                  </div>
                </div>
              </div>

              <div className="ft-notif-dropdown-footer">
                <button
                  type="button"
                  className="ft-notif-footer-action"
                  onClick={() => {
                    setShowNotificationMenu(false);
                    setCurrentTab('analytics');
                  }}
                >
                  Lihat Analisis Lengkap →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile in Navbar (Next to Notification) */}
        <div className="ft-navbar-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="ft-user-pill"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotificationMenu(false);
            }}
            aria-label="Profil Akun Pengguna"
            aria-expanded={showProfileMenu}
            title={`${userName} (${userEmail})`}
          >
            <div className="ft-user-avatar">
              {isImageAvatar ? (
                <img src={user?.avatar} alt={userName} className="ft-user-avatar-img" />
              ) : (
                <span>{userAvatar}</span>
              )}
            </div>
            <div className="ft-user-info">
              <span className="ft-user-name">{userName}</span>
              <span className="ft-user-role">FinTrack Personal</span>
            </div>
            <ChevronDown size={14} className={`ft-user-chevron ${showProfileMenu ? 'open' : ''}`} />
          </button>

          {showProfileMenu && (
            <div className="ft-profile-dropdown" role="menu">
              <div className="ft-profile-dropdown-header">
                <div className="ft-profile-dropdown-avatar">
                  {isImageAvatar ? (
                    <img src={user?.avatar} alt={userName} className="ft-user-avatar-img" />
                  ) : (
                    <span>{userAvatar}</span>
                  )}
                </div>
                <div className="ft-profile-dropdown-user-info">
                  <p className="ft-profile-dropdown-name">{userName}</p>
                  <p className="ft-profile-dropdown-email">{userEmail}</p>
                  <span className="ft-profile-dropdown-badge">
                    <ShieldCheck size={12} /> Akun Aktif
                  </span>
                </div>
              </div>

              <div className="ft-profile-dropdown-menu">
                <button
                  type="button"
                  className="ft-profile-dropdown-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setCurrentTab('settings');
                  }}
                >
                  <User size={15} className="ft-profile-dropdown-icon" />
                  <span>Profil & Pengaturan Akun</span>
                </button>

                <div className="ft-profile-dropdown-divider" />

                <button
                  type="button"
                  className="ft-profile-dropdown-item ft-profile-dropdown-danger"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                >
                  <LogOut size={15} className="ft-profile-dropdown-icon" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Logout dari Navbar */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Keluar dari Akun"
        message={`Apakah Anda yakin ingin keluar dari akun FinTrack (${userEmail})? Sesi Anda pada perangkat ini akan diakhiri.`}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
};
