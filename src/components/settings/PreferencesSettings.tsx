import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Coins, Calendar, Check, Eye } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';

interface CurrencyItem {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCY_LIST: CurrencyItem[] = [
  { code: 'IDR', symbol: 'Rp', label: 'Rupiah Indonesia (Rp - IDR)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($ - USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€ - EUR)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$ - SGD)' },
  { code: 'MYR', symbol: 'RM', label: 'Ringgit Malaysia (RM - MYR)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥ - JPY)' },
];

type SupportedDateFormat = 'D MMMM YYYY' | 'DD/MM/YYYY' | 'D MMM YYYY' | 'YYYY-MM-DD';

interface DateFormatItem {
  id: SupportedDateFormat;
  label: string;
  example: string;
}

const DATE_FORMAT_LIST: DateFormatItem[] = [
  { id: 'D MMMM YYYY', label: 'Standar Indonesia', example: '22 November 2026' },
  { id: 'DD/MM/YYYY', label: 'Numerik Ringkas', example: '22/11/2026' },
  { id: 'D MMM YYYY', label: 'Bulan Singkat', example: '22 Nov 2026' },
  { id: 'YYYY-MM-DD', label: 'Format ISO', example: '2026-11-22' },
];

export const PreferencesSettings: React.FC = () => {
  const { userProfile, updateUserProfile, addToast } = useFinance();

  // Initialize from userProfile
  const initialCurrency = userProfile.currency || 'IDR';
  const [currency, setCurrency] = useState(initialCurrency);

  // Symbol automatically matches currency
  const getSymbolForCode = (code: string) => {
    const found = CURRENCY_LIST.find((c) => c.code === code);
    return found ? found.symbol : 'Rp';
  };

  const [dateFormat, setDateFormat] = useState<SupportedDateFormat>(
    (userProfile.dateFormat as SupportedDateFormat) || 'D MMMM YYYY'
  );

  const activeSymbol = getSymbolForCode(currency);

  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymbol = getSymbolForCode(currency);

    updateUserProfile({
      currency,
      currencySymbol: finalSymbol,
      dateFormat,
    });

    addToast(
      'Preferensi Berhasil Disimpan',
      `Mata uang ${currency} (${finalSymbol}) dan format tanggal berhasil diperbarui.`
    );
  };

  // Dynamic preview that updates immediately on change
  const todayStr = getTodayDateString();
  const sampleDate = formatDate(todayStr, dateFormat);
  const sampleAmount = formatCurrency(2500000, activeSymbol, currency);

  return (
    <Card
      title="Preferensi Tampilan & Mata Uang"
      subtitle="Sesuaikan mata uang utama dan format tanggal di seluruh aplikasi"
      className="ft-settings-card"
    >
      <form onSubmit={handleSubmit} className="ft-form">
        <div className="ft-form-row">
          {/* Pilihan Mata Uang */}
          <div className="ft-form-group">
            <label htmlFor="pref-currency" className="ft-label">
              Mata Uang Utama
            </label>
            <div className="ft-input-with-icon-wrap">
              <Coins size={16} className="ft-input-icon" />
              <select
                id="pref-currency"
                className="ft-select ft-input-icon-pad"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                {CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="ft-input-hint">
              Simbol otomatis: <strong>{activeSymbol}</strong>
            </span>
          </div>

          {/* Pilihan Format Tanggal */}
          <div className="ft-form-group">
            <label htmlFor="pref-dateformat" className="ft-label">
              Format Tampilan Tanggal
            </label>
            <div className="ft-input-with-icon-wrap">
              <Calendar size={16} className="ft-input-icon" />
              <select
                id="pref-dateformat"
                className="ft-select ft-input-icon-pad"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as SupportedDateFormat)}
              >
                {DATE_FORMAT_LIST.map((df) => (
                  <option key={df.id} value={df.id}>
                    {df.label} ({df.example})
                  </option>
                ))}
              </select>
            </div>
            <span className="ft-input-hint">
              Diterapkan pada seluruh tabel dan histori
            </span>
          </div>
        </div>

        {/* Compact Modern Live Preview Banner */}
        <div className="ft-pref-preview-compact">
          <div className="ft-pref-preview-title-wrap">
            <Eye size={14} className="ft-pref-preview-icon" />
            <span className="ft-pref-preview-label">Contoh Tampilan</span>
          </div>
          <div className="ft-pref-preview-chips">
            <div className="ft-pref-chip">
              <span className="ft-pref-chip-label">Nominal:</span>
              <span className="ft-pref-chip-val">{sampleAmount}</span>
            </div>
            <span className="ft-pref-chip-divider">•</span>
            <div className="ft-pref-chip">
              <span className="ft-pref-chip-label">Tanggal:</span>
              <span className="ft-pref-chip-val">{sampleDate}</span>
            </div>
          </div>
        </div>

        <div className="ft-settings-btn-wrap">
          <Button variant="primary" type="submit" leftIcon={<Check size={16} />}>
            Simpan Preferensi
          </Button>
        </div>
      </form>
    </Card>
  );
};
