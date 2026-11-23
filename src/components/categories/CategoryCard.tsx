import React, { useState } from 'react';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { Category } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency } from '../../utils/formatters';
import { CategoryDeleteModal } from './CategoryDeleteModal';

interface CategoryCardProps {
  category: Category;
  onEdit: (cat: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit }) => {
  const { transactions, userProfile } = useFinance();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Calculate transactions for this category
  const linkedTransactions = transactions.filter((t) => t.categoryId === category.id);
  const txCount = linkedTransactions.length;
  const totalAmount = linkedTransactions.reduce((acc, t) => acc + t.amount, 0);

  const isIncome = category.type === 'income';

  return (
    <>
      <div className="ft-category-card">
        <div className="ft-cat-card-header">
          <div
            className="ft-cat-card-icon"
            style={{
              backgroundColor: `${category.color}15`,
              color: category.color,
            }}
          >
            <CategoryIcon name={category.icon} size={22} />
          </div>

          <div className="ft-cat-card-actions">
            <button
              type="button"
              className="ft-cat-action-btn"
              onClick={() => onEdit(category)}
              title="Edit kategori"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              className="ft-cat-action-btn ft-cat-action-delete"
              onClick={() => setIsConfirmDeleteOpen(true)}
              title="Hapus kategori"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="ft-cat-card-body">
          <h4 className="ft-cat-card-title">{category.name}</h4>
          <div className="ft-cat-card-badge-row">
            <span className={`ft-cat-badge ${isIncome ? 'income' : 'expense'}`}>
              {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              <span>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
            </span>
            <span className="ft-cat-count">{txCount} Transaksi</span>
          </div>
        </div>

        <div className="ft-cat-card-footer">
          <span className="ft-cat-total-label">Total Akumulasi:</span>
          <span className={`ft-cat-total-val ${isIncome ? 'inc' : 'exp'}`}>
            {formatCurrency(totalAmount, userProfile.currencySymbol)}
          </span>
        </div>
      </div>

      <CategoryDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        category={category}
        txCount={txCount}
      />
    </>
  );
};
