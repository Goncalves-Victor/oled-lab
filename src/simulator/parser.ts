// ============================================================================
// parser.ts
// ----------------------------------------------------------------------------
// Transforma o codigo digitado pelo aluno (estilo Arduino/C++) numa lista de
// instrucoes que o runner sabe executar. NAO usa eval()/Function(): tudo e
// feito por tokenizacao/regex reconhecendo apenas os comandos do registry.
//
// Regras:
//   - ignora linhas vazias
//   - ignora comentarios iniciados por //
//   - aceita espacos extras
//   - aceita ponto e virgula opcional
//   - erro amigavel com numero da linha em comando invalido
// ============================================================================

import { COMMANDS } from './commands';

/** Uma instrucao pronta para executar. */
export interface Instruction {
  name: string;
  args: (number | string)[];
  line: number;
}

/** Resultado do parsing: ou a lista de instrucoes, ou um erro amigavel. */
export interface ParseResult {
  instructions: Instruction[];
  error?: string;
}

// Mapeia tokens de cor para 0/1.
const COLOR_TOKENS: Record<string, number> = {
  SSD1306_WHITE: 1,
  SSD1306_BLACK: 0,
  WHITE: 1,
  BLACK: 0,
};

// Remove comentario // respeitando aspas (para nao cortar dentro de strings).
function stripComment(line: string): string {
  let inStr = false;
  for (let k = 0; k < line.length; k++) {
    const c = line[k];
    if (c === '"') inStr = !inStr;
    if (!inStr && c === '/' && line[k + 1] === '/') return line.slice(0, k);
  }
  return line;
}

// Divide os argumentos por virgula, respeitando aspas (strings podem ter virgula).
function splitArgs(raw: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inStr = false;
  for (let k = 0; k < raw.length; k++) {
    const c = raw[k];
    if (c === '"') { inStr = !inStr; cur += c; continue; }
    if (c === ',' && !inStr) { result.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (raw.trim() !== '') result.push(cur);
  return result.map((s) => s.trim());
}

// Converte um token de argumento para numero ou string.
function convertArg(token: string, line: number): number | string {
  // String entre aspas duplas.
  if (token.startsWith('"') && token.endsWith('"') && token.length >= 2) {
    return token.slice(1, -1);
  }
  // Token de cor.
  if (token in COLOR_TOKENS) return COLOR_TOKENS[token];
  // Numero (aceita negativos e decimais).
  const n = Number(token);
  if (token !== '' && !Number.isNaN(n)) return n;
  throw { line, message: `Argumento invalido na linha ${line}: "${token}"` };
}

// Valida a quantidade de argumentos de forma amigavel.
function validateArgCount(name: string, count: number): string | null {
  const expected = COMMANDS[name].argCount;
  // print/println podem ser chamados com 0 ou 1 argumento.
  if (name === 'display.print' || name === 'display.println') {
    return count <= 1 ? null : `${name} espera no maximo 1 argumento (texto).`;
  }
  if (count !== expected) {
    return `${name} espera ${expected} argumento(s), mas recebeu ${count}.`;
  }
  return null;
}

/** Faz o parsing completo do codigo. Para no primeiro erro encontrado. */
export function parseProgram(code: string): ParseResult {
  const lines = code.split(/\r?\n/);
  const instructions: Instruction[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1;
    const cleaned = stripComment(lines[idx]).trim();
    if (cleaned === '') continue; // ignora linha vazia/comentario

    // Casa "nome(args);" com ponto e virgula opcional.
    const m = cleaned.match(/^([A-Za-z_][\w.]*)\s*\((.*)\)\s*;?\s*$/);
    if (!m) {
      return {
        instructions: [],
        error: `Comando nao reconhecido na linha ${lineNo}: ${cleaned}`,
      };
    }

    const name = m[1];
    const argsRaw = m[2];

    if (!COMMANDS[name]) {
      return {
        instructions: [],
        error: `Comando nao reconhecido na linha ${lineNo}: ${name}()`,
      };
    }

    try {
      const args = splitArgs(argsRaw).map((t) => convertArg(t, lineNo));
      const argError = validateArgCount(name, args.length);
      if (argError) {
        return { instructions: [], error: `Erro na linha ${lineNo}: ${argError}` };
      }
      instructions.push({ name, args, line: lineNo });
    } catch (e) {
      const msg = (e as { message?: string }).message ?? `Erro na linha ${lineNo}.`;
      return { instructions: [], error: msg };
    }
  }

  return { instructions };
}
