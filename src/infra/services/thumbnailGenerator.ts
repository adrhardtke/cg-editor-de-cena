// Serviço: renderiza cada modelo em um canvas fora de tela para gerar miniaturas
import * as THREE from 'three';
import { loadModel } from './modelLoader';

// Cache das miniaturas já geradas (Data URL PNG)
const thumbnailCache = new Map<string, string>();

// Renderer compartilhado entre todas as gerações de miniatura
let thumbnailRenderer: THREE.WebGLRenderer | null = null;

function getThumbnailRenderer(): THREE.WebGLRenderer {
  if (!thumbnailRenderer) {
    // Cria um renderer pequeno fora de tela para miniaturas
    thumbnailRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    thumbnailRenderer.setSize(128, 128);
    thumbnailRenderer.setPixelRatio(1);
  }
  return thumbnailRenderer;
}

/**
 * Gera uma miniatura PNG (base64) de um modelo OBJ.
 * Usa um renderer compartilhado fora de tela para não criar múltiplos contextos WebGL.
 */
export async function generateThumbnail(baseFile: string): Promise<string> {
  // Retorna do cache se já foi gerada
  if (thumbnailCache.has(baseFile)) {
    return thumbnailCache.get(baseFile)!;
  }

  const renderer = getThumbnailRenderer();

  // Monta cena temporária apenas para a miniatura
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e293b); // Fundo escuro para contraste

  // Câmera isométrica para visualização bonita do modelo
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  // Iluminação da cena de pré-visualização
  const ambientLight     = new THREE.AmbientLight(0xffffff, 0.6);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 8, 5);
  scene.add(ambientLight, directionalLight);

  // Carrega e posiciona o modelo
  const baseModel = await loadModel(baseFile);
  const model = baseModel.clone();
  scene.add(model);

  // Calcula a distância ideal da câmera para enquadrar o modelo
  const box    = new THREE.Box3().setFromObject(model);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const radius = sphere.radius || 1;

  // Posiciona câmera em ângulo isométrico
  const distance = radius * 2.5;
  camera.position.set(distance, distance * 0.8, distance);
  camera.lookAt(0, 0, 0);

  // Renderiza e captura como imagem
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');

  // Guarda no cache
  thumbnailCache.set(baseFile, dataUrl);

  // Limpa a cena temporária
  scene.clear();

  return dataUrl;
}

/**
 * Libera o renderer compartilhado (chamar ao desmontar a aplicação).
 */
export function disposeThumbnailRenderer(): void {
  thumbnailRenderer?.dispose();
  thumbnailRenderer = null;
  thumbnailCache.clear();
}
