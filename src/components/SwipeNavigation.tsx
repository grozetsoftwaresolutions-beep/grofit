'use client';

import React, { useRef, useEffect, useState, useTransition, useCallback, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DOCK_TABS = [
  '/app',
  '/app/workout-plans',
  '/app/my-workout-plan',
  '/app/diet-foods',
  '/app/habits',
];

interface SwipeNavigationProps {
  children: React.ReactNode;
}

function SwipeNavigationInner({ children }: SwipeNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [isNavigating, setIsNavigating] = useState(false);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward' | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isExcludedTarget = useRef<boolean>(false);

  // Determine current active tab index
  const getCurrentIndex = useCallback((): number => {
    if (!pathname) return -1;
    if (pathname === '/app') return 0;
    if (pathname.startsWith('/app/workout-plans') || pathname.startsWith('/app/workouts')) return 1;
    if (pathname.startsWith('/app/my-workout-plan') || pathname.startsWith('/app/my-plan')) return 2;
    if (pathname.startsWith('/app/diet-foods') || pathname.startsWith('/app/diet')) return 3;
    if (pathname.startsWith('/app/habits')) return 4;
    return -1;
  }, [pathname]);

  const currentIndex = getCurrentIndex();

  // Reset transition state whenever pathname finishes updating
  useEffect(() => {
    setIsNavigating(false);
    setNavDirection(null);
  }, [pathname]);

  // Safety fallback: auto-reset transition if navigation takes longer than 2.5s
  useEffect(() => {
    if (!isNavigating) return;
    const fallbackTimer = setTimeout(() => {
      setIsNavigating(false);
      setNavDirection(null);
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, [isNavigating]);

  // Aggressive idle prefetching of all 5 dock tabs into Next.js router memory
  useEffect(() => {
    const prefetchTimer = setTimeout(() => {
      DOCK_TABS.forEach((tab) => {
        router.prefetch(tab);
      });
    }, 150);

    return () => clearTimeout(prefetchTimer);
  }, [router]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // If navigation transition is currently in progress, ignore new touch gestures to avoid queue freezes
    if (isNavigating || isPending) {
      return;
    }

    if (e.touches.length !== 1) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const target = e.target as HTMLElement;

    // Ignore swipes starting inside inputs, sliders, dialogs, or designated containers
    if (
      target.closest('input, textarea, select, [role="slider"], [role="dialog"], [data-no-swipe]') ||
      target.closest('.no-swipe')
    ) {
      isExcludedTarget.current = true;
      return;
    }

    // Check if target or any ancestor has horizontal scroll enabled
    let el: HTMLElement | null = target;
    while (el && el !== e.currentTarget) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        if (el.scrollWidth > el.clientWidth) {
          isExcludedTarget.current = true;
          return;
        }
      }
      el = el.parentElement;
    }

    isExcludedTarget.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      isNavigating ||
      isPending ||
      isExcludedTarget.current ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;

    // Reset touch coordinates
    touchStartX.current = null;
    touchStartY.current = null;

    // Only handle swipes if on a top-level dock tab
    if (currentIndex === -1) return;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Gesture must be predominantly horizontal (at least 1.4x larger than vertical)
    if (absDeltaX < absDeltaY * 1.4) return;

    // Minimum distance threshold (40px) and max duration (600ms)
    if (absDeltaX < 40 || deltaTime > 600) return;

    // Determine target index based on user's exact specification:
    // 1. Drag RIGHT-TO-LEFT (deltaX < 0): Advance forward along the dock (Home -> Workouts -> My Plan -> Diet -> Habits)
    // 2. Drag LEFT-TO-RIGHT (deltaX > 0): Step backward along the dock in reverse (Habits -> Diet -> My Plan -> Workouts -> Home)
    let nextIndex = -1;
    let direction: 'forward' | 'backward' | null = null;

    if (deltaX < 0) {
      // Finger drags right to left -> advance to next tab
      if (currentIndex < DOCK_TABS.length - 1) {
        nextIndex = currentIndex + 1;
        direction = 'forward';
      }
    } else if (deltaX > 0) {
      // Finger drags left to right -> step back to previous tab
      if (currentIndex > 0) {
        nextIndex = currentIndex - 1;
        direction = 'backward';
      }
    }

    if (nextIndex === -1 || !direction) return;

    const targetUrl = DOCK_TABS[nextIndex];

    // Trigger immediate haptic tap feedback if supported
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {
        // no-op
      }
    }

    // Trigger instant visual state transition (0ms UI feedback eliminates "struck" feeling)
    setIsNavigating(true);
    setNavDirection(direction);

    // React 19 non-blocking transition for smooth 60fps route push
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const isTransitionActive = isNavigating || isPending;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full flex-1 flex flex-col min-h-0"
    >
      {/* Sleek Top Glow Loader during Tab Transition */}
      {isTransitionActive && (
        <div
          className="fixed top-0 inset-x-0 z-50 h-[2.5px] bg-gradient-to-r from-transparent via-[#ff2a3b] to-transparent shadow-[0_0_14px_#ff2a3b] animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Main Tab Content with GPU-Accelerated Hardware Smooth Slide */}
      <div
        className={`w-full flex-1 flex flex-col min-h-0 ${
          isTransitionActive
            ? 'transition-all duration-200 ease-out will-change-[transform,opacity]'
            : ''
        }`}
        style={{
          transform: isTransitionActive
            ? navDirection === 'forward'
              ? 'translate3d(-24px, 0, 0)'
              : 'translate3d(24px, 0, 0)'
            : undefined,
          opacity: isTransitionActive ? 0.65 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function SwipeNavigation({ children }: SwipeNavigationProps) {
  return (
    <Suspense fallback={<div className="w-full flex-1 flex flex-col min-h-0">{children}</div>}>
      <SwipeNavigationInner>{children}</SwipeNavigationInner>
    </Suspense>
  );
}
