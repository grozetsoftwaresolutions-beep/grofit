import { Suspense } from 'react';
import { AppNavBar } from './nav-bar';
import { STRINGS } from '@/lib/i18n/strings';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:bg-white dark:focus:text-zinc-900 dark:focus:ring-white"
      >
        {STRINGS.nav.skipToMain}
      </a>

      <Suspense fallback={<div className="h-14 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />}>
        <AppNavBar />
      </Suspense>

      {/* Main Content with Safe Bottom Padding for Mobile Bottom Bar */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 pb-24 md:pb-8 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
