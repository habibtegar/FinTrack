import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, MoreVertical, Edit2, Trash2, Clock } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import type { Transaction } from '../../types/finance';

export const RecentTransactions: React.FC = () => {
  const {
    transactions,
    categories,
    userProfile,
    setCurrentTab,
    openAddTransactionModal,
    openEditTransactionModal,
    deleteTransaction,
  } = useFinance();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Close active dropdown menu when clicking anywhere outside
  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeMenuId]);

  const categoryMap = new Map<string, (typeof categories)[0]>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  // Sort descending by date and take recent 5
  const recentTxs = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const handleDelete = () => {
    if (deletingTx) {
      deleteTransaction(deletingTx.id);
      setDeletingTx(null);
    }
  };

  return (
    <>
      <Card
        title="Aktivitas Transaksi Terbaru"
        subtitle="5 transaksi terakhir yang tercatat di akun Anda"
        action={
          <button
            type="button"
            className="ft-text-link-btn"
            onClick={() => setCurrentTab('transactions')}
          >
            Lihat Semua →
          </button>
        }
        className="ft-recent-tx-card"
      >
        {recentTxs.length === 0 ? (
          <EmptyState
            icon={<Clock size={40} className="ft-empty-icon-svg" />}
            title="Belum Ada Transaksi"
            description="Mulai catat transaksi pertama Anda untuk melihat ringkasan aktivitas terbaru di sini."
            actionText="Tambah Transaksi"
            onAction={openAddTransactionModal}
          />
        ) : (
          <div className="ft-tx-list">
            {recentTxs.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              const catColor = cat ? cat.color : '#64748B';
              const catIcon = cat ? cat.icon : 'Tag';
              const catName = cat ? cat.name : 'Lainnya';

              return (
                <div key={tx.id} className="ft-tx-item">
                  <div className="ft-tx-left">
                    <div
                      className="ft-tx-cat-icon"
                      style={{
                        backgroundColor: `${catColor}18`,
                        color: catColor,
                      }}
                    >
                      <CategoryIcon name={catIcon} size={18} />
                    </div>

                    <div className="ft-tx-info">
                      <h4 className="ft-tx-title">{tx.title}</h4>
                      <div className="ft-tx-meta">
                        <span className="ft-tx-cat-name">{catName}</span>
                        <span className="ft-tx-dot">•</span>
                        <span className="ft-tx-date">{formatRelativeDate(tx.date)}</span>
                        {tx.notes && (
                          <>
                            <span className="ft-tx-dot">•</span>
                            <span className="ft-tx-notes" title={tx.notes}>
                              {tx.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ft-tx-right">
                    <div className="ft-tx-amount-col">
                      <span className={`ft-tx-amount ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? (
                          <ArrowUpRight size={14} className="ft-tx-arrow" />
                        ) : (
                          <ArrowDownLeft size={14} className="ft-tx-arrow" />
                        )}
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, userProfile.currencySymbol)}
                      </span>
                    </div>

                    {/* Quick actions popup */}
                    <div className="ft-tx-action-wrap">
                      <button
                        type="button"
                        className="ft-icon-btn ft-tx-menu-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === tx.id ? null : tx.id);
                        }}
                        aria-label="Opsi transaksi"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === tx.id && (
                        <div
                          className="ft-dropdown-menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="ft-dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              openEditTransactionModal(tx);
                            }}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="ft-dropdown-item ft-dropdown-item-danger"
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeletingTx(tx);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
