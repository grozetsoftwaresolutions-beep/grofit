'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import NeonReveal from '@/components/NeonReveal';

// ─── Set to true to replay the intro animation on every page refresh (useful for testing) ───
const SHOW_INTRO_EVERY_TIME = false;

const SESSION_STORAGE_KEY = 'grofit_intro_seen';

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const dismissIntro = useCallback(() => {
    setIsFadingOut(true);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors in private browsing modes
    }

    // Wait for the CSS fade-out transition (600ms) before unmounting completely
    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  }, []);

  useEffect(() => {
    // 1. Reduced motion preference check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Session storage guard check
    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    } catch {
      alreadySeen = false;
    }

    if (!SHOW_INTRO_EVERY_TIME && alreadySeen) {
      // Already seen in this session, do not show
      return;
    }

    if (prefersReducedMotion) {
      // Respect user's motion preference: immediately mark seen and do not play full intro
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      } catch {
        // no-op
      }
      return;
    }

    // First time in this session: display overlay
    setIsVisible(true);

    // Auto-dismiss after 2.8 seconds
    const autoDismissTimer = setTimeout(() => {
      dismissIntro();
    }, 2800);

    // Keyboard listener for instant skip: Escape, Space, Enter
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        dismissIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(autoDismissTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissIntro]);

  if (!isVisible) return null;

  return (
    <div
      onClick={dismissIntro}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#000000] transition-opacity duration-600 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to GROFIT"
    >
      {/* Ambient background glow behind the neon reveal */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-gradient-to-b from-[#ff2a3b]/06 via-[#ff2a3b]/02 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-[#ff2a3b]/04 blur-3xl" />

      {/* Subtle edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.85) 100%)',
        }}
      />

      {/* ─── Neon Reveal Animation Container ─── */}
      <div
        className="relative z-10 w-full max-w-3xl px-6 py-12 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <NeonReveal
          direction="down"
          expandFrom="center"
          revealDuration={2000}
          revealDelay={150}
          thickness={2}
          glow={0.45}
          spill={0.22}
          reach={0.4}
          color="#ff2a3b"
          interactive={false}
          className="w-full flex flex-col items-center justify-center py-8"
        >
          <div className="flex flex-col items-center text-center">
            {/* ── Official Brand Emblem ── */}
            <div className="relative mb-3 h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl bg-[#0a0a0a]/80 border border-[#ff2a3b]/40 p-1.5 shadow-[0_0_25px_rgba(255,42,59,0.35)] flex items-center justify-center">
              <Image
                src="/images/grofit-crest.png"
                alt="GroFit Official Emblem"
                width={64}
                height={64}
                className="h-full w-full object-contain scale-105"
                priority
              />
            </div>

            {/* Athletic Brand Monospace Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff2a3b] animate-pulse" />
              <span className="font-mono text-xs tracking-[0.25em] text-[#ff2a3b] uppercase font-bold">
                SYSTEM INITIALIZING
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff2a3b] animate-pulse" />
            </div>

            {/* Main Brand Condensed Typography */}
            <h1 className="font-display text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-white uppercase leading-none drop-shadow-[0_0_10px_rgba(255,42,59,0.2)]">
              GRO<span className="text-[#ff2a3b]">FIT</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-[0.3em] text-zinc-400 uppercase font-semibold">
              TRAIN WITH INTENT
            </p>
          </div>
        </NeonReveal>
      </div>

      {/* ─── Skip Button (Top Right) ─── */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={dismissIntro}
          className="group flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-wider text-zinc-400 backdrop-blur-md transition hover:border-[#ff2a3b]/50 hover:bg-black/90 hover:text-white cursor-pointer"
          aria-label="Skip Intro Animation"
        >
          <span>SKIP</span>
          <span className="text-[#ff2a3b] text-sm group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </button>
      </div>

      {/* Dismiss Hint at Bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
          Press ESC or click anywhere to skip
        </span>
      </div>
    </div>
  );
}
