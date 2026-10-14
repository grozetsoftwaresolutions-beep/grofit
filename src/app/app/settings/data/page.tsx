'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { STRINGS } from '@/lib/i18n/strings';

export default function DataSettingsPage() {
  const router = useRouter();

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmInputId = useId();
  const passwordInputId = useId();

  async function handleExport() {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const res = await fetch('/api/user/export');
      if (res.ok) {
        const blob = await res.blob();
        const contentDisposition = res.headers.get('content-disposition');
        let filename = 'grofit-user-data.json';
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^";]+)"?/);
          if (match?.[1]) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setExportMessage({
          type: 'success',
          text: STRINGS.data.exportSuccess,
        });
      } else {
        const json = await res.json().catch(() => null);
        setExportMessage({
          type: 'error',
          text: json?.error?.message || STRINGS.data.exportError,
        });
      }
    } catch {
      setExportMessage({
        type: 'error',
        text: STRINGS.data.exportError,
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (confirmationText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    if (!password) {
      setDeleteError('Please enter your account password to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmationText, password }),
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        router.push('/login?deleted=true');
      } else {
        const json = await res.json().catch(() => null);
        setDeleteError(json?.error?.message || STRINGS.data.deleteError);
      }
    } catch {
      setDeleteError(STRINGS.data.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {STRINGS.data.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          {STRINGS.data.subtitle}
        </p>
      </div>

      {/* 1. Data Export Section */}
      <section aria-labelledby="export-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
            <Download className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="export-heading" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {STRINGS.data.exportHeading}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {STRINGS.data.exportDesc}
            </p>

            {exportMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-4 p-3.5 rounded-xl flex items-start gap-2.5 border text-xs sm:text-sm ${
                  exportMessage.type === 'success'
                    ? 'bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
                }`}
              >
                {exportMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-zinc-900 dark:text-white" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                )}
                <span>{exportMessage.text}</span>
              </div>
            )}

            <div className="mt-5">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-white disabled:opacity-50 transition min-h-[44px]"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isExporting ? STRINGS.data.exportingButton : STRINGS.data.exportButton}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Privacy & Health Disclaimer Section */}
      <section aria-labelledby="privacy-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-3 flex-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <h2 id="privacy-heading" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {STRINGS.data.privacyHeading}
            </h2>
            <p>{STRINGS.data.privacyBody1}</p>
            <p>{STRINGS.data.privacyBody2}</p>
            <p>{STRINGS.data.privacyBody3}</p>
          </div>
        </div>
      </section>

      {/* 3. Account Deletion Section */}
      <section aria-labelledby="delete-heading" className="rounded-2xl border border-red-200 bg-red-50/40 p-6 shadow-sm dark:border-red-900/60 dark:bg-red-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="delete-heading" className="text-base sm:text-lg font-bold text-red-900 dark:text-red-200">
              {STRINGS.data.deleteHeading}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-red-800 dark:text-red-300/90 leading-relaxed">
              {STRINGS.data.deleteWarningText}
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setConfirmationText('');
                  setPassword('');
                  setDeleteError(null);
                  setIsDeleteModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition min-h-[44px]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Request Account Deletion</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Deletion Confirmation Modal Dialog (Bottom-sheet on mobile) */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {STRINGS.data.deleteWarningTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {STRINGS.data.deleteConfirmInstructions}
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor={confirmInputId} className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {STRINGS.data.confirmInputLabel}
                </label>
                <input
                  id={confirmInputId}
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 font-mono shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor={passwordInputId} className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {STRINGS.data.passwordInputLabel}
                </label>
                <div className="relative mt-1">
                  <input
                    id={passwordInputId}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[44px]"
                  />
                  <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-zinc-400" aria-hidden="true" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 min-h-[44px]"
                >
                  {STRINGS.data.cancelButton}
                </button>
                <button
                  type="submit"
                  disabled={confirmationText !== 'DELETE' || !password || isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>{isDeleting ? STRINGS.data.deletingButton : STRINGS.data.deleteButton}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
