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
  videoCredit?: string | null;
  sourceReference?: string | null;
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
          <Calendar className="mx-auto h-8 w-8 animate-spin text-[#ff2a3b]" />
          <p className="mt-2 text-xs font-mono text-[#a1a1aa]">Loading template details...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Link
          href="/app/workout-plans"
          className="kinetik-btn-dark px-4 py-2 text-xs font-mono font-bold inline-flex items-center gap-1.5 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workout Templates</span>
        </Link>
        <div className="kinetik-card border-red-500/40 bg-red-950/40 p-6 text-red-300 font-mono text-xs">
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
          className="kinetik-btn-dark px-4 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Workout Templates</span>
        </Link>

        <button
          onClick={openApplyModal}
          className="kinetik-btn-lime px-5 py-2.5 text-xs font-extrabold uppercase shadow-md inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span>Apply to My Plan</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="kinetik-card p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2a3b]/30 bg-[#1a1a1a] px-3 py-1 text-xs font-mono font-bold text-[#ff2a3b] uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Source
              </span>
              <span className="text-xs font-mono text-[#a1a1aa]">Source: {template.sourceReference}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-black text-[#ffffff] uppercase tracking-tight">
              {template.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
              {template.description}
            </p>
          </div>

          <div className="flex items-center gap-6 rounded-2xl bg-[#000000] border border-[#ffffff]/10 px-5 py-3.5 font-mono">
            <div className="text-center">
              <span className="block font-display text-2xl sm:text-3xl font-black text-[#ffffff]">
                {template.days.length}
              </span>
              <span className="text-[10px] uppercase text-[#a1a1aa]">Days</span>
            </div>
            <div className="h-8 w-px bg-[#ffffff]/10" />
            <div className="text-center">
              <span className="block font-display text-2xl sm:text-3xl font-black text-[#ff2a3b]">
                {template.days.reduce((acc, d) => acc + d.entries.length, 0)}
              </span>
              <span className="text-[10px] uppercase text-[#a1a1aa]">Exercises</span>
            </div>
          </div>
        </div>
      </div>

      {/* DADBODS Attribution & Credits Banner */}
      {(template.sourceReference?.toLowerCase().includes('dadbods') ||
        template.name.toLowerCase().includes('dadbods')) && (
        <div className="kinetik-card p-6 border-[#ff2a3b]/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="eyebrow border border-[#ff2a3b]/30 bg-[#1a1a1a] text-[#ff2a3b]">
                  Creator Attribution
                </span>
                <span className="text-xs font-mono text-[#a1a1aa]">
                  Programming credit: <strong className="text-[#ffffff]">DADBODS</strong>
                </span>
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-[#ffffff]">
                Sourced from the DADBODS Science-Based Workout Series
              </h3>
              <p className="text-xs leading-relaxed text-[#a1a1aa]">
                Special credits and gratitude to <strong className="text-[#ffffff]">DADBODS</strong> for designing this science-based 4-day split routine. All movement demonstrations and technical cues link directly to their official YouTube episodes and timestamps.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.youtube.com/watch?v=vU4KMMlhtNI"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3.5 py-2 text-xs font-mono font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>Episode 1 (Upper/Lower 1)</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=VeMVWBfRs4M"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3.5 py-2 text-xs font-mono font-bold inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>Episode 2 (Upper/Lower 2)</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Home Calisthenics Creator Credits Banner */}
      {(template.sourceReference?.toLowerCase().includes('calisthenic') ||
        template.name.toLowerCase().includes('calisthenics') ||
        template.name.toLowerCase().includes('home')) && (
        <div className="kinetik-card p-6 border-[#ff2a3b]/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="eyebrow border border-[#ff2a3b]/30 bg-[#1a1a1a] text-[#ff2a3b]">
                  Creator Credits & Attribution
                </span>
                <span className="text-xs font-mono text-[#a1a1aa]">
                  Evidence-Based Calisthenics Creators
                </span>
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-[#ffffff]">
                Curated Calisthenics Tutorial Video Demonstrations
              </h3>
              <p className="text-xs leading-relaxed text-[#a1a1aa]">
                Full credits and gratitude to the top evidence-based calisthenics educators whose verified tutorials power this home routine. Each exercise card links directly to their comprehensive video demonstrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.youtube.com/watch?v=IODxDxX7oi4"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>Calisthenicmovement</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=MhokcbRLP5w"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>FitnessFAQs</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=SkNsa3eBwLA"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>Max Euceda</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
              <a
                href="https://www.youtube.com/watch?v=BElgcWsChSs"
                target="_blank"
                rel="noopener noreferrer"
                className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Play className="h-3.5 w-3.5 text-[#ff2a3b] fill-[#ff2a3b]" />
                <span>Chris Heria</span>
                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6-Day Split Form Demonstrations & Channel Credits Banner */}
      {(template.name.toLowerCase().includes('6-day') ||
        template.name.toLowerCase().includes('finalized')) && (
        <div className="kinetik-card p-6 border-[#ff2a3b]/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="eyebrow border border-[#ff2a3b]/30 bg-[#1a1a1a] text-[#ff2a3b]">
                  Verified Video Demonstrations
                </span>
                <span className="text-xs font-mono text-[#a1a1aa]">
                  Evidence-Based Coach Credits
                </span>
              </div>
              <h3 className="font-display text-lg font-black uppercase tracking-tight text-[#ffffff]">
                Curated Form Tutorials & Channel Attribution
              </h3>
              <p className="text-xs leading-relaxed text-[#a1a1aa]">
                All exercise form demonstrations and biomechanical cues in this split link directly to high-definition tutorials by premier fitness educators: <strong className="text-[#ffffff]">Jeff Nippard</strong>, <strong className="text-[#ffffff]">Renaissance Periodization</strong>, <strong className="text-[#ffffff]">Scott Herman Fitness</strong>, <strong className="text-[#ffffff]">Jeremy Ethier</strong>, <strong className="text-[#ffffff]">Squat University</strong>, <strong className="text-[#ffffff]">ATHLEAN-X™</strong>, and <strong className="text-[#ffffff]">DeltaBolic</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {['Jeff Nippard', 'Renaissance Periodization', 'Scott Herman', 'Squat University', 'ATHLEAN-X™', 'Jeremy Ethier', 'DeltaBolic'].map((coach) => (
                <span key={coach} className="inline-flex items-center rounded-lg border border-[#ffffff]/10 bg-[#000000] px-2.5 py-1 text-[11px] font-mono font-medium text-[#a1a1aa]">
                  {coach}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Days Breakdown */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#ffffff]">
            Programme Structure & Daily Splits
          </h2>
          <span className="text-xs font-mono text-[#a1a1aa]">
            {template.days.length} Training Days
          </span>
        </div>

        <div className="grid gap-6">
          {template.days.map((day) => (
            <div
              key={day.id}
              className="kinetik-card p-5 sm:p-6 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff]/10 pb-3">
                <div>
                  <span className="eyebrow text-[#ff2a3b]">
                    Day {day.dayNumber}
                  </span>
                  <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff] mt-1">
                    {day.name}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#a1a1aa] rounded-md bg-[#000000] px-2.5 py-1 border border-[#ffffff]/10">
                  {day.entries.length} Exercises
                </span>
              </div>

              {/* Warm-ups if any */}
              {day.warmups && day.warmups.length > 0 && (
                <div className="mt-4 rounded-xl bg-[#000000] p-3.5 border border-[#ff2a3b]/20">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[#ff2a3b]">
                    <Flame className="h-3.5 w-3.5" />
                    Warm-up Protocol
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.warmups.map((w) => (
                      <span
                        key={w.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0d0d0d] px-2.5 py-1 text-xs text-[#ffffff] border border-[#ffffff]/10"
                      >
                        <strong className="text-[#ff2a3b]">{w.name}:</strong> <span className="text-[#a1a1aa]">{w.description || 'As prescribed'}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises List */}
              <div className="mt-4 divide-y divide-[#ffffff]/5">
                {day.entries.map((entry, idx) => {
                  const EXERCISE_CREATOR_CREDITS: Record<string, string> = {
                    'barbell row': 'DeltaBolic',
                    'lat pull down': 'Jeff Nippard',
                    'lat focused row': 'DeltaBolic',
                    'close grip lat pulldown': 'ThriveTraining',
                    'dumbell hammer curl': 'Scott Herman Fitness',
                    'incline dumbell curl': 'Scott Herman Fitness',
                    'wrist curl': 'Renaissance Periodization',
                    'reverse wrist curl': 'Scott Herman Fitness',
                    'incline dumbell press': 'Renaissance Periodization',
                    'flat dumbell press': 'Jeremy Ethier',
                    'pec fly machine': 'DeltaBolic',
                    'skull crushers': 'Renaissance Periodization',
                    'skull crushers ×4': 'Renaissance Periodization',
                    'cable pushdown': 'Scott Herman Fitness',
                    'cable pushdown ×4': 'Scott Herman Fitness',
                    'overhead tricep extension': 'Renaissance Periodization',
                    'crunches': 'Scott Herman Fitness',
                    'plank': 'Squat University',
                    'shoulder press': 'Scott Herman Fitness',
                    'lateral rises': 'Renaissance Periodization',
                    'face pull': 'ATHLEAN-X™',
                    'squats': 'Squat University',
                    'leg press': 'Scott Herman Fitness',
                    'leg extension': 'Jeff Nippard',
                    'hamstring curls': 'Renaissance Periodization',
                    'calves': 'Jeff Nippard',
                  };

                  const credit = (entry.videoCredit && entry.videoCredit !== 'Finalized Workout.pdf')
                    ? entry.videoCredit
                    : (EXERCISE_CREATOR_CREDITS[entry.sourceLabel?.toLowerCase().trim() || ''] ||
                       EXERCISE_CREATOR_CREDITS[entry.exerciseName?.toLowerCase().trim() || ''] ||
                       entry.sourceReference);

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-[#1a1a1a]/20 px-2 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#000000] text-xs font-mono font-bold text-[#ff2a3b] border border-[#ffffff]/10 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#ffffff]">
                              {entry.exerciseName}
                            </span>
                            {entry.muscleGroup && (
                              <span className="rounded-full bg-[#1a1a1a] border border-[#ff2a3b]/20 px-2 py-0.5 text-[10px] font-mono uppercase text-[#ff2a3b]">
                                {entry.muscleGroup}
                              </span>
                            )}
                          </div>
                          {entry.sourceLabel && entry.sourceLabel !== entry.exerciseName && (
                            <div className="text-xs font-mono text-[#a1a1aa]">
                              Source label: {entry.sourceLabel}
                            </div>
                          )}
                          {entry.sourcePrescriptionText && (
                            <div className="mt-1 text-xs leading-relaxed text-[#a1a1aa]">
                              {entry.sourcePrescriptionText}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-9 sm:pl-0 flex-wrap">
                        {/* Sets & Reps Prescriptions */}
                        {entry.sets !== null || entry.reps !== null ? (
                          <span className="rounded-lg border border-[#ffffff]/10 bg-[#000000] px-2.5 py-1 text-xs font-mono font-bold text-[#ff2a3b]">
                            {entry.sets ? `${entry.sets} sets` : ''}{' '}
                            {entry.reps ? `× ${entry.reps} reps` : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono italic text-[#71717a]">
                            Prescription unset
                          </span>
                        )}

                        {/* Video Demonstration Link */}
                        {entry.videoUrl && (
                          <a
                            href={entry.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="kinetik-btn-dark px-2.5 py-1 text-xs font-mono inline-flex items-center gap-1.5 min-h-[34px]"
                            title={`Watch tutorial video${credit && credit !== 'Finalized Workout.pdf' ? ` (${credit})` : ''}`}
                          >
                            <Play className="h-3 w-3 text-[#ff2a3b] fill-[#ff2a3b] shrink-0" />
                            <span>Video</span>
                            {credit && credit !== 'Finalized Workout.pdf' && (
                              <span className="text-[10px] text-[#a1a1aa]">
                                ({credit})
                              </span>
                            )}
                            <ExternalLink className="h-3 w-3 text-[#a1a1aa] shrink-0" />
                          </a>
                        )}

                        {/* View Progress History */}
                        <Link
                          href={`/app/workout-progress/${entry.exerciseId}`}
                          className="kinetik-btn-dark px-2.5 py-1 text-xs font-mono inline-flex items-center gap-1 min-h-[34px]"
                          title="View performance progress"
                        >
                          <TrendingUp className="h-3 w-3 text-[#ff2a3b]" />
                          <span>Progress</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Template Modal (Mobile Bottom-Sheet on small screens) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-[#a1a1aa] hover:text-[#ffffff] p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 text-[#ffffff]">
              <Layers className="h-5 w-5 text-[#ff2a3b]" />
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
                Apply Template to Personal Plan
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Apply this programme directly to your personal editable workout workspace.
            </p>

            {applyError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{applyError}</span>
              </div>
            )}

            {applySuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#ff2a3b]/50 p-3 text-xs font-semibold text-[#ff2a3b]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{applySuccess}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Target Plan Selection */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                  Target Personal Workout Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
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
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                    New Plan Name
                  </label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. My Workout Plan"
                    className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                </div>
              )}

              {/* Mode Selection (Replace vs Merge) */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                  Application Mode
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyMode('replace')}
                    className={`rounded-xl border p-3 text-left transition ${
                      applyMode === 'replace'
                        ? 'border-[#ff2a3b] bg-[#1a1a1a]'
                        : 'border-[#ffffff]/15 bg-[#000000] hover:border-[#ffffff]/30'
                    }`}
                  >
                    <span className="block text-xs font-bold uppercase text-[#ffffff]">
                      Replace
                    </span>
                    <span className="mt-1 block text-[11px] text-[#a1a1aa] leading-tight">
                      Overwrites existing days in plan with this split.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyMode('merge')}
                    className={`rounded-xl border p-3 text-left transition ${
                      applyMode === 'merge'
                        ? 'border-[#ff2a3b] bg-[#1a1a1a]'
                        : 'border-[#ffffff]/15 bg-[#000000] hover:border-[#ffffff]/30'
                    }`}
                  >
                    <span className="block text-xs font-bold uppercase text-[#ffffff]">
                      Merge
                    </span>
                    <span className="mt-1 block text-[11px] text-[#a1a1aa] leading-tight">
                      Appends template content while preserving existing days.
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#ffffff]/10 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applying || Boolean(applySuccess)}
                onClick={handleApplyTemplate}
                className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase disabled:opacity-50 min-h-[44px]"
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
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-[#a1a1aa] font-mono text-xs">
          Loading workout template...
        </div>
      }
    >
      <TemplateDetailContent params={props.params} />
    </Suspense>
  );
}
