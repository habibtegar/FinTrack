import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AccountProfileCard } from '../components/settings/AccountProfileCard';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { PreferencesSettings } from '../components/settings/PreferencesSettings';
import { DataManagement } from '../components/settings/DataManagement';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LogOut, UserCheck, Mail, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const userName = user?.name || 'Pengguna FinTrack';
  const userEmail = user?.email || 'user@fintrack.id';
  const userAvatar = user?.avatar || userName.slice(0, 2).toUpperCase();

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
  };

  return (
    <div className="ft-page ft-settings-page">
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">Profil & Pengaturan Akun</h2>
          <p className="ft-page-subtitle">
            Kustomisasi profil akun, format mata uang, serta kelola keamanan dan cadangan data Anda.
          </p>
        </div>
      </div>

      <div className="ft-settings-grid">
        <AccountProfileCard />
        <ProfileSettings />
        <PreferencesSettings />
        <DataManagement />

        {/* Akses Sesi Akun & Logout */}
        <Card
          title="Keamanan Sesi Akun"
          subtitle="Status sesi login akun Anda saat ini pada perangkat ini"
          className="ft-settings-card"
        >
          <div className="ft-session-card-content">
            <div className="ft-session-user-badge">
              <div className="ft-session-avatar">{userAvatar}</div>
              <div className="ft-session-user-text">
                <span className="ft-session-name">
                  <UserCheck size={15} className="ft-session-icon" /> {userName}
                </span>
                <span className="ft-session-email">
                  <Mail size={13} className="ft-session-icon" /> {userEmail}
                </span>
                <span className="ft-session-status">
                  <ShieldCheck size={13} /> Sesi Terautentikasi Aktif
                </span>
              </div>
            </div>

            <div className="ft-session-action-wrap">
              <Button
                variant="danger"
                leftIcon={<LogOut size={16} />}
                onClick={() => setIsLogoutConfirmOpen(true)}
              >
                Keluar dari Akun
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Konfirmasi Logout */}
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
    </div>
  );
};

