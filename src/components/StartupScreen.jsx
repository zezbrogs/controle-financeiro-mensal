export default function StartupScreen() {
  return (
    <div className="startup-screen" role="status" aria-live="polite">
      <div className="startup-panel">
        <div className="startup-mark">R$</div>
        <div>
          <span className="eyebrow">Controle mensal</span>
          <h1>Controle Financeiro Mensal</h1>
          <p>Do primeiro lançamento ao fechamento do mês, tudo pronto para entender o dinheiro com clareza.</p>
        </div>
        <div className="startup-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
