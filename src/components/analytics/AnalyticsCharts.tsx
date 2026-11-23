import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { calculateCategoryBreakdown } from '../../utils/calculations';
import { BarChart2, TrendingUp, PieChart as PieIcon } from 'lucide-react';

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

export const AnalyticsCharts: React.FC = () => {
  const { monthlySummaries, transactions, categories, userProfile, openAddTransactionModal } = useFinance();
  const [activeTab, setActiveTab] = useState<'comparison' | 'cashflow' | 'pie'>('comparison');
  const [pieType, setPieType] = useState<'expense' | 'income'>('expense');

  if (transactions.length === 0) {
    return (
      <Card
        title="Grafik & Visualisasi Keuangan"
        subtitle="Analisis tren pemasukan, pengeluaran, dan alokasi dana"
        className="ft-analytics-chart-card"
      >
        <EmptyState
          icon={<BarChart2 size={40} className="ft-empty-icon-svg" />}
          title="Belum Ada Data Analisis"
          description="Grafik perbandingan dan distribusi kategori akan tampil setelah Anda mulai mencatat transaksi."
          actionText="Tambah Transaksi"
          onAction={openAddTransactionModal}
          className="ft-chart-empty-state"
        />
      </Card>
    );
  }

  const chartData = monthlySummaries.map((item) => ({
    name: item.label,
    fullLabel: item.monthName,
    Pemasukan: item.income,
    Pengeluaran: item.expense,
    SaldoBersih: item.balance,
  }));

  const pieBreakdown = calculateCategoryBreakdown(transactions, categories, pieType);
  const pieData = pieBreakdown.map((item) => ({
    name: item.categoryName,
    value: item.totalAmount,
    color: item.categoryColor,
    percentage: item.percentage,
  }));

  return (
    <Card
      title="Grafik & Visualisasi Keuangan"
      subtitle="Analisis tren pemasukan, pengeluaran, dan alokasi dana"
      action={
        <div className="ft-analytics-view-switch">
          <button
            type="button"
            className={`ft-chart-toggle-btn ${activeTab === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparison')}
          >
            <BarChart2 size={14} />
            <span>Perbandingan</span>
          </button>
          <button
            type="button"
            className={`ft-chart-toggle-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
            onClick={() => setActiveTab('cashflow')}
          >
            <TrendingUp size={14} />
            <span>Arus Kas Bersih</span>
          </button>
          <button
            type="button"
            className={`ft-chart-toggle-btn ${activeTab === 'pie' ? 'active' : ''}`}
            onClick={() => setActiveTab('pie')}
          >
            <PieIcon size={14} />
            <span>Distribusi</span>
          </button>
        </div>
      }
      className="ft-analytics-chart-card"
    >
      {activeTab === 'comparison' && (
        <div className="ft-chart-container" style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={<CustomChartTooltip currencySymbol={userProfile.currencySymbol} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Bar
                dataKey="Pemasukan"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="Pengeluaran"
                fill="#3478F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="ft-chart-container" style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3478F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3478F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={<CustomChartTooltip currencySymbol={userProfile.currencySymbol} />}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                name="Saldo Bersih (Surplus)"
                dataKey="SaldoBersih"
                stroke="#3478F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorNet)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'pie' && (
        <div>
          <div className="ft-pie-filter-switch">
            <button
              type="button"
              className={`ft-pill-btn ${pieType === 'expense' ? 'active' : ''}`}
              onClick={() => setPieType('expense')}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={`ft-pill-btn ft-pill-income ${pieType === 'income' ? 'active' : ''}`}
              onClick={() => setPieType('income')}
            >
              Pemasukan
            </button>
          </div>

          <div className="ft-chart-container" style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => formatCurrency(Number(val) || 0, userProfile.currencySymbol)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
};
