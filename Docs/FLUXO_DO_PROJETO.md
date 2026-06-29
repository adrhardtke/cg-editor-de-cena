# Editor de Cena 3D — Documentação Completa do Fluxo

> Documentação técnica detalhada para embasamento teórico e apresentação ao professor.  
> Cobre arquitetura, WebGL, Three.js, gerenciamento de estado, hierarquia, animações, texturas e todo o pipeline de renderização.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica e Por Que Foi Escolhida](#2-stack-tecnológica-e-por-que-foi-escolhida)
3. [Arquitetura em Camadas](#3-arquitetura-em-camadas)
4. [O Que é WebGL e Como o Three.js Abstrai Isso](#4-o-que-é-webgl-e-como-o-threejs-abstrai-isso)
5. [Pipeline de Renderização — O Loop Principal](#5-pipeline-de-renderização--o-loop-principal)
6. [Como Modelos OBJ São Carregados](#6-como-modelos-obj-são-carregados)
7. [Instâncias vs. Modelos Base — O Conceito de Clone](#7-instâncias-vs-modelos-base--o-conceito-de-clone)
8. [Como Novos Elementos São Adicionados à Cena](#8-como-novos-elementos-são-adicionados-à-cena)
9. [O Sistema de Transformações (Posição, Rotação, Escala)](#9-o-sistema-de-transformações-posição-rotação-escala)
10. [O Sistema de Hierarquia](#10-o-sistema-de-hierarquia)
11. [Animações — Como Objetos Se Movem](#11-animações--como-objetos-se-movem)
12. [Texturas e Tinting de Cor](#12-texturas-e-tinting-de-cor)
13. [Seleção de Objetos — Ray Casting (Mouse Picking)](#13-seleção-de-objetos--ray-casting-mouse-picking)
14. [Gerenciamento de Estado com Zustand](#14-gerenciamento-de-estado-com-zustand)
15. [A Ponte entre React e Three.js — SceneCanvas](#15-a-ponte-entre-react-e-threejs--scenecanvas)
16. [Geração de Miniaturas dos Modelos](#16-geração-de-miniaturas-dos-modelos)
17. [Salvar e Carregar Cena (Persistência JSON)](#17-salvar-e-carregar-cena-persistência-json)
18. [Iluminação da Cena](#18-iluminação-da-cena)
19. [Controles de Câmera (OrbitControls)](#19-controles-de-câmera-orbitcontrols)
20. [Testes Automatizados](#20-testes-automatizados)
21. [Fluxo Completo de Uma Ação do Usuário — Exemplo Ponta a Ponta](#21-fluxo-completo-de-uma-ação-do-usuário--exemplo-ponta-a-ponta)

---

## 1. Visão Geral do Projeto

O **Editor de Cena 3D** é uma aplicação web que permite ao usuário montar cenas tridimensionais compostas por modelos 3D do formato OBJ (um pacote de 60 modelos urbanos, o "CityPack"). O usuário pode:

- **Adicionar** modelos à cena clicando no catálogo do painel direito
- **Selecionar** objetos clicando neles diretamente no canvas 3D
- **Mover, rotacionar e escalar** objetos com campos numéricos de precisão
- **Definir hierarquia** (pai/filho) entre objetos, fazendo grupos relacionados
- **Animar** objetos com movimento linear contínuo (direção e velocidade configuráveis)
- **Aplicar tinting de cor e opacidade** sobre as texturas originais
- **Salvar** a cena inteira em um arquivo JSON e **recarregar** depois
- **Visualizar miniaturas** 3D de cada modelo no catálogo antes de adicionar

Tudo isso acontece inteiramente no navegador, sem back-end: a renderização é feita via WebGL (através do Three.js), o estado é gerenciado com Zustand, e a interface é construída com React + TypeScript.

---

## 2. Stack Tecnológica e Por Que Foi Escolhida

| Tecnologia | Papel | Por quê |
|---|---|---|
| **Vite** | Bundler e servidor de desenvolvimento | Extremamente rápido (ESM nativo), configuração mínima |
| **React 19** | Camada de UI declarativa | Reatividade automática: quando o estado muda, a UI atualiza |
| **TypeScript** | Tipagem estática | Previne bugs em tempo de desenvolvimento, IDE inteligente |
| **Three.js** | Abstração sobre WebGL | Elimina centenas de linhas de código de baixo nível de WebGL puro |
| **Zustand** | Gerenciamento de estado global | Minimalista, sem boilerplate, subscriptions reativas |
| **Tailwind CSS** | Estilização | Classes utilitárias que coexistem bem com componentes React |
| **Vitest** | Testes unitários | API idêntica ao Jest, integração nativa com Vite |
| **OBJLoader / MTLLoader** | Carregamento de modelos 3D | Loaders padrão do Three.js para o formato OBJ/MTL |

---

## 3. Arquitetura em Camadas

O projeto segue uma **arquitetura em camadas** inspirada em Clean Architecture / Arquitetura Hexagonal. A regra fundamental é que **camadas internas não conhecem camadas externas**:

```
┌─────────────────────────────────────────────────────┐
│  pages/           → Layout de página completa       │
│  components/      → UI e lógica de renderização     │
├─────────────────────────────────────────────────────┤
│  store/           → Estado global reativo           │
├─────────────────────────────────────────────────────┤
│  infra/services/  → Acesso a recursos externos      │
│                     (WebGL, HTTP, sistema de arquivo)│
├─────────────────────────────────────────────────────┤
│  core/useCases/   → Regras de negócio puras         │
│  core/entities/   → Tipos e constantes              │
└─────────────────────────────────────────────────────┘
```

### Por que essa separação importa?

- **`core/`** não importa nada de React, Three.js ou Zustand. São funções puras que recebem dados e retornam dados. Isso é o que torna os testes unitários triviais: não precisam de browser, DOM, nem WebGL.
- **`store/`** orquestra as chamadas: pega o estado atual, chama a função do `core/`, e atualiza o estado.
- **`infra/`** lida com o "mundo externo": carregar arquivos OBJ via HTTP, criar contextos WebGL.
- **`components/`** apenas lê o estado e dispara ações. A lógica de negócio não fica aqui.

### Estrutura de diretórios

```
src/
├── core/
│   ├── entities/
│   │   └── types.ts          ← Todas as interfaces e constantes
│   └── useCases/
│       ├── addInstance.ts    ← Cria nova instância
│       ├── removeInstance.ts ← Remove instância e limpa filhos
│       ├── updateTransformation.ts ← Atualiza transform
│       ├── setHierarchy.ts   ← Define pai/filho com validação de ciclo
│       ├── saveScene.ts      ← Serializa cena para JSON
│       └── loadScene.ts      ← Valida e parseia JSON de cena
├── store/
│   ├── useSceneStore.ts      ← Estado da cena (instâncias, seleção)
│   └── useModelsStore.ts     ← Catálogo de modelos disponíveis
├── infra/
│   └── services/
│       ├── modelLoader.ts    ← Carrega OBJ + MTL com cache
│       └── thumbnailGenerator.ts ← Gera miniaturas 3D
├── components/
│   ├── SceneCanvas/          ← Canvas WebGL + SceneManager
│   ├── Toolbar/              ← Salvar/Carregar
│   ├── LeftPanel/            ← Lista de objetos + Editor de propriedades
│   ├── RightPanel/           ← Catálogo de modelos
│   └── ui/                   ← Componentes de UI reutilizáveis
├── pages/
│   └── EditorPage.tsx        ← Página principal (composição do layout)
└── tests/
    └── useCases/             ← Testes das funções puras
```

---

## 4. O Que é WebGL e Como o Three.js Abstrai Isso

### WebGL em sua essência

WebGL é uma API de baixo nível que dá ao JavaScript acesso direto à GPU do computador através do elemento `<canvas>` do HTML. Sem abstração, para desenhar um simples triângulo colorido você precisa:

1. Criar um **contexto WebGL** a partir do `<canvas>`
2. Escrever **vertex shaders** e **fragment shaders** em GLSL (linguagem própria da GPU)
3. Compilar esses shaders manualmente
4. Criar **buffers** na GPU e enviar os vértices
5. Configurar os **atributos** e **uniforms** dos shaders
6. Chamar `gl.drawArrays()` ou `gl.drawElements()`

Para um único modelo 3D com iluminação e textura, seriam centenas de linhas de código GLSL + JS.

### O que o Three.js faz por nós

O Three.js encapsula toda essa complexidade em uma API orientada a objetos de alto nível:

```
WebGL (baixo nível)          Three.js (alto nível)
─────────────────────        ──────────────────────
gl.createBuffer()      →     new THREE.BufferGeometry()
gl.shaderSource()      →     new THREE.MeshPhongMaterial()
gl.drawElements()      →     renderer.render(scene, camera)
matriz de projeção     →     new THREE.PerspectiveCamera(45, ...)
buffer de vértices     →     new THREE.BoxGeometry(1, 1, 1)
```

Os três conceitos fundamentais do Three.js que o projeto usa:

**`THREE.Scene`** — O "mundo" ou "grafo de cena". É uma árvore de objetos. Você adiciona objetos nela com `scene.add(objeto)`. A câmera renderiza tudo que estiver nessa árvore.

**`THREE.Camera`** — Define o ponto de vista. O projeto usa `PerspectiveCamera`, que simula como o olho humano vê (objetos mais distantes ficam menores). Os 4 parâmetros são: campo de visão (FOV em graus), proporção largura/altura (aspect ratio), plano de recorte próximo (near) e distante (far):
```typescript
new THREE.PerspectiveCamera(
  45,    // FOV: ângulo vertical de visão em graus
  w / h, // aspect ratio do canvas
  0.1,   // near: objetos mais perto que 0.1 unidades são cortados
  500    // far: objetos mais longe que 500 unidades são cortados
);
```

**`THREE.WebGLRenderer`** — Pega a cena e a câmera e faz o WebGL desenhar tudo no `<canvas>`. É chamado a cada frame no loop de animação.

---

## 5. Pipeline de Renderização — O Loop Principal

### O que é um render loop?

A ilusão de movimento 3D interativo depende de re-renderizar a cena dezenas de vezes por segundo. O navegador oferece `requestAnimationFrame` (rAF) para isso: ele chama sua função de callback imediatamente antes de o navegador redesenhar a tela, sincronizado com a taxa de atualização do monitor (tipicamente 60Hz ou 120Hz).

### Implementação no SceneManager

```typescript
// Trecho de SceneCanvas/sceneManager.ts
private startLoop(): void {
  const loop = (timestamp: number) => {
    // Agenda a próxima chamada ANTES de fazer o trabalho,
    // garantindo que o loop não pare mesmo se algo demorar
    this.rafId = requestAnimationFrame(loop);

    // Calcula quanto tempo passou desde o último frame (em segundos)
    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // 1. Avança as animações com base no tempo real decorrido
    this.updateAnimations(delta);

    // 2. Atualiza os controles de câmera (aplica o efeito de amortecimento/damping)
    this.controls.update();

    // 3. Renderiza a cena atual com a câmera atual
    this.renderer.render(this.scene, this.camera);
  };

  this.rafId = requestAnimationFrame(loop);
}
```

**Por que `delta` e não um valor fixo?** — Se usarmos um valor fixo (ex: `speed * 0.016`), a animação será mais rápida em monitores 120Hz e mais lenta em monitores 30Hz. Com `delta` (tempo real em segundos desde o último frame), `speed` é sempre em "unidades por segundo", independente da taxa de atualização da tela. Isso é a técnica padrão de **frame-rate independent animation**.

### O ciclo completo a cada frame

```
requestAnimationFrame(loop)
         │
         ▼
   updateAnimations(delta)
   ├── Para cada instância com animation.active = true:
   │       obj.position.x += direction.x * speed * delta
   │       obj.position.y += direction.y * speed * delta
   │       obj.position.z += direction.z * speed * delta
         │
         ▼
   controls.update()
   └── Aplica amortecimento do OrbitControls
         │
         ▼
   renderer.render(scene, camera)
   ├── Traverse toda a árvore da cena
   ├── Para cada Mesh visível:
   │       ├── Aplica transform (model matrix)
   │       ├── Aplica view matrix (câmera)
   │       ├── Aplica projection matrix (perspectiva)
   │       └── Executa shaders na GPU
   └── Exibe no canvas
```

---

## 6. Como Modelos OBJ São Carregados

### O formato OBJ

OBJ é um formato de arquivo 3D em texto puro criado pela Wavefront Technologies (anos 80). Um arquivo OBJ descreve:
- **Vértices** (`v x y z`): posições de pontos no espaço 3D
- **Normais** (`vn nx ny nz`): vetores perpendiculares à superfície (usados para iluminação)
- **Coordenadas de textura** (`vt u v`): mapeamento de pontos da superfície à textura
- **Faces** (`f v/vt/vn ...`): polígonos formados por referências aos vértices

O arquivo `.mtl` (Material Template Library) que acompanha cada OBJ descreve os materiais:
- Cor difusa, especular, ambiente
- Mapa de textura (`map_Kd textura.png`)
- Índice de refração e opacidade

### O serviço `modelLoader.ts`

```typescript
// src/infra/services/modelLoader.ts
const modelCache = new Map<string, THREE.Group>();
const BASE_PATH = '/models/';

export async function loadModel(baseFile: string): Promise<THREE.Group> {
  // 1. Retorna do cache se já foi carregado antes (evita requests HTTP repetidos)
  if (modelCache.has(baseFile)) {
    return modelCache.get(baseFile)!;
  }

  // 2. Carrega o material (.mtl) ANTES do objeto (.obj)
  //    O MTL precisa ser pré-carregado para que o OBJLoader consiga aplicar
  //    os materiais automaticamente ao parsear o .obj
  const mtlLoader = new MTLLoader();
  mtlLoader.setPath(BASE_PATH);
  const materials = await mtlLoader.loadAsync(`${baseFile}.mtl`);
  materials.preload();  // Pré-carrega texturas referenciadas no MTL

  // 3. Carrega o objeto (.obj) injetando os materiais
  const objLoader = new OBJLoader();
  objLoader.setPath(BASE_PATH);
  objLoader.setMaterials(materials);
  const group = await objLoader.loadAsync(`${baseFile}.obj`);

  // 4. Centraliza o modelo na origem
  //    Modelos OBJ frequentemente têm origem no canto, não no centro.
  //    Box3 calcula o bounding box (caixa delimitadora) do modelo.
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);  // Calcula o centro geométrico
  group.position.sub(center);  // Subtrai o centro da posição do grupo
  //    Agora o modelo está centrado em (0, 0, 0)

  // 5. Armazena no cache para reuso
  modelCache.set(baseFile, group);
  return group;
}
```

**Por que centralizar na origem?** — Quando posicionamos o objeto via `transform.position`, queremos que o ponto de referência seja o centro do modelo, não um canto. Sem a centralização, um objeto em `position = (0, 0, 0)` apareceria deslocado.

**Por que `.mtl` antes do `.obj`?** — O formato OBJ referencia materiais por nome (`usemtl NomeMaterial`). O OBJLoader precisa ter o dicionário de materiais em mãos antes de processar o OBJ para conseguir aplicar o material correto a cada grupo de faces.

**Por que cache?** — Cada modelo pode ser adicionado à cena múltiplas vezes (várias instâncias do mesmo edifício, por exemplo). Sem cache, cada adição faria um novo request HTTP e carregaria o modelo do zero, consumindo memória e tempo desnecessariamente. Com o cache, a geometria é carregada uma única vez e reutilizada.

---

## 7. Instâncias vs. Modelos Base — O Conceito de Clone

Este é um conceito central do projeto e de computação gráfica em geral.

### O problema

O usuário quer colocar 10 cópias do `building_A` na cena. Se carregássemos 10 versões completas do modelo (geometria + materiais), teríamos 10× o uso de memória de GPU. Isso escala muito mal.

### A solução: compartilhamento de geometria

A geometria (os vértices, normais, faces — a "forma" do objeto) é **imutável** e pode ser compartilhada. O que muda entre instâncias são:
- A **transformação** (onde está, como está rotacionado, qual tamanho)
- O **material** (cor, opacidade, textura)

```typescript
// src/infra/services/modelLoader.ts
export function createModelInstance(baseModel: THREE.Group): THREE.Group {
  // .clone() cria uma cópia superficial do grupo:
  // - O grupo e seus filhos (Mesh) são novos objetos JS
  // - MAS os BufferGeometry (dados de vértices na GPU) são COMPARTILHADOS
  //   (a propriedade geometry ainda aponta para o mesmo objeto)
  const instance = baseModel.clone();

  // Clona os materiais de forma PROFUNDA (deep clone)
  // Sem isso, todas as instâncias compartilhariam o mesmo material,
  // e mudar a cor de uma mudaria a cor de todas
  instance.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = child.material as THREE.Material;
      child.material = mat.clone();  // Novo material por instância
    }
  });

  return instance;
}
```

### O que acontece na memória da GPU

```
Memória GPU:
┌─────────────────────────────────────────────────┐
│  BufferGeometry("building_A")                   │
│  ├── positionBuffer: [x,y,z, x,y,z, ...]       │  ← UMA cópia na GPU
│  ├── normalBuffer: [nx,ny,nz, ...]              │
│  └── uvBuffer: [u,v, u,v, ...]                  │
└─────────────────────────────────────────────────┘
         ▲               ▲               ▲
         │               │               │
   Instância 1     Instância 2     Instância 3
   (Material A)    (Material B)    (Material C)
   (posição 0,0,0) (posição 5,0,0) (posição 10,0,0)
```

Cada instância tem seu próprio material e transform, mas aponta para a **mesma geometria na GPU**. Isso é a base do conceito de **instanced rendering**, uma das otimizações mais importantes em CG.

---

## 8. Como Novos Elementos São Adicionados à Cena

O processo de adicionar um modelo à cena envolve múltiplas camadas trabalhando em conjunto. Veja o fluxo completo:

### 1. Usuário clica no ModelCard (UI)

O componente `RightPanel/ModelCard.tsx` chama a ação do store ao ser clicado:

```typescript
// src/components/RightPanel/ModelCard.tsx
<button onClick={() => onAdd(model)}>

// src/components/RightPanel/index.tsx
const onAdd = (model: ModelDefinition) => {
  addModel(model);  // Ação do useSceneStore
};
```

### 2. Store cria a instância (lógica de negócio)

```typescript
// src/store/useSceneStore.ts
addModel: (model) => {
  const newInstance = addInstance(model);  // Chama o use case puro
  set((state) => ({
    instances:  [...state.instances, newInstance],  // Imutabilidade
    selectedId: newInstance.id,  // Auto-seleciona o novo objeto
  }));
},
```

### 3. Use case cria o objeto de dados

```typescript
// src/core/useCases/addInstance.ts
export function addInstance(model: ModelDefinition): ModelInstance {
  return {
    id: uuidv4(),           // UUID v4 garante unicidade global
    modelId: model.id,      // Referência ao modelo base
    name: model.name,       // Nome inicial (editável)
    parentId: null,         // Começa na raiz (sem pai)
    transform: {
      position: { x: 0, y: 0, z: 0 },   // Origem da cena
      rotation: { x: 0, y: 0, z: 0 },   // Sem rotação
      scale:    { x: 1, y: 1, z: 1 },   // Tamanho natural
    },
    animation: { active: false, direction: { x: 1, y: 0, z: 0 }, speed: 1 },
    texture:   { tintColor: '#ffffff', opacity: 1 },
  };
}
```

**UUID v4** — Um identificador universalmente único de 128 bits gerado aleatoriamente. Formato: `550e8400-e29b-41d4-a716-446655440000`. A probabilidade de colisão é astronomicamente baixa, o que permite criar IDs sem servidor.

### 4. React detecta a mudança e reage

O Zustand notifica os componentes que assinam `instances`. O `SceneCanvas` está assinado:

```typescript
// src/components/SceneCanvas/index.tsx
const instances = useSceneStore((s) => s.instances);

useEffect(() => {
  managerRef.current?.syncInstances(instances);
}, [instances]);  // Re-executa sempre que `instances` muda
```

### 5. SceneManager sincroniza o Three.js

```typescript
// src/components/SceneCanvas/sceneManager.ts
async syncInstances(instances: ModelInstance[]): Promise<void> {
  const currentIds = new Set(instances.map((i) => i.id));

  // Remove objetos Three.js de instâncias excluídas do store
  for (const [id, obj] of this.objectsByInstanceId) {
    if (!currentIds.has(id)) {
      this.scene.remove(obj);
      this.objectsByInstanceId.delete(id);
    }
  }

  // Adiciona novos ou atualiza existentes
  for (const instance of instances) {
    if (!this.objectsByInstanceId.has(instance.id)) {
      await this.addObjectToScene(instance);  // NOVO
    } else {
      this.updateObjectInScene(instance);     // EXISTENTE
    }
  }

  // Sincroniza hierarquia pai/filho
  this.syncHierarchy(instances);

  // Atualiza lista de animados
  this.animatedInstances = instances.filter((i) => i.animation.active);
}
```

### 6. Adição do objeto físico na cena Three.js

```typescript
private async addObjectToScene(instance: ModelInstance): Promise<void> {
  // Carrega do cache (ou faz download se primeira vez)
  const baseModel = await loadModel(instance.modelId);

  // Cria instância independente com material próprio
  const group = createModelInstance(baseModel);

  // Marca o grupo com o ID da instância para o picking por clique
  // userData é um objeto genérico que o Three.js preserva mas ignora
  group.userData['instanceId'] = instance.id;
  group.traverse((child) => {
    child.userData['instanceId'] = instance.id;
  });

  // Aplica posição, rotação e escala
  this.applyTransform(group, instance);

  // Aplica cor e opacidade
  this.applyTexture(group, instance.texture);

  // Adiciona à cena Three.js (agora aparece no canvas)
  this.scene.add(group);

  // Registra no mapa interno para sincronizações futuras
  this.objectsByInstanceId.set(instance.id, group);
}
```

### Diagrama do fluxo completo

```
[Usuário clica no card]
        │
        ▼
[RightPanel.onAdd(model)]
        │
        ▼
[useSceneStore.addModel(model)]
        │
        ├─→ [addInstance(model)] ← função pura do core/
        │         └─→ Cria ModelInstance com UUID
        │
        └─→ [set({ instances: [...state.instances, nova] })]
                  │
                  ▼ (Zustand notifica assinantes)
        [SceneCanvas detecta mudança em `instances`]
                  │
                  ▼
        [useEffect → manager.syncInstances(instances)]
                  │
                  ▼
        [SceneManager.addObjectToScene(instance)]
                  │
                  ├─→ [loadModel(modelId)] ← cache ou HTTP
                  ├─→ [createModelInstance(baseModel)] ← clone com material próprio
                  ├─→ [applyTransform(group, instance)]
                  ├─→ [applyTexture(group, instance.texture)]
                  └─→ [scene.add(group)] ← aparece no canvas!
```

---

## 9. O Sistema de Transformações (Posição, Rotação, Escala)

### Conceitos de Álgebra Linear por trás

Em computação gráfica, todo objeto tem uma **matriz de transformação** (model matrix) 4×4 que descreve onde ele está no espaço, como está orientado e qual seu tamanho. O Three.js gerencia essa matriz automaticamente.

As três transformações fundamentais são:

**Translação (posição)**:
```
Mover o objeto ao longo dos eixos X, Y, Z.
Eixo X: esquerda/direita
Eixo Y: baixo/cima (Y positivo = sobe)
Eixo Z: frente/trás (Z positivo = sai da tela em direção ao usuário)
```

**Rotação (ângulos de Euler)**:
```
Girar o objeto em torno de um eixo.
O projeto usa ângulos de Euler na ordem XYZ, em graus.
Rotation X = inclinar para frente/trás (pitch)
Rotation Y = girar no eixo vertical (yaw)
Rotation Z = inclinar para os lados (roll)
```

**Escala**:
```
Esticar ou comprimir o objeto.
scale = (1, 1, 1) = tamanho original
scale = (2, 1, 1) = o dobro do tamanho só no eixo X
scale = (0.5, 0.5, 0.5) = metade do tamanho em todos os eixos
```

### Ângulos de Euler vs. Quaternions

O Three.js usa internamente **quaternions** para evitar o problema de **gimbal lock** (perda de um grau de liberdade quando dois eixos se alinham). Porém, quaternions são matematicamente difíceis de entender e de editar manualmente.

O projeto expõe ao usuário **ângulos de Euler em graus** (muito mais intuitivos) e os converte para radianos antes de passar ao Three.js:

```typescript
// src/components/SceneCanvas/sceneManager.ts
private applyTransform(obj: THREE.Group, instance: ModelInstance): void {
  const { position, rotation, scale } = instance.transform;

  obj.position.set(position.x, position.y, position.z);

  // Three.js usa radianos internamente; convertemos de graus
  obj.rotation.set(
    THREE.MathUtils.degToRad(rotation.x),  // graus → radianos
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z)
  );

  obj.scale.set(scale.x, scale.y, scale.z);
}
```

**1 radiano = 180/π ≈ 57.3°** — O Three.js usa radianos porque as funções trigonométricas (sin, cos) da matemática trabalham com radianos. Apresentar graus ao usuário e converter internamente é uma boa prática de UX.

### O use case de atualização (imutabilidade)

```typescript
// src/core/useCases/updateTransformation.ts
export function updateTransformation(
  instances: ModelInstance[],
  id: string,
  transform: Partial<Transform>  // Partial: só os campos que mudaram
): ModelInstance[] {
  return instances.map((inst) =>
    inst.id === id
      ? { ...inst, transform: { ...inst.transform, ...transform } }
      : inst
  );
}
```

**Por que imutabilidade?** — O Zustand (e o React em geral) detecta mudanças por **referência de objeto** (`===`). Se modificássemos o objeto existente, a referência seria a mesma e o React não saberia que algo mudou. Ao criar um novo objeto com spread (`{ ...inst, ... }`), a referência muda e a reatividade é disparada.

### Atualização parcial de um eixo

Quando o usuário muda só o X da posição, o store faz um merge:

```typescript
// src/store/useSceneStore.ts
updatePosition: (id, position) => {
  set((state) => ({
    instances: updateTransformation(state.instances, id, {
      position: {
        // Mantém Y e Z do valor atual, só atualiza o que foi passado
        ...state.instances.find((i) => i.id === id)!.transform.position,
        ...position,  // ex: { x: 5 } sobreescreve só o x
      },
    }),
  }));
},
```

### O componente NumericInput

Para que o usuário consiga digitar `"-3"` ou apagar o `"0"` e digitar outro número, o componente `NumericInput` mantém um **estado local de string** (o que está visível no campo) separado do **valor numérico no store**:

```typescript
function NumericInput({ value, onChange, step = 0.1 }) {
  // Estado local: o que o usuário está vendo/digitando
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza com o store quando vem de fora (ex: mudança de seleção)
  // mas NÃO interrompe a digitação em andamento
  useEffect(() => {
    if (!focused) setText(String(value));
  }, [value, focused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);  // Atualiza o que está visível imediatamente

    // Só atualiza o store se for um número válido
    // parseFloat("") = NaN, parseFloat("-") = NaN → não dispara
    // parseFloat("3.5") = 3.5 → dispara update em tempo real
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(parsed);
  };

  const handleBlur = () => {
    setFocused(false);
    // Se o campo ficou inválido ao sair, restaura o valor do store
    if (isNaN(parseFloat(text))) setText(String(value));
  };
}
```

Esse padrão resolve a tensão entre dois requisitos conflitantes: "atualizar em tempo real" e "permitir apagar o campo para digitar um novo valor".

---

## 10. O Sistema de Hierarquia

### O conceito de grafo de cena (Scene Graph)

Em computação gráfica, a hierarquia de objetos é modelada como uma **árvore** chamada **Scene Graph**. Cada nó da árvore pode ter filhos, e as transformações de um pai são **herdadas** pelos filhos.

**Exemplo prático:**
```
Prédio (posição: 5, 0, 0, rotação Y: 45°)
└── Antena (posição: 0, 3, 0)  ← relativa ao pai
    └── Luz (posição: 0, 0.5, 0)  ← relativa à antena
```

Quando o Prédio é movido ou rotacionado, a Antena e a Luz se movem junto automaticamente — porque suas posições são **relativas ao seu pai**. Isso é o que chamamos de **transformação em espaço local** vs. **transformação em espaço global**.

### Representação no nosso modelo de dados

Optamos por uma **lista plana com referências** em vez de uma árvore real. Cada `ModelInstance` tem um campo `parentId`:

```typescript
// Lista plana (como ficam no store e no JSON)
[
  { id: "uuid-A", name: "Prédio",  parentId: null,    position: {5, 0, 0} },
  { id: "uuid-B", name: "Antena",  parentId: "uuid-A", position: {0, 3, 0} },
  { id: "uuid-C", name: "Luz",     parentId: "uuid-B", position: {0, 0.5, 0} }
]
```

**Vantagens da lista plana:**
- Fácil de serializar/deserializar em JSON
- Buscas por ID são O(n) simples
- Não há aninhamento no JSON salvo

**Como isso vira uma árvore no Three.js?** A função `syncHierarchy` reconstrói a relação pai/filho na cena 3D:

```typescript
// src/components/SceneCanvas/sceneManager.ts
private syncHierarchy(instances: ModelInstance[]): void {
  for (const instance of instances) {
    const obj = this.objectsByInstanceId.get(instance.id);
    if (!obj) continue;

    if (instance.parentId) {
      const parent = this.objectsByInstanceId.get(instance.parentId);
      if (parent && obj.parent !== parent) {
        // parent.add(obj) move o objeto para dentro do grupo do pai
        // Internamente o Three.js ajusta a posição para manter
        // a posição global, convertendo para espaço local do pai
        parent.add(obj);
      }
    } else {
      // Sem pai: deve estar na raiz da cena
      if (obj.parent !== this.scene) {
        this.scene.add(obj);
      }
    }
  }
}
```

### Validação de ciclos

Uma hierarquia em árvore não pode ter **ciclos** (A é pai de B que é pai de A — isso seria uma árvore infinita). A função `wouldCreateCycle` usa busca em profundidade (DFS) para verificar:

```typescript
// src/core/useCases/setHierarchy.ts
function wouldCreateCycle(
  instances: ModelInstance[],
  childId: string,   // ID do nó que está tentando receber um pai
  parentId: string   // ID do candidato a pai
): boolean {
  // Começa pelo candidato a pai e sobe pela hierarquia
  // Se em algum momento encontrar o childId, há ciclo
  let current: string | null = parentId;
  while (current !== null) {
    if (current === childId) return true;  // CICLO!
    const inst = instances.find((i) => i.id === current);
    current = inst?.parentId ?? null;  // Sobe um nível
  }
  return false;
}

export function setHierarchy(instances, childId, parentId) {
  if (parentId && wouldCreateCycle(instances, childId, parentId)) {
    throw new Error('Hierarquia inválida: criaria um ciclo entre as instâncias.');
  }
  return instances.map((inst) =>
    inst.id === childId ? { ...inst, parentId } : inst
  );
}
```

**Exemplo do ciclo sendo detectado:**
```
Estado atual: B é filho de A
Usuário tenta: tornar A filho de B

wouldCreateCycle(instances, childId="A", parentId="B")
  current = "B"
  "B" === "A"? NÃO → sobe
  current = parentId de B = "A"
  "A" === "A"? SIM → CICLO DETECTADO!
```

### O efeito visual da hierarquia

Quando `syncHierarchy` chama `parent.add(child)` no Three.js, o filho passa a ter sua posição interpretada em **coordenadas locais do pai**. Ou seja, `child.position = (0, 3, 0)` significa "3 unidades acima do meu pai", não "3 unidades acima da origem do mundo".

Se o pai tiver rotação Y de 45°, o filho herda essa rotação. Isso é implementado internamente pelo Three.js através da multiplicação de matrizes:

```
Posição global do filho = Matriz do Pai × Posição local do filho
```

---

## 11. Animações — Como Objetos Se Movem

### Modelo de dados da animação

```typescript
interface AnimationConfig {
  active: boolean;      // Liga/desliga a animação
  direction: Vec3;      // Vetor normalizado de direção (ex: {x:1, y:0, z:0} = eixo X)
  speed: number;        // Velocidade em unidades por segundo
}
```

### A lógica de animação no render loop

A animação é puramente **posicional linear**: a cada frame, o objeto se move na direção configurada com velocidade proporcional ao tempo decorrido:

```typescript
// src/components/SceneCanvas/sceneManager.ts
private updateAnimations(delta: number): void {
  for (const instance of this.animatedInstances) {
    const obj = this.objectsByInstanceId.get(instance.id);
    if (!obj) continue;

    const { direction, speed } = instance.animation;

    // Deslocamento = direção × velocidade × tempo_decorrido
    // Ex: direction=(1,0,0), speed=2, delta=0.016s
    // → move 0.032 unidades no eixo X neste frame
    obj.position.x += direction.x * speed * delta;
    obj.position.y += direction.y * speed * delta;
    obj.position.z += direction.z * speed * delta;
  }
}
```

**Importante**: a animação modifica `obj.position` diretamente no Three.js, **sem passar pelo Zustand**. Isso é intencional: se cada frame de animação disparasse uma atualização de estado no Zustand, isso causaria re-renders do React a 60 por segundo para cada objeto animado, o que é extremamente ineficiente.

A posição animada existe **apenas na memória do Three.js**. O store guarda a posição "de edição" (de onde o objeto partiu), e o Three.js cuida do movimento em tempo real.

### Cache de instâncias animadas

Para evitar iterar sobre TODAS as instâncias a cada frame, o SceneManager mantém uma lista só das animadas:

```typescript
// Atualizada sempre que syncInstances é chamado
this.animatedInstances = instances.filter((i) => i.animation.active);
```

Se há 50 objetos na cena mas só 3 estão animados, o loop de animação itera apenas sobre 3.

### Vetor de direção

O usuário pode configurar qualquer vetor de direção. Alguns exemplos:
- `(1, 0, 0)` — move no eixo X (da esquerda para a direita)
- `(0, 1, 0)` — move no eixo Y (sobe)
- `(0, 0, 1)` — move no eixo Z (para frente)
- `(1, 0, 1)` — move na diagonal XZ (sem normalização)
- `(-1, 0, 0)` — move no sentido negativo de X (direita para esquerda)

**Nota sobre normalização**: não normalizamos o vetor automaticamente. Um vetor `(1, 1, 0)` tem magnitude `√2 ≈ 1.41`, então o objeto se moveria 41% mais rápido do que `(1, 0, 0)` com a mesma `speed`. Isso é uma escolha de design — dá ao usuário mais controle sobre a intensidade em cada eixo.

---

## 12. Texturas e Tinting de Cor

### O que é uma textura em WebGL

Uma textura é uma imagem (geralmente PNG ou JPEG) que é "enrolada" em torno de uma geometria 3D. O processo usa **coordenadas UV** (ou "coordenadas de textura"):

- Cada vértice do modelo 3D tem uma coordenada UV `(u, v)`, onde `u` e `v` vão de 0.0 a 1.0
- `(0, 0)` = canto inferior esquerdo da textura
- `(1, 1)` = canto superior direito da textura
- O arquivo OBJ armazena essas coordenadas (`vt u v`), definidas por artista

### Texture Atlas

Os 60 modelos do CityPack compartilham uma **única imagem de textura** (`citybits_texture.png`), o que é chamado de **texture atlas**. Em vez de uma textura por modelo, todos os modelos têm coordenadas UV mapeadas para regiões diferentes da mesma imagem.

**Vantagem**: a GPU só precisa carregar 1 textura (uma chamada de bind) para renderizar todos os 60 modelos. Isso reduz dramaticamente o número de **draw calls** (chamadas de renderização à GPU), que são uma das principais fontes de overhead em gráficos em tempo real.

### O sistema de Tinting

O projeto não permite troca de textura (todos usam o atlas), mas permite **modular a cor** da textura usando o campo `tintColor`. Em computação gráfica, isso se chama **color modulation** ou **vertex coloring**:

```
Cor final do pixel = Cor da textura × Cor do tinting
```

Se `tintColor = '#ffffff'` (branco = `RGB(1, 1, 1)`):
```
Cor final = textura × (1, 1, 1) = textura  → cor original preservada
```

Se `tintColor = '#ff0000'` (vermelho = `RGB(1, 0, 0)`):
```
Cor final = (R_tex, G_tex, B_tex) × (1, 0, 0) = (R_tex, 0, 0)
→ elimina os canais verde e azul → tudo fica vermelho
```

### Implementação

```typescript
// src/components/SceneCanvas/sceneManager.ts
private applyTexture(obj: THREE.Group, texture: TextureConfig): void {
  const color = new THREE.Color(texture.tintColor);  // Parse do hex string

  // traverse() itera por todos os descendentes do grupo
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshPhongMaterial;

      // Define a cor de modulação (multiplica com a textura no shader)
      mat.color.set(color);

      // Configura a opacidade
      mat.opacity = texture.opacity;

      // transparent=true é necessário para o blending alpha funcionar.
      // Se opacity=1, desligamos para performance (blending é mais caro)
      mat.transparent = texture.opacity < 1;
    }
  });
}
```

**Por que precisamos de `transparent = true` para opacidade funcionar?** — Por padrão, o Three.js (e o WebGL) renderiza objetos como 100% opacos para maximizar performance (sem blending). Para ativar a transparência, é preciso explicitamente dizer ao renderer que aquele material usa alpha blending.

**MeshPhongMaterial** — O material Phong implementa o modelo de iluminação de Phong, um dos mais clássicos em computação gráfica:
```
Cor final = Ambiente + Difusa + Especular
          = (luz ambiente × cor) + (luz direcional × normal × cos(θ)) + (especular)
```
- **Ambiente**: iluminação de base, sem sombra
- **Difusa**: depende do ângulo entre a normal da superfície e a direção da luz (lei de Lambert)
- **Especular**: reflexo brilhante, depende do ângulo de visualização

### Destaque de seleção (emissive)

Quando o usuário seleciona um objeto, um brilho azul é aplicado via **emissive color** — cor que o material "emite" independentemente da iluminação:

```typescript
private updateSelectionHighlight(selectedId: string | null): void {
  for (const [id, obj] of this.objectsByInstanceId) {
    const isSelected = id === selectedId;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshPhongMaterial;

        // emissive: cor que o material emite independente da luz
        // 0x1d4ed8 = azul-indigo (#1D4ED8 em Tailwind)
        mat.emissive.set(isSelected ? 0x1d4ed8 : 0x000000);

        // emissiveIntensity: intensidade da emissão (0 = nenhuma)
        mat.emissiveIntensity = isSelected ? 0.3 : 0;
      }
    });
  }
}
```

---

## 13. Seleção de Objetos — Ray Casting (Mouse Picking)

### O problema

O canvas é uma imagem 2D (pixels na tela). Quando o usuário clica, temos coordenadas em pixels — mas precisamos saber qual objeto 3D no espaço foi clicado. Esse processo se chama **picking** ou **object selection**.

### A técnica: Ray Casting

A solução matematicamente correta é o **ray casting** (lançamento de raio):

1. A partir da posição do clique na tela (2D), determinamos um **raio** que parte da câmera e atravessa aquele ponto na tela em direção ao mundo 3D
2. Testamos se esse raio intersecta com algum dos objetos na cena
3. O objeto mais próximo da câmera (menor distância ao longo do raio) é o selecionado

```
Câmera
  *
  |\
  | \  ← raio
  |  \
  |   \
  |    *──────── Objeto A (mais próximo → selecionado)
  |     \
  |      \
  |       *──── Objeto B (mais distante → ignorado)
```

### Conversão de coordenadas de tela para NDC

O Three.js trabalha em **NDC** (Normalized Device Coordinates — Coordenadas de Dispositivo Normalizadas), onde `(-1, -1)` é o canto inferior esquerdo e `(1, 1)` é o canto superior direito do canvas:

```typescript
// src/components/SceneCanvas/sceneManager.ts
private onClick = (event: MouseEvent): void => {
  const rect = this.canvas.getBoundingClientRect();

  // Converte pixels (0 a largura, 0 a altura) para NDC (-1 a +1)
  // Nota: o eixo Y é invertido (pixels aumentam para baixo, NDC aumenta para cima)
  this.pointer.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
  this.pointer.y = ((event.clientY - rect.top)  / rect.height) * -2 + 1;

  // Configura o raio com base na posição do ponteiro e na câmera
  this.raycaster.setFromCamera(this.pointer, this.camera);

  // Testa intersecção com todos os grupos de instâncias
  // O segundo argumento `true` = verifica também os filhos (meshes dentro do grupo)
  const objects = Array.from(this.objectsByInstanceId.values());
  const intersections = this.raycaster.intersectObjects(objects, true);

  if (intersections.length > 0) {
    // intersections[0] = o mais próximo da câmera
    const instanceId = this.findInstanceId(intersections[0].object);
    this.onSelection(instanceId);
  } else {
    this.onSelection(null);  // Clicou no fundo → deseleciona
  }
};
```

### Subindo na hierarquia para encontrar o ID

Um modelo OBJ é carregado como um `Group` (grupo) com vários `Mesh` dentro. Quando o raio intersecta com um vértice de um Mesh interno, o `intersections[0].object` aponta para esse Mesh filho — não para o grupo raiz que tem o `userData.instanceId`.

A função `findInstanceId` sobe a hierarquia Three.js até encontrar o marcador:

```typescript
private findInstanceId(object: THREE.Object3D): string | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    // userData é onde armazenamos o ID da instância durante addObjectToScene()
    if (current.userData['instanceId']) {
      return current.userData['instanceId'] as string;
    }
    current = current.parent;  // Sobe um nível na hierarquia Three.js
  }
  return null;
}
```

**userData** — Todo `Object3D` do Three.js tem um objeto `userData` que o programador pode usar livremente para armazenar metadados. O Three.js ignora esse campo durante a renderização.

---

## 14. Gerenciamento de Estado com Zustand

### Por que um estado global?

O editor tem múltiplos painéis (esquerdo, central, direito) que precisam de acesso à mesma informação. Sem estado global, precisaríamos passar dados como props através de muitos níveis de componentes — o chamado **prop drilling**.

### Arquitetura do Zustand

Zustand cria uma "store" — um objeto reativo global que qualquer componente pode ler e modificar:

```typescript
// src/store/useSceneStore.ts
export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector((set, get) => ({
    // Estado
    instances:  [],
    selectedId: null,

    // Ações
    addModel: (model) => {
      const newInstance = addInstance(model);
      set((state) => ({
        instances:  [...state.instances, newInstance],
        selectedId: newInstance.id,
      }));
    },
    // ...outras ações
  }))
);
```

**`subscribeWithSelector`** — Middleware do Zustand que permite que componentes se inscrevam para receber atualizações apenas quando um campo específico do estado muda (ao invés de qualquer mudança no store). Isso previne re-renders desnecessários.

### Como componentes consomem o store

```typescript
// Leitura com selector — re-render apenas quando `instances` mudar
const instances = useSceneStore((s) => s.instances);

// Leitura de ação — nunca causa re-render (ações não mudam)
const addModel = useSceneStore((s) => s.addModel);
```

### Imutabilidade no Zustand

Todo `set` cria um **novo estado** (novo objeto). O Zustand compara a referência do estado anterior com a nova para saber se deve notificar os assinantes. Por isso todas as ações usam spread operator:

```typescript
// ERRADO: muta o objeto existente → Zustand não detecta
state.instances.push(newInstance);

// CERTO: cria novo array → nova referência → Zustand detecta e notifica
set((state) => ({ instances: [...state.instances, newInstance] }));
```

### Os dois stores do projeto

**`useSceneStore`** — Estado da cena em edição:
- `instances: ModelInstance[]` — todos os objetos na cena
- `selectedId: string | null` — ID do objeto selecionado
- Ações: `addModel`, `removeModel`, `updatePosition`, `setParent`, `updateAnimation`, `updateTexture`, `saveScene`, etc.

**`useModelsStore`** — Catálogo de modelos disponíveis:
- `models: ModelDefinition[]` — lista carregada do `models.json`
- `loading: boolean` — estado de carregamento
- `error: string | null` — mensagem de erro
- Ação: `loadModels()` — faz fetch do JSON e popula `models`

---

## 15. A Ponte entre React e Three.js — SceneCanvas

Este é um dos aspectos mais sutis do projeto. React e Three.js têm modelos de "verdade" diferentes:
- **React** acredita no estado do Zustand (a "verdade declarativa")
- **Three.js** acredita na cena 3D (a "verdade imperativa")

O componente `SceneCanvas` sincroniza esses dois mundos:

```typescript
// src/components/SceneCanvas/index.tsx
export function SceneCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<SceneManager | null>(null);

  const instances      = useSceneStore((s) => s.instances);
  const selectInstance = useSceneStore((s) => s.selectInstance);
  const selectedId     = useSceneStore((s) => s.selectedId);

  // Efeito 1: cria o SceneManager uma única vez quando o canvas existe
  useEffect(() => {
    if (!canvasRef.current) return;
    const manager = new SceneManager(
      canvasRef.current,
      (id) => selectInstance(id)  // Callback: clique no 3D → atualiza o store
    );
    managerRef.current = manager;
    return () => {
      manager.dispose();  // Limpa recursos WebGL ao desmontar
      managerRef.current = null;
    };
  }, []); // Roda só uma vez (array de deps vazio)

  // Efeito 2: sincroniza Three.js quando o estado das instâncias muda
  useEffect(() => {
    managerRef.current?.syncInstances(instances);
  }, [instances]);

  // Efeito 3: sincroniza o destaque de seleção
  useEffect(() => {
    managerRef.current?.selectInstance(selectedId);
  }, [selectedId]);
}
```

**`useRef` para o SceneManager** — O SceneManager não pode ser estado React (useState) porque a criação de um novo SceneManager destruiria e recriaria o contexto WebGL a cada render. `useRef` mantém a referência persistente sem causar re-renders.

**O fluxo bidirecional:**
```
React/Zustand → SceneManager:
  instances muda → useEffect dispara → syncInstances(instances)
  selectedId muda → useEffect dispara → manager.selectInstance(selectedId)

SceneManager → React/Zustand:
  usuário clica no canvas → onClick → onSelection(id) → selectInstance(id) no store
```

---

## 16. Geração de Miniaturas dos Modelos

### O problema dos múltiplos contextos WebGL

Os navegadores limitam o número de contextos WebGL simultâneos por página (tipicamente 8-16). Se criássemos um `WebGLRenderer` para cada card do catálogo, atingiríamos facilmente esse limite com os 60 modelos.

### Solução: renderer compartilhado fora de tela

```typescript
// src/infra/services/thumbnailGenerator.ts

// Um único renderer para todas as miniaturas
let thumbnailRenderer: THREE.WebGLRenderer | null = null;

function getThumbnailRenderer(): THREE.WebGLRenderer {
  if (!thumbnailRenderer) {
    thumbnailRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,            // Fundo transparente possível
      preserveDrawingBuffer: true,  // Necessário para toDataURL()
    });
    thumbnailRenderer.setSize(128, 128);  // Pequeno: só para miniatura
    thumbnailRenderer.setPixelRatio(1);
  }
  return thumbnailRenderer;
}
```

O renderer é criado **uma única vez** e usado **sequencialmente** para gerar todas as miniaturas:

```typescript
export async function generateThumbnail(baseFile: string): Promise<string> {
  if (thumbnailCache.has(baseFile)) return thumbnailCache.get(baseFile)!;

  const renderer = getThumbnailRenderer();

  // Cena temporária apenas para esta miniatura
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e293b);

  // Câmera quadrada (aspect = 1) para o card quadrado
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  // Iluminação simples para a miniatura
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  // Carrega o modelo (do cache, se possível)
  const baseModel = await loadModel(baseFile);
  const model = baseModel.clone();
  scene.add(model);

  // Calcula bounding sphere para posicionar a câmera automaticamente
  const box = new THREE.Box3().setFromObject(model);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  const radius = sphere.radius || 1;

  // Câmera em ângulo isométrico (45° nos dois eixos)
  const distance = radius * 2.5;
  camera.position.set(distance, distance * 0.8, distance);
  camera.lookAt(0, 0, 0);

  // Renderiza a cena no buffer do renderer
  renderer.render(scene, camera);

  // Captura o buffer como imagem PNG em base64 (Data URL)
  const dataUrl = renderer.domElement.toDataURL('image/png');

  // Cache para não re-renderizar
  thumbnailCache.set(baseFile, dataUrl);

  // Limpa a cena temporária da memória
  scene.clear();

  return dataUrl;
}
```

**`preserveDrawingBuffer: true`** — Por padrão, após `renderer.render()`, o WebGL pode "limpar" o buffer de cor para economizar memória. Essa flag garante que o buffer seja preservado para que `toDataURL()` consiga capturar a imagem.

**`toDataURL('image/png')`** — Converte o conteúdo atual do canvas em uma string base64 (ex: `data:image/png;base64,iVBOR...`). Essa string pode ser usada diretamente como `src` de um elemento `<img>`.

**Bounding sphere para posicionamento automático da câmera** — Cada modelo tem um tamanho diferente (um banco de praça vs. um prédio). Para que todos apareçam bem enquadrados, calculamos a esfera que envolve o objeto e posicionamos a câmera a `2.5 × raio` de distância.

---

## 17. Salvar e Carregar Cena (Persistência JSON)

### Serialização

O estado da cena é um grafo de dados simples (sem referências circulares) — perfeitamente serializável em JSON:

```typescript
// src/core/useCases/saveScene.ts
export function serializeScene(instances: ModelInstance[]): SceneState {
  return {
    version: '1.0',  // Para suporte a migração futura de formato
    instances,       // Array de ModelInstance (interfaces simples)
  };
}

export function downloadScene(instances: ModelInstance[], fileName = 'scene.json'): void {
  const state = serializeScene(instances);
  const json = JSON.stringify(state, null, 2);  // Pretty-print com 2 espaços

  // Cria um Blob (arquivo em memória) e um link temporário para download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();  // Dispara o download no navegador

  URL.revokeObjectURL(url);  // Libera a URL temporária da memória
}
```

**O que é um Blob?** — Um `Blob` (Binary Large Object) é um objeto imutável que representa dados raw. É a forma padrão de criar "arquivos" em memória no browser antes de oferecer para download.

**`URL.createObjectURL`** — Cria uma URL temporária do tipo `blob:http://...` que aponta para o Blob na memória. Isso permite que um link `<a>` faça download de um arquivo criado em JavaScript puro, sem servidor.

### Exemplo do JSON gerado

```json
{
  "version": "1.0",
  "instances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "modelId": "building_A",
      "name": "Edifício Principal",
      "parentId": null,
      "transform": {
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 45, "z": 0 },
        "scale":    { "x": 1, "y": 1, "z": 1 }
      },
      "animation": {
        "active": false,
        "direction": { "x": 1, "y": 0, "z": 0 },
        "speed": 1
      },
      "texture": {
        "tintColor": "#ff6600",
        "opacity": 1
      }
    }
  ]
}
```

### Desserialização com validação

```typescript
// src/core/useCases/loadScene.ts
function validateSceneState(data: unknown): data is SceneState {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  // Verifica a presença dos campos obrigatórios
  if (typeof obj['version'] !== 'string') return false;
  if (!Array.isArray(obj['instances'])) return false;
  return true;
}

export function loadScene(json: string): ModelInstance[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Arquivo JSON inválido ou corrompido.');
  }

  if (!validateSceneState(data)) {
    throw new Error('Formato de cena inválido: estrutura não reconhecida.');
  }

  return data.instances;
}
```

**Type guard `data is SceneState`** — Esse é um padrão TypeScript chamado **type guard**. A função retorna `boolean`, mas o TypeScript entende que quando retorna `true`, o parâmetro `data` pode ser tratado como `SceneState` no código que chama a função.

Isso é importante porque `JSON.parse` retorna `unknown` — o TypeScript não sabe o formato do JSON. A validação + type guard torna o acesso subsequente type-safe.

---

## 18. Iluminação da Cena

O projeto usa três fontes de luz para criar um visual realista e agradável:

### 1. AmbientLight (Luz Ambiente)

```typescript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
```

Ilumina **todos os objetos igualmente** em todas as direções, sem sombra. Simula a luz difusa do ambiente (céu, reflexos do chão, etc.). É o mínimo de iluminação que garante que nenhuma face fique completamente preta.

- Cor: branco (`0xffffff`)
- Intensidade: 0.5 (50%)

### 2. DirectionalLight — Sol (Luz Principal)

```typescript
const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
sunLight.position.set(10, 15, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.setScalar(2048);
```

Simula uma fonte de luz infinitamente distante (como o sol). Todos os raios são **paralelos** (ao contrário de um ponto de luz que irradia em todas as direções).

- Cor: `#FFF4E0` — branco levemente quente (amarelado), simulando luz solar
- Intensidade: 1.2 (20% acima do máximo, para uma cena vibrante)
- Sombras habilitadas com shadow map de 2048×2048 pixels (boa qualidade)

**Shadow Map** — técnica de renderização de sombras em tempo real: 1) a cena é renderizada do ponto de vista da luz, gerando um mapa de profundidade; 2) durante a renderização normal, para cada fragmento, verifica-se se ele está na "sombra" comparando com o mapa.

### 3. DirectionalLight — Preenchimento (Fill Light)

```typescript
const fillLight = new THREE.DirectionalLight(0xc7d8ff, 0.4);
fillLight.position.set(-8, 6, -8);
```

Vem do lado oposto ao sol, com cor levemente azulada (`#C7D8FF`), simulando a luz refletida pelo céu. Suaviza as sombras duras e adiciona realismo.

Esta é uma técnica clássica de iluminação de 3 pontos:
```
                   [Sol — quente, intenso]
                          ↘
         [Fill — frio, suave] ← Objeto → [Rim light — opcional]
```

### 4. Fog (névoa)

```typescript
this.scene.fog = new THREE.Fog(0x1e293b, 30, 80);
```

Objetos além de 30 unidades gradualmente se misturam com a cor `0x1e293b` (o azul-escuro do fundo) até desaparecerem completamente aos 80 unidades. Isso cria profundidade visual e esconde o "corte" do mundo no plano distante.

---

## 19. Controles de Câmera (OrbitControls)

```typescript
this.controls = new OrbitControls(this.camera, canvas);
this.controls.enableDamping = true;
this.controls.dampingFactor = 0.05;
this.controls.maxPolarAngle = Math.PI / 2;
```

O `OrbitControls` é uma extensão do Three.js que mapeia eventos de mouse a movimentos de câmera:

| Interação | Movimento |
|---|---|
| Botão esquerdo + arrastar | Orbitar em torno do ponto de foco |
| Botão direito + arrastar | Transladar (pan) |
| Scroll do mouse | Zoom (aproximar/afastar) |

**`enableDamping: true`** — Adiciona inércia/amortecimento ao movimento da câmera. Ao soltar o mouse, a câmera desacelera gradualmente em vez de parar abruptamente. `dampingFactor = 0.05` define quão rápido desacelera (menor = mais suave).

**`maxPolarAngle = Math.PI / 2`** — O ângulo polar é medido desde o polo norte (cima, `0 rad`) até o polo sul (baixo, `π rad`). Limitando a `π/2` (90°), impedimos que a câmera passe pelo "chão" e veja a cena de baixo, o que seria confuso.

**Por que `controls.update()` no loop?** — O amortecimento (damping) é calculado incrementalmente a cada frame. Sem chamar `controls.update()` no render loop, o damping não funciona.

---

## 20. Testes Automatizados

O projeto testa as **funções puras do core/** — as regras de negócio que não dependem de browser, React ou Three.js:

### Exemplo: testando `addInstance`

```typescript
// src/tests/useCases/addInstance.test.ts
describe('addInstance', () => {
  it('deve criar uma instância com os valores padrão de transformação', () => {
    const instance = addInstance(exampleModel);
    expect(instance.transform.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(instance.transform.rotation).toEqual({ x: 0, y: 0, z: 0 });
    expect(instance.transform.scale).toEqual({ x: 1, y: 1, z: 1 });
  });

  it('deve gerar um UUID único para cada instância', () => {
    const a = addInstance(exampleModel);
    const b = addInstance(exampleModel);
    expect(a.id).not.toBe(b.id);  // Garante que IDs são únicos
  });
});
```

### Por que testes de funções puras são tão fáceis?

Uma função pura:
1. Dado o mesmo input, sempre retorna o mesmo output
2. Não tem efeitos colaterais (não modifica estado externo)

Portanto, testar é trivial: chame a função com um input e verifique o output. Não é necessário mock de banco de dados, servidor, DOM ou GPU.

Esse é um dos benefícios mais concretos da arquitetura em camadas: as regras de negócio ficam isoladas e testáveis.

### Cobertura de testes

| Arquivo de Teste | Funções Testadas | Cenários |
|---|---|---|
| `addInstance.test.ts` | `addInstance` | Defaults, UUID único, parentId null, animação desativada |
| `removeInstance.test.ts` | `removeInstance` | Remoção por ID, desvinculação de filhos, itens não relacionados |
| `setHierarchy.test.ts` | `setHierarchy` | Definir pai, remover pai, ciclo direto, ciclo indireto |
| `saveLoadScene.test.ts` | `serializeScene`, `loadScene` | Estrutura do JSON, round-trip, JSON inválido, formato errado |

---

## 21. Fluxo Completo de Uma Ação do Usuário — Exemplo Ponta a Ponta

Vamos rastrear exatamente o que acontece quando o usuário **clica em "building_A" no catálogo** e depois **muda a rotação Y para 90 graus**:

### Passo 1: Clique no ModelCard

```
Usuário clica no card "Edifício A"
  → RightPanel/ModelCard: onClick={() => onAdd(model)}
  → RightPanel/index: const onAdd = (model) => addModel(model)
  → useSceneStore.addModel({ id:"building_A", name:"Edifício A", baseFile:"building_A" })
```

### Passo 2: Criação da instância no store

```
addModel chama addInstance({ id:"building_A", ... })
  → uuid(): gera "uuid-xyz"
  → retorna ModelInstance {
      id: "uuid-xyz",
      modelId: "building_A",
      name: "Edifício A",
      parentId: null,
      transform: { position:{0,0,0}, rotation:{0,0,0}, scale:{1,1,1} },
      animation: { active:false, direction:{1,0,0}, speed:1 },
      texture: { tintColor:"#ffffff", opacity:1 }
    }

store.set({
  instances: [...state.instances, novaInstancia],
  selectedId: "uuid-xyz"
})
```

### Passo 3: Reatividade — React e Three.js atualizam

```
Zustand notifica assinantes de `instances`:
  → SceneCanvas: useEffect([instances]) dispara
  → manager.syncInstances([novaInstancia])
      → addObjectToScene(novaInstancia)
          → loadModel("building_A")      [HTTP request ou cache]
          → createModelInstance(base)    [clone com material próprio]
          → group.userData.instanceId = "uuid-xyz"
          → applyTransform(group, ...)   [position(0,0,0), rotation(0,0,0), scale(1,1,1)]
          → applyTexture(group, ...)     [cor branca, opacidade 1]
          → scene.add(group)             [APARECE NO CANVAS!]
          → objectsByInstanceId.set("uuid-xyz", group)

Zustand notifica assinantes de `selectedId`:
  → SceneCanvas: useEffect([selectedId]) dispara
  → manager.selectInstance("uuid-xyz")
      → updateSelectionHighlight("uuid-xyz")
          → mat.emissive = 0x1d4ed8 (azul)
          → mat.emissiveIntensity = 0.3

Zustand notifica assinantes do LeftPanel:
  → InstanceList: re-render com nova instância na lista (selecionada)
  → TransformEditor: re-render mostrando as propriedades do objeto selecionado
```

### Passo 4: Usuário muda Rotation Y para 90

```
TransformEditor: campo Y da rotação
  → NumericInput: handleChange("90")
      → parseFloat("90") = 90 → não é NaN
      → onChange(90) chamado
  → TransformEditor: updateRotation("uuid-xyz", { y: 90 })

useSceneStore.updateRotation("uuid-xyz", { y: 90 })
  → busca instância atual: transform.rotation = {x:0, y:0, z:0}
  → chama updateTransformation(instances, "uuid-xyz", {
      rotation: { x:0, y:0, z:0 }  // valor atual
               + { y: 90 }           // override do y
             = { x:0, y:90, z:0 }   // resultado
    })
  → instances.map: cria nova instância com rotation {0, 90, 0}
  → store.set({ instances: [...novaLista] })
```

```
Zustand notifica `instances`:
  → SceneCanvas: useEffect([instances]) dispara
  → manager.syncInstances(instânciasAtualizadas)
      → updateObjectInScene(instanciaAtualizada)
          → applyTransform(group, instancia)
              → obj.rotation.set(
                  degToRad(0),   // x
                  degToRad(90),  // y → π/2 radianos
                  degToRad(0)    // z
                )
              // O objeto GIRA no canvas instantaneamente!
```

### Diagrama final do fluxo de dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT (UI)                                  │
│  RightPanel ──→ useSceneStore.addModel()                            │
│  LeftPanel  ──→ useSceneStore.updatePosition/Rotation/Scale()       │
│  LeftPanel  ──→ useSceneStore.setParent()                           │
│  LeftPanel  ──→ useSceneStore.updateAnimation()                     │
│  LeftPanel  ──→ useSceneStore.updateTexture()                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ set() [imutável]
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ZUSTAND STORE                                     │
│  instances: ModelInstance[]                                          │
│  selectedId: string | null                                           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ notifica assinantes
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SCENECANVAS (ponte)                                 │
│  useEffect([instances]) → manager.syncInstances()                   │
│  useEffect([selectedId]) → manager.selectInstance()                 │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ API imperativa
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SCENEMANAGER (Three.js)                            │
│  syncInstances() → addObjectToScene() / updateObjectInScene()       │
│  applyTransform() → obj.position, obj.rotation, obj.scale          │
│  applyTexture() → mat.color, mat.opacity                           │
│  syncHierarchy() → parent.add(child)                               │
│  updateSelectionHighlight() → mat.emissive                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ renderer.render(scene, camera)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     WEBGL / GPU                                      │
│  Vertex shaders, Fragment shaders, Rasterização, Frame buffer       │
│                   [Imagem no <canvas>]                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Conclusão

Este projeto demonstra como construir uma aplicação de computação gráfica completa no navegador combinando:

1. **WebGL via Three.js** para renderização 3D em tempo real
2. **React** para uma interface declarativa e reativa
3. **Zustand** como camada de estado que conecta UI e Three.js
4. **Arquitetura em camadas** que mantém a lógica de negócio testável e isolada

Os conceitos de CG aplicados incluem: grafo de cena, transformações lineares (TRS), ray casting para picking, shadow mapping, modelo de iluminação Phong, texture mapping, color modulation e frame-rate independent animation. Todos esses conceitos existem há décadas na área de computação gráfica e são os fundamentos de qualquer motor 3D moderno — este projeto os implementa de forma educacional e acessível via browser.
