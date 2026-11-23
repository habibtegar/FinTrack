import React from 'react';
import { Card } from '../common/Card';
import type { FinancialInsightItem } from '../../types/finance';
import {
  Sparkles,
  Award,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface FinancialInsightsCardProps {
  insights: FinancialInsightItem[];
}

export const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({ insights }) => {
  const renderIcon = (type: FinancialInsightItem['type'], id: string) => {
    if (id === 'insight-top-expense') {
      return <Award size={20} />;
    }
    if (id === 'insight-expense-trend') {
      return type === 'positive' ? <TrendingDown size={20} /> : <TrendingUp size={20} />;
    }
    if (id === 'insight-savings-growth') {
      return <PiggyBank size={20} />;
    }
    if (id === 'insight-avg-transaction') {
      return <PieIcon size={20} />;
    }

    switch (type) {
      case 'positive':
        return <CheckCircle2 size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  return (
    <Card
      title="Insight Keuangan Otomatis"
      subtitle="Evaluasi kondisi finansial berdasarkan data transaksi riil akun Anda"
      className="ft-insights-card"
    >
      <div className="ft-insights-grid">
        {insights.map((item) => (
          <div key={item.id} className={`ft-insight-box ft-insight-${item.type}`}>
            <div className="ft-insight-top">
              <div className={`ft-insight-icon-wrap ft-insight-icon-${item.type}`}>
                {renderIcon(item.type, item.id)}
              </div>
              {item.badge && (
                <span className={`ft-insight-badge ft-badge-${item.type}`}>
                  {item.badge}
                </span>
              )}
            </div>

            <div className="ft-insight-body">
              <span className="ft-insight-category-title">{item.title}</span>
              <h4 className="ft-insight-headline">{item.headline}</h4>
              <p className="ft-insight-detail">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ft-insights-footer-note">
        <Sparkles size={14} className="ft-insights-footer-icon" />
        <span>
          Semua insight dihitung secara otomatis dari data riil transaksi Anda (100% lokal & privat, tanpa AI eksternal).
        </span>
      </div>
    </Card>
  );
};
