export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  createdAt: string;
}

export interface StoredUserAccount extends User {
  passwordHash: string; // Stored password in prototype storage
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export type AuthView = 'login' | 'register';
