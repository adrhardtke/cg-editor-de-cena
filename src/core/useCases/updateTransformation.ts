// Caso de uso: atualiza a transformação (posição, rotação, escala) de uma instância
import type { ModelInstance, Transform } from '../entities/types';

// Retorna nova lista com a instância atualizada (imutável)
export function updateTransformation(
  instances: ModelInstance[],
  id: string,
  transform: Partial<Transform>
): ModelInstance[] {
  return instances.map((inst) =>
    inst.id === id
      ? { ...inst, transform: { ...inst.transform, ...transform } }
      : inst
  );
}
