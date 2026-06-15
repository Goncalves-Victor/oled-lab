// ============================================================================
// OledCanvas.tsx
// ----------------------------------------------------------------------------
// Desenha o quadro (frame) recebido num <canvas> ampliado. O frame e uma copia
// do buffer interno feita quando o aluno chamou display.display().
// As dimensoes (width/height) vem por props porque a tela e configuravel.
// Recursos: grade de pixels opcional e coordenadas do mouse/toque.
// ============================================================================

import { useEffect, useRef } from 'react';

interface Props {
  frame: Uint8Array;          // width*height valores 0/1
  width: number;
  height: number;
  scale: number;              // ampliacao (px por pixel do OLED)
  showGrid: boolean;
  onHover: (coord: { x: number; y: number } | null) => void;
}

export function OledCanvas({ frame, width, height, scale, showGrid, onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Redesenha sempre que o frame, o tamanho, a escala ou a grade mudarem.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = width * scale;
    const h = height * scale;
    canvas.width = w;
    canvas.height = h;

    // Fundo preto (OLED apagado).
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Pixels acesos (branco levemente azulado, como OLED real).
    ctx.fillStyle = '#e8f4ff';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (frame[y * width + x]) {
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }

    // Grade de pixels opcional.
    if (showGrid && scale >= 3) {
      ctx.strokeStyle = 'rgba(120,140,170,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        ctx.moveTo(x * scale + 0.5, 0);
        ctx.lineTo(x * scale + 0.5, h);
      }
      for (let y = 0; y <= height; y++) {
        ctx.moveTo(0, y * scale + 0.5);
        ctx.lineTo(w, y * scale + 0.5);
      }
      ctx.stroke();
    }
  }, [frame, width, height, scale, showGrid]);

  // Converte coordenada do ponteiro para coordenada do OLED.
  function reportCoord(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = Math.floor(((clientX - rect.left) / rect.width) * width);
    const py = Math.floor(((clientY - rect.top) / rect.height) * height);
    if (px < 0 || px >= width || py < 0 || py >= height) {
      onHover(null);
    } else {
      onHover({ x: px, y: py });
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="oled-canvas"
      onMouseMove={(e) => reportCoord(e.clientX, e.clientY)}
      onMouseLeave={() => onHover(null)}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) reportCoord(t.clientX, t.clientY);
      }}
      onTouchEnd={() => onHover(null)}
    />
  );
}
