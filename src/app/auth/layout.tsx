export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            grofit
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to track your fitness journey
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
