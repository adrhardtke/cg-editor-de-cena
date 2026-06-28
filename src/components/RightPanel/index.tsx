// Componente: painel direito com catálogo de modelos disponíveis
import { useEffect, useState } from 'react';
import { useModelsStore } from '../../store/useModelsStore';
import { useSceneStore }  from '../../store/useSceneStore';
import { ModelCard } from './ModelCard';
import type { ModelDefinition } from '../../core/entities/types';

export function RightPanel() {
  const { models, loading, error, loadModels } = useModelsStore();
  const addModel = useSceneStore((s) => s.addModel);
  // Campo de busca para filtrar modelos pelo nome
  const [search, setSearch] = useState('');

  // Carrega o manifesto de modelos ao montar o painel
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Filtra modelos pelo texto digitado na busca
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  // Adiciona o modelo selecionado à cena
  const onAdd = (model: ModelDefinition) => {
    addModel(model);
  };

  return (
    <aside className="w-52 bg-slate-900 border-l border-slate-700 flex flex-col h-full">
      {/* Cabeçalho do painel */}
      <div className="p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Modelos</h2>
        {/* Campo de busca */}
        <input
          type="text"
          placeholder="Buscar modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-7 px-2 text-xs bg-slate-800 border border-slate-600 rounded text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Área rolável com os cards de modelos */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center h-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center p-4">{error}</p>
        )}

        {!loading && !error && (
          // Grade 2 colunas de cards de modelo
          <div className="grid grid-cols-2 gap-2">
            {filteredModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredModels.length === 0 && (
          <p className="text-xs text-slate-500 text-center p-4">
            Nenhum modelo encontrado.
          </p>
        )}
      </div>

      {/* Rodapé com contagem */}
      <div className="p-2 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">
          {filteredModels.length} de {models.length} modelos
        </p>
      </div>
    </aside>
  );
}
