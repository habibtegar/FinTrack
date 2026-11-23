import React from 'react';
import { Plus, Tags } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionFilter } from '../components/transactions/TransactionFilter';
import { TransactionList } from '../components/transactions/TransactionList';
import { Button } from '../components/common/Button';

export const TransactionsPage: React.FC = () => {
  const {
    filteredTransactions,
    categories,
    openAddTransactionModal,
    setCurrentTab,
    addToast,
  } = useFinance();

  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const handleExportCsv = () => {
    try {
      if (filteredTransactions.length === 0) {
        addToast('Tidak Ada Data', 'Tidak ada transaksi yang dapat diekspor.', 'warning');
        return;
      }

      const headers = ['ID', 'Tanggal', 'Judul Transaksi', 'Kategori', 'Jenis', 'Nominal (Rp)', 'Catatan'];
      const rows = filteredTransactions.map((tx) => {
        const catName = categoryMap.get(tx.categoryId) || 'Lainnya';
        const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const notesClean = (tx.notes || '').replace(/"/g, '""');
        const titleClean = tx.title.replace(/"/g, '""');

        return [
          tx.id,
          tx.date,
          `"${titleClean}"`,
          `"${catName}"`,
          typeLabel,
          tx.amount,
          `"${notesClean}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fintrack-transaksi-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Ekspor CSV Berhasil', `${filteredTransactions.length} transaksi diekspor.`);
    } catch {
      addToast('Gagal Ekspor CSV', 'Terjadi kesalahan saat memproses file CSV.', 'error');
    }
  };

  return (
    <div className="ft-page ft-transactions-page">
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">Riwayat Transaksi</h2>
          <p className="ft-page-subtitle">
            Kelola, telusuri, dan saring seluruh transaksi pemasukan serta pengeluaran.
          </p>
        </div>

        <div className="ft-tx-header-actions">
          <Button
            variant="outline"
            leftIcon={<Tags size={15} />}
            onClick={() => setCurrentTab('categories')}
            className="ft-nav-categories-btn"
          >
            Kelola Kategori
          </Button>

          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={openAddTransactionModal}
          >
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <TransactionFilter
        onExportCsv={handleExportCsv}
        filteredCount={filteredTransactions.length}
      />

      {/* Transactions Table & List */}
      <TransactionList transactions={filteredTransactions} />
    </div>
  );
};
