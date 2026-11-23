import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { calculateCategoryBreakdown } from '../../utils/calculations';
import { formatCurrency, MONTH_NAMES_ID } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import type { TransactionType } from '../../types/finance';

export const CategoryBreakdownTable: React.FC = () => {
  const { transactions, categories, userProfile } = useFinance();
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Unique months from transactions
  const uniqueMonths = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const breakdown = calculateCategoryBreakdown(
    transactions,
    categories,
    selectedType,
    selectedMonth
  );

  const totalTypeAmount = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <Card
      title={`Rincian Alokasi Berdasarkan Kategori`}
      subtitle={`Daftar proporsi nominal dan persentase transaksi`}
      action={
        <div className="ft-breakdown-filters">
          <div className="ft-type-pills">
            <button
              type="button"
              className={`ft-pill-btn ${selectedType === 'expense' ? 'active' : ''}`}
              onClick={() => setSelectedType('expense')}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={`ft-pill-btn ft-pill-income ${selectedType === 'income' ? 'active' : ''}`}
              onClick={() => setSelectedType('income')}
            >
              Pemasukan
            </button>
          </div>

          <select
            className="ft-mini-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="all">Semua Periode</option>
            {uniqueMonths.map((ym) => {
              const [y, m] = ym.split('-');
              const monthName = MONTH_NAMES_ID[parseInt(m, 10) - 1];
              return (
                <option key={ym} value={ym}>
                  {monthName} {y}
                </option>
              );
            })}
          </select>
        </div>
      }
      className="ft-breakdown-card"
    >
      {breakdown.length === 0 ? (
        <div className="ft-empty-mini">
          <p>Belum ada data transaksi untuk filter ini.</p>
        </div>
      ) : (
        <div className="ft-breakdown-list">
          {breakdown.map((item) => (
            <div key={item.categoryId} className="ft-breakdown-row">
              <div className="ft-breakdown-left">
                <div
                  className="ft-breakdown-icon"
                  style={{
                    backgroundColor: `${item.categoryColor}15`,
                    color: item.categoryColor,
                  }}
                >
                  <CategoryIcon name={item.categoryIcon} size={18} />
                </div>
                <div className="ft-breakdown-info">
                  <div className="ft-breakdown-title-row">
                    <span className="ft-breakdown-name">{item.categoryName}</span>
                    <span className="ft-breakdown-count">
                      {item.transactionCount} transaksi
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="ft-breakdown-progress-track">
                    <div
                      className="ft-breakdown-progress-fill"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.categoryColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="ft-breakdown-right">
                <span className="ft-breakdown-amount">
                  {formatCurrency(item.totalAmount, userProfile.currencySymbol)}
                </span>
                <span className="ft-breakdown-pct">{item.percentage}%</span>
              </div>
            </div>
          ))}

          {/* Total summary row */}
          <div className="ft-breakdown-total-footer">
            <span className="ft-breakdown-total-label">
              Total {selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'}:
            </span>
            <span className="ft-breakdown-total-val">
              {formatCurrency(totalTypeAmount, userProfile.currencySymbol)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
