import type {
  Transaction,
  Category,
  MonthlySummary,
  CategorySummary,
  FinancialHealthInsight,
  TransactionFilterOptions,
  ChartPeriod,
  PeriodSummary,
  AnalyticsPeriod,
  MonthComparison,
  FinancialInsightItem,
  UserProfile,
} from '../types/finance';
import { MONTH_NAMES_SHORT_ID, MONTH_NAMES_ID, formatCurrency } from './formatters';

/**
 * Calculate total income, total expense, and net balance from transactions
 */
export function calculateTotals(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  }

  const balance = income - expense;
  return { income, expense, balance };
}

/**
 * Calculate dynamic period summaries for charts (7 hari, 30 hari, 6 bulan, 1 tahun)
 */
export function calculatePeriodSummaries(
  transactions: Transaction[],
  period: ChartPeriod
): PeriodSummary[] {
  if (period === '6m') {
    return calculateMonthlySummaries(transactions, 6).map((m) => ({
      key: m.key,
      label: m.label,
      fullLabel: `${m.monthName} ${m.year}`,
      income: m.income,
      expense: m.expense,
      balance: m.balance,
    }));
  }

  if (period === '1y') {
    return calculateMonthlySummaries(transactions, 12).map((m) => ({
      key: m.key,
      label: m.label,
      fullLabel: `${m.monthName} ${m.year}`,
      income: m.income,
      expense: m.expense,
      balance: m.balance,
    }));
  }

  // Determine reference date: use current date (2026-11-18)
  const now = new Date();

  if (period === '7d') {
    const days: PeriodSummary[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${day}`;
      const shortMonth = MONTH_NAMES_SHORT_ID[d.getMonth()] || '';
      const label = `${d.getDate()} ${shortMonth}`;

      const dayTxs = transactions.filter((t) => t.date === dateKey);
      const income = dayTxs
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = dayTxs
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      days.push({
        key: dateKey,
        label,
        fullLabel: `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${y}`,
        income,
        expense,
        balance: income - expense,
      });
    }
    return days;
  }

  if (period === '30d') {
    // 5 clean intervals spanning the past 30 days
    const buckets: PeriodSummary[] = [];
    for (let b = 4; b >= 0; b--) {
      const endOffset = b * 6;
      const startOffset = endOffset + 5;
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - startOffset);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - endOffset);

      const startKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

      const startLabel = `${startDate.getDate()} ${MONTH_NAMES_SHORT_ID[startDate.getMonth()]}`;
      const endLabel = `${endDate.getDate()} ${MONTH_NAMES_SHORT_ID[endDate.getMonth()]}`;
      const label = `${startLabel} - ${endLabel}`;

      const bucketTxs = transactions.filter((t) => t.date >= startKey && t.date <= endKey);
      const income = bucketTxs
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = bucketTxs
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      buckets.push({
        key: `${startKey}_${endKey}`,
        label,
        fullLabel: `Rentang ${startLabel} s/d ${endLabel}`,
        income,
        expense,
        balance: income - expense,
      });
    }
    return buckets;
  }

  return [];
}

/**
 * Group transactions by month for charts and trends (chronological order)
 */
export function calculateMonthlySummaries(transactions: Transaction[], limitMonths = 6): MonthlySummary[] {
  const map = new Map<string, { income: number; expense: number; year: number; month: number }>();

  // If transactions are empty, seed recent months
  if (transactions.length === 0) {
    const now = new Date();
    for (let i = limitMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      map.set(key, { income: 0, expense: 0, year: y, month: m });
    }
  } else {
    // Populate all unique months in transactions + ensure at least recent 4 months
    for (const tx of transactions) {
      if (!tx.date) continue;
      const [yearStr, monthStr] = tx.date.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      if (isNaN(y) || isNaN(m)) continue;
      const key = `${y}-${String(m).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, { income: 0, expense: 0, year: y, month: m });
      }

      const current = map.get(key)!;
      if (tx.type === 'income') {
        current.income += tx.amount;
      } else {
        current.expense += tx.amount;
      }
    }
  }

  // Convert map to sorted array
  const sortedKeys = Array.from(map.keys()).sort();
  // Take the most recent limitMonths
  const recentKeys = sortedKeys.slice(-limitMonths);

  return recentKeys.map((key) => {
    const data = map.get(key)!;
    const monthIndex = data.month - 1;
    const shortMonth = MONTH_NAMES_SHORT_ID[monthIndex] || '';
    const fullMonth = MONTH_NAMES_ID[monthIndex] || '';

    return {
      key,
      label: `${shortMonth} ${String(data.year).slice(-2)}`,
      monthName: fullMonth,
      year: data.year,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    };
  });
}

/**
 * Calculate category breakdown with percentage of total (income or expense)
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'income' | 'expense',
  filterMonth?: string
): CategorySummary[] {
  const filtered = transactions.filter((t) => {
    if (t.type !== type) return false;
    if (filterMonth && filterMonth !== 'all') {
      return t.date.startsWith(filterMonth);
    }
    return true;
  });

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const totalTypeAmount = filtered.reduce((acc, t) => acc + t.amount, 0);

  const statsMap = new Map<string, { total: number; count: number }>();
  filtered.forEach((t) => {
    const current = statsMap.get(t.categoryId) || { total: 0, count: 0 };
    statsMap.set(t.categoryId, {
      total: current.total + t.amount,
      count: current.count + 1,
    });
  });

  const results: CategorySummary[] = [];

  statsMap.forEach((stats, catId) => {
    const cat = categoryMap.get(catId);
    const categoryName = cat ? cat.name : 'Lainnya';
    const categoryColor = cat ? cat.color : '#94A3B8';
    const categoryIcon = cat ? cat.icon : 'Tag';
    const percentage = totalTypeAmount > 0 ? (stats.total / totalTypeAmount) * 100 : 0;

    results.push({
      categoryId: catId,
      categoryName,
      categoryColor,
      categoryIcon,
      type,
      totalAmount: stats.total,
      transactionCount: stats.count,
      percentage: Math.round(percentage * 10) / 10,
    });
  });

  // Sort descending by totalAmount
  return results.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Filter and sort transactions according to user filter options
 */
export function filterAndSortTransactions(
  transactions: Transaction[],
  categories: Category[],
  options: TransactionFilterOptions
): Transaction[] {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name.toLowerCase()));

  const searchLower = options.search.trim().toLowerCase();

  const filtered = transactions.filter((t) => {
    // Type filter
    if (options.type !== 'all' && t.type !== options.type) {
      return false;
    }

    // Category filter
    if (options.categoryId && options.categoryId !== 'all' && t.categoryId !== options.categoryId) {
      return false;
    }

    // Month filter
    if (options.month && options.month !== 'all') {
      if (!t.date.startsWith(options.month)) {
        return false;
      }
    }

    // Search query
    if (searchLower) {
      const matchTitle = t.title.toLowerCase().includes(searchLower);
      const matchNotes = t.notes ? t.notes.toLowerCase().includes(searchLower) : false;
      const catName = categoryMap.get(t.categoryId) || '';
      const matchCategory = catName.includes(searchLower);
      const matchAmount = t.amount.toString().includes(searchLower);

      if (!matchTitle && !matchNotes && !matchCategory && !matchAmount) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  return filtered.sort((a, b) => {
    switch (options.sortBy) {
      case 'date-asc':
        return a.date.localeCompare(b.date);
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'date-desc':
      default: {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    }
  });
}

/**
 * Calculate financial health insights
 */
export function calculateFinancialHealth(
  transactions: Transaction[],
  monthlyBudget: number,
  targetMonth?: string
): FinancialHealthInsight {
  const monthPrefix = targetMonth || new Date().toISOString().slice(0, 7);

  const monthTxs = transactions.filter((t) => t.date.startsWith(monthPrefix));
  const { income, expense } = calculateTotals(monthTxs);

  const savings = income - expense;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const expenseRatio = income > 0 ? Math.round((expense / income) * 100) : expense > 0 ? 100 : 0;

  if (income === 0 && expense === 0) {
    return {
      status: 'healthy',
      headline: 'Belum Ada Transaksi Bulan Ini',
      detail: 'Mulai catat pemasukan dan pengeluaran Anda untuk melihat evaluasi kondisi keuangan yang akurat.',
      savingsRate: 0,
      expenseRatio: 0,
      recommendedBudget: monthlyBudget,
    };
  }

  if (expense > income) {
    return {
      status: 'danger',
      headline: 'Defisit Anggaran! Pengeluaran Melebihi Pemasukan',
      detail: `Pengeluaran bulan ini mencapai ${expenseRatio}% dari total pemasukan. Tinjau kategori belanja non-esensial untuk mencegah pengurangan tabungan.`,
      savingsRate: Math.max(0, savingsRate),
      expenseRatio,
      recommendedBudget: monthlyBudget,
    };
  }

  if (expenseRatio > 70) {
    return {
      status: 'warning',
      headline: 'Perhatian: Rasio Pengeluaran Cukup Tinggi',
      detail: `Pengeluaran Anda memakan ${expenseRatio}% dari pemasukan. Idealnya, sisihkan minimal 20-30% pemasukan untuk tabungan & dana darurat.`,
      savingsRate,
      expenseRatio,
      recommendedBudget: monthlyBudget,
    };
  }

  return {
    status: 'healthy',
    headline: 'Kondisi Finansial Prima & Terkendali',
    detail: `Hebat! Anda berhasil menyisihkan ${savingsRate}% dari pemasukan sebagai tabungan/investasi. Arus kas bulanan sangat sehat.`,
    savingsRate,
    expenseRatio,
    recommendedBudget: monthlyBudget,
  };
}

/**
 * Filter transactions based on selected AnalyticsPeriod
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: AnalyticsPeriod,
  refDate = new Date()
): Transaction[] {
  if (period === 'all') {
    return transactions;
  }

  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed

  if (period === 'this_month') {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    return transactions.filter((t) => t.date && t.date.startsWith(monthKey));
  }

  if (period === 'last_month') {
    const prevDate = new Date(year, month - 1, 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    return transactions.filter((t) => t.date && t.date.startsWith(prevMonthKey));
  }

  if (period === '6m') {
    const startD = new Date(year, month - 5, 1);
    const startKey = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-01`;
    return transactions.filter((t) => t.date && t.date >= startKey);
  }

  if (period === '1y') {
    const startD = new Date(year, month - 11, 1);
    const startKey = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-01`;
    return transactions.filter((t) => t.date && t.date >= startKey);
  }

  return transactions;
}

/**
 * Calculate month-over-month comparison between current month and previous month
 */
export function calculateMonthOverMonthComparison(
  transactions: Transaction[],
  refDate = new Date()
): MonthComparison {
  const currentYear = refDate.getFullYear();
  const currentMonthIdx = refDate.getMonth();

  const thisMonthKey = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
  const thisMonthName = MONTH_NAMES_ID[currentMonthIdx] || 'Bulan Ini';

  const lastMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthIdx = lastMonthDate.getMonth();
  const lastMonthKey = `${lastMonthYear}-${String(lastMonthIdx + 1).padStart(2, '0')}`;
  const lastMonthName = MONTH_NAMES_ID[lastMonthIdx] || 'Bulan Lalu';

  const thisMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(thisMonthKey));
  const lastMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(lastMonthKey));

  const thisTotals = calculateTotals(thisMonthTxs);
  const lastTotals = calculateTotals(lastMonthTxs);

  // Income Comparison
  const incomeDiff = thisTotals.income - lastTotals.income;
  const incomeChangePct =
    lastTotals.income > 0
      ? Math.round((incomeDiff / lastTotals.income) * 100)
      : thisTotals.income > 0
      ? 100
      : 0;

  // Expense Comparison
  const expenseDiff = thisTotals.expense - lastTotals.expense;
  const expenseChangePct =
    lastTotals.expense > 0
      ? Math.round((expenseDiff / lastTotals.expense) * 100)
      : thisTotals.expense > 0
      ? 100
      : 0;

  // Net Cash Flow Comparison
  const netDiff = thisTotals.balance - lastTotals.balance;

  const hasData = thisMonthTxs.length > 0 || lastMonthTxs.length > 0;

  return {
    hasData,
    thisMonthKey,
    thisMonthName,
    lastMonthKey,
    lastMonthName,
    income: {
      current: thisTotals.income,
      previous: lastTotals.income,
      diff: incomeDiff,
      changePct: incomeChangePct,
      isIncrease: incomeDiff >= 0,
    },
    expense: {
      current: thisTotals.expense,
      previous: lastTotals.expense,
      diff: expenseDiff,
      changePct: expenseChangePct,
      isIncrease: expenseDiff >= 0,
    },
    netCashFlow: {
      current: thisTotals.balance,
      previous: lastTotals.balance,
      diff: netDiff,
      isPositive: thisTotals.balance >= 0,
    },
  };
}

/**
 * Generate automated, data-driven financial insights based on real user transaction data
 */
export function generateFinancialInsights(
  transactions: Transaction[],
  categories: Category[],
  monthComparison: MonthComparison,
  userProfile: UserProfile
): FinancialInsightItem[] {
  const insights: FinancialInsightItem[] = [];
  const currencySymbol = userProfile.currencySymbol || 'Rp';

  // 1. Kategori Pengeluaran Terbesar
  const expenseBreakdown = calculateCategoryBreakdown(transactions, categories, 'expense');
  const topExpense = expenseBreakdown[0];

  if (topExpense && topExpense.totalAmount > 0) {
    const isDominant = topExpense.percentage >= 40;
    insights.push({
      id: 'insight-top-expense',
      type: isDominant ? 'warning' : 'info',
      title: 'Kategori Pengeluaran Terbesar',
      headline: `${topExpense.categoryName} (${topExpense.percentage}%)`,
      detail: `Pos belanja ${topExpense.categoryName} memakan proporsi terbesar senilai ${formatCurrency(topExpense.totalAmount, currencySymbol)} dari total pengeluaran periode ini (${topExpense.transactionCount} transaksi).`,
      badge: `${topExpense.percentage}% dari Pengeluaran`,
    });
  } else {
    insights.push({
      id: 'insight-top-expense',
      type: 'neutral',
      title: 'Kategori Pengeluaran Terbesar',
      headline: 'Belum Ada Pengeluaran',
      detail: 'Belum ada catatan pengeluaran tercatat pada periode yang dipilih.',
    });
  }

  // 2. Perubahan Pengeluaran Antarbulan
  const expComp = monthComparison.expense;
  if (!monthComparison.hasData || (expComp.current === 0 && expComp.previous === 0)) {
    insights.push({
      id: 'insight-expense-trend',
      type: 'neutral',
      title: 'Tren Pengeluaran Bulanan',
      headline: 'Belum Ada Data Antarbulan',
      detail: 'Catat transaksi belanja bulanan Anda secara berkala untuk memantau perbandingan tren pengeluaran.',
    });
  } else if (expComp.previous === 0) {
    insights.push({
      id: 'insight-expense-trend',
      type: 'info',
      title: 'Perubahan Pengeluaran',
      headline: `Total ${formatCurrency(expComp.current, currencySymbol)} Bulan Ini`,
      detail: `Pengeluaran bulan ${monthComparison.thisMonthName} tercatat ${formatCurrency(expComp.current, currencySymbol)}. Perbandingan tren otomatis aktif di bulan berikutnya.`,
      badge: 'Bulan Pertama',
    });
  } else if (expComp.isIncrease && expComp.changePct > 0) {
    insights.push({
      id: 'insight-expense-trend',
      type: 'warning',
      title: 'Perubahan Pengeluaran',
      headline: `Naik +${expComp.changePct}% vs ${monthComparison.lastMonthName}`,
      detail: `Pengeluaran bulan ini bertambah ${formatCurrency(expComp.diff, currencySymbol)} dibandingkan bulan lalu. Periksa pos pengeluaran non-esensial untuk penghematan.`,
      badge: `+${expComp.changePct}%`,
    });
  } else if (!expComp.isIncrease && expComp.changePct < 0) {
    insights.push({
      id: 'insight-expense-trend',
      type: 'positive',
      title: 'Perubahan Pengeluaran',
      headline: `Hemat ${Math.abs(expComp.changePct)}% vs ${monthComparison.lastMonthName}`,
      detail: `Pengeluaran bulan ini berhasil ditekan hemat ${formatCurrency(Math.abs(expComp.diff), currencySymbol)} dibandingkan bulan lalu. Pola konsumsi sangat terkendali.`,
      badge: `-${Math.abs(expComp.changePct)}%`,
    });
  } else {
    insights.push({
      id: 'insight-expense-trend',
      type: 'info',
      title: 'Perubahan Pengeluaran',
      headline: 'Pengeluaran Stabil (0%)',
      detail: `Total pengeluaran bulan ini setara dengan total pengeluaran bulan ${monthComparison.lastMonthName}.`,
      badge: 'Stabil',
    });
  }

  // 3. Perkembangan Tabungan & Arus Kas Bersih
  const totals = calculateTotals(transactions);
  const savingsRate = totals.income > 0 ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0;

  if (totals.income === 0 && totals.expense === 0) {
    insights.push({
      id: 'insight-savings-growth',
      type: 'neutral',
      title: 'Rasio Tabungan & Arus Kas',
      headline: 'Saldo Bersih Rp0',
      detail: 'Mulai catat pemasukan dan pengeluaran Anda untuk melihat analisis perkembangan tabungan otomatis.',
    });
  } else if (totals.balance > 0) {
    insights.push({
      id: 'insight-savings-growth',
      type: 'positive',
      title: 'Perkembangan Tabungan',
      headline: `Surplus Kas ${formatCurrency(totals.balance, currencySymbol)} (${savingsRate}%)`,
      detail: `Hebat! Anda berhasil mengalokasikan ${savingsRate}% dari pemasukan sebagai saldo tabungan surplus setelah seluruh pengeluaran dipenuhi.`,
      badge: `${savingsRate}% Tersimpan`,
    });
  } else if (totals.balance < 0) {
    insights.push({
      id: 'insight-savings-growth',
      type: 'warning',
      title: 'Perkembangan Tabungan',
      headline: `Defisit Kas ${formatCurrency(Math.abs(totals.balance), currencySymbol)}`,
      detail: `Pengeluaran melebihi pemasukan pada periode ini. Tinjau kembali target tabungan dan batasi belanja non-prioritas.`,
      badge: 'Defisit Kas',
    });
  } else {
    insights.push({
      id: 'insight-savings-growth',
      type: 'info',
      title: 'Rasio Tabungan & Arus Kas',
      headline: 'Imbang (Break-Even)',
      detail: 'Total pemasukan dan pengeluaran sama besar pada periode ini, tidak ada surplus maupun defisit.',
      badge: '0% Surplus',
    });
  }

  // 4. Rata-rata Nominal Transaksi
  if (transactions.length > 0) {
    const avgAmount = Math.round(transactions.reduce((acc, t) => acc + t.amount, 0) / transactions.length);
    insights.push({
      id: 'insight-avg-transaction',
      type: 'info',
      title: 'Rata-rata Nominal Transaksi',
      headline: `${formatCurrency(avgAmount, currencySymbol)} / transaksi`,
      detail: `Nilai rata-rata dihitung dari keseluruhan ${transactions.length} catatan transaksi yang terjadi pada periode aktif.`,
      badge: `${transactions.length} Transaksi`,
    });
  } else {
    insights.push({
      id: 'insight-avg-transaction',
      type: 'neutral',
      title: 'Rata-rata Nominal Transaksi',
      headline: 'Rp0',
      detail: 'Belum ada transaksi pada periode yang dipilih.',
    });
  }

  return insights;
}
