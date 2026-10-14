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
    <form className="flex flex-col gap-4">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className={
            isSuccess
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          }
        >
          {message}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input className="rounded-md border p-2 text-sm dark:bg-zinc-950 dark:border-zinc-800" id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input className="rounded-md border p-2 text-sm dark:bg-zinc-950 dark:border-zinc-800" id="password" name="password" type="password" required />
      </div>
      <button formAction={login} className="mt-2 rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
        Sign in
      </button>
      <div className="mt-4 text-center text-sm">
        <span className="text-zinc-500">Don&apos;t have an account? </span>
        <Link href="/auth/signup" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
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

