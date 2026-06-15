// ============================================================================
// ExamplePanel.tsx
// ----------------------------------------------------------------------------
// Lista de exemplos prontos + exemplos salvos pelo aluno. Clicar carrega o
// codigo no editor. O botao "Salvar atual" guarda o codigo do editor como um
// exemplo personalizado (que pode ser removido no X).
// ============================================================================

import { EXAMPLES, Example } from '../data/examples';

interface Props {
  custom: Example[];
  onLoad: (code: string) => void;
  onSaveCurrent: () => void;
  onDeleteCustom: (id: string) => void;
}

export function ExamplePanel({ custom, onLoad, onSaveCurrent, onDeleteCustom }: Props) {
  return (
    <div className="examples-wrap">
      <div className="examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            className="example-btn"
            onClick={() => onLoad(ex.code)}
            title={ex.animated ? 'Dica: ligue "Repetir (loop)" para animar' : undefined}
          >
            {ex.title}
            {ex.animated && <span className="example-badge">↻</span>}
          </button>
        ))}
      </div>

      <hr className="examples-divider" />

      <h4 className="examples-subtitle">Meus exemplos</h4>
      {custom.length > 0 ? (
        <div className="examples">
          {custom.map((ex) => (
            <span key={ex.id} className="example-chip">
              <button
                type="button"
                className="example-btn example-btn-custom"
                onClick={() => onLoad(ex.code)}
              >
                {ex.title}
              </button>
              <button
                type="button"
                className="example-del"
                onClick={() => onDeleteCustom(ex.id)}
                title="Remover este exemplo"
              >✕</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="examples-empty">
          Nenhum ainda. Faça um desenho e clique em "Salvar atual".
        </p>
      )}

      <button type="button" className="example-add" onClick={onSaveCurrent}>
        ➕ Salvar atual como exemplo
      </button>
    </div>
  );
}
