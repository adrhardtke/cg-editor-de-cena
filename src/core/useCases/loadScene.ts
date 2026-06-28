// Caso de uso: carrega e valida um JSON de cena salvo anteriormente
import type { SceneState, ModelInstance } from '../entities/types';

// Valida que o JSON tem a estrutura correta de SceneState
function validateSceneState(data: unknown): data is SceneState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj['version'] !== 'string') return false;
  if (!Array.isArray(obj['instances'])) return false;
  return true;
}

// Parseia o JSON e retorna as instâncias, lançando erro se inválido
export function loadScene(json: string): ModelInstance[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Arquivo JSON inválido ou corrompido.');
  }

  if (!validateSceneState(data)) {
    throw new Error('Formato de cena inválido: estrutura não reconhecida.');
  }

  return data.instances;
}
