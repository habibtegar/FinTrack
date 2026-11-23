import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction } from '../../types/finance';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const {
    categories,
    userProfile,
    openEditTransactionModal,
    deleteTransaction,
    openAddTransactionModal,
    resetFilterOptions,
  } = useFinance();

  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const categoryMap = new Map<string, (typeof categories)[0]>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const handleDelete = () => {
    if (deletingTx) {
      deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    }
  };

  // Calculate filtered stats
  const filteredIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredNet = filteredIncome - filteredExpense;

  if (transactions.length === 0) {
    return (
      <div className="ft-tx-empty-container">
        <EmptyState
          icon={<AlertCircle size={44} className="ft-empty-icon-svg" />}
          title="Tidak Ada Transaksi Ditemukan"
          description="Coba ubah kata kunci pencarian, filter jenis transaksi, atau tambahkan data transaksi baru."
          actionText="Tambah Transaksi"
          onAction={openAddTransactionModal}
        />
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            type="button"
            className="ft-text-link-btn"
            onClick={resetFilterOptions}
          >
            Reset Semua Filter
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filtered stats summary bar */}
      <div className="ft-tx-summary-bar">
        <div className="ft-tx-sum-item">
          <span className="ft-tx-sum-label">Total Transaksi:</span>
          <span className="ft-tx-sum-value">{transactions.length}</span>
        </div>
        <div className="ft-tx-sum-item">
          <span className="ft-tx-sum-label">Pemasukan:</span>
          <span className="ft-tx-sum-value ft-sum-inc">
            +{formatCurrency(filteredIncome, userProfile.currencySymbol)}
          </span>
        </div>
        <div className="ft-tx-sum-item">
          <span className="ft-tx-sum-label">Pengeluaran:</span>
          <span className="ft-tx-sum-value ft-sum-exp">
            -{formatCurrency(filteredExpense, userProfile.currencySymbol)}
          </span>
        </div>
        <div className="ft-tx-sum-item">
          <span className="ft-tx-sum-label">Selisih Bersih:</span>
          <span className={`ft-tx-sum-value ${filteredNet >= 0 ? 'ft-sum-inc' : 'ft-sum-exp'}`}>
            {formatCurrency(filteredNet, userProfile.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="ft-table-wrapper">
        <table className="ft-tx-table">
          <thead>
            <tr>
              <th>Transaksi & Catatan</th>
              <th>Kategori</th>
              <th>Tanggal</th>
              <th className="ft-th-right">Nominal</th>
              <th className="ft-th-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              const catColor = cat ? cat.color : '#64748B';
              const catIcon = cat ? cat.icon : 'Tag';
              const catName = cat ? cat.name : 'Lainnya';

              return (
                <tr key={tx.id} className="ft-table-row">
                  {/* Title & Notes */}
                  <td>
                    <div className="ft-td-title-cell">
                      <div
                        className="ft-td-cat-icon"
                        style={{
                          backgroundColor: `${catColor}15`,
                          color: catColor,
                        }}
                      >
                        <CategoryIcon name={catIcon} size={18} />
                      </div>
                      <div className="ft-td-title-info">
                        <span className="ft-td-title">{tx.title}</span>
                        {tx.notes && (
                          <span className="ft-td-notes">
                            <FileText size={12} />
                            {tx.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      className="ft-category-pill"
                      style={{
                        borderColor: `${catColor}30`,
                        backgroundColor: `${catColor}10`,
                        color: catColor,
                      }}
                    >
                      {catName}
                    </span>
                  </td>

                  {/* Date */}
                  <td>
                    <div className="ft-td-date">
                      <Calendar size={13} />
                      <span>{formatDate(tx.date, userProfile.dateFormat)}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="ft-td-right">
                    <span className={`ft-table-amount ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? (
                        <ArrowUpRight size={14} className="ft-arrow-icon" />
                      ) : (
                        <ArrowDownLeft size={14} className="ft-arrow-icon" />
                      )}
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, userProfile.currencySymbol)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="ft-td-center">
                    <div className="ft-action-buttons">
                      <button
                        type="button"
                        className="ft-action-btn ft-action-edit"
                        onClick={() => openEditTransactionModal(tx)}
                        title="Edit transaksi"
                        aria-label={`Edit transaksi ${tx.title}`}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="ft-action-btn ft-action-delete"
                        onClick={() => setDeletingTx(tx)}
                        title="Hapus transaksi"
                        aria-label={`Hapus transaksi ${tx.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingTx)}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deletingTx?.title}" sebesar ${formatCurrency(
          deletingTx?.amount || 0,
          userProfile.currencySymbol
        )}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeletingTx(null)}
      />
    </>
  );
};
