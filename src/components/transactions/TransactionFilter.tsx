import React from 'react';
import { Search, RotateCcw, Download } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { MONTH_NAMES_ID } from '../../utils/formatters';
import type { TransactionFilterOptions } from '../../types/finance';
import { CategoryFilterDropdown } from './CategoryFilterDropdown';

interface TransactionFilterProps {
  onExportCsv: () => void;
  filteredCount: number;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  onExportCsv,
  filteredCount,
}) => {
  const {
    filterOptions,
    setFilterOptions,
    resetFilterOptions,
    categories,
    transactions,
  } = useFinance();

  // Extract unique months from transactions for the month dropdown
  const uniqueMonths = React.useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const hasActiveFilters =
    filterOptions.search !== '' ||
    filterOptions.type !== 'all' ||
    filterOptions.categoryId !== 'all' ||
    filterOptions.month !== 'all' ||
    filterOptions.sortBy !== 'date-desc';

  return (
    <div className="ft-tx-filter-container">
      {/* Top Filter Bar */}
      <div className="ft-tx-filter-top">
        {/* Search */}
        <div className="ft-search-box">
          <Search size={18} className="ft-search-icon" />
          <input
            type="text"
            className="ft-search-input"
            placeholder="Cari berdasarkan judul, kategori, catatan, nominal..."
            value={filterOptions.search}
            onChange={(e) => setFilterOptions({ search: e.target.value })}
          />
          {filterOptions.search && (
            <button
              type="button"
              className="ft-search-clear"
              onClick={() => setFilterOptions({ search: '' })}
              aria-label="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>

        {/* Type pills: Semua, Pemasukan, Pengeluaran */}
        <div className="ft-type-pills">
          <button
            type="button"
            className={`ft-pill-btn ${filterOptions.type === 'all' ? 'active' : ''}`}
            onClick={() => setFilterOptions({ type: 'all' })}
          >
            Semua
          </button>
          <button
            type="button"
            className={`ft-pill-btn ft-pill-income ${filterOptions.type === 'income' ? 'active' : ''}`}
            onClick={() => setFilterOptions({ type: 'income' })}
          >
            Pemasukan
          </button>
          <button
            type="button"
            className={`ft-pill-btn ft-pill-expense ${filterOptions.type === 'expense' ? 'active' : ''}`}
            onClick={() => setFilterOptions({ type: 'expense' })}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Bottom Filter Controls */}
      <div className="ft-tx-filter-bottom">
        <div className="ft-filter-selects">
          {/* Custom Category Dropdown */}
          <div className="ft-filter-select-item">
            <span className="ft-filter-select-label">Kategori:</span>
            <CategoryFilterDropdown
              selectedCategoryId={filterOptions.categoryId}
              categories={categories}
              onSelectCategory={(categoryId) => setFilterOptions({ categoryId })}
              transactions={transactions}
            />
          </div>

          {/* Month Dropdown */}
          <div className="ft-filter-select-item">
            <span className="ft-filter-select-label">Bulan:</span>
            <select
              className="ft-mini-select"
              value={filterOptions.month}
              onChange={(e) => setFilterOptions({ month: e.target.value })}
            >
              <option value="all">Semua Periode</option>
              {uniqueMonths.map((ym) => {
                const [y, m] = ym.split('-');
                const monthName = MONTH_NAMES_ID[parseInt(m, 10) - 1];
                return (
                  <option key={ym} value={ym}>
                    {monthName} {y}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="ft-filter-select-item">
            <span className="ft-filter-select-label">Urutan:</span>
            <select
              className="ft-mini-select"
              value={filterOptions.sortBy}
              onChange={(e) =>
                setFilterOptions({
                  sortBy: e.target.value as TransactionFilterOptions['sortBy'],
                })
              }
            >
              <option value="date-desc">Tanggal Terbaru</option>
              <option value="date-asc">Tanggal Terlama</option>
              <option value="amount-desc">Nominal Terbesar</option>
              <option value="amount-asc">Nominal Terkecil</option>
            </select>
          </div>
        </div>

        {/* Action buttons (Reset & Export CSV) */}
        <div className="ft-filter-actions">
          {hasActiveFilters && (
            <button
              type="button"
              className="ft-filter-reset-btn"
              onClick={resetFilterOptions}
              title="Reset Filter"
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
          )}

          <button
            type="button"
            className="ft-filter-export-btn"
            onClick={onExportCsv}
            disabled={filteredCount === 0}
            title="Ekspor ke format file CSV"
          >
            <Download size={14} />
            <span>Ekspor CSV ({filteredCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
