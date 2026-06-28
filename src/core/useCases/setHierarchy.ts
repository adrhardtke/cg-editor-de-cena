// Caso de uso: define o pai de uma instância, evitando ciclos na hierarquia
import type { ModelInstance } from '../entities/types';

// Verifica se definir pai causaria um ciclo (ex: A -> B -> A)
function wouldCreateCycle(
  instances: ModelInstance[],
  childId: string,
  parentId: string
): boolean {
  let current: string | null = parentId;
  while (current !== null) {
    if (current === childId) return true;
    const inst = instances.find((i) => i.id === current);
    current = inst?.parentId ?? null;
  }
  return false;
}

// Atualiza o pai de uma instância, validando ciclos
export function setHierarchy(
  instances: ModelInstance[],
  childId: string,
  parentId: string | null
): ModelInstance[] {
  // Não permite que um nó seja pai de si mesmo
  if (parentId && wouldCreateCycle(instances, childId, parentId)) {
    throw new Error('Hierarquia inválida: criaria um ciclo entre as instâncias.');
  }

  return instances.map((inst) =>
    inst.id === childId ? { ...inst, parentId } : inst
  );
}
