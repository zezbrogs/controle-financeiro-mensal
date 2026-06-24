import { useEffect, useMemo, useState } from 'react';
import {
  CREDIT_CARD_CATEGORY,
  addMonthsToDate,
  buildDateFromMonthDay,
  createId,
  expenseCategories,
  formatCurrency,
  incomeCategories,
  todayInputValue,
} from '../utils/finance.js';

function getDefaultDate(selectedMonth) {
  const today = new Date();
  const isCurrentMonth =
    selectedMonth.year === today.getFullYear() && selectedMonth.month === today.getMonth();

  if (isCurrentMonth) {
    return todayInputValue();
  }

  return `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
}

function getBillingDate(selectedMonth, billingDay) {
  return buildDateFromMonthDay(selectedMonth.year, selectedMonth.month, Number(billingDay));
}

function getInitialState(selectedMonth, type = 'income') {
  return {
    type,
    name: '',
    amount: '',
    date: getDefaultDate(selectedMonth),
    category: type === 'income' ? incomeCategories[0] : expenseCategories[0],
    status: type === 'income' ? 'received' : 'pending',
    note: '',
    billingDay: '',
    isInstallment: false,
    installmentCount: '2',
  };
}

export default function TransactionForm({
  onAdd,
  selectedMonth,
  cardBillingDay,
  onCardBillingDayChange,
}) {
  const [form, setForm] = useState(() => getInitialState(selectedMonth));
  const [error, setError] = useState('');

  const categories = useMemo(
    () => (form.type === 'income' ? incomeCategories : expenseCategories),
    [form.type]
  );

  const isCreditCardExpense = form.type === 'expense' && form.category === CREDIT_CARD_CATEGORY;
  const isInstallmentExpense = form.type === 'expense' && form.isInstallment;
  const installmentAmount = Number(form.amount);
  const installmentCountPreview = Number(form.installmentCount);
  const purchaseTotal =
    isInstallmentExpense && Number.isFinite(installmentAmount) && installmentAmount > 0
      ? installmentAmount * (Number.isInteger(installmentCountPreview) ? installmentCountPreview : 0)
      : 0;

  useEffect(() => {
    setForm((current) => {
      if (current.type === 'expense' && current.category === CREDIT_CARD_CATEGORY) {
        const billingDay = current.billingDay || cardBillingDay;

        if (billingDay) {
          return {
            ...current,
            billingDay,
            date: getBillingDate(selectedMonth, billingDay),
          };
        }
      }

      const [year, month] = current.date.split('-').map(Number);
      const isAlreadyInSelectedMonth = year === selectedMonth.year && month === selectedMonth.month + 1;

      if (isAlreadyInSelectedMonth) {
        return current;
      }

      return {
        ...current,
        date: getDefaultDate(selectedMonth),
      };
    });
  }, [cardBillingDay, selectedMonth]);

  const updateField = (field, value) => {
    setForm((current) => {
      if (field === 'type') {
        const nextCategories = value === 'income' ? incomeCategories : expenseCategories;
        return {
          ...current,
          type: value,
          category: nextCategories[0],
          status: value === 'income' ? 'received' : 'pending',
          billingDay: '',
          isInstallment: false,
          installmentCount: '2',
        };
      }

      if (field === 'category') {
        const billingDay = value === CREDIT_CARD_CATEGORY ? current.billingDay || cardBillingDay : '';
        const nextForm = {
          ...current,
          category: value,
          billingDay,
        };

        return billingDay ? { ...nextForm, date: getBillingDate(selectedMonth, billingDay) } : nextForm;
      }

      if (field === 'billingDay') {
        const normalizedValue = value === '' ? '' : String(Math.min(Math.max(Number(value), 1), 31));

        if (onCardBillingDayChange) {
          onCardBillingDayChange(normalizedValue);
        }

        return {
          ...current,
          billingDay: normalizedValue,
          date: normalizedValue ? getBillingDate(selectedMonth, normalizedValue) : current.date,
        };
      }

      if (field === 'isInstallment') {
        return {
          ...current,
          isInstallment: value,
          installmentCount: value ? current.installmentCount || '2' : '2',
        };
      }

      return { ...current, [field]: value };
    });
    setError('');
  };

  const buildTransactions = (amount, installmentCount, billingDay) => {
    const trimmedName = form.name.trim();
    const trimmedNote = form.note.trim();
    const groupId = installmentCount > 1 ? createId() : null;
    const totalAmount = amount * installmentCount;

    return Array.from({ length: installmentCount }, (_, index) => {
      const installmentNumber = index + 1;
      const installment = installmentCount > 1
        ? {
            groupId,
            current: installmentNumber,
            total: installmentCount,
            totalAmount,
            billingDay: billingDay || null,
          }
        : null;
      const noteParts = [
        trimmedNote,
        isCreditCardExpense && billingDay ? `Fatura dia ${billingDay}` : '',
        installment ? `Parcela ${installmentNumber} de ${installmentCount}` : '',
      ].filter(Boolean);

      return {
        type: form.type,
        name: installment ? `${trimmedName} (${installmentNumber}/${installmentCount})` : trimmedName,
        amount,
        date: installment ? addMonthsToDate(form.date, index, billingDay) : form.date,
        category: form.category,
        status: form.type === 'income' ? 'received' : form.status,
        note: noteParts.join(' - '),
        billingDay: isCreditCardExpense && billingDay ? billingDay : null,
        installment,
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    const installmentCount = isInstallmentExpense ? Number(form.installmentCount) : 1;
    const billingDay = isCreditCardExpense && form.billingDay ? Number(form.billingDay) : null;

    if (!form.name.trim() || !form.date || !form.category) {
      setError('Preencha nome, data e categoria.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }

    if (isCreditCardExpense && form.billingDay && (!billingDay || billingDay < 1 || billingDay > 31)) {
      setError('Informe um dia de fatura entre 1 e 31.');
      return;
    }

    if (isInstallmentExpense && (!Number.isInteger(installmentCount) || installmentCount < 2 || installmentCount > 120)) {
      setError('Informe uma quantidade de parcelas entre 2 e 120.');
      return;
    }

    onAdd(buildTransactions(amount, installmentCount, billingDay));

    setForm((current) => {
      const nextForm = getInitialState(selectedMonth, current.type);
      const shouldKeepCreditCard = current.type === 'expense' && current.category === CREDIT_CARD_CATEGORY;
      const billingDayToKeep = shouldKeepCreditCard ? current.billingDay || cardBillingDay : '';

      return {
        ...nextForm,
        category: current.type === 'income' ? incomeCategories[0] : current.category,
        status: current.type === 'income' ? 'received' : current.status,
        billingDay: billingDayToKeep,
        date: billingDayToKeep ? getBillingDate(selectedMonth, billingDayToKeep) : nextForm.date,
      };
    });
  };

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Lançamento</span>
          <h2 id="form-title">Cadastrar receita ou despesa</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="segmented-control" aria-label="Tipo de lançamento">
          <button
            type="button"
            className={form.type === 'income' ? 'active' : ''}
            onClick={() => updateField('type', 'income')}
          >
            Receita
          </button>
          <button
            type="button"
            className={form.type === 'expense' ? 'active' : ''}
            onClick={() => updateField('type', 'expense')}
          >
            Despesa
          </button>
        </div>

        <label>
          Nome
          <input
            type="text"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder={form.type === 'income' ? 'Ex.: Salário' : 'Ex.: Internet'}
          />
        </label>

        <div className="form-row">
          <label>
            {isInstallmentExpense ? 'Valor da parcela' : 'Valor'}
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => updateField('amount', event.target.value)}
              placeholder="0,00"
            />
          </label>
          <label>
            {form.type === 'income' ? 'Data' : 'Vencimento'}
            <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Categoria
            <select value={form.category} onChange={(event) => updateField('category', event.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          {form.type === 'expense' && (
            <label>
              Status
              <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </label>
          )}
        </div>

        {form.type === 'expense' && (
          <div className="expense-options">
            {isCreditCardExpense && (
              <label>
                Dia fixo da fatura
                <input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={form.billingDay}
                  onChange={(event) => updateField('billingDay', event.target.value)}
                  placeholder="Ex.: 10"
                />
              </label>
            )}

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.isInstallment}
                onChange={(event) => updateField('isInstallment', event.target.checked)}
              />
              Compra parcelada
            </label>

            {isInstallmentExpense && (
              <label>
                Quantidade de parcelas
                <input
                  type="number"
                  min="2"
                  max="120"
                  step="1"
                  value={form.installmentCount}
                  onChange={(event) => updateField('installmentCount', event.target.value)}
                />
              </label>
            )}

            {isInstallmentExpense && purchaseTotal > 0 && (
              <div className="purchase-total-preview">
                <span>Total da compra</span>
                <strong>{formatCurrency(purchaseTotal)}</strong>
              </div>
            )}
          </div>
        )}

        <label>
          Observação opcional
          <textarea
            value={form.note}
            onChange={(event) => updateField('note', event.target.value)}
            placeholder="Detalhes importantes sobre este lançamento"
            rows="3"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-button">
          Adicionar lançamento
        </button>
      </form>
    </section>
  );
}
