// Componente: editor de propriedades da instância selecionada (transform, animação, textura, hierarquia)
import { useState, useEffect } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { Input }  from '../ui/input';
import { Label }  from '../ui/label';
import { Button } from '../ui/button';
import type { Vec3 } from '../../core/entities/types';

/**
 * Input numérico com estado local de string para permitir edição livre.
 * Atualiza o store em tempo real a cada tecla, desde que o valor seja um
 * número válido. Campos intermediários como "" ou "-" não disparam update,
 * e o valor é restaurado no blur caso a digitação tenha ficado incompleta.
 */
function NumericInput({
  value,
  onChange,
  step = 0.1,
  min,
}: {
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
}) {
  const [text, setText]       = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sincroniza quando o valor externo muda (ex: troca de instância)
  // mas não interrompe a digitação em andamento
  useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);

    // Atualiza o store em tempo real se o valor já é um número completo
    // parseFloat("") e parseFloat("-") retornam NaN, portanto não disparam
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    // Se o campo ficou com valor inválido (vazio, só "-", etc.), restaura
    if (isNaN(parseFloat(text))) {
      setText(String(value));
    }
  };

  return (
    <Input
      type="number"
      step={step}
      min={min}
      value={text}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className="h-7 text-xs px-2"
    />
  );
}

// Campo de três inputs numéricos (X, Y, Z) com label
function Vec3Field({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: Vec3;
  onChange: (axis: keyof Vec3, val: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-1">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis}>
            <Label className="text-slate-500">{axis.toUpperCase()}</Label>
            <NumericInput
              value={value[axis]}
              onChange={(val) => onChange(axis, val)}
              step={step}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Separador visual de seções
function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {title}
      </span>
      <div className="flex-1 h-px bg-slate-700" />
    </div>
  );
}

export function TransformEditor() {
  const instances       = useSceneStore((s) => s.instances);
  const selectedId      = useSceneStore((s) => s.selectedId);
  const updatePosition  = useSceneStore((s) => s.updatePosition);
  const updateRotation  = useSceneStore((s) => s.updateRotation);
  const updateScale     = useSceneStore((s) => s.updateScale);
  const updateAnimation = useSceneStore((s) => s.updateAnimation);
  const updateTexture   = useSceneStore((s) => s.updateTexture);
  const setParent       = useSceneStore((s) => s.setParent);
  const renameInstance  = useSceneStore((s) => s.renameInstance);
  const removeModel     = useSceneStore((s) => s.removeModel);

  // Busca a instância selecionada
  const instance = instances.find((i) => i.id === selectedId);

  if (!instance) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-slate-600 text-center">
          Selecione um objeto na cena ou na lista acima para editar.
        </p>
      </div>
    );
  }

  // Instâncias disponíveis como pai (qualquer uma exceto ela mesma)
  const possibleParents = instances.filter((i) => i.id !== instance.id);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 text-slate-200">

      {/* ── Nome e modelo ─────────────────────────────────────── */}
      <SectionDivider title="Objeto" />
      <div className="space-y-1">
        <Label>Nome</Label>
        <Input
          value={instance.name}
          onChange={(e) => renameInstance(instance.id, e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label>Modelo base</Label>
        <p className="text-xs text-slate-400 bg-slate-800 rounded px-2 py-1">
          {instance.modelId}
        </p>
      </div>

      {/* ── Hierarquia ────────────────────────────────────────── */}
      <SectionDivider title="Hierarquia" />
      <div className="space-y-1">
        <Label>Objeto pai</Label>
        <select
          className="w-full h-7 text-xs bg-slate-800 border border-slate-600 rounded px-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={instance.parentId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            try {
              setParent(instance.id, val || null);
            } catch (err) {
              alert((err as Error).message);
            }
          }}
        >
          <option value="">— Sem pai (raiz) —</option>
          {possibleParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Transformações ────────────────────────────────────── */}
      <SectionDivider title="Transformação" />
      <Vec3Field
        label="Posição"
        value={instance.transform.position}
        onChange={(axis, val) => updatePosition(instance.id, { [axis]: val })}
        step={0.5}
      />
      <Vec3Field
        label="Rotação (graus)"
        value={instance.transform.rotation}
        onChange={(axis, val) => updateRotation(instance.id, { [axis]: val })}
        step={15}
      />
      <Vec3Field
        label="Escala"
        value={instance.transform.scale}
        onChange={(axis, val) => updateScale(instance.id, { [axis]: val })}
        step={0.1}
      />

      {/* ── Textura ───────────────────────────────────────────── */}
      <SectionDivider title="Textura" />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Cor (tint)</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={instance.texture.tintColor}
              onChange={(e) =>
                updateTexture(instance.id, { tintColor: e.target.value })
              }
              className="w-8 h-7 rounded cursor-pointer bg-transparent border-0"
            />
            <Input
              value={instance.texture.tintColor}
              onChange={(e) =>
                updateTexture(instance.id, { tintColor: e.target.value })
              }
              className="h-7 text-xs"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Opacidade ({Math.round(instance.texture.opacity * 100)}%)</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={instance.texture.opacity}
            onChange={(e) =>
              updateTexture(instance.id, { opacity: parseFloat(e.target.value) })
            }
            className="w-full h-7 accent-blue-500"
          />
        </div>
      </div>

      {/* ── Animação ──────────────────────────────────────────── */}
      <SectionDivider title="Animação" />
      <div className="space-y-2">
        {/* Toggle de ativação da animação */}
        <div className="flex items-center justify-between">
          <Label>Animação ativa</Label>
          <button
            className={`relative w-10 h-5 rounded-full transition-colors ${
              instance.animation.active ? 'bg-blue-600' : 'bg-slate-700'
            }`}
            onClick={() =>
              updateAnimation(instance.id, { active: !instance.animation.active })
            }
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                instance.animation.active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Direção do movimento */}
        <Vec3Field
          label="Direção"
          value={instance.animation.direction}
          onChange={(axis, val) =>
            updateAnimation(instance.id, {
              direction: { ...instance.animation.direction, [axis]: val },
            })
          }
          step={0.1}
        />

        {/* Velocidade do movimento */}
        <div className="space-y-1">
          <Label>Velocidade (un/s)</Label>
          <NumericInput
            value={instance.animation.speed}
            onChange={(val) => updateAnimation(instance.id, { speed: val })}
            step={0.5}
            min={0}
          />
        </div>
      </div>

      {/* ── Ações ────────────────────────────────────────────── */}
      <SectionDivider title="Ações" />
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => removeModel(instance.id)}
      >
        Remover da cena
      </Button>
    </div>
  );
}
