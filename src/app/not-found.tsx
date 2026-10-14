import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4 text-white selection:bg-zinc-800 selection:text-white overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-2xl relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black font-black text-2xl shadow-sm mb-5">
          G
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          404 Error
        </span>
        <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          The page or workout routine you were looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/5"
          >
            <Home className="h-4 w-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            href="/app"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Open Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
