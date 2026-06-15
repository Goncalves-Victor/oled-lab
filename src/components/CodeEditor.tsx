// ============================================================================
// CodeEditor.tsx
// ----------------------------------------------------------------------------
// Editor com numeracao de linhas, ALCA DE ARRASTE por linha (reordenar) e
// DOBRA do bloco de desenho gerado pela ferramenta de lapis.
//
// Fonte da verdade = `value` (codigo COMPLETO). Quando ha um bloco de desenho
// e ele esta dobrado, a textarea mostra uma versao "visual" sem as linhas
// internas; ao editar/reordenar, reconstruimos o codigo completo reinserindo o
// bloco escondido logo apos a linha-cabecalho.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { DRAW_START_PREFIX, findDrawRegion } from '../data/drawBlock';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function CodeEditor({ value, onChange, onClear }: Props) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [folded, setFolded] = useState(true);
  const [dragLine, setDragLine] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const fullLines = value.split('\n');
  const region = findDrawRegion(fullLines);
  const hiddenCount = region ? region.end - region.start : 0;
  const isFolded = !!region && folded;

  // Quando um bloco de desenho NOVO aparece, dobra automaticamente.
  const hadRegionRef = useRef(false);
  useEffect(() => {
    const has = !!region;
    if (has && !hadRegionRef.current) setFolded(true);
    hadRegionRef.current = has;
  }, [region]);

  // Linhas mostradas na textarea (com o bloco dobrado, se for o caso).
  const visualLines = isFolded
    ? [...fullLines.slice(0, region!.start + 1), ...fullLines.slice(region!.end + 1)]
    : fullLines;

  // Mapeia indice visual -> indice real (para numerar as linhas).
  const visualToFull = (i: number) =>
    isFolded && i > region!.start ? i + hiddenCount : i;

  // Reconstroi o codigo completo a partir das linhas visuais.
  function rebuildFull(newVisual: string[]): string {
    if (!isFolded) return newVisual.join('\n');
    const headerIdx = newVisual.findIndex((l) => l.trimStart().startsWith(DRAW_START_PREFIX));
    if (headerIdx === -1) return newVisual.join('\n'); // cabecalho removido: solta o bloco
    const hidden = fullLines.slice(region!.start + 1, region!.end + 1);
    return [...newVisual.slice(0, headerIdx + 1), ...hidden, ...newVisual.slice(headerIdx + 1)].join('\n');
  }

  // ---- Edicao ----------------------------------------------------------
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(rebuildFull(e.target.value.split('\n')));
  }

  // ---- Drag de linhas --------------------------------------------------
  function handleDragStart(e: React.DragEvent, idx: number) {
    setDragLine(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== idx) setDropTarget(idx);
  }
  function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault();
    if (dragLine === null || dragLine === toIdx) return clearDrag();
    const next = [...visualLines];
    const [moved] = next.splice(dragLine, 1);
    next.splice(toIdx, 0, moved);
    onChange(rebuildFull(next));
    clearDrag();
  }
  function clearDrag() { setDragLine(null); setDropTarget(null); }

  function syncScroll(e: React.UIEvent) {
    if (gutterRef.current) gutterRef.current.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
  }

  return (
    <div className="editor-outer">
      <div className="editor-topbar">
        <button
          type="button"
          className="editor-clear-btn"
          onClick={onClear}
          title="Apagar todo o codigo e comecar do zero"
        >
          ✕ Limpar editor
        </button>
      </div>

      <div className="editor-wrap">
        {/* Gutter: alca + (seta de dobra) + numero por linha */}
        <div className="editor-gutter" ref={gutterRef}>
          {visualLines.map((_, idx) => {
            const isDragging = dragLine === idx;
            const isTarget = dropTarget === idx && dragLine !== null && dragLine !== idx;
            const above = isTarget && dragLine! > idx;
            const below = isTarget && dragLine! < idx;
            const isFoldHeader = !!region && idx === region.start;
            return (
              <div
                key={idx}
                className={
                  'gutter-line' +
                  (isDragging ? ' gutter-line-dragging' : '') +
                  (above ? ' gutter-line-drop-above' : '') +
                  (below ? ' gutter-line-drop-below' : '')
                }
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={clearDrag}
                title="Arraste para mover esta linha"
              >
                {isFoldHeader ? (
                  <button
                    type="button"
                    className="gutter-fold"
                    onClick={(ev) => { ev.stopPropagation(); setFolded((f) => !f); }}
                    title={isFolded ? 'Expandir o desenho' : 'Recolher o desenho'}
                    draggable={false}
                  >
                    {isFolded ? '▸' : '▾'}
                  </button>
                ) : (
                  <span className="gutter-grip" aria-hidden>⠿</span>
                )}
                <span className="gutter-num">{visualToFull(idx) + 1}</span>
              </div>
            );
          })}
        </div>

        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={visualLines.join('\n')}
          spellCheck={false}
          wrap="off"
          onChange={handleTextChange}
          onScroll={syncScroll}
        />
      </div>
    </div>
  );
}
