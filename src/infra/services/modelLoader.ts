// Serviço: carrega arquivos OBJ + MTL via Three.js e mantém cache na memória
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

// Cache global: cada modelo é carregado apenas uma vez na memória
const modelCache = new Map<string, THREE.Group>();

// Caminho base onde os arquivos OBJ estão servidos
const BASE_PATH = '/models/';

/**
 * Carrega um modelo OBJ com seu MTL associado.
 * Se o modelo já foi carregado, retorna o cache (sem novo request HTTP).
 */
export async function loadModel(baseFile: string): Promise<THREE.Group> {
  // Retorna do cache se já foi carregado antes
  if (modelCache.has(baseFile)) {
    return modelCache.get(baseFile)!;
  }

  // Carrega o material (.mtl) antes do objeto (.obj)
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath(BASE_PATH);

  const materials = await mtlLoader.loadAsync(`${baseFile}.mtl`);
  materials.preload();

  // Carrega o objeto (.obj) usando os materiais do MTL
  const objLoader = new OBJLoader();
  objLoader.setPath(BASE_PATH);
  objLoader.setMaterials(materials);

  const group = await objLoader.loadAsync(`${baseFile}.obj`);

  // Centraliza o modelo em torno da origem
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.sub(center);

  // Guarda no cache para reuso por instâncias futuras
  modelCache.set(baseFile, group);

  return group;
}

/**
 * Cria uma cópia de instância de um modelo.
 * A geometria é compartilhada entre instâncias (apenas materiais e transforms diferem).
 */
export function createModelInstance(baseModel: THREE.Group): THREE.Group {
  const instance = baseModel.clone();

  // Clona os materiais para que alterações de cor/opacidade sejam por instância
  instance.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = child.material as THREE.Material;
      child.material = mat.clone();
    }
  });

  return instance;
}

/**
 * Limpa o cache de modelos (útil em testes ou ao trocar de cena).
 */
export function clearModelCache(): void {
  modelCache.clear();
}
