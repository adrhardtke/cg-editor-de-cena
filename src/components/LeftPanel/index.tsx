// Componente: painel esquerdo dividido em lista de objetos da cena e editor de propriedades
import { InstanceList }    from './InstanceList';
import { TransformEditor } from './TransformEditor';

export function LeftPanel() {
  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
      {/* Seção superior: lista de instâncias na cena (ocupa ~40% do painel) */}
      <div className="h-[40%] flex flex-col border-b border-slate-700">
        <InstanceList />
      </div>

      {/* Seção inferior: editor de transformações do objeto selecionado */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Propriedades
          </h3>
        </div>
        <TransformEditor />
      </div>
    </aside>
  );
}
