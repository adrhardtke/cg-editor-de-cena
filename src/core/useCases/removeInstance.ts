// Caso de uso: remove uma instância da cena e desvincula filhos dela
import type { ModelInstance } from '../entities/types';

// Remove a instância pelo ID e limpa referências de pai em filhos diretos
export function removeInstance(
  instances: ModelInstance[],
  id: string
): ModelInstance[] {
  return instances
    // Remove a instância alvo
    .filter((inst) => inst.id !== id)
    // Filhos que apontavam para ela ficam sem pai (raiz)
    .map((inst) =>
      inst.parentId === id ? { ...inst, parentId: null } : inst
    );
}
