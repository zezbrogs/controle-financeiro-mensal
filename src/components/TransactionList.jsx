import { useMemo, useState } from 'react';
import { formatCurrency, formatDate, getCategoriesForFilter } from '../utils/finance.js';

function getInstallmentTotal(item) {
  if (!item.installment) return 0;
  const storedTotal = Number(item.installment.totalAmount);

  if (Number.isFinite(storedTotal) && storedTotal > 0) {
    return storedTotal;
  }

  return Number(item.amount || 0) * Number(item.installment.total || 0);
}

export default function TransactionList({ transactions, onDelete, onDeleteInstallments, onToggleStatus }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');

  const categories = useMemo(() => getCategoriesForFilter(transactions), [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transactions
      .filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch) ||
          item.note?.toLowerCase().includes(normalizedSearch);
        const matchesCategory = category === 'all' || item.category === category;
        const matchesStatus = status === 'all' || item.status === status;
        const matchesType = type === 'all' || item.type === type;

        return matchesSearch && matchesCategory && matchesStatus && matchesType;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [category, search, status, transactions, type]);

  return (
    <section className="panel list-panel" aria-labelledby="list-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Movimentações</span>
          <h2 id="list-title">Receitas e despesas do mês</h2>
        </div>
        <span className="count-badge">{filteredTransactions.length}</span>
      </div>

      <div className="filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, categoria ou observação"
          aria-label="Buscar lançamentos"
        />
        <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filtrar por tipo">
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar categoria">
          <option value="all">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar status">
          <option value="all">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="received">Recebido</option>
        </select>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    {item.installment && (
                      <small>
                        Parcela {item.installment.current}/{item.installment.total}
                        {item.installment.billingDay ? ` - fatura dia ${item.installment.billingDay}` : ''}
                      </small>
                    )}
                    {item.installment && getInstallmentTotal(item) > 0 && (
                      <small className="installment-total">
                        Total da compra: {formatCurrency(getInstallmentTotal(item))}
                      </small>
                    )}
                    {item.note && <small>{item.note}</small>}
                  </td>
                  <td>{item.category}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <span className={`status-pill ${item.status}`}>
                      {item.status === 'paid' ? 'Pago' : item.status === 'pending' ? 'Pendente' : 'Recebido'}
                    </span>
                  </td>
                  <td className={item.type === 'income' ? 'money-positive' : 'money-negative'}>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </td>
                  <td>
                    <div className="row-actions">
                      {item.type === 'expense' && (
                        <button type="button" className="ghost-button" onClick={() => onToggleStatus(item.id)}>
                          {item.status === 'paid' ? 'Pendente' : 'Pago'}
                        </button>
                      )}
                      <button type="button" className="danger-button" onClick={() => onDelete(item.id)}>
                        {item.installment ? 'Excluir parcela' : 'Excluir'}
                      </button>
                      {item.installment?.groupId && (
                        <button
                          type="button"
                          className="danger-button subtle-danger-button"
                          onClick={() => onDeleteInstallments(item.installment.groupId)}
                        >
                          Excluir todas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhum lançamento encontrado</strong>
          <span>Ajuste os filtros ou cadastre uma nova receita/despesa.</span>
        </div>
      )}
    </section>
  );
}
