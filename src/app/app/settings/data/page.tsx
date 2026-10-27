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
      {/* Back Link */}
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
          Governance &amp; Sovereignty
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#ffffff]">
          {STRINGS.data.title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          {STRINGS.data.subtitle}
        </p>
      </div>

      {/* 1. Data Export Section */}
      <section aria-labelledby="export-heading" className="kinetik-card rounded-2xl p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff2a3b]/10 text-[#ff2a3b] border border-[#ff2a3b]/20">
            <Download className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="export-heading" className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#ffffff]">
              {STRINGS.data.exportHeading}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {STRINGS.data.exportDesc}
            </p>

            {exportMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-4 p-3.5 rounded-xl flex items-start gap-2.5 border text-xs sm:text-sm ${
                  exportMessage.type === 'success'
                    ? 'bg-[#0d0d0d] border-[#ff2a3b]/40 text-[#ff2a3b]'
                    : 'bg-red-950/40 border-red-800 text-red-300'
                }`}
              >
                {exportMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[#ff2a3b]" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                )}
                <span>{exportMessage.text}</span>
              </div>
            )}

            <div className="mt-5">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff2a3b] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#ff4d5e] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a3b] disabled:opacity-50 transition min-h-[44px] cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
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
      <section aria-labelledby="privacy-heading" className="kinetik-card rounded-2xl p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff2a3b]/10 text-[#ff2a3b] border border-[#ff2a3b]/20">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-3 flex-1 text-xs sm:text-sm text-zinc-400 leading-relaxed">
            <h2 id="privacy-heading" className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#ffffff]">
              {STRINGS.data.privacyHeading}
            </h2>
            <p>{STRINGS.data.privacyBody1}</p>
            <p>{STRINGS.data.privacyBody2}</p>
            <p>{STRINGS.data.privacyBody3}</p>
          </div>
        </div>
      </section>

      {/* 3. Account Deletion Section */}
      <section aria-labelledby="delete-heading" className="rounded-2xl border border-red-900/60 bg-red-950/20 p-6 sm:p-7 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-950/60 text-red-400 border border-red-900/40">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="delete-heading" className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-red-200">
              {STRINGS.data.deleteHeading}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-red-300/90 leading-relaxed">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition min-h-[44px] cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md"
        >
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-red-900/60 bg-[#0d0d0d] p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-zinc-700 sm:hidden" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-950/80 text-red-400 border border-red-900/40">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="modal-title" className="font-display text-xl font-bold uppercase tracking-wide text-red-200">
                  {STRINGS.data.deleteWarningTitle}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {STRINGS.data.deleteConfirmInstructions}
                </p>
              </div>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" aria-hidden="true" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor={confirmInputId} className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  {STRINGS.data.confirmInputLabel}
                </label>
                <input
                  id={confirmInputId}
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="mt-1.5 block w-full rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-xs sm:text-sm text-[#ffffff] font-mono shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor={passwordInputId} className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  {STRINGS.data.passwordInputLabel}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id={passwordInputId}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="block w-full rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-xs sm:text-sm text-[#ffffff] shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[44px]"
                  />
                  <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-zinc-500" aria-hidden="true" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="rounded-xl border border-[#1a1a1a] bg-[#000000] px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 min-h-[44px] cursor-pointer"
                >
                  {STRINGS.data.cancelButton}
                </button>
                <button
                  type="submit"
                  disabled={confirmationText !== 'DELETE' || !password || isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px] cursor-pointer"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden="true" />}
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
