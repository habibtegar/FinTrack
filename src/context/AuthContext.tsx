import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  StoredUserAccount,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthView,
} from '../types/auth';
import { clearUserData } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => void;
  updateActiveUser: (partial: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<AuthResponse>;
  deleteAccount: () => Promise<AuthResponse>;
}

const STORAGE_KEYS = {
  USERS: 'fintrack_users_v1',
  CURRENT_USER: 'fintrack_current_user_v1',
  REMEMBER_EMAIL: 'fintrack_remember_email_v1',
};

const DEFAULT_DEMO_USERS: StoredUserAccount[] = [
  {
    id: 'user-demo-1',
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    username: 'budisantoso',
    passwordHash: 'password123',
    avatar: 'BS',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy state initialization prevents render cascading and flashes
  const [user, setUser] = useState<User | null>(() => {
    try {
      const sessionRaw =
        localStorage.getItem(STORAGE_KEYS.CURRENT_USER) ||
        sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return sessionRaw ? JSON.parse(sessionRaw) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sessionRaw =
        localStorage.getItem(STORAGE_KEYS.CURRENT_USER) ||
        sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return Boolean(sessionRaw);
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authView, setAuthView] = useState<AuthView>('login');

  // Ensure demo users exist in localStorage
  useEffect(() => {
    try {
      const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!storedUsersRaw) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_DEMO_USERS));
      }
    } catch (err) {
      console.error('Error ensuring demo users exist:', err);
    }
  }, []);

  const getUsers = (): StoredUserAccount[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USERS);
      return raw ? JSON.parse(raw) : DEFAULT_DEMO_USERS;
    } catch {
      return DEFAULT_DEMO_USERS;
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 400));

    try {
      const users = getUsers();
      const normalizedEmail = credentials.email.trim().toLowerCase();
      const found = users.find(
        (u) => u.email.toLowerCase() === normalizedEmail && u.passwordHash === credentials.password
      );

      if (!found) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali.',
        };
      }

      const activeUser: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        username: found.username || found.email.split('@')[0],
        avatar: found.avatar || found.name.slice(0, 2).toUpperCase(),
        createdAt: found.createdAt,
      };

      setUser(activeUser);
      setIsAuthenticated(true);

      // Handle session persistence based on "Remember Me"
      if (credentials.rememberMe) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(activeUser));
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, normalizedEmail);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(activeUser));
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
      }

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return {
        success: false,
        error: 'Terjadi kesalahan sistem saat proses masuk.',
      };
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 400));

    try {
      const users = getUsers();
      const normalizedEmail = credentials.email.trim().toLowerCase();

      // Check if email already exists
      const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
      if (exists) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.',
        };
      }

      const generatedUsername =
        credentials.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
        normalizedEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');

      const newUser: StoredUserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: credentials.name.trim(),
        email: normalizedEmail,
        username: generatedUsername || 'user',
        passwordHash: credentials.password,
        avatar: credentials.name.trim().slice(0, 2).toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

      // Automatically log the new user in
      const activeUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
      };

      setUser(activeUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(activeUser));

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return {
        success: false,
        error: 'Terjadi kesalahan saat pendaftaran akun.',
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setAuthView('login');
  }, []);

  const updateActiveUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      } else if (sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      }
      try {
        const users = getUsers();
        const updatedUsers = users.map((u) =>
          u.id === prev.id ? { ...u, ...partial } : u
        );
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      } catch (err) {
        console.error('Failed to update user in storage:', err);
      }
      return updated;
    });
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<AuthResponse> => {
      setIsLoading(true);
      await new Promise((res) => setTimeout(res, 300));
      try {
        if (!user) {
          setIsLoading(false);
          return { success: false, error: 'Tidak ada sesi pengguna aktif.' };
        }
        if (newPassword.length < 6) {
          setIsLoading(false);
          return { success: false, error: 'Kata sandi baru minimal 6 karakter.' };
        }
        const users = getUsers();
        const userIndex = users.findIndex((u) => u.id === user.id);
        if (userIndex === -1) {
          setIsLoading(false);
          return { success: false, error: 'Akun tidak ditemukan di sistem.' };
        }
        if (users[userIndex].passwordHash !== oldPassword) {
          setIsLoading(false);
          return { success: false, error: 'Kata sandi saat ini tidak sesuai.' };
        }
        users[userIndex].passwordHash = newPassword;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        setIsLoading(false);
        return { success: true };
      } catch {
        setIsLoading(false);
        return { success: false, error: 'Gagal memperbarui kata sandi.' };
      }
    },
    [user]
  );

  const deleteAccount = useCallback(async (): Promise<AuthResponse> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 350));
    try {
      if (!user) {
        setIsLoading(false);
        return { success: false, error: 'Tidak ada sesi pengguna aktif.' };
      }
      const currentUserId = user.id;
      // 1. Clear financial data for this user
      clearUserData(currentUserId);
      // 2. Remove user from USERS list
      const users = getUsers();
      const updatedUsers = users.filter((u) => u.id !== currentUserId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      // 3. Logout
      logout();
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Gagal menghapus akun pengguna.' };
    }
  }, [user, logout]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authView,
    setAuthView,
    login,
    register,
    logout,
    updateActiveUser,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
