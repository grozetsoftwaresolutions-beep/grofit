'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { STRINGS } from '@/lib/i18n/strings';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (+00:00)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +05:30)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +09:00)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

export default function ProfileSettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [email, setEmail] = useState<string | null>(null);

  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [initialTimezone, setInitialTimezone] = useState('UTC');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const nameInputId = useId();
  const timezoneInputId = useId();
  const nameErrorId = useId();

  const hasUnsavedChanges =
    displayName !== initialDisplayName || timezone !== initialTimezone;

  useEffect(() => {
    let unmounted = false;
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          if (!unmounted && json.data) {
            setDisplayName(json.data.displayName || '');
            setTimezone(json.data.timezone || 'UTC');
            setEmail(json.data.email || null);
            setInitialDisplayName(json.data.displayName || '');
            setInitialTimezone(json.data.timezone || 'UTC');
          }
        }
      } catch {
        // silent fail
      } finally {
        if (!unmounted) {
          setIsLoading(false);
        }
      }
    }
    loadProfile();
    return () => {
      unmounted = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          timezone,
        }),
      });

      if (res.ok) {
        setInitialDisplayName(displayName.trim());
        setInitialTimezone(timezone);
        setStatusMessage({ type: 'success', text: STRINGS.profile.saveSuccess });
      } else {
        const json = await res.json().catch(() => null);
        const errText = json?.error?.fieldErrors?.displayName || json?.error?.message || STRINGS.profile.saveError;
        setStatusMessage({ type: 'error', text: errText });
      }
    } catch {
      setStatusMessage({ type: 'error', text: STRINGS.profile.saveError });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 flex items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-900 dark:text-white" aria-hidden="true" />
        <span>Loading profile settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded-lg px-2 py-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{STRINGS.common.backToSettings}</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {STRINGS.profile.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {STRINGS.profile.subtitle}
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            statusMessage.type === 'success'
              ? 'bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-zinc-900 dark:text-white" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {email && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Account Email
            </label>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {email}
            </p>
          </div>
        )}

        <div>
          <label htmlFor={nameInputId} className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {STRINGS.profile.displayNameLabel}
          </label>
          <input
            id={nameInputId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            placeholder={STRINGS.profile.displayNamePlaceholder}
            className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 shadow-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-white min-h-[44px]"
            aria-describedby={nameErrorId}
          />
          <p id={nameErrorId} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {STRINGS.profile.displayNameHint}
          </p>
        </div>

        <div>
          <label htmlFor={timezoneInputId} className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {STRINGS.profile.timezoneLabel}
          </label>
          <select
            id={timezoneInputId}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-white min-h-[44px]"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {STRINGS.profile.timezoneHint}
          </p>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {STRINGS.profile.unitsHeading}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {STRINGS.profile.unitsHint}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {STRINGS.profile.weightUnitLabel}
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              {STRINGS.profile.heightUnitLabel}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700/60">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {STRINGS.profile.calculatorNoteTitle}
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {STRINGS.profile.calculatorNote}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-xs text-zinc-500">
            {hasUnsavedChanges ? (
              <span className="text-zinc-900 dark:text-white font-semibold">Unsaved changes</span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isSaving ? STRINGS.profile.savingButton : STRINGS.profile.saveButton}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
