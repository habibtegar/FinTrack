import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  PiggyBank,
  Download,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { StatCard } from '../components/dashboard/StatCard';
import { MonthlyComparisonCard } from '../components/analytics/MonthlyComparisonCard';
import { MonthlyTrendChart } from '../components/analytics/MonthlyTrendChart';
import { ExpenseDonutChart } from '../components/analytics/ExpenseDonutChart';
import { CategoryBreakdownTable } from '../components/analytics/CategoryBreakdownTable';
import { Button } from '../components/common/Button';
import {
  filterTransactionsByPeriod,
  calculateTotals,
  calculateCategoryBreakdown,
  calculateMonthOverMonthComparison,
} from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import type { AnalyticsPeriod } from '../types/finance';

const PERIOD_OPTIONS: Array<{ id: AnalyticsPeriod; label: string }> = [
  { id: 'all', label: 'Semua Waktu' },
  { id: 'this_month', label: 'Bulan Ini' },
  { id: 'last_month', label: 'Bulan Lalu' },
  { id: '6m', label: '6 Bulan Terakhir' },
  { id: '1y', label: '1 Tahun Terakhir' },
];

export const AnalyticsPage: React.FC = () => {
  const { transactions, categories, userProfile, monthlySummaries, addToast } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('all');

  const currencySymbol = userProfile.currencySymbol || 'Rp';

  // Filter transactions according to selected period
  const filteredTxs = useMemo(() => {
    return filterTransactionsByPeriod(transactions, selectedPeriod);
  }, [transactions, selectedPeriod]);

  // Derived totals for the selected period
  const periodTotals = useMemo(() => {
    return calculateTotals(filteredTxs);
  }, [filteredTxs]);

  // Savings rate for selected period
  const savingsRate = useMemo(() => {
    if (periodTotals.income <= 0) return 0;
    const net = periodTotals.income - periodTotals.expense;
    return Math.max(0, Math.round((net / periodTotals.income) * 100));
  }, [periodTotals]);

  // Expense category breakdown for selected period
  const expenseBreakdown = useMemo(() => {
    return calculateCategoryBreakdown(filteredTxs, categories, 'expense');
  }, [filteredTxs, categories]);

  // Month-over-month comparison
  const monthComparison = useMemo(() => {
    return calculateMonthOverMonthComparison(transactions);
  }, [transactions]);

  // Selected period human-readable label
  const activePeriodOption = PERIOD_OPTIONS.find((p) => p.id === selectedPeriod);
  const periodLabel = activePeriodOption ? activePeriodOption.label : 'Semua Waktu';

  // Export report to CSV based on filtered period
  const handleExportPeriodCsv = () => {
    try {
      if (filteredTxs.length === 0) {
        addToast('Data Kosong', 'Tidak ada data transaksi untuk diekspor pada periode ini.', 'warning');
        return;
      }

      const headers = ['ID', 'Tanggal', 'Judul', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
      const rows = filteredTxs.map((tx) => {
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
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `fintrack-laporan-${selectedPeriod}-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(
        'Laporan Berhasil Diekspor',
        `${filteredTxs.length} transaksi periode ${periodLabel} berhasil diekspor ke CSV.`
      );
    } catch {
      addToast('Gagal Ekspor Laporan', 'Terjadi kesalahan saat membuat file CSV.', 'error');
    }
  };

  return (
    <div className="ft-page ft-analytics-page">
      {/* Page Header with Period Filter & CSV Export */}
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">Statistik & Analisis Keuangan</h2>
          <p className="ft-page-subtitle">
            Pelajari pola arus kas, perbandingan performa antarbulan, dan distribusi belanja Anda.
          </p>
        </div>

        <div className="ft-analytics-header-actions">
          {/* Period Filter Dropdown / Pill */}
          <div className="ft-period-selector-wrap">
            <Calendar size={15} className="ft-period-icon" />
            <select
              className="ft-period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as AnalyticsPeriod)}
              aria-label="Filter Periode Analisis"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Report to CSV */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={15} />}
            onClick={handleExportPeriodCsv}
          >
            Ekspor Laporan (CSV)
          </Button>
        </div>
      </div>

      {/* 4 Dynamic Stat Cards for Selected Period */}
      <div className="ft-stats-grid">
        <StatCard
          title="Total Pemasukan"
          amount={formatCurrency(periodTotals.income, currencySymbol)}
          subtitle={`Total arus kas masuk (${periodLabel})`}
          icon={<TrendingUp size={20} />}
          iconColor="#10B981"
          iconBg="rgba(16, 185, 129, 0.12)"
          badgeText={periodTotals.income > 0 ? 'Pemasukan' : 'Rp0'}
          badgeType={periodTotals.income > 0 ? 'positive' : 'neutral'}
        />

        <StatCard
          title="Total Pengeluaran"
          amount={formatCurrency(periodTotals.expense, currencySymbol)}
          subtitle={`Total belanja terpakai (${periodLabel})`}
          icon={<TrendingDown size={20} />}
          iconColor="#EF4444"
          iconBg="rgba(239, 68, 68, 0.12)"
          badgeText={periodTotals.expense > 0 ? 'Pengeluaran' : 'Rp0'}
          badgeType={periodTotals.expense > 0 ? 'negative' : 'neutral'}
        />

        <StatCard
          title="Arus Kas Bersih (Net)"
          amount={formatCurrency(periodTotals.balance, currencySymbol)}
          subtitle={
            periodTotals.balance >= 0
              ? `Surplus kas (${periodLabel})`
              : `Defisit kas (${periodLabel})`
          }
          icon={<Scale size={20} />}
          iconColor="#3478F6"
          iconBg="rgba(52, 120, 246, 0.12)"
          badgeText={periodTotals.balance >= 0 ? 'Surplus' : 'Defisit'}
          badgeType={periodTotals.balance >= 0 ? 'positive' : 'negative'}
        />

        <StatCard
          title="Rasio Tabungan Tersimpan"
          amount={`${savingsRate}%`}
          subtitle={
            periodTotals.income > 0
              ? 'Tersisihkan dari pemasukan'
              : 'Belum ada pemasukan tercatat'
          }
          icon={<PiggyBank size={20} />}
          iconColor="#8B5CF6"
          iconBg="rgba(139, 92, 246, 0.12)"
          badgeText={savingsRate >= 25 ? 'Sehat' : savingsRate > 0 ? 'Cukup' : '0%'}
          badgeType={savingsRate >= 25 ? 'positive' : savingsRate > 0 ? 'info' : 'neutral'}
        />
      </div>

      {/* 1. Perbandingan Antarbulan */}
      <MonthlyComparisonCard comparison={monthComparison} />

      {/* 2. Tren Keuangan Bulanan */}
      <MonthlyTrendChart monthlySummaries={monthlySummaries} />

      {/* 3. Distribusi Pengeluaran (Diagram Donat) */}
      <ExpenseDonutChart breakdown={expenseBreakdown} periodLabel={periodLabel} />

      {/* 4. Tabel Rincian Alokasi Berdasarkan Kategori */}
      <CategoryBreakdownTable />
    </div>
  );
};
