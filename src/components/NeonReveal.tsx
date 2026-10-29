'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

export interface NeonRevealProps {
  children?: React.ReactNode;
  background?: string;
  direction?: 'down' | 'up' | 'left' | 'right';
  expandFrom?: 'center' | 'left' | 'right';
  trigger?: 'mount' | 'inView' | 'manual';
  revealDelay?: number;
  revealDuration?: number;
  easing?: 'out' | 'smooth' | 'gentle' | 'linear';
  thickness?: number;
  glow?: number;
  spill?: number;
  reach?: number;
  intensity?: number;
  feather?: number;
  inset?: number;
  length?: number;
  mirrored?: boolean;
  hum?: number;
  flicker?: number;
  interactive?: boolean;
  intro?: boolean;
  paused?: boolean;
  color?: string;
  className?: string;
  onAnimationComplete?: () => void;
}

export default function NeonReveal({
  children,
  background = 'transparent',
  direction = 'down',
  expandFrom = 'center',
  trigger = 'mount',
  revealDelay = 0,
  revealDuration = 2500,
  easing = 'out',
  thickness = 3,
  glow = 1,
  spill = 1,
  reach = 1,
  intensity = 1,
  feather = 0.15,
  inset = 24,
  length = 0.9,
  mirrored = false,
  hum = 1,
  flicker = 1,
  interactive = true,
  intro = true,
  paused = false,
  color = '#ff2a3b',
  className = '',
  onAnimationComplete,
}: NeonRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(intro ? 0 : 1);
  const [flickerState, setFlickerState] = useState(intro ? 0 : 1);
  const [isCompleted, setIsCompleted] = useState(!intro);

  const startAnimation = useCallback(() => {
    if (paused) return;

    setProgress(0);
    setFlickerState(0);
    setIsCompleted(false);

    // 1. Initial flicker ignition sequence (stuttering fluorescent gas ignition)
    const flickerSequence = [
      { delay: 100, val: 0.8 },
      { delay: 180, val: 0.1 },
      { delay: 260, val: 0.95 },
      { delay: 320, val: 0.2 },
      { delay: 420, val: 1.0 },
    ];

    if (flicker > 0) {
      flickerSequence.forEach(({ delay, val }) => {
        setTimeout(() => {
          setFlickerState(val * intensity);
        }, revealDelay + delay * (flicker * 0.8));
      });
    } else {
      setTimeout(() => {
        setFlickerState(1.0 * intensity);
      }, revealDelay);
    }

    // 2. Tube expansion & Light Pouring Sweep
    const startTime = performance.now() + revealDelay + (flicker > 0 ? 350 : 0);
    let animFrame: number;

    const animate = (now: number) => {
      if (now < startTime) {
        animFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const rawT = Math.min(1, Math.max(0, elapsed / revealDuration));

      // Easing curves
      let t = rawT;
      if (easing === 'out') {
        t = 1 - Math.pow(1 - rawT, 3);
      } else if (easing === 'smooth') {
        t = rawT * rawT * (3 - 2 * rawT);
      } else if (easing === 'gentle') {
        t = Math.sin((rawT * Math.PI) / 2);
      }

      setProgress(t);

      if (rawT < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setIsCompleted(true);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [paused, intro, flicker, intensity, revealDelay, revealDuration, easing, onAnimationComplete]);

  useEffect(() => {
    if (!intro) return;

    if (trigger === 'mount') {
      const cleanup = startAnimation();
      return cleanup;
    } else if (trigger === 'inView' && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger, intro, startAnimation]);

  const handleContainerClick = () => {
    if (interactive) {
      startAnimation();
    }
  };

  // Tube size and transform calculations
  const tubeWidth = `${length * 100}%`;
  const tubeOrigin = expandFrom === 'center' ? '50% 50%' : expandFrom === 'left' ? '0% 50%' : '100% 50%';
  const tubeScale = progress;

  // Glow and spill lighting calculations
  const tubeGlowBox = `0 0 ${3 * glow}px ${color}, 0 0 ${10 * glow}px ${color}, 0 0 ${20 * glow * spill}px ${color}`;
  const tubeTextShadow = `0 0 ${6 * glow}px ${color}, 0 0 ${14 * glow}px ${color}`;

  // Content reveal clip-path based on direction
  const contentMask = useMemo(() => {
    if (progress >= 1) return 'none';
    const percent = Math.round(progress * 100);
    const featherPx = Math.round(feather * 120);

    if (direction === 'down') {
      return `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${percent}%, rgba(0,0,0,0) ${Math.min(100, percent + featherPx)}%)`;
    } else if (direction === 'up') {
      return `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${percent}%, rgba(0,0,0,0) ${Math.min(100, percent + featherPx)}%)`;
    } else if (direction === 'right') {
      return `linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${percent}%, rgba(0,0,0,0) ${Math.min(100, percent + featherPx)}%)`;
    } else {
      return `linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${percent}%, rgba(0,0,0,0) ${Math.min(100, percent + featherPx)}%)`;
    }
  }, [progress, direction, feather]);

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative overflow-hidden ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{ background, willChange: 'contents', transform: 'translateZ(0)' }}
      role="region"
      aria-label="Neon Reveal Animation"
    >
      {/* ─── Top Neon Glass Tube ─── */}
      <div
        className="pointer-events-none absolute z-20 transition-opacity"
        style={{
          top: direction === 'down' ? `${inset}px` : undefined,
          bottom: direction === 'up' ? `${inset}px` : undefined,
          left: '50%',
          transform: `translateX(-50%) scaleX(${tubeScale}) translateZ(0)`,
          transformOrigin: tubeOrigin,
          width: tubeWidth,
          height: `${thickness}px`,
          opacity: flickerState,
          willChange: 'transform, opacity',
        }}
      >
        {/* Core hot-white gas discharge filament */}
        <div
          className="w-full h-full rounded-full"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: tubeGlowBox,
          }}
        />

        {/* Ambient light spill downwards - soft and controlled */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-opacity"
          style={{
            top: direction === 'down' ? '0' : undefined,
            bottom: direction === 'up' ? '0' : undefined,
            width: '90%',
            height: `${140 * reach}px`,
            background: `radial-gradient(ellipse at 50% ${direction === 'down' ? '0%' : '100%'}, ${color} 0%, ${color}15 40%, transparent 70%)`,
            opacity: flickerState * spill * (0.2 + 0.5 * progress),
            filter: 'blur(16px)',
          }}
        />
      </div>

      {/* ─── Optional Mirrored Tube (on opposite edge) ─── */}
      {mirrored && (
        <div
          className="pointer-events-none absolute z-20 transition-opacity"
          style={{
            top: direction === 'up' ? `${inset}px` : undefined,
            bottom: direction === 'down' ? `${inset}px` : undefined,
            left: '50%',
            transform: `translateX(-50%) scaleX(${tubeScale})`,
            transformOrigin: tubeOrigin,
            width: tubeWidth,
            height: `${thickness}px`,
            opacity: flickerState,
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: '#ffffff',
              boxShadow: tubeGlowBox,
            }}
          />
        </div>
      )}

      {/* ─── Revealing Content Layer ─── */}
      <div
        className="relative z-10 w-full h-full"
        style={{
          WebkitMaskImage: contentMask,
          maskImage: contentMask,
          willChange: 'mask-image, -webkit-mask-image',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </div>

      {/* Continuous gentle hum pulse */}
      {hum > 0 && isCompleted && (
        <style jsx>{`
          @keyframes neonHumPulse {
            0%, 100% { opacity: 0.96; }
            50% { opacity: 1.0; }
          }
        `}</style>
      )}
    </div>
  );
}
