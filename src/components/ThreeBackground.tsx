'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ─── Procedural Floating Gym Objects ───

function BarbellPlate({ position, rotationSpeed }: { position: [number, number, number]; rotationSpeed: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotationSpeed[0] * delta;
    ref.current.rotation.y += rotationSpeed[1] * delta;
    ref.current.rotation.z += rotationSpeed[2] * delta;
  });

  return (
    <group ref={ref} position={position}>
      {/* Outer Plate Disc */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.14, 28]} />
        <meshStandardMaterial
          color="#121212"
          metalness={0.88}
          roughness={0.35}
        />
      </mesh>
      {/* Outer Lip Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.02, 8, 32]} />
        <meshStandardMaterial color="#1f1f1f" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Inner Recessed Center */}
      <mesh>
        <cylinderGeometry args={[0.34, 0.34, 0.145, 20]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.7} roughness={0.5} />
      </mesh>
      {/* Center Bore (Bushing Hole) */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.95} roughness={0.2} />
      </mesh>
    </group>
  );
}

function HexDumbbell({ position, rotationSpeed }: { position: [number, number, number]; rotationSpeed: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotationSpeed[0] * delta;
    ref.current.rotation.y += rotationSpeed[1] * delta;
    ref.current.rotation.z += rotationSpeed[2] * delta;
  });

  return (
    <group ref={ref} position={position} scale={0.88}>
      {/* Handle Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.85, 12]} />
        <meshStandardMaterial color="#2e2e2e" metalness={0.92} roughness={0.28} />
      </mesh>
      {/* Hexagonal Weight Heads (Left & Right) */}
      {[-0.48, 0.48].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.26, 0.26, 0.22, 6]} />
          <meshStandardMaterial color="#141414" metalness={0.85} roughness={0.38} />
        </mesh>
      ))}
    </group>
  );
}

function Kettlebell({ position, rotationSpeed }: { position: [number, number, number]; rotationSpeed: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += rotationSpeed[0] * delta;
    ref.current.rotation.y += rotationSpeed[1] * delta;
    ref.current.rotation.z += rotationSpeed[2] * delta;
  });

  return (
    <group ref={ref} position={position} scale={0.78}>
      {/* Cast Iron Ball Body */}
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.42, 18, 16]} />
        <meshStandardMaterial color="#131313" metalness={0.82} roughness={0.4} />
      </mesh>
      {/* Ergonomic Loop Handle */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.22, 0.05, 8, 24]} />
        <meshStandardMaterial color="#282828" metalness={0.94} roughness={0.25} />
      </mesh>
    </group>
  );
}

// ─── Perspective Wireframe Grid Floor ───

function GymGridFloor() {
  const grid = useMemo(() => {
    // 24x24 grid fading toward the horizon
    const helper = new THREE.GridHelper(26, 26, '#ff2a3b', '#1c1c1c');
    helper.position.set(0, -3.6, -2);
    helper.rotation.x = 0;
    if (helper.material instanceof THREE.LineBasicMaterial) {
      helper.material.transparent = true;
      helper.material.opacity = 0.28;
      helper.material.blending = THREE.AdditiveBlending;
    }
    return helper;
  }, []);

  return <primitive object={grid} />;
}

// ─── Floating Gym Scene with Raised Moderate Visibility & Depth ───

function GymScene({
  reducedMotion,
  mousePos,
  scrollY,
}: {
  reducedMotion: boolean;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
  scrollY: React.MutableRefObject<number>;
}) {
  const sceneGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!sceneGroupRef.current || reducedMotion) return;

    // Smooth subtle mouse parallax
    const targetRotY = mousePos.current.x * 0.1;
    const targetRotX = -mousePos.current.y * 0.06;
    sceneGroupRef.current.rotation.y = THREE.MathUtils.damp(
      sceneGroupRef.current.rotation.y,
      targetRotY,
      2.5,
      delta
    );
    sceneGroupRef.current.rotation.x = THREE.MathUtils.damp(
      sceneGroupRef.current.rotation.x,
      targetRotX,
      2.5,
      delta
    );

    // Smooth subtle vertical parallax on scroll
    const targetPosY = (scrollY.current * -0.0008) % 1.2;
    sceneGroupRef.current.position.y = THREE.MathUtils.damp(
      sceneGroupRef.current.position.y,
      targetPosY,
      2,
      delta
    );
  });

  return (
    <group ref={sceneGroupRef}>
      {/* ─── Lifted Lighting Rig (Visible Dark Industrial Gym Atmosphere) ─── */}
      <ambientLight intensity={0.65} color="#ffffff" />
      <directionalLight position={[5, 6, 4]} intensity={2.2} color="#ffffff" />
      
      {/* Intense Athletic Brand Red Rim Lights (giving objects clear red contour outlines) */}
      <pointLight position={[-4, 1.8, 0]} intensity={8.5} distance={15} color="#ff2a3b" />
      <pointLight position={[4, -1.5, 0]} intensity={7.5} distance={14} color="#ff2a3b" />
      <pointLight position={[0, 4, -1]} intensity={5.0} distance={10} color="#ff4d5e" />
      <directionalLight position={[-3, -3, 1]} intensity={3.0} color="#ff2a3b" />

      {/* ─── Floating Low-Poly Gym Objects (Moved Closer for Clear Depth Visibility) ─── */}
      {/* Barbell Plates */}
      <BarbellPlate
        position={[-3.2, 1.8, -2.2]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [0.04, 0.06, 0.02]}
      />
      <BarbellPlate
        position={[3.4, -1.2, -2.0]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [0.05, -0.04, 0.03]}
      />
      <BarbellPlate
        position={[-2.0, -2.0, -3.2]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [-0.03, 0.05, -0.02]}
      />

      {/* Hex Dumbbells */}
      <HexDumbbell
        position={[3.0, 2.2, -1.8]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [0.06, 0.05, -0.04]}
      />
      <HexDumbbell
        position={[-3.4, -0.4, -2.4]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [-0.04, 0.07, 0.03]}
      />

      {/* Kettlebells */}
      <Kettlebell
        position={[-1.4, 2.8, -2.8]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [0.04, 0.08, 0.02]}
      />
      <Kettlebell
        position={[1.8, -2.2, -2.5]}
        rotationSpeed={reducedMotion ? [0, 0, 0] : [-0.05, -0.06, 0.03]}
      />

      {/* ─── Perspective Grid Floor ─── */}
      <GymGridFloor />

      {/* ─── Upward Floating Red Embers / Particles ─── */}
      <Sparkles
        count={45}
        scale={[14, 12, 9]}
        size={2.8}
        speed={reducedMotion ? 0 : 0.25}
        opacity={0.65}
        color="#ff2a3b"
      />
    </group>
  );
}

// ─── Stage 1: Visible Test Scene (Rotating Red 3D Shape & Floating Particles) ───

function VisibleTestScene() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += 0.6 * delta;
    meshRef.current.rotation.y += 0.8 * delta;
  });

  return (
    <group>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-4, 2, 2]} intensity={6} color="#ff2a3b" />
      <pointLight position={[4, -2, 2]} intensity={6} color="#ff4d5e" />

      {/* Rotating Athletic Red 3D Torus Knot */}
      <mesh ref={meshRef} position={[0, 0, 0]} scale={1.2}>
        <torusKnotGeometry args={[1.2, 0.38, 128, 32]} />
        <meshStandardMaterial
          color="#ff2a3b"
          roughness={0.2}
          metalness={0.85}
          emissive="#ff2a3b"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Bright Floating Particles */}
      <Sparkles
        count={80}
        scale={[12, 10, 8]}
        size={3.5}
        speed={0.5}
        opacity={0.85}
        color="#ff2a3b"
      />
    </group>
  );
}

// ─── Main ThreeBackground Component ───

export default function ThreeBackground() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const mousePos = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);

  useEffect(() => {
    setIsMounted(true);

    // 1. Reduced motion check
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const motionListener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', motionListener);

    // 2. WebGL support check
    try {
      const canvas = document.createElement('canvas');
      const gl = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }

    // 3. Tab visibility listener
    const handleVisibility = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. Mouse movement tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 5. Scroll tracking for parallax
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mq.removeEventListener('change', motionListener);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      id="three-background-root"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden bg-[#000000]"
      style={{ zIndex: 0 }}
      aria-hidden="true"
      role="presentation"
    >
      {/* WebGL Canvas or Static High-Performance CSS Fallback */}
      {isMounted && hasWebGL ? (
        <Canvas
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? 'demand' : isTabVisible ? 'always' : 'never'}
          camera={{ position: [0, 0, 5.5], fov: 48 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
          }}
          className="w-full h-full"
        >
          {/* Soft Depth Fog fading out distant boundary */}
          <fog attach="fog" args={['#000000', 5, 18]} />
          <GymScene
            reducedMotion={reducedMotion}
            mousePos={mousePos}
            scrollY={scrollY}
          />
        </Canvas>
      ) : (
        /* Static High-Performance Fallback */
        <div className="absolute inset-0 bg-[#000000]">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #ff2a3b 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
      )}

      {/* Ambient Red Depth Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[900px] h-[450px] rounded-full bg-gradient-to-b from-[#ff2a3b]/15 via-[#ff2a3b]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] rounded-full bg-[#ff2a3b]/10 blur-3xl pointer-events-none" />
    </div>
  );
}
