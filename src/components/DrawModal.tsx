// ============================================================================
// DrawModal.tsx
// ----------------------------------------------------------------------------
// Ferramenta de desenho: abre com a tela OLED como esta AGORA (o que o codigo
// do editor ja desenha), para o aluno continuar/ajustar por cima. Ao concluir,
// devolve so os pixels que ele alterou nesta sessao (x, y, cor) -- quem decide
// como mesclar isso com o bloco de desenho ja existente no codigo e o App.tsx
// (precisa do codigo atual, que este modal nao tem).
// ============================================================================

import { useEffect, useRef, useState } from 'react';

export type PixelChange = [number, number, 0 | 1];

interface Props {
  open: boolean;
  width: number;
  height: number;
  initialFrame: Uint8Array; // tela atual (o que o codigo do editor ja desenha)
  onFinish: (changes: PixelChange[]) => void;
  onClose: () => void;
}

type Tool = 'pen' | 'eraser';

export function DrawModal({ open, width, height, initialFrame, onFinish, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Buffer local de pixels (1 = aceso), comeca igual a tela atual.
  const bufRef = useRef<Uint8Array>(new Uint8Array(width * height));
  // Copia "antes" da sessao, usada so para calcular o que mudou ao concluir.
  const baseRef = useRef<Uint8Array>(new Uint8Array(width * height));
  const [tool, setTool] = useState<Tool>('pen');
  const [, forceRender] = useState(0); // para atualizar o contador de pixels
  const paintingRef = useRef(false);

  // Escala para caber confortavelmente (~840px de largura).
  const scale = Math.max(4, Math.round(840 / width));

  // Carrega a tela atual como ponto de partida ao abrir.
  useEffect(() => {
    if (open) {
      const expected = width * height;
      const src = initialFrame.length === expected ? initialFrame : new Uint8Array(expected);
      bufRef.current = Uint8Array.from(src);
      baseRef.current = Uint8Array.from(src);
      draw();
      forceRender((n) => n + 1);
    }
    // Nao inclui initialFrame nas deps: queremos capturar a tela so no instante
    // em que o modal abre, sem resetar o desenho do aluno se o quadro mudar
    // (ex: uma animacao rodando) enquanto a ferramenta estiver aberta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, width, height]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = width * scale, h = height * scale;
    canvas.width = w; canvas.height = h;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#e8f4ff';
    const buf = bufRef.current;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (buf[y * width + x]) ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }

    // Grade sempre visivel (ajuda a desenhar).
    ctx.strokeStyle = 'rgba(120,140,170,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) { ctx.moveTo(x * scale + 0.5, 0); ctx.lineTo(x * scale + 0.5, h); }
    for (let y = 0; y <= height; y++) { ctx.moveTo(0, y * scale + 0.5); ctx.lineTo(w, y * scale + 0.5); }
    ctx.stroke();
  }

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * height);
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    bufRef.current[y * width + x] = tool === 'pen' ? 1 : 0;
    draw();
    forceRender((n) => n + 1);
  }

  if (!open) return null;

  // So os pixels que mudaram em relacao a tela de quando o modal abriu.
  function computeChanges(): PixelChange[] {
    const buf = bufRef.current;
    const base = baseRef.current;
    const changes: PixelChange[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (buf[i] !== base[i]) changes.push([x, y, buf[i] as 0 | 1]);
      }
    }
    return changes;
  }
  const changedCount = computeChanges().length;

  function clearAll() {
    bufRef.current = new Uint8Array(width * height);
    draw();
    forceRender((n) => n + 1);
  }

  function finish() {
    const changes = computeChanges();
    if (changes.length > 0) onFinish(changes);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-draw" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">✏️ Desenhar na tela</h2>
          <button className="modal-close" onClick={onClose} title="Fechar">✕</button>
        </div>

        <div className="draw-tools">
          <button className={'btn' + (tool === 'pen' ? ' btn-primary' : '')} onClick={() => setTool('pen')}>✏️ Lapis</button>
          <button className={'btn' + (tool === 'eraser' ? ' btn-primary' : '')} onClick={() => setTool('eraser')}>🩹 Borracha</button>
          <button className="btn" onClick={clearAll}>🗑 Limpar</button>
          <span className="draw-count">{changedCount} alteracao(oes)</span>
        </div>

        <div className="draw-canvas-box">
          <canvas
            ref={canvasRef}
            className="draw-canvas"
            onPointerDown={(e) => { paintingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); paintAt(e.clientX, e.clientY); }}
            onPointerMove={(e) => { if (paintingRef.current) paintAt(e.clientX, e.clientY); }}
            onPointerUp={() => { paintingRef.current = false; }}
            onPointerLeave={() => { paintingRef.current = false; }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={finish} disabled={changedCount === 0}>✓ Concluir e gerar codigo</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
