import { formatCurrency, formatDate, formatPercent } from '../utils/finance.js';

function MetricCard({ label, value, tone = 'neutral', helper }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}

export default function Dashboard({ summary, alerts }) {
  const balanceTone = summary.finalBalance > 0 ? 'positive' : summary.finalBalance < 0 ? 'negative' : 'warning';
  const currentTone = summary.currentBalance >= 0 ? 'positive' : 'negative';

  return (
    <section className="dashboard-section" aria-labelledby="dashboard-title">
      <div className={`status-banner ${summary.status}`}>
        <div>
          <p id="dashboard-title">{summary.statusMessage}</p>
          <strong>{formatCurrency(summary.finalBalance)}</strong>
        </div>
        <span>{formatPercent(summary.savingsRate)} de economia</span>
      </div>

      <div className="metric-grid">
        <MetricCard label="Receita total do mês" value={formatCurrency(summary.totalIncome)} tone="positive" />
        <MetricCard label="Despesa total do mês" value={formatCurrency(summary.totalExpenses)} tone="negative" />
        <MetricCard label="Saldo final previsto" value={formatCurrency(summary.finalBalance)} tone={balanceTone} />
        <MetricCard label="Lucro ou prejuízo" value={formatCurrency(summary.monthlyResult)} tone={balanceTone} />
        <MetricCard label="Porcentagem de economia" value={formatPercent(summary.savingsRate)} tone={balanceTone} />
        <MetricCard label="Saldo atual" value={formatCurrency(summary.currentBalance)} tone={currentTone} />
      </div>

      <div className="insight-grid">
        <div className="insight-panel">
          <span>Despesas pagas</span>
          <strong>{formatCurrency(summary.totalPaidExpenses)}</strong>
        </div>
        <div className="insight-panel">
          <span>Despesas pendentes</span>
          <strong>{formatCurrency(summary.totalPendingExpenses)}</strong>
        </div>
        <div className="insight-panel">
          <span>Ainda pode gastar</span>
          <strong>{formatCurrency(summary.amountCanSpend)}</strong>
        </div>
        <div className="insight-panel">
          <span>Maior gasto</span>
          <strong>{summary.largestExpense ? formatCurrency(summary.largestExpense.amount) : 'Sem gastos'}</strong>
          {summary.largestExpense && <small>{summary.largestExpense.name}</small>}
        </div>
        <div className="insight-panel">
          <span>Categoria que mais consumiu</span>
          <strong>{summary.topExpenseCategory?.category || 'Sem dados'}</strong>
          {summary.topExpenseCategory && <small>{formatCurrency(summary.topExpenseCategory.amount)}</small>}
        </div>
      </div>

      <div className="pending-alerts">
        <div className="section-heading inline-heading">
          <div>
            <span className="eyebrow">Atenção</span>
            <h2>Contas pendentes do mês</h2>
          </div>
        </div>
        {alerts.length > 0 ? (
          <div className="alert-list">
            {alerts.slice(0, 4).map((alert) => (
              <article key={alert.id} className={alert.daysUntilDue < 0 ? 'alert-item overdue' : 'alert-item'}>
                <div>
                  <strong>{alert.name}</strong>
                  <span>
                    {alert.daysUntilDue < 0
                      ? `Vencida há ${Math.abs(alert.daysUntilDue)} dia(s)`
                      : alert.daysUntilDue === 0
                        ? 'Vence hoje'
                        : `Vence em ${alert.daysUntilDue} dia(s)`}
                  </span>
                </div>
                <span>
                  {formatDate(alert.date)} · {formatCurrency(alert.amount)}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">Nenhuma conta pendente para este mês.</p>
        )}
      </div>
    </section>
  );
}
