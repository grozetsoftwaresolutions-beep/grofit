'use client';

import React, { useRef, useEffect } from 'react';

export interface StarBurstProps {
  speed?: number;
  density?: number;
  starCount?: number;
  color?: string;
  centerX?: number;
  centerY?: number;
  starSize?: number;
  brightness?: number;
  opacity?: number;
  flowerIntensity?: number;
  twinkleSpeed?: number;
  wobbleAmount?: number;
  innerLayerIntensity?: number;
  outerLayerIntensity?: number;
  fadeHeight?: number;
  className?: string;
}

interface StarParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  seed: number;
  layer: 'inner' | 'outer';
}

export default function StarBurst({
  speed = 1,
  density = 0.5,
  starCount = 100,
  color = '#ff2a3b',
  centerX = 0.5,
  centerY = 0.5,
  starSize = 0.3,
  brightness = 1,
  opacity = 1,
  flowerIntensity = 0.5,
  twinkleSpeed = 0.2,
  wobbleAmount = 1,
  innerLayerIntensity = 1,
  outerLayerIntensity = 1.5,
  fadeHeight = 2.5,
  className = '',
}: StarBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Parse hex color into RGB components
    const hexToRgb = (hex: string) => {
      const sanitized = hex.replace('#', '');
      const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map(c => c + c).join('') : sanitized, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    };

    const rgb = hexToRgb(color);

    // Initialize stars array
    const actualStarCount = Math.floor(starCount * (0.6 + density * 0.8));
    const stars: StarParticle[] = [];

    for (let i = 0; i < actualStarCount; i++) {
      const isInner = Math.random() < 0.35;
      stars.push({
        angle: (i / actualStarCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15,
        distance: Math.random() * (width / 2),
        speed: (0.4 + Math.random() * 0.9) * speed,
        size: (1.0 + Math.random() * 2.2) * starSize,
        seed: Math.random() * 100,
        layer: isInner ? 'inner' : 'outer',
      });
    }

    let time = 0;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      time += 0.016 * speed;
      ctx.clearRect(0, 0, width, height);

      const focalX = width * centerX;
      const focalY = height * centerY;
      const maxDist = Math.hypot(width, height) * 0.65;

      // Draw Blooming Flower Core (center bloom)
      if (flowerIntensity > 0) {
        const coreGradient = ctx.createRadialGradient(
          focalX,
          focalY,
          2,
          focalX,
          focalY,
          60 * flowerIntensity
        );
        coreGradient.addColorStop(
          0,
          `rgba(255, 255, 255, ${0.4 * flowerIntensity * brightness * opacity})`
        );
        coreGradient.addColorStop(
          0.4,
          `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.25 * flowerIntensity * brightness * opacity})`
        );
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(focalX, focalY, 60 * flowerIntensity, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Streaming Stars & Rays
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Advance distance outward
        star.distance += star.speed * 2.0;
        if (star.distance > maxDist) {
          star.distance = 4 + Math.random() * 15;
          star.angle = (i / stars.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        }

        // Wobble perturbation
        const wobble = Math.sin(time * 2 + star.seed) * 0.04 * wobbleAmount;
        const curAngle = star.angle + wobble;

        // Twinkle factor
        const twinkle = 0.65 + 0.35 * Math.sin(time * 6 * twinkleSpeed + star.seed);

        // Distance attenuation & fade height
        const distRatio = Math.min(1, star.distance / maxDist);
        const fade = Math.sin(distRatio * Math.PI) * (1 / (1 + (star.distance / (120 * fadeHeight))));

        const layerMult = star.layer === 'inner' ? innerLayerIntensity : outerLayerIntensity;
        const currentAlpha = Math.min(
          1,
          Math.max(0, fade * twinkle * brightness * opacity * layerMult * 0.85)
        );

        if (currentAlpha <= 0.01) continue;

        const posX = focalX + Math.cos(curAngle) * star.distance;
        const posY = focalY + Math.sin(curAngle) * star.distance;

        // Draw star ray head
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(posX, posY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // White core highlight for intense specular look
        if (star.size > 1.2) {
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(posX, posY, star.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        // Streaming light streak / tail
        const tailLength = Math.min(22, star.speed * 12);
        const tailX = posX - Math.cos(curAngle) * tailLength;
        const tailY = posY - Math.sin(curAngle) * tailLength;

        const streakGradient = ctx.createLinearGradient(posX, posY, tailX, tailY);
        streakGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha * 0.6})`);
        streakGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = streakGradient;
        ctx.lineWidth = Math.max(0.6, star.size * 0.6);
        ctx.beginPath();
        ctx.moveTo(posX, posY);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    speed,
    density,
    starCount,
    color,
    centerX,
    centerY,
    starSize,
    brightness,
    opacity,
    flowerIntensity,
    twinkleSpeed,
    wobbleAmount,
    innerLayerIntensity,
    outerLayerIntensity,
    fadeHeight,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none ${className}`}
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}
