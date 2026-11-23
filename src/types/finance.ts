export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string; // ISO date string: YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  transactionAlerts: boolean;
  budgetWarning: boolean;
  savingsGoalAlert: boolean;
  monthlySummary: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  username?: string;
  monthlyBudget: number;
  savingsGoalName?: string;
  savingsGoalAmount?: number;
  avatar: string;
  currency: string;
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'D MMMM YYYY' | 'D MMM YYYY';
  theme: 'light' | 'dark' | 'system';
  language: 'id' | 'en';
  financialPeriodStartDay: number;
  notifications: NotificationPreferences;
}

export type ChartPeriod = '7d' | '30d' | '6m' | '1y';

export interface PeriodSummary {
  key: string;
  label: string;
  fullLabel?: string;
  income: number;
  expense: number;
  balance: number;
}

export interface MonthlySummary {
  key: string; // e.g. "2026-11"
  label: string; // e.g. "Nov 2026"
  monthName: string; // e.g. "November"
  year: number;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  type: TransactionType;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface TransactionFilterOptions {
  search: string;
  type: 'all' | 'income' | 'expense';
  categoryId: string;
  month: string; // "all" or "YYYY-MM"
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export type NavigationTab = 'dashboard' | 'transactions' | 'categories' | 'analytics' | 'settings';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface FinancialHealthInsight {
  status: 'healthy' | 'warning' | 'danger';
  headline: string;
  detail: string;
  savingsRate: number;
  expenseRatio: number;
  recommendedBudget: number;
}

export type AnalyticsPeriod = 'all' | 'this_month' | 'last_month' | '6m' | '1y';

export interface MonthMetricComparison {
  current: number;
  previous: number;
  diff: number;
  changePct: number;
  isIncrease: boolean;
}

export interface MonthComparison {
  hasData: boolean;
  thisMonthKey: string;
  thisMonthName: string;
  lastMonthKey: string;
  lastMonthName: string;
  income: MonthMetricComparison;
  expense: MonthMetricComparison;
  netCashFlow: {
    current: number;
    previous: number;
    diff: number;
    isPositive: boolean;
  };
}

export interface FinancialInsightItem {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'neutral';
  title: string;
  headline: string;
  detail: string;
  badge?: string;
}
