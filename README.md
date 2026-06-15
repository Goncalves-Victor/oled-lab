# OLED Lab

Simulador didático de uma tela **OLED SSD1306 (128 × 64)** para alunos de robótica
aprenderem os comandos básicos da biblioteca **Adafruit_GFX**.

O aluno digita comandos no estilo Arduino/C++ e vê o resultado na tela virtual,
exatamente como aconteceria num ESP32 com display OLED.

## Como rodar

Você precisa do **Node.js 18+** instalado.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (algo como `http://localhost:5173`).
Para abrir no celular, use o IP da sua máquina na mesma rede
(ex.: `http://192.168.0.10:5173`) — o servidor já está configurado para isso.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Como funciona (igual ao OLED real)

- Todos os comandos de desenho alteram primeiro um **buffer interno** de 128×64.
- A tela visível só é atualizada quando o aluno chama `display.display();`.
- `delay(ms)` pausa a execução, permitindo criar **animações** entre quadros.
- O código do aluno **não** é executado com `eval()`: um parser próprio
  reconhece apenas os comandos permitidos e mostra erros amigáveis.

## Estrutura

```
src/
  App.tsx                  // junta tudo + persistência + exportar .ino
  main.tsx
  components/
    OledCanvas.tsx         // desenha o buffer no canvas + grade + coordenadas
    CodeEditor.tsx         // editor com numeração de linhas
    FunctionHelp.tsx       // documentação das funções (expansível)
    ExamplePanel.tsx       // exemplos prontos
    Toolbar.tsx            // executar/pausar/parar/reiniciar/passo/velocidade
  simulator/
    framebuffer.ts         // buffer interno 128x64
    drawing.ts             // Bresenham, círculo ponto-médio, roundRect...
    textFont.ts            // fonte 5x7 em bitmap + desenho de texto
    commands.ts            // REGISTRY de comandos (fácil de expandir)
    parser.ts              // parser sem eval
    runner.ts              // motor de execução/animação
  data/
    examples.ts            // exemplos
    functionDocs.ts        // textos da documentação
  styles/
    global.css
```

## Adicionando um comando novo

1. Implemente o algoritmo (se precisar) em `simulator/drawing.ts`.
2. Adicione a entrada em `simulator/commands.ts` (`name`, `argCount`, `execute`).
3. Documente em `data/functionDocs.ts`.

Pronto — o parser e o runner passam a aceitar o comando automaticamente.
Exemplos planejados para o futuro: `display.drawPixel`, `display.drawTriangle`,
`display.fillTriangle`, `display.drawBitmap`,
`display.setTextColor`, `display.invertDisplay`.

## Comandos disponíveis

`display.clearDisplay()`, `display.display()`, `delay(ms)`,
`display.drawLine`, `display.drawRect`, `display.fillRect`,
`display.drawCircle`, `display.fillCircle`,
`display.drawRoundRect`, `display.fillRoundRect`,
`display.setCursor`, `display.setTextSize`, `display.print`, `display.println`.

Cores aceitas: `SSD1306_WHITE` / `1` (acende) e `SSD1306_BLACK` / `0` (apaga).
