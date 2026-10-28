import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-transparent p-4 text-[#ffffff] selection:bg-[#ff2a3b] selection:text-white overflow-hidden">
      {/* Ambient background radial glow matching Kinetik hero */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff2a3b]/15 via-[#1a1a1a]/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-[400px] w-[500px] rounded-full bg-[#1a1a1a]/30 blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-[#1a1a1a] bg-[#0d0d0d]/90 p-7 sm:p-9 shadow-2xl relative backdrop-blur-xl">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-2 focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-black text-base shadow-sm transition group-hover:scale-105">
              K
            </div>
            <span className="font-display text-2xl font-black tracking-tight uppercase text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
              grofit
            </span>
            <span className="rounded-full border border-[#ff2a3b]/30 bg-[#ff2a3b]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff2a3b]">
              Kinetik
            </span>
          </Link>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Sign in to access your training splits &amp; metabolic protocols
          </p>
        </div>

        {children}

        <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-[#ff2a3b] transition-colors">
            ← Back to GroFit Home
          </Link>
        </div>
      </div>
    </div>
  );
}
