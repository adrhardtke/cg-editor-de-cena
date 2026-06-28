// Testes: casos de uso de persistência (salvar/carregar cena)
import { describe, it, expect } from 'vitest';
import { serializeScene } from '../../core/useCases/saveScene';
import { loadScene }      from '../../core/useCases/loadScene';
import type { ModelInstance } from '../../core/entities/types';

// Instância de exemplo para os testes
const exampleInstance: ModelInstance = {
  id: 'inst-001',
  modelId: 'building_A',
  name: 'Edifício A',
  parentId: null,
  transform: {
    position: { x: 2, y: 0, z: -3 },
    rotation: { x: 0, y: 90, z: 0 },
    scale:    { x: 1, y: 1, z: 1 },
  },
  animation: { active: false, direction: { x: 1, y: 0, z: 0 }, speed: 1 },
  texture:   { tintColor: '#ff0000', opacity: 0.8 },
};

describe('serializeScene', () => {
  it('deve gerar objeto com versão e lista de instâncias', () => {
    const state = serializeScene([exampleInstance]);
    expect(state.version).toBe('1.0');
    expect(state.instances).toHaveLength(1);
  });

  it('deve preservar todas as propriedades das instâncias', () => {
    const state = serializeScene([exampleInstance]);
    const inst = state.instances[0];
    expect(inst.id).toBe('inst-001');
    expect(inst.transform.position.x).toBe(2);
    expect(inst.texture.tintColor).toBe('#ff0000');
    expect(inst.animation.active).toBe(false);
  });
});

describe('loadScene', () => {
  it('deve restaurar instâncias a partir do JSON serializado', () => {
    const json = JSON.stringify(serializeScene([exampleInstance]));
    const instances = loadScene(json);
    expect(instances).toHaveLength(1);
    expect(instances[0].id).toBe('inst-001');
  });

  it('deve lançar erro para JSON malformado', () => {
    expect(() => loadScene('não é json')).toThrow('Arquivo JSON inválido');
  });

  it('deve lançar erro para JSON sem estrutura de cena', () => {
    expect(() => loadScene('{"outro": "formato"}')).toThrow(
      'Formato de cena inválido'
    );
  });

  it('deve ser uma operação de ida e volta perfeita (round-trip)', () => {
    const originalInstances = [exampleInstance];
    const json = JSON.stringify(serializeScene(originalInstances));
    const restoredInstances = loadScene(json);
    expect(restoredInstances).toEqual(originalInstances);
  });
});
