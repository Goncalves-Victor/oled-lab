// Gerador de exemplos ANIMADOS para o OLED Lab.
// O parser do simulador nao tem variaveis/loops, entao as animacoes precisam
// ser "desenroladas" em quadros. Este script calcula a geometria e ESCREVE o
// modulo src/data/animatedExamples.ts com cada animacao como uma string.
//
// Rode:  node scripts/gen-examples.mjs
import { writeFileSync } from 'node:fs';

const W = 128, H = 64, CX = 64, CY = 32;
const R = (x) => Math.round(x);

function make() {
  const lines = [];
  const push = (s) => lines.push(s);
  const sep = () => push('');
  const frameHeader = () => push('display.clearDisplay();');
  const frameFooter = (ms) => { push('display.display();'); if (ms != null) push(`delay(${ms});`); sep(); };
  const L = (x0, y0, x1, y1) => push(`display.drawLine(${R(x0)}, ${R(y0)}, ${R(x1)}, ${R(y1)}, SSD1306_WHITE);`);
  const poly = (pts, close = true) => {
    for (let i = 0; i < pts.length - 1; i++) L(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (close) L(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
  };
  const done = () => lines.join('\n').replace(/\n+$/, '');
  return { push, sep, frameHeader, frameFooter, L, poly, done };
}
const rot = (p, a, cx = 0, cy = 0) => {
  const c = Math.cos(a), s = Math.sin(a), x = p[0] - cx, y = p[1] - cy;
  return [cx + x * c - y * s, cy + x * s + y * c];
};

function tesseract(frames = 16, ms = 80) {
  const g = make();
  const verts = [];
  for (let i = 0; i < 16; i++) verts.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
  const edges = [];
  for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) { const d = i ^ j; if ((d & (d - 1)) === 0) edges.push([i, j]); }
  const project = (v, a) => {
    let [x, y, z, w] = v; const c = Math.cos(a), s = Math.sin(a);
    [x, w] = [x * c - w * s, x * s + w * c];
    [y, z] = [y * c - z * s, y * s + z * c];
    const k4 = 1 / (2.6 - w); let x3 = x * k4, y3 = y * k4, z3 = z * k4;
    const k3 = 1 / (3 - z3); return [x3 * k3, y3 * k3];
  };
  let maxr = 0;
  for (let f = 0; f < frames; f++) { const a = f / frames * Math.PI * 2; for (const v of verts) { const [px, py] = project(v, a); maxr = Math.max(maxr, Math.abs(px), Math.abs(py)); } }
  const scale = Math.min((W / 2 - 4) / maxr, (H / 2 - 2) / maxr);
  for (let f = 0; f < frames; f++) {
    const a = f / frames * Math.PI * 2;
    const p = verts.map((v) => { const [px, py] = project(v, a); return [CX + px * scale, CY + py * scale]; });
    g.frameHeader(); for (const [i, j] of edges) g.L(p[i][0], p[i][1], p[j][0], p[j][1]); g.frameFooter(ms);
  }
  return g.done();
}

function frog(frames = 18, ms = 70) {
  const g = make();
  const head = []; for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; head.push([Math.cos(t) * 22, Math.sin(t) * 14]); }
  const eyeL = [-11, -16], eyeR = [11, -16], pupL = [-11, -18], pupR = [11, -18];
  const mouth = [[-12, 8], [-4, 12], [4, 12], [12, 8]];
  const nostrilL = [-4, -2], nostrilR = [4, -2];
  for (let f = 0; f < frames; f++) {
    const a = f / frames * Math.PI * 2;
    g.frameHeader();
    g.poly(head.map((p) => { const q = rot(p, a); return [CX + q[0], CY + q[1]]; }));
    for (const [cx, cy] of [eyeL, eyeR]) { const q = rot([cx, cy], a); g.push(`display.drawCircle(${R(CX + q[0])}, ${R(CY + q[1])}, 6, SSD1306_WHITE);`); }
    for (const [cx, cy] of [pupL, pupR]) { const q = rot([cx, cy], a); g.push(`display.fillCircle(${R(CX + q[0])}, ${R(CY + q[1])}, 2, SSD1306_WHITE);`); }
    for (const [cx, cy] of [nostrilL, nostrilR]) { const q = rot([cx, cy], a); g.push(`display.fillCircle(${R(CX + q[0])}, ${R(CY + q[1])}, 1, SSD1306_WHITE);`); }
    g.poly(mouth.map((p) => { const q = rot(p, a); return [CX + q[0], CY + q[1]]; }), false);
    g.frameFooter(ms);
  }
  return g.done();
}

function rotatingSquare(frames = 16, ms = 70) {
  const g = make(); const s = 22; const corners = [[-s, -s], [s, -s], [s, s], [-s, s]];
  for (let f = 0; f < frames; f++) {
    const a = f / frames * Math.PI / 2;
    g.frameHeader();
    g.poly(corners.map((p) => { const q = rot(p, a); return [CX + q[0], CY + q[1]]; }));
    g.poly(corners.map((p) => { const q = rot([p[0] * 0.5, p[1] * 0.5], -a); return [CX + q[0], CY + q[1]]; }));
    g.frameFooter(ms);
  }
  return g.done();
}

function sonar(frames = 12, ms = 90) {
  const g = make();
  for (let f = 0; f < frames; f++) {
    g.frameHeader(); g.push(`display.fillCircle(${CX}, ${CY}, 2, SSD1306_WHITE);`);
    for (let k = 0; k < 3; k++) { const r = ((f + k * 4) % 12) * 2 + 4; if (r < 30) g.push(`display.drawCircle(${CX}, ${CY}, ${r}, SSD1306_WHITE);`); }
    g.frameFooter(ms);
  }
  return g.done();
}

function bouncing(frames = 24, ms = 45) {
  const g = make(); const r = 6;
  for (let f = 0; f < frames; f++) {
    const t = f / frames * Math.PI * 2;
    const x = CX + Math.sin(t) * 50, y = (H - r - 2) - Math.abs(Math.cos(t)) * 30;
    g.frameHeader();
    g.push(`display.drawLine(0, ${H - 1}, ${W - 1}, ${H - 1}, SSD1306_WHITE);`);
    g.push(`display.fillCircle(${R(x)}, ${R(y)}, ${r}, SSD1306_WHITE);`);
    g.frameFooter(ms);
  }
  return g.done();
}

const all = {
  TESSERACT: tesseract(),
  FROG_SPIN: frog(),
  ROTATING_SQUARE: rotatingSquare(),
  SONAR: sonar(),
  BOUNCING_BALL: bouncing(),
};

let out = `// ============================================================================
// animatedExamples.ts  (GERADO AUTOMATICAMENTE -- nao edite a mao)
// ----------------------------------------------------------------------------
// Animacoes longas "desenroladas" em quadros, geradas por scripts/gen-examples.mjs.
// Para regenerar:  node scripts/gen-examples.mjs
// ============================================================================
/* eslint-disable */

`;
for (const [name, code] of Object.entries(all)) {
  out += `export const ${name} = \`${code.replace(/`/g, '\\`')}\`;\n\n`;
}
writeFileSync(new URL('../src/data/animatedExamples.ts', import.meta.url), out);
console.log('animatedExamples.ts gerado. Tamanhos (linhas):');
for (const [name, code] of Object.entries(all)) console.log(` ${name}: ${code.split('\n').length}`);
