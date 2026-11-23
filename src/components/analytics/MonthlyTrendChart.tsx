import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import type { MonthlySummary } from '../../types/finance';
import { BarChart2, TrendingUp, Layers } from 'lucide-react';

interface MonthlyTrendChartProps {
  monthlySummaries: MonthlySummary[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  currencySymbol: string;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currencySymbol,
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="ft-chart-tooltip">
        <p className="ft-chart-tooltip-label">{label}</p>
        <div className="ft-chart-tooltip-list">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="ft-chart-tooltip-item">
              <span
                className="ft-chart-tooltip-dot"
                style={{ backgroundColor: entry.color }}
              />
              <span className="ft-chart-tooltip-name">{entry.name}:</span>
              <span className="ft-chart-tooltip-value">
                {formatCurrency(entry.value, currencySymbol)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ monthlySummaries }) => {
  const { userProfile, openAddTransactionModal } = useFinance();
  const [chartMode, setChartMode] = useState<'composed' | 'bar' | 'cashflow'>('composed');

  const currencySymbol = userProfile.currencySymbol || 'Rp';

  // Check if all months have 0 transactions
  const hasData = monthlySummaries.some((m) => m.income > 0 || m.expense > 0);

  if (!hasData) {
    return (
      <Card
        title="Tren Keuangan Bulanan"
        subtitle="Visualisasi pergerakan pemasukan, pengeluaran, dan arus kas bersih"
        className="ft-trend-chart-card"
      >
        <EmptyState
          icon={<BarChart2 size={40} className="ft-empty-icon-svg" />}
          title="Belum Ada Riwayat Keuangan Bulanan"
          description="Grafik tren bulanan akan terbentuk secara otomatis setelah Anda mulai mencatat pemasukan dan pengeluaran."
          actionText="Tambah Transaksi"
          onAction={openAddTransactionModal}
          className="ft-chart-empty-state"
        />
      </Card>
    );
  }

  const chartData = monthlySummaries.map((item) => ({
    name: item.label,
    fullLabel: `${item.monthName} ${item.year}`,
    Pemasukan: item.income,
    Pengeluaran: item.expense,
    'Saldo Bersih': item.balance,
  }));

  return (
    <Card
      title="Tren Keuangan Bulanan"
      subtitle="Visualisasi tren pemasukan, pengeluaran, dan arus kas bersih antarbulan"
      action={
        <div className="ft-analytics-view-switch">
          <button
            type="button"
            className={`ft-chart-toggle-btn ${chartMode === 'composed' ? 'active' : ''}`}
            onClick={() => setChartMode('composed')}
          >
            <Layers size={14} />
            <span>Tren Gabungan</span>
          </button>
          <button
            type="button"
            className={`ft-chart-toggle-btn ${chartMode === 'bar' ? 'active' : ''}`}
            onClick={() => setChartMode('bar')}
          >
            <BarChart2 size={14} />
            <span>Pemasukan & Belanja</span>
          </button>
          <button
            type="button"
            className={`ft-chart-toggle-btn ${chartMode === 'cashflow' ? 'active' : ''}`}
            onClick={() => setChartMode('cashflow')}
          >
            <TrendingUp size={14} />
            <span>Arus Kas Bersih</span>
          </button>
        </div>
      }
      className="ft-trend-chart-card"
    >
      <div className="ft-chart-container" style={{ width: '100%', height: 330 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'composed' ? (
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ft-border-subtle)" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: 'var(--ft-border)' }}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={<CustomChartTooltip currencySymbol={currencySymbol} />}
                cursor={{ fill: 'rgba(52, 120, 246, 0.04)' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: '0.82rem' }}
              />
              <Bar dataKey="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line
                type="monotone"
                dataKey="Saldo Bersih"
                stroke="#3478F6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3478F6', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : chartMode === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ft-border-subtle)" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: 'var(--ft-border)' }}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={<CustomChartTooltip currencySymbol={currencySymbol} />}
                cursor={{ fill: 'rgba(52, 120, 246, 0.04)' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: '0.82rem' }}
              />
              <Bar dataKey="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3478F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3478F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ft-border-subtle)" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: 'var(--ft-border)' }}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--ft-text-muted)', fontSize: 12 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip content={<CustomChartTooltip currencySymbol={currencySymbol} />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 16, fontSize: '0.82rem' }}
              />
              <Area
                type="monotone"
                dataKey="Saldo Bersih"
                stroke="#3478F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCashflow)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
