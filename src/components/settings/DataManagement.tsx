import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Download, Upload, RotateCcw, Trash2, Database, ShieldAlert } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const {
    resetToDemoData,
    clearAllData,
    exportDataToJson,
    importDataFromJson,
    transactions,
    categories,
    addToast,
  } = useFinance();

  const [isResetDemoConfirmOpen, setIsResetDemoConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Export JSON
  const handleExportJson = () => {
    try {
      const jsonStr = exportDataToJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast('Cadangan Berhasil Diunduh', 'File backup JSON berhasil disimpan.');
    } catch {
      addToast('Gagal Mengekspor', 'Terjadi kesalahan saat membuat file cadangan.', 'error');
    }
  };

  // Handle Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataFromJson(content);
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card
        title="Penyimpanan & Manajemen Data"
        subtitle="Kelola data lokal (LocalStorage), cadangkan, atau pulihkan data demo"
        className="ft-settings-card"
      >
        <div className="ft-data-stats-row">
          <div className="ft-data-stat-box">
            <Database size={16} className="ft-data-stat-icon" />
            <div>
              <span className="ft-data-stat-num">{transactions.length}</span>
              <span className="ft-data-stat-label">Total Transaksi Tersimpan</span>
            </div>
          </div>
          <div className="ft-data-stat-box">
            <Database size={16} className="ft-data-stat-icon" />
            <div>
              <span className="ft-data-stat-num">{categories.length}</span>
              <span className="ft-data-stat-label">Total Kategori Aktif</span>
            </div>
          </div>
        </div>

        <div className="ft-data-actions-grid">
          {/* Export JSON */}
          <div className="ft-data-action-card">
            <div className="ft-data-card-info">
              <h5 className="ft-data-card-title">Ekspor Cadangan (JSON)</h5>
              <p className="ft-data-card-desc">
                Simpan seluruh transaksi, kategori, dan preferensi Anda ke file JSON di komputer.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download size={15} />}
              onClick={handleExportJson}
            >
              Unduh File JSON
            </Button>
          </div>

          {/* Import JSON */}
          <div className="ft-data-action-card">
            <div className="ft-data-card-info">
              <h5 className="ft-data-card-title">Impor Cadangan (JSON)</h5>
              <p className="ft-data-card-desc">
                Pulihkan data transaksi dan kategori dari file cadangan JSON yang Anda miliki.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Upload size={15} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Pilih File Cadangan
            </Button>
          </div>

          {/* Reset Demo Data */}
          <div className="ft-data-action-card">
            <div className="ft-data-card-info">
              <h5 className="ft-data-card-title">Muat Data Demo / Sampel</h5>
              <p className="ft-data-card-desc">
                Kembalikan data transaksi contoh yang lengkap untuk kebutuhan peninjauan fitur.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw size={15} />}
              onClick={() => setIsResetDemoConfirmOpen(true)}
            >
              Muat Data Demo
            </Button>
          </div>

          {/* Clear All Data */}
          <div className="ft-data-action-card ft-danger-action-card">
            <div className="ft-data-card-info">
              <h5 className="ft-data-card-title ft-danger-text">
                <ShieldAlert size={16} /> Hapus Seluruh Data
              </h5>
              <p className="ft-data-card-desc">
                Kosongkan seluruh data transaksi dan kategori dari browser Anda. Data tidak dapat dipulihkan.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={15} />}
              onClick={() => setIsClearAllConfirmOpen(true)}
            >
              Hapus Semua Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirm Reset to Demo Data */}
      <ConfirmDialog
        isOpen={isResetDemoConfirmOpen}
        title="Muat Data Sampel Demo"
        message="Data transaksi Anda saat ini akan ditimpa dengan data sampel default FinTrack. Apakah Anda ingin melanjutkan?"
        confirmLabel="Ya, Muat Data Demo"
        variant="primary"
        onConfirm={() => {
          resetToDemoData();
          setIsResetDemoConfirmOpen(false);
        }}
        onCancel={() => setIsResetDemoConfirmOpen(false)}
      />

      {/* Confirm Clear All Data */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        title="Hapus Seluruh Data"
        message="PERINGATAN: Seluruh riwayat transaksi, kategori kustom, dan preferensi akun akan dihapus dari penyimpanan browser lokal. Anda yakin?"
        confirmLabel="Ya, Hapus Semuanya"
        variant="danger"
        onConfirm={() => {
          clearAllData();
          setIsClearAllConfirmOpen(false);
        }}
        onCancel={() => setIsClearAllConfirmOpen(false)}
      />
    </>
  );
};
