// ============================================================================
// drawing.ts
// ----------------------------------------------------------------------------
// Algoritmos de desenho que escrevem SEMPRE no framebuffer (nunca direto no
// canvas). Sao portados dos algoritmos classicos usados pela Adafruit_GFX:
//   - Linha: Bresenham
//   - Circulo: ponto medio (midpoint)
//   - Retangulo arredondado: retas + arcos de circulo
// Assim o resultado visual fica bem parecido com o OLED real.
// ============================================================================

import { Framebuffer, PixelColor } from './framebuffer';

// Garante inteiro (o OLED trabalha com pixels inteiros).
const i = (n: number) => Math.round(n);

/** Linha horizontal rapida. */
export function drawFastHLine(fb: Framebuffer, x: number, y: number, w: number, color: PixelColor): void {
  for (let k = 0; k < w; k++) fb.setPixel(x + k, y, color);
}

/** Linha vertical rapida. */
export function drawFastVLine(fb: Framebuffer, x: number, y: number, h: number, color: PixelColor): void {
  for (let k = 0; k < h; k++) fb.setPixel(x, y + k, color);
}

/** Linha (Bresenham). */
export function drawLine(fb: Framebuffer, x0: number, y0: number, x1: number, y1: number, color: PixelColor): void {
  x0 = i(x0); y0 = i(y0); x1 = i(x1); y1 = i(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    fb.setPixel(x0, y0, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Contorno de retangulo. */
export function drawRect(fb: Framebuffer, x: number, y: number, w: number, h: number, color: PixelColor): void {
  drawFastHLine(fb, x, y, w, color);
  drawFastHLine(fb, x, y + h - 1, w, color);
  drawFastVLine(fb, x, y, h, color);
  drawFastVLine(fb, x + w - 1, y, h, color);
}

/** Retangulo preenchido. */
export function fillRect(fb: Framebuffer, x: number, y: number, w: number, h: number, color: PixelColor): void {
  for (let row = 0; row < h; row++) drawFastHLine(fb, x, y + row, w, color);
}

/** Contorno de circulo (ponto medio). */
export function drawCircle(fb: Framebuffer, x0: number, y0: number, r: number, color: PixelColor): void {
  r = i(r);
  let f = 1 - r;
  let ddF_x = 1;
  let ddF_y = -2 * r;
  let x = 0;
  let y = r;

  fb.setPixel(x0, y0 + r, color);
  fb.setPixel(x0, y0 - r, color);
  fb.setPixel(x0 + r, y0, color);
  fb.setPixel(x0 - r, y0, color);

  while (x < y) {
    if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
    x++; ddF_x += 2; f += ddF_x;
    fb.setPixel(x0 + x, y0 + y, color);
    fb.setPixel(x0 - x, y0 + y, color);
    fb.setPixel(x0 + x, y0 - y, color);
    fb.setPixel(x0 - x, y0 - y, color);
    fb.setPixel(x0 + y, y0 + x, color);
    fb.setPixel(x0 - y, y0 + x, color);
    fb.setPixel(x0 + y, y0 - x, color);
    fb.setPixel(x0 - y, y0 - x, color);
  }
}

/**
 * Desenha apenas alguns "cantos" de um circulo. Usado por drawRoundRect.
 * cornername e um conjunto de bits: 1=topo-esq, 2=topo-dir, 4=baixo-dir, 8=baixo-esq.
 */
function drawCircleHelper(fb: Framebuffer, x0: number, y0: number, r: number, cornername: number, color: PixelColor): void {
  let f = 1 - r;
  let ddF_x = 1;
  let ddF_y = -2 * r;
  let x = 0;
  let y = r;
  while (x < y) {
    if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
    x++; ddF_x += 2; f += ddF_x;
    if (cornername & 0x4) { fb.setPixel(x0 + x, y0 + y, color); fb.setPixel(x0 + y, y0 + x, color); }
    if (cornername & 0x2) { fb.setPixel(x0 + x, y0 - y, color); fb.setPixel(x0 + y, y0 - x, color); }
    if (cornername & 0x8) { fb.setPixel(x0 - y, y0 + x, color); fb.setPixel(x0 - x, y0 + y, color); }
    if (cornername & 0x1) { fb.setPixel(x0 - y, y0 - x, color); fb.setPixel(x0 - x, y0 - y, color); }
  }
}

/**
 * Preenche cantos/metades de circulo (usado por fillCircle e fillRoundRect).
 * corners: 1=direita, 2=esquerda. delta estica o preenchimento (cantos do roundRect).
 */
function fillCircleHelper(fb: Framebuffer, x0: number, y0: number, r: number, corners: number, delta: number, color: PixelColor): void {
  let f = 1 - r;
  let ddF_x = 1;
  let ddF_y = -2 * r;
  let x = 0;
  let y = r;
  let px = x;
  let py = y;
  delta++;
  while (x < y) {
    if (f >= 0) { y--; ddF_y += 2; f += ddF_y; }
    x++; ddF_x += 2; f += ddF_x;
    if (x < y + 1) {
      if (corners & 1) drawFastVLine(fb, x0 + x, y0 - y, 2 * y + delta, color);
      if (corners & 2) drawFastVLine(fb, x0 - x, y0 - y, 2 * y + delta, color);
    }
    if (y !== py) {
      if (corners & 1) drawFastVLine(fb, x0 + py, y0 - px, 2 * px + delta, color);
      if (corners & 2) drawFastVLine(fb, x0 - py, y0 - px, 2 * px + delta, color);
      py = y;
    }
    px = x;
  }
}

/** Circulo preenchido. */
export function fillCircle(fb: Framebuffer, x0: number, y0: number, r: number, color: PixelColor): void {
  r = i(r);
  drawFastVLine(fb, x0, y0 - r, 2 * r + 1, color);
  fillCircleHelper(fb, x0, y0, r, 3, 0, color);
}

/** Contorno de retangulo com cantos arredondados. */
export function drawRoundRect(fb: Framebuffer, x: number, y: number, w: number, h: number, r: number, color: PixelColor): void {
  const maxRadius = Math.floor(Math.min(w, h) / 2);
  const ri = Math.min(i(r), maxRadius);
  if (ri < 0) { drawRect(fb, x, y, w, h, color); return; }
  drawFastHLine(fb, x + ri, y, w - 2 * ri, color);
  drawFastHLine(fb, x + ri, y + h - 1, w - 2 * ri, color);
  drawFastVLine(fb, x, y + ri, h - 2 * ri, color);
  drawFastVLine(fb, x + w - 1, y + ri, h - 2 * ri, color);
  drawCircleHelper(fb, x + ri, y + ri, ri, 1, color);
  drawCircleHelper(fb, x + w - ri - 1, y + ri, ri, 2, color);
  drawCircleHelper(fb, x + w - ri - 1, y + h - ri - 1, ri, 4, color);
  drawCircleHelper(fb, x + ri, y + h - ri - 1, ri, 8, color);
}

/** Retangulo preenchido com cantos arredondados (retangulo central + 2 metades de circulo). */
export function fillRoundRect(fb: Framebuffer, x: number, y: number, w: number, h: number, r: number, color: PixelColor): void {
  const maxRadius = Math.floor(Math.min(w, h) / 2);
  if (r > maxRadius) r = maxRadius;
  r = i(r);
  fillRect(fb, x + r, y, w - 2 * r, h, color);
  fillCircleHelper(fb, x + w - r - 1, y + r, r, 1, h - 2 * r - 1, color);
  fillCircleHelper(fb, x + r, y + r, r, 2, h - 2 * r - 1, color);
}
