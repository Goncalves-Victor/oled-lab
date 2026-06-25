// ============================================================================
// cloudSync.ts
// ----------------------------------------------------------------------------
// Sincroniza "Meus exemplos" com o Firebase Realtime Database, usando o NOME
// que o aluno digita como chave de acesso -- igual a um bloco de notas: o
// nome funciona como a "gaveta" onde os exemplos ficam guardados, em qualquer
// computador/celular.
//
// Reaproveita o MESMO projeto Firebase do EducaRino (bloco de notas), mas em
// um caminho proprio ("oledlab_exemplos/") para nao misturar com os
// documentos do bloco de notas ("documentos/").
// ============================================================================

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, type Unsubscribe } from 'firebase/database';
import { Example } from './examples';

const firebaseConfig = {
  apiKey: 'AIzaSyBZ4-9-9uegoCUHq3icNN1nI-8F7e9K8zU',
  authDomain: 'educarino-45cc8.firebaseapp.com',
  databaseURL: 'https://educarino-45cc8-default-rtdb.firebaseio.com',
  projectId: 'educarino-45cc8',
  storageBucket: 'educarino-45cc8.firebasestorage.app',
  messagingSenderId: '879757167851',
  appId: '1:879757167851:web:071a190e687697979502ae',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/** Transforma o nome digitado numa chave valida do Firebase (sem . # $ [ ] /). */
export function sanitizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[.#$[\]/]/g, '_');
}

function pathFor(name: string): string {
  return `oledlab_exemplos/${sanitizeName(name)}`;
}

function isExample(v: unknown): v is Example {
  const e = v as Example;
  return !!e && typeof e.id === 'string' && typeof e.title === 'string' && typeof e.code === 'string';
}

/**
 * Observa os exemplos salvos para um nome. Chama `onData` quando ja existem
 * exemplos salvos na nuvem (la ou daqui mesmo); chama `onEmpty` quando o nome
 * ainda nao tem nada salvo (assim quem chamou pode decidir manter a lista
 * local atual, que sera enviada para a nuvem no proximo salvamento).
 */
export function watchCloudExamples(
  name: string,
  onData: (examples: Example[]) => void,
  onEmpty: () => void,
  onError: (message: string) => void,
): Unsubscribe {
  const r = ref(db, pathFor(name));
  return onValue(
    r,
    (snapshot) => {
      const data = snapshot.val();
      if (data === null) {
        onEmpty();
        return;
      }
      const list = Array.isArray(data.exemplos) ? data.exemplos.filter(isExample) : [];
      onData(list);
    },
    (err) => onError(err.message),
  );
}

/** Salva a lista completa de exemplos do aluno sob o nome indicado. */
export function saveCloudExamples(name: string, examples: Example[]): Promise<void> {
  return set(ref(db, pathFor(name)), { exemplos: examples });
}
