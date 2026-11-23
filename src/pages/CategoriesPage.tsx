import React, { useState, useMemo } from 'react';
import {
  Plus,
  Tags,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  X,
  Layers,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryModal } from '../components/categories/CategoryModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import type { Category } from '../types/finance';

export const CategoriesPage: React.FC = () => {
  const { categories, setCurrentTab } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Filter by search query
  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Separate into Expense and Income
  const expenseCategories = useMemo(
    () => searchFiltered.filter((c) => c.type === 'expense'),
    [searchFiltered]
  );

  const incomeCategories = useMemo(
    () => searchFiltered.filter((c) => c.type === 'income'),
    [searchFiltered]
  );

  const totalExpenseCount = categories.filter((c) => c.type === 'expense').length;
  const totalIncomeCount = categories.filter((c) => c.type === 'income').length;

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const hasAnyMatches =
    activeTab === 'all'
      ? expenseCategories.length > 0 || incomeCategories.length > 0
      : activeTab === 'expense'
      ? expenseCategories.length > 0
      : incomeCategories.length > 0;

  return (
    <div className="ft-page ft-categories-page">
      {/* Header */}
      <div className="ft-page-header">
        <div>
          <h2 className="ft-page-title">Kategori Keuangan</h2>
          <p className="ft-page-subtitle">
            Kelola dan kustomisasi pos pengeluaran dan sumber pemasukan untuk pelaporan yang rapi.
          </p>
        </div>

        <div className="ft-cat-header-actions">
          <Button
            variant="outline"
            leftIcon={<ArrowLeftRight size={15} />}
            onClick={() => setCurrentTab('transactions')}
          >
            Lihat Transaksi
          </Button>

          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={handleOpenAdd}>
            Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & Type Tabs */}
      <div className="ft-cat-controls-bar">
        {/* Search Box */}
        <div className="ft-cat-search-box">
          <Search size={16} className="ft-cat-search-icon" />
          <input
            type="text"
            className="ft-cat-search-input"
            placeholder="Cari nama kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="ft-cat-search-clear"
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
              aria-label="Hapus pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="ft-type-pills">
          <button
            type="button"
            className={`ft-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={14} />
            <span>Semua ({categories.length})</span>
          </button>
          <button
            type="button"
            className={`ft-pill-btn ft-pill-expense ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            <ArrowDownLeft size={14} />
            <span>Pengeluaran ({totalExpenseCount})</span>
          </button>
          <button
            type="button"
            className={`ft-pill-btn ft-pill-income ${activeTab === 'income' ? 'active' : ''}`}
            onClick={() => setActiveTab('income')}
          >
            <ArrowUpRight size={14} />
            <span>Pemasukan ({totalIncomeCount})</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<Tags size={44} />}
          title="Belum Ada Kategori"
          description="Tambahkan kategori baru untuk mulai mengelompokkan transaksi Anda."
          actionText="Tambah Kategori Baru"
          onAction={handleOpenAdd}
        />
      ) : !hasAnyMatches ? (
        <EmptyState
          icon={<Search size={40} className="ft-empty-icon-svg" />}
          title="Kategori Tidak Ditemukan"
          description={`Tidak ada kategori yang cocok dengan pencarian "${searchQuery}".`}
          actionText="Reset Pencarian"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <div className="ft-categories-sections">
          {/* Section: Pengeluaran */}
          {(activeTab === 'all' || activeTab === 'expense') && expenseCategories.length > 0 && (
            <section className="ft-cat-section">
              <div className="ft-cat-section-header">
                <div className="ft-cat-section-title-wrap">
                  <span className="ft-cat-section-icon-badge ft-badge-exp">
                    <ArrowDownLeft size={16} />
                  </span>
                  <div>
                    <h3 className="ft-cat-section-title">Kategori Pengeluaran</h3>
                    <p className="ft-cat-section-sub">
                      Pos alokasi pengeluaran dan belanja ({expenseCategories.length} kategori)
                    </p>
                  </div>
                </div>
              </div>

              <div className="ft-categories-grid">
                {expenseCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleOpenEdit}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section: Pemasukan */}
          {(activeTab === 'all' || activeTab === 'income') && incomeCategories.length > 0 && (
            <section className="ft-cat-section">
              <div className="ft-cat-section-header">
                <div className="ft-cat-section-title-wrap">
                  <span className="ft-cat-section-icon-badge ft-badge-inc">
                    <ArrowUpRight size={16} />
                  </span>
                  <div>
                    <h3 className="ft-cat-section-title">Kategori Pemasukan</h3>
                    <p className="ft-cat-section-sub">
                      Sumber pendapatan dan arus kas masuk ({incomeCategories.length} kategori)
                    </p>
                  </div>
                </div>
              </div>

              <div className="ft-categories-grid">
                {incomeCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={handleOpenEdit}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        categoryToEdit={editingCategory}
      />
    </div>
  );
};
