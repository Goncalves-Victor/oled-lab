// ============================================================================
// examples.ts
// ----------------------------------------------------------------------------
// Exemplos prontos que o aluno pode carregar no editor com 1 clique.
// Para adicionar um exemplo curto, basta acrescentar um objeto neste array.
// As animacoes longas (tesseract, sapo girando...) ficam em animatedExamples.ts,
// que e GERADO por scripts/gen-examples.mjs.
// ============================================================================

import {
  TESSERACT,
  FROG_SPIN,
  ROTATING_SQUARE,
  SONAR,
  BOUNCING_BALL,
} from './animatedExamples';

export interface Example {
  id: string;
  title: string;
  code: string;
  /** Dica: exemplos animados ficam melhores com "Repetir (loop)" ligado. */
  animated?: boolean;
}

export const EXAMPLES: Example[] = [
  {
    id: 'olhos-robo',
    title: 'Olhos de robo',
    code: `display.clearDisplay();
display.fillRoundRect(40, 20, 18, 18, 4, SSD1306_WHITE);
display.fillRoundRect(70, 20, 18, 18, 4, SSD1306_WHITE);
display.display();`,
  },
  {
    id: 'robo-piscando',
    title: 'Robo piscando',
    animated: true,
    code: `display.clearDisplay();
display.fillRoundRect(40, 20, 18, 18, 4, SSD1306_WHITE);
display.fillRoundRect(70, 20, 18, 18, 4, SSD1306_WHITE);
display.drawLine(48, 48, 55, 52, SSD1306_WHITE);
display.drawLine(55, 52, 73, 52, SSD1306_WHITE);
display.drawLine(73, 52, 80, 48, SSD1306_WHITE);
display.display();

delay(2000);

// Olhos fechados
display.clearDisplay();
display.drawLine(40, 29, 58, 29, SSD1306_WHITE);
display.drawLine(70, 29, 88, 29, SSD1306_WHITE);
display.drawLine(48, 48, 55, 52, SSD1306_WHITE);
display.drawLine(55, 52, 73, 52, SSD1306_WHITE);
display.drawLine(73, 52, 80, 48, SSD1306_WHITE);
display.display();

delay(150);`,
  },
  {
    id: 'formas',
    title: 'Formas geometricas',
    code: `display.clearDisplay();
display.drawRect(5, 5, 30, 20, SSD1306_WHITE);
display.fillRect(45, 5, 30, 20, SSD1306_WHITE);
display.drawCircle(30, 45, 12, SSD1306_WHITE);
display.fillCircle(85, 45, 12, SSD1306_WHITE);
display.display();`,
  },
  {
    id: 'texto',
    title: 'Texto',
    code: `display.clearDisplay();
display.setTextSize(2);
display.setCursor(10, 20);
display.println("Ola!");
display.display();`,
  },
  {
    id: 'carinha',
    title: 'Carinha simples',
    code: `display.clearDisplay();
display.drawCircle(64, 32, 25, SSD1306_WHITE);
display.fillCircle(54, 25, 3, SSD1306_WHITE);
display.fillCircle(74, 25, 3, SSD1306_WHITE);
display.drawLine(54, 43, 64, 49, SSD1306_WHITE);
display.drawLine(64, 49, 74, 43, SSD1306_WHITE);
display.display();`,
  },
  {
    id: 'logo',
    title: 'Logo OLED Lab',
    code: `display.clearDisplay();
display.drawRoundRect(2, 2, 124, 60, 8, SSD1306_WHITE);
display.drawRoundRect(5, 5, 118, 54, 6, SSD1306_WHITE);
display.setTextSize(2);
display.setCursor(28, 12);
display.print("OLED");
display.setTextSize(2);
display.setCursor(40, 32);
display.print("LAB");
display.fillCircle(16, 20, 2, SSD1306_WHITE);
display.fillCircle(112, 20, 2, SSD1306_WHITE);
display.fillCircle(16, 44, 2, SSD1306_WHITE);
display.fillCircle(112, 44, 2, SSD1306_WHITE);
display.display();`,
  },
  {
    id: 'estrela',
    title: 'Estrela',
    code: `display.clearDisplay();
display.drawLine(64, 6, 70, 23, SSD1306_WHITE);
display.drawLine(70, 23, 89, 24, SSD1306_WHITE);
display.drawLine(89, 24, 74, 35, SSD1306_WHITE);
display.drawLine(74, 35, 79, 53, SSD1306_WHITE);
display.drawLine(79, 53, 64, 43, SSD1306_WHITE);
display.drawLine(64, 43, 49, 53, SSD1306_WHITE);
display.drawLine(49, 53, 54, 35, SSD1306_WHITE);
display.drawLine(54, 35, 39, 24, SSD1306_WHITE);
display.drawLine(39, 24, 58, 23, SSD1306_WHITE);
display.drawLine(58, 23, 64, 6, SSD1306_WHITE);
display.display();`,
  },
  {
    id: 'coracao',
    title: 'Coracao',
    code: `display.clearDisplay();
display.drawLine(64, 26, 66, 21, SSD1306_WHITE);
display.drawLine(66, 21, 69, 18, SSD1306_WHITE);
display.drawLine(69, 18, 74, 17, SSD1306_WHITE);
display.drawLine(74, 17, 79, 18, SSD1306_WHITE);
display.drawLine(79, 18, 83, 22, SSD1306_WHITE);
display.drawLine(83, 22, 85, 27, SSD1306_WHITE);
display.drawLine(85, 27, 83, 32, SSD1306_WHITE);
display.drawLine(83, 32, 79, 38, SSD1306_WHITE);
display.drawLine(79, 38, 74, 42, SSD1306_WHITE);
display.drawLine(74, 42, 69, 47, SSD1306_WHITE);
display.drawLine(69, 47, 66, 50, SSD1306_WHITE);
display.drawLine(66, 50, 64, 54, SSD1306_WHITE);
display.drawLine(64, 54, 62, 50, SSD1306_WHITE);
display.drawLine(62, 50, 59, 47, SSD1306_WHITE);
display.drawLine(59, 47, 54, 42, SSD1306_WHITE);
display.drawLine(54, 42, 49, 38, SSD1306_WHITE);
display.drawLine(49, 38, 45, 32, SSD1306_WHITE);
display.drawLine(45, 32, 43, 27, SSD1306_WHITE);
display.drawLine(43, 27, 45, 22, SSD1306_WHITE);
display.drawLine(45, 22, 49, 18, SSD1306_WHITE);
display.drawLine(49, 18, 54, 17, SSD1306_WHITE);
display.drawLine(54, 17, 59, 18, SSD1306_WHITE);
display.drawLine(59, 18, 62, 21, SSD1306_WHITE);
display.drawLine(62, 21, 64, 26, SSD1306_WHITE);
display.display();`,
  },
  { id: 'tesseract', title: 'Tesseract 4D', animated: true, code: TESSERACT },
  { id: 'sapo-girando', title: 'Sapo girando 360', animated: true, code: FROG_SPIN },
  { id: 'quadrado-girando', title: 'Quadrado girando', animated: true, code: ROTATING_SQUARE },
  { id: 'sonar', title: 'Sonar / radar', animated: true, code: SONAR },
  { id: 'bola-quicando', title: 'Bola quicando', animated: true, code: BOUNCING_BALL },
];

// Codigo inicial mostrado na primeira vez que o aluno abre o app.
export const DEFAULT_CODE = EXAMPLES.find((e) => e.id === 'carinha')!.code;
