import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { CategoryIcon } from '../common/CategoryIcon';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import type { CategorySummary } from '../../types/finance';
import { PieChart as PieIcon, ShoppingBag } from 'lucide-react';

interface ExpenseDonutChartProps {
  breakdown: CategorySummary[];
  periodLabel: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      percentage: number;
      color: string;
    };
  }>;
  currencySymbol: string;
}

const CustomDonutTooltip: React.FC<CustomTooltipProps> = ({ active, payload, currencySymbol }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="ft-chart-tooltip">
        <p className="ft-chart-tooltip-label">{data.name}</p>
        <div className="ft-chart-tooltip-list">
          <div className="ft-chart-tooltip-item">
            <span
              className="ft-chart-tooltip-dot"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="ft-chart-tooltip-value">
              {formatCurrency(data.value, currencySymbol)} ({data.payload.percentage}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  breakdown,
  periodLabel,
}) => {
  const { userProfile, openAddTransactionModal } = useFinance();
  const currencySymbol = userProfile.currencySymbol || 'Rp';

  const totalExpense = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

  if (breakdown.length === 0 || totalExpense === 0) {
    return (
      <Card
        title="Distribusi Pengeluaran"
        subtitle={`Proporsi belanja berdasarkan kategori (${periodLabel})`}
        className="ft-donut-card"
      >
        <EmptyState
          icon={<PieIcon size={40} className="ft-empty-icon-svg" />}
          title="Belum Ada Pengeluaran"
          description={`Belum ada transaksi belanja yang tercatat untuk periode ${periodLabel}.`}
          actionText="Tambah Pengeluaran"
          onAction={openAddTransactionModal}
          className="ft-chart-empty-state"
        />
      </Card>
    );
  }

  const chartData = breakdown.map((item) => ({
    name: item.categoryName,
    value: item.totalAmount,
    color: item.categoryColor,
    percentage: item.percentage,
  }));

  return (
    <Card
      title="Distribusi Pengeluaran"
      subtitle={`Diagram donat proporsi alokasi belanja kategori (${periodLabel})`}
      className="ft-donut-card"
    >
      <div className="ft-donut-content-grid">
        {/* Kolom Kiri: Diagram Donut Recharts */}
        <div className="ft-donut-chart-wrapper">
          <div style={{ width: '100%', height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomDonutTooltip currencySymbol={currencySymbol} />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="var(--ft-bg-surface)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Total Belanja di Tengah Donat */}
            <div className="ft-donut-center-label">
              <span className="ft-donut-center-sub">Total Belanja</span>
              <span className="ft-donut-center-val">
                {formatCurrency(totalExpense, currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Kategori Pengeluaran */}
        <div className="ft-donut-legend-list">
          <div className="ft-donut-legend-header">
            <span className="ft-donut-legend-title">
              <ShoppingBag size={15} /> Kategori Pengeluaran ({breakdown.length})
            </span>
            <span className="ft-donut-legend-sub">Alokasi & Nominal</span>
          </div>

          <div className="ft-donut-legend-items">
            {breakdown.map((cat) => (
              <div key={cat.categoryId} className="ft-donut-legend-item">
                <div className="ft-donut-item-left">
                  <div
                    className="ft-donut-item-icon-box"
                    style={{
                      backgroundColor: `${cat.categoryColor}18`,
                      color: cat.categoryColor,
                    }}
                  >
                    <CategoryIcon name={cat.categoryIcon} size={15} />
                  </div>
                  <div className="ft-donut-item-meta">
                    <span className="ft-donut-item-name">{cat.categoryName}</span>
                    <span className="ft-donut-item-txcount">
                      {cat.transactionCount} transaksi
                    </span>
                  </div>
                </div>

                <div className="ft-donut-item-right">
                  <span className="ft-donut-item-amount">
                    {formatCurrency(cat.totalAmount, currencySymbol)}
                  </span>
                  <span
                    className="ft-donut-item-pct-badge"
                    style={{
                      backgroundColor: `${cat.categoryColor}15`,
                      color: cat.categoryColor,
                    }}
                  >
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
