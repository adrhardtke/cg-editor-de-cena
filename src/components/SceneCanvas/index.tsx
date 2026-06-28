// Componente: canvas WebGL principal que hospeda a cena 3D
import { useEffect, useRef } from 'react';
import { SceneManager } from './sceneManager';
import { useSceneStore } from '../../store/useSceneStore';

export function SceneCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  // Mantém referência ao gerenciador Three.js fora do ciclo React
  const managerRef   = useRef<SceneManager | null>(null);

  // Instâncias e ações de seleção do store Zustand
  const instances       = useSceneStore((s) => s.instances);
  const selectInstance  = useSceneStore((s) => s.selectInstance);
  const selectedId      = useSceneStore((s) => s.selectedId);

  // Cria o gerenciador quando o canvas está disponível
  useEffect(() => {
    if (!canvasRef.current) return;

    // Instancia o gerenciador passando o callback de seleção por clique
    const manager = new SceneManager(
      canvasRef.current,
      (id) => selectInstance(id)
    );
    managerRef.current = manager;

    return () => {
      // Libera recursos WebGL ao desmontar
      manager.dispose();
      managerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincroniza a cena Three.js sempre que a lista de instâncias muda no store
  useEffect(() => {
    managerRef.current?.syncInstances(instances);
  }, [instances]);

  // Atualiza o destaque visual quando a seleção muda
  useEffect(() => {
    managerRef.current?.selectInstance(selectedId);
  }, [selectedId]);

  return (
    // O canvas ocupa todo o espaço disponível no layout flex
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  );
}
