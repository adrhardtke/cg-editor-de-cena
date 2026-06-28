// Store Zustand: gerencia o catálogo de modelos disponíveis
import { create } from 'zustand';
import type { ModelDefinition } from '../core/entities/types';

interface ModelsStore {
  // Lista de modelos disponíveis (carregada do manifesto JSON)
  models: ModelDefinition[];
  // Indica se os modelos estão sendo carregados
  loading: boolean;
  // Mensagem de erro caso o carregamento falhe
  error: string | null;
  // Ação para carregar o manifesto de modelos
  loadModels: () => Promise<void>;
}

export const useModelsStore = create<ModelsStore>()((set) => ({
  models:  [],
  loading: false,
  error:   null,

  loadModels: async () => {
    set({ loading: true, error: null });
    try {
      // Carrega o manifesto de modelos do servidor (arquivo público)
      const response = await fetch('/models/models.json');
      if (!response.ok) throw new Error('Falha ao carregar lista de modelos.');
      const models: ModelDefinition[] = await response.json();
      set({ models, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido.';
      set({ error: message, loading: false });
    }
  },
}));
