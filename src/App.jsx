import { useEffect, useMemo, useRef, useState } from 'react';
import Charts from './components/Charts.jsx';
import Dashboard from './components/Dashboard.jsx';
import InstallAppButton from './components/InstallAppButton.jsx';
import MonthSelector from './components/MonthSelector.jsx';
import ProfitSimulator from './components/ProfitSimulator.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import TransactionList from './components/TransactionList.jsx';
import {
  buildMonthlyEvolution,
  calculateSummary,
  createId,
  getMonthKey,
  getMonthKeyFromDate,
  getPendingAlerts,
  normalizeImportedTransactions,
} from './utils/finance.js';
import { CARD_BILLING_DAY_KEY, GOALS_KEY, THEME_KEY, TRANSACTIONS_KEY, useLocalStorage } from './utils/storage.js';

const initialMonth = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
};

export default function App() {
  const [transactions, setTransactions] = useLocalStorage(TRANSACTIONS_KEY, []);
  const [profitGoals, setProfitGoals] = useLocalStorage(GOALS_KEY, {});
  const [theme, setTheme] = useLocalStorage(THEME_KEY, 'light');
  const [cardBillingDay, setCardBillingDay] = useLocalStorage(CARD_BILLING_DAY_KEY, '');
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [backupFeedback, setBackupFeedback] = useState(null);
  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const fileInputRef = useRef(null);

  const monthKey = getMonthKey(selectedMonth.year, selectedMonth.month);

  const monthTransactions = useMemo(
    () => transactions.filter((item) => getMonthKeyFromDate(item.date) === monthKey),
    [monthKey, transactions]
  );

  const summary = useMemo(() => calculateSummary(monthTransactions), [monthTransactions]);
  const alerts = useMemo(() => getPendingAlerts(transactions, monthKey), [monthKey, transactions]);
  const monthlyEvolution = useMemo(
    () => buildMonthlyEvolution(transactions, monthKey),
    [monthKey, transactions]
  );

  const currentGoal = profitGoals[monthKey] || '';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const showBackupFeedback = (text, type = 'neutral') => {
    setBackupFeedback({ text, type });
  };

  useEffect(() => {
    if (!backupFeedback?.text) return undefined;

    const timer = window.setTimeout(() => setBackupFeedback(null), 3600);
    return () => window.clearTimeout(timer);
  }, [backupFeedback]);

  useEffect(() => {
    if (!isClearConfirming) return undefined;

    const timer = window.setTimeout(() => setIsClearConfirming(false), 5000);
    return () => window.clearTimeout(timer);
  }, [isClearConfirming]);

  const addTransaction = (transactionPayload) => {
    const entries = Array.isArray(transactionPayload) ? transactionPayload : [transactionPayload];
    const createdAt = new Date().toISOString();

    setTransactions((current) => [
      ...current,
      ...entries.map((transaction) => ({
        ...transaction,
        id: transaction.id || createId(),
        createdAt: transaction.createdAt || createdAt,
      })),
    ]);
  };

  const deleteTransaction = (id) => {
    const shouldDelete = window.confirm('Deseja excluir este lançamento?');
    if (!shouldDelete) return;

    setTransactions((current) => current.filter((item) => item.id !== id));
  };

  const deleteInstallmentGroup = (groupId) => {
    if (!groupId) return;

    const shouldDelete = window.confirm('Deseja excluir todas as parcelas desta compra?');
    if (!shouldDelete) return;

    setTransactions((current) => current.filter((item) => item.installment?.groupId !== groupId));
  };

  const toggleExpenseStatus = (id) => {
    setTransactions((current) =>
      current.map((item) => {
        if (item.id !== id || item.type !== 'expense') return item;
        return { ...item, status: item.status === 'paid' ? 'pending' : 'paid' };
      })
    );
  };

  const updateGoal = (value) => {
    const normalizedValue = Number(value) < 0 ? '0' : value;

    setProfitGoals((current) => ({
      ...current,
      [monthKey]: normalizedValue,
    }));
  };

  const requestClearCurrentMonth = () => {
    setIsClearConfirming(true);
  };

  const clearCurrentMonth = () => {
    setTransactions((current) => current.filter((item) => getMonthKeyFromDate(item.date) !== monthKey));
    setProfitGoals((current) => {
      const nextGoals = { ...current };
      delete nextGoals[monthKey];
      return nextGoals;
    });
    setIsClearConfirming(false);
  };

  const exportData = () => {
    const payload = {
      version: 1,
      appName: 'Controle Financeiro Mensal',
      exportedAt: new Date().toISOString(),
      transactions,
      profitGoals,
      settings: {
        cardBillingDay,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const fileName = `backup-controle-financeiro-${new Date().toISOString().slice(0, 10)}.json`;

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    showBackupFeedback(`Backup JSON gerado pelo menu Arquivo: ${fileName}`, 'success');
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const importedTransactions = normalizeImportedTransactions(parsed.transactions);

      if (!Array.isArray(parsed.transactions)) {
        throw new Error('Arquivo sem lista de transações.');
      }

      const shouldImport = window.confirm('A importação substituirá os dados atuais. Deseja continuar?');
      if (!shouldImport) return;

      setTransactions(importedTransactions);
      setProfitGoals(parsed.profitGoals && typeof parsed.profitGoals === 'object' ? parsed.profitGoals : {});
      setCardBillingDay(parsed.settings?.cardBillingDay ? String(parsed.settings.cardBillingDay) : '');
      showBackupFeedback('Backup JSON importado com sucesso pelo menu Arquivo.', 'success');
    } catch (error) {
      showBackupFeedback(`Não foi possível importar o arquivo: ${error.message}`, 'danger');
    } finally {
      event.target.value = '';
    }
  };

  useEffect(() => {
    const handleMenuExport = () => exportData();
    const handleMenuImport = () => fileInputRef.current?.click();

    window.addEventListener('finance:export-backup', handleMenuExport);
    window.addEventListener('finance:import-backup', handleMenuImport);

    return () => {
      window.removeEventListener('finance:export-backup', handleMenuExport);
      window.removeEventListener('finance:import-backup', handleMenuImport);
    };
  }, [transactions, profitGoals]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Fechamento mensal</span>
          <h1>Feche o mês no controle</h1>
          <p>
            Registre o que entrou, acompanhe cada conta e transforme o fechamento do mês em uma leitura clara:
            saldo, lucro, prejuízo, metas e evolução financeira no mesmo painel.
          </p>
        </div>

        <div className="topbar-actions">
          <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
          <div className="action-group">
            <InstallAppButton />
            <button
              type="button"
              className="ghost-button"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            </button>
            {isClearConfirming ? (
              <div className="clear-confirm-actions">
                <button type="button" className="danger-button confirm-danger-button" onClick={clearCurrentMonth}>
                  Confirmar limpeza
                </button>
                <button type="button" className="ghost-button" onClick={() => setIsClearConfirming(false)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" className="danger-button" onClick={requestClearCurrentMonth}>
                Limpar mês
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={importData}
        />
        {backupFeedback?.text && (
          <div className={`backup-toast ${backupFeedback.type}`} role="status" aria-live="polite">
            {backupFeedback.text}
          </div>
        )}

        <Dashboard summary={summary} alerts={alerts} />

        <div className="workspace-grid">
          <TransactionForm
            onAdd={addTransaction}
            selectedMonth={selectedMonth}
            cardBillingDay={cardBillingDay}
            onCardBillingDayChange={setCardBillingDay}
          />
          <ProfitSimulator goal={currentGoal} onGoalChange={updateGoal} summary={summary} />
        </div>

        <TransactionList
          transactions={monthTransactions}
          onDelete={deleteTransaction}
          onDeleteInstallments={deleteInstallmentGroup}
          onToggleStatus={toggleExpenseStatus}
        />

        <Charts transactions={monthTransactions} summary={summary} monthlyEvolution={monthlyEvolution} />
      </main>
    </div>
  );
}
