export default function BackupPanel({ feedback }) {
  return (
    <section className="backup-panel" aria-labelledby="backup-title">
      <div>
        <span className="eyebrow">Segurança dos dados</span>
        <h2 id="backup-title">Backup fica no menu Arquivo</h2>
        <p>
          Para manter o uso mais organizado, o fluxo de backup fica no menu superior: use
          <strong> Arquivo &gt; Salvar backup dos dados (.json)</strong> para guardar tudo e
          <strong> Arquivo &gt; Importar backup (.json)</strong> para restaurar em outro computador.
        </p>
      </div>

      <div className="backup-shortcuts" aria-label="Atalhos de backup">
        <span>Ctrl+S</span>
        <span>Ctrl+O</span>
      </div>

      {feedback?.text && <p className={`backup-feedback ${feedback.type}`}>{feedback.text}</p>}
    </section>
  );
}
