import { Suspense } from 'react'
import { login } from '../actions'
import Link from 'next/link'

async function LoginForm({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const message = (await searchParams).message
  const isSuccess = Boolean(
    message && (
      message.toLowerCase().includes('success') ||
      message.toLowerCase().includes('deleted')
    )
  )
  return (
    <form action={login} className="flex flex-col gap-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={
            isSuccess
              ? "rounded-xl border border-[#ff2a3b]/40 bg-[#0d0d0d] p-3.5 text-xs font-medium text-[#ff2a3b]"
              : "rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs font-medium text-red-300"
          }
        >
          {message}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300" htmlFor="email">
          Email Address
        </label>
        <input
          className="rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-sm text-[#ffffff] placeholder:text-zinc-600 focus:border-[#ff2a3b] focus:outline-none focus:ring-1 focus:ring-[#ff2a3b] transition-colors min-h-[44px]"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="athlete@kinetik.app"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-300" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-sm text-[#ffffff] placeholder:text-zinc-600 focus:border-[#ff2a3b] focus:outline-none focus:ring-1 focus:ring-[#ff2a3b] transition-colors min-h-[44px]"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        formAction={login}
        className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#ff2a3b] py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#ff4d5e] active:scale-95 shadow-lg shadow-[#ff2a3b]/10 cursor-pointer"
      >
        Sign in
      </button>
      <div className="mt-3 text-center text-sm">
        <span className="text-zinc-400">Don&apos;t have an account? </span>
        <Link href="/auth/signup" className="font-bold text-[#ff2a3b] hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  return (
    <Suspense fallback={<div className="text-sm font-mono text-zinc-500 text-center py-4">Authenticating...</div>}>
      <LoginForm searchParams={props.searchParams} />
    </Suspense>
  )
}
