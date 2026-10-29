import { Suspense } from 'react';
import { AppNavBar } from './nav-bar';
import { STRINGS } from '@/lib/i18n/strings';
import SwipeNavigation from '@/components/SwipeNavigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white antialiased selection:bg-[#ff2a3b] selection:text-white">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#ff2a3b] focus:text-white focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff2a3b]"
      >
        {STRINGS.nav.skipToMain}
      </a>

      <Suspense fallback={<div className="h-14 border-b border-white/10 bg-black/90 backdrop-blur-xl" />}>
        <AppNavBar />
      </Suspense>

      {/* Main Content with Safe Bottom Padding for Mobile Bottom Bar & Swipe Gesture Navigation */}
      <SwipeNavigation>
        <main id="main-content" className="mx-auto w-full max-w-[1720px] flex-1 px-3.5 py-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-14 pb-24 md:pb-8 focus:outline-none min-w-0 overflow-x-hidden">
          {children}
        </main>
      </SwipeNavigation>
    </div>
  );
}
