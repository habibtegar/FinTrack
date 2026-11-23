import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Category, TransactionType } from '../../types/finance';
import {
  AVAILABLE_CATEGORY_COLORS,
  AVAILABLE_CATEGORY_ICONS,
} from '../../data/initialData';
import { CategoryIcon } from '../common/CategoryIcon';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

interface CategoryFormProps {
  categoryToEdit?: Category | null;
  onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ categoryToEdit, onClose }) => {
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState(categoryToEdit ? categoryToEdit.name : '');
  const [type, setType] = useState<TransactionType>(categoryToEdit ? categoryToEdit.type : 'expense');
  const [color, setColor] = useState(categoryToEdit ? categoryToEdit.color : AVAILABLE_CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState(categoryToEdit ? categoryToEdit.icon : AVAILABLE_CATEGORY_ICONS[0]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Nama kategori minimal 2 karakter.');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: name.trim(),
        type,
        color,
        icon,
      });
    } else {
      addCategory({
        name: name.trim(),
        type,
        color,
        icon,
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="ft-form">
      {/* Type Toggle */}
      <div className="ft-form-group">
        <label className="ft-label">Jenis Kategori</label>
        <div className="ft-type-switch">
          <button
            type="button"
            className={`ft-type-option ft-type-expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => setType('expense')}
          >
            <ArrowDownLeft size={16} />
            <span>Kategori Pengeluaran</span>
          </button>
          <button
            type="button"
            className={`ft-type-option ft-type-income ${type === 'income' ? 'active' : ''}`}
            onClick={() => setType('income')}
          >
            <ArrowUpRight size={16} />
            <span>Kategori Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Category Name */}
      <div className="ft-form-group">
        <label htmlFor="cat-name" className="ft-label">
          Nama Kategori <span className="ft-required">*</span>
        </label>
        <input
          id="cat-name"
          type="text"
          className={`ft-input ${error ? 'ft-input-error' : ''}`}
          placeholder="Contoh: Belanja Online, Servis Mobil, Gaji"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
        />
        {error && <span className="ft-form-error">{error}</span>}
      </div>

      {/* Color Picker */}
      <div className="ft-form-group">
        <label className="ft-label">Warna Aksen</label>
        <div className="ft-color-palette">
          {AVAILABLE_CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`ft-color-swatch ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Pilih warna ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Icon Picker */}
      <div className="ft-form-group">
        <label className="ft-label">Pilih Ikon</label>
        <div className="ft-icon-picker-grid">
          {AVAILABLE_CATEGORY_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              className={`ft-icon-picker-item ${icon === ic ? 'active' : ''}`}
              style={
                icon === ic
                  ? { backgroundColor: `${color}20`, borderColor: color, color: color }
                  : {}
              }
              onClick={() => setIcon(ic)}
              aria-label={`Pilih ikon ${ic}`}
            >
              <CategoryIcon name={ic} size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Category Preview */}
      <div className="ft-category-preview-box">
        <span className="ft-preview-label">Pratinjau:</span>
        <div className="ft-cat-preview-pill">
          <span
            className="ft-cat-preview-icon"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <CategoryIcon name={icon} size={18} />
          </span>
          <span className="ft-cat-preview-name">{name || 'Nama Kategori'}</span>
          <span className={`ft-cat-preview-type ${type}`}>
            {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </span>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="ft-modal-footer">
        <Button variant="outline" type="button" onClick={onClose}>
          Batal
        </Button>
        <Button variant="primary" type="submit">
          {categoryToEdit ? 'Simpan Kategori' : 'Tambah Kategori'}
        </Button>
      </div>
    </form>
  );
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      subtitle={
        categoryToEdit
          ? 'Perbarui nama, ikon, atau warna kategori'
          : 'Buat kategori baru untuk mengelompokkan transaksi Anda'
      }
      maxWidth="md"
    >
      <CategoryForm
        key={categoryToEdit ? categoryToEdit.id : 'new-cat'}
        categoryToEdit={categoryToEdit}
        onClose={onClose}
      />
    </Modal>
  );
};
