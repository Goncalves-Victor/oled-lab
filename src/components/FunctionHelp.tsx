// ============================================================================
// FunctionHelp.tsx
// ----------------------------------------------------------------------------
// Painel de documentacao das funcoes, com FILTROS por categoria. Cada funcao
// vira um cartao expansivel (<details>) com descricao, parametros e exemplo.
// ============================================================================

import { useMemo, useState } from 'react';
import { FUNCTION_DOCS, DOC_CATEGORIES, DocCategory } from '../data/functionDocs';

interface Props {
  // Permite "inserir exemplo no editor" ao clicar no botao do cartao.
  onInsertExample: (code: string) => void;
}

type Filter = 'Todas' | DocCategory;

export function FunctionHelp({ onInsertExample }: Props) {
  const [filter, setFilter] = useState<Filter>('Todas');

  const filtered = useMemo(
    () => (filter === 'Todas' ? FUNCTION_DOCS : FUNCTION_DOCS.filter((fn) => fn.category === filter)),
    [filter],
  );

  // Conta quantos comandos ha em cada categoria (para o badge do filtro).
  const counts = useMemo(() => {
    const c: Record<string, number> = { Todas: FUNCTION_DOCS.length };
    for (const cat of DOC_CATEGORIES) c[cat] = FUNCTION_DOCS.filter((fn) => fn.category === cat).length;
    return c;
  }, []);

  const filters: Filter[] = ['Todas', ...DOC_CATEGORIES];

  return (
    <div className="help-wrap">
      <div className="help-filters">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            className={'help-filter' + (filter === f ? ' help-filter-active' : '')}
            onClick={() => setFilter(f)}
          >
            {f} <span className="help-filter-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="help-list">
        {filtered.map((fn) => (
          <details key={fn.name} className="help-card">
            <summary className="help-summary">
              <code>{fn.name}</code>
              <span className={`help-tag help-tag-${fn.category}`}>{fn.category}</span>
            </summary>
            <div className="help-body">
              <p className="help-desc">{fn.description}</p>

              {fn.params.length > 0 && (
                <ul className="help-params">
                  {fn.params.map((p) => (
                    <li key={p.name}>
                      <strong>{p.name}</strong>: {p.description}
                    </li>
                  ))}
                </ul>
              )}

              <div className="help-example">
                <code>{fn.example}</code>
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => onInsertExample(fn.example)}
                  title="Inserir este exemplo no editor"
                >
                  inserir
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
