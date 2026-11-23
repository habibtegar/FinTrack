import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'gray';
  size?: 'sm' | 'md';
  hasDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  hasDot = false,
  className = '',
}) => {
  return (
    <span className={`ft-badge ft-badge-${variant} ft-badge-${size} ${className}`}>
      {hasDot && <span className="ft-badge-dot" />}
      {children}
    </span>
  );
};
