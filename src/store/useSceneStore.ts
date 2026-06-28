// Store Zustand: gerencia o estado da cena (instâncias, seleção, hierarquia)
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ModelInstance,
  ModelDefinition,
  Transform,
  AnimationConfig,
  TextureConfig,
} from '../core/entities/types';
import { addInstance }           from '../core/useCases/addInstance';
import { removeInstance }        from '../core/useCases/removeInstance';
import { updateTransformation }  from '../core/useCases/updateTransformation';
import { setHierarchy }          from '../core/useCases/setHierarchy';
import { loadScene }             from '../core/useCases/loadScene';
import { downloadScene }         from '../core/useCases/saveScene';

// Interface do estado e ações disponíveis
interface SceneStore {
  // Lista de todas as instâncias na cena
  instances: ModelInstance[];
  // ID da instância atualmente selecionada (null = nenhuma)
  selectedId: string | null;

  // Ações de gerenciamento de instâncias
  addModel:        (model: ModelDefinition) => void;
  removeModel:     (id: string) => void;
  selectInstance:  (id: string | null) => void;
  renameInstance:  (id: string, newName: string) => void;

  // Ações de transformação
  updatePosition: (id: string, position: Partial<Transform['position']>) => void;
  updateRotation: (id: string, rotation: Partial<Transform['rotation']>) => void;
  updateScale:    (id: string, scale: Partial<Transform['scale']>) => void;

  // Ação de hierarquia
  setParent: (childId: string, parentId: string | null) => void;

  // Ações de animação
  updateAnimation: (id: string, animation: Partial<AnimationConfig>) => void;

  // Ações de textura
  updateTexture: (id: string, texture: Partial<TextureConfig>) => void;

  // Ações de persistência
  saveScene:          () => void;
  loadSceneFromFile:  (json: string) => void;
  clearScene:         () => void;
}

export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector((set, get) => ({
    instances:  [],
    selectedId: null,

    addModel: (model) => {
      const newInstance = addInstance(model);
      set((state) => ({
        instances:  [...state.instances, newInstance],
        selectedId: newInstance.id,
      }));
    },

    removeModel: (id) => {
      set((state) => ({
        instances: removeInstance(state.instances, id),
        // Se o selecionado foi removido, limpa a seleção
        selectedId: state.selectedId === id ? null : state.selectedId,
      }));
    },

    selectInstance: (id) => {
      set({ selectedId: id });
    },

    renameInstance: (id, newName) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === id ? { ...inst, name: newName } : inst
        ),
      }));
    },

    updatePosition: (id, position) => {
      set((state) => ({
        instances: updateTransformation(state.instances, id, {
          position: {
            ...state.instances.find((i) => i.id === id)!.transform.position,
            ...position,
          },
        }),
      }));
    },

    updateRotation: (id, rotation) => {
      set((state) => ({
        instances: updateTransformation(state.instances, id, {
          rotation: {
            ...state.instances.find((i) => i.id === id)!.transform.rotation,
            ...rotation,
          },
        }),
      }));
    },

    updateScale: (id, scale) => {
      set((state) => ({
        instances: updateTransformation(state.instances, id, {
          scale: {
            ...state.instances.find((i) => i.id === id)!.transform.scale,
            ...scale,
          },
        }),
      }));
    },

    setParent: (childId, parentId) => {
      set((state) => ({
        instances: setHierarchy(state.instances, childId, parentId),
      }));
    },

    updateAnimation: (id, animation) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === id
            ? { ...inst, animation: { ...inst.animation, ...animation } }
            : inst
        ),
      }));
    },

    updateTexture: (id, texture) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === id
            ? { ...inst, texture: { ...inst.texture, ...texture } }
            : inst
        ),
      }));
    },

    saveScene: () => {
      downloadScene(get().instances);
    },

    loadSceneFromFile: (json) => {
      const instances = loadScene(json);
      set({ instances, selectedId: null });
    },

    clearScene: () => {
      set({ instances: [], selectedId: null });
    },
  }))
);
