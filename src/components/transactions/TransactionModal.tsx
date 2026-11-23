import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Transaction, TransactionType } from '../../types/finance';
import { getTodayDateString, formatCurrency } from '../../utils/formatters';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface FormErrors {
  title?: string;
  amount?: string;
  categoryId?: string;
  date?: string;
}

interface TransactionFormProps {
  editingTransaction?: Transaction | null;
  onClose: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ editingTransaction, onClose }) => {
  const {
    addTransaction,
    updateTransaction,
    categories,
    userProfile,
  } = useFinance();

  const [type, setType] = useState<TransactionType>(editingTransaction ? editingTransaction.type : 'expense');
  const [title, setTitle] = useState(editingTransaction ? editingTransaction.title : '');
  const [amountStr, setAmountStr] = useState(editingTransaction ? editingTransaction.amount.toString() : '');
  const [categoryId, setCategoryId] = useState(() => {
    if (editingTransaction) return editingTransaction.categoryId;
    const firstExpense = categories.find((c) => c.type === 'expense');
    return firstExpense ? firstExpense.id : '';
  });
  const [date, setDate] = useState(editingTransaction ? editingTransaction.date : getTodayDateString());
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  const [errors, setErrors] = useState<FormErrors>({});

  const availableCategories = categories.filter((cat) => cat.type === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const firstMatchingCat = categories.find((c) => c.type === newType);
    setCategoryId(firstMatchingCat ? firstMatchingCat.id : '');
    if (errors.categoryId) {
      setErrors((prev) => ({ ...prev, categoryId: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Judul transaksi wajib diisi.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Judul minimal 3 karakter.';
    }

    const numAmount = parseFloat(amountStr);
    if (!amountStr || isNaN(numAmount)) {
      newErrors.amount = 'Nominal transaksi wajib diisi.';
    } else if (numAmount <= 0) {
      newErrors.amount = 'Nominal harus lebih besar dari 0.';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Silakan pilih kategori.';
    }

    if (!date) {
      newErrors.date = 'Tanggal transaksi wajib diisi.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = Math.round(parseFloat(amountStr));

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        type,
        categoryId,
        date,
        notes: notes.trim() || undefined,
      });
    } else {
      addTransaction({
        title: title.trim(),
        amount: parsedAmount,
        type,
        categoryId,
        date,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const parsedAmountPreview = parseFloat(amountStr);

  return (
    <form onSubmit={handleSubmit} className="ft-form">
      {/* Type Toggle */}
      <div className="ft-form-group">
        <label className="ft-label">Jenis Transaksi</label>
        <div className="ft-type-switch">
          <button
            type="button"
            className={`ft-type-option ft-type-expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => handleTypeChange('expense')}
          >
            <ArrowDownLeft size={16} />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            className={`ft-type-option ft-type-income ${type === 'income' ? 'active' : ''}`}
            onClick={() => handleTypeChange('income')}
          >
            <ArrowUpRight size={16} />
            <span>Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="ft-form-group">
        <label htmlFor="tx-title" className="ft-label">
          Judul Transaksi <span className="ft-required">*</span>
        </label>
        <input
          id="tx-title"
          type="text"
          className={`ft-input ${errors.title ? 'ft-input-error' : ''}`}
          placeholder="Contoh: Belanja Bulanan, Gaji Pokok, Makan Siang"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
        />
        {errors.title && <span className="ft-form-error">{errors.title}</span>}
      </div>

      {/* Amount */}
      <div className="ft-form-group">
        <label htmlFor="tx-amount" className="ft-label">
          Nominal (Rupiah) <span className="ft-required">*</span>
        </label>
        <div className="ft-input-prefix-wrapper">
          <span className="ft-input-prefix">{userProfile.currencySymbol}</span>
          <input
            id="tx-amount"
            type="number"
            min="0"
            step="1000"
            className={`ft-input ft-input-with-prefix ${errors.amount ? 'ft-input-error' : ''}`}
            placeholder="0"
            value={amountStr}
            onChange={(e) => {
              setAmountStr(e.target.value);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
          />
        </div>
        {!isNaN(parsedAmountPreview) && parsedAmountPreview > 0 && (
          <span className="ft-amount-preview">
            Format: {formatCurrency(parsedAmountPreview, userProfile.currencySymbol)}
          </span>
        )}
        {errors.amount && <span className="ft-form-error">{errors.amount}</span>}
      </div>

      {/* Row for Category & Date */}
      <div className="ft-form-row">
        {/* Category */}
        <div className="ft-form-group">
          <label htmlFor="tx-category" className="ft-label">
            Kategori <span className="ft-required">*</span>
          </label>
          <select
            id="tx-category"
            className={`ft-select ${errors.categoryId ? 'ft-input-error' : ''}`}
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: undefined }));
            }}
          >
            <option value="" disabled>
              -- Pilih Kategori --
            </option>
            {availableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <span className="ft-form-error">{errors.categoryId}</span>}
        </div>

        {/* Date */}
        <div className="ft-form-group">
          <label htmlFor="tx-date" className="ft-label">
            Tanggal Transaksi <span className="ft-required">*</span>
          </label>
          <input
            id="tx-date"
            type="date"
            className={`ft-input ${errors.date ? 'ft-input-error' : ''}`}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
            }}
          />
          {errors.date && <span className="ft-form-error">{errors.date}</span>}
        </div>
      </div>

      {/* Notes (Optional) */}
      <div className="ft-form-group">
        <label htmlFor="tx-notes" className="ft-label">
          Catatan Tambahan <span className="ft-optional">(Opsional)</span>
        </label>
        <textarea
          id="tx-notes"
          rows={3}
          className="ft-textarea"
          placeholder="Tuliskan catatan atau keterangan singkat transaksi ini..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Form Actions */}
      <div className="ft-modal-footer">
        <Button variant="outline" type="button" onClick={onClose}>
          Batal
        </Button>
        <Button variant="primary" type="submit">
          {editingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </Button>
      </div>
    </form>
  );
};

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
  } = useFinance();

  return (
    <Modal
      isOpen={isTransactionModalOpen}
      onClose={closeTransactionModal}
      title={editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
      subtitle={
        editingTransaction
          ? 'Perbarui detail transaksi yang dipilih'
          : 'Catat pengeluaran atau pemasukan terbaru Anda'
      }
      maxWidth="md"
    >
      <TransactionForm
        key={editingTransaction ? editingTransaction.id : 'new-tx'}
        editingTransaction={editingTransaction}
        onClose={closeTransactionModal}
      />
    </Modal>
  );
};
