'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
      <header className="sticky top-0 z-30 border-b border-[#ffffff]/10 bg-[#000000]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-14 py-3 shadow-md transition-colors">
        <div className="mx-auto flex max-w-[1720px] w-full items-center justify-between">
          {/* Brand & Desktop Links */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/app"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] rounded-xl"
            >
              <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Image
                  src="/images/grofit-crest.png"
                  alt="GroFit Logo"
                  width={44}
                  height={44}
                  className="h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow-[0_0_12px_rgba(255,42,59,0.35)]"
                  priority
                />
              </div>
              <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#ffffff]">
                GRO<span className="text-[#ff2a3b]">FIT</span>
              </span>
              <span className="hidden rounded-full border border-[#ffffff]/10 bg-[#0d0d0d] px-2 py-0.5 text-[10px] font-mono tracking-widest text-[#ff2a3b] uppercase sm:inline-block">
                TRAIN WITH INTENT
              </span>
            </Link>

            <nav
              aria-label="Desktop Primary Navigation"
              className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs font-bold uppercase tracking-wider"
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
                    className={`rounded-xl px-3.5 py-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] ${
                      isActive
                        ? 'bg-[#ff2a3b] text-white font-extrabold shadow-[0_0_15px_rgba(255, 42, 59, 0.3)]'
                        : 'text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a]'
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
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] ${
                isSettingsActive
                  ? 'bg-[#ff2a3b] text-white font-extrabold shadow-sm'
                  : 'text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a]'
              }`}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>{STRINGS.nav.settings}</span>
            </Link>

            <form action={signout}>
              <button
                type="submit"
                className="text-xs font-bold tracking-wider uppercase text-[#a1a1aa] hover:text-red-400 hover:bg-[#1a1a1a] rounded-xl px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
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
              className={`p-2 rounded-xl text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a] transition-colors ${
                isSettingsActive ? 'text-[#ff2a3b] bg-[#1a1a1a] font-bold' : ''
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
              className="p-2 text-[#a1a1aa] hover:text-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] rounded-xl hover:bg-[#1a1a1a] cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Quick Menu */}
        {isOpen && (
          <div
            id="mobile-navigation-drawer"
            className="md:hidden border-t border-[#ffffff]/10 bg-[#0d0d0d]/98 backdrop-blur-xl mt-3 pt-3 pb-2 animate-in fade-in slide-in-from-top-2 duration-200"
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
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'bg-[#ff2a3b] text-white font-extrabold'
                        : 'text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 border-t border-[#ffffff]/10" />

              <Link
                href="/app/settings"
                onClick={() => setIsOpen(false)}
                aria-current={isSettingsActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  isSettingsActive
                    ? 'bg-[#ff2a3b] text-white font-extrabold'
                    : 'text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a]'
                }`}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>{STRINGS.nav.settings}</span>
              </Link>

              <form action={signout} className="mt-1">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors cursor-pointer"
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
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[#ffffff]/10 bg-[#000000]/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),0.25rem)] shadow-2xl"
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
                    ? 'text-[#ff2a3b] font-bold'
                    : 'text-[#71717a] hover:text-[#a1a1aa] font-medium'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {isActive && (
                  <span
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-[#ff2a3b] shadow-[0_0_8px_#ff2a3b]"
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`flex items-center justify-center rounded-xl p-1.5 transition-colors ${
                    isActive
                      ? 'bg-[#1a1a1a] border border-[#ff2a3b]/30 text-[#ff2a3b]'
                      : 'hover:bg-[#0d0d0d]'
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
