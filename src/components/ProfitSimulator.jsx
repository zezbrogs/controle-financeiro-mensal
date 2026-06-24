import { formatCurrency } from '../utils/finance.js';

export default function ProfitSimulator({ goal, onGoalChange, summary }) {
  const parsedGoal = Number(goal || 0);
  const numericGoal = Number.isFinite(parsedGoal) ? parsedGoal : 0;
  const missingToGoal = Math.max(0, numericGoal - summary.finalBalance);
  const canStillSpend = Math.max(0, summary.finalBalance - numericGoal);
  const needsSaving = numericGoal > 0 ? Math.max(0, numericGoal - summary.finalBalance) : 0;
  const isPossible = numericGoal <= 0 || summary.finalBalance >= numericGoal;

  return (
    <section className="panel simulator-panel" aria-labelledby="simulator-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Planejamento</span>
          <h2 id="simulator-title">Simulador de Lucro</h2>
        </div>
      </div>

      <label>
        Meta de lucro do mês
        <input
          type="number"
          min="0"
          step="0.01"
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
          placeholder="0,00"
        />
      </label>

      <div className={isPossible ? 'simulator-status positive' : 'simulator-status negative'}>
        <strong>{isPossible ? 'Meta possível com os lançamentos atuais' : 'Meta ainda não foi alcançada'}</strong>
        <span>
          {isPossible
            ? `Você ainda pode gastar ${formatCurrency(canStillSpend)} sem perder a meta.`
            : `Faltam ${formatCurrency(missingToGoal)} para alcançar a meta.`}
        </span>
      </div>

      <div className="simulator-grid">
        <div>
          <span>Precisa economizar</span>
          <strong>{formatCurrency(needsSaving)}</strong>
        </div>
        <div>
          <span>Ainda pode gastar</span>
          <strong>{formatCurrency(canStillSpend)}</strong>
        </div>
        <div>
          <span>Falta para a meta</span>
          <strong>{formatCurrency(missingToGoal)}</strong>
        </div>
        <div>
          <span>Saldo previsto</span>
          <strong>{formatCurrency(summary.finalBalance)}</strong>
        </div>
      </div>
    </section>
  );
}
