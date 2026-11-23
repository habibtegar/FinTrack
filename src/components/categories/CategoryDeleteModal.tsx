import React, { useState } from 'react';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import type { Category } from '../../types/finance';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  txCount: number;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  category,
  txCount,
}) => {
  const { categories, deleteCategory } = useFinance();

  // Find eligible destination categories (same type first, excluding current category)
  const sameTypeCats = categories.filter(
    (c) => c.id !== category.id && c.type === category.type
  );
  const fallbackCats = categories.filter((c) => c.id !== category.id);
  const eligibleCats = sameTypeCats.length > 0 ? sameTypeCats : fallbackCats;

  const [reassignToId, setReassignToId] = useState<string>(() => {
    return eligibleCats[0]?.id || '';
  });

  const selectedTargetCat = eligibleCats.find((c) => c.id === reassignToId) || eligibleCats[0];

  const handleConfirm = () => {
    if (txCount > 0) {
      if (!reassignToId && eligibleCats.length > 0) {
        deleteCategory(category.id, eligibleCats[0].id);
      } else {
        deleteCategory(category.id, reassignToId);
      }
    } else {
      deleteCategory(category.id);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hapus Kategori "${category.name}"`}
      subtitle={
        txCount > 0
          ? `Kategori ini memiliki ${txCount} riwayat transaksi aktif`
          : 'Konfirmasi penghapusan kategori'
      }
      maxWidth="sm"
    >
      <div className="ft-category-delete-modal-body">
        {txCount === 0 ? (
          <div className="ft-cat-delete-zero-state">
            <p className="ft-cat-delete-msg">
              Apakah Anda yakin ingin menghapus kategori <strong>{category.name}</strong>?
            </p>
            <p className="ft-cat-delete-submsg">
              Kategori ini belum memiliki transaksi terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        ) : (
          <div className="ft-cat-delete-reassign-wrap">
            {/* Warning Alert Banner */}
            <div className="ft-cat-delete-alert">
              <AlertTriangle size={20} className="ft-cat-delete-alert-icon" />
              <div className="ft-cat-delete-alert-text">
                <strong>Riwayat Transaksi Aman</strong>
                <p>
                  FinTrack tidak akan menghapus <strong>{txCount} transaksi</strong> Anda.
                  Pilih kategori pengganti di bawah ini untuk menampung riwayat transaksi tersebut.
                </p>
              </div>
            </div>

            {/* Target Category Selector */}
            <div className="ft-form-group">
              <label htmlFor="reassign-cat-select" className="ft-label">
                Pindahkan {txCount} Transaksi Ke Kategori: <span className="ft-required">*</span>
              </label>
              <select
                id="reassign-cat-select"
                className="ft-input"
                value={reassignToId || eligibleCats[0]?.id || ''}
                onChange={(e) => setReassignToId(e.target.value)}
              >
                {eligibleCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.type === 'income' ? '[Pemasukan] ' : '[Pengeluaran] '}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Reassignment Flow Preview */}
            {selectedTargetCat && (
              <div className="ft-reassign-preview-box">
                <div className="ft-reassign-source">
                  <span
                    className="ft-reassign-badge"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    <CategoryIcon name={category.icon} size={15} />
                  </span>
                  <span className="ft-reassign-name">{category.name}</span>
                </div>

                <div className="ft-reassign-arrow">
                  <ArrowRight size={16} />
                </div>

                <div className="ft-reassign-target">
                  <span
                    className="ft-reassign-badge"
                    style={{
                      backgroundColor: `${selectedTargetCat.color}15`,
                      color: selectedTargetCat.color,
                    }}
                  >
                    <CategoryIcon name={selectedTargetCat.icon} size={15} />
                  </span>
                  <span className="ft-reassign-name">{selectedTargetCat.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="ft-modal-footer">
          <Button variant="outline" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="danger"
            type="button"
            leftIcon={<Trash2 size={16} />}
            onClick={handleConfirm}
          >
            {txCount > 0 ? 'Pindahkan Transaksi & Hapus' : 'Ya, Hapus Kategori'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
