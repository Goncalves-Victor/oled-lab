// ============================================================================
// drawBlock.ts
// ----------------------------------------------------------------------------
// Bloco de codigo gerado pela ferramenta de desenho. Fica delimitado por dois
// comentarios-marcadores para que o CodeEditor saiba dobra-lo (mostrar so a
// primeira linha). Os comentarios sao ignorados pelo parser normalmente.
// ============================================================================

// A primeira linha do bloco (a unica visivel quando dobrado) sempre comeca com
// este prefixo. O fim do bloco e a linha que comeca com DRAW_END.
export const DRAW_START_PREFIX = '// >>> Desenho';
export const DRAW_END = '// <<< fim do desenho';

/** Monta o bloco de desenho a partir dos pixels acesos. */
export function buildDrawBlock(pixels: Array<[number, number]>): string {
  const lines: string[] = [];
  lines.push(`${DRAW_START_PREFIX} (${pixels.length} pixels)`);
  lines.push('display.clearDisplay();');
  for (const [x, y] of pixels) lines.push(`display.drawPixel(${x}, ${y}, SSD1306_WHITE);`);
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
