// ============================================================================
// SettingsModal.tsx
// ----------------------------------------------------------------------------
// Configuracoes do laboratorio. Hoje: escolher o tamanho da tela OLED
// (128x64, 128x32 ou personalizado). Aplicar reseta a simulacao no novo tamanho.
// ============================================================================

import { useEffect, useState } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  size: ScreenSize;
  onApply: (size: ScreenSize) => void;
  onClose: () => void;
}

const PRESETS: { label: string; size: ScreenSize }[] = [
  { label: '128 × 64', size: { width: 128, height: 64 } },
  { label: '128 × 32', size: { width: 128, height: 32 } },
];

const MIN = 8;
const MAX = 256;

export function SettingsModal({ open, size, onApply, onClose }: Props) {
  const [w, setW] = useState(size.width);
  const [h, setH] = useState(size.height);

  // Sincroniza os campos quando o modal abre.
  useEffect(() => {
    if (open) { setW(size.width); setH(size.height); }
  }, [open, size]);

  if (!open) return null;

  const isPreset = (p: ScreenSize) => p.width === w && p.height === h;
  const clamp = (n: number) => Math.max(MIN, Math.min(MAX, Math.round(n) || MIN));

  function apply() {
    onApply({ width: clamp(w), height: clamp(h) });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">⚙ Configuracoes</h2>
          <button className="modal-close" onClick={onClose} title="Fechar">✕</button>
        </div>

        <h3 className="settings-label">Tamanho da tela</h3>
        <div className="settings-presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={'preset-btn' + (isPreset(p.size) ? ' preset-btn-active' : '')}
              onClick={() => { setW(p.size.width); setH(p.size.height); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <h3 className="settings-label">Personalizado</h3>
        <div className="settings-custom">
          <label className="pin-field">
            Largura
            <input type="number" min={MIN} max={MAX} value={w} onChange={(e) => setW(Number(e.target.value))} />
          </label>
          <span className="settings-x">×</span>
          <label className="pin-field">
            Altura
            <input type="number" min={MIN} max={MAX} value={h} onChange={(e) => setH(Number(e.target.value))} />
          </label>
          <span className="pins-hint">de {MIN} a {MAX} px</span>
        </div>

        <p className="settings-warn">Aplicar reinicia a simulacao no novo tamanho.</p>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={apply}>Aplicar</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
