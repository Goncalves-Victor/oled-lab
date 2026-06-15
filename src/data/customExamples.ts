// ============================================================================
// customExamples.ts
// ----------------------------------------------------------------------------
// Exemplos criados pelo proprio aluno (botao "Salvar atual"). Ficam guardados
// no localStorage para sobreviver entre as sessoes.
// ============================================================================

import { Example } from './examples';

const LS_KEY = 'oledlab.customExamples';

export function loadCustomExamples(): Example[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.code === 'string',
    );
  } catch {
    return [];
  }
}

export function saveCustomExamples(list: Example[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

// Gera um id unico simples para um exemplo novo.
export function newExampleId(): string {
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}
