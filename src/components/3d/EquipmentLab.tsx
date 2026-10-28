'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  RotateCcw,
  Play,
  Pause,
  Layers,
  Sun,
  Camera,
  Check,
  ChevronRight,
} from 'lucide-react';
import type {
  EquipmentType,
  FinishType,
  LightingType,
  CameraPresetType,
} from './KineticObject';

// Dynamically import the 3D canvas with SSR disabled
const DynamicKineticObject = dynamic(() => import('./KineticObject'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] sm:h-[420px] lg:h-[480px] flex flex-col items-center justify-center bg-[#0d0d0d]/40 rounded-3xl border border-white/10 p-6">
      <div className="h-10 w-10 border-2 border-[#ff2a3b] border-t-transparent rounded-full animate-spin mb-4" />
      <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
        LOADING 3D ENGINE...
      </span>
    </div>
  ),
});

const EQUIPMENT_INFO: Record<
  EquipmentType,
  {
    label: string;
    code: string;
    descriptor: string;
    title: string;
    copy: string;
    focus: string;
    symbol: string;
  }
> = {
  barbell: {
    label: 'Barbell',
    code: '01',
    descriptor: 'PLATE-LOADED SYSTEM',
    title: 'Built for big compound lifts.',
    copy: 'A balanced bar, stacked plates, and a silhouette engineered for foundational compound strength work. Drag the model to inspect knurling, sleeve tolerances, and collar locks.',
    focus: 'COMPOUND OVERLOAD',
    symbol: '═',
  },
  dumbbell: {
    label: 'Dumbbell',
    code: '02',
    descriptor: 'SINGLE-HAND CONTROL',
    title: 'Unilateral precision & range.',
    copy: 'A compact free weight for unilateral stabilization, deep-stretch presses, supported rows, carries, and precise progressive loading without joint strain.',
    focus: 'RANGE & SYMMETRY',
    symbol: '╍',
  },
  kettlebell: {
    label: 'Kettlebell',
    code: '03',
    descriptor: 'GRIP / MOMENTUM',
    title: 'Dynamic power & flow.',
    copy: 'A weighted sphere and ergonomic loop handle designed for ballistic swings, carries, deep goblet hinges, squats, and functional rotational mechanics.',
    focus: 'GRIP & EXPLOSION',
    symbol: '◉',
  },
};

const FINISH_OPTIONS: { id: FinishType; label: string; note: string }[] = [
  { id: 'kinetik', label: 'Kinetik', note: 'SIGNATURE' },
  { id: 'carbon', label: 'Carbon', note: 'MATTE' },
  { id: 'steel', label: 'Steel', note: 'BRUSHED' },
];

const LIGHTING_OPTIONS: { id: LightingType; label: string; note: string }[] = [
  { id: 'studio', label: 'Studio', note: 'BALANCED' },
  { id: 'contrast', label: 'Contrast', note: 'RIM LIGHT' },
  { id: 'neon', label: 'Neon', note: 'RED / WHITE' },
];

const CAMERA_OPTIONS: { id: CameraPresetType; label: string }[] = [
  { id: 'hero', label: 'Hero 3/4' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
];

export default function EquipmentLab() {
  const [equipment, setEquipment] = useState<EquipmentType>('barbell');
  const [finish, setFinish] = useState<FinishType>('kinetik');
  const [lighting, setLighting] = useState<LightingType>('studio');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetType>('hero');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [resetToken, setResetToken] = useState<number>(0);

  const activeInfo = EQUIPMENT_INFO[equipment];

  return (
    <section
      id="kinetic-lab"
      className="relative py-20 lg:py-28 border-t border-white/10 bg-transparent"
      aria-labelledby="kinetic-lab-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">02 / INTERACTIVE TRAINING LAB</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff2a3b] animate-pulse" />
            </div>
            <h2
              id="kinetic-lab-title"
              className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white"
            >
              REAL-TIME <em>3D LAB.</em>
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
            Drag, zoom, and inspect our foundational hypertrophy and strength apparatus. Calibrate finishes, dynamic lighting rigs, and camera views.
          </p>
        </div>

        {/* Equipment Selector Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {(Object.keys(EQUIPMENT_INFO) as EquipmentType[]).map((key) => {
            const item = EQUIPMENT_INFO[key];
            const isActive = equipment === key;
            return (
              <button
                key={key}
                onClick={() => setEquipment(key)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ff2a3b] text-white shadow-[0_0_20px_rgba(255,42,59,0.35)] scale-[1.02]'
                    : 'bg-[#0d0d0d] text-zinc-400 hover:text-white hover:bg-[#1a1a1a] border border-white/10'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">{item.code}</span>
                <span>{item.label}</span>
                <span className="text-[10px] opacity-60">[{item.symbol}]</span>
              </button>
            );
          })}
        </div>

        {/* 3D Lab Interactive Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left/Main Column: 3D Canvas Host */}
          <div className="lg:col-span-8 relative rounded-3xl bg-gradient-to-b from-[#0d0d0d] to-[#000000] border border-white/15 p-4 sm:p-6 shadow-2xl overflow-hidden group">
            {/* Ambient Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #ff2a3b 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Top Bar Indicators */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                <span className="text-[#ff2a3b] font-bold">{activeInfo.code}</span>
                <span>/</span>
                <span>{activeInfo.descriptor}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold tracking-wider uppercase transition cursor-pointer ${
                    autoRotate
                      ? 'bg-[#ff2a3b]/15 text-[#ff2a3b] border border-[#ff2a3b]/40'
                      : 'bg-[#1a1a1a] text-zinc-400 hover:text-white'
                  }`}
                  title={autoRotate ? 'Pause Rotation' : 'Enable Auto-Rotation'}
                >
                  {autoRotate ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{autoRotate ? 'Rotate ON' : 'Rotate OFF'}</span>
                </button>

                <button
                  onClick={() => setResetToken((prev) => prev + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/10 transition cursor-pointer"
                  title="Reset Camera View"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="relative z-10">
              <DynamicKineticObject
                equipment={equipment}
                finish={finish}
                lighting={lighting}
                cameraPreset={cameraPreset}
                autoRotate={autoRotate}
                resetToken={resetToken}
              />
            </div>

            {/* Bottom HUD Touch Cue */}
            <div className="relative z-10 pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500 border-t border-white/10">
              <span>DRAG TO ROTATE · SCROLL TO ZOOM</span>
              <span className="text-[#ff2a3b] font-semibold">{activeInfo.focus}</span>
            </div>
          </div>

          {/* Right Column: Lab Control Customizer & Detail Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* Equipment Narrative Card */}
            <div className="rounded-3xl bg-[#0d0d0d]/80 backdrop-blur-md border border-white/12 p-6">
              <span className="eyebrow">{activeInfo.descriptor}</span>
              <h3 className="mt-2 text-2xl font-bold font-display tracking-tight text-white">
                {activeInfo.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {activeInfo.copy}
              </p>
            </div>

            {/* Control Panel: Finishes */}
            <div className="rounded-3xl bg-[#0d0d0d]/80 backdrop-blur-md border border-white/12 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#ff2a3b]" />
                  Material Finish
                </span>
                <span className="text-[10px] font-mono text-[#ff2a3b] uppercase font-bold">
                  {finish}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FINISH_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFinish(f.id)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      finish === f.id
                        ? 'bg-[#ff2a3b] text-white font-bold shadow-md'
                        : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">{f.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control Panel: Lighting Rigs */}
            <div className="rounded-3xl bg-[#0d0d0d]/80 backdrop-blur-md border border-white/12 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-[#ff2a3b]" />
                  Lighting Rig
                </span>
                <span className="text-[10px] font-mono text-[#ff2a3b] uppercase font-bold">
                  {lighting}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LIGHTING_OPTIONS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLighting(l.id)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      lighting === l.id
                        ? 'bg-[#ff2a3b] text-white font-bold shadow-md'
                        : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">{l.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control Panel: Camera View */}
            <div className="rounded-3xl bg-[#0d0d0d]/80 backdrop-blur-md border border-white/12 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-[#ff2a3b]" />
                  Camera Angle
                </span>
                <span className="text-[10px] font-mono text-[#ff2a3b] uppercase font-bold">
                  {cameraPreset}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CAMERA_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCameraPreset(c.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                      cameraPreset === c.id
                        ? 'bg-[#ff2a3b] text-white font-bold shadow-md'
                        : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
