export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white">
            grofit
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Evidence-based fitness & nutrition tracking
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
