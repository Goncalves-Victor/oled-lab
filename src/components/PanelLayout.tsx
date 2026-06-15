// ============================================================================
// PanelLayout.tsx
// ----------------------------------------------------------------------------
// Organiza os paineis (Editor, Tela OLED, Documentacao) num layout flexivel de
// COLUNAS com PILHAS. O reposicionamento e por ARRASTAR E SOLTAR: pegue um
// painel pelo cabecalho e solte sobre outro. A zona onde voce solta decide:
//   - borda ESQUERDA/DIREITA  -> vira uma nova coluna ao lado
//   - metade de CIMA/BAIXO    -> empilha acima/abaixo daquele painel
//
// As larguras das colunas tem alca de arraste. Tudo fica salvo no localStorage.
// No celular (<= 900px) vira uma coluna so (sem arrastar).
// ============================================================================

import { ReactNode, useEffect, useRef, useState } from 'react';

export interface PanelDef {
  id: string;
  title: string;
  className?: string; // classe extra (ex.: col-screen)
  children: ReactNode;
}

interface Props {
  panels: PanelDef[];
}

type Zone = 'left' | 'right' | 'above' | 'below';
type Slot = { kind: 'col'; index: number } | { kind: 'stack'; col: number; row: number };

const LS_COLUMNS = 'oledlab.layout.columns';
const LS_WIDTHS = 'oledlab.layout.colwidths';
const MIN_FR = 0.4;

export function PanelLayout({ panels }: Props) {
  const ids = panels.map((p) => p.id);
  const byId = (id: string) => panels.find((p) => p.id === id);
  const containerRef = useRef<HTMLDivElement>(null);

  // columns: lista de colunas; cada coluna e uma pilha (topo -> base) de ids.
  const [columns, setColumns] = useState<string[][]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_COLUMNS) || 'null');
      if (isValidColumns(s, ids)) return s;
    } catch { /* ignora */ }
    return ids.map((id) => [id]); // padrao: uma coluna por painel
  });

  const [widths, setWidths] = useState<number[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_WIDTHS) || 'null');
      if (Array.isArray(s) && s.every((n) => typeof n === 'number')) return s;
    } catch { /* ignora */ }
    return [1, 1.1, 0.9];
  });

  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Mantem o numero de larguras igual ao numero de colunas (equaliza quando muda).
  useEffect(() => {
    setWidths((w) => (w.length === columns.length ? w : Array(columns.length).fill(1)));
  }, [columns]);

  useEffect(() => { localStorage.setItem(LS_COLUMNS, JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem(LS_WIDTHS, JSON.stringify(widths)); }, [widths]);

  // --------------------------------------------------------------------------
  // Drag and drop
  // --------------------------------------------------------------------------
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; zone: Zone } | null>(null);

  function locate(cols: string[][], id: string) {
    for (let c = 0; c < cols.length; c++) {
      const r = cols[c].indexOf(id);
      if (r !== -1) return { c, r };
    }
    return { c: -1, r: -1 };
  }

  function zoneFromEvent(e: React.DragEvent, el: HTMLElement): Zone {
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    if (relX < 0.22) return 'left';
    if (relX > 0.78) return 'right';
    return relY < 0.5 ? 'above' : 'below';
  }

  function clearDrag() { setDragId(null); setOver(null); }

  function handleDrop(panelId: string) {
    const zone = over?.zone;
    const dragged = dragId;
    if (!dragged || !zone) return clearDrag();
    setColumns((cols) => {
      const { c, r } = locate(cols, panelId);
      if (c === -1) return cols;
      const slot: Slot =
        zone === 'left' ? { kind: 'col', index: c }
          : zone === 'right' ? { kind: 'col', index: c + 1 }
            : zone === 'above' ? { kind: 'stack', col: c, row: r }
              : { kind: 'stack', col: c, row: r + 1 };
      return applyDrop(cols, dragged, slot, locate);
    });
    clearDrag();
  }

  // Redimensiona arrastando a alca entre as colunas ci e ci+1.
  function startResize(e: React.PointerEvent, ci: number) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const totalFr = widths.reduce((s, w) => s + w, 0);
    const startX = e.clientX;
    const wa = widths[ci];
    const wb = widths[ci + 1];

    const onMove = (ev: PointerEvent) => {
      const dFr = ((ev.clientX - startX) / rect.width) * totalFr;
      let na = wa + dFr;
      let nb = wb - dFr;
      if (na < MIN_FR) { nb -= MIN_FR - na; na = MIN_FR; }
      if (nb < MIN_FR) { na -= MIN_FR - nb; nb = MIN_FR; }
      setWidths((w) => { const n = [...w]; n[ci] = na; n[ci + 1] = nb; return n; });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
  }

  // --------------------------------------------------------------------------
  // Render de um painel (cabecalho arrastavel + indicador de drop + conteudo)
  // --------------------------------------------------------------------------
  function renderPanel(id: string, draggable: boolean) {
    const p = byId(id);
    if (!p) return null;
    const showInd = draggable && dragId !== null && over?.id === id;
    return (
      <section
        className={'col' + (p.className ? ' ' + p.className : '') + (dragId === id ? ' col-dragging' : '')}
        key={id}
        onDragOver={draggable ? (e) => {
          if (!dragId) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const zone = zoneFromEvent(e, e.currentTarget);
          if (!over || over.id !== id || over.zone !== zone) setOver({ id, zone });
        } : undefined}
        onDrop={draggable ? (e) => { e.preventDefault(); handleDrop(id); } : undefined}
      >
        <div
          className="panel-head"
          draggable={draggable}
          onDragStart={draggable ? (e) => {
            setDragId(id);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', id); // Firefox precisa de algo
          } : undefined}
          onDragEnd={draggable ? clearDrag : undefined}
          title={draggable ? 'Arraste para reposicionar' : undefined}
        >
          {draggable && <span className="panel-grip" aria-hidden>⠿</span>}
          <h2 className="col-title">{p.title}</h2>
        </div>

        {p.children}

        {showInd && <div className={`drop-bar drop-bar-${over!.zone}`} />}
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // Mobile: uma coluna so, paineis na ordem de leitura (sem arrastar).
  // --------------------------------------------------------------------------
  if (mobile) {
    return (
      <div className="layout layout-mobile">
        {columns.flat().map((id) => renderPanel(id, false))}
      </div>
    );
  }

  // Desktop: grid de colunas; cada coluna empilha seus paineis.
  const template = widths.map((w) => `${w}fr`).join(' ');
  return (
    <div className="layout" ref={containerRef} style={{ gridTemplateColumns: template }}>
      {columns.map((col, ci) => (
        <div className="layout-col" key={ci}>
          {col.map((id) => renderPanel(id, true))}
          {ci < columns.length - 1 && (
            <div
              className="col-resizer"
              onPointerDown={(e) => startResize(e, ci)}
              title="Arraste para redimensionar"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Move dragId para a posicao indicada por slot. Remove o painel de onde estava
// (mantendo indices estaveis) e so depois limpa colunas vazias.
function applyDrop(
  columns: string[][],
  dragId: string,
  slot: Slot,
  locate: (cols: string[][], id: string) => { c: number; r: number },
): string[][] {
  const { c: fromCol, r: fromRow } = locate(columns, dragId);
  let cols = columns.map((col) => col.filter((x) => x !== dragId));
  if (slot.kind === 'col') {
    cols.splice(slot.index, 0, [dragId]);
  } else {
    let target = slot.row;
    if (slot.col === fromCol && fromRow < slot.row) target -= 1; // compensa a remocao acima
    const col = cols[slot.col] ?? [];
    cols[slot.col] = [...col.slice(0, target), dragId, ...col.slice(target)];
  }
  return cols.filter((col) => col.length > 0);
}

// Valida a estrutura salva: array de arrays cobrindo exatamente todos os ids.
function isValidColumns(s: unknown, ids: string[]): s is string[][] {
  if (!Array.isArray(s)) return false;
  const flat: string[] = [];
  for (const col of s) {
    if (!Array.isArray(col)) return false;
    for (const id of col) { if (typeof id !== 'string') return false; flat.push(id); }
  }
  return flat.length === ids.length && ids.every((id) => flat.includes(id));
}
