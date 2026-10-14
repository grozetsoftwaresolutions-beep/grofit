'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Settings,
  Dumbbell,
  CalendarCheck,
  Utensils,
  CheckSquare,
  Flame,
  LogOut,
  Home,
} from 'lucide-react';
import { signout } from '@/app/auth/actions';
import { STRINGS } from '@/lib/i18n/strings';

const DESKTOP_NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', matchExact: true },
  { href: '/app/workout-plans', label: STRINGS.nav.workoutPlans },
  { href: '/app/my-workout-plan', label: STRINGS.nav.myWorkoutPlan },
  { href: '/app/diet-foods', label: STRINGS.nav.dietFoods },
  { href: '/app/habits', label: STRINGS.nav.habitTracker },
  { href: '/app/calorie-calculator', label: STRINGS.nav.calorieCalculator },
];

const MOBILE_DOCK_ITEMS = [
  {
    href: '/app',
    label: 'Home',
    icon: Home,
    matchExact: true,
  },
  {
    href: '/app/workout-plans',
    label: 'Workouts',
    icon: Dumbbell,
    matchExact: false,
  },
  {
    href: '/app/my-workout-plan',
    label: 'My Plan',
    icon: CalendarCheck,
    matchExact: false,
  },
  {
    href: '/app/diet-foods',
    label: 'Diet',
    icon: Utensils,
    matchExact: false,
  },
  {
    href: '/app/habits',
    label: 'Habits',
    icon: CheckSquare,
    matchExact: false,
  },
];

export function AppNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Handle escape key to close mobile menu
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isSettingsActive = pathname.startsWith('/app/settings');

  return (
    <>
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-black/85 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Brand & Desktop Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/app"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-black font-black text-sm shadow-sm transition group-hover:scale-105">
                G
              </div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                {STRINGS.app.title}
              </span>
              <span className="hidden rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline-block">
                Evidence-Based
              </span>
            </Link>

            <nav
              aria-label="Desktop Primary Navigation"
              className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm font-medium"
            >
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive = item.matchExact
                  ? pathname === item.href
                  : (item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/app/settings"
              aria-label={STRINGS.nav.settings}
              aria-current={isSettingsActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isSettingsActive
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>{STRINGS.nav.settings}</span>
            </Link>

            <form action={signout}>
              <button
                type="submit"
                className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-red-400 hover:bg-zinc-900/80 rounded-xl px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
              >
                {STRINGS.nav.signOut}
              </button>
            </form>
          </div>

          {/* Mobile Top Actions: Quick Settings + Menu Toggle */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              href="/app/settings"
              aria-label={STRINGS.nav.settings}
              className={`p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors ${
                isSettingsActive ? 'text-white bg-zinc-900 font-bold' : ''
              }`}
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? STRINGS.nav.closeMenu : STRINGS.nav.openMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-drawer"
              className="p-2 text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl hover:bg-zinc-900 cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Quick Menu (for signout and extra actions) */}
        {isOpen && (
          <div
            id="mobile-navigation-drawer"
            className="md:hidden border-t border-zinc-800/80 bg-black/95 backdrop-blur-xl mt-3 pt-3 pb-2 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <nav aria-label="Mobile Drawer Navigation" className="flex flex-col gap-1">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive = item.matchExact
                  ? pathname === item.href
                  : (item.href === '/app' ? pathname === '/app' : pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-white text-black font-bold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-zinc-800/80" />

              <Link
                href="/app/settings"
                onClick={() => setIsOpen(false)}
                aria-current={isSettingsActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isSettingsActive
                    ? 'bg-white text-black font-bold'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>{STRINGS.nav.settings}</span>
              </Link>

              <form action={signout} className="mt-1">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>{STRINGS.nav.signOut}</span>
                </button>
              </form>
            </nav>
          </div>
        )}
      </header>

      {/* Modern Fixed Mobile Bottom Navigation Bar (Thumb Dock) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-zinc-800/80 bg-black/90 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0.25rem)] shadow-2xl"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {MOBILE_DOCK_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center h-full py-1 text-center transition-all active:scale-95 touch-manipulation focus-visible:outline-none ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300 font-medium'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {isActive && (
                  <span
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-white shadow-sm shadow-white/50"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`flex items-center justify-center rounded-xl p-1.5 transition-colors ${
                    isActive
                      ? 'bg-zinc-900 border border-zinc-800 text-white'
                      : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[10px] leading-tight tracking-tight mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
