// Caso de uso: serializa a cena atual para JSON e dispara o download
import type { ModelInstance, SceneState } from '../entities/types';

// Converte a lista de instâncias em um objeto SceneState serializável
export function serializeScene(instances: ModelInstance[]): SceneState {
  return {
    version: '1.0',
    instances,
  };
}

// Faz o download do JSON da cena no navegador
export function downloadScene(instances: ModelInstance[], fileName = 'scene.json'): void {
  const state = serializeScene(instances);
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  // Libera a URL temporária após o download
  URL.revokeObjectURL(url);
}
