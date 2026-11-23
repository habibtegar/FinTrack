import React from 'react';
import { Card } from '../common/Card';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import type { MonthComparison } from '../../types/finance';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Scale } from 'lucide-react';

interface MonthlyComparisonCardProps {
  comparison: MonthComparison;
}

export const MonthlyComparisonCard: React.FC<MonthlyComparisonCardProps> = ({ comparison }) => {
  const { userProfile } = useFinance();
  const currencySymbol = userProfile.currencySymbol || 'Rp';

  const { thisMonthName, lastMonthName, income, expense, netCashFlow } = comparison;

  return (
    <Card
      title="Perbandingan Antarbulan"
      subtitle={`Performa keuangan ${thisMonthName} dibandingkan dengan ${lastMonthName}`}
      className="ft-comparison-card"
    >
      <div className="ft-comparison-grid">
        {/* Kolom 1: Pemasukan */}
        <div className="ft-comparison-item">
          <div className="ft-comparison-header">
            <span className="ft-comparison-label">Pemasukan Bulan Ini</span>
            <div
              className={`ft-comparison-badge ${
                income.changePct > 0
                  ? 'positive'
                  : income.changePct < 0
                  ? 'negative'
                  : 'neutral'
              }`}
            >
              {income.changePct > 0 ? (
                <>
                  <ArrowUpRight size={14} />
                  <span>+{income.changePct}%</span>
                </>
              ) : income.changePct < 0 ? (
                <>
                  <ArrowDownRight size={14} />
                  <span>{income.changePct}%</span>
                </>
              ) : (
                <>
                  <Minus size={14} />
                  <span>0%</span>
                </>
              )}
            </div>
          </div>

          <div className="ft-comparison-amount-wrap">
            <span className="ft-comparison-current ft-income-text">
              {formatCurrency(income.current, currencySymbol)}
            </span>
            <span className="ft-comparison-prev">
              Lalu: {formatCurrency(income.previous, currencySymbol)}
            </span>
          </div>

          <div className="ft-comparison-footer">
            <span className="ft-comparison-diff">
              Selisih: {income.diff >= 0 ? '+' : ''}
              {formatCurrency(income.diff, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Kolom 2: Pengeluaran */}
        <div className="ft-comparison-item">
          <div className="ft-comparison-header">
            <span className="ft-comparison-label">Pengeluaran Bulan Ini</span>
            <div
              className={`ft-comparison-badge ${
                expense.changePct > 0
                  ? 'negative' // Expense increase is usually a warning
                  : expense.changePct < 0
                  ? 'positive' // Expense decrease is saving money
                  : 'neutral'
              }`}
            >
              {expense.changePct > 0 ? (
                <>
                  <TrendingUp size={14} />
                  <span>+{expense.changePct}%</span>
                </>
              ) : expense.changePct < 0 ? (
                <>
                  <TrendingDown size={14} />
                  <span>{expense.changePct}%</span>
                </>
              ) : (
                <>
                  <Minus size={14} />
                  <span>0%</span>
                </>
              )}
            </div>
          </div>

          <div className="ft-comparison-amount-wrap">
            <span className="ft-comparison-current ft-expense-text">
              {formatCurrency(expense.current, currencySymbol)}
            </span>
            <span className="ft-comparison-prev">
              Lalu: {formatCurrency(expense.previous, currencySymbol)}
            </span>
          </div>

          <div className="ft-comparison-footer">
            <span className="ft-comparison-diff">
              {expense.diff > 0
                ? `Naik ${formatCurrency(expense.diff, currencySymbol)}`
                : expense.diff < 0
                ? `Hemat ${formatCurrency(Math.abs(expense.diff), currencySymbol)}`
                : 'Sama dengan bulan lalu'}
            </span>
          </div>
        </div>

        {/* Kolom 3: Arus Kas Bersih (Net Cash Flow) */}
        <div className="ft-comparison-item">
          <div className="ft-comparison-header">
            <span className="ft-comparison-label">Arus Kas Bersih (Surplus)</span>
            <div
              className={`ft-comparison-badge ${
                netCashFlow.current > 0
                  ? 'positive'
                  : netCashFlow.current < 0
                  ? 'negative'
                  : 'neutral'
              }`}
            >
              <Scale size={14} />
              <span>{netCashFlow.current >= 0 ? 'Surplus' : 'Defisit'}</span>
            </div>
          </div>

          <div className="ft-comparison-amount-wrap">
            <span
              className={`ft-comparison-current ${
                netCashFlow.current >= 0 ? 'ft-primary-text' : 'ft-expense-text'
              }`}
            >
              {formatCurrency(netCashFlow.current, currencySymbol)}
            </span>
            <span className="ft-comparison-prev">
              Lalu: {formatCurrency(netCashFlow.previous, currencySymbol)}
            </span>
          </div>

          <div className="ft-comparison-footer">
            <span className="ft-comparison-diff">
              Perubahan: {netCashFlow.diff >= 0 ? '+' : ''}
              {formatCurrency(netCashFlow.diff, currencySymbol)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
