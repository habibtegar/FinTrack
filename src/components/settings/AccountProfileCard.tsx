import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDate, getTodayDateString } from '../../utils/formatters';
import {
  UserPen,
  KeyRound,
  Calendar,
  Mail,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';

export const AccountProfileCard: React.FC = () => {
  const { user, updateActiveUser, changePassword } = useAuth();
  const { userProfile, updateUserProfile, addToast } = useFinance();

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Fallback avatar initial or image check
  const isImageAvatar = Boolean(
    user?.avatar &&
      (user.avatar.startsWith('http://') ||
        user.avatar.startsWith('https://') ||
        user.avatar.startsWith('data:') ||
        user.avatar.startsWith('/'))
  );

  const avatarText =
    !isImageAvatar && user?.avatar
      ? user.avatar
      : user?.name
        ? user.name
            .trim()
            .split(' ')
            .map((w) => w[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'U';

  // Format created date
  const createdDateStr = user?.createdAt ? user.createdAt.slice(0, 10) : getTodayDateString();
  const formattedCreatedDate = formatDate(createdDateStr, userProfile.dateFormat);

  // Open Edit Profile modal and sync latest name/avatar
  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || avatarText);
    setIsEditModalOpen(true);
  };

  // Submit Edit Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) {
      addToast('Nama Wajib Diisi', 'Silakan masukkan nama pengguna yang valid.', 'warning');
      return;
    }

    const avatarCode = (editAvatar.trim() || trimmedName).slice(0, 3).toUpperCase();

    // 1. Update AuthContext & localStorage (fintrack_users_v1, fintrack_current_user_v1)
    updateActiveUser({
      name: trimmedName,
      avatar: avatarCode,
    });

    // 2. Update FinanceContext & localStorage (fintrack_{userId}_profile)
    updateUserProfile({
      name: trimmedName,
      avatar: avatarCode,
    });

    setIsEditModalOpen(false);
    addToast('Profil Berhasil Diperbarui', 'Nama dan avatar akun Anda telah disimpan.');
  };

  // Open Change Password modal and reset fields
  const handleOpenPassword = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  // Submit Change Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Silakan masukkan kata sandi Anda saat ini.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('Kata sandi baru tidak boleh sama dengan kata sandi lama.');
      return;
    }

    setIsSubmittingPassword(true);
    const result = await changePassword(oldPassword, newPassword);
    setIsSubmittingPassword(false);

    if (result.success) {
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast(
        'Kata Sandi Berhasil Diperbarui',
        'Kata sandi akun Anda telah diperbarui. Gunakan kata sandi baru ini pada sesi masuk berikutnya.'
      );
    } else {
      setPasswordError(result.error || 'Gagal mengubah kata sandi.');
    }
  };

  return (
    <>
      <Card
        title="Profil Akun"
        subtitle="Informasi identitas akun dan keamanan kredensial Anda"
        className="ft-settings-card"
      >
        <div className="ft-account-profile-box">
          <div className="ft-account-profile-main">
            {/* Foto / Avatar Profil Berinisial */}
            <div className="ft-account-avatar-large" aria-label="Avatar Profil">
              {isImageAvatar ? (
                <img
                  src={user?.avatar}
                  alt={user?.name || 'Avatar'}
                  className="ft-account-avatar-img"
                />
              ) : (
                <span>{avatarText}</span>
              )}
            </div>

            {/* Detail Akun */}
            <div className="ft-account-profile-meta">
              <div className="ft-account-name-group">
                <h3 className="ft-account-name">{user?.name || 'Pengguna FinTrack'}</h3>
                <span className="ft-account-status-badge">
                  <ShieldCheck size={13} /> Akun Aktif
                </span>
              </div>

              <p className="ft-account-email-row">
                <Mail size={14} className="ft-account-icon" />
                <span>{user?.email || 'user@fintrack.id'}</span>
              </p>

              <p className="ft-account-created-row">
                <Calendar size={14} className="ft-account-icon" />
                <span>
                  Akun dibuat: <strong>{formattedCreatedDate}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit Profil & Ubah Password */}
          <div className="ft-account-profile-btn-group">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserPen size={15} />}
              onClick={handleOpenEdit}
            >
              Edit Profil
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<KeyRound size={15} />}
              onClick={handleOpenPassword}
            >
              Ubah Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Edit Profil */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profil Pengguna"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveProfile} className="ft-form">
          <div className="ft-form-group">
            <label htmlFor="edit-user-name" className="ft-label">
              Nama Lengkap <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <User size={16} className="ft-input-icon" />
              <input
                id="edit-user-name"
                type="text"
                className="ft-input ft-input-icon-pad"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="ft-form-group">
            <label htmlFor="edit-user-avatar" className="ft-label">
              Inisial Avatar (Maksimal 3 Huruf)
            </label>
            <input
              id="edit-user-avatar"
              type="text"
              maxLength={3}
              className="ft-input"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value.toUpperCase())}
              placeholder="Contoh: BS"
            />
            <span className="ft-input-hint">
              Ditampilkan di lingkaran avatar jika tidak menggunakan foto.
            </span>
          </div>

          <div className="ft-form-group">
            <label htmlFor="edit-user-email" className="ft-label">
              Alamat Email (Akun Utama)
            </label>
            <div className="ft-input-with-icon-wrap">
              <Mail size={16} className="ft-input-icon" />
              <input
                id="edit-user-email"
                type="email"
                className="ft-input ft-input-icon-pad"
                value={user?.email || ''}
                disabled
                title="Email akun utama tidak dapat diubah di sini"
              />
            </div>
            <span className="ft-input-hint">
              Alamat email terdaftar sebagai identitas unik login akun Anda.
            </span>
          </div>

          <div className="ft-modal-footer-btns">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Check size={16} />}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ubah Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Ubah Kata Sandi Akun"
        maxWidth="sm"
      >
        <form onSubmit={handleSavePassword} className="ft-form">
          {passwordError && (
            <div className="ft-alert ft-alert-danger">
              <AlertCircle size={16} className="ft-alert-icon" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="ft-form-group">
            <label htmlFor="curr-password" className="ft-label">
              Kata Sandi Saat Ini <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="curr-password"
                type={showOldPass ? 'text' : 'password'}
                className="ft-input ft-input-icon-pad ft-input-with-toggle"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                required
              />
              <button
                type="button"
                className="ft-password-toggle-btn"
                onClick={() => setShowOldPass(!showOldPass)}
                aria-label={showOldPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="ft-form-group">
            <label htmlFor="new-password" className="ft-label">
              Kata Sandi Baru <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="new-password"
                type={showNewPass ? 'text' : 'password'}
                className="ft-input ft-input-icon-pad ft-input-with-toggle"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
              <button
                type="button"
                className="ft-password-toggle-btn"
                onClick={() => setShowNewPass(!showNewPass)}
                aria-label={showNewPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="ft-form-group">
            <label htmlFor="confirm-password" className="ft-label">
              Konfirmasi Kata Sandi Baru <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="confirm-password"
                type={showConfirmPass ? 'text' : 'password'}
                className="ft-input ft-input-icon-pad ft-input-with-toggle"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                required
              />
              <button
                type="button"
                className="ft-password-toggle-btn"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                aria-label={showConfirmPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="ft-modal-footer-btns">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isSubmittingPassword}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<KeyRound size={16} />}
              disabled={isSubmittingPassword}
            >
              {isSubmittingPassword ? 'Memproses...' : 'Perbarui Kata Sandi'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
