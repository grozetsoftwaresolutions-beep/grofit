import { Suspense } from 'react'
import { signup } from '../actions'
import Link from 'next/link'

async function SignupForm({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const message = (await searchParams).message
  const isExisting = Boolean(message && message.toLowerCase().includes('already exists'))

  return (
    <form className="flex flex-col gap-4">
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <p>{message}</p>
          {isExisting && (
            <Link
              href="/auth/login"
              className="mt-2 inline-block font-semibold text-zinc-900 underline underline-offset-2 dark:text-white"
            >
              Click here to sign in →
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">
          Email
        </label>
        <input
          className="min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">
          Password (minimum 6 characters)
        </label>
        <input
          className="min-h-[44px] rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white dark:focus:ring-white"
          id="password"
          name="password"
          type="password"
          minLength={6}
          placeholder="••••••••"
          required
        />
      </div>
      <button
        formAction={signup}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Create account
      </button>
      <div className="mt-4 text-center text-sm">
        <span className="text-zinc-500">Already have an account? </span>
        <Link href="/auth/login" className="font-semibold text-zinc-900 hover:underline dark:text-white">
          Sign in
        </Link>
      </div>
    </form>
  )
}

export default function SignupPage(props: { searchParams: Promise<{ message?: string }> }) {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading...</div>}>
      <SignupForm searchParams={props.searchParams} />
    </Suspense>
  )
}
