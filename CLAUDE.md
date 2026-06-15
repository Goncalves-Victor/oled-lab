# CLAUDE.md

Guia para o Claude Code (e novos desenvolvedores) trabalhar neste repositório.

## Visão geral

**OLED Lab** é um simulador didático, em **React 18 + TypeScript + Vite**, de uma
tela **OLED SSD1306 (128×64)**. O aluno digita comandos no estilo Arduino/C++
(biblioteca **Adafruit_GFX**) e vê o resultado numa tela virtual, sem precisar do
hardware. O projeto imita o comportamento **real** do display: tudo é desenhado
primeiro num *buffer interno* e só aparece na tela quando se chama
`display.display()`.

Público-alvo: alunos de robótica. A interface é em **português** e prioriza
mensagens de erro amigáveis (com número da linha).

## Comandos

```bash
npm install         # instala dependências (Node.js 18+)
npm run dev         # servidor de desenvolvimento Vite (host habilitado p/ celular)
npm run build       # tsc (type-check) + build de produção
npm run preview     # serve o build de produção
npm run gen:examples # regenera src/data/animatedExamples.ts (animações)
```

Não há suíte de testes nem linter configurados. **Antes de concluir qualquer
alteração, rode `npx tsc --noEmit`** para garantir que o type-check passa
(o `npm run build` também faz isso).

## Arquitetura

Fluxo: **editor → parser → runner → framebuffer → canvas**.

1. O aluno escreve código no editor (coluna esquerda).
2. `parser.ts` transforma o texto numa lista de `Instruction[]` — **sem `eval()`**:
   uma regex reconhece apenas os comandos do registry e gera erros amigáveis.
3. `runner.ts` executa as instruções uma a uma. Comandos de desenho alteram o
   **framebuffer**; `display.display()` emite um *quadro* (cópia do buffer) para a
   tela; `delay(ms)` pausa e agenda a continuação via `setTimeout` — é isso que
   cria a **animação**.
4. `OledCanvas` desenha o quadro no `<canvas>`, com grade e coordenadas opcionais.

### Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Componente raiz: junta UI; persistência (`localStorage`); copiar código; exportar `.ino` |
| `src/main.tsx` | Ponto de entrada do React |
| `src/simulator/framebuffer.ts` | Buffer interno 128×64 (1 byte/pixel); `setPixel`, `clear`, `snapshot` |
| `src/simulator/drawing.ts` | Algoritmos de desenho (Bresenham, círculo ponto-médio, roundRect…) |
| `src/simulator/textFont.ts` | Fonte bitmap 5×7 e desenho de caracteres (`CHAR_WIDTH=6`, `CHAR_HEIGHT=8`) |
| `src/simulator/commands.ts` | **Registry** de comandos (`name`, `argCount`, `execute`) |
| `src/simulator/parser.ts` | Converte código em instruções, sem `eval()`; valida e gera erros |
| `src/simulator/runner.ts` | **Motor de execução/animação**: run, pause, resume, stop, reset, step, velocidade, **loop** |
| `src/components/OledCanvas.tsx` | Renderiza o buffer no canvas + grade + coordenadas |
| `src/components/CodeEditor.tsx` | Editor com numeração de linhas |
| `src/components/Toolbar.tsx` | Botões de controle, velocidade, grade, repetir (loop) |
| `src/components/ExamplePanel.tsx` | Exemplos prontos |
| `src/components/FunctionHelp.tsx` | Documentação expansível das funções |
| `src/components/ExportModal.tsx` | Painel (modal) com o `.ino` completo, pinos configuráveis e código destacado |
| `src/components/PanelLayout.tsx` | Colunas com pilhas; reposiciona por arrastar-e-soltar (HTML5 DnD); alça redimensiona; persistido |
| `src/data/examples.ts` | Exemplos curtos e `DEFAULT_CODE` |
| `src/data/animatedExamples.ts` | **GERADO** — animações longas (tesseract, sapo 360°…) |
| `src/data/customExamples.ts` | Carrega/salva exemplos do aluno no `localStorage` |
| `src/data/buildIno.ts` | Monta o `.ino` (includes, defines, `setup`, `loop`); pinos padrão SDA 21 / SCL 22 |
| `src/data/functionDocs.ts` | Textos da documentação das funções |
| `scripts/gen-examples.mjs` | Gerador das animações (`npm run gen:examples`) |
| `src/styles/global.css` | Estilos globais |

### Conceitos-chave

- **Buffer vs. tela**: comandos de desenho escrevem no `Framebuffer` interno. A
  tela visível (canvas) só atualiza quando o runner recebe o sinal `render` de
  `display.display()`. Isso é fiel ao SSD1306 real.
- **Sinais de controle**: cada comando em `commands.ts` pode devolver um
  `ControlSignal` para o runner:

  | Comando | Sinal | Efeito |
  |---|---|---|
  | desenho (`drawLine`, `fillRect`, `print`…) | `void` | altera o buffer, instantâneo |
  | `display.display()` | `{ kind: 'render' }` | copia o buffer → tela (emite quadro) |
  | `delay(ms)` | `{ kind: 'delay', ms }` | pausa e agenda continuação (escalada pela velocidade) |

- **ExecContext** (`commands.ts`): estado mutável durante a execução —
  `fb` (framebuffer), `cursor`, `textSize`, `textColor`. Recriado a cada `run()`.
- **Sem `eval()`**: o parser é proposital. Nunca introduza `eval`/`Function` para
  executar o código do aluno — quebra a segurança e a didática do projeto.
- **Persistência**: `App.tsx` salva código, grade, velocidade e loop em
  `localStorage` (chaves `oledlab.*`).

### Modo loop (`void loop()` do Arduino)

`runner.ts` tem o campo `loopMode` e o método `setLoop(enabled)`. Quando ligado,
ao chegar no fim do programa o runner reinicia em `index = 0` (agendando com
`setTimeout(0)` para devolver a thread ao navegador a cada volta — evita travar
mesmo sem `delay()`). O buffer/cursor são **mantidos** entre as voltas, igual ao
hardware real; por isso animações começam com `display.clearDisplay()`.

UI: checkbox **"Repetir (loop)"** no `Toolbar` → estado `loop` em `App.tsx`
(persistido em `oledlab.loop`) → `runner.setLoop()` via `useEffect`.

### Live preview (auto-executar)

Checkbox **"Auto"** (ligado por padrão, `oledlab.auto`). Em `App.tsx`, um
`useEffect` com debounce de ~450 ms reparseia/roda o código a cada mudança e
mostra o resultado na tela na hora. Só erros aparecem na área de mensagens (não
polui com "ok" a cada tecla). Carregar um exemplo usa `loadAndRun`, que roda na
hora mesmo com o Auto desligado.

### Layout reposicionável (`PanelLayout`)

Modelo de **colunas com pilhas**: `columns: string[][]` (cada coluna é uma pilha
de painéis). Reposicionamento por **arrastar e soltar** (HTML5 DnD): arrasta-se
o painel pelo cabeçalho (`panel-head` é `draggable`) e solta-se sobre outro. A
zona do alvo (calculada em `zoneFromEvent` a partir do ponteiro) decide o
destino: borda **esquerda/direita** → nova coluna ao lado; metade de
**cima/baixo** → empilha acima/abaixo. Uma barra (`drop-bar`) mostra onde vai
cair. A lógica de mover está em `applyDrop` (remove mantendo índices estáveis e
só depois limpa colunas vazias). Há alça de arraste entre colunas para a
largura. Persistido em `oledlab.layout.columns` / `oledlab.layout.colwidths`. No
celular (≤ 900 px) vira coluna única (ordem de leitura), sem arrastar.

### Exportar .ino (`ExportModal` + `buildIno`)

O botão **"Exportar .ino"** abre um modal com o código Arduino completo
(includes, defines, `setup()` com `Wire.begin`, `loop()`). Os pinos do I2C são
configuráveis (padrão **SDA 21 / SCL 22**) e as linhas dos pinos ficam
**destacadas**. Dá para copiar ou baixar o `.ino`. A montagem fica em
`data/buildIno.ts` (reutilizável).

### Exemplos animados

Como o parser não tem variáveis/loops, as animações são quadros "desenrolados"
gerados por `scripts/gen-examples.mjs` → `data/animatedExamples.ts`. Para
adicionar/ajustar uma animação, edite o script e rode `npm run gen:examples`
(não edite o arquivo gerado à mão). Exemplos animados ficam melhores com o
**"Repetir (loop)"** ligado (têm o badge ↻ no painel).

### Exemplos do aluno

Botão **"Salvar atual como exemplo"** guarda o código do editor em
`oledlab.customExamples` (via `data/customExamples.ts`); aparecem em "Meus
exemplos" e podem ser removidos no ✕.

## Como estender

### Adicionar um comando novo

1. (Se precisar) implemente o algoritmo em `src/simulator/drawing.ts`.
2. Adicione a entrada em `src/simulator/commands.ts` (`name`, `argCount`,
   `execute`). O parser e o runner passam a aceitá-lo automaticamente.
3. Documente em `src/data/functionDocs.ts`.

Cores aceitas: `SSD1306_WHITE`/`1` (acende) e `SSD1306_BLACK`/`0` (apaga) —
mapeadas em `parser.ts` (`COLOR_TOKENS`). Use os helpers `num()` e `col()` de
`commands.ts` ao ler argumentos.

Comandos planejados (ver README): `drawPixel`, `drawTriangle`, `fillTriangle`,
`drawRoundRect`, `drawBitmap`, `setTextColor`, `invertDisplay`.

## Convenções

- Código e comentários em **português**; comentários explicam o *porquê*, no
  estilo já presente nos arquivos (cabeçalhos em bloco com `===`).
- TypeScript estrito. Prefira tipos explícitos nas APIs públicas dos módulos.
- Mensagens ao usuário (erros, status) sempre em português e amigáveis, com
  número da linha quando aplicável.
- Mantenha o registry de `commands.ts` como o **ponto único** de extensão de
  comandos — não espalhe lógica de comando pelo parser ou runner.
