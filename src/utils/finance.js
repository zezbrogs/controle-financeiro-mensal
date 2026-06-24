export const CREDIT_CARD_CATEGORY = 'Cartão de crédito';

export const incomeCategories = ['Salário', 'Freelance', 'Vendas', 'Investimentos', 'Outros'];

export const expenseCategories = [
  'Aluguel',
  'Água',
  'Luz',
  'Internet',
  'Mercado',
  CREDIT_CARD_CATEGORY,
  'Assinaturas',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Outros',
];

export function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function normalizeDayOfMonth(day, year, month) {
  const numericDay = Number(day);

  if (!Number.isInteger(numericDay)) return null;

  return Math.min(Math.max(numericDay, 1), getDaysInMonth(year, month));
}

export function buildDateFromMonthDay(year, month, day) {
  const normalizedDay = normalizeDayOfMonth(day, year, month);
  const safeDay = normalizedDay || 1;

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

export function addMonthsToDate(date, monthsToAdd, preferredDay) {
  const [year, month, day] = date.split('-').map(Number);
  const cursor = new Date(year, month - 1, 1);
  cursor.setMonth(cursor.getMonth() + monthsToAdd);

  return buildDateFromMonthDay(
    cursor.getFullYear(),
    cursor.getMonth(),
    preferredDay || day
  );
}

export function getMonthKeyFromDate(date) {
  if (!date) return '';
  const [year, month] = date.split('-');
  return `${year}-${month}`;
}

export function getMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  });
}

export function monthName(month) {
  return new Date(2026, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value) {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)}%`;
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

export function sumTransactions(transactions) {
  return transactions.reduce((total, item) => total + Number(item.amount || 0), 0);
}

export function calculateSummary(transactions) {
  const incomes = transactions.filter((item) => item.type === 'income');
  const expenses = transactions.filter((item) => item.type === 'expense');
  const paidExpenses = expenses.filter((item) => item.status === 'paid');
  const pendingExpenses = expenses.filter((item) => item.status === 'pending');

  const totalIncome = sumTransactions(incomes);
  const totalExpenses = sumTransactions(expenses);
  const totalPaidExpenses = sumTransactions(paidExpenses);
  const totalPendingExpenses = sumTransactions(pendingExpenses);
  const currentBalance = totalIncome - totalPaidExpenses;
  const finalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (finalBalance / totalIncome) * 100 : 0;
  const amountCanSpend = Math.max(0, finalBalance);

  let status = 'neutral';
  let statusMessage = 'Você está perto de zerar o saldo';

  if (finalBalance < 0) {
    status = 'negative';
    statusMessage = 'Você fechou o mês no prejuízo';
  } else if (totalIncome > 0 && finalBalance <= totalIncome * 0.05) {
    status = 'warning';
    statusMessage = 'Você está perto de zerar o saldo';
  } else if (finalBalance > 0) {
    status = 'positive';
    statusMessage = 'Você fechou o mês no lucro';
  }

  const largestExpense = expenses.length
    ? [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
    : null;

  const categoryTotals = expenses.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.amount || 0);
    return totals;
  }, {});

  const topExpenseCategory = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)[0] || null;

  return {
    totalIncome,
    totalExpenses,
    totalPaidExpenses,
    totalPendingExpenses,
    currentBalance,
    finalBalance,
    monthlyResult: finalBalance,
    savingsRate,
    amountCanSpend,
    status,
    statusMessage,
    largestExpense,
    topExpenseCategory,
  };
}

export function getPendingAlerts(transactions, selectedMonthKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return transactions
    .filter((item) => item.type === 'expense' && item.status === 'pending')
    .map((item) => {
      const dueDate = new Date(`${item.date}T00:00:00`);
      const daysUntilDue = Math.ceil((dueDate - today) / 86400000);
      return { ...item, daysUntilDue };
    })
    .filter((item) => {
      if (!selectedMonthKey) {
        return item.daysUntilDue <= 7;
      }

      return getMonthKeyFromDate(item.date) === selectedMonthKey;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildExpenseCategoryData(transactions) {
  const totals = transactions
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function buildMonthlyEvolution(transactions, selectedMonthKey) {
  if (!selectedMonthKey) return [];

  const [selectedYear, selectedMonth] = selectedMonthKey.split('-').map(Number);
  const firstVisibleMonth = new Date(selectedYear, selectedMonth - 1, 1);
  firstVisibleMonth.setMonth(firstVisibleMonth.getMonth() - 5);

  const months = [];
  const cursor = new Date(firstVisibleMonth);

  while (months.length < 12) {
    months.push(getMonthKey(cursor.getFullYear(), cursor.getMonth()));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months.map((key) => {
    const monthTransactions = transactions.filter((item) => getMonthKeyFromDate(item.date) === key);
    const summary = calculateSummary(monthTransactions);

    return {
      monthKey: key,
      month: getMonthLabel(key),
      receitas: summary.totalIncome,
      despesas: summary.totalExpenses,
      saldo: summary.finalBalance,
    };
  });
}

export function getCategoriesForFilter(transactions) {
  const categories = new Set(transactions.map((item) => item.category).filter(Boolean));
  return [...categories].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function normalizeImportedTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];

  return transactions
    .map((item) => {
      const type = item.type === 'expense' ? 'expense' : 'income';
      const amount = Number(item.amount);

      if (!item.name || !Number.isFinite(amount) || amount <= 0 || !item.date) {
        return null;
      }

      return {
        id: item.id || createId(),
        type,
        name: String(item.name),
        amount,
        date: String(item.date),
        category: item.category || (type === 'income' ? 'Outros' : 'Outros'),
        status: type === 'expense' ? item.status === 'paid' ? 'paid' : 'pending' : 'received',
        note: item.note ? String(item.note) : '',
        billingDay: item.billingDay ? Number(item.billingDay) : null,
        installment: item.installment && typeof item.installment === 'object'
          ? {
              groupId: item.installment.groupId ? String(item.installment.groupId) : '',
              current: Number(item.installment.current) || 1,
              total: Number(item.installment.total) || 1,
              totalAmount: Number(item.installment.totalAmount) || amount * (Number(item.installment.total) || 1),
              billingDay: item.installment.billingDay ? Number(item.installment.billingDay) : null,
            }
          : null,
        createdAt: item.createdAt || new Date().toISOString(),
      };
    })
    .filter(Boolean);
}
