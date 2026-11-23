import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = 'ft-btn';
  const variantClass = `ft-btn-${variant}`;
  const sizeClass = `ft-btn-${size}`;
  const loadingClass = isLoading ? 'ft-btn-loading' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ft-spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="ft-btn-icon-left">{leftIcon}</span>
      )}
      <span className="ft-btn-text">{children}</span>
      {!isLoading && rightIcon && <span className="ft-btn-icon-right">{rightIcon}</span>}
    </button>
  );
};
