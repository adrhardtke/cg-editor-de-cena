// Caso de uso: adiciona uma nova instância de modelo à cena
import { v4 as uuidv4 } from 'uuid';
import type { ModelInstance, ModelDefinition } from '../entities/types';
import { DEFAULT_TRANSFORM, DEFAULT_ANIMATION, DEFAULT_TEXTURE } from '../entities/types';

// Cria uma nova instância com valores padrão para um modelo fornecido
export function addInstance(model: ModelDefinition): ModelInstance {
  return {
    id: uuidv4(),
    modelId: model.id,
    name: model.name,
    parentId: null,
    transform: {
      position: { ...DEFAULT_TRANSFORM.position },
      rotation: { ...DEFAULT_TRANSFORM.rotation },
      scale:    { ...DEFAULT_TRANSFORM.scale },
    },
    animation: { ...DEFAULT_ANIMATION, direction: { ...DEFAULT_ANIMATION.direction } },
    texture:   { ...DEFAULT_TEXTURE },
  };
}
