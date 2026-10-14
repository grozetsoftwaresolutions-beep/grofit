import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-4 text-white selection:bg-zinc-800 selection:text-white overflow-hidden">
      {/* Ambient background glow matching landing page hero */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl relative">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2 focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-black text-base shadow-sm transition group-hover:scale-105">
              G
            </div>
            <span className="text-2xl font-black tracking-tight text-white">grofit</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              Evidence-Based
            </span>
          </Link>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Sign in to access your workout splits and nutrition
          </p>
        </div>

        {children}

        <div className="mt-6 pt-4 border-t border-zinc-900 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition">
            ← Back to GroFit Home
          </Link>
        </div>
      </div>
    </div>
  );
}
