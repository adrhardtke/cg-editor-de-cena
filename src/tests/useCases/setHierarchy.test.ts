// Testes: caso de uso setHierarchy (com validação de ciclos)
import { describe, it, expect } from 'vitest';
import { setHierarchy } from '../../core/useCases/setHierarchy';
import type { ModelInstance } from '../../core/entities/types';

function createMockInstance(id: string, parentId: string | null = null): ModelInstance {
  return {
    id,
    modelId: 'test',
    name: id,
    parentId,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale:    { x: 1, y: 1, z: 1 },
    },
    animation: { active: false, direction: { x: 1, y: 0, z: 0 }, speed: 1 },
    texture:   { tintColor: '#ffffff', opacity: 1 },
  };
}

describe('setHierarchy', () => {
  it('deve definir o pai de uma instância', () => {
    const instances = [createMockInstance('child'), createMockInstance('parent')];
    const result = setHierarchy(instances, 'child', 'parent');
    expect(result.find((i) => i.id === 'child')?.parentId).toBe('parent');
  });

  it('deve remover o pai (definir como raiz) quando parentId é null', () => {
    const instances = [createMockInstance('child', 'parent'), createMockInstance('parent')];
    const result = setHierarchy(instances, 'child', null);
    expect(result.find((i) => i.id === 'child')?.parentId).toBeNull();
  });

  it('deve lançar erro ao criar ciclo direto (A → B → A)', () => {
    const instances = [
      createMockInstance('A', 'B'), // A já tem B como pai
      createMockInstance('B'),
    ];
    // Tentar fazer B ser pai de A criaria A → B → A
    expect(() => setHierarchy(instances, 'B', 'A')).toThrow('ciclo');
  });

  it('deve lançar erro ao criar ciclo indireto (A → B → C → A)', () => {
    const instances = [
      createMockInstance('A', 'B'),
      createMockInstance('B', 'C'),
      createMockInstance('C'),
    ];
    // C → A criaria o ciclo A → B → C → A
    expect(() => setHierarchy(instances, 'C', 'A')).toThrow('ciclo');
  });

  it('não deve alterar outras instâncias', () => {
    const instances = [
      createMockInstance('A'),
      createMockInstance('B'),
      createMockInstance('C', 'B'),
    ];
    const result = setHierarchy(instances, 'A', 'B');
    // C continua com B como pai
    expect(result.find((i) => i.id === 'C')?.parentId).toBe('B');
  });
});
