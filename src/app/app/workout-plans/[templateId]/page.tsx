'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ArrowLeft,
  ShieldCheck,
  Play,
  TrendingUp,
  Sparkles,
  Layers,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface TemplateEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  sortOrder: number;
  sets: number | null;
  reps: number | null;
  videoUrl: string | null;
  sourceLabel: string | null;
  sourcePrescriptionText: string | null;
}

interface TemplateWarmup {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface TemplateDay {
  id: string;
  dayNumber: number;
  name: string;
  sortOrder: number;
  entries: TemplateEntry[];
  warmups: TemplateWarmup[];
}

interface TemplateDetail {
  id: string;
  name: string;
  description: string | null;
  sourceReference: string | null;
  sortOrder: number;
  days: TemplateDay[];
}

interface UserPlanOption {
  id: string;
  name: string;
}

function TemplateDetailContent(props: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = use(props.params);
  const router = useRouter();

  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [userPlans, setUserPlans] = useState<UserPlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('new');
  const [newPlanName, setNewPlanName] = useState('');
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workout-templates/${templateId}`);
        if (!res.ok) throw new Error('Template not found or failed to load.');
        const json = await res.json();
        setTemplate(json.data);
        setNewPlanName(`My ${json.data.name}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading template.');
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [templateId]);

  async function openApplyModal() {
    setModalOpen(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      const res = await fetch('/api/workout-plans');
      if (res.ok) {
        const json = await res.json();
        const plans = (json.data || []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        }));
        setUserPlans(plans);
      }
    } catch {
      // ignore
    }
  }

  async function handleApplyTemplate() {
    if (!template) return;
    setApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      let planId = selectedPlanId;

      if (planId === 'new') {
        const createRes = await fetch('/api/workout-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newPlanName.trim() || `My ${template.name}`,
            description: `Adapted from template: ${template.name}`,
          }),
        });
        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error?.message || 'Failed to create personal plan.');
        }
        const createJson = await createRes.json();
        planId = createJson.data.id;
      }

      const applyRes = await fetch(`/api/workout-plans/${planId}/apply-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          mode: applyMode,
        }),
      });

      if (!applyRes.ok) {
        const errData = await applyRes.json();
        throw new Error(errData.error?.message || 'Failed to apply template.');
      }

      setApplySuccess('Template successfully applied to your plan!');
      setTimeout(() => {
        router.push('/app/my-workout-plan');
      }, 1000);
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : 'Application error.');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-8 w-8 animate-spin text-zinc-900 dark:text-white" />
          <p className="mt-2 text-xs sm:text-sm text-zinc-500">Loading template details...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/workout-plans"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white min-h-[44px] py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workout Plans
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error || 'Template not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/app/workout-plans"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white min-h-[44px] py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workout Plans
        </Link>

        <button
          onClick={openApplyModal}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 min-h-[44px]"
        >
          <Sparkles className="h-4 w-4" />
          Apply to My Plan
        </button>
      </div>

      {/* Header Info */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Source
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Source: {template.sourceReference}</span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
              {template.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              {template.description}
            </p>
          </div>

          <div className="flex items-center gap-6 rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {template.days.length}
              </span>
              <span className="text-xs font-medium text-zinc-500">Days</span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-center">
              <span className="block text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                {template.days.reduce((acc, d) => acc + d.entries.length, 0)}
              </span>
              <span className="text-xs font-medium text-zinc-500">Exercises</span>
            </div>
          </div>
        </div>
      </div>

      {/* DADBODS Attribution & Credits Banner */}
      {(template.sourceReference?.toLowerCase().includes('dadbods') ||
        template.name.toLowerCase().includes('dadbods')) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  Creator Attribution
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Programming credit: <strong className="text-zinc-900 dark:text-white">DADBODS</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Sourced from the DADBODS Science-Based Workout Series
              </h3>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                Special credits and gratitude to <strong>DADBODS</strong> for designing this science-based 4-day split routine. All movement demonstrations and technical cues link directly to their official YouTube episodes and timestamps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.youtube.com/watch?v=vU4KMMlhtNI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[40px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>Episode 1 (Upper/Lower 1)</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=VeMVWBfRs4M"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[40px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>Episode 2 (Upper/Lower 2)</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Home Calisthenics Creator Credits Banner */}
      {(template.sourceReference?.toLowerCase().includes('calisthenic') ||
        template.name.toLowerCase().includes('calisthenics') ||
        template.name.toLowerCase().includes('home')) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  Creator Credits & Attribution
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Evidence-Based Calisthenics Creators
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Curated Calisthenics Tutorial Video Demonstrations
              </h3>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                Full credits and gratitude to the top evidence-based calisthenics educators whose verified tutorials power this home routine. Each exercise card links directly to their comprehensive video demonstrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.youtube.com/watch?v=IODxDxX7oi4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>Calisthenicmovement</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=MhokcbRLP5w"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>FitnessFAQs</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=SkNsa3eBwLA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>Max Euceda</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=BElgcWsChSs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                <span>Chris Heria</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Days Breakdown */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Programme Structure & Daily Splits
        </h2>

        <div className="grid gap-6">
          {template.days.map((day) => (
            <div
              key={day.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Day {day.dayNumber}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {day.name}
                </h3>
              </div>

              {/* Warm-ups if any */}
              {day.warmups && day.warmups.length > 0 && (
                <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 border border-zinc-200 dark:bg-zinc-800/40 dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
                    <Flame className="h-3.5 w-3.5" />
                    Warm-up Instructions
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.warmups.map((w) => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
                      >
                        <strong>{w.name}:</strong> {w.description || 'As prescribed'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises List */}
              <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {day.entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {entry.exerciseName}
                          </span>
                          {entry.muscleGroup && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {entry.muscleGroup}
                            </span>
                          )}
                        </div>
                        {entry.sourceLabel && entry.sourceLabel !== entry.exerciseName && (
                          <div className="text-xs text-zinc-400">
                            Source label: {entry.sourceLabel}
                          </div>
                        )}
                        {entry.sourcePrescriptionText && (
                          <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
                            {entry.sourcePrescriptionText}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-9 sm:pl-0 flex-wrap">
                      {/* Sets & Reps Prescriptions */}
                      {entry.sets !== null || entry.reps !== null ? (
                        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {entry.sets ? `${entry.sets} sets` : ''}{' '}
                          {entry.reps ? `× ${entry.reps} reps` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium italic text-zinc-400">
                          Prescription unset in source
                        </span>
                      )}

                      {/* Video Demonstration Link */}
                      {entry.videoUrl && (
                        <a
                          href={entry.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 min-h-[34px]"
                          title="Watch demonstration video"
                        >
                          <Play className="h-3 w-3 text-red-600 fill-red-600" />
                          <span>Video</span>
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      )}
                      {/* View Progress History */}
                      <Link
                        href={`/app/workout-progress/${entry.exerciseId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 min-h-[34px]"
                        title="View performance progress"
                      >
                        <TrendingUp className="h-3 w-3" />
                        <span>Progress</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Template Modal (Mobile Bottom-Sheet on small screens) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white">
              <Layers className="h-5 w-5" />
              <h2 className="text-base sm:text-lg font-bold">
                Apply Template to Personal Plan
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Apply this programme directly to your personal editable workout workspace.
            </p>

            {applyError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{applyError}</span>
              </div>
            )}

            {applySuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-100 p-3 text-xs font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{applySuccess}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Target Plan Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Personal Workout Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-white min-h-[44px]"
                >
                  <option value="new">+ Create as New Personal Plan</option>
                  {userPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlanId === 'new' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    New Plan Name
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. My Workout Plan"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-white min-h-[44px]"
                  />
                </div>
              )}

              {/* Mode Selection (Replace vs Merge) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Application Mode
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyMode('replace')}
                    className={`rounded-xl border p-3 text-left transition ${
                      applyMode === 'replace'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                      Replace
                    </span>
                    <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Overwrites existing days in plan with this split.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyMode('merge')}
                    className={`rounded-xl border p-3 text-left transition ${
                      applyMode === 'merge'
                        ? 'border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800'
                    }`}
                  >
                    <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                      Merge
                    </span>
                    <span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                      Appends template content while preserving existing days.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying || Boolean(applySuccess)}
                onClick={handleApplyTemplate}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
              >
                {applying ? 'Applying Transaction...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplateDetailPage(props: {
  params: Promise<{ templateId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-500">
          Loading workout template...
        </div>
      }
    >
      <TemplateDetailContent params={props.params} />
    </Suspense>
  );
}
