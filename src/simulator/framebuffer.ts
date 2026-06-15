// ============================================================================
// framebuffer.ts
// ----------------------------------------------------------------------------
// O Framebuffer e o "buffer interno" da tela OLED, exatamente como acontece
// na biblioteca Adafruit_SSD1306 real: todos os comandos de desenho escrevem
// AQUI primeiro. A tela visivel (Canvas) so e atualizada quando o aluno chama
// display.display(). Por isso o buffer e separado da renderizacao.
//
// As dimensoes sao configuraveis (128x64, 128x32 ou personalizado) -- por isso
// width/height vem pelo construtor. OLED_WIDTH/OLED_HEIGHT sao apenas o padrao.
// ============================================================================

export const OLED_WIDTH = 128;
export const OLED_HEIGHT = 64;

// 0 = pixel apagado (preto), 1 = pixel aceso (branco)
export type PixelColor = 0 | 1;

export class Framebuffer {
  readonly width: number;
  readonly height: number;

  // 1 byte por pixel. Simples de ler/escrever e suficiente para fins didaticos.
  data: Uint8Array;

  constructor(width: number = OLED_WIDTH, height: number = OLED_HEIGHT) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height);
  }

  /** Liga ou desliga um pixel. Pixels fora da tela sao ignorados (nao quebra). */
  setPixel(x: number, y: number, color: PixelColor): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.data[y * this.width + x] = color;
  }

  /** Le o estado de um pixel (0 ou 1). Fora da tela retorna 0. */
  getPixel(x: number, y: number): PixelColor {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
    return this.data[y * this.width + x] as PixelColor;
  }

  /** Limpa todo o buffer (equivalente a display.clearDisplay()). */
  clear(): void {
    this.data.fill(0);
  }

  /** Retorna uma copia independente do buffer (usada para enviar a tela). */
  snapshot(): Uint8Array {
    return this.data.slice();
  }
}
