import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`ft-empty-state ${className}`}>
      <div className="ft-empty-state-icon">
        {icon || <FolderSearch size={44} strokeWidth={1.5} />}
      </div>
      <h4 className="ft-empty-state-title">{title}</h4>
      <p className="ft-empty-state-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
