// ============================================================================
// App.tsx
// ----------------------------------------------------------------------------
// Componente principal. Junta editor, tela OLED, controles, exemplos e ajuda.
// Cuida tambem da persistencia (localStorage), live preview, tamanho de tela
// configuravel, ferramenta de desenho e exportacao do codigo .ino.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { OledCanvas } from './components/OledCanvas';
import { CodeEditor } from './components/CodeEditor';
import { Toolbar } from './components/Toolbar';
import { ExamplePanel } from './components/ExamplePanel';
import { FunctionHelp } from './components/FunctionHelp';
import { ExportModal } from './components/ExportModal';
import { SettingsModal, ScreenSize } from './components/SettingsModal';
import { DrawModal, PixelChange } from './components/DrawModal';
import { PanelLayout, PanelDef } from './components/PanelLayout';
import { Runner, RunnerStatus } from './simulator/runner';
import { parseProgram } from './simulator/parser';
import { DEFAULT_CODE, Example } from './data/examples';
import { loadCustomExamples, saveCustomExamples, newExampleId } from './data/customExamples';
import { buildDrawBlock, findDrawRegion, parseDrawBlock } from './data/drawBlock';
import { watchCloudExamples, saveCloudExamples } from './data/cloudSync';

// Chaves do localStorage.
const LS_CODE = 'oledlab.code';
const LS_GRID = 'oledlab.grid';
const LS_SPEED = 'oledlab.speed';
const LS_LOOP = 'oledlab.loop';
const LS_AUTO = 'oledlab.auto';
const LS_SIZE = 'oledlab.size';
const LS_NAME = 'oledlab.username';

type CloudStatus = 'idle' | 'loading' | 'syncing' | 'saved' | 'error';

function cloudStatusLabel(s: CloudStatus): string {
  switch (s) {
    case 'loading': return '⏳ Carregando seus exemplos...';
    case 'syncing': return '💾 Salvando...';
    case 'saved': return '✅ Sincronizado';
    case 'error': return '❌ Erro ao sincronizar';
    default: return '';
  }
}

interface Message {
  type: 'info' | 'error' | 'success';
  text: string;
}

function loadSize(): ScreenSize {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SIZE) || 'null');
    if (s && typeof s.width === 'number' && typeof s.height === 'number') return s;
  } catch { /* ignora */ }
  return { width: 128, height: 64 };
}

export default function App() {
  // ---- Estado ------------------------------------------------------------
  const [code, setCode] = useState<string>(() => localStorage.getItem(LS_CODE) ?? DEFAULT_CODE);
  const [showGrid, setShowGrid] = useState<boolean>(() => localStorage.getItem(LS_GRID) === 'true');
  const [speed, setSpeed] = useState<number>(() => Number(localStorage.getItem(LS_SPEED)) || 1);
  const [loop, setLoop] = useState<boolean>(() => localStorage.getItem(LS_LOOP) === 'true');
  const [autoRun, setAutoRun] = useState<boolean>(() => localStorage.getItem(LS_AUTO) !== 'false');
  const [size, setSize] = useState<ScreenSize>(() => loadSize());

  const [frame, setFrame] = useState<Uint8Array>(() => new Uint8Array(size.width * size.height));
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [message, setMessage] = useState<Message | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  // Nome do aluno: chave de acesso aos exemplos salvos na nuvem (Firebase).
  const [nameInput, setNameInput] = useState<string>(() => localStorage.getItem(LS_NAME) ?? '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem(LS_NAME) ?? '');

  // Se ja existe um nome salvo, comeca vazio (a nuvem preenche em seguida) --
  // evita mostrar por um instante a lista local generica de quem nao tem nome.
  const [customExamples, setCustomExamples] = useState<Example[]>(() => (userName ? [] : loadCustomExamples()));
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const lastSyncedJsonRef = useRef<string | null>(null);
  // So permite auto-salvar DEPOIS que a primeira leitura daquele nome chegou.
  // Evita que o estado inicial vazio ([]) seja escrito antes da carga da nuvem
  // -- como o Firebase apaga o no ao receber lista vazia, isso apagaria os
  // exemplos que estavam salvos ("salvo, aparece e some").
  const cloudReadyRef = useRef(false);

  // Modais.
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);

  // ---- Runner (criado uma unica vez) ------------------------------------
  const runnerRef = useRef<Runner | null>(null);
  if (runnerRef.current === null) {
    runnerRef.current = new Runner({
      onFrame: (f) => setFrame(f),
      onStatus: (s) => setStatus(s),
      onError: (msg) => setMessage({ type: 'error', text: msg }),
    });
  }
  const runner = runnerRef.current;

  useEffect(() => { runner.setSpeed(speed); }, [speed, runner]);
  useEffect(() => { runner.setLoop(loop); }, [loop, runner]);

  // ---- Persistencia ------------------------------------------------------
  useEffect(() => { localStorage.setItem(LS_CODE, code); }, [code]);
  useEffect(() => { localStorage.setItem(LS_GRID, String(showGrid)); }, [showGrid]);
  useEffect(() => { localStorage.setItem(LS_SPEED, String(speed)); }, [speed]);
  useEffect(() => { localStorage.setItem(LS_LOOP, String(loop)); }, [loop]);
  useEffect(() => { localStorage.setItem(LS_AUTO, String(autoRun)); }, [autoRun]);
  useEffect(() => { localStorage.setItem(LS_SIZE, JSON.stringify(size)); }, [size]);
  // So persiste na lista local generica quando NAO ha nome definido -- assim
  // a lista de um nome (mesmo vazia) nunca sobrescreve o backup local de quem
  // usa o app sem nome.
  useEffect(() => { if (!userName) saveCustomExamples(customExamples); }, [customExamples, userName]);

  // Confirma o nome digitado apos uma pausa de digitacao (igual ao live preview).
  useEffect(() => {
    const t = setTimeout(() => {
      const clean = nameInput.trim();
      setUserName(clean);
      localStorage.setItem(LS_NAME, clean);
    }, 600);
    return () => clearTimeout(t);
  }, [nameInput]);

  // Ao definir/trocar o nome: observa os exemplos daquele nome na nuvem.
  // Se ja existir algo salvo, substitui "Meus exemplos" pelo que veio da nuvem
  // (igual a abrir um documento no bloco de notas). Se o nome ainda nao tem
  // NADA salvo, comeca VAZIO -- nao herda a lista local de quem usa sem nome,
  // senao um nome novo "puxaria" exemplos de outra pessoa por engano.
  // Ao apagar o nome, volta a mostrar a lista local generica.
  useEffect(() => {
    cloudReadyRef.current = false; // ainda nao carregou este nome
    if (!userName) {
      setCloudStatus('idle');
      setCustomExamples(loadCustomExamples());
      return;
    }
    lastSyncedJsonRef.current = null;
    setCloudStatus('loading');
    const unsubscribe = watchCloudExamples(
      userName,
      (examples) => {
        lastSyncedJsonRef.current = JSON.stringify(examples);
        cloudReadyRef.current = true;
        setCustomExamples(examples);
        setCloudStatus('saved');
      },
      () => {
        lastSyncedJsonRef.current = JSON.stringify([]);
        cloudReadyRef.current = true;
        setCustomExamples([]);
        setCloudStatus('idle');
      },
      () => setCloudStatus('error'),
    );
    return unsubscribe;
  }, [userName]);

  // Envia "Meus exemplos" para a nuvem (debounce) sempre que mudar, enquanto
  // houver um nome definido. O guard com lastSyncedJsonRef evita reenviar o
  // que acabou de chegar da propria nuvem (eco do listener acima).
  useEffect(() => {
    if (!userName) return;
    if (!cloudReadyRef.current) return; // espera a carga inicial da nuvem
    const json = JSON.stringify(customExamples);
    if (json === lastSyncedJsonRef.current) return;
    setCloudStatus('syncing');
    const t = setTimeout(() => {
      saveCloudExamples(userName, customExamples)
        .then(() => { lastSyncedJsonRef.current = json; setCloudStatus('saved'); })
        .catch(() => setCloudStatus('error'));
    }, 600);
    return () => clearTimeout(t);
  }, [customExamples, userName]);

  const lastRunRef = useRef<string | null>(null);

  function runCode(c: string): boolean {
    const result = parseProgram(c);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      return false;
    }
    lastRunRef.current = c;
    runner.load(result.instructions);
    runner.run();
    setMessage(null);
    return true;
  }

  // Tamanho da tela: aplica no runner (reseta) e re-roda o codigo no novo tamanho.
  useEffect(() => {
    runner.setDimensions(size.width, size.height);
    lastRunRef.current = null;
    if (autoRun) runCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Live preview: roda o codigo automaticamente enquanto se digita.
  useEffect(() => {
    if (!autoRun) return;
    if (code === lastRunRef.current) return;
    const t = setTimeout(() => runCode(code), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, autoRun]);

  // ---- Acoes -------------------------------------------------------------
  function compile(): boolean {
    const result = parseProgram(code);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      return false;
    }
    runner.load(result.instructions);
    lastRunRef.current = code;
    setMessage({ type: 'success', text: `Codigo ok: ${result.instructions.length} comando(s).` });
    return true;
  }

  function handleRun() { if (compile()) runner.run(); }

  function handleStep() {
    if (status === 'idle' || status === 'done' || status === 'error') {
      if (!compile()) return;
    }
    runner.step();
  }

  function handleReset() { runner.reset(); setMessage(null); }

  function loadAndRun(c: string) { setCode(c); runCode(c); }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage({ type: 'success', text: 'Codigo copiado!' });
    } catch {
      setMessage({ type: 'error', text: 'Nao foi possivel copiar automaticamente.' });
    }
  }

  function handleSaveExample() {
    const title = window.prompt('Nome do exemplo:', 'Meu desenho');
    if (title === null) return;
    const clean = title.trim() || 'Sem nome';
    setCustomExamples((list) => [...list, { id: newExampleId(), title: clean, code }]);
    setMessage({ type: 'success', text: `Exemplo "${clean}" salvo!` });
  }

  function handleDeleteCustom(id: string) {
    setCustomExamples((list) => list.filter((e) => e.id !== id));
  }

  // Recebe os pixels alterados na ferramenta de desenho e MESCLA com o bloco
  // de desenho ja existente no codigo (se houver):
  //  - pixel que JA tinha override no bloco e foi apagado (virou 0) -> remove
  //    o comando (o aluno "desfez" aquele pixel, o codigo dele desaparece);
  //  - pixel novo, ou apagando algo que nao era do bloco (ex: parte de uma
  //    forma) -> entra/atualiza como comando no bloco.
  // Se no fim nao sobrar nenhum pixel no bloco, ele e removido do codigo.
  function handleDrawFinish(changes: PixelChange[]) {
    setCode((prev) => {
      const lines = prev.split('\n');
      const region = findDrawRegion(lines);
      const merged = new Map<string, 0 | 1>();
      if (region) {
        for (const [x, y, c] of parseDrawBlock(lines, region)) merged.set(`${x},${y}`, c);
      }
      for (const [x, y, c] of changes) {
        const key = `${x},${y}`;
        if (c === 0 && merged.has(key)) merged.delete(key);
        else merged.set(key, c);
      }

      let base = prev;
      if (region) {
        lines.splice(region.start, region.end - region.start + 1);
        base = lines.join('\n').replace(/\n{3,}/g, '\n\n');
      }
      base = base.trim();

      if (merged.size === 0) return base;
      const finalChanges: PixelChange[] = [...merged.entries()].map(([key, c]) => {
        const [x, y] = key.split(',').map(Number);
        return [x, y, c];
      });
      const block = buildDrawBlock(finalChanges);
      return base ? base + '\n\n' + block : block;
    });
    setMessage({ type: 'success', text: 'Desenho atualizado no editor.' });
  }

  // Escala do canvas para caber ~640px de largura.
  const scale = Math.max(2, Math.round(640 / size.width));
  const statusLabel = useMemo(() => statusToLabel(status), [status]);

  // ---- Paineis -----------------------------------------------------------
  const panels: PanelDef[] = [
    {
      id: 'editor',
      title: 'Editor de comandos',
      children: (
        <>
          <CodeEditor
            value={code}
            onChange={setCode}
            onClear={() => { setCode(''); runner.reset(); setMessage(null); lastRunRef.current = ''; }}
          />
          <h3 className="col-subtitle">Exemplos prontos</h3>
          <ExamplePanel
            custom={customExamples}
            onLoad={loadAndRun}
            onSaveCurrent={handleSaveExample}
            onDeleteCustom={handleDeleteCustom}
          />
        </>
      ),
    },
    {
      id: 'screen',
      title: 'Tela OLED',
      className: 'col-screen',
      children: (
        <>
          <div className="screen-box">
            <OledCanvas
              frame={frame}
              width={size.width}
              height={size.height}
              scale={scale}
              showGrid={showGrid}
              onHover={setHover}
            />
          </div>
          <div className="coord-bar">
            {hover ? `x: ${hover.x}  y: ${hover.y}` : '-'}
            <span className={`status-pill status-${status}`}>{statusLabel}</span>
          </div>

          <Toolbar
            status={status}
            speed={speed}
            showGrid={showGrid}
            loop={loop}
            autoRun={autoRun}
            onToggleLoop={() => setLoop((l) => !l)}
            onToggleAuto={() => setAutoRun((a) => !a)}
            onRun={handleRun}
            onPause={() => runner.pause()}
            onResume={() => runner.resume()}
            onStop={() => runner.stop()}
            onReset={handleReset}
            onStep={handleStep}
            onSpeedChange={setSpeed}
            onToggleGrid={() => setShowGrid((g) => !g)}
            onCopy={handleCopy}
            onExport={() => setExportOpen(true)}
          />

          {message && <div className={`message message-${message.type}`}>{message.text}</div>}
        </>
      ),
    },
    {
      id: 'help',
      title: 'Documentação das funções',
      children: (
        <FunctionHelp
          onInsertExample={(c) => setCode((prev) => (prev.trimEnd() + '\n' + c).trimStart())}
        />
      ),
    },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>OLED Lab</h1>
          <button
            className="icon-btn header-pencil"
            onClick={() => setDrawOpen(true)}
            title="Desenhar na tela"
          >🤘</button>
          <span className="subtitle">
            Simulador de tela OLED SSD1306 · {size.width} × {size.height}
          </span>
        </div>
        <div className="header-actions">
          <div className="name-field" title="Digite seu nome para salvar/carregar 'Meus exemplos' na nuvem">
            <input
              type="text"
              className="name-input"
              placeholder="Seu nome..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            {userName && (
              <span className={`cloud-status cloud-status-${cloudStatus}`}>{cloudStatusLabel(cloudStatus)}</span>
            )}
          </div>
          <button
            className="icon-btn header-gear"
            onClick={() => setSettingsOpen(true)}
            title="Configuracoes"
          >⚙</button>
        </div>
      </header>

      <PanelLayout panels={panels} />

      <ExportModal open={exportOpen} code={code} width={size.width} height={size.height} onClose={() => setExportOpen(false)} />
      <SettingsModal open={settingsOpen} size={size} onApply={setSize} onClose={() => setSettingsOpen(false)} />
      <DrawModal open={drawOpen} width={size.width} height={size.height} initialFrame={frame} onFinish={handleDrawFinish} onClose={() => setDrawOpen(false)} />
    </div>
  );
}

function statusToLabel(status: RunnerStatus): string {
  switch (status) {
    case 'running': return 'executando';
    case 'paused': return 'pausado';
    case 'done': return 'concluido';
    case 'error': return 'erro';
    default: return 'parado';
  }
}
