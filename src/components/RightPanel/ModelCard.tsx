// Componente: card de um modelo no catálogo com miniatura 3D gerada dinamicamente
import { useState, useEffect } from 'react';
import type { ModelDefinition } from '../../core/entities/types';
import { generateThumbnail } from '../../infra/services/thumbnailGenerator';
import { cn } from '../../utils/cn';

interface ModelCardProps {
  model: ModelDefinition;
  // Callback chamado quando o usuário clica para adicionar o modelo à cena
  onAdd: (model: ModelDefinition) => void;
}

export function ModelCard({ model, onAdd }: ModelCardProps) {
  // URL da imagem de miniatura gerada pelo renderer Three.js
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  // Gera a miniatura quando o componente é montado (lazy loading)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    generateThumbnail(model.baseFile)
      .then((url) => {
        if (!cancelled) {
          setThumbnail(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [model.baseFile]);

  return (
    // Card clicável que adiciona o modelo à cena
    <button
      className={cn(
        'w-full flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-700',
        'bg-slate-800 hover:bg-slate-700 hover:border-blue-500 transition-all',
        'cursor-pointer group'
      )}
      onClick={() => onAdd(model)}
      title={`Adicionar ${model.name} à cena`}
    >
      {/* Área da miniatura 3D */}
      <div className="w-full aspect-square bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
        {loading && (
          // Indicador de carregamento enquanto renderiza a miniatura
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
        {thumbnail && !loading && (
          <img
            src={thumbnail}
            alt={model.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        )}
        {!thumbnail && !loading && (
          <span className="text-slate-600 text-xs">Erro</span>
        )}
      </div>

      {/* Nome do modelo */}
      <span className="text-xs text-slate-300 text-center leading-tight truncate w-full">
        {model.name}
      </span>
    </button>
  );
}
