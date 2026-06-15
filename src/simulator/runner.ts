// ============================================================================
// runner.ts
// ----------------------------------------------------------------------------
// Motor que executa a lista de instrucoes em sequencia, criando animacoes.
//
// Comportamento:
//   - comandos de desenho mudam o buffer instantaneamente;
//   - display.display() emite um QUADRO (copia do buffer) via onFrame;
//   - delay(ms) PAUSA a execucao e continua depois (escalado pela velocidade);
//   - modo passo a passo avanca ate o proximo display() ou delay().
//
// Controles: run, pause, resume, stop, reset, step, setSpeed.
// ============================================================================

import { COMMANDS, ExecContext, createContext } from './commands';
import { Instruction } from './parser';
import { OLED_WIDTH, OLED_HEIGHT } from './framebuffer';

export type RunnerStatus = 'idle' | 'running' | 'paused' | 'done' | 'error';

export interface RunnerCallbacks {
  onFrame: (frame: Uint8Array) => void;     // novo quadro pronto para a tela
  onStatus: (status: RunnerStatus) => void; // mudanca de estado
  onError: (message: string) => void;       // erro de execucao
}

export class Runner {
  private instructions: Instruction[] = [];
  private ctx: ExecContext = createContext();
  private index = 0;
  private running = false;
  private paused = false;
  private speed = 1; // 0.5, 1, 2, 5
  private loopMode = false; // repete o programa como o loop() do Arduino
  private width = OLED_WIDTH;   // tamanho da tela (configuravel)
  private height = OLED_HEIGHT;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cb: RunnerCallbacks) {}

  /** Define a velocidade da animacao (afeta o tempo dos delays). */
  setSpeed(speed: number): void {
    this.speed = speed;
  }

  /**
   * Define o tamanho da tela. Reseta o estado e emite um quadro limpo no novo
   * tamanho (a tela visivel precisa do buffer no tamanho certo).
   */
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.reset();
  }

  /** Cria um contexto novo ja no tamanho de tela configurado. */
  private newContext(): ExecContext {
    return createContext(this.width, this.height);
  }

  /**
   * Liga/desliga o modo loop. Quando ligado, ao chegar no fim do programa o
   * runner reinicia do comeco automaticamente -- exatamente como o loop() do
   * Arduino, que executa para sempre. O buffer/cursor sao mantidos entre as
   * repeticoes (igual ao hardware real); por isso animacoes costumam comecar
   * com display.clearDisplay().
   */
  setLoop(enabled: boolean): void {
    this.loopMode = enabled;
  }

  /** Carrega um novo programa e zera o estado/buffer (mostra tela limpa). */
  load(instructions: Instruction[]): void {
    this.stopTimer();
    this.instructions = instructions;
    this.ctx = this.newContext();
    this.index = 0;
    this.running = false;
    this.paused = false;
    this.cb.onFrame(this.ctx.fb.snapshot()); // tela preta inicial
    this.cb.onStatus('idle');
  }

  /** Inicia a execucao do inicio. */
  run(): void {
    if (this.instructions.length === 0) return;
    this.ctx = this.newContext();
    this.index = 0;
    this.running = true;
    this.paused = false;
    this.cb.onStatus('running');
    this.loop();
  }

  /** Pausa a execucao (mantem o estado atual). */
  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.stopTimer();
    this.cb.onStatus('paused');
  }

  /** Continua de onde parou. */
  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.cb.onStatus('running');
    this.loop();
  }

  /** Para totalmente (mantem o que estiver na tela). */
  stop(): void {
    this.running = false;
    this.paused = false;
    this.stopTimer();
    this.cb.onStatus('idle');
  }

  /** Reinicia: para tudo e volta para a tela preta no comeco. */
  reset(): void {
    this.stopTimer();
    this.ctx = this.newContext();
    this.index = 0;
    this.running = false;
    this.paused = false;
    this.cb.onFrame(this.ctx.fb.snapshot());
    this.cb.onStatus('idle');
  }

  /**
   * Modo passo a passo: avanca ate executar o proximo display() (mostra quadro)
   * ou ate cruzar um delay() (sem esperar de verdade). Cada clique = 1 passo.
   */
  step(): void {
    if (this.instructions.length === 0) return;

    // Se ainda nao comecou (ou ja terminou), prepara para o inicio.
    if (!this.running) {
      this.ctx = this.newContext();
      this.index = 0;
      this.running = true;
      this.paused = true;
      this.cb.onStatus('paused');
    }

    while (this.index < this.instructions.length) {
      const signal = this.execOne(this.index);
      if (signal === 'error') return;
      this.index++;
      if (signal && signal.kind === 'render') {
        this.cb.onFrame(this.ctx.fb.snapshot());
        break;
      }
      if (signal && signal.kind === 'delay') {
        // No passo a passo nao esperamos: o delay so marca um ponto de parada.
        break;
      }
    }

    if (this.index >= this.instructions.length) {
      this.running = false;
      this.paused = false;
      this.cb.onStatus('done');
    }
  }

  // --------------------------------------------------------------------------
  // Internos
  // --------------------------------------------------------------------------

  // Loop principal: executa o mais rapido possivel ate achar um delay.
  private loop(): void {
    while (this.running && !this.paused && this.index < this.instructions.length) {
      const signal = this.execOne(this.index);
      if (signal === 'error') return;
      this.index++;

      if (signal && signal.kind === 'render') {
        this.cb.onFrame(this.ctx.fb.snapshot());
      } else if (signal && signal.kind === 'delay') {
        // Agenda a continuacao depois do tempo (escalado pela velocidade).
        const wait = signal.ms / this.speed;
        this.timer = setTimeout(() => {
          this.timer = null;
          if (this.running && !this.paused) this.loop();
        }, wait);
        return; // libera a thread para a animacao acontecer
      }
    }

    if (this.running && this.index >= this.instructions.length) {
      if (this.loopMode) {
        // Chegou ao fim e o modo loop esta ligado: reinicia do comeco, como o
        // loop() do Arduino. Agendamos com setTimeout(0) para devolver a thread
        // ao navegador a cada volta -- assim a tela atualiza e nada trava,
        // mesmo que o programa nao tenha nenhum delay().
        this.index = 0;
        this.timer = setTimeout(() => {
          this.timer = null;
          if (this.running && !this.paused) this.loop();
        }, 0);
        return;
      }
      this.running = false;
      this.cb.onStatus('done');
    }
  }

  // Executa uma instrucao com tratamento de erro amigavel.
  private execOne(i: number):
    | { kind: 'render' }
    | { kind: 'delay'; ms: number }
    | void
    | 'error' {
    const ins = this.instructions[i];
    const cmd = COMMANDS[ins.name];
    if (!cmd) {
      this.fail(`Comando desconhecido na linha ${ins.line}: ${ins.name}`);
      return 'error';
    }
    try {
      return cmd.execute(this.ctx, ins.args);
    } catch (e) {
      const msg = (e as { message?: string }).message ?? String(e);
      this.fail(`Erro ao executar a linha ${ins.line}: ${msg}`);
      return 'error';
    }
  }

  private fail(message: string): void {
    this.running = false;
    this.paused = false;
    this.stopTimer();
    this.cb.onError(message);
    this.cb.onStatus('error');
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
