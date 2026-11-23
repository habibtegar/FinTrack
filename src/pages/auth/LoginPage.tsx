import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { login, setAuthView, isLoading } = useAuth();

  const [email, setEmail] = useState(() => {
    return localStorage.getItem('fintrack_remember_email_v1') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setErrorMessage(null);

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

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const res = await login({
      email,
      password,
      rememberMe,
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
          <h2 className="ft-auth-title">Masuk ke Akun</h2>
          <p className="ft-auth-subtitle">
            Kelola dan pantau keuangan pribadi Anda secara rapi dan terencana.
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
          {/* Email Field */}
          <div className="ft-form-group">
            <label htmlFor="login-email" className="ft-label">
              Alamat Email <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Mail size={16} className="ft-input-icon" />
              <input
                id="login-email"
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

          {/* Password Field */}
          <div className="ft-form-group">
            <label htmlFor="login-password" className="ft-label">
              Kata Sandi <span className="ft-required">*</span>
            </label>
            <div className="ft-input-with-icon-wrap">
              <Lock size={16} className="ft-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className={`ft-input ft-input-icon-pad ft-input-password-pad ${
                  passwordError ? 'ft-input-error' : ''
                }`}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="current-password"
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

          {/* Remember Me Checkbox */}
          <div className="ft-auth-options-row">
            <label className="ft-checkbox-label">
              <input
                type="checkbox"
                className="ft-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ingat Saya</span>
            </label>
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
            Masuk
          </Button>
        </form>

        {/* Footer switch to Register */}
        <div className="ft-auth-footer">
          <p className="ft-auth-footer-text">
            Belum memiliki akun?{' '}
            <button
              type="button"
              className="ft-auth-link"
              onClick={() => setAuthView('register')}
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
