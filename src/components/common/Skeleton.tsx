import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  borderRadius,
  variant = 'rectangular',
  style,
}) => {
  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circular') return '50%';
    if (variant === 'text') return '4px';
    return 'var(--ft-radius-md)';
  };

  return (
    <div
      className={`ft-skeleton ft-skeleton-${variant} ${className}`}
      style={{
        width,
        height,
        borderRadius: getBorderRadius(),
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number | string }> = ({ height = 180 }) => (
  <div className="ft-card ft-skeleton-card">
    <div className="ft-card-header">
      <Skeleton width="40%" height={20} />
      <Skeleton width="20%" height={16} />
    </div>
    <div className="ft-card-body">
      <Skeleton width="100%" height={height} />
    </div>
  </div>
);

export const SkeletonStatCard: React.FC = () => (
  <div className="ft-card ft-stat-card ft-skeleton-stat">
    <div className="ft-card-body">
      <div className="ft-stat-top">
        <Skeleton width="50%" height={14} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton width="70%" height={30} style={{ margin: '8px 0' }} />
      <div className="ft-stat-bottom">
        <Skeleton width="30%" height={18} borderRadius={999} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  </div>
);
