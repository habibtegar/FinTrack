import React, { useState, useRef, useEffect } from 'react';
import {
  Tags,
  ChevronDown,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import type { Category, Transaction } from '../../types/finance';

interface CategoryFilterDropdownProps {
  selectedCategoryId: string;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  transactions?: Transaction[];
}

export const CategoryFilterDropdown: React.FC<CategoryFilterDropdownProps> = ({
  selectedCategoryId,
  categories,
  onSelectCategory,
  transactions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory =
    selectedCategoryId !== 'all'
      ? categories.find((c) => c.id === selectedCategoryId) || null
      : null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  // Count transactions per category
  const txCountMap = React.useMemo(() => {
    const map = new Map<string, number>();
    if (transactions) {
      for (const tx of transactions) {
        map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + 1);
      }
    }
    return map;
  }, [transactions]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelectCategory(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCategory('all');
    setIsOpen(false);
  };

  return (
    <div className="ft-cat-dropdown-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`ft-cat-dropdown-trigger ${isOpen ? 'active' : ''} ${
          selectedCategory ? 'has-selection' : ''
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="ft-cat-dropdown-trigger-left">
          {selectedCategory ? (
            <>
              <span
                className="ft-cat-dropdown-icon-badge"
                style={{
                  backgroundColor: `${selectedCategory.color}18`,
                  color: selectedCategory.color,
                }}
              >
                <CategoryIcon name={selectedCategory.icon} size={14} />
              </span>
              <span className="ft-cat-dropdown-label-text" title={selectedCategory.name}>
                {selectedCategory.name}
              </span>
            </>
          ) : (
            <>
              <Tags size={15} className="ft-cat-dropdown-tags-icon" />
              <span className="ft-cat-dropdown-label-text">Semua Kategori</span>
            </>
          )}
        </div>

        <div className="ft-cat-dropdown-trigger-right">
          {selectedCategory && (
            <span
              role="button"
              tabIndex={0}
              className="ft-cat-dropdown-clear-btn"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              title="Reset ke Semua Kategori"
              aria-label="Reset ke Semua Kategori"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`ft-cat-dropdown-arrow ${isOpen ? 'open' : ''}`} />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="ft-cat-dropdown-menu" role="listbox">
          {/* Default Option: Semua Kategori */}
          <button
            type="button"
            className={`ft-cat-dropdown-item ft-cat-dropdown-item-all ${
              selectedCategoryId === 'all' ? 'selected' : ''
            }`}
            onClick={() => handleSelect('all')}
            role="option"
            aria-selected={selectedCategoryId === 'all'}
          >
            <div className="ft-cat-dropdown-item-left">
              <span className="ft-cat-dropdown-item-icon-box all-cats-box">
                <Tags size={15} />
              </span>
              <div className="ft-cat-dropdown-item-info">
                <span className="ft-cat-dropdown-item-name">Semua Kategori</span>
                <span className="ft-cat-dropdown-item-sub">Tampilkan seluruh transaksi</span>
              </div>
            </div>
            {selectedCategoryId === 'all' && (
              <Check size={16} className="ft-cat-dropdown-check-icon" />
            )}
          </button>

          <div className="ft-cat-dropdown-divider" />

          {/* Group: Kategori Pengeluaran */}
          {expenseCategories.length > 0 && (
            <div className="ft-cat-dropdown-group">
              <div className="ft-cat-dropdown-group-header ft-group-expense">
                <ArrowDownLeft size={13} />
                <span>Pengeluaran ({expenseCategories.length})</span>
              </div>

              <div className="ft-cat-dropdown-group-items">
                {expenseCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const count = txCountMap.get(cat.id) || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`ft-cat-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(cat.id)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="ft-cat-dropdown-item-left">
                        <span
                          className="ft-cat-dropdown-item-icon-box"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} size={15} />
                        </span>
                        <div className="ft-cat-dropdown-item-info">
                          <span className="ft-cat-dropdown-item-name">{cat.name}</span>
                          <span className="ft-cat-dropdown-item-count">{count} transaksi</span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={16} className="ft-cat-dropdown-check-icon" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group: Kategori Pemasukan */}
          {incomeCategories.length > 0 && (
            <div className="ft-cat-dropdown-group">
              <div className="ft-cat-dropdown-group-header ft-group-income">
                <ArrowUpRight size={13} />
                <span>Pemasukan ({incomeCategories.length})</span>
              </div>

              <div className="ft-cat-dropdown-group-items">
                {incomeCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const count = txCountMap.get(cat.id) || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`ft-cat-dropdown-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(cat.id)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="ft-cat-dropdown-item-left">
                        <span
                          className="ft-cat-dropdown-item-icon-box"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <CategoryIcon name={cat.icon} size={15} />
                        </span>
                        <div className="ft-cat-dropdown-item-info">
                          <span className="ft-cat-dropdown-item-name">{cat.name}</span>
                          <span className="ft-cat-dropdown-item-count">{count} transaksi</span>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={16} className="ft-cat-dropdown-check-icon" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
