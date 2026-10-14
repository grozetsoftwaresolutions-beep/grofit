import { Suspense } from 'react'
import { login } from '../actions'
import Link from 'next/link'

async function LoginForm({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const message = (await searchParams).message
  const isSuccess = Boolean(
    message && (
      message.toLowerCase().includes('success') ||
      message.toLowerCase().includes('deleted') ||
      message.toLowerCase().includes('created')
    )
  )

  return (
    <form className="flex flex-col gap-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={
            isSuccess
              ? "rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100"
              : "rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-300"
          }
        >
          {message}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="email">
          Email
        </label>
        <input
          className="min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white focus:ring-1 focus:ring-white"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-300" htmlFor="password">
          Password
        </label>
        <input
          className="min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-white focus:ring-1 focus:ring-white"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        formAction={login}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.99]"
      >
        Sign in
      </button>
      <div className="mt-4 text-center text-sm">
        <span className="text-zinc-400">Don&apos;t have an account? </span>
        <Link href="/auth/signup" className="font-semibold text-white hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage(props: { searchParams: Promise<{ message?: string }> }) {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
      <LoginForm searchParams={props.searchParams} />
    </Suspense>
  )
}
