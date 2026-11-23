/**
 * LocalStorage management utilities for FinTrack
 * Handles per-user data isolation and demo account retention
 */
import type { Category, Transaction, UserProfile } from '../types/finance';
import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_PROFILE,
} from '../data/initialData';

export const DEMO_USER_ID = 'user-demo-1';

// Legacy keys for backward compatibility / initial migration of demo data
export const LEGACY_STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions_v1',
  CATEGORIES: 'fintrack_categories_v1',
  PROFILE: 'fintrack_user_profile_v1',
  HAS_INITIALIZED: 'fintrack_initialized_v1',
} as const;

export const getUserStorageKeys = (userId: string) => ({
  TRANSACTIONS: `fintrack_${userId}_transactions_v1`,
  CATEGORIES: `fintrack_${userId}_categories_v1`,
  PROFILE: `fintrack_${userId}_profile_v1`,
  HAS_INITIALIZED: `fintrack_${userId}_initialized_v1`,
});

/**
 * Safely load parsed JSON from localStorage with fallback
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Error loading key "${key}" from localStorage:`, error);
    return fallback;
  }
}

/**
 * Safely serialize and store value to localStorage
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}

/**
 * Load user transactions with per-user isolation:
 * - Demo user: loads demo data or previously saved demo transactions
 * - Registered user: loads only their own transactions, starts completely empty ([])
 */
export function loadUserTransactions(userId: string): Transaction[] {
  const keys = getUserStorageKeys(userId);
  const userRaw = localStorage.getItem(keys.TRANSACTIONS);
  if (userRaw) {
    try {
      return JSON.parse(userRaw) as Transaction[];
    } catch {
      return [];
    }
  }

  // If this is the demo user and no user-specific key exists yet, check legacy or default to INITIAL_TRANSACTIONS
  if (userId === DEMO_USER_ID) {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.TRANSACTIONS);
    if (legacyRaw) {
      try {
        const legacyData = JSON.parse(legacyRaw) as Transaction[];
        // Seed the user key
        saveToStorage(keys.TRANSACTIONS, legacyData);
        return legacyData;
      } catch {
        // Fallback below
      }
    }
    // Save demo initial data
    saveToStorage(keys.TRANSACTIONS, INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  }

  // Non-demo / newly registered users ALWAYS start with 0 transactions (Rp0)
  return [];
}

/**
 * Load user categories:
 * - Both demo and registered users have standard categories provided by default
 */
export function loadUserCategories(userId: string): Category[] {
  const keys = getUserStorageKeys(userId);
  const userRaw = localStorage.getItem(keys.CATEGORIES);
  if (userRaw) {
    try {
      return JSON.parse(userRaw) as Category[];
    } catch {
      return INITIAL_CATEGORIES;
    }
  }

  if (userId === DEMO_USER_ID) {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.CATEGORIES);
    if (legacyRaw) {
      try {
        const legacyCats = JSON.parse(legacyRaw) as Category[];
        saveToStorage(keys.CATEGORIES, legacyCats);
        return legacyCats;
      } catch {
        // Fallback below
      }
    }
  }

  // Default to standard initial categories for all users
  saveToStorage(keys.CATEGORIES, INITIAL_CATEGORIES);
  return INITIAL_CATEGORIES;
}

/**
 * Load user profile:
 * - Demo user: loads demo profile (Budi Santoso, initial budget, etc.)
 * - Registered user: creates clean profile with Rp0 budget, empty savings goal, and their registered name/email
 */
export function loadUserProfile(
  userId: string,
  defaultName?: string,
  defaultEmail?: string,
  defaultAvatar?: string
): UserProfile {
  const keys = getUserStorageKeys(userId);
  const userRaw = localStorage.getItem(keys.PROFILE);
  if (userRaw) {
    try {
      const parsed = JSON.parse(userRaw) as Partial<UserProfile>;
      return {
        name: parsed.name || defaultName || 'Pengguna FinTrack',
        email: parsed.email || defaultEmail || '',
        username: parsed.username || (parsed.email ? parsed.email.split('@')[0] : 'budisantoso'),
        monthlyBudget: typeof parsed.monthlyBudget === 'number' ? parsed.monthlyBudget : 0,
        savingsGoalName: parsed.savingsGoalName || '',
        savingsGoalAmount: typeof parsed.savingsGoalAmount === 'number' ? parsed.savingsGoalAmount : 0,
        avatar: parsed.avatar || (parsed.name ? parsed.name.slice(0, 2).toUpperCase() : 'BS'),
        currency: parsed.currency || 'IDR',
        currencySymbol: parsed.currencySymbol || 'Rp',
        dateFormat: parsed.dateFormat || 'D MMMM YYYY',
        theme: parsed.theme || 'light',
        language: parsed.language || 'id',
        financialPeriodStartDay: parsed.financialPeriodStartDay || 1,
        notifications: {
          transactionAlerts: parsed.notifications?.transactionAlerts ?? true,
          budgetWarning: parsed.notifications?.budgetWarning ?? true,
          savingsGoalAlert: parsed.notifications?.savingsGoalAlert ?? true,
          monthlySummary: parsed.notifications?.monthlySummary ?? true,
        },
      };
    } catch {
      // Continue to defaults
    }
  }

  if (userId === DEMO_USER_ID) {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEYS.PROFILE);
    if (legacyRaw) {
      try {
        const legacyProf = JSON.parse(legacyRaw) as Partial<UserProfile>;
        const mergedProf: UserProfile = {
          ...INITIAL_USER_PROFILE,
          ...legacyProf,
          notifications: {
            ...INITIAL_USER_PROFILE.notifications,
            ...(legacyProf.notifications || {}),
          },
        };
        saveToStorage(keys.PROFILE, mergedProf);
        return mergedProf;
      } catch {
        // Fallback below
      }
    }
    saveToStorage(keys.PROFILE, INITIAL_USER_PROFILE);
    return INITIAL_USER_PROFILE;
  }

  // For registered user: empty financial state (Rp0 budget, empty savings target)
  const cleanProfile: UserProfile = {
    name: defaultName || 'Pengguna FinTrack',
    email: defaultEmail || '',
    username: defaultEmail ? defaultEmail.split('@')[0] : 'user',
    monthlyBudget: 0,
    savingsGoalName: '',
    savingsGoalAmount: 0,
    avatar: defaultAvatar || (defaultName ? defaultName.slice(0, 2).toUpperCase() : 'U'),
    currency: 'IDR',
    currencySymbol: 'Rp',
    dateFormat: 'D MMMM YYYY',
    theme: 'light',
    language: 'id',
    financialPeriodStartDay: 1,
    notifications: {
      transactionAlerts: true,
      budgetWarning: true,
      savingsGoalAlert: true,
      monthlySummary: true,
    },
  };

  saveToStorage(keys.PROFILE, cleanProfile);
  return cleanProfile;
}

/**
 * Save user transactions scoped to their userId
 */
export function saveUserTransactions(userId: string, transactions: Transaction[]): boolean {
  const keys = getUserStorageKeys(userId);
  return saveToStorage(keys.TRANSACTIONS, transactions);
}

/**
 * Save user categories scoped to their userId
 */
export function saveUserCategories(userId: string, categories: Category[]): boolean {
  const keys = getUserStorageKeys(userId);
  return saveToStorage(keys.CATEGORIES, categories);
}

/**
 * Save user profile scoped to their userId
 */
export function saveUserProfile(userId: string, profile: UserProfile): boolean {
  const keys = getUserStorageKeys(userId);
  return saveToStorage(keys.PROFILE, profile);
}

/**
 * Clear data for a specific user ONLY.
 * Never touches or wipes other users' data!
 */
export function clearUserData(userId: string): void {
  const keys = getUserStorageKeys(userId);
  Object.values(keys).forEach((k) => removeFromStorage(k));
}
