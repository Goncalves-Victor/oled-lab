// ============================================================================
// functionDocs.ts
// ----------------------------------------------------------------------------
// Documentacao das funcoes para o painel de ajuda. Mantida separada da
// execucao (commands.ts) para ser facil de ler e expandir.
// Cada funcao tem uma CATEGORIA, usada pelos filtros do painel de ajuda.
// Para documentar um comando novo, adicione um objeto aqui.
// ============================================================================

export type DocCategory = 'Controle' | 'Formas' | 'Texto';

// Ordem em que as categorias aparecem nos filtros.
export const DOC_CATEGORIES: DocCategory[] = ['Controle', 'Formas', 'Texto'];

export interface ParamDoc {
  name: string;
  description: string;
}

export interface FunctionDoc {
  name: string;        // ex: "display.drawLine(x0, y0, x1, y1, cor)"
  category: DocCategory;
  description: string;
  params: ParamDoc[];
  example: string;
}

const COR_PARAM: ParamDoc = {
  name: 'cor',
  description: 'SSD1306_WHITE (1) acende o pixel, SSD1306_BLACK (0) apaga.',
};

export const FUNCTION_DOCS: FunctionDoc[] = [
  {
    name: 'display.clearDisplay()',
    category: 'Controle',
    description: 'Limpa o buffer interno (apaga tudo). A tela so muda no display().',
    params: [],
    example: 'display.clearDisplay();',
  },
  {
    name: 'display.display()',
    category: 'Controle',
    description: 'Copia o buffer interno para a tela visivel. So aqui o desenho aparece.',
    params: [],
    example: 'display.display();',
  },
  {
    name: 'delay(ms)',
    category: 'Controle',
    description: 'Espera o tempo indicado em milissegundos. Use entre quadros para animar.',
    params: [{ name: 'ms', description: 'Tempo de espera em milissegundos.' }],
    example: 'delay(2000);',
  },
  {
    name: 'display.drawPixel(x, y, cor)',
    category: 'Formas',
    description: 'Acende ou apaga um unico pixel. E o que a ferramenta de desenho gera.',
    params: [
      { name: 'x', description: 'Coluna do pixel (0 a largura-1).' },
      { name: 'y', description: 'Linha do pixel (0 a altura-1).' },
      COR_PARAM,
    ],
    example: 'display.drawPixel(10, 5, SSD1306_WHITE);',
  },
  {
    name: 'display.drawLine(x0, y0, x1, y1, cor)',
    category: 'Formas',
    description: 'Desenha uma linha entre dois pontos.',
    params: [
      { name: 'x0', description: 'Posicao X inicial.' },
      { name: 'y0', description: 'Posicao Y inicial.' },
      { name: 'x1', description: 'Posicao X final.' },
      { name: 'y1', description: 'Posicao Y final.' },
      COR_PARAM,
    ],
    example: 'display.drawLine(0, 0, 127, 63, SSD1306_WHITE);',
  },
  {
    name: 'display.drawRect(x, y, largura, altura, cor)',
    category: 'Formas',
    description: 'Desenha o contorno de um retangulo.',
    params: [
      { name: 'x', description: 'Canto superior esquerdo X.' },
      { name: 'y', description: 'Canto superior esquerdo Y.' },
      { name: 'largura', description: 'Largura em pixels.' },
      { name: 'altura', description: 'Altura em pixels.' },
      COR_PARAM,
    ],
    example: 'display.drawRect(5, 5, 30, 20, SSD1306_WHITE);',
  },
  {
    name: 'display.fillRect(x, y, largura, altura, cor)',
    category: 'Formas',
    description: 'Desenha um retangulo preenchido.',
    params: [
      { name: 'x', description: 'Canto superior esquerdo X.' },
      { name: 'y', description: 'Canto superior esquerdo Y.' },
      { name: 'largura', description: 'Largura em pixels.' },
      { name: 'altura', description: 'Altura em pixels.' },
      COR_PARAM,
    ],
    example: 'display.fillRect(45, 5, 30, 20, SSD1306_WHITE);',
  },
  {
    name: 'display.drawCircle(x, y, raio, cor)',
    category: 'Formas',
    description: 'Desenha o contorno de um circulo.',
    params: [
      { name: 'x', description: 'Centro X.' },
      { name: 'y', description: 'Centro Y.' },
      { name: 'raio', description: 'Raio em pixels.' },
      COR_PARAM,
    ],
    example: 'display.drawCircle(30, 45, 12, SSD1306_WHITE);',
  },
  {
    name: 'display.fillCircle(x, y, raio, cor)',
    category: 'Formas',
    description: 'Desenha um circulo preenchido.',
    params: [
      { name: 'x', description: 'Centro X.' },
      { name: 'y', description: 'Centro Y.' },
      { name: 'raio', description: 'Raio em pixels.' },
      COR_PARAM,
    ],
    example: 'display.fillCircle(85, 45, 12, SSD1306_WHITE);',
  },
  {
    name: 'display.drawRoundRect(x, y, largura, altura, raio, cor)',
    category: 'Formas',
    description: 'Contorno de retangulo com cantos arredondados (otimo para molduras/logos).',
    params: [
      { name: 'x', description: 'Canto superior esquerdo X.' },
      { name: 'y', description: 'Canto superior esquerdo Y.' },
      { name: 'largura', description: 'Largura em pixels.' },
      { name: 'altura', description: 'Altura em pixels.' },
      { name: 'raio', description: 'Raio dos cantos arredondados.' },
      COR_PARAM,
    ],
    example: 'display.drawRoundRect(2, 2, 124, 60, 8, SSD1306_WHITE);',
  },
  {
    name: 'display.fillRoundRect(x, y, largura, altura, raio, cor)',
    category: 'Formas',
    description: 'Retangulo preenchido com cantos arredondados (otimo para olhos de robo).',
    params: [
      { name: 'x', description: 'Canto superior esquerdo X.' },
      { name: 'y', description: 'Canto superior esquerdo Y.' },
      { name: 'largura', description: 'Largura em pixels.' },
      { name: 'altura', description: 'Altura em pixels.' },
      { name: 'raio', description: 'Raio dos cantos arredondados.' },
      COR_PARAM,
    ],
    example: 'display.fillRoundRect(40, 20, 18, 18, 4, SSD1306_WHITE);',
  },
  {
    name: 'display.setCursor(x, y)',
    category: 'Texto',
    description: 'Define onde o proximo texto vai comecar.',
    params: [
      { name: 'x', description: 'Posicao X do cursor de texto.' },
      { name: 'y', description: 'Posicao Y do cursor de texto.' },
    ],
    example: 'display.setCursor(10, 20);',
  },
  {
    name: 'display.setTextSize(tamanho)',
    category: 'Texto',
    description: 'Define o tamanho do texto em escala inteira (1 = normal, 2 = dobro...).',
    params: [{ name: 'tamanho', description: 'Numero inteiro: 1, 2, 3...' }],
    example: 'display.setTextSize(2);',
  },
  {
    name: 'display.print("texto")',
    category: 'Texto',
    description: 'Escreve texto na posicao do cursor SEM pular linha.',
    params: [{ name: 'texto', description: 'Texto entre aspas duplas.' }],
    example: 'display.print("Robo");',
  },
  {
    name: 'display.println("texto")',
    category: 'Texto',
    description: 'Escreve texto e DEPOIS pula uma linha.',
    params: [{ name: 'texto', description: 'Texto entre aspas duplas.' }],
    example: 'display.println("Ola!");',
  },
];
