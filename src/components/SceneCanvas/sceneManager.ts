// Gerenciador da cena 3D: encapsula toda a lógica Three.js/WebGL
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelInstance, TextureConfig } from '../../core/entities/types';
import { loadModel, createModelInstance } from '../../infra/services/modelLoader';

// Callback chamado quando o usuário clica em um objeto ou no fundo
type SelectionCallback = (instanceId: string | null) => void;

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  // Cache de objetos Three.js na cena, indexados pelo ID da instância
  private objectsByInstanceId = new Map<string, THREE.Group>();

  // Estado das animações: instâncias com animação ativa
  private animatedInstances: ModelInstance[] = [];

  // ID da instância atualmente destacada (selecionada)
  private selectedId: string | null = null;

  // Grade de referência do chão
  private grid: THREE.GridHelper;
  // Canvas onde a cena é renderizada
  private canvas: HTMLCanvasElement;
  // Callback acionado ao clicar em um objeto
  private onSelection: SelectionCallback;

  constructor(canvas: HTMLCanvasElement, onSelection: SelectionCallback) {
    this.canvas = canvas;
    this.onSelection = onSelection;

    // ─── Renderer WebGL ───────────────────────────────────────────────
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ─── Cena e fundo ─────────────────────────────────────────────────
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b);
    this.scene.fog = new THREE.Fog(0x1e293b, 30, 80);

    // ─── Câmera perspectiva ──────────────────────────────────────────
    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(10, 8, 10);
    this.camera.lookAt(0, 0, 0);

    // ─── Controles orbitais (mouse para rotacionar/zoom/pan) ─────────
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2; // Impede câmera de passar pelo chão

    // ─── Iluminação ───────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Luz principal simulando sol
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    sunLight.position.set(10, 15, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.setScalar(2048);
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    this.scene.add(sunLight);

    // Luz de preenchimento suave pelo outro lado
    const fillLight = new THREE.DirectionalLight(0xc7d8ff, 0.4);
    fillLight.position.set(-8, 6, -8);
    this.scene.add(fillLight);

    // ─── Grade de referência do chão ──────────────────────────────────
    this.grid = new THREE.GridHelper(40, 40, 0x334155, 0x334155);
    this.scene.add(this.grid);

    // ─── Raycaster para picking com o mouse ──────────────────────────
    this.raycaster = new THREE.Raycaster();
    this.pointer   = new THREE.Vector2();

    // ─── Eventos ─────────────────────────────────────────────────────
    canvas.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);

    // Ajusta o tamanho inicial
    this.onResize();

    // Inicia o loop de renderização
    this.startLoop();
  }

  // ─── Loop de renderização e animação ──────────────────────────────────
  private startLoop(): void {
    const loop = (timestamp: number) => {
      this.rafId = requestAnimationFrame(loop);

      const delta = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      // Atualiza posição dos objetos com animação ativa
      this.updateAnimations(delta);

      // Atualiza controles orbitais (damping suave)
      this.controls.update();

      // Renderiza a cena
      this.renderer.render(this.scene, this.camera);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  // Aplica movimento contínuo aos objetos animados
  private updateAnimations(delta: number): void {
    for (const instance of this.animatedInstances) {
      const obj = this.objectsByInstanceId.get(instance.id);
      if (!obj) continue;

      const { direction, speed } = instance.animation;
      obj.position.x += direction.x * speed * delta;
      obj.position.y += direction.y * speed * delta;
      obj.position.z += direction.z * speed * delta;
    }
  }

  // ─── Picking: seleciona objeto clicado na cena ─────────────────────────
  private onClick = (event: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();

    // Converte coordenadas do mouse para NDC (-1 a +1)
    this.pointer.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
    this.pointer.y = ((event.clientY - rect.top)  / rect.height) * -2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Testa intersecção com todos os objetos da cena
    const objects      = Array.from(this.objectsByInstanceId.values());
    const intersections = this.raycaster.intersectObjects(objects, true);

    if (intersections.length > 0) {
      // Sobe na hierarquia Three.js até encontrar o grupo raiz da instância
      const instanceId = this.findInstanceId(intersections[0].object);
      this.onSelection(instanceId);
    } else {
      // Clicou no fundo: deseleciona
      this.onSelection(null);
    }
  };

  // Percorre a hierarquia Three.js para encontrar o grupo com userData.instanceId
  private findInstanceId(object: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData['instanceId']) {
        return current.userData['instanceId'] as string;
      }
      current = current.parent;
    }
    return null;
  }

  // ─── Redimensionamento do canvas ──────────────────────────────────────
  private onResize = (): void => {
    const width  = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  // ─── API pública: sincronização com o estado Zustand ──────────────────

  /**
   * Sincroniza os objetos Three.js com a lista de instâncias do store.
   * Adiciona novos, remove excluídos e atualiza os existentes.
   */
  async syncInstances(instances: ModelInstance[]): Promise<void> {
    const currentIds = new Set(instances.map((i) => i.id));

    // Remove instâncias que não existem mais no store
    for (const [id, obj] of this.objectsByInstanceId) {
      if (!currentIds.has(id)) {
        this.scene.remove(obj);
        this.objectsByInstanceId.delete(id);
      }
    }

    // Adiciona ou atualiza instâncias
    for (const instance of instances) {
      if (!this.objectsByInstanceId.has(instance.id)) {
        await this.addObjectToScene(instance);
      } else {
        this.updateObjectInScene(instance);
      }
    }

    // Atualiza a hierarquia de pai/filho na cena Three.js
    this.syncHierarchy(instances);

    // Atualiza lista de objetos animados
    this.animatedInstances = instances.filter((i) => i.animation.active);

    // Atualiza destaque visual do selecionado
    this.updateSelectionHighlight(this.selectedId);
  }

  // Carrega o modelo OBJ e adiciona o grupo à cena
  private async addObjectToScene(instance: ModelInstance): Promise<void> {
    const baseModel = await loadModel(instance.modelId);
    const group     = createModelInstance(baseModel);

    // Marca o grupo com o ID da instância para o picking
    group.userData['instanceId'] = instance.id;
    group.traverse((child) => {
      child.userData['instanceId'] = instance.id;
    });

    this.applyTransform(group, instance);
    this.applyTexture(group, instance.texture);

    this.scene.add(group);
    this.objectsByInstanceId.set(instance.id, group);
  }

  // Atualiza transformação e textura de um objeto existente
  private updateObjectInScene(instance: ModelInstance): void {
    const obj = this.objectsByInstanceId.get(instance.id);
    if (!obj) return;
    this.applyTransform(obj, instance);
    this.applyTexture(obj, instance.texture);
  }

  // Aplica posição, rotação (graus → radianos) e escala ao objeto Three.js
  private applyTransform(obj: THREE.Group, instance: ModelInstance): void {
    const { position, rotation, scale } = instance.transform;
    obj.position.set(position.x, position.y, position.z);
    obj.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    );
    obj.scale.set(scale.x, scale.y, scale.z);
  }

  // Aplica a cor de tinting e opacidade aos materiais do objeto
  private applyTexture(obj: THREE.Group, texture: TextureConfig): void {
    const color = new THREE.Color(texture.tintColor);
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshPhongMaterial;
        mat.color.set(color);
        mat.opacity     = texture.opacity;
        mat.transparent = texture.opacity < 1;
      }
    });
  }

  // Atualiza relações pai/filho na cena Three.js baseado no parentId do store
  private syncHierarchy(instances: ModelInstance[]): void {
    for (const instance of instances) {
      const obj = this.objectsByInstanceId.get(instance.id);
      if (!obj) continue;

      if (instance.parentId) {
        const parent = this.objectsByInstanceId.get(instance.parentId);
        // Move para o grupo do pai se ainda não estiver lá
        if (parent && obj.parent !== parent) {
          parent.add(obj);
        }
      } else {
        // Sem pai: garante que está diretamente na raiz da cena
        if (obj.parent !== this.scene) {
          this.scene.add(obj);
        }
      }
    }
  }

  /**
   * Atualiza qual instância está visualmente selecionada (emissão azul).
   */
  selectInstance(id: string | null): void {
    this.selectedId = id;
    this.updateSelectionHighlight(id);
  }

  // Aplica/remove emissão colorida para destacar o objeto selecionado
  private updateSelectionHighlight(selectedId: string | null): void {
    for (const [id, obj] of this.objectsByInstanceId) {
      const isSelected = id === selectedId;
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshPhongMaterial;
          // Destaque azul suave ao selecionar
          mat.emissive.set(isSelected ? 0x1d4ed8 : 0x000000);
          mat.emissiveIntensity = isSelected ? 0.3 : 0;
        }
      });
    }
  }

  /**
   * Libera todos os recursos WebGL (chamado quando o componente desmonta).
   */
  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
