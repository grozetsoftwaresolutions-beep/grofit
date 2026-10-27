import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#000000] p-4 text-[#ffffff] selection:bg-[#ff2a3b] selection:text-white overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff2a3b]/15 via-[#1a1a1a]/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[400px] w-[500px] rounded-full bg-[#1a1a1a]/30 blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-[#1a1a1a] bg-[#0d0d0d]/90 p-8 sm:p-9 text-center shadow-2xl relative backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff2a3b] text-white font-black text-2xl shadow-sm mb-5">
          K
        </div>
        <span className="rounded-full border border-[#ff2a3b]/30 bg-[#ff2a3b]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ff2a3b]">
          404 Protocol Void
        </span>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#ffffff]">
          Route Not Found
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
          The requested training split, metabolic blueprint, or resource does not exist or has been recalibrated.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#ff2a3b] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff4d5e] active:scale-95 shadow-md shadow-[#ff2a3b]/10"
          >
            <Home className="h-4 w-4" />
            <span>Home Base</span>
          </Link>
          <Link
            href="/app"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#000000] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-300 transition hover:border-[#ff2a3b]/40 hover:text-[#ff2a3b]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
