'use client';

import { useState, useEffect, use, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExerciseInfo {
  id: string;
  name: string;
  muscleGroup: string | null;
  description: string | null;
}

interface WorkoutLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  loggedOn: string;
  setsCompleted: number | null;
  repsCompleted: number | null;
  externalLoad: number | null;
  externalLoadUnit: 'kg' | 'lbs' | null;
  isBodyweight: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function ProgressContent(props: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = use(props.params);

  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form / Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formMode, setFormMode] = useState<'load' | 'bodyweight' | 'none'>('load');
  const [formLoad, setFormLoad] = useState('');
  const [formUnit, setFormUnit] = useState<'kg' | 'lbs'>('kg');
  const [formSets, setFormSets] = useState('');
  const [formReps, setFormReps] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Display unit filter for visualization ('kg' or 'lbs')
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');

  // Load Exercise & History
  useEffect(() => {
    let unmounted = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch exercise catalogue to find this exercise
        const exRes = await fetch('/api/exercises');
        if (!exRes.ok) throw new Error('Failed to load exercise catalogue.');
        const exData = await exRes.json();
        const found = (exData.data || []).find((e: ExerciseInfo) => e.id === exerciseId);
        if (!unmounted && found) {
          setExercise(found);
        }

        // 2. Fetch workout logs for this exercise
        const logsRes = await fetch(`/api/workout-progress?exerciseId=${encodeURIComponent(exerciseId)}`);
        if (!logsRes.ok) {
          if (logsRes.status === 401) {
            throw new Error('Authentication required. Please sign in to view workout progress.');
          }
          throw new Error('Failed to retrieve progress history.');
        }
        const logsData = await logsRes.json();
        if (!unmounted) {
          setLogs(logsData.data || []);
        }
      } catch (err: unknown) {
        if (!unmounted) {
          const msg = err instanceof Error ? err.message : 'An error occurred while loading workout progress.';
          setError(msg);
        }
      } finally {
        if (!unmounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      unmounted = true;
    };
  }, [exerciseId]);

  // Open Log Modal (Create Mode)
  function handleOpenCreateModal() {
    setEditingLogId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMode('load');
    setFormLoad('');
    setFormUnit('kg');
    setFormSets('');
    setFormReps('');
    setFormNotes('');
    setFormErrors({});
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEditModal(log: WorkoutLog) {
    setEditingLogId(log.id);
    setFormDate(log.loggedOn);
    if (log.isBodyweight) {
      setFormMode('bodyweight');
      setFormLoad('');
    } else if (log.externalLoad !== null) {
      setFormMode('load');
      setFormLoad(String(log.externalLoad));
      setFormUnit(log.externalLoadUnit || 'kg');
    } else {
      setFormMode('none');
      setFormLoad('');
    }
    setFormSets(log.setsCompleted !== null ? String(log.setsCompleted) : '');
    setFormReps(log.repsCompleted !== null ? String(log.repsCompleted) : '');
    setFormNotes(log.notes || '');
    setFormErrors({});
    setIsModalOpen(true);
  }

  // Submit Log (Create or Edit)
  async function handleSubmitLog(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      let isBodyweight = false;
      let externalLoad: number | null = null;
      let externalLoadUnit: 'kg' | 'lbs' | null = null;

      if (formMode === 'bodyweight') {
        isBodyweight = true;
      } else if (formMode === 'load') {
        isBodyweight = false;
        const parsedLoad = Number(formLoad.trim());
        if (!Number.isFinite(parsedLoad) || parsedLoad <= 0) {
          setFormErrors({ externalLoad: 'External load must be a positive number greater than 0.' });
          setSubmitting(false);
          return;
        }
        externalLoad = parsedLoad;
        externalLoadUnit = formUnit;
      } else {
        isBodyweight = false;
        externalLoad = null;
        externalLoadUnit = null;
      }

      const setsCompleted = formSets.trim() ? Number(formSets.trim()) : null;
      const repsCompleted = formReps.trim() ? Number(formReps.trim()) : null;
      const notes = formNotes.trim() ? formNotes.trim() : null;

      const payload = {
        exerciseId,
        loggedOn: formDate,
        setsCompleted,
        repsCompleted,
        externalLoad,
        externalLoadUnit,
        isBodyweight,
        notes,
      };

      const url = editingLogId
        ? `/api/workout-progress/${editingLogId}`
        : '/api/workout-progress';
      const method = editingLogId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fieldErrors) {
          setFormErrors(data.error.fieldErrors);
        } else {
          setFormErrors({ form: data.error?.message || 'Failed to save workout log.' });
        }
        setSubmitting(false);
        return;
      }

      // Update state
      if (editingLogId) {
        setLogs((prev) =>
          prev
            .map((item) => (item.id === editingLogId ? data.data : item))
            .sort((a, b) => a.loggedOn.localeCompare(b.loggedOn))
        );
        setActionSuccess('Workout log updated successfully.');
      } else {
        setLogs((prev) =>
          [...prev, data.data].sort((a, b) => a.loggedOn.localeCompare(b.loggedOn))
        );
        setActionSuccess('Workout log recorded successfully.');
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      setFormErrors({ form: 'An unexpected network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Delete Log
  async function handleDeleteLog(logId: string) {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/workout-progress/${logId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete workout log.');
      }

      setLogs((prev) => prev.filter((item) => item.id !== logId));
      setDeleteConfirmId(null);
      setActionSuccess('Workout log deleted.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete log.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    if (logs.length === 0) return null;

    const totalSessions = logs.length;
    const latest = logs[logs.length - 1];

    // Find personal best external load normalized to displayUnit
    let maxLoad: { value: number; unit: string; date: string } | null = null;
    for (const log of logs) {
      if (log.externalLoad !== null && log.externalLoadUnit) {
        const valInDisplay =
          log.externalLoadUnit === displayUnit
            ? log.externalLoad
            : displayUnit === 'kg'
            ? log.externalLoad * 0.45359237
            : log.externalLoad / 0.45359237;

        if (!maxLoad || valInDisplay > maxLoad.value) {
          maxLoad = {
            value: Math.round(valInDisplay * 10) / 10,
            unit: displayUnit,
            date: log.loggedOn,
          };
        }
      }
    }

    return { totalSessions, latest, maxLoad };
  }, [logs, displayUnit]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return logs.map((log) => {
      let numericLoad: number | null = null;
      if (log.externalLoad !== null && log.externalLoadUnit) {
        numericLoad =
          log.externalLoadUnit === displayUnit
            ? log.externalLoad
            : displayUnit === 'kg'
            ? Math.round(log.externalLoad * 0.45359237 * 10) / 10
            : Math.round((log.externalLoad / 0.45359237) * 10) / 10;
      }
      return {
        id: log.id,
        date: log.loggedOn,
        load: numericLoad,
        isBodyweight: log.isBodyweight,
        sets: log.setsCompleted,
        reps: log.repsCompleted,
        notes: log.notes,
      };
    });
  }, [logs, displayUnit]);

  // SVG Chart Dimensions & Coordinates
  const chartSvg = useMemo(() => {
    const loadPoints = chartData.filter((d) => d.load !== null);
    if (loadPoints.length < 2) return null;

    const width = 600;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 40, left: 45 };

    const loads = loadPoints.map((d) => d.load as number);
    const minLoad = Math.max(0, Math.min(...loads) - 5);
    const maxLoad = Math.max(...loads) + 5;
    const loadRange = maxLoad - minLoad || 1;

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const points = chartData.map((d, index) => {
      const x = padding.left + (index / (chartData.length - 1 || 1)) * plotWidth;
      const y =
        d.load !== null
          ? padding.top + plotHeight - ((d.load - minLoad) / loadRange) * plotHeight
          : null;
      return { ...d, x, y };
    });

    // Build SVG path string for connected load points
    const validCoords = points.filter((p) => p.y !== null);
    const linePath = validCoords.reduce((acc, curr, idx) => {
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y!.toFixed(1)}`;
    }, '');

    return { width, height, padding, minLoad, maxLoad, points, linePath };
  }, [chartData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] px-4 py-8 text-[#ffffff] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-6 w-48 animate-pulse rounded bg-[#0d0d0d]" />
          <div className="h-10 w-72 animate-pulse rounded bg-[#0d0d0d]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 animate-pulse rounded-2xl bg-[#0d0d0d] border border-[#ffffff]/10" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#0d0d0d] border border-[#ffffff]/10" />
            <div className="h-24 animate-pulse rounded-2xl bg-[#0d0d0d] border border-[#ffffff]/10" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-[#0d0d0d] border border-[#ffffff]/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000] px-4 py-8 text-[#ffffff] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/30 bg-red-950/30 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-red-200">Unable to Load Workout Progress</h2>
          <p className="mt-2 text-xs sm:text-sm font-mono text-red-300/80">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/app/workout-plans"
              className="kinetik-btn-dark px-4 py-2 text-xs font-mono font-bold"
            >
              Browse Workouts
            </Link>
            <Link
              href="/app/my-workout-plan"
              className="kinetik-btn-lime px-4 py-2 text-xs font-extrabold uppercase"
            >
              My Workout Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] px-4 py-8 text-[#ffffff] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ffffff]/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
            <Link href="/app/workout-plans" className="transition hover:text-[#ff2a3b]">
              Workouts
            </Link>
            <span>/</span>
            <Link href="/app/my-workout-plan" className="transition hover:text-[#ff2a3b]">
              My Plan
            </Link>
            <span>/</span>
            <span className="text-[#ffffff] font-bold">Exercise Progress</span>
          </div>

          <Link
            href="/app/my-workout-plan"
            className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-2 min-h-[38px]"
          >
            <ArrowLeft className="h-4 w-4" /> <span>Back to My Plan</span>
          </Link>
        </div>

        {/* Exercise Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[#ff2a3b]/30 bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-mono font-bold uppercase text-[#ff2a3b]">
                {exercise?.muscleGroup || 'Exercise'}
              </span>
              <span className="text-xs font-mono text-[#a1a1aa]">Independent Performance History</span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#ffffff]">
              {exercise?.name || 'Exercise Progress'}
            </h1>
            {exercise?.description && (
              <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa] max-w-2xl">{exercise.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="kinetik-btn-lime px-5 py-2.5 text-xs font-extrabold uppercase inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> <span>Log Performance</span>
          </button>
        </div>

        {/* Notification Toast */}
        {actionSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-[#ff2a3b]/40 bg-[#1a1a1a] px-4 py-3 text-xs sm:text-sm text-[#ff2a3b] shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-[#ff2a3b] shrink-0" />
            <span className="font-mono font-bold">{actionSuccess}</span>
          </div>
        )}

        {/* Performance Summary Cards */}
        {summaryMetrics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="kinetik-card p-5">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Recorded</span>
                <Activity className="h-4 w-4 text-[#ff2a3b]" />
              </div>
              <div className="mt-2 font-display text-3xl font-black text-[#ffffff]">
                {summaryMetrics.totalSessions}{' '}
                <span className="text-xs font-mono font-normal text-[#a1a1aa]">sessions</span>
              </div>
              <p className="mt-1 text-xs font-mono text-[#71717a]">Across recorded workout dates</p>
            </div>

            <div className="kinetik-card p-5">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Latest Session</span>
                <Calendar className="h-4 w-4 text-[#ff2a3b]" />
              </div>
              <div className="mt-2 font-display text-2xl font-black text-[#ffffff]">
                {summaryMetrics.latest.isBodyweight
                  ? 'Bodyweight'
                  : summaryMetrics.latest.externalLoad !== null
                  ? `${summaryMetrics.latest.externalLoad} ${summaryMetrics.latest.externalLoadUnit}`
                  : 'No load recorded'}
              </div>
              <p className="mt-1 text-xs font-mono text-[#a1a1aa]">
                {summaryMetrics.latest.loggedOn}
                {summaryMetrics.latest.setsCompleted !== null &&
                  summaryMetrics.latest.repsCompleted !== null &&
                  ` • ${summaryMetrics.latest.setsCompleted}s × ${summaryMetrics.latest.repsCompleted}r`}
              </p>
            </div>

            <div className="kinetik-card p-5">
              <div className="flex items-center justify-between text-[#a1a1aa]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Personal Best Load</span>
                <TrendingUp className="h-4 w-4 text-[#ff2a3b]" />
              </div>
              <div className="mt-2 font-display text-2xl font-black text-[#ff2a3b]">
                {summaryMetrics.maxLoad
                  ? `${summaryMetrics.maxLoad.value} ${summaryMetrics.maxLoad.unit}`
                  : 'N/A'}
              </div>
              <p className="mt-1 text-xs font-mono text-[#a1a1aa]">
                {summaryMetrics.maxLoad
                  ? `Achieved on ${summaryMetrics.maxLoad.date}`
                  : 'Bodyweight or no load sessions'}
              </p>
            </div>
          </div>
        )}

        {/* Progress Visualization Section */}
        <div className="kinetik-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ffffff]/10 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#ff2a3b]" /> <span>Progression Trend</span>
              </h2>
              <p className="text-xs font-mono text-[#a1a1aa] mt-0.5">
                Plots real historical sessions chronologically. Bodyweight entries are explicitly marked.
              </p>
            </div>

            {/* Unit Toggle */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#ffffff]/15 bg-[#000000] p-1 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setDisplayUnit('kg')}
                className={`rounded-lg px-3 py-1 transition ${
                  displayUnit === 'kg'
                    ? 'bg-[#ff2a3b] text-white'
                    : 'text-[#a1a1aa] hover:text-[#ffffff]'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                onClick={() => setDisplayUnit('lbs')}
                className={`rounded-lg px-3 py-1 transition ${
                  displayUnit === 'lbs'
                    ? 'bg-[#ff2a3b] text-white'
                    : 'text-[#a1a1aa] hover:text-[#ffffff]'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          {/* Chart Content Area */}
          <div className="mt-6">
            {logs.length === 0 ? (
              <div className="py-12 text-center">
                <Dumbbell className="mx-auto h-12 w-12 text-[#ff2a3b]/40 mb-3" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#ffffff]">No workout logs recorded yet</h3>
                <p className="mt-1 text-xs text-[#a1a1aa] max-w-sm mx-auto">
                  Start logging your sets, reps, and external load or bodyweight workouts to track progression over time.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="mt-4 kinetik-btn-lime px-4 py-2 text-xs font-extrabold uppercase inline-flex items-center gap-2 min-h-[44px]"
                >
                  <Plus className="h-4 w-4" /> <span>Record First Log</span>
                </button>
              </div>
            ) : logs.length === 1 ? (
              <div className="rounded-2xl border border-[#ff2a3b]/20 bg-[#000000] p-8 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-[#ff2a3b] mb-2" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#ffffff]">Baseline Session Established</h3>
                <p className="mt-1 text-xs text-[#a1a1aa] max-w-md mx-auto">
                  One workout logged on {logs[0].loggedOn}. Record at least two sessions to visualize a continuous progress line.
                </p>
                <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-[#ffffff]/10 bg-[#0d0d0d] px-4 py-2 text-xs font-mono text-[#ffffff]">
                  <span>
                    Performance:{' '}
                    <strong className="text-[#ff2a3b]">
                      {logs[0].isBodyweight
                        ? 'Bodyweight'
                        : logs[0].externalLoad !== null
                        ? `${logs[0].externalLoad} ${logs[0].externalLoadUnit}`
                        : 'No external load'}
                    </strong>
                  </span>
                  {logs[0].setsCompleted !== null && (
                    <span className="text-[#a1a1aa]">• {logs[0].setsCompleted} sets</span>
                  )}
                  {logs[0].repsCompleted !== null && (
                    <span className="text-[#a1a1aa]">• {logs[0].repsCompleted} reps</span>
                  )}
                </div>
              </div>
            ) : chartSvg ? (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartSvg.width} ${chartSvg.height}`}
                  className="w-full h-auto min-w-[500px]"
                  role="img"
                  aria-label={`Workout progress chart for ${exercise?.name || 'exercise'}`}
                >
                  {/* Grid Lines */}
                  <line
                    x1={chartSvg.padding.left}
                    y1={chartSvg.padding.top}
                    x2={chartSvg.width - chartSvg.padding.right}
                    y2={chartSvg.padding.top}
                    stroke="rgba(244, 246, 238, 0.1)"
                    strokeDasharray="4"
                    strokeWidth="1"
                  />
                  <line
                    x1={chartSvg.padding.left}
                    y1={chartSvg.height - chartSvg.padding.bottom}
                    x2={chartSvg.width - chartSvg.padding.right}
                    y2={chartSvg.height - chartSvg.padding.bottom}
                    stroke="rgba(244, 246, 238, 0.1)"
                    strokeWidth="1"
                  />

                  {/* Y Axis Labels */}
                  <text
                    x={chartSvg.padding.left - 8}
                    y={chartSvg.padding.top + 4}
                    fill="#a1a1aa"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {Math.round(chartSvg.maxLoad)} {displayUnit}
                  </text>
                  <text
                    x={chartSvg.padding.left - 8}
                    y={chartSvg.height - chartSvg.padding.bottom}
                    fill="#a1a1aa"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {Math.round(chartSvg.minLoad)} {displayUnit}
                  </text>

                  {/* Trend Path */}
                  <path
                    d={chartSvg.linePath}
                    fill="none"
                    stroke="#ff2a3b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {chartSvg.points.map((p) => {
                    if (p.y !== null) {
                      return (
                        <g key={p.id}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#ff2a3b"
                            stroke="#000000"
                            strokeWidth="2"
                            className="cursor-pointer transition hover:r-7"
                          >
                            <title>
                              {`${p.date}: ${p.load} ${displayUnit}${
                                p.sets ? ` (${p.sets} sets × ${p.reps || 0} reps)` : ''
                              }`}
                            </title>
                          </circle>
                          {/* Date Label on X Axis */}
                          <text
                            x={p.x}
                            y={chartSvg.height - chartSvg.padding.bottom + 16}
                            fill="#a1a1aa"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {p.date.slice(5)}
                          </text>
                        </g>
                      );
                    } else if (p.isBodyweight) {
                      const baseY = chartSvg.height - chartSvg.padding.bottom - 10;
                      return (
                        <g key={p.id}>
                          <polygon
                            points={`${p.x},${baseY - 5} ${p.x + 5},${baseY} ${p.x},${baseY + 5} ${p.x - 5},${baseY}`}
                            fill="#a1a1aa"
                            stroke="#000000"
                            strokeWidth="1.5"
                          >
                            <title>{`${p.date}: Bodyweight session`}</title>
                          </polygon>
                          <text
                            x={p.x}
                            y={chartSvg.height - chartSvg.padding.bottom + 16}
                            fill="#71717a"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            BW
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            ) : (
              <div className="p-6 text-center text-xs font-mono text-[#a1a1aa]">
                Historical records consist primarily of bodyweight or unweighted entries. View full details in the table below.
              </div>
            )}
          </div>
        </div>

        {/* History Data Table Section */}
        <div className="kinetik-card p-6">
          <div className="flex items-center justify-between border-b border-[#ffffff]/10 pb-4">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff] flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#ff2a3b]" /> <span>Detailed Session History</span>
              </h2>
              <p className="text-xs font-mono text-[#a1a1aa] mt-0.5">
                Chronological list of all performance entries.
              </p>
            </div>
            <span className="text-xs font-mono text-[#a1a1aa] bg-[#000000] px-2.5 py-1 rounded-lg border border-[#ffffff]/10">
              {logs.length} entries
            </span>
          </div>

          {logs.length === 0 ? (
            <p className="py-8 text-center text-xs font-mono text-[#71717a]">No session history to display.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono text-[#ffffff]">
                <thead className="border-b border-[#ffffff]/10 bg-[#000000] text-[#a1a1aa] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="py-3 px-4">Date</th>
                    <th scope="col" className="py-3 px-4">Type</th>
                    <th scope="col" className="py-3 px-4">Load</th>
                    <th scope="col" className="py-3 px-4">Sets × Reps</th>
                    <th scope="col" className="py-3 px-4">Notes</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ffffff]/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-[#1a1a1a]/20">
                      <td className="py-3 px-4 font-bold text-[#ffffff]">{log.loggedOn}</td>
                      <td className="py-3 px-4">
                        {log.isBodyweight ? (
                          <span className="rounded-md border border-[#ffffff]/10 bg-[#000000] px-2 py-0.5 text-[#a1a1aa]">
                            Bodyweight
                          </span>
                        ) : log.externalLoad !== null ? (
                          <span className="rounded-md border border-[#ff2a3b]/30 bg-[#1a1a1a] text-[#ff2a3b] font-bold px-2 py-0.5">
                            External Load
                          </span>
                        ) : (
                          <span className="rounded-md border border-[#ffffff]/10 bg-[#000000] px-2 py-0.5 text-[#71717a]">
                            No Load
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#ff2a3b]">
                        {log.externalLoad !== null
                          ? `${log.externalLoad} ${log.externalLoadUnit}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-[#ffffff]">
                        {log.setsCompleted !== null || log.repsCompleted !== null ? (
                          <span>
                            {log.setsCompleted !== null ? `${log.setsCompleted} sets` : '—'} ×{' '}
                            {log.repsCompleted !== null ? `${log.repsCompleted} reps` : '—'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#a1a1aa] max-w-xs truncate">
                        {log.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(log)}
                          className="rounded-lg p-1.5 text-[#a1a1aa] hover:text-[#ff2a3b] hover:bg-[#000000] transition"
                          title="Edit log"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(log.id)}
                          className="rounded-lg p-1.5 text-[#a1a1aa] hover:text-red-400 hover:bg-[#000000] transition"
                          title="Delete log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Log Workout (Bottom-sheet on mobile) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
              <div className="flex items-center justify-between border-b border-[#ffffff]/10 pb-3">
                <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
                  {editingLogId ? 'Edit Workout Session' : 'Record Workout Session'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-[#a1a1aa] hover:text-[#ffffff]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitLog} className="mt-4 space-y-4">
                {formErrors.form && (
                  <div className="rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs font-mono text-red-300">
                    {formErrors.form}
                  </div>
                )}

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                    Workout Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                  {formErrors.loggedOn && (
                    <p className="mt-1 text-xs font-mono text-red-400">{formErrors.loggedOn}</p>
                  )}
                </div>

                {/* Resistance Mode Selector */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">Load Classification</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormMode('load')}
                      className={`rounded-xl py-2 px-3 text-xs font-mono font-bold uppercase border transition min-h-[44px] ${
                        formMode === 'load'
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] text-[#ff2a3b]'
                          : 'border-[#ffffff]/15 bg-[#000000] text-[#a1a1aa] hover:border-[#ffffff]/30'
                      }`}
                    >
                      External Load
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMode('bodyweight')}
                      className={`rounded-xl py-2 px-3 text-xs font-mono font-bold uppercase border transition min-h-[44px] ${
                        formMode === 'bodyweight'
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] text-[#ff2a3b]'
                          : 'border-[#ffffff]/15 bg-[#000000] text-[#a1a1aa] hover:border-[#ffffff]/30'
                      }`}
                    >
                      Bodyweight
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMode('none')}
                      className={`rounded-xl py-2 px-3 text-xs font-mono font-bold uppercase border transition min-h-[44px] ${
                        formMode === 'none'
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] text-[#ff2a3b]'
                          : 'border-[#ffffff]/15 bg-[#000000] text-[#a1a1aa] hover:border-[#ffffff]/30'
                      }`}
                    >
                      No Load
                    </button>
                  </div>
                </div>

                {/* External Load & Unit Inputs (Conditional) */}
                {formMode === 'load' && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                        Weight / Load
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        placeholder="e.g. 25"
                        value={formLoad}
                        onChange={(e) => setFormLoad(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                      />
                      {formErrors.externalLoad && (
                        <p className="mt-1 text-xs font-mono text-red-400">{formErrors.externalLoad}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">Unit</label>
                      <select
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value as 'kg' | 'lbs')}
                        className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                      {formErrors.externalLoadUnit && (
                        <p className="mt-1 text-xs font-mono text-red-400">{formErrors.externalLoadUnit}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sets & Reps Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Completed Sets (1–20)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Optional"
                      value={formSets}
                      onChange={(e) => setFormSets(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                    />
                    {formErrors.setsCompleted && (
                      <p className="mt-1 text-xs font-mono text-red-400">{formErrors.setsCompleted}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Completed Reps (1–200)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      placeholder="Optional"
                      value={formReps}
                      onChange={(e) => setFormReps(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                    />
                    {formErrors.repsCompleted && (
                      <p className="mt-1 text-xs font-mono text-red-400">{formErrors.repsCompleted}</p>
                    )}
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                    Session Notes (max 500 chars)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Optional form notes, RPE, or tempo..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none"
                  />
                  {formErrors.notes && (
                    <p className="mt-1 text-xs font-mono text-red-400">{formErrors.notes}</p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-3 border-t border-[#ffffff]/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase disabled:opacity-50 min-h-[44px]"
                  >
                    {submitting ? 'Saving...' : editingLogId ? 'Save Changes' : 'Record Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Delete */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl border border-red-500/30 bg-[#0d0d0d] p-6 shadow-2xl text-center">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
              <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-2" />
              <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">Delete Workout Record?</h3>
              <p className="mt-2 text-xs font-mono text-[#a1a1aa]">
                Are you sure you want to permanently delete this workout log? This action cannot be undone.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDeleteLog(deleteConfirmId)}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-mono font-bold text-white hover:bg-red-700 active:scale-95 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkoutProgressPage(props: {
  params: Promise<{ exerciseId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-[#a1a1aa] font-mono text-xs">
          Loading workout progress...
        </div>
      }
    >
      <ProgressContent params={props.params} />
    </Suspense>
  );
}
