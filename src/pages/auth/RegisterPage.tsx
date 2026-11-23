import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const { register, setAuthView, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setNameError('Nama lengkap wajib diisi.');
      isValid = false;
    } else if (name.trim().length < 2) {
      setNameError('Nama lengkap minimal 2 karakter.');
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email wajib diisi.');
      isValid = false;
    } else if (!emailPattern.test(email.trim())) {
      setEmailError('Format email tidak valid.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Kata sandi wajib diisi.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Kata sandi minimal 6 karakter.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Konfirmasi kata sandi wajib diisi.');
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmError('Konfirmasi kata sandi tidak cocok.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const res = await register({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="ft-auth-container">
      <div className="ft-auth-card">
        {/* Brand Header */}
        <div className="ft-auth-header">
          <div className="ft-auth-brand">
            <div className="ft-auth-brand-icon">
              <TrendingUp size={22} />
            </div>
            <span className="ft-auth-brand-title">FinTrack</span>
          </div>
          <h2 className="ft-auth-title">Daftar Akun Baru</h2>
          <p className="ft-auth-subtitle">
            Mulai kelola perencanaan dan catatan keuangan Anda hari ini.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="ft-auth-error-alert" role="alert">
            <AlertCircle size={18} className="ft-auth-error-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="ft-auth-form" noValidate>
          {/* Full Name */}
          <div className="ft-form-group">
            <label htmlFor="register-name" className="ft-label">
              Nama Lengkap <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <User size={16} className="ft-input-icon" />
              <input
                id="register-name"
                type="text"
                className={`ft-input ft-input-icon-pad ${nameError ? 'ft-input-error' : ''}`}
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                autoComplete="name"
              />
            </div>
            {nameError && <span className="ft-form-error">{nameError}</span>}
          </div>

          {/* Email */}
          <div className="ft-form-group">
            <label htmlFor="register-email" className="ft-label">
              Alamat Email <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Mail size={16} className="ft-input-icon" />
              <input
                id="register-email"
                type="email"
                className={`ft-input ft-input-icon-pad ${emailError ? 'ft-input-error' : ''}`}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                autoComplete="email"
              />
            </div>
            {emailError && <span className="ft-form-error">{emailError}</span>}
          </div>

          {/* Password */}
          <div className="ft-form-group">
            <label htmlFor="register-password" className="ft-label">
              Kata Sandi <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className={`ft-input ft-input-icon-pad ft-input-password-pad ${
                  passwordError ? 'ft-input-error' : ''
                }`}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="ft-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <span className="ft-form-error">{passwordError}</span>}
          </div>

          {/* Confirm Password */}
          <div className="ft-form-group">
            <label htmlFor="register-confirm-password" className="ft-label">
              Konfirmasi Kata Sandi <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`ft-input ft-input-icon-pad ft-input-password-pad ${
                  confirmError ? 'ft-input-error' : ''
                }`}
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) setConfirmError(null);
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="ft-password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmError && <span className="ft-form-error">{confirmError}</span>}
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={16} />}
            className="ft-auth-submit-btn"
          >
            Daftar Sekarang
          </Button>
        </form>

        {/* Footer switch to Login */}
        <div className="ft-auth-footer">
          <p className="ft-auth-footer-text">
            Sudah memiliki akun?{' '}
            <button
              type="button"
              className="ft-auth-link"
              onClick={() => setAuthView('login')}
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
