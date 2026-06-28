// Componente: barra de ferramentas superior com ações globais (salvar/carregar cena)
import { useRef } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { Button } from '../ui/button';

export function Toolbar() {
  const saveScene         = useSceneStore((s) => s.saveScene);
  const loadSceneFromFile = useSceneStore((s) => s.loadSceneFromFile);
  const instances         = useSceneStore((s) => s.instances);
  // Referência ao input de arquivo oculto para carregar cena
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lê o arquivo JSON selecionado e carrega a cena
  const onFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      try {
        loadSceneFromFile(json);
      } catch (err) {
        alert((err as Error).message);
      }
    };
    reader.readAsText(file);
    // Limpa o valor para permitir carregar o mesmo arquivo novamente
    e.target.value = '';
  };

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-3">
      {/* Logo / título */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
          3D
        </div>
        <span className="text-sm font-semibold text-slate-200">Editor de Cena</span>
      </div>

      {/* Separador */}
      <div className="h-6 w-px bg-slate-700" />

      {/* Botão salvar cena como JSON */}
      <Button
        variant="secondary"
        size="sm"
        onClick={saveScene}
        disabled={instances.length === 0}
        title="Exporta a cena atual como arquivo JSON"
      >
        ↓ Salvar Cena
      </Button>

      {/* Botão carregar cena de JSON */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        title="Carrega uma cena salva em arquivo JSON"
      >
        ↑ Carregar Cena
      </Button>

      {/* Input oculto para seleção de arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={onFileLoad}
      />

      {/* Espaço flexível */}
      <div className="flex-1" />

      {/* Informações da cena */}
      <span className="text-xs text-slate-500">
        {instances.length} objeto{instances.length !== 1 ? 's' : ''} na cena
      </span>

      {/* Instrução de uso */}
      <span className="text-xs text-slate-600 hidden lg:block">
        Clique num modelo (direita) para adicionar · Clique no objeto 3D para selecionar
      </span>
    </header>
  );
}
