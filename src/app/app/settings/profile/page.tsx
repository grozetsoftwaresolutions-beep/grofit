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
      <div className="max-w-2xl mx-auto py-16 flex items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin text-[#ff2a3b]" aria-hidden="true" />
        <span className="font-mono text-xs uppercase tracking-wider">Loading profile protocol...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back to Settings */}
      <div className="flex items-center gap-2">
        <Link
          href="/app/settings"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400 hover:text-[#ff2a3b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] rounded-lg px-2 py-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{STRINGS.common.backToSettings}</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="eyebrow text-[11px] font-bold text-[#ff2a3b] uppercase tracking-widest block mb-1">
          Identity &amp; Regional
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#ffffff]">
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
              ? 'bg-[#0d0d0d] border-[#ff2a3b]/40 text-[#ff2a3b]'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[#ff2a3b]" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="kinetik-card space-y-6 rounded-2xl p-6 sm:p-7">
        {email && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Account Email
            </label>
            <p className="mt-1.5 text-sm text-[#ffffff] font-mono bg-[#000000] p-3 rounded-xl border border-[#1a1a1a]">
              {email}
            </p>
          </div>
        )}

        <div>
          <label htmlFor={nameInputId} className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
            {STRINGS.profile.displayNameLabel}
          </label>
          <input
            id={nameInputId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            placeholder={STRINGS.profile.displayNamePlaceholder}
            className="mt-1.5 block w-full rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-xs sm:text-sm text-[#ffffff] shadow-sm placeholder-zinc-600 focus:border-[#ff2a3b] focus:outline-none focus:ring-1 focus:ring-[#ff2a3b] min-h-[44px] transition-colors"
            aria-describedby={nameErrorId}
          />
          <p id={nameErrorId} className="mt-1.5 text-xs text-zinc-500">
            {STRINGS.profile.displayNameHint}
          </p>
        </div>

        <div>
          <label htmlFor={timezoneInputId} className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
            {STRINGS.profile.timezoneLabel}
          </label>
          <select
            id={timezoneInputId}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-xs sm:text-sm text-[#ffffff] shadow-sm focus:border-[#ff2a3b] focus:outline-none focus:ring-1 focus:ring-[#ff2a3b] min-h-[44px] transition-colors cursor-pointer"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-[#000000] text-[#ffffff]">
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-zinc-500">
            {STRINGS.profile.timezoneHint}
          </p>
        </div>

        <div className="border-t border-[#1a1a1a] pt-5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ffffff]">
            {STRINGS.profile.unitsHeading}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            {STRINGS.profile.unitsHint}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm text-zinc-300">
            <div className="p-3 bg-[#000000] rounded-xl border border-[#1a1a1a] font-medium text-center">
              {STRINGS.profile.weightUnitLabel}
            </div>
            <div className="p-3 bg-[#000000] rounded-xl border border-[#1a1a1a] font-medium text-center">
              {STRINGS.profile.heightUnitLabel}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#ff2a3b]/5 p-4 border border-[#ff2a3b]/20">
          <h3 className="text-xs font-bold text-[#ff2a3b] uppercase tracking-wider">
            {STRINGS.profile.calculatorNoteTitle}
          </h3>
          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
            {STRINGS.profile.calculatorNote}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#1a1a1a]">
          <div className="text-xs font-mono">
            {hasUnsavedChanges ? (
              <span className="text-[#ff2a3b] font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff2a3b] animate-pulse" />
                Unsaved modifications detected
              </span>
            ) : (
              <span className="text-zinc-500">All parameters synced</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff2a3b] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#ff4d5e] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] disabled:opacity-40 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />}
            <span>{isSaving ? STRINGS.profile.savingButton : STRINGS.profile.saveButton}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
