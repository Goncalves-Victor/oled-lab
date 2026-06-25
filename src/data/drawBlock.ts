// ============================================================================
// drawBlock.ts
// ----------------------------------------------------------------------------
// Bloco de codigo gerado pela ferramenta de desenho. Fica delimitado por dois
// comentarios-marcadores para que o CodeEditor saiba dobra-lo (mostrar so a
// primeira linha). Os comentarios sao ignorados pelo parser normalmente.
//
// O bloco contem APENAS os pixels que o aluno alterou na ferramenta (nao um
// redesenho completo, e SEM clearDisplay) -- assim ele fica em cima do que ja
// existia no codigo, igual ao buffer real do OLED (cumulativo).
// ============================================================================

// A primeira linha do bloco (a unica visivel quando dobrado) sempre comeca com
// este prefixo. O fim do bloco e a linha que comeca com DRAW_END.
export const DRAW_START_PREFIX = '// >>> Desenho';
export const DRAW_END = '// <<< fim do desenho';

/** Monta o bloco de desenho a partir dos pixels alterados (ligados ou apagados). */
export function buildDrawBlock(changes: Array<[number, number, 0 | 1]>): string {
  const lines: string[] = [];
  lines.push(`${DRAW_START_PREFIX} (${changes.length} pixel(s) alterado(s))`);
  for (const [x, y, color] of changes) {
    lines.push(`display.drawPixel(${x}, ${y}, ${color ? 'SSD1306_WHITE' : 'SSD1306_BLACK'});`);
  }
  lines.push('display.display();');
  lines.push(DRAW_END);
  return lines.join('\n');
}

/** Detecta a regiao do bloco de desenho num codigo (ou null se nao houver). */
export function findDrawRegion(lines: string[]): { start: number; end: number } | null {
  const start = lines.findIndex((l) => l.trimStart().startsWith(DRAW_START_PREFIX));
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i >= start && l.trimStart().startsWith(DRAW_END));
  if (end === -1) return null;
  return { start, end };
}

const PIXEL_LINE_RE = /display\.drawPixel\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(SSD1306_WHITE|SSD1306_BLACK)\s*\)/;

/** Le os pixels que o bloco de desenho ja contem (para poder mesclar com uma nova sessao). */
export function parseDrawBlock(lines: string[], region: { start: number; end: number }): Array<[number, number, 0 | 1]> {
  const out: Array<[number, number, 0 | 1]> = [];
  for (let i = region.start + 1; i < region.end; i++) {
    const m = lines[i].match(PIXEL_LINE_RE);
    if (m) out.push([Number(m[1]), Number(m[2]), m[3] === 'SSD1306_WHITE' ? 1 : 0]);
  }
  return out;
}
