import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Target, PiggyBank } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { formatCurrency, getCurrentMonthString } from '../../utils/formatters';

export const FinancialInsight: React.FC = () => {
  const { healthInsight, userProfile, transactions, setCurrentTab } = useFinance();
  const currentMonth = getCurrentMonthString();

  // Current month expenses
  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const hasBudget = Boolean(userProfile.monthlyBudget && userProfile.monthlyBudget > 0);
  const budget = userProfile.monthlyBudget || 0;
  const budgetUsagePercent = hasBudget && budget > 0 ? Math.min(100, Math.round((monthExpenses / budget) * 100)) : 0;
  const remainingBudget = hasBudget ? Math.max(0, budget - monthExpenses) : 0;

  const getStatusIcon = () => {
    if (transactions.length === 0) {
      return <ShieldCheck size={20} className="ft-insight-icon-healthy" />;
    }
    switch (healthInsight.status) {
      case 'healthy':
        return <ShieldCheck size={20} className="ft-insight-icon-healthy" />;
      case 'warning':
        return <AlertTriangle size={20} className="ft-insight-icon-warning" />;
      case 'danger':
        return <AlertOctagon size={20} className="ft-insight-icon-danger" />;
    }
  };

  const getStatusBadge = () => {
    if (transactions.length === 0) {
      return <span className="ft-status-pill ft-status-neutral">Belum Ada Transaksi</span>;
    }
    switch (healthInsight.status) {
      case 'healthy':
        return <span className="ft-status-pill ft-status-healthy">Arus Kas Sehat</span>;
      case 'warning':
        return <span className="ft-status-pill ft-status-warning">Perlu Waspada</span>;
      case 'danger':
        return <span className="ft-status-pill ft-status-danger">Defisit</span>;
    }
  };

  return (
    <Card
      title="Financial Insights"
      subtitle="Wawasan evaluasi kondisi finansial berdasarkan transaksi aktual Anda"
      action={getStatusBadge()}
      className="ft-insight-card"
    >
      <div className="ft-insight-body">
        <div className="ft-insight-header-box">
          <div className="ft-insight-icon-circle">{getStatusIcon()}</div>
          <div className="ft-insight-header-text">
            <h4 className="ft-insight-headline">{healthInsight.headline}</h4>
            <p className="ft-insight-desc">{healthInsight.detail}</p>
          </div>
        </div>

        {/* Budget Progress Meter */}
        <div className="ft-budget-meter-wrap">
          <div className="ft-budget-meter-header">
            <div className="ft-budget-meter-title">
              <Target size={14} />
              <span>Target Anggaran Bulanan</span>
            </div>
            <span className={`ft-budget-meter-pct ${!hasBudget ? 'ft-budget-meter-pct-empty' : ''}`}>
              {hasBudget ? `${budgetUsagePercent}% Terpakai` : 'Belum Tersedia'}
            </span>
          </div>

          <div className="ft-progress-bar-track">
            <div
              className={`ft-progress-bar-fill ${
                !hasBudget
                  ? 'empty'
                  : budgetUsagePercent > 90
                  ? 'danger'
                  : budgetUsagePercent > 70
                  ? 'warning'
                  : 'normal'
              }`}
              style={{ width: `${hasBudget ? budgetUsagePercent : 0}%` }}
            />
          </div>

          <div className="ft-budget-meter-footer">
            <span>
              Terpakai: {formatCurrency(monthExpenses, userProfile.currencySymbol)}
            </span>
            {hasBudget ? (
              <span>
                Sisa Batas: {formatCurrency(remainingBudget, userProfile.currencySymbol)}
              </span>
            ) : (
              <button
                type="button"
                className="ft-budget-set-link"
                onClick={() => setCurrentTab('settings')}
              >
                Atur Anggaran →
              </button>
            )}
          </div>
        </div>

        {/* Key Indicators */}
        <div className="ft-insight-indicators">
          <div className="ft-insight-ind-item">
            <div className="ft-insight-ind-icon">
              <PiggyBank size={16} />
            </div>
            <div>
              <span className="ft-insight-ind-val">{healthInsight.savingsRate}%</span>
              <span className="ft-insight-ind-label">Rasio Tabungan</span>
            </div>
          </div>

          <div className="ft-insight-ind-item">
            <div className="ft-insight-ind-icon">
              <Target size={16} />
            </div>
            <div>
              <span className="ft-insight-ind-val">{healthInsight.expenseRatio}%</span>
              <span className="ft-insight-ind-label">Rasio Pengeluaran</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
