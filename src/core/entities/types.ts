// Tipos base compartilhados por toda a aplicação

// Vetor 3D genérico para posição, rotação e escala
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Conjunto de transformações de um objeto na cena
export interface Transform {
  position: Vec3;
  rotation: Vec3; // Ângulos em graus (Euler XYZ)
  scale: Vec3;
}

// Propriedades de animação: para onde o objeto se move e com qual velocidade
export interface AnimationConfig {
  active: boolean;
  direction: Vec3;  // Vetor de direção do movimento
  speed: number;    // Unidades por segundo
}

// Propriedades de textura por instância (tinting sobre a textura atlas)
export interface TextureConfig {
  tintColor: string;  // Cor hex para multiplicar sobre a textura (ex: "#ffffff")
  opacity: number;    // 0.0 a 1.0
}

// Definição de um modelo disponível no catálogo
export interface ModelDefinition {
  id: string;       // Identificador único (ex: "building_A")
  name: string;     // Nome legível (ex: "Edifício A")
  baseFile: string; // Nome do arquivo sem extensão (ex: "building_A")
}

// Uma instância de modelo colocada na cena
export interface ModelInstance {
  id: string;              // UUID da instância
  modelId: string;         // Referência ao ModelDefinition.id
  name: string;            // Nome customizável pelo usuário
  parentId: string | null; // ID da instância pai (hierarquia)
  transform: Transform;
  animation: AnimationConfig;
  texture: TextureConfig;
}

// Estado completo de uma cena (usado para salvar/carregar JSON)
export interface SceneState {
  version: string;
  instances: ModelInstance[];
}

// Valores padrão para novas instâncias
export const DEFAULT_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale:    { x: 1, y: 1, z: 1 },
};

export const DEFAULT_ANIMATION: AnimationConfig = {
  active:    false,
  direction: { x: 1, y: 0, z: 0 },
  speed:     1,
};

export const DEFAULT_TEXTURE: TextureConfig = {
  tintColor: '#ffffff',
  opacity:   1,
};
