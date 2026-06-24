import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildExpenseCategoryData, formatCurrency } from '../utils/finance.js';

const categoryBarColors = ['#38bdf8', '#f87171', '#f59e0b', '#14b8a6', '#a855f7', '#818cf8'];

function currencyTick(value) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }

  return `R$ ${Number(value).toLocaleString('pt-BR')}`;
}

function EmptyChart({ label }) {
  return (
    <div className="empty-chart">
      <strong>Sem dados suficientes</strong>
      <span>{label}</span>
    </div>
  );
}

function balanceColor(value) {
  return Number(value) < 0 ? '#e24a4a' : '#0f9f6e';
}

function getValueTone(entry) {
  if (entry.dataKey === 'Despesas' || entry.dataKey === 'value') return 'negative';
  if (entry.dataKey === 'Receitas') return 'positive';
  if (entry.dataKey === 'saldo') return Number(entry.value) < 0 ? 'negative' : 'positive';
  return 'neutral';
}

function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.label} className={`chart-legend-item ${item.tone}`}>
          <i />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => {
        const tone = getValueTone(entry);

        return (
          <div key={`${entry.dataKey}-${entry.name}`} className={`chart-tooltip-row ${tone}`}>
            <span>{entry.name}</span>
            <b>{formatCurrency(entry.value)}</b>
          </div>
        );
      })}
    </div>
  );
}

function CategoryRanking({ data }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="category-ranking">
      {data.map((item, index) => {
        const color = categoryBarColors[index % categoryBarColors.length];
        const percent = Math.max(6, (Number(item.value || 0) / maxValue) * 100);

        return (
          <article key={item.name} className="category-rank-item" style={{ '--bar-color': color }}>
            <div className="category-rank-header">
              <strong>{item.name}</strong>
              <b>{formatCurrency(item.value)}</b>
            </div>
            <div className="category-rank-track" aria-hidden="true">
              <span style={{ width: `${percent}%` }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function Charts({ transactions, summary, monthlyEvolution }) {
  const categoryData = buildExpenseCategoryData(transactions);
  const barData = [
    {
      name: 'Mês atual',
      Receitas: summary.totalIncome,
      Despesas: summary.totalExpenses,
    },
  ];

  const hasBarData = summary.totalIncome > 0 || summary.totalExpenses > 0;
  const hasBalanceData = monthlyEvolution.some((item) => item.receitas > 0 || item.despesas > 0 || item.saldo !== 0);

  return (
    <section className="charts-section" aria-labelledby="charts-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Gráficos</span>
          <h2 id="charts-title">Evolução financeira</h2>
        </div>
      </div>

      <div className="charts-grid">
        <article className="panel chart-panel wide-chart">
          <h3>Saldo mês a mês</h3>
          {hasBalanceData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEvolution} margin={{ top: 12, right: 16, left: 4, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={currencyTick} width={84} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Legend content={<ChartLegend items={[{ label: 'Saldo', tone: 'positive' }]} />} />
                <Bar
                  className="animated-bar"
                  dataKey="saldo"
                  name="Saldo"
                  fill="#0f9f6e"
                  radius={[6, 6, 0, 0]}
                  minPointSize={4}
                  activeBar={false}
                >
                  {monthlyEvolution.map((item) => (
                    <Cell key={item.monthKey} fill={balanceColor(item.saldo)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Cadastre receitas e despesas para visualizar a evolução." />
          )}
        </article>

        <article className="panel chart-panel">
          <h3>Receitas x despesas</h3>
          {hasBarData ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={barData} margin={{ top: 12, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={currencyTick} width={84} />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Legend
                  content={
                    <ChartLegend
                      items={[
                        { label: 'Receitas', tone: 'positive' },
                        { label: 'Despesas', tone: 'negative' },
                      ]}
                    />
                  }
                />
                <Bar
                  className="animated-bar"
                  dataKey="Receitas"
                  fill="#0f9f6e"
                  radius={[6, 6, 0, 0]}
                  activeBar={false}
                />
                <Bar
                  className="animated-bar"
                  dataKey="Despesas"
                  fill="#e24a4a"
                  radius={[6, 6, 0, 0]}
                  activeBar={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Adicione lançamentos para comparar entradas e saídas." />
          )}
        </article>

        <article className="panel chart-panel">
          <h3>Ranking de gastos por categoria</h3>
          {categoryData.length > 0 ? (
            <CategoryRanking data={categoryData} />
          ) : (
            <EmptyChart label="Cadastre despesas para descobrir onde o dinheiro está indo." />
          )}
        </article>
      </div>
    </section>
  );
}
