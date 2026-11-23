import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  padding = 'md',
  onClick,
}) => {
  const hasHeader = Boolean(title || action);

  return (
    <div
      className={`ft-card ft-card-pad-${padding} ${onClick ? 'ft-card-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {hasHeader && (
        <div className="ft-card-header">
          <div className="ft-card-title-wrap">
            {title && <h3 className="ft-card-title">{title}</h3>}
            {subtitle && <p className="ft-card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="ft-card-action">{action}</div>}
        </div>
      )}
      <div className="ft-card-body">{children}</div>
    </div>
  );
};
