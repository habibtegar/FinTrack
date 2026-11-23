import React from 'react';
import { Card } from '../common/Card';

interface StatCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  iconColor = '#3478F6',
  iconBg = 'rgba(52, 120, 246, 0.1)',
  badgeText,
  badgeType = 'neutral',
}) => {
  return (
    <Card className="ft-stat-card" padding="md">
      <div className="ft-stat-top">
        <span className="ft-stat-title">{title}</span>
        <div
          className="ft-stat-icon-wrap"
          style={{ color: iconColor, backgroundColor: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div className="ft-stat-value">{amount}</div>
      {(subtitle || badgeText) && (
        <div className="ft-stat-bottom">
          {badgeText && (
            <span className={`ft-stat-badge ft-stat-badge-${badgeType}`}>
              {badgeText}
            </span>
          )}
          {subtitle && <span className="ft-stat-subtitle">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
};
