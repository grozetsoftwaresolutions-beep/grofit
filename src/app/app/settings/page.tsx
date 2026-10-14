import Link from 'next/link';
import { User, ShieldCheck, ChevronRight } from 'lucide-react';
import { STRINGS } from '@/lib/i18n/strings';

export const metadata = {
  title: 'Settings — grofit',
  description: 'Manage account profile, display settings, personal data export, and privacy.',
};

export default function SettingsLandingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {STRINGS.settings.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {STRINGS.settings.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile Card */}
        <Link
          href="/app/settings/profile"
          className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-white"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
              <User className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
              {STRINGS.settings.profileCardTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {STRINGS.settings.profileCardDesc}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white min-h-[44px]">
            <span>Manage Profile</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </Link>

        {/* Data & Privacy Card */}
        <Link
          href="/app/settings/data"
          className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:focus-visible:ring-white"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
              {STRINGS.settings.dataCardTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {STRINGS.settings.dataCardDesc}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white min-h-[44px]">
            <span>Data & Account Lifecycle</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </div>
  );
}
