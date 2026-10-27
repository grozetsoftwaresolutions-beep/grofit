'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  Flame,
  Award,
  Check,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Archive,
  RotateCcw,
  History,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  Loader2,
  Trash2,
} from 'lucide-react';
import { addDays } from '@/lib/habits/domain';

interface HabitItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HabitReportMonthly {
  month: string;
  label: string;
  completed: number;
}

interface HabitReportItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  monthlyBreakdown: HabitReportMonthly[];
  completedDates: string[];
}

interface HabitReportSummary {
  totalHabits: number;
  activeHabits: number;
  totalCompletions: number;
  averageConsistency: number;
  topHabit: {
    id: string;
    name: string;
    completionRate: number;
    completedDays: number;
  } | null;
  needsAttentionHabit: {
    id: string;
    name: string;
    completionRate: number;
    completedDays: number;
  } | null;
}

interface HabitReportData {
  clientName: string;
  period: string;
  rangeKey: string;
  from: string;
  to: string;
  totalDays: number;
  summary: HabitReportSummary;
  habits: HabitReportItem[];
}

interface HabitLogRecord {
  id: string;
  habitId: string;
  completedOn: string;
  createdAt: string;
}

function HabitTrackerContent() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User timezone & local dates (initialized safely on mount)
  const [userToday, setUserToday] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Completions on the selected date: Set of habit IDs
  const [selectedDateCompletions, setSelectedDateCompletions] = useState<Set<string>>(new Set());

  // Tab: 'active' | 'archived'
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [historyHabit, setHistoryHabit] = useState<HabitItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HabitLogRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Habit Performance Report State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportRange, setReportRange] = useState<'1m' | '3m' | '6m' | '1y'>('1m');
  const [reportData, setReportData] = useState<HabitReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Habit Deletion State
  const [deletingHabit, setDeletingHabit] = useState<HabitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteHabit(habitId: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to delete habit.');
      }
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setSelectedDateCompletions((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      setDeletingHabit(null);
      if (editingHabit?.id === habitId) {
        setEditingHabit(null);
      }
      setActionNotice('Habit deleted permanently.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting habit.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  }

  async function loadReport(range: '1m' | '3m' | '6m' | '1y') {
    setReportRange(range);
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch(`/api/habits/report?range=${range}`);
      if (!res.ok) {
        throw new Error('Failed to generate habit report.');
      }
      const json = await res.json();
      setReportData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating habit report.';
      setReportError(msg);
    } finally {
      setReportLoading(false);
    }
  }

  function handleOpenReport(range: '1m' | '3m' | '6m' | '1y' = reportRange) {
    setReportModalOpen(true);
    void loadReport(range);
  }

  function handleDownloadCSV() {
    if (!reportData) return;
    const headers = [
      'Habit Name',
      'Status',
      'Completed Days',
      'Total Days in Period',
      'Consistency (%)',
      'Current Streak (Days)',
      'Best Streak (Days)',
    ];

    const rows = reportData.habits.map((h) => [
      `"${h.name.replace(/"/g, '""')}"`,
      h.isActive ? 'Active' : 'Archived',
      h.completedDays,
      h.totalDays,
      `${h.completionRate}%`,
      h.currentStreak,
      h.bestStreak,
    ]);

    const csvContent = [
      `"Habit Performance Report - ${reportData.period}"`,
      `"Client: ${reportData.clientName}"`,
      `"Date Range: ${reportData.from} to ${reportData.to} (${reportData.totalDays} Days)"`,
      `"Average Consistency: ${reportData.summary.averageConsistency}%"`,
      `"Total Check-ins: ${reportData.summary.totalCompletions}"`,
      '',
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `habit-report-${reportRange}-${reportData.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handlePrintReport() {
    window.print();
  }

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Fetch habits on mount
  useEffect(() => {
    let unmounted = false;

    async function fetchHabits() {
      try {
        setError(null);
        const res = await fetch('/api/habits?includeArchived=true');
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Authentication required. Please sign in to track habits.');
          }
          throw new Error('Failed to retrieve habits.');
        }

        const json = await res.json();
        if (!unmounted) {
          const list: HabitItem[] = json.data || [];
          setHabits(list);
          const resolvedToday = json.meta?.today || new Date().toISOString().split('T')[0];
          setUserToday(resolvedToday);
          setSelectedDate((prev) => prev || resolvedToday);
        }
      } catch (err: unknown) {
        if (!unmounted) {
          const msg = err instanceof Error ? err.message : 'An error occurred while loading habits.';
          setError(msg);
          const fallbackToday = new Date().toISOString().split('T')[0];
          setUserToday(fallbackToday);
          setSelectedDate((prev) => prev || fallbackToday);
        }
      } finally {
        if (!unmounted) {
          setLoading(false);
        }
      }
    }

    void fetchHabits();

    return () => {
      unmounted = true;
    };
  }, [reloadTrigger]);

  // Fetch completions for the selected date across habits
  useEffect(() => {
    if (!selectedDate || habits.length === 0) return;

    let unmounted = false;

    async function fetchDateCompletions() {
      try {
        const promises = habits.map(async (h) => {
          try {
            const res = await fetch(`/api/habits/${h.id}/logs?from=${selectedDate}&to=${selectedDate}`);
            if (res.ok) {
              const json = await res.json();
              return (json.data && json.data.length > 0) ? h.id : null;
            }
          } catch {
            // ignore individual log fetch error
          }
          return null;
        });

        const results = await Promise.all(promises);
        if (!unmounted) {
          const completedIds = new Set<string>();
          for (const id of results) {
            if (id) completedIds.add(id);
          }
          setSelectedDateCompletions(completedIds);
        }
      } catch {
        // ignore
      }
    }

    void fetchDateCompletions();

    return () => {
      unmounted = true;
    };
  }, [selectedDate, habits]);

  // Active & Archived lists
  const activeHabits = useMemo(() => habits.filter((h) => h.isActive), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => !h.isActive), [habits]);

  // Completion stats for selected date
  const completedCount = useMemo(() => {
    return activeHabits.filter((h) => selectedDateCompletions.has(h.id)).length;
  }, [activeHabits, selectedDateCompletions]);

  const completionPercentage = activeHabits.length > 0
    ? Math.round((completedCount / activeHabits.length) * 100)
    : 0;

  // Toggle Completion
  async function handleToggleCompletion(habitId: string) {
    const isCompleted = selectedDateCompletions.has(habitId);
    const method = isCompleted ? 'DELETE' : 'PUT';

    // Optimistic state update
    setSelectedDateCompletions((prev) => {
      const next = new Set(prev);
      if (isCompleted) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });

    try {
      const res = await fetch(`/api/habits/${habitId}/logs/${selectedDate}`, { method });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to update habit completion.');
      }

      // Reload habits to refresh streaks
      const reloadRes = await fetch('/api/habits?includeArchived=true');
      if (reloadRes.ok) {
        const json = await reloadRes.json();
        setHabits(json.data || []);
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setSelectedDateCompletions((prev) => {
        const next = new Set(prev);
        if (isCompleted) {
          next.add(habitId);
        } else {
          next.delete(habitId);
        }
        return next;
      });
      const msg = err instanceof Error ? err.message : 'Error updating completion.';
      alert(msg);
    }
  }

  // Create Habit
  async function handleCreateHabit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription.trim() ? formDescription.trim() : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error?.fieldErrors) {
          setFormErrors(json.error.fieldErrors);
        } else {
          setFormErrors({ form: json.error?.message || 'Failed to create habit.' });
        }
        setSubmitting(false);
        return;
      }

      setHabits((prev) => [...prev, json.data]);
      setCreateModalOpen(false);
      setFormName('');
      setFormDescription('');
      setActionNotice('Habit created successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setFormErrors({ form: 'An unexpected network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Edit Habit
  async function handleEditHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingHabit) return;

    setFormErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription.trim() ? formDescription.trim() : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error?.fieldErrors) {
          setFormErrors(json.error.fieldErrors);
        } else {
          setFormErrors({ form: json.error?.message || 'Failed to update habit.' });
        }
        setSubmitting(false);
        return;
      }

      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? { ...h, name: json.data.name, description: json.data.description }
            : h
        )
      );
      setEditingHabit(null);
      setActionNotice('Habit updated.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setFormErrors({ form: 'An unexpected network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Archive or Unarchive Habit
  async function handleToggleArchive(habit: HabitItem) {
    const newActiveState = !habit.isActive;
    const actionLabel = newActiveState ? 'reactivated' : 'archived';

    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || `Failed to ${actionLabel} habit.`);
      }

      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, isActive: newActiveState } : h))
      );

      setActionNotice(`Habit ${actionLabel} successfully.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed.';
      alert(msg);
    }
  }

  // View Habit History
  async function handleOpenHistory(habit: HabitItem) {
    setHistoryHabit(habit);
    setHistoryLoading(true);
    setHistoryLogs([]);

    try {
      const res = await fetch(`/api/habits/${habit.id}/logs`);
      if (res.ok) {
        const json = await res.json();
        setHistoryLogs(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  // Date Formatting Helper
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate || !userToday) return '';
    if (selectedDate === userToday) return 'Today';
    if (selectedDate === addDays(userToday, -1)) return 'Yesterday';
    if (selectedDate === addDays(userToday, 1)) return 'Tomorrow';
    return selectedDate;
  }, [selectedDate, userToday]);

  if ((loading || !selectedDate) && habits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#0d0d0d] border border-[#1b3d27]" />
        <div className="h-16 w-full animate-pulse rounded-2xl border border-[#1b3d27] bg-[#0d0d0d]/60" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
          <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
          <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="kinetik-card mx-auto max-w-md rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 text-center text-[#ffffff]">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-400 mb-4" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-rose-200">Unable to Load Habit Tracker</h2>
          <p className="mt-2 text-sm text-rose-300/80">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadTrigger((prev) => prev + 1);
            }}
            className="kinetik-btn-lime mt-6 px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1b3d27]/70 pb-6">
        <div>
          <div className="eyebrow flex items-center gap-2 text-xs">
            <Sparkles className="h-4 w-4 text-[#ff2a3b]" /> DISCIPLINE &amp; MOMENTUM
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#ffffff]">HABIT ARCHITECTURE</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#ffffff]/60 max-w-lg font-light">
            Track daily training protocols, build momentum, and review continuous streaks in your local timezone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenReport(reportRange)}
            className="kinetik-btn-dark inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <BarChart3 className="h-4 w-4 text-[#ff2a3b]" /> Habit Reports
          </button>

          <button
            type="button"
            onClick={() => {
              setFormName('');
              setFormDescription('');
              setFormErrors({});
              setCreateModalOpen(true);
            }}
            className="kinetik-btn-lime inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" /> New Habit
          </button>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className="flex items-center gap-3 rounded-xl border border-[#ff2a3b]/40 bg-[#1a1a1a] px-4 py-3 text-xs text-[#ffffff] shadow-lg animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#ff2a3b] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Date Navigator Bar */}
      <div className="kinetik-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="rounded-lg p-2 text-[#ffffff]/60 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Previous Day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#ff2a3b]" />
              <span className="font-display text-base font-bold uppercase tracking-wide text-[#ffffff]">{formattedSelectedDate}</span>
              <span className="text-xs font-mono text-[#ffffff]/50">({selectedDate})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-lg p-2 text-[#ffffff]/60 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Next Day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {selectedDate !== userToday && (
          <button
            type="button"
            onClick={() => setSelectedDate(userToday)}
            className="kinetik-btn-dark px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Daily Completion Progress Summary */}
      {activeHabits.length > 0 && (
        <div className="kinetik-card rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="eyebrow text-xs text-[#ff2a3b]">
              DAILY COMPLETION: {completedCount} OF {activeHabits.length} HABITS LOGGED
            </span>
            <span className="font-display text-base font-bold text-[#ff2a3b]">{completionPercentage}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#000000] border border-[#1b3d27]">
            <div
              className="h-full bg-[#ff2a3b] transition-all duration-300 shadow-[0_0_10px_rgba(255, 42, 59, 0.3)]"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs: Active vs Archived */}
      <div className="flex items-center gap-4 border-b border-[#1b3d27]/70 text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'active'
              ? 'border-[#ff2a3b] text-[#ff2a3b]'
              : 'border-transparent text-[#ffffff]/50 hover:text-[#ffffff]'
          }`}
        >
          Active Habits ({activeHabits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          className={`pb-3 border-b-2 transition ${
            activeTab === 'archived'
              ? 'border-[#ff2a3b] text-[#ff2a3b]'
              : 'border-transparent text-[#ffffff]/50 hover:text-[#ffffff]'
          }`}
        >
          Archived ({archivedHabits.length})
        </button>
      </div>

      {/* Active Habits List */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {activeHabits.length === 0 ? (
            <div className="kinetik-card rounded-2xl border border-[#1b3d27]/70 bg-[#0d0d0d]/50 p-12 text-center shadow-sm">
              <Sparkles className="mx-auto h-12 w-12 text-[#ff2a3b] mb-3 opacity-70" />
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">No active habits yet</h3>
              <p className="mt-1 text-xs text-[#ffffff]/60 max-w-sm mx-auto">
                Add habits like drinking water, post-workout stretching, or daily walking to build long-term athletic discipline.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormName('');
                  setFormDescription('');
                  setFormErrors({});
                  setCreateModalOpen(true);
                }}
                className="kinetik-btn-lime mt-5 px-4 py-2 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" /> Create First Habit
              </button>
            </div>
          ) : (
            activeHabits.map((habit) => {
              const isCompleted = selectedDateCompletions.has(habit.id);

              return (
                <div
                  key={habit.id}
                  className={`kinetik-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border p-4 transition-all ${
                    isCompleted
                      ? 'border-[#1b3d27]/40 bg-[#000000]/60 opacity-80'
                      : 'border-[#1b3d27]/70 bg-[#0d0d0d]/70 hover:border-[#ff2a3b]/50'
                  }`}
                >
                  {/* Left: Habit Details */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-bold transition ${
                        isCompleted ? 'text-[#ffffff]/50 line-through' : 'text-[#ffffff]'
                      }`}
                    >
                      {habit.name}
                    </h3>
                    {habit.description && (
                      <p className="mt-0.5 text-xs text-[#ffffff]/60 max-w-md">
                        {habit.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Streaks, Actions & Completion Tick */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Current Streak */}
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ff2a3b]/30 bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-mono font-bold text-[#ff2a3b]">
                      <Flame className="h-3.5 w-3.5 text-[#ff2a3b]" />
                      <span>{habit.currentStreak} d</span>
                    </span>

                    {/* Best Streak */}
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-[#1b3d27] bg-[#000000] px-2.5 py-0.5 text-xs font-mono text-[#ffffff]/60"
                      title="Best Streak"
                    >
                      <Award className="h-3.5 w-3.5 text-[#ffffff]/40" />
                      <span>Best: {habit.bestStreak}</span>
                    </span>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 border-l border-[#1b3d27] pl-2">
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(habit)}
                        className="rounded p-1 text-[#ffffff]/50 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition"
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingHabit(habit);
                          setFormName(habit.name);
                          setFormDescription(habit.description || '');
                          setFormErrors({});
                        }}
                        className="rounded p-1 text-[#ffffff]/50 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition"
                        title="Edit Habit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleArchive(habit)}
                        className="rounded p-1 text-[#ffffff]/50 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition"
                        title="Archive Habit"
                      >
                        <Archive className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingHabit(habit)}
                        className="rounded p-1 text-[#ffffff]/50 hover:text-rose-400 hover:bg-[#000000] transition"
                        title="Delete Habit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Completion Tick on the Right */}
                    <div className="border-l border-[#1b3d27] pl-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompletion(habit.id)}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                          isCompleted
                            ? 'border-[#ff2a3b] bg-[#ff2a3b] text-white shadow-[0_0_12px_rgba(255, 42, 59, 0.3)]'
                            : 'border-[#1b3d27] bg-[#000000] text-transparent hover:border-[#ff2a3b]/60'
                        }`}
                        title={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Archived Habits List */}
      {activeTab === 'archived' && (
        <div className="space-y-3">
          <div className="kinetik-card rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50 p-4 text-xs text-[#ffffff]/70">
            Archived habits preserve their full history and streaks. They can be reactivated anytime.
          </div>

          {archivedHabits.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#ffffff]/50">No archived habits.</p>
          ) : (
            archivedHabits.map((habit) => (
              <div
                key={habit.id}
                className="kinetik-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/70 p-4 shadow-sm opacity-75"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#ffffff]">{habit.name}</h3>
                  {habit.description && (
                    <p className="mt-0.5 text-xs text-[#ffffff]/60">{habit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#ffffff]/60">
                    Best Streak: <strong className="text-[#ff2a3b]">{habit.bestStreak} days</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenHistory(habit)}
                    className="rounded p-1.5 text-[#ffffff]/50 hover:text-[#ff2a3b] hover:bg-[#1a1a1a] transition"
                    title="View History"
                  >
                    <History className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleArchive(habit)}
                    className="kinetik-btn-dark inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingHabit(habit)}
                    className="rounded p-1.5 text-[#ffffff]/50 hover:text-rose-400 hover:bg-[#000000] transition"
                    title="Delete Habit"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: Create Habit */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#1b3d27] pb-3">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">Create New Habit</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-[#ffffff]/50 hover:text-[#ffffff] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="mt-4 space-y-4">
              {formErrors.form && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300">
                  {formErrors.form}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Habit Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Read for 20 minutes"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] px-3 py-2 text-xs text-[#ffffff] placeholder:text-[#ffffff]/40 focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="e.g. Protocol immediately following workout session"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] px-3 py-2 text-xs text-[#ffffff] placeholder:text-[#ffffff]/40 focus:border-[#ff2a3b] focus:outline-none"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-rose-400">{formErrors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#1b3d27]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="kinetik-btn-dark px-4 py-2 text-xs font-bold uppercase tracking-wider min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="kinetik-btn-lime px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-h-[40px]"
                >
                  {submitting ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Habit */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#1b3d27] pb-3">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">Edit Habit</h3>
              <button
                type="button"
                onClick={() => setEditingHabit(null)}
                className="rounded-lg p-1 text-[#ffffff]/50 hover:text-[#ffffff] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditHabit} className="mt-4 space-y-4">
              {formErrors.form && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300">
                  {formErrors.form}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Habit Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] px-3 py-2 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] px-3 py-2 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-rose-400">{formErrors.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1b3d27]">
                <button
                  type="button"
                  onClick={() => {
                    const habitToDelete = editingHabit;
                    setEditingHabit(null);
                    setDeletingHabit(habitToDelete);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-[#000000] transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingHabit(null)}
                    className="kinetik-btn-dark px-4 py-2 text-xs font-bold uppercase tracking-wider min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="kinetik-btn-lime px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-h-[40px]"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Habit Completion History */}
      {historyHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#1b3d27] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">{historyHabit.name}</h3>
                <p className="eyebrow text-xs text-[#ff2a3b]">COMPLETION HISTORY</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryHabit(null)}
                className="rounded-lg p-1 text-[#ffffff]/50 hover:text-[#ffffff] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Streak Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-center">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#ffffff]/50">Current Streak</span>
                  <div className="mt-1 font-display text-2xl font-bold text-[#ff2a3b]">
                    {historyHabit.currentStreak} days
                  </div>
                </div>
                <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-center">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#ffffff]/50">Best Streak</span>
                  <div className="mt-1 font-display text-2xl font-bold text-[#ffffff]">
                    {historyHabit.bestStreak} days
                  </div>
                </div>
              </div>

              {/* Log List */}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-[#1b3d27] rounded-xl p-3 bg-[#000000]/50">
                {historyLoading ? (
                  <p className="text-xs text-[#ffffff]/50 text-center py-4">Loading history...</p>
                ) : historyLogs.length === 0 ? (
                  <p className="text-xs text-[#ffffff]/50 text-center py-4">No completions recorded yet.</p>
                ) : (
                  historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#0d0d0d] border border-[#1b3d27]"
                    >
                      <span className="font-mono text-[#ffffff]">{log.completedOn}</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[#ff2a3b]">
                        <Check className="h-3 w-3 stroke-[3]" /> Completed
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-[#1b3d27]">
                <button
                  type="button"
                  onClick={() => setHistoryHabit(null)}
                  className="kinetik-btn-dark px-4 py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Habit Performance Report (Last Month, 3 Months, 6 Months, 1 Year) */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
          <div
            id="printable-habit-report"
            className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] shadow-2xl text-[#ffffff] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#1b3d27] px-6 py-4 bg-[#000000]/60">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#ff2a3b]" />
                  <h3 className="font-display text-xl font-bold uppercase tracking-wide text-[#ffffff]">Habit Performance Report</h3>
                </div>
                <p className="text-xs text-[#ffffff]/60 mt-0.5">
                  {reportData
                    ? `${reportData.period} • ${reportData.from} to ${reportData.to} (${reportData.totalDays} Days) • ${reportData.clientName}`
                    : 'Analytics & consistency overview across tracked habits'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  disabled={!reportData || reportLoading}
                  className="kinetik-btn-dark inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                  title="Download CSV Spreadsheet"
                >
                  <Download className="h-3.5 w-3.5 text-[#ff2a3b]" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  disabled={!reportData || reportLoading}
                  className="kinetik-btn-dark inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                  title="Print or Save as PDF"
                >
                  <Printer className="h-3.5 w-3.5 text-[#ff2a3b]" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-lg p-1.5 text-[#ffffff]/50 hover:text-[#ffffff] hover:bg-[#1a1a1a] transition"
                  title="Close Report"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Timeframe Selector Bar (No-Print) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#1b3d27] px-6 py-3 bg-[#000000]/40 no-print">
              <span className="eyebrow text-xs text-[#ffffff]/60 mr-1">Timeframe:</span>
              {[
                { key: '1m', label: 'Last Month (30d)' },
                { key: '3m', label: '3 Months (90d)' },
                { key: '6m', label: '6 Months (180d)' },
                { key: '1y', label: '1 Year (365d)' },
              ].map((tf) => {
                const isActive = reportRange === tf.key;
                return (
                  <button
                    key={tf.key}
                    type="button"
                    onClick={() => void loadReport(tf.key as '1m' | '3m' | '6m' | '1y')}
                    disabled={reportLoading}
                    className={`rounded-lg px-3 py-1.5 text-xs uppercase font-mono font-bold transition ${
                      isActive
                        ? 'bg-[#ff2a3b] text-white shadow-[0_0_10px_rgba(255, 42, 59, 0.2)]'
                        : 'bg-[#1a1a1a]/60 text-[#ffffff]/60 hover:text-[#ffffff] hover:bg-[#1a1a1a]'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Report Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reportLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ff2a3b]" />
                  <p className="text-xs font-mono uppercase tracking-wider text-[#ffffff]/60">
                    Generating habit report...
                  </p>
                </div>
              ) : reportError ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-6 text-center text-rose-300 space-y-3">
                  <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
                  <p className="text-sm font-semibold">{reportError}</p>
                  <button
                    type="button"
                    onClick={() => void loadReport(reportRange)}
                    className="kinetik-btn-lime inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    Retry
                  </button>
                </div>
              ) : !reportData || reportData.habits.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Sparkles className="mx-auto h-10 w-10 text-[#ff2a3b] opacity-60" />
                  <p className="font-display text-base font-bold uppercase tracking-wide text-[#ffffff]">No habit records found</p>
                  <p className="text-xs text-[#ffffff]/50">
                    Create habits and record daily check-ins to view performance analytics.
                  </p>
                </div>
              ) : (
                <>
                  {/* Executive KPI Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Average Consistency */}
                    <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffffff]/50">
                          Consistency
                        </span>
                        <TrendingUp className="h-4 w-4 text-[#ff2a3b]" />
                      </div>
                      <div className="mt-2 font-display text-2xl font-black tracking-tight text-[#ff2a3b]">
                        {reportData.summary.averageConsistency}%
                      </div>
                      <p className="mt-1 text-[10px] text-[#ffffff]/50">
                        Active habits avg
                      </p>
                    </div>

                    {/* Card 2: Total Check-ins */}
                    <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffffff]/50">
                          Check-ins
                        </span>
                        <Check className="h-4 w-4 text-[#ff2a3b]" />
                      </div>
                      <div className="mt-2 font-display text-2xl font-black tracking-tight text-[#ffffff]">
                        {reportData.summary.totalCompletions}
                      </div>
                      <p className="mt-1 text-[10px] text-[#ffffff]/50">
                        In {reportData.totalDays} days
                      </p>
                    </div>

                    {/* Card 3: Top Habit */}
                    <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffffff]/50">
                          Top Habit
                        </span>
                        <Award className="h-4 w-4 text-[#ff2a3b]" />
                      </div>
                      <div className="mt-2 text-sm font-bold truncate text-[#ffffff]" title={reportData.summary.topHabit?.name || 'None'}>
                        {reportData.summary.topHabit?.name || '—'}
                      </div>
                      <p className="mt-1 text-[10px] text-[#ffffff]/50">
                        {reportData.summary.topHabit ? `${reportData.summary.topHabit.completionRate}% (${reportData.summary.topHabit.completedDays}d)` : 'No active habits'}
                      </p>
                    </div>

                    {/* Card 4: Active Habits */}
                    <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ffffff]/50">
                          Active Habits
                        </span>
                        <Flame className="h-4 w-4 text-[#ff2a3b]" />
                      </div>
                      <div className="mt-2 font-display text-2xl font-black tracking-tight text-[#ffffff]">
                        {reportData.summary.activeHabits}
                      </div>
                      <p className="mt-1 text-[10px] text-[#ffffff]/50">
                        Of {reportData.summary.totalHabits} total
                      </p>
                    </div>
                  </div>

                  {/* Habits Breakdown Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="eyebrow text-xs text-[#ff2a3b]">
                        INDIVIDUAL HABIT PERFORMANCE ({reportData.habits.length})
                      </h4>
                      <span className="text-xs font-mono text-[#ffffff]/50">
                        Period: {reportData.from} to {reportData.to}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#1b3d27] bg-[#000000]">
                      <div className="divide-y divide-[#1b3d27]">
                        {reportData.habits.map((habit) => (
                          <div key={habit.id} className="p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#ffffff]">
                                    {habit.name}
                                  </span>
                                  <span
                                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                      habit.isActive
                                        ? 'bg-[#1a1a1a] text-[#ff2a3b] border border-[#ff2a3b]/30'
                                        : 'bg-[#0d0d0d] text-[#ffffff]/40 border border-[#1b3d27]'
                                    }`}
                                  >
                                    {habit.isActive ? 'Active' : 'Archived'}
                                  </span>
                                </div>
                                {habit.description && (
                                  <p className="text-xs text-[#ffffff]/60 mt-0.5">
                                    {habit.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-xs font-mono">
                                <div className="flex items-center gap-1 text-[#ffffff]/80">
                                  <Flame className="h-3.5 w-3.5 text-[#ff2a3b]" />
                                  <span>Current: <strong className="text-[#ffffff]">{habit.currentStreak}d</strong></span>
                                </div>
                                <div className="flex items-center gap-1 text-[#ffffff]/80">
                                  <Award className="h-3.5 w-3.5 text-[#ff2a3b]" />
                                  <span>Best: <strong className="text-[#ffffff]">{habit.bestStreak}d</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar & Rate */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#ffffff]/60 font-mono">
                                  Completed {habit.completedDays} of {habit.totalDays} days
                                </span>
                                <span className="font-display font-bold text-[#ff2a3b]">
                                  {habit.completionRate}%
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-[#0d0d0d] border border-[#1b3d27]">
                                <div
                                  className="h-full bg-[#ff2a3b] transition-all duration-300"
                                  style={{ width: `${Math.min(100, habit.completionRate)}%` }}
                                />
                              </div>
                            </div>

                            {/* Monthly Breakdown Badges */}
                            {habit.monthlyBreakdown.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-mono text-[#ffffff]/40 mr-1">
                                  Monthly:
                                </span>
                                {habit.monthlyBreakdown.map((m) => (
                                  <span
                                    key={m.month}
                                    className="inline-flex items-center gap-1 rounded bg-[#0d0d0d] px-2 py-0.5 text-[10px] font-mono border border-[#1b3d27] text-[#ffffff]/80"
                                  >
                                    <span className="font-bold text-[#ff2a3b]">{m.label}:</span>
                                    <span>{m.completed} check-ins</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Report Footer */}
                  <div className="border-t border-[#1b3d27] pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#ffffff]/40 font-mono">
                    <span>grofit Habit Performance System • Confidential Client Report</span>
                    <span>Generated on {userToday || new Date().toISOString().split('T')[0]}</span>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Modal Actions (No-Print) */}
            <div className="flex items-center justify-between border-t border-[#1b3d27] px-6 py-3 bg-[#000000]/60 no-print">
              <span className="text-xs text-[#ffffff]/50">
                Tip: You can export this report to CSV or save it as a PDF anytime.
              </span>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="kinetik-btn-lime px-4 py-2 text-xs font-bold uppercase tracking-wider"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Habit */}
      {deletingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-[#ffffff]">Delete Habit?</h3>
                <p className="text-xs text-[#ffffff]/50">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-[#ffffff]/70 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#ffffff]">{deletingHabit.name}</strong>? All historical check-ins and streaks will be removed.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingHabit(null)}
                disabled={isDeleting}
                className="kinetik-btn-dark px-3.5 py-2 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteHabit(deletingHabit.id)}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HabitTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#0d0d0d] border border-[#1b3d27]" />
          <div className="h-16 w-full animate-pulse rounded-2xl border border-[#1b3d27] bg-[#0d0d0d]/60" />
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
            <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
            <div className="h-20 animate-pulse rounded-xl border border-[#1b3d27] bg-[#0d0d0d]/50" />
          </div>
        </div>
      }
    >
      <HabitTrackerContent />
    </Suspense>
  );
}
