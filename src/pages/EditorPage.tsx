// Página principal: compõe o layout completo do editor de cena
import { Toolbar }     from '../components/Toolbar';
import { LeftPanel }   from '../components/LeftPanel';
import { SceneCanvas } from '../components/SceneCanvas';
import { RightPanel }  from '../components/RightPanel';

export function EditorPage() {
  return (
    // Layout de tela cheia em coluna: barra superior + área de trabalho
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">

      {/* Barra de ferramentas com ações globais */}
      <Toolbar />

      {/* Área de trabalho: painel esquerdo + canvas 3D + painel direito */}
      <div className="flex flex-1 overflow-hidden">

        {/* Painel esquerdo: lista de objetos + editor de propriedades */}
        <LeftPanel />

        {/* Canvas WebGL que ocupa todo o espaço restante */}
        <main className="flex-1 relative overflow-hidden">
          <SceneCanvas />

          {/* Dica de controles da câmera */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-slate-900/70 backdrop-blur text-xs text-slate-400 px-3 py-1 rounded-full border border-slate-700">
              Botão esquerdo: rodar · Direito: mover · Scroll: zoom
            </div>
          </div>
        </main>

        {/* Painel direito: catálogo de modelos disponíveis */}
        <RightPanel />
      </div>
    </div>
  );
}
