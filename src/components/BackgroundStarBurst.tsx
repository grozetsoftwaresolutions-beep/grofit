'use client';

import React, { useRef, useEffect } from 'react';

interface StarParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  seed: number;
  layer: 'inner' | 'outer';
}

export default function BackgroundStarBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Cap devicePixelRatio to 1.5 for optimal performance
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // 3. Pause rendering when browser tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Setup stars configuration (luminous athletic brand red with brilliant specular highlights)
    const isMobile = width < 768;
    const starCount = isMobile ? 65 : 120;
    const speedMultiplier = prefersReducedMotion ? 0 : 0.85;
    const baseColor = { r: 255, g: 42, b: 59 }; // #ff2a3b

    const stars: StarParticle[] = [];
    for (let i = 0; i < starCount; i++) {
      const isInner = Math.random() < 0.45;
      stars.push({
        angle: (i / starCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.25,
        distance: Math.random() * (Math.max(width, height) * 0.7),
        speed: (0.6 + Math.random() * 1.1) * speedMultiplier,
        size: (2.2 + Math.random() * 2.8), // Bold visible star size (2.2px - 5.0px)
        seed: Math.random() * 100,
        layer: isInner ? 'inner' : 'outer',
      });
    }

    let time = 0;
    const focalXRatio = 0.5; // Center focal origin of the Star Burst
    const focalYRatio = 0.45;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const focalX = width * focalXRatio;
      const focalY = height * focalYRatio;
      const maxDist = Math.hypot(width, height) * 0.85;

      // Draw Glowing Central Radial Bloom (flowerIntensity)
      const coreGradient = ctx.createRadialGradient(
        focalX,
        focalY,
        4,
        focalX,
        focalY,
        Math.min(width, height) * 0.45
      );
      coreGradient.addColorStop(0, 'rgba(255, 42, 59, 0.35)');
      coreGradient.addColorStop(0.25, 'rgba(255, 42, 59, 0.16)');
      coreGradient.addColorStop(0.55, 'rgba(255, 42, 59, 0.05)');
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(focalX, focalY, Math.min(width, height) * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Render streaming star rays
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          star.distance += star.speed * 2.2;
          if (star.distance > maxDist) {
            star.distance = 8 + Math.random() * 35;
            star.angle = (i / stars.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
          }
        }

        const wobble = prefersReducedMotion ? 0 : Math.sin(time * 2.5 + star.seed) * 0.04;
        const curAngle = star.angle + wobble;

        // Subtle organic twinkling
        const twinkle = prefersReducedMotion ? 1 : 0.75 + 0.25 * Math.sin(time * 5.0 + star.seed);

        // Smooth boundary fade-out only near the very outer edges
        const edgeFade = Math.min(1, Math.max(0, (maxDist - star.distance) / (maxDist * 0.25)));

        // Clear, bold alpha: always visible between 0.60 and 0.95
        const currentAlpha = Math.min(1, Math.max(0.25, 0.88 * twinkle * edgeFade));

        const posX = focalX + Math.cos(curAngle) * star.distance;
        const posY = focalY + Math.sin(curAngle) * star.distance;

        // 1. Star Streaming Ray / Light Streak (Bold tail length 45px - 110px)
        const tailLength = Math.min(110, Math.max(45, star.speed * 48));
        const tailX = posX - Math.cos(curAngle) * tailLength;
        const tailY = posY - Math.sin(curAngle) * tailLength;

        const streakGrad = ctx.createLinearGradient(posX, posY, tailX, tailY);
        streakGrad.addColorStop(0, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${currentAlpha * 0.95})`);
        streakGrad.addColorStop(0.35, `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${currentAlpha * 0.45})`);
        streakGrad.addColorStop(1, 'rgba(255, 42, 59, 0)');

        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = Math.max(1.8, star.size * 0.7);
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // 2. Star Head (Glowing Brand Red with Halo)
        ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(posX, posY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 3. Hot Pure White Specular Core
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(posX, posY, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      id="background-starburst-root"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden bg-[#000000]"
      style={{ zIndex: 0 }}
      aria-hidden="true"
      role="presentation"
    >
      {/* High-Performance Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />

      {/* Atmospheric Red Depth Ambient Glow Behind Content */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-b from-[#ff2a3b]/22 via-[#ff2a3b]/6 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[450px] rounded-full bg-[#ff2a3b]/15 blur-3xl pointer-events-none" />
    </div>
  );
}
