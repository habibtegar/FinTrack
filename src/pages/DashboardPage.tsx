import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { CategoryDonut } from '../components/dashboard/CategoryDonut';
import { FinancialInsight } from '../components/dashboard/FinancialInsight';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { SavingsGoalWidget } from '../components/dashboard/SavingsGoalWidget';
import { Button } from '../components/common/Button';
import { formatCurrency, getCurrentMonthString } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const {
    totals,
    userProfile,
    openAddTransactionModal,
    transactions,
    healthInsight,
  } = useFinance();

  const { user } = useAuth();
  const displayName = user?.name || userProfile.name;

  const currentMonth = getCurrentMonthString();
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="ft-page ft-dashboard-page">
      {/* Clean Professional Dashboard Header */}
      <div className="ft-page-header ft-dashboard-header">
        <div className="ft-dashboard-greeting-wrap">
          <h2 className="ft-page-title ft-greeting-title">
            Ringkasan Finansialmu, {displayName}!
          </h2>
          <p className="ft-page-subtitle ft-greeting-sub">
            Berikut ringkasan kondisi keuanganmu hari ini.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={openAddTransactionModal}
          className="ft-dashboard-add-btn"
        >
          Tambah Transaksi
        </Button>
      </div>

      {/* 4 Main Stat Cards */}
      <div className="ft-stats-grid">
        <StatCard
          title="Total Saldo Saat Ini"
          amount={formatCurrency(totals.balance, userProfile.currencySymbol)}
          subtitle={transactions.length === 0 ? 'Belum ada transaksi tercatat' : 'Akumulasi seluruh arus kas'}
          icon={<Wallet size={20} />}
          iconColor="#3478F6"
          iconBg="rgba(52, 120, 246, 0.12)"
          badgeText={totals.balance > 0 ? 'Surplus' : totals.balance < 0 ? 'Defisit' : 'Rp0'}
          badgeType={totals.balance > 0 ? 'positive' : totals.balance < 0 ? 'negative' : 'neutral'}
        />

        <StatCard
          title="Pemasukan Bulan Ini"
          amount={formatCurrency(monthIncome, userProfile.currencySymbol)}
          subtitle={`${currentMonthTxs.filter((t) => t.type === 'income').length} transaksi masuk`}
          icon={<TrendingUp size={20} />}
          iconColor="#10B981"
          iconBg="rgba(16, 185, 129, 0.12)"
          badgeText={monthIncome === 0 ? 'Belum Ada' : 'Bulan Berjalan'}
          badgeType={monthIncome === 0 ? 'neutral' : 'info'}
        />

        <StatCard
          title="Pengeluaran Bulan Ini"
          amount={formatCurrency(monthExpense, userProfile.currencySymbol)}
          subtitle={`${currentMonthTxs.filter((t) => t.type === 'expense').length} transaksi keluar`}
          icon={<TrendingDown size={20} />}
          iconColor="#EF4444"
          iconBg="rgba(239, 68, 68, 0.12)"
          badgeText={monthExpense === 0 ? 'Terkendali' : healthInsight.expenseRatio > 70 ? 'Waspada' : 'Terkontrol'}
          badgeType={monthExpense === 0 ? 'positive' : healthInsight.expenseRatio > 70 ? 'negative' : 'positive'}
        />

        <StatCard
          title="Rasio Tabungan"
          amount={monthIncome === 0 ? '0%' : `${healthInsight.savingsRate}%`}
          subtitle={monthIncome === 0 ? 'Belum ada arus kas bulan ini' : 'Persentase dana tersimpan'}
          icon={<PiggyBank size={20} />}
          iconColor="#8B5CF6"
          iconBg="rgba(139, 92, 246, 0.12)"
          badgeText={monthIncome === 0 ? 'Belum Ada' : healthInsight.savingsRate >= 20 ? 'Optimal' : 'Tingkatkan'}
          badgeType={monthIncome === 0 ? 'neutral' : healthInsight.savingsRate >= 20 ? 'positive' : 'neutral'}
        />
      </div>

      {/* Main Grid: Left Charts & Right Widgets */}
      <div className="ft-dashboard-main-grid">
        <div className="ft-grid-col-left">
          {/* Monthly / Dynamic Period Income & Expense Chart */}
          <MonthlyChart />

          {/* Recent 5 Transactions */}
          <RecentTransactions />
        </div>

        <div className="ft-grid-col-right">
          {/* Target Tabungan Widget connected to real app data */}
          <SavingsGoalWidget />

          {/* Financial Health Insight */}
          <FinancialInsight />

          {/* Category Donut Distribution */}
          <CategoryDonut />
        </div>
      </div>
    </div>
  );
};
