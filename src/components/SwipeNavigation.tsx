'use client';

import React, { useRef, useEffect, useCallback, Suspense } from 'react';
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

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isExcludedTarget = useRef<boolean>(false);

  // Determine current active tab index
  const getCurrentIndex = useCallback((): number => {
    if (!pathname) return -1;
    if (pathname === '/app') return 0;
    if (pathname === '/app/workout-plans') return 1;
    if (pathname === '/app/my-workout-plan') return 2;
    if (pathname === '/app/diet-foods') return 3;
    if (pathname === '/app/habits') return 4;
    return -1;
  }, [pathname]);

  const currentIndex = getCurrentIndex();

  // Prefetch adjacent routes for instant transitions
  useEffect(() => {
    if (currentIndex >= 0) {
      if (currentIndex > 0) {
        router.prefetch(DOCK_TABS[currentIndex - 1]);
      }
      if (currentIndex < DOCK_TABS.length - 1) {
        router.prefetch(DOCK_TABS[currentIndex + 1]);
      }
    }
  }, [currentIndex, router]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const target = e.target as HTMLElement;

    // Ignore swipes starting inside inputs, sliders, scrollables, or marked elements
    if (
      target.closest('input, textarea, select, [role="slider"], [role="dialog"], [data-no-swipe]') ||
      target.closest('.no-swipe')
    ) {
      isExcludedTarget.current = true;
      return;
    }

    // Check if target or ancestor has horizontal scroll enabled
    let el: HTMLElement | null = target;
    while (el && el !== e.currentTarget) {
      const overflowX = window.getComputedStyle(el).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
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

    // 1. Gesture must be predominantly horizontal (at least 1.5x larger than vertical)
    if (absDeltaX < absDeltaY * 1.5) return;

    // 2. Minimum distance threshold (55px) and max duration (650ms) to avoid slow drags
    if (absDeltaX < 55 || deltaTime > 650) return;

    // Haptic tap feedback on supported mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(12);
      } catch {
        // no-op
      }
    }

    // Swipe Left (finger moves right to left): Navigate to NEXT tab
    if (deltaX < 0) {
      if (currentIndex < DOCK_TABS.length - 1) {
        router.push(DOCK_TABS[currentIndex + 1]);
      }
    }
    // Swipe Right (finger moves left to right): Navigate to PREVIOUS tab
    else if (deltaX > 0) {
      if (currentIndex > 0) {
        router.push(DOCK_TABS[currentIndex - 1]);
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full flex-1 flex flex-col min-h-0"
    >
      {children}
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
