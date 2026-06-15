// ============================================================================
// commands.ts
// ----------------------------------------------------------------------------
// REGISTRY de comandos do simulador. Cada comando sabe como se EXECUTAR sobre
// o contexto (framebuffer + cursor + tamanho de texto). Para adicionar um
// comando novo no futuro (ex: display.drawTriangle), basta acrescentar uma
// entrada aqui e a documentacao em data/functionDocs.ts -- nada mais muda.
//
// Os comandos especiais display.display() e delay() devolvem um "sinal de
// controle" para o runner saber quando desenhar um quadro ou pausar.
// ============================================================================

import { Framebuffer, PixelColor } from './framebuffer';
import {
  drawLine,
  drawRect,
  fillRect,
  drawCircle,
  fillCircle,
  drawRoundRect,
  fillRoundRect,
} from './drawing';
import { drawChar, CHAR_WIDTH, CHAR_HEIGHT } from './textFont';
import { OLED_WIDTH, OLED_HEIGHT } from './framebuffer';

/** Estado mutavel compartilhado durante a execucao do programa do aluno. */
export interface ExecContext {
  fb: Framebuffer;
  cursor: { x: number; y: number };
  textSize: number;
  textColor: PixelColor; // padrao 1 (branco). Reservado para setTextColor futuro.
  strokeWidth: number;   // espessura do traco (1 = padrao, igual ao hardware)
}

/** Sinal opcional que um comando devolve ao runner. */
export type ControlSignal =
  | { kind: 'render' }          // display.display() -> copiar buffer para a tela
  | { kind: 'delay'; ms: number } // delay(ms) -> pausar a execucao
  | void;                        // comando normal de desenho

/** Definicao de um comando no registry. */
export interface Command {
  name: string;
  /** Quantidade esperada de argumentos (para mensagens de erro amigaveis). */
  argCount: number;
  execute(ctx: ExecContext, args: (number | string)[]): ControlSignal;
}

// Helper: converte argumento para numero com seguranca.
const num = (v: number | string): number => (typeof v === 'number' ? v : Number(v));
// Helper: converte argumento de cor para 0/1.
const col = (v: number | string): PixelColor => (num(v) ? 1 : 0);

/** Cria um novo contexto de execucao "zerado" no tamanho de tela indicado. */
export function createContext(width: number = OLED_WIDTH, height: number = OLED_HEIGHT): ExecContext {
  return {
    fb: new Framebuffer(width, height),
    cursor: { x: 0, y: 0 },
    textSize: 1,
    textColor: 1,
    strokeWidth: 1,
  };
}

// ----------------------------------------------------------------------------
// Funcao interna de escrita de texto (usada por print e println).
// Imita a Adafruit_GFX: avanca o cursor 6*size por caractere e, no '\n',
// volta x para 0 e desce y em 8*size.
// ----------------------------------------------------------------------------
function writeText(ctx: ExecContext, text: string): void {
  const size = ctx.textSize;
  for (const ch of text) {
    if (ch === '\n') {
      ctx.cursor.x = 0;
      ctx.cursor.y += CHAR_HEIGHT * size;
      continue;
    }
    // Quebra de linha automatica ao chegar na borda direita (wrap = true).
    if (ctx.cursor.x + CHAR_WIDTH * size > ctx.fb.width) {
      ctx.cursor.x = 0;
      ctx.cursor.y += CHAR_HEIGHT * size;
    }
    drawChar(ctx.fb, ctx.cursor.x, ctx.cursor.y, ch, ctx.textColor, size);
    ctx.cursor.x += CHAR_WIDTH * size;
  }
}

// ----------------------------------------------------------------------------
// O REGISTRY em si.
// ----------------------------------------------------------------------------
export const COMMANDS: Record<string, Command> = {
  'display.clearDisplay': {
    name: 'display.clearDisplay',
    argCount: 0,
    execute(ctx) {
      ctx.fb.clear();
    },
  },

  'display.display': {
    name: 'display.display',
    argCount: 0,
    execute() {
      // Sinaliza para o runner copiar o buffer interno para a tela visivel.
      return { kind: 'render' };
    },
  },

  delay: {
    name: 'delay',
    argCount: 1,
    execute(_ctx, args) {
      return { kind: 'delay', ms: Math.max(0, num(args[0])) };
    },
  },

  'display.setStrokeWidth': {
    name: 'display.setStrokeWidth',
    argCount: 1,
    execute(ctx, a) {
      ctx.strokeWidth = Math.max(1, Math.floor(num(a[0])));
    },
  },

  'display.drawPixel': {
    name: 'display.drawPixel',
    argCount: 3,
    execute(ctx, a) {
      ctx.fb.setPixel(num(a[0]), num(a[1]), col(a[2]));
    },
  },

  'display.drawLine': {
    name: 'display.drawLine',
    argCount: 5,
    execute(ctx, a) {
      drawLine(ctx.fb, num(a[0]), num(a[1]), num(a[2]), num(a[3]), col(a[4]), ctx.strokeWidth);
    },
  },

  'display.drawRect': {
    name: 'display.drawRect',
    argCount: 5,
    execute(ctx, a) {
      drawRect(ctx.fb, num(a[0]), num(a[1]), num(a[2]), num(a[3]), col(a[4]), ctx.strokeWidth);
    },
  },

  'display.fillRect': {
    name: 'display.fillRect',
    argCount: 5,
    execute(ctx, a) {
      fillRect(ctx.fb, num(a[0]), num(a[1]), num(a[2]), num(a[3]), col(a[4]));
    },
  },

  'display.drawCircle': {
    name: 'display.drawCircle',
    argCount: 4,
    execute(ctx, a) {
      drawCircle(ctx.fb, num(a[0]), num(a[1]), num(a[2]), col(a[3]), ctx.strokeWidth);
    },
  },

  'display.fillCircle': {
    name: 'display.fillCircle',
    argCount: 4,
    execute(ctx, a) {
      fillCircle(ctx.fb, num(a[0]), num(a[1]), num(a[2]), col(a[3]));
    },
  },

  'display.drawRoundRect': {
    name: 'display.drawRoundRect',
    argCount: 6,
    execute(ctx, a) {
      drawRoundRect(ctx.fb, num(a[0]), num(a[1]), num(a[2]), num(a[3]), num(a[4]), col(a[5]), ctx.strokeWidth);
    },
  },

  'display.fillRoundRect': {
    name: 'display.fillRoundRect',
    argCount: 6,
    execute(ctx, a) {
      fillRoundRect(ctx.fb, num(a[0]), num(a[1]), num(a[2]), num(a[3]), num(a[4]), col(a[5]));
    },
  },

  'display.setCursor': {
    name: 'display.setCursor',
    argCount: 2,
    execute(ctx, a) {
      ctx.cursor.x = num(a[0]);
      ctx.cursor.y = num(a[1]);
    },
  },

  'display.setTextSize': {
    name: 'display.setTextSize',
    argCount: 1,
    execute(ctx, a) {
      ctx.textSize = Math.max(1, Math.floor(num(a[0])));
    },
  },

  'display.print': {
    name: 'display.print',
    argCount: 1,
    execute(ctx, a) {
      writeText(ctx, String(a[0]));
    },
  },

  'display.println': {
    name: 'display.println',
    argCount: 1,
    execute(ctx, a) {
      writeText(ctx, String(a[0]));
      // println escreve e depois pula linha.
      ctx.cursor.x = 0;
      ctx.cursor.y += CHAR_HEIGHT * ctx.textSize;
    },
  },
};
