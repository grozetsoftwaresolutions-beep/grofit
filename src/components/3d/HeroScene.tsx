'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function CoreModel({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.36) * 0.14;
    groupRef.current.rotation.z = Math.sin(t * 0.72) * 0.025;
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      {/* Top Cap */}
      <mesh position={[0, 1.42, -0.02]}>
        <cylinderGeometry args={[0.29, 0.34, 0.1, 32]} />
        <meshStandardMaterial color="#6a7565" metalness={0.9} roughness={0.24} />
      </mesh>

      {/* Vertical Stabilizer Rods */}
      {[-0.23, 0.23].flatMap((x) =>
        [-0.17, 0.17].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 1.08, z]}>
            <cylinderGeometry args={[0.012, 0.012, 0.62, 8]} />
            <meshStandardMaterial color="#a6b69b" metalness={0.88} roughness={0.28} />
          </mesh>
        ))
      )}

      {/* Upper Ring */}
      <mesh position={[0, 0.76, 0]}>
        <torusGeometry args={[0.47, 0.045, 10, 56]} />
        <meshStandardMaterial color="#9aa793" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Main Core Cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.53, 0.48, 1.68, 56, 12]} />
        <meshStandardMaterial
          color="#172019"
          metalness={0.62}
          roughness={0.3}
          emissive="#172817"
          emissiveIntensity={0.24}
        />
      </mesh>

      {/* Mid Rings & Accent Trim */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.51, 0.51, 0.08, 56]} />
        <meshStandardMaterial color="#687361" metalness={0.92} roughness={0.2} />
      </mesh>

      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.08, 56]} />
        <meshStandardMaterial color="#101611" metalness={0.62} roughness={0.26} />
      </mesh>

      {/* Glowing Crimson Torus Rings */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.505, 0.025, 8, 64]} />
        <meshStandardMaterial
          color="#ff2a3b"
          metalness={0.52}
          roughness={0.25}
          emissive="#ff1e32"
          emissiveIntensity={0.85}
        />
      </mesh>

      <mesh position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.485, 0.018, 8, 64]} />
        <meshStandardMaterial
          color="#ff4d5e"
          metalness={0.45}
          roughness={0.28}
          emissive="#ff2a3b"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Front Emblem Plate */}
      <mesh position={[0, 0.05, 0.51]}>
        <boxGeometry args={[0.58, 0.21, 0.035]} />
        <meshStandardMaterial color="#0a110b" metalness={0.3} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.05, 0.535]}>
        <torusGeometry args={[0.075, 0.012, 8, 32]} />
        <meshStandardMaterial
          color="#ff2a3b"
          metalness={0.4}
          roughness={0.25}
          emissive="#ff2a3b"
          emissiveIntensity={1.0}
        />
      </mesh>
      <mesh position={[0, 0.05, 0.545]}>
        <circleGeometry args={[0.022, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function OrbitalRings({ reducedMotion }: { reducedMotion: boolean }) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringsRef.current || reducedMotion) return;
    const t = clock.getElapsedTime();
    ringsRef.current.rotation.y = t * 0.12;
    ringsRef.current.rotation.z = Math.sin(t * 0.16) * 0.08;
  });

  return (
    <group ref={ringsRef} rotation={[0.42, 0.05, -0.2]}>
      <mesh>
        <torusGeometry args={[1.28, 0.013, 8, 100]} />
        <meshStandardMaterial
          color="#ff2a3b"
          metalness={0.3}
          roughness={0.25}
          emissive="#ff1e32"
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh rotation={[0.6, 0.8, 0.3]}>
        <torusGeometry args={[1.48, 0.008, 8, 100]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.45}
        />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', listener);

      // Check WebGL availability
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
      { rootMargin: '180px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[480px] lg:h-[560px] flex items-center justify-center select-none"
      aria-hidden="true"
    >
      {isInView && hasWebGL ? (
        <Canvas
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? 'demand' : 'always'}
          camera={{ position: [0, 0, 5.7], fov: 37 }}
          gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
          className="w-full h-full"
        >
          <ambientLight intensity={1.25} />
          <directionalLight position={[3.2, 4, 5]} color="#ffffff" intensity={3.4} />
          <pointLight position={[-2.1, 0.2, 1.4]} color="#ff2a3b" intensity={20} distance={6} />
          <pointLight position={[2.2, -0.8, -1.8]} color="#ff5964" intensity={8} distance={5} />
          <OrbitalRings reducedMotion={reducedMotion} />
          <CoreModel reducedMotion={reducedMotion} />
          <Sparkles count={30} scale={[3.4, 3.3, 2.1]} size={1.8} speed={reducedMotion ? 0 : 0.18} opacity={0.65} color="#ff2a3b" />
        </Canvas>
      ) : (
        /* Stylized CSS 3D Fallback with concentric glowing rings */
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
          <div className="absolute inset-0 rounded-full border border-[#ff2a3b]/30 animate-pulse" />
          <div className="absolute inset-6 rounded-full border border-dashed border-[#ff2a3b]/20 animate-spin" style={{ animationDuration: '24s' }} />
          <div className="absolute inset-14 rounded-full border border-white/10" />
          <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-[#0d0d0d] to-[#1a1a1a] border border-[#ff2a3b]/40 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,42,59,0.3)]">
            <span className="font-display text-2xl font-black tracking-wider text-[#ff2a3b]">GROFIT</span>
            <span className="text-[9px] tracking-widest text-zinc-400 uppercase font-mono mt-0.5">3D CORE</span>
          </div>
        </div>
      )}
    </div>
  );
}
