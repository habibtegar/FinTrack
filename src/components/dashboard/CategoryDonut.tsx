import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { calculateCategoryBreakdown } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { getCurrentMonthString } from '../../utils/formatters';

export const CategoryDonut: React.FC = () => {
  const { transactions, categories, userProfile, setCurrentTab } = useFinance();
  const currentMonth = getCurrentMonthString();

  // Breakdown for current month expenses
  const breakdown = calculateCategoryBreakdown(transactions, categories, 'expense', currentMonth);

  const totalExpense = breakdown.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const chartData = breakdown.map((item) => ({
    name: item.categoryName,
    value: item.totalAmount,
    color: item.categoryColor,
    percentage: item.percentage,
  }));

  const topCategories = breakdown.slice(0, 4);

  return (
    <Card
      title="Alokasi Pengeluaran"
      subtitle="Distribusi kategori bulan ini"
      action={
        <button
          type="button"
          className="ft-text-link-btn"
          onClick={() => setCurrentTab('analytics')}
        >
          Lihat Semua
        </button>
      }
      className="ft-category-donut-card"
    >
      {breakdown.length === 0 ? (
        <div className="ft-chart-empty">
          <p>Belum ada transaksi pengeluaran bulan ini.</p>
        </div>
      ) : (
        <div className="ft-donut-wrapper">
          <div className="ft-donut-chart-box">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value) || 0, userProfile.currencySymbol)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="ft-donut-center-text">
              <span className="ft-donut-center-sub">Total Keluar</span>
              <span className="ft-donut-center-val">
                {formatCurrency(totalExpense, userProfile.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="ft-donut-legend-list">
            {topCategories.map((item) => (
              <div key={item.categoryId} className="ft-donut-legend-row">
                <div className="ft-donut-legend-left">
                  <span
                    className="ft-donut-legend-icon-badge"
                    style={{ backgroundColor: `${item.categoryColor}15`, color: item.categoryColor }}
                  >
                    <CategoryIcon name={item.categoryIcon} size={13} />
                  </span>
                  <div className="ft-donut-legend-texts">
                    <span className="ft-donut-legend-name">{item.categoryName}</span>
                    <span className="ft-donut-legend-pct">{item.percentage}%</span>
                  </div>
                </div>
                <span className="ft-donut-legend-val">
                  {formatCurrency(item.totalAmount, userProfile.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
