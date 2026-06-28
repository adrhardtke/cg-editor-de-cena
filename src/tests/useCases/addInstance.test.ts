// Testes: caso de uso addInstance
import { describe, it, expect } from 'vitest';
import { addInstance } from '../../core/useCases/addInstance';
import type { ModelDefinition } from '../../core/entities/types';

// Modelo de exemplo para os testes
const exampleModel: ModelDefinition = {
  id: 'building_A',
  name: 'Edifício A',
  baseFile: 'building_A',
};

describe('addInstance', () => {
  it('deve criar uma instância com os valores padrão de transformação', () => {
    const instance = addInstance(exampleModel);

    // Posição inicial deve ser a origem
    expect(instance.transform.position).toEqual({ x: 0, y: 0, z: 0 });
    // Rotação inicial deve ser zero
    expect(instance.transform.rotation).toEqual({ x: 0, y: 0, z: 0 });
    // Escala inicial deve ser unitária
    expect(instance.transform.scale).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('deve associar o ID do modelo correto', () => {
    const instance = addInstance(exampleModel);
    expect(instance.modelId).toBe('building_A');
  });

  it('deve gerar um UUID único para cada instância', () => {
    const a = addInstance(exampleModel);
    const b = addInstance(exampleModel);
    expect(a.id).not.toBe(b.id);
  });

  it('deve iniciar sem pai (raiz da hierarquia)', () => {
    const instance = addInstance(exampleModel);
    expect(instance.parentId).toBeNull();
  });

  it('deve iniciar com animação desativada', () => {
    const instance = addInstance(exampleModel);
    expect(instance.animation.active).toBe(false);
  });

  it('deve iniciar com textura branca (sem tinting)', () => {
    const instance = addInstance(exampleModel);
    expect(instance.texture.tintColor).toBe('#ffffff');
    expect(instance.texture.opacity).toBe(1);
  });
});
