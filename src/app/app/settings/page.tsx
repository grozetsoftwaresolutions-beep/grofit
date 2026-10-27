import Link from 'next/link';
import { User, ShieldCheck, ChevronRight, Sliders } from 'lucide-react';
import { STRINGS } from '@/lib/i18n/strings';

export const metadata = {
  title: 'Settings — grofit',
  description: 'Manage account profile, display settings, personal data export, and privacy.',
};

export default function SettingsLandingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="eyebrow flex items-center gap-1.5 text-[11px] font-bold text-[#ff2a3b] uppercase tracking-widest">
            <Sliders className="h-3 w-3" />
            System &amp; Preferences
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-[#ffffff]">
          {STRINGS.settings.title}
        </h1>
        <p className="mt-1 text-sm sm:text-base text-zinc-400">
          {STRINGS.settings.subtitle}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Profile Card */}
        <Link
          href="/app/settings/profile"
          className="kinetik-card group relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:border-[#ff2a3b]/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b]"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff2a3b]/10 text-[#ff2a3b] border border-[#ff2a3b]/20 transition-transform group-hover:scale-105">
              <User className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
              {STRINGS.settings.profileCardTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {STRINGS.settings.profileCardDesc}
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#1a1a1a] text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ff2a3b] min-h-[44px]">
            <span>Manage Profile</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] text-[#ff2a3b] group-hover:border-[#ff2a3b]/40 group-hover:bg-[#ff2a3b]/10 transition-colors">
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </div>
        </Link>

        {/* Data & Privacy Card */}
        <Link
          href="/app/settings/data"
          className="kinetik-card group relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:border-[#ff2a3b]/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b]"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff2a3b]/10 text-[#ff2a3b] border border-[#ff2a3b]/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
              {STRINGS.settings.dataCardTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {STRINGS.settings.dataCardDesc}
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#1a1a1a] text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ff2a3b] min-h-[44px]">
            <span>Data &amp; Account Lifecycle</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] text-[#ff2a3b] group-hover:border-[#ff2a3b]/40 group-hover:bg-[#ff2a3b]/10 transition-colors">
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
