// Componente: lista hierárquica das instâncias na cena com seleção e remoção
import { useSceneStore } from '../../store/useSceneStore';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import type { ModelInstance } from '../../core/entities/types';

interface InstanceItemProps {
  instance: ModelInstance;
  level: number; // Nível de indentação na hierarquia (0 = raiz)
  children: ModelInstance[];
  allInstances: ModelInstance[];
  selectedId: string | null;
}

// Renderiza um item da lista com seus filhos de forma recursiva
function InstanceItem({
  instance,
  level,
  children,
  allInstances,
  selectedId,
}: InstanceItemProps) {
  const selectInstance = useSceneStore((s) => s.selectInstance);
  const removeModel    = useSceneStore((s) => s.removeModel);

  const isSelected = selectedId === instance.id;

  return (
    <div>
      {/* Item da instância */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded cursor-pointer group',
          isSelected
            ? 'bg-blue-600 text-white'
            : 'hover:bg-slate-700 text-slate-300'
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => selectInstance(instance.id)}
      >
        {/* Indicador de hierarquia */}
        {level > 0 && (
          <span className="text-slate-500 text-xs mr-1">└</span>
        )}

        {/* Nome da instância */}
        <span className="flex-1 text-xs truncate">{instance.name}</span>

        {/* Botão remover (visível ao passar o mouse) */}
        <button
          className={cn(
            'opacity-0 group-hover:opacity-100 text-xs px-1 rounded',
            isSelected
              ? 'hover:bg-blue-700 text-blue-200'
              : 'hover:bg-red-800 text-red-400'
          )}
          onClick={(e) => {
            e.stopPropagation();
            removeModel(instance.id);
          }}
          title="Remover da cena"
        >
          ✕
        </button>
      </div>

      {/* Renderiza filhos recursivamente */}
      {children.map((child) => (
        <InstanceItem
          key={child.id}
          instance={child}
          level={level + 1}
          children={allInstances.filter((i) => i.parentId === child.id)}
          allInstances={allInstances}
          selectedId={selectedId}
        />
      ))}
    </div>
  );
}

// Componente principal da lista
export function InstanceList() {
  const instances    = useSceneStore((s) => s.instances);
  const selectedId   = useSceneStore((s) => s.selectedId);
  const clearScene   = useSceneStore((s) => s.clearScene);

  // Instâncias raiz (sem pai)
  const rootInstances = instances.filter((i) => i.parentId === null);

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Cena ({instances.length})
        </h3>
        {instances.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearScene}
            title="Limpar cena"
            className="text-xs text-red-400 hover:text-red-300 h-6 px-2"
          >
            Limpar
          </Button>
        )}
      </div>

      {/* Lista rolável */}
      <div className="flex-1 overflow-y-auto py-1">
        {instances.length === 0 ? (
          <p className="text-xs text-slate-600 text-center p-4">
            Clique em um modelo à direita para adicionar à cena.
          </p>
        ) : (
          rootInstances.map((instance) => (
            <InstanceItem
              key={instance.id}
              instance={instance}
              level={0}
              children={instances.filter((i) => i.parentId === instance.id)}
              allInstances={instances}
              selectedId={selectedId}
            />
          ))
        )}
      </div>
    </div>
  );
}
