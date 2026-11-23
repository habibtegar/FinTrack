import React, { useState, useMemo } from 'react';
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
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { calculatePeriodSummaries } from '../../utils/calculations';
import type { ChartPeriod } from '../../types/finance';
import { BarChart3, TrendingUp } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  currencySymbol: string;
  dataMap: Map<string, string>;
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  currencySymbol,
  dataMap,
}) => {
  if (active && payload && payload.length) {
    const fullDate = label ? dataMap.get(label) || label : label;
    return (
      <div className="ft-chart-tooltip">
        <p className="ft-chart-tooltip-label">{fullDate}</p>
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

const PERIOD_LABELS: Record<ChartPeriod, { title: string; subtitle: string }> = {
  '7d': {
    title: 'Arus Kas 7 Hari Terakhir',
    subtitle: 'Rincian transaksi harian selama seminggu ke belakang',
  },
  '30d': {
    title: 'Arus Kas 30 Hari Terakhir',
    subtitle: 'Perbandingan berkala selama 30 hari ke belakang',
  },
  '6m': {
    title: 'Pemasukan & Pengeluaran 6 Bulan',
    subtitle: 'Perbandingan arus kas bulanan semester berjalan',
  },
  '1y': {
    title: 'Tren Keuangan 1 Tahun Terakhir',
    subtitle: 'Akumulasi arus kas masuk dan keluar tahunan',
  },
};

export const MonthlyChart: React.FC = () => {
  const { transactions, userProfile, openAddTransactionModal } = useFinance();
  const [period, setPeriod] = useState<ChartPeriod>('6m');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Compute data dynamically based on the selected period
  const rawData = useMemo(() => {
    return calculatePeriodSummaries(transactions, period);
  }, [transactions, period]);

  const fullLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    rawData.forEach((item) => {
      map.set(item.label, item.fullLabel || item.label);
    });
    return map;
  }, [rawData]);

  const chartData = useMemo(() => {
    return rawData.map((item) => ({
      name: item.label,
      Pemasukan: item.income,
      Pengeluaran: item.expense,
      Saldo: item.balance,
    }));
  }, [rawData]);

  const periodOptions: Array<{ id: ChartPeriod; label: string }> = [
    { id: '7d', label: '7 Hari' },
    { id: '30d', label: '30 Hari' },
    { id: '6m', label: '6 Bulan' },
    { id: '1y', label: '1 Tahun' },
  ];

  const chartControls = (
    <div className="ft-chart-header-controls">
      {/* Period filter buttons */}
      <div className="ft-period-filter-group" role="tablist" aria-label="Pilihan periode grafik">
        {periodOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ft-period-btn ${period === opt.id ? 'active' : ''}`}
            onClick={() => setPeriod(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Bar vs Area type toggle */}
      <div className="ft-chart-type-toggle">
        <button
          type="button"
          className={`ft-chart-toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
          onClick={() => setChartType('bar')}
          title="Tampilan Diagram Batang"
          aria-label="Tampilan Diagram Batang"
        >
          <BarChart3 size={14} />
          <span>Batang</span>
        </button>
        <button
          type="button"
          className={`ft-chart-toggle-btn ${chartType === 'area' ? 'active' : ''}`}
          onClick={() => setChartType('area')}
          title="Tampilan Grafik Tren Area"
          aria-label="Tampilan Grafik Tren Area"
        >
          <TrendingUp size={14} />
          <span>Area</span>
        </button>
      </div>
    </div>
  );

  if (transactions.length === 0) {
    return (
      <Card
        title="Grafik Arus Kas"
        subtitle="Visualisasi pemasukan dan pengeluaran berkala"
        className="ft-monthly-chart-card"
      >
        <EmptyState
          icon={<BarChart3 size={42} className="ft-empty-icon-svg" />}
          title="Belum Ada Data Grafik"
          description="Grafik arus kas akan muncul secara otomatis setelah Anda mulai mencatat transaksi pemasukan atau pengeluaran."
          actionText="Tambah Transaksi"
          onAction={openAddTransactionModal}
          className="ft-chart-empty-state"
        />
      </Card>
    );
  }

  const currentPeriodInfo = PERIOD_LABELS[period];

  return (
    <Card
      title={currentPeriodInfo.title}
      subtitle={currentPeriodInfo.subtitle}
      action={chartControls}
      className="ft-monthly-chart-card"
    >
      <div className="ft-chart-container" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    currencySymbol={userProfile.currencySymbol}
                    dataMap={fullLabelMap}
                  />
                }
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
                radius={[5, 5, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="Pengeluaran"
                fill="#3478F6"
                radius={[5, 5, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncPeriod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExpPeriod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3478F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3478F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    currencySymbol={userProfile.currencySymbol}
                    dataMap={fullLabelMap}
                  />
                }
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="Pemasukan"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIncPeriod)"
              />
              <Area
                type="monotone"
                dataKey="Pengeluaran"
                stroke="#3478F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpPeriod)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
