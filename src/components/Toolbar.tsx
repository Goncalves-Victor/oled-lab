// ============================================================================
// Toolbar.tsx
// ----------------------------------------------------------------------------
// Botoes grandes de controle: Executar, Pausar, Continuar, Parar, Reiniciar,
// Passo a passo, velocidade, grade, copiar codigo e exportar .ino.
// ============================================================================

import { RunnerStatus } from '../simulator/runner';

interface Props {
  status: RunnerStatus;
  speed: number;
  showGrid: boolean;
  loop: boolean;
  autoRun: boolean;
  onToggleLoop: () => void;
  onToggleAuto: () => void;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleGrid: () => void;
  onCopy: () => void;
  onExport: () => void;
}

const SPEEDS = [0.5, 1, 2, 5];

export function Toolbar(props: Props) {
  const { status } = props;
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <button className="btn btn-primary" onClick={props.onRun} disabled={isRunning}>
          ▶ Executar
        </button>

        {isPaused ? (
          <button className="btn" onClick={props.onResume}>⏯ Continuar</button>
        ) : (
          <button className="btn" onClick={props.onPause} disabled={!isRunning}>⏸ Pausar</button>
        )}

        <button className="btn" onClick={props.onStop} disabled={status === 'idle'}>⏹ Parar</button>
        <button className="btn" onClick={props.onReset}>↺ Reiniciar</button>
        <button className="btn" onClick={props.onStep}>⏭ Passo</button>
      </div>

      <div className="toolbar-row">
        <label className="speed-label">
          Velocidade:
          <select
            className="select"
            value={props.speed}
            onChange={(e) => props.onSpeedChange(Number(e.target.value))}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </label>

        <label className="check-label">
          <input
            type="checkbox"
            checked={props.showGrid}
            onChange={props.onToggleGrid}
          />
          Grade
        </label>

        <label className="check-label">
          <input
            type="checkbox"
            checked={props.loop}
            onChange={props.onToggleLoop}
          />
          Repetir (loop)
        </label>

        <label className="check-label" title="Mostra o resultado na tela enquanto voce digita">
          <input
            type="checkbox"
            checked={props.autoRun}
            onChange={props.onToggleAuto}
          />
          Auto
        </label>

        <button className="btn btn-ghost" onClick={props.onCopy}>⧉ Copiar codigo</button>
        <button className="btn btn-ghost" onClick={props.onExport}>⬇ Exportar .ino</button>
      </div>
    </div>
  );
}
