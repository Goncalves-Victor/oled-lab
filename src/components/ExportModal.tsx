// ============================================================================
// ExportModal.tsx
// ----------------------------------------------------------------------------
// Painel (modal) que mostra o codigo Arduino (.ino) completo pronto para colar
// no Arduino IDE: includes, defines, setup() e loop(). Permite escolher os
// pinos do I2C (padrao SDA = 21, SCL = 22), copiar e baixar o arquivo.
// As linhas dos pinos ficam DESTACADAS.
// ============================================================================

import { useMemo, useState } from 'react';
import { buildIno, DEFAULT_PINS } from '../data/buildIno';

interface Props {
  open: boolean;
  code: string;
  width: number;
  height: number;
  onClose: () => void;
}

// Linhas que devem aparecer destacadas (configuracao dos pinos).
function isHighlighted(line: string): boolean {
  const t = line.trim();
  return t.startsWith('// SDA') || t.startsWith('// SCL') || t.startsWith('Wire.begin(');
}

export function ExportModal({ open, code, width, height, onClose }: Props) {
  const [sda, setSda] = useState<number>(DEFAULT_PINS.sda);
  const [scl, setScl] = useState<number>(DEFAULT_PINS.scl);
  const [copied, setCopied] = useState(false);

  const ino = useMemo(() => buildIno(code, { sda, scl }, { width, height }), [code, sda, scl, width, height]);
  const lines = useMemo(() => ino.split('\n'), [ino]);

  if (!open) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ino);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([ino], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oled_lab.ino';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Codigo Arduino (.ino)</h2>
          <button className="modal-close" onClick={onClose} title="Fechar">✕</button>
        </div>

        <div className="modal-pins">
          <span className="pins-label">Pinos do OLED (ESP32):</span>
          <label className="pin-field">
            SDA
            <input type="number" value={sda} onChange={(e) => setSda(Number(e.target.value))} />
          </label>
          <label className="pin-field">
            SCL
            <input type="number" value={scl} onChange={(e) => setScl(Number(e.target.value))} />
          </label>
          <span className="pins-hint">padrao: SDA 21 · SCL 22</span>
        </div>

        <pre className="ino-code">
          <code>
            {lines.map((line, i) => (
              <div key={i} className={'ino-line' + (isHighlighted(line) ? ' ino-hl' : '')}>
                {line === '' ? ' ' : line}
              </div>
            ))}
          </code>
        </pre>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? '✓ Copiado!' : '⧉ Copiar codigo'}
          </button>
          <button className="btn" onClick={handleDownload}>⬇ Baixar .ino</button>
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
