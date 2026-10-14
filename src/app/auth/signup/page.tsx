import { Suspense } from 'react'
import { signup } from '../actions'
import Link from 'next/link'

async function SignupForm({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const message = (await searchParams).message
  return (
    <form className="flex flex-col gap-4">
      {message && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/50">{message}</div>}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input className="rounded-md border p-2 text-sm dark:bg-zinc-950 dark:border-zinc-800" id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <input className="rounded-md border p-2 text-sm dark:bg-zinc-950 dark:border-zinc-800" id="password" name="password" type="password" required />
      </div>
      <button formAction={signup} className="mt-2 rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700">
        Create account
      </button>
      <div className="mt-4 text-center text-sm">
        <span className="text-zinc-500">Already have an account? </span>
        <Link href="/auth/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
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
