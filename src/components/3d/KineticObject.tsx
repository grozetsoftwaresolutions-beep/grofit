'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

export type EquipmentType = 'barbell' | 'dumbbell' | 'kettlebell';
export type FinishType = 'kinetik' | 'carbon' | 'steel';
export type LightingType = 'studio' | 'contrast' | 'neon';
export type CameraPresetType = 'hero' | 'front' | 'side';

const FINISH_ACCENT: Record<FinishType, string> = {
  kinetik: '#ff2a3b',
  carbon: '#ffffff',
  steel: '#ffffff',
};

const FINISH_BODY: Record<FinishType, string> = {
  kinetik: '#151515',
  carbon: '#0a0a0a',
  steel: '#888888',
};

const BARBELL_PLATES: Record<FinishType, string[]> = {
  kinetik: ['#1f1f1f', '#141414', '#2a2a2a'],
  carbon: ['#181818', '#0f0f0f', '#222222'],
  steel: ['#dcdcdc', '#b0b0b0', '#f0f0f0'],
};

// ─── 3D BARBELL MODEL ───
function BarbellModel({ finish }: { finish: FinishType }) {
  const accent = FINISH_ACCENT[finish];
  const plates = BARBELL_PLATES[finish];

  return (
    <group rotation={[0.16, 0.18, -0.08]}>
      {/* Central Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 2.2, 40]} />
        <meshStandardMaterial
          color={finish === 'steel' ? '#f0f4f0' : finish === 'carbon' ? '#59635a' : '#cbd3c4'}
          metalness={0.96}
          roughness={0.2}
        />
      </mesh>

      {/* Knurled Center Ring */}
      <mesh>
        <cylinderGeometry args={[0.105, 0.105, 0.42, 32]} />
        <meshStandardMaterial
          color={finish === 'steel' ? '#d4ddd6' : finish === 'carbon' ? '#343c35' : '#737e6d'}
          metalness={0.82}
          roughness={0.28}
        />
      </mesh>

      {/* Knurl Grip Bands */}
      {Array.from({ length: 15 }, (_, n) => (
        <mesh key={`knurl-${n}`} position={[(n - 7) * 0.064, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.075, 0.0035, 6, 24]} />
          <meshStandardMaterial
            color={finish === 'steel' ? '#dce5dd' : '#8e9988'}
            metalness={0.9}
            roughness={0.32}
          />
        </mesh>
      ))}

      {/* Symmetric Weight Plate Assemblies (Left: -1, Right: 1) */}
      {[-1, 1].map((side) => (
        <group key={`side-${side}`} position={[side * 0.95, 0, 0]}>
          {/* 3 Tiered Olympic Plates */}
          {[0, 1, 2].map((idx) => (
            <mesh key={`plate-${idx}`} position={[side * idx * 0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.44 - idx * 0.02, 0.44 - idx * 0.02, 0.13, 56]} />
              <meshStandardMaterial color={plates[idx]} metalness={0.82} roughness={0.26} />
            </mesh>
          ))}

          {/* Outer Plate Lip Ring */}
          <mesh position={[side * 0.345, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.305, 0.008, 6, 48]} />
            <meshStandardMaterial
              color={finish === 'steel' ? '#eef3ef' : '#778373'}
              metalness={0.76}
              roughness={0.28}
            />
          </mesh>

          {/* Accent Ring */}
          <mesh position={[side * 0.345, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.235, 0.005, 6, 48]} />
            <meshStandardMaterial
              color={accent}
              metalness={0.55}
              roughness={0.25}
              emissive={finish === 'steel' ? '#555555' : '#880812'}
              emissiveIntensity={0.25}
            />
          </mesh>

          {/* Collar Lock Clamp */}
          <mesh position={[side * 0.43, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 36]} />
            <meshStandardMaterial
              color={accent}
              metalness={0.48}
              roughness={0.22}
              emissive={finish === 'steel' ? '#555555' : '#880812'}
              emissiveIntensity={0.36}
            />
          </mesh>
        </group>
      ))}

      {/* Orbital Kinetic Energy Rings */}
      <mesh rotation={[0.78, 0.2, 0.42]}>
        <torusGeometry args={[1.55, 0.012, 8, 140]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh rotation={[1.1, -0.4, -0.72]}>
        <torusGeometry args={[1.76, 0.007, 8, 140]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.62} />
      </mesh>

      {/* Floating Sparkle Nodes */}
      <mesh position={[1.49, 0.74, 0.12]}>
        <icosahedronGeometry args={[0.075, 1]} />
        <meshStandardMaterial
          color={accent}
          emissive={finish === 'steel' ? '#555555' : '#ff2a3b'}
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh position={[-1.55, -0.55, -0.2]}>
        <icosahedronGeometry args={[0.045, 1]} />
        <meshStandardMaterial
          color={accent}
          emissive={finish === 'steel' ? '#555555' : '#ff2a3b'}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── 3D DUMBBELL MODEL ───
function DumbbellModel({ finish }: { finish: FinishType }) {
  const accent = FINISH_ACCENT[finish];
  const body = FINISH_BODY[finish];

  return (
    <group rotation={[0.12, 0.2, -0.1]} scale={0.92}>
      {/* Central Handle */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.085, 0.085, 1.65, 36]} />
        <meshStandardMaterial
          color={finish === 'steel' ? '#f0f4f0' : finish === 'carbon' ? '#3b453c' : '#aeb8a7'}
          metalness={0.94}
          roughness={0.22}
        />
      </mesh>

      {/* Knurled Grip Texture */}
      {Array.from({ length: 11 }, (_, n) => (
        <mesh key={`db-grip-${n}`} position={[(n - 5) * 0.061, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.085, 0.003, 6, 24]} />
          <meshStandardMaterial
            color={finish === 'steel' ? '#dce5dd' : '#7e8978'}
            metalness={0.92}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Symmetric Weights on Both Ends */}
      {[-1, 1].map((side) => (
        <group key={`db-side-${side}`} position={[side * 0.73, 0, 0]}>
          {[0, 1].map((idx) => (
            <mesh key={`db-plate-${idx}`} position={[side * idx * 0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34 - idx * 0.035, 0.34 - idx * 0.035, 0.16, 48]} />
              <meshStandardMaterial
                color={idx === 0 ? body : finish === 'steel' ? '#b9c4bb' : '#485243'}
                metalness={0.84}
                roughness={0.25}
              />
            </mesh>
          ))}

          {/* Lip Ring */}
          <mesh position={[side * 0.265, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.235, 0.007, 6, 42]} />
            <meshStandardMaterial
              color={finish === 'steel' ? '#edf3ed' : '#768271'}
              metalness={0.78}
              roughness={0.28}
            />
          </mesh>

          {/* Accent End-Cap */}
          <mesh position={[side * 0.37, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.13, 0.13, 0.06, 32]} />
            <meshStandardMaterial
              color={accent}
              metalness={0.48}
              roughness={0.22}
              emissive={finish === 'steel' ? '#555555' : '#880812'}
              emissiveIntensity={0.32}
            />
          </mesh>
        </group>
      ))}

      {/* Orbital Kinetic Energy Ring */}
      <mesh rotation={[0.7, 0.2, 0.4]}>
        <torusGeometry args={[1.35, 0.012, 8, 120]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

// ─── 3D KETTLEBELL MODEL ───
function KettlebellModel({ finish }: { finish: FinishType }) {
  const accent = FINISH_ACCENT[finish];
  const body = FINISH_BODY[finish];

  return (
    <group rotation={[0.08, 0.22, -0.04]}>
      {/* Weighted Ball Body */}
      <mesh position={[0, -0.19, 0]} scale={[0.69, 0.72, 0.58]}>
        <sphereGeometry args={[0.72, 48, 40]} />
        <meshStandardMaterial color={body} metalness={0.78} roughness={0.24} />
      </mesh>

      {/* Flattened Base Mount */}
      <mesh position={[0, 0.01, 0]} scale={[0.44, 0.34, 0.4]}>
        <sphereGeometry args={[0.48, 32, 24]} />
        <meshStandardMaterial
          color={finish === 'steel' ? '#65726a' : body}
          metalness={0.84}
          roughness={0.22}
        />
      </mesh>

      {/* Bottom Ring of Handle */}
      <mesh position={[0, 0.01, 0]}>
        <torusGeometry args={[0.3, 0.085, 18, 56]} />
        <meshStandardMaterial color="#aebba2" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Top Ergonomic Loop Handle */}
      <mesh position={[0, 0.41, 0]}>
        <torusGeometry args={[0.28, 0.085, 18, 56]} />
        <meshStandardMaterial color="#bbc8ae" metalness={0.94} roughness={0.19} />
      </mesh>

      {/* Front Accent Emblem Badge */}
      <mesh position={[0, -0.25, 0.56]}>
        <circleGeometry args={[0.16, 40]} />
        <meshBasicMaterial color={accent} />
      </mesh>

      {/* Orbital Kinetic Energy Rings */}
      <mesh rotation={[0.82, 0.3, -0.25]}>
        <torusGeometry args={[1.18, 0.012, 8, 120]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh rotation={[1.2, -0.45, 0.6]}>
        <torusGeometry args={[1.42, 0.007, 8, 120]} />
        <meshBasicMaterial color="#9da991" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// Camera & Controller Manager
function CameraRig({
  equipment,
  autoRotate,
  resetToken,
  reducedMotion,
  cameraPreset,
}: {
  equipment: EquipmentType;
  autoRotate: boolean;
  resetToken: number;
  reducedMotion: boolean;
  cameraPreset: CameraPresetType;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useEffect(() => {
    const baseDist = equipment === 'kettlebell' ? 4.35 : equipment === 'dumbbell' ? 4.7 : 5.1;

    if (cameraPreset === 'side') {
      camera.position.set(baseDist * 0.72, 0.12, baseDist * 0.72);
    } else if (cameraPreset === 'front') {
      camera.position.set(0, 0.02, baseDist);
    } else {
      camera.position.set(0.18, 0.38, baseDist);
    }

    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  }, [camera, cameraPreset, equipment, resetToken]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableDamping={true}
      dampingFactor={0.08}
      minDistance={3.1}
      maxDistance={7.2}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={(Math.PI * 3) / 4}
      autoRotate={autoRotate && !reducedMotion}
      autoRotateSpeed={0.8}
    />
  );
}

export default function KineticObject({
  equipment = 'barbell',
  finish = 'kinetik',
  lighting = 'studio',
  cameraPreset = 'hero',
  autoRotate = true,
  resetToken = 0,
}: {
  equipment?: EquipmentType;
  finish?: FinishType;
  lighting?: LightingType;
  cameraPreset?: CameraPresetType;
  autoRotate?: boolean;
  resetToken?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', listener);

      try {
        const canvas = document.createElement('canvas');
        const gl = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        setHasWebGL(Boolean(gl));
      } catch {
        setHasWebGL(false);
      }

      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries.some((e) => e.isIntersecting));
      },
      { rootMargin: '160px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] sm:h-[420px] lg:h-[480px] flex items-center justify-center select-none"
      role="group"
      aria-label={`Interactive 3D ${equipment}; drag to rotate view`}
    >
      {isInView && hasWebGL ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, equipment === 'kettlebell' ? 4.35 : 5.1], fov: 43 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Lighting Presets */}
          <ambientLight intensity={lighting === 'contrast' ? 0.6 : lighting === 'neon' ? 0.85 : 1.1} />
          <directionalLight
            position={[3.5, 4, 3]}
            intensity={lighting === 'contrast' ? 3.1 : lighting === 'neon' ? 1.6 : 2.4}
            color={lighting === 'contrast' ? '#ffffff' : lighting === 'neon' ? '#ff2a3b' : '#ffffff'}
          />
          <directionalLight
            position={[-3, 1, -2]}
            intensity={lighting === 'contrast' ? 2.4 : lighting === 'neon' ? 3 : 0.8}
            color={lighting === 'contrast' ? '#888888' : lighting === 'neon' ? '#ffffff' : '#666666'}
          />
          <pointLight
            position={[-3, -1.8, 1.2]}
            intensity={lighting === 'contrast' ? 6 : lighting === 'neon' ? 16 : 12}
            color={lighting === 'contrast' ? '#ffffff' : '#ff2a3b'}
          />
          <pointLight
            position={[0, 2, -2]}
            intensity={lighting === 'neon' ? 10 : lighting === 'contrast' ? 2 : 5}
            color={lighting === 'neon' ? '#ff4d5e' : '#444444'}
          />

          {/* Model Rendering */}
          <group>
            {equipment === 'dumbbell' ? (
              <DumbbellModel finish={finish} />
            ) : equipment === 'kettlebell' ? (
              <KettlebellModel finish={finish} />
            ) : (
              <BarbellModel finish={finish} />
            )}
          </group>

          {/* Floor Shadow Ring */}
          <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.25, 64]} />
            <meshBasicMaterial color="#bfff4b" transparent opacity={0.055} />
          </mesh>

          <CameraRig
            equipment={equipment}
            autoRotate={autoRotate}
            resetToken={resetToken}
            reducedMotion={reducedMotion}
            cameraPreset={cameraPreset}
          />
        </Canvas>
      ) : (
        /* Stylized Geometric CSS Fallback */
        <div className="relative flex flex-col items-center justify-center p-8 text-center">
          <div className="relative w-48 h-48 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border border-[#bcf477]/25 animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-dashed border-[#bcf477]/15 animate-spin" style={{ animationDuration: '30s' }} />
            <div className="h-20 w-20 rounded-2xl bg-[#0d2617] border border-[#bcf477]/40 flex items-center justify-center shadow-lg">
              <span className="font-display text-xl font-black text-[#bcf477] uppercase">{equipment}</span>
            </div>
          </div>
          <span className="text-[10px] tracking-widest font-mono text-[#b6c7b3] uppercase">
            {hasWebGL ? 'INTERACTIVE 3D SCENE' : 'WEBGL NOT AVAILABLE'}
          </span>
        </div>
      )}
    </div>
  );
}
