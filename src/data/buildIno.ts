// ============================================================================
// buildIno.ts
// ----------------------------------------------------------------------------
// Monta o conteudo completo de um arquivo .ino do Arduino a partir do codigo
// do aluno: includes, defines, setup() (com os pinos do I2C) e loop().
//
// Os pinos padrao do OLED neste projeto sao SDA = GPIO21 e SCL = GPIO22
// (ESP32). Eles ficam destacados no painel de exportacao.
// ============================================================================

export interface InoPins {
  sda: number;
  scl: number;
}

export interface InoSize {
  width: number;
  height: number;
}

export const DEFAULT_PINS: InoPins = { sda: 21, scl: 22 };
export const DEFAULT_SIZE: InoSize = { width: 128, height: 64 };

// Indenta cada linha do codigo do aluno para encaixar dentro do loop().
function indentCode(code: string): string {
  return code
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : '  ' + line))
    .join('\n');
}

export function buildIno(code: string, pins: InoPins = DEFAULT_PINS, size: InoSize = DEFAULT_SIZE): string {
  return `#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH ${size.width}
#define SCREEN_HEIGHT ${size.height}
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {

  // SDA = GPIO${pins.sda}
  // SCL = GPIO${pins.scl}
  Wire.begin(${pins.sda}, ${pins.scl});

  // Inicializa o OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    while (true);
  }

  display.clearDisplay();
  display.display();
}

void loop() {

  // codigo do aluno gerado pelo OLED Lab
${indentCode(code)}

}
`;
}
