/**
 * Currency & Date formatting utilities for FinTrack (Indonesian IDR locale)
 */

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Format number into currency format according to symbol/code (defaults to Indonesian Rupiah: Rp 1.500.000)
 */
export function formatCurrency(amount: number, symbol = 'Rp', currencyCode?: string): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol} 0`;
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));

  // Determine thousand separator: USD, SGD, MYR, GBP use comma; IDR, EUR use dot
  const useComma =
    currencyCode === 'USD' ||
    currencyCode === 'SGD' ||
    currencyCode === 'MYR' ||
    symbol === '$' ||
    symbol === 'S$' ||
    symbol === 'RM';
  const thousandsSeparator = useComma ? ',' : '.';

  const formatted = absVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

/**
 * Compact currency for charts or badges (e.g. 15,5 Jt, 850 Rb)
 */
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} Rb`;
  }
  return `${sign}${abs}`;
}

/**
 * Format ISO date string (YYYY-MM-DD) into Indonesian readable date
 */
export function formatDate(dateString: string, format = 'D MMMM YYYY'): string {
  if (!dateString) return '-';

  try {
    const parts = dateString.split('-');
    if (parts.length < 3) return dateString;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString;

    if (format === 'DD/MM/YYYY') {
      const dd = String(day).padStart(2, '0');
      const mm = String(month + 1).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }

    if (format === 'YYYY-MM-DD') {
      return dateString;
    }

    if (format === 'D MMM YYYY') {
      const shortMonth = MONTH_NAMES_SHORT_ID[month] || '';
      return `${day} ${shortMonth} ${year}`;
    }

    // Default: 'D MMMM YYYY'
    const monthName = MONTH_NAMES_ID[month] || '';
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g. Hari ini, Kemarin, 3 hari lalu)
 */
export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '';
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  if (dateString === todayStr) {
    return 'Hari ini';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  if (dateString === yesterdayStr) {
    return 'Kemarin';
  }

  return formatDate(dateString, 'D MMMM YYYY');
}

/**
 * Get current date as YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current month string as YYYY-MM
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
