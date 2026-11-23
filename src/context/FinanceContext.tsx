import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Transaction,
  Category,
  UserProfile,
  NavigationTab,
  ToastNotification,
  TransactionFilterOptions,
  MonthlySummary,
  FinancialHealthInsight,
} from '../types/finance';
import {
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_PROFILE,
} from '../data/initialData';
import {
  DEMO_USER_ID,
  loadUserTransactions,
  loadUserCategories,
  loadUserProfile,
  saveUserTransactions,
  saveUserCategories,
  saveUserProfile,
  clearUserData,
} from '../utils/storage';
import { useAuth } from './AuthContext';
import {
  calculateTotals,
  calculateMonthlySummaries,
  calculateFinancialHealth,
  filterAndSortTransactions,
} from '../utils/calculations';

interface FinanceContextType {
  // Data
  transactions: Transaction[];
  categories: Category[];
  userProfile: UserProfile;
  currentTab: NavigationTab;
  isMobileSidebarOpen: boolean;
  filterOptions: TransactionFilterOptions;
  toasts: ToastNotification[];

  // Modal State
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;

  // Derived Calculations
  totals: { income: number; expense: number; balance: number };
  monthlySummaries: MonthlySummary[];
  healthInsight: FinancialHealthInsight;
  filteredTransactions: Transaction[];

  // Actions
  setCurrentTab: (tab: NavigationTab) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  openAddTransactionModal: () => void;
  openEditTransactionModal: (tx: Transaction) => void;
  closeTransactionModal: () => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, reassignToId?: string) => { success: boolean; message: string };

  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setFilterOptions: (options: Partial<TransactionFilterOptions>) => void;
  resetFilterOptions: () => void;

  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDataToJson: () => string;
  importDataFromJson: (jsonStr: string) => boolean;
  exportTransactionsToCsv: () => void;

  addToast: (title: string, message?: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_FILTERS: TransactionFilterOptions = {
  search: '',
  type: 'all',
  categoryId: 'all',
  month: 'all',
  sortBy: 'date-desc',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || DEMO_USER_ID;

  // Initialize state scoped to current user
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return loadUserTransactions(userId);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return loadUserCategories(userId);
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return loadUserProfile(userId, user?.name, user?.email, user?.avatar);
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterOptions, setFilterOptionsState] = useState<TransactionFilterOptions>(DEFAULT_FILTERS);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Synchronize state with per-user LocalStorage
  useEffect(() => {
    saveUserTransactions(userId, transactions);
  }, [userId, transactions]);

  useEffect(() => {
    saveUserCategories(userId, categories);
  }, [userId, categories]);

  useEffect(() => {
    saveUserProfile(userId, userProfile);
  }, [userId, userProfile]);

  // Synchronize document theme with user preference
  useEffect(() => {
    const theme = userProfile.theme || 'light';
    const applyTheme = (isDark: boolean) => {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [userProfile.theme]);

  // Toast Helpers
  const addToast = useCallback((title: string, message?: string, type: ToastNotification['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotification = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modal Handlers
  const openAddTransactionModal = useCallback(() => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  }, []);

  const openEditTransactionModal = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // Transaction CRUD
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
      const newTransaction: Transaction = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      addToast('Transaksi Ditambahkan', `${tx.title} berhasil dicatat.`);
    },
    [addToast]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      addToast('Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan.');
    },
    [addToast]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((item) => item.id !== id));
      addToast('Transaksi Dihapus', 'Data transaksi telah dihapus.', 'info');
    },
    [addToast]
  );

  // Category CRUD
  const addCategory = useCallback(
    (category: Omit<Category, 'id'>) => {
      const newCategory: Category = {
        ...category,
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        isDefault: false,
      };
      setCategories((prev) => [...prev, newCategory]);
      addToast('Kategori Ditambahkan', `Kategori "${category.name}" siap digunakan.`);
    },
    [addToast]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Category>) => {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
      );
      addToast('Kategori Diperbarui', 'Perubahan kategori berhasil disimpan.');
    },
    [addToast]
  );

  const deleteCategory = useCallback(
    (id: string, reassignToId?: string): { success: boolean; message: string } => {
      // Check if transactions exist with this category
      const linkedTxs = transactions.filter((t) => t.categoryId === id);
      const count = linkedTxs.length;

      if (count > 0) {
        if (!reassignToId) {
          addToast(
            'Kategori Masih Digunakan',
            `Masih ada ${count} transaksi yang menggunakan kategori ini. Silakan pilih kategori pengganti terlebih dahulu.`,
            'warning'
          );
          return {
            success: false,
            message: `Masih ada ${count} transaksi dengan kategori ini.`,
          };
        }

        // Safely reassign all linked transactions to the replacement category
        setTransactions((prev) =>
          prev.map((t) => (t.categoryId === id ? { ...t, categoryId: reassignToId } : t))
        );
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      addToast(
        'Kategori Dihapus',
        count > 0
          ? `Kategori berhasil dihapus dan ${count} transaksi telah dialihkan ke kategori baru.`
          : 'Kategori berhasil dihapus.',
        'info'
      );
      return { success: true, message: 'Kategori berhasil dihapus.' };
    },
    [transactions, addToast]
  );

  // User Profile
  const updateUserProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUserProfile((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Filters
  const setFilterOptions = useCallback((options: Partial<TransactionFilterOptions>) => {
    setFilterOptionsState((prev) => ({ ...prev, ...options }));
  }, []);

  const resetFilterOptions = useCallback(() => {
    setFilterOptionsState(DEFAULT_FILTERS);
  }, []);

  // Reset / Backup Data
  const resetToDemoData = useCallback(() => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setUserProfile(INITIAL_USER_PROFILE);
    saveUserTransactions(userId, INITIAL_TRANSACTIONS);
    saveUserCategories(userId, INITIAL_CATEGORIES);
    saveUserProfile(userId, INITIAL_USER_PROFILE);
    addToast('Data Demo Dimuat', 'Semua data sampel default telah dipulihkan ke akun ini.');
  }, [userId, addToast]);

  const clearAllData = useCallback(() => {
    clearUserData(userId);
    setTransactions([]);
    setCategories(INITIAL_CATEGORIES);
    const cleanProfile: UserProfile = {
      name: user?.name || 'Pengguna',
      email: user?.email || '',
      username: user?.username || 'user',
      monthlyBudget: 0,
      savingsGoalName: '',
      savingsGoalAmount: 0,
      avatar: user?.avatar || 'U',
      currency: userProfile.currency || 'IDR',
      currencySymbol: userProfile.currencySymbol || 'Rp',
      dateFormat: userProfile.dateFormat || 'D MMMM YYYY',
      theme: userProfile.theme || 'light',
      language: userProfile.language || 'id',
      financialPeriodStartDay: userProfile.financialPeriodStartDay || 1,
      notifications: userProfile.notifications || {
        transactionAlerts: true,
        budgetWarning: true,
        savingsGoalAlert: true,
        monthlySummary: true,
      },
    };
    setUserProfile(cleanProfile);
    addToast('Data Dikosongkan', 'Seluruh transaksi akun Anda telah dibersihkan.', 'warning');
  }, [userId, user, userProfile, addToast]);

  const exportDataToJson = useCallback((): string => {
    const exportObject = {
      app: 'FinTrack',
      version: '1.0',
      userId,
      exportedAt: new Date().toISOString(),
      userProfile,
      categories,
      transactions,
    };
    return JSON.stringify(exportObject, null, 2);
  }, [userId, userProfile, categories, transactions]);

  const importDataFromJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error('Format JSON transaksi tidak valid');
        }

        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCategories(parsed.categories);
        }
        if (parsed.userProfile && typeof parsed.userProfile === 'object') {
          setUserProfile(parsed.userProfile);
        }
        setTransactions(parsed.transactions);

        addToast('Impor Berhasil', `${parsed.transactions.length} transaksi berhasil dimuat!`);
        return true;
      } catch (err) {
        console.error('Import error:', err);
        addToast('Gagal Mengimpor Data', 'File JSON tidak valid atau struktur tidak cocok.', 'error');
        return false;
      }
    },
    [addToast]
  );

  const exportTransactionsToCsv = useCallback(() => {
    try {
      if (transactions.length === 0) {
        addToast('Data Kosong', 'Tidak ada transaksi untuk diekspor ke CSV.', 'warning');
        return;
      }

      const headers = ['ID', 'Tanggal', 'Judul', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
      const rows = transactions.map((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catName = cat ? cat.name : 'Kategori Dihapus';
        const typeStr = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const notesStr = tx.notes ? tx.notes.replace(/"/g, '""') : '';
        const titleStr = tx.title.replace(/"/g, '""');

        return [
          `"${tx.id}"`,
          `"${tx.date}"`,
          `"${titleStr}"`,
          `"${typeStr}"`,
          `"${catName}"`,
          tx.amount,
          `"${notesStr}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fintrack-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Ekspor CSV Berhasil', `${transactions.length} transaksi berhasil diekspor.`);
    } catch {
      addToast('Gagal Ekspor CSV', 'Terjadi kesalahan saat mengekspor data ke CSV.', 'error');
    }
  }, [transactions, categories, addToast]);

  // Derived Calculations
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);
  const monthlySummaries = useMemo(() => calculateMonthlySummaries(transactions), [transactions]);
  const healthInsight = useMemo(
    () => calculateFinancialHealth(transactions, userProfile.monthlyBudget),
    [transactions, userProfile.monthlyBudget]
  );
  const filteredTransactions = useMemo(
    () => filterAndSortTransactions(transactions, categories, filterOptions),
    [transactions, categories, filterOptions]
  );

  const value = {
    transactions,
    categories,
    userProfile,
    currentTab,
    isMobileSidebarOpen,
    filterOptions,
    toasts,
    isTransactionModalOpen,
    editingTransaction,
    totals,
    monthlySummaries,
    healthInsight,
    filteredTransactions,
    setCurrentTab,
    setIsMobileSidebarOpen,
    openAddTransactionModal,
    openEditTransactionModal,
    closeTransactionModal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    updateUserProfile,
    setFilterOptions,
    resetFilterOptions,
    resetToDemoData,
    clearAllData,
    exportDataToJson,
    importDataFromJson,
    exportTransactionsToCsv,
    addToast,
    removeToast,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
