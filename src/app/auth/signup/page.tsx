import { Suspense } from 'react'
import { signup } from '../actions'
import Link from 'next/link'

async function SignupForm({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const message = (await searchParams).message
  return (
    <form action={signup} className="flex flex-col gap-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-red-900/60 bg-red-950/40 p-3.5 text-xs font-medium text-red-300"
        >
          {message}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        formAction={signup}
        className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-white py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/5 cursor-pointer"
      >
        Create account
      </button>
      <div className="mt-3 text-center text-sm">
        <span className="text-zinc-400">Already have an account? </span>
        <Link href="/auth/login" className="font-semibold text-white hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}

export default function SignupPage(props: { searchParams: Promise<{ message?: string }> }) {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500 text-center py-4">Loading...</div>}>
      <SignupForm searchParams={props.searchParams} />
    </Suspense>
  )
}
