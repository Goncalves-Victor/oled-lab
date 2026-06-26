# CLAUDE.md

Guia para o Claude Code (e novos desenvolvedores) trabalhar neste repositório.

## Visão geral

**OLED Lab** é um simulador didático, em **React 18 + TypeScript + Vite**, de uma
tela **OLED SSD1306**. O aluno digita comandos no estilo Arduino/C++ (biblioteca
**Adafruit_GFX**) e vê o resultado numa tela virtual, sem precisar do hardware.
O projeto imita o comportamento **real** do display: tudo é desenhado primeiro
num *buffer interno* e só aparece na tela quando se chama `display.display()`.
O tamanho da tela é **configurável** (128×64, 128×32 ou personalizado).

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

Deploy: GitHub Actions (`.github/workflows/deploy.yml`) builda e publica no
GitHub Pages a cada push na `main` (Pages → Source = "GitHub Actions"). O
`vite.config.ts` usa `base: './'` para funcionar em qualquer nome de repositório.

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
| `src/App.tsx` | Componente raiz: junta UI; persistência (`localStorage`); nome do aluno e sincronização na nuvem; live preview; tamanho de tela; copiar código; exportar `.ino` |
| `src/main.tsx` | Ponto de entrada do React |
| `src/simulator/framebuffer.ts` | Buffer interno (1 byte/pixel), **dimensões configuráveis** via construtor; `setPixel`, `clear`, `snapshot` |
| `src/simulator/drawing.ts` | Algoritmos de desenho (Bresenham, círculo ponto-médio, roundRect…), todos com suporte a **espessura de traço** (`stroke`) |
| `src/simulator/textFont.ts` | Fonte bitmap 5×7 e desenho de caracteres (`CHAR_WIDTH=6`, `CHAR_HEIGHT=8`) |
| `src/simulator/commands.ts` | **Registry** de comandos (`name`, `argCount`, `execute`) |
| `src/simulator/parser.ts` | Converte código em instruções, sem `eval()`; valida e gera erros |
| `src/simulator/runner.ts` | **Motor de execução/animação**: run, pause, resume, stop, reset, step, velocidade, **loop**, `setDimensions` |
| `src/components/OledCanvas.tsx` | Renderiza o buffer no canvas (tamanho via props) + grade + coordenadas |
| `src/components/CodeEditor.tsx` | Editor com numeração de linhas, **arraste de linhas** (reordenar) e **dobra** do bloco de desenho |
| `src/components/Toolbar.tsx` | Botões de controle, velocidade, grade, repetir (loop), auto (live preview) |
| `src/components/ExamplePanel.tsx` | Exemplos prontos + "Meus exemplos" (com separador visual) |
| `src/components/FunctionHelp.tsx` | Documentação expansível das funções, com **filtros por categoria** |
| `src/components/ExportModal.tsx` | Painel (modal) com o `.ino` completo, pinos e tamanho de tela configuráveis, código destacado |
| `src/components/SettingsModal.tsx` | Painel (modal) para escolher o tamanho da tela (presets ou personalizado) |
| `src/components/DrawModal.tsx` | Ferramenta de **desenho por pixel** (lápis/borracha) sobre a tela atual |
| `src/components/PanelLayout.tsx` | Colunas com pilhas; reposiciona por arrastar-e-soltar (HTML5 DnD); alça redimensiona; persistido |
| `src/data/examples.ts` | Exemplos curtos e `DEFAULT_CODE` |
| `src/data/animatedExamples.ts` | **GERADO** — animações longas (tesseract, sapo 360°…) |
| `src/data/customExamples.ts` | Carrega/salva "Meus exemplos" do aluno no `localStorage` (modo sem nome) |
| `src/data/cloudSync.ts` | Sincroniza "Meus exemplos" com o Firebase Realtime Database, por nome |
| `src/data/drawBlock.ts` | Bloco de código (dobrável) gerado pela ferramenta de desenho; build/parse/merge dos pixels |
| `src/data/buildIno.ts` | Monta o `.ino` (includes, defines, `setup`, `loop`); pinos e tamanho de tela configuráveis |
| `src/data/functionDocs.ts` | Textos e **categorias** da documentação das funções |
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
  `fb` (framebuffer), `cursor`, `textSize`, `textColor`. Criado por
  `createContext(width, height)` e recriado a cada `run()`.
- **Sem `eval()`**: o parser é proposital. Nunca introduza `eval`/`Function` para
  executar o código do aluno — quebra a segurança e a didática do projeto.
- **Persistência local**: `App.tsx` salva código, grade, velocidade, loop, auto,
  tamanho de tela e o nome do aluno em `localStorage` (chaves `oledlab.*`).

### Tamanho de tela configurável

`Framebuffer`, `Runner` (`setDimensions`), `OledCanvas`, `ExportModal`/`buildIno`
e `DrawModal` recebem `width`/`height` em vez de usar `OLED_WIDTH`/`OLED_HEIGHT`
fixos (que continuam existindo só como **padrão**, 128×64). `SettingsModal`
(ícone ⚙ no cabeçalho) deixa escolher entre presets (128×64, 128×32) ou
personalizado (8–256 px). Trocar o tamanho reseta a simulação e roda o código
de novo no novo tamanho (`App.tsx`, `useEffect` em `[size]`).

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
hora mesmo com o Auto desligado. O guard `lastRunRef` evita reexecutar o mesmo
código duas vezes (ex: ao trocar de tamanho de tela ou carregar exemplo).

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

### Editor: arraste de linhas + dobra do bloco de desenho (`CodeEditor`)

Cada linha tem, na gutter, uma alça (`⠿`, `draggable`) para **reordenar** linhas
por arrastar-e-soltar (estado `dragLine`/`dropTarget`, `handleDrop` faz o
splice). A fonte da verdade é sempre o `value` (código completo); quando há um
bloco de desenho (ver abaixo) e ele está dobrado, a textarea mostra uma versão
**visual** sem as linhas internas do bloco — `rebuildFull()` reinsere o trecho
escondido logo após a linha-cabeçalho ao editar ou reordenar. Botão
**"✕ Limpar editor"** zera o código (`onClear`, em `App.tsx` também reseta o
runner e as mensagens).

### Ferramenta de desenho por pixel (`DrawModal` + `data/drawBlock.ts`)

Ícone 🤘 (lápis) no cabeçalho abre o `DrawModal`: uma tela ampliada que já
começa **com o desenho atual** (o `frame` que o código do editor já produz),
para o aluno ajustar por cima com lápis/borracha. Pontos-chave:

- O modal **não conhece o código** — ao concluir, devolve só os **pixels que
  mudaram** nessa sessão (`PixelChange = [x, y, 0 | 1]`), comparando o buffer
  final com uma cópia tirada na abertura (`baseRef`).
- Quem decide como isso entra no código é `App.tsx` (`handleDrawFinish`), que
  faz o **merge** com o bloco de desenho já existente (se houver):
  - pixel que **já tinha** um comando no bloco e foi apagado (virou 0) → o
    comando é **removido** (o aluno "desfez" aquele pixel; o código dele
    desaparece, não gera um comando extra de apagar);
  - pixel novo, ou apagando algo que não era do bloco (ex: parte de uma forma
    desenhada por `drawCircle`/`drawRect`) → entra/atualiza como comando
    `display.drawPixel(x, y, COR)` no bloco.
  - Se não sobrar nenhum pixel no bloco, ele é **removido** do código.
- O bloco gerado **não tem `clearDisplay()`** e é sempre **anexado ao final**
  do código — os comandos anteriores (formas, texto) continuam produzindo seus
  pixels normalmente, e o bloco só sobrepõe os pixels alterados, igual ao
  buffer real e cumulativo do OLED.
- `data/drawBlock.ts` define os marcadores (`DRAW_START_PREFIX` / `DRAW_END`),
  `buildDrawBlock` (monta o texto), `findDrawRegion` (acha a região no código)
  e `parseDrawBlock` (lê os pixels que um bloco já tem, para o merge).
- `CodeEditor` detecta a região e mostra só a primeira linha, com **▸/▾** para
  expandir/recolher (ver seção acima).

### Documentação com filtros por categoria (`FunctionHelp`)

`data/functionDocs.ts` define `DocCategory` (`'Controle' | 'Formas' | 'Texto'`)
e cada `FunctionDoc` tem uma categoria. `FunctionHelp` mostra pílulas de filtro
(Todas + cada categoria, com contador) e uma tag colorida por categoria em cada
cartão.

### Exportar .ino (`ExportModal` + `buildIno`)

O botão **"Exportar .ino"** abre um modal com o código Arduino completo
(includes, defines, `setup()` com `Wire.begin`, `loop()`). Os pinos do I2C
(padrão **SDA 21 / SCL 22**) e o tamanho da tela são configuráveis; as linhas
dos pinos ficam **destacadas**. Dá para copiar ou baixar o `.ino`. A montagem
fica em `data/buildIno.ts` (`InoSize`, reutilizável).

### Exemplos animados

Como o parser não tem variáveis/loops, as animações são quadros "desenrolados"
gerados por `scripts/gen-examples.mjs` → `data/animatedExamples.ts`. Para
adicionar/ajustar uma animação, edite o script e rode `npm run gen:examples`
(não edite o arquivo gerado à mão). Exemplos animados ficam melhores com o
**"Repetir (loop)"** ligado (têm o badge ↻ no painel).

### Exemplos do aluno e sincronização na nuvem (nome do aluno)

Botão **"➕ Salvar atual como exemplo"** guarda o código do editor em
`customExamples` (estado em `App.tsx`); aparecem em "Meus exemplos", separados
dos exemplos prontos por um `<hr>`, e podem ser removidos no ✕.

Por padrão (sem nome digitado) essa lista é só local, em `localStorage`
(`oledlab.customExamples`, via `data/customExamples.ts`).

Há um campo de texto **"Seu nome..."** no cabeçalho (ao lado do ⚙) — ao
digitar um nome (debounce de 600 ms), `App.tsx` passa a sincronizar "Meus
exemplos" com o **Firebase Realtime Database** (`data/cloudSync.ts`), usando o
nome como chave de acesso (igual a um bloco de notas: o nome é a "gaveta").
Reaproveita o mesmo projeto Firebase de outra aplicação da mesma plataforma
(EducaRino), mas em caminho próprio — `oledlab_exemplos/<nome>` — separado do
`documentos/` do bloco de notas, para não misturar dados.

Comportamento:
- Nome **novo** (sem nada salvo na nuvem) sempre começa **vazio** — não herda
  a lista local de quem usa sem nome (bug já corrigido: antes, exemplos
  antigos "vazavam" para qualquer nome novo).
- Nome com dados existentes **substitui** "Meus exemplos" pelo que veio da
  nuvem (`watchCloudExamples`, com `onValue` em tempo real).
- Toda mudança em `customExamples` enquanto há nome é enviada à nuvem com
  debounce de 600 ms (`saveCloudExamples`).
- Apagar o nome restaura a lista local genérica (`loadCustomExamples()`).
- `lastSyncedJsonRef` evita o loop de eco (escrever → o próprio listener
  reagir → reescrever) comparando o JSON antes de agir.
- Indicador de status ao lado do campo: `⏳ Carregando...` / `💾 Salvando...`
  / `✅ Sincronizado` / `❌ Erro ao sincronizar`.

## Como estender

### Adicionar um comando novo

1. (Se precisar) implemente o algoritmo em `src/simulator/drawing.ts`.
2. Adicione a entrada em `src/simulator/commands.ts` (`name`, `argCount`,
   `execute`). O parser e o runner passam a aceitá-lo automaticamente.
3. Documente em `src/data/functionDocs.ts` (escolha a `DocCategory` certa).

Cores aceitas: `SSD1306_WHITE`/`1` (acende) e `SSD1306_BLACK`/`0` (apaga) —
mapeadas em `parser.ts` (`COLOR_TOKENS`). Use os helpers `num()` e `col()` de
`commands.ts` ao ler argumentos.

Comandos já implementados: `clearDisplay`, `display`, `delay`, `drawPixel`,
`drawLine`, `drawRect`, `fillRect`, `drawCircle`, `fillCircle`, `drawRoundRect`,
`fillRoundRect`, `setCursor`, `setTextSize`, `print`, `println`.

Comandos planejados (ver README): `drawTriangle`, `fillTriangle`, `drawBitmap`,
`setTextColor`, `invertDisplay`.

## Convenções

- Código e comentários em **português**; comentários explicam o *porquê*, no
  estilo já presente nos arquivos (cabeçalhos em bloco com `===`).
- TypeScript estrito. Prefira tipos explícitos nas APIs públicas dos módulos.
- Mensagens ao usuário (erros, status) sempre em português e amigáveis, com
  número da linha quando aplicável.
- Mantenha o registry de `commands.ts` como o **ponto único** de extensão de
  comandos — não espalhe lógica de comando pelo parser ou runner.
- Credenciais do Firebase em `data/cloudSync.ts` são chaves de **cliente**
  (não são segredo por natureza), mas o caminho `oledlab_exemplos/` deve
  continuar separado de outros dados da mesma plataforma — não escreva fora
  desse prefixo.
