// Testes: caso de uso removeInstance
import { describe, it, expect } from 'vitest';
import { removeInstance } from '../../core/useCases/removeInstance';
import type { ModelInstance } from '../../core/entities/types';

// Cria instância mock para os testes
function createMockInstance(id: string, parentId: string | null = null): ModelInstance {
  return {
    id,
    modelId: 'test',
    name: `Objeto ${id}`,
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

describe('removeInstance', () => {
  it('deve remover a instância pelo ID', () => {
    const instances = [createMockInstance('a'), createMockInstance('b')];
    const result = removeInstance(instances, 'a');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('deve desvinuclar filhos do objeto removido', () => {
    const instances = [
      createMockInstance('parent'),
      createMockInstance('child', 'parent'),
    ];
    const result = removeInstance(instances, 'parent');
    // O filho deve ter parentId como null após remoção do pai
    expect(result[0].parentId).toBeNull();
  });

  it('não deve alterar objetos não relacionados', () => {
    const instances = [
      createMockInstance('a'),
      createMockInstance('b', 'c'), // Pai diferente
    ];
    const result = removeInstance(instances, 'a');
    expect(result[0].parentId).toBe('c'); // Não foi alterado
  });

  it('deve retornar lista vazia ao remover único item', () => {
    const instances = [createMockInstance('only')];
    const result = removeInstance(instances, 'only');
    expect(result).toHaveLength(0);
  });
});
