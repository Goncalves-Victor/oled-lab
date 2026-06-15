// ============================================================================
// DrawModal.tsx
// ----------------------------------------------------------------------------
// Ferramenta de desenho: uma tela OLED em branco onde o aluno pinta pixels com
// o mouse/toque. Ao concluir, gera os comandos display.drawPixel(...) e devolve
// um BLOCO de codigo (delimitado por marcadores) para o editor mostrar dobrado.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { buildDrawBlock } from '../data/drawBlock';

interface Props {
  open: boolean;
  width: number;
  height: number;
  onFinish: (code: string) => void;
  onClose: () => void;
}

type Tool = 'pen' | 'eraser';

export function DrawModal({ open, width, height, onFinish, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Buffer local de pixels (1 = aceso). Recriado quando abre/muda tamanho.
  const bufRef = useRef<Uint8Array>(new Uint8Array(width * height));
  const [tool, setTool] = useState<Tool>('pen');
  const [, forceRender] = useState(0); // para atualizar o contador de pixels
  const paintingRef = useRef(false);

  // Escala para caber confortavelmente (~840px de largura).
  const scale = Math.max(4, Math.round(840 / width));

  // Reseta o buffer ao abrir.
  useEffect(() => {
    if (open) {
      bufRef.current = new Uint8Array(width * height);
      draw();
      forceRender((n) => n + 1);
    }
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

  const count = bufRef.current.reduce((s, v) => s + v, 0);

  function clearAll() {
    bufRef.current = new Uint8Array(width * height);
    draw();
    forceRender((n) => n + 1);
  }

  function finish() {
    const pixels: Array<[number, number]> = [];
    const buf = bufRef.current;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (buf[y * width + x]) pixels.push([x, y]);
      }
    }
    onFinish(buildDrawBlock(pixels));
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
          <span className="draw-count">{count} pixel(s)</span>
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
          <button className="btn btn-primary" onClick={finish} disabled={count === 0}>✓ Concluir e gerar codigo</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
