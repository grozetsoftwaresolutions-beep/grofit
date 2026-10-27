'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Play,
  ExternalLink,
  Calendar,
  Layers,
  X,
  TrendingUp,
  Search,
  Award,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { validateSets, validateReps, validateName } from '@/lib/workout/domain';

interface PlanSummary {
  id: string;
  name: string;
  sourceTemplateId: string | null;
  sourceTemplateNameSnapshot: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlanEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  sourceTemplateEntryId: string | null;
  sourceLabel: string | null;
  videoUrl: string | null;
  sourceSets: number | null;
  sourceReps: number | null;
  sourcePrescriptionText: string | null;
  sets: number | null;
  reps: number | null;
  sortOrder: number;
}

interface PlanDay {
  id: string;
  dayNumber: number | null;
  name: string;
  sortOrder: number;
  sourceTemplateDayId: string | null;
  entries: PlanEntry[];
}

interface PlanDetail extends PlanSummary {
  days: PlanDay[];
}

interface CanonicalExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  rank?: number | null;
  tier?: string | null;
  targetHead?: string | null;
  hypertrophyScore?: number | null;
  biomechanicalAdvantage?: string | null;
  evidenceRationale?: string | null;
  scientificReference?: string | null;
  recommendedSets?: number | null;
  recommendedReps?: number | null;
  recommendedRepRange?: string | null;
  executionCues?: string[] | null;
}

export default function MyWorkoutPlanPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [createPlanError, setCreatePlanError] = useState<string | null>(null);

  const [renamePlanModalOpen, setRenamePlanModalOpen] = useState(false);
  const [renamePlanName, setRenamePlanName] = useState('');
  const [renamePlanError, setRenamePlanError] = useState<string | null>(null);

  const [addDayModalOpen, setAddDayModalOpen] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  const [addDayError, setAddDayError] = useState<string | null>(null);

  // Exercise picker modal
  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false);
  const [addExerciseTab, setAddExerciseTab] = useState<'curated' | 'custom'>('curated');
  const [targetDayId, setTargetDayId] = useState<string | null>(null);
  const [canonicalExercises, setCanonicalExercises] = useState<CanonicalExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [entrySetsInput, setEntrySetsInput] = useState<string>('3');
  const [entryRepsInput, setEntryRepsInput] = useState<string>('10');
  const [addEntryError, setAddEntryError] = useState<string | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('All');
  const [topRankedOnlyFilter, setTopRankedOnlyFilter] = useState<boolean>(true);

  // Custom workout states
  const [customWorkoutName, setCustomWorkoutName] = useState<string>('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState<string>('Full Body');
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [customSetsInput, setCustomSetsInput] = useState<string>('3');
  const [customRepsInput, setCustomRepsInput] = useState<string>('10');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState<boolean>(false);

  const exerciseMuscleGroups = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Quads',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Abs',
    'Forearms',
  ];

  // Entry edit modal
  const [editEntryModalOpen, setEditEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{
    dayId: string;
    entryId: string;
    exerciseName: string;
    sets: string;
    reps: string;
    videoUrl: string;
  } | null>(null);
  const [editEntryError, setEditEntryError] = useState<string | null>(null);

  // Fetch plan list
  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/workout-plans');
      if (!res.ok) throw new Error('Failed to load plans.');
      const json = await res.json();
      const list: PlanSummary[] = json.data || [];
      setPlans(list);

      if (list.length > 0) {
        const searchParams = new URLSearchParams(window.location.search);
        const queryPlanId = searchParams.get('planId');
        const active = list.find((p) => p.id === queryPlanId) ? queryPlanId : list[0].id;
        setSelectedPlanId(active || list[0].id);
      } else {
        setSelectedPlanId(null);
        setCurrentPlan(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Load detailed plan when selectedPlanId changes
  const loadCurrentPlan = useCallback(async (planId: string) => {
    try {
      const res = await fetch(`/api/workout-plans/${planId}`);
      if (!res.ok) throw new Error('Failed to load plan details.');
      const json = await res.json();
      setCurrentPlan(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch('/api/workout-plans');
        if (!res.ok) return;
        const json = await res.json();
        if (!isMounted) return;
        const list: PlanSummary[] = json.data || [];
        setPlans(list);

        if (list.length > 0) {
          const searchParams = new URLSearchParams(window.location.search);
          const queryPlanId = searchParams.get('planId');
          const active = list.find((p) => p.id === queryPlanId) ? queryPlanId : list[0].id;
          setSelectedPlanId(active || list[0].id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlanId) return;
    let isMounted = true;
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/workout-plans/${selectedPlanId}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted) setCurrentPlan(json.data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchPlan();
    return () => {
      isMounted = false;
    };
  }, [selectedPlanId]);

  // Handle plan creation
  async function handleCreatePlan() {
    setCreatePlanError(null);
    const valid = validateName(newPlanName, 'Plan name');
    if (!valid.valid) {
      setCreatePlanError(valid.error || 'Invalid name');
      return;
    }

    try {
      const res = await fetch('/api/workout-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: valid.value }),
      });
      if (!res.ok) throw new Error('Failed to create plan.');
      const json = await res.json();
      setCreatePlanModalOpen(false);
      setNewPlanName('');
      await loadPlans();
      setSelectedPlanId(json.data.id);
    } catch (err: unknown) {
      setCreatePlanError(err instanceof Error ? err.message : 'Error creating plan.');
    }
  }

  // Handle plan rename
  async function handleRenamePlan() {
    if (!currentPlan) return;
    setRenamePlanError(null);
    const valid = validateName(renamePlanName, 'Plan name');
    if (!valid.valid) {
      setRenamePlanError(valid.error || 'Invalid name');
      return;
    }

    try {
      const res = await fetch(`/api/workout-plans/${currentPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: valid.value }),
      });
      if (!res.ok) throw new Error('Failed to rename plan.');
      setRenamePlanModalOpen(false);
      await loadPlans();
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      setRenamePlanError(err instanceof Error ? err.message : 'Error renaming plan.');
    }
  }

  // Handle plan delete
  async function handleDeletePlan() {
    if (!currentPlan) return;
    if (!window.confirm(`Are you sure you want to delete "${currentPlan.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workout-plans/${currentPlan.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete plan.');
      await loadPlans();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting plan.');
    }
  }

  // Handle add day
  async function handleAddDay() {
    if (!currentPlan) return;
    setAddDayError(null);
    const valid = validateName(newDayName, 'Day name');
    if (!valid.valid) {
      setAddDayError(valid.error || 'Invalid name');
      return;
    }

    try {
      const res = await fetch(`/api/workout-plans/${currentPlan.id}/days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: valid.value }),
      });
      if (!res.ok) throw new Error('Failed to add day.');
      setAddDayModalOpen(false);
      setNewDayName('');
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      setAddDayError(err instanceof Error ? err.message : 'Error adding day.');
    }
  }

  // Handle delete day
  async function handleDeleteDay(dayId: string, dayName: string) {
    if (!currentPlan) return;
    if (!window.confirm(`Delete "${dayName}" and all its exercises?`)) return;

    try {
      const res = await fetch(`/api/workout-plans/${currentPlan.id}/days/${dayId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete day.');
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting day.');
    }
  }

  // Open exercise picker modal
  async function openAddExercise(dayId: string) {
    setTargetDayId(dayId);
    setAddEntryError(null);
    setExerciseSearchQuery('');
    setSelectedMuscleFilter('All');
    setTopRankedOnlyFilter(true);
    setAddExerciseTab('curated');
    setCustomWorkoutName('');
    setCustomMuscleGroup('Full Body');
    setCustomVideoUrl('');
    setCustomSetsInput('3');
    setCustomRepsInput('10');
    setAddExerciseModalOpen(true);

    try {
      const res = await fetch('/api/exercises');
      if (res.ok) {
        const json = await res.json();
        const list: CanonicalExercise[] = json.data || [];
        setCanonicalExercises(list);
        if (list.length > 0) {
          const defaultEx = list.find((e) => e.rank === 1) || list[0];
          setSelectedExerciseId(defaultEx.id);
          if (defaultEx.recommendedSets) setEntrySetsInput(String(defaultEx.recommendedSets));
          if (defaultEx.recommendedReps) setEntryRepsInput(String(defaultEx.recommendedReps));
        }
      }
    } catch {
      // ignore
    }
  }

  function handleSelectExerciseItem(ex: CanonicalExercise) {
    setSelectedExerciseId(ex.id);
    if (ex.recommendedSets) {
      setEntrySetsInput(String(ex.recommendedSets));
    }
    if (ex.recommendedReps) {
      setEntryRepsInput(String(ex.recommendedReps));
    }
  }

  // Add curated exercise to day
  async function handleAddExercise() {
    if (!currentPlan || !targetDayId || !selectedExerciseId) return;
    setAddEntryError(null);

    const setsValidation = validateSets(entrySetsInput);
    if (!setsValidation.valid) {
      setAddEntryError(setsValidation.error || 'Invalid sets value (must be 1–20)');
      return;
    }

    const repsValidation = validateReps(entryRepsInput);
    if (!repsValidation.valid) {
      setAddEntryError(repsValidation.error || 'Invalid reps value (must be 1–200)');
      return;
    }

    try {
      const res = await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${targetDayId}/entries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: selectedExerciseId,
            sets: setsValidation.value,
            reps: repsValidation.value,
          }),
        }
      );
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to add exercise.');
      }

      setAddExerciseModalOpen(false);
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      setAddEntryError(err instanceof Error ? err.message : 'Error adding exercise.');
    }
  }

  // Add custom workout to day
  async function handleAddCustomWorkout() {
    if (!currentPlan || !targetDayId) return;
    setAddEntryError(null);

    const nameVal = validateName(customWorkoutName, 'Workout name');
    if (!nameVal.valid) {
      setAddEntryError(nameVal.error || 'Please enter a valid workout name');
      return;
    }

    const setsValidation = validateSets(customSetsInput);
    if (!setsValidation.valid) {
      setAddEntryError(setsValidation.error || 'Invalid sets value (must be 1–20)');
      return;
    }

    const repsValidation = validateReps(customRepsInput);
    if (!repsValidation.valid) {
      setAddEntryError(repsValidation.error || 'Invalid reps value (must be 1–200)');
      return;
    }

    try {
      setIsSubmittingCustom(true);
      const res = await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${targetDayId}/entries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customExerciseName: nameVal.value,
            muscleGroup: customMuscleGroup,
            videoUrl: customVideoUrl.trim() || null,
            sets: setsValidation.value,
            reps: repsValidation.value,
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to add custom workout.');
      }

      setAddExerciseModalOpen(false);
      setCustomWorkoutName('');
      setCustomVideoUrl('');
      setCustomSetsInput('3');
      setCustomRepsInput('10');
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      setAddEntryError(err instanceof Error ? err.message : 'Error adding custom workout.');
    } finally {
      setIsSubmittingCustom(false);
    }
  }

  // Save edited sets, reps & videoUrl
  async function handleSaveEditedEntry() {
    if (!currentPlan || !editingEntry) return;
    setEditEntryError(null);

    const setsValidation = validateSets(editingEntry.sets);
    if (!setsValidation.valid) {
      setEditEntryError(setsValidation.error || 'Sets must be between 1 and 20.');
      return;
    }

    const repsValidation = validateReps(editingEntry.reps);
    if (!repsValidation.valid) {
      setEditEntryError(repsValidation.error || 'Reps must be between 1 and 200.');
      return;
    }

    try {
      const res = await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${editingEntry.dayId}/entries/${editingEntry.entryId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sets: setsValidation.value,
            reps: repsValidation.value,
            videoUrl: editingEntry.videoUrl ? editingEntry.videoUrl.trim() : null,
          }),
        }
      );
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error?.message || 'Failed to update exercise.');
      }
      setEditEntryModalOpen(false);
      setEditingEntry(null);
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      setEditEntryError(err instanceof Error ? err.message : 'Error updating exercise.');
    }
  }

  // Delete exercise entry
  async function handleDeleteEntry(dayId: string, entryId: string, name: string) {
    if (!currentPlan) return;
    if (!window.confirm(`Remove ${name} from this workout day?`)) return;

    try {
      const res = await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${dayId}/entries/${entryId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove entry.');
      await loadCurrentPlan(currentPlan.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing exercise.');
    }
  }

  // Reorder entries within day
  async function handleMoveEntry(day: PlanDay, index: number, direction: 'up' | 'down') {
    if (!currentPlan) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= day.entries.length) return;

    const entryA = day.entries[index];
    const entryB = day.entries[targetIndex];

    try {
      // Swap sortOrder
      await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${day.id}/entries/${entryA.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: 9999 }), // temporary offset
        }
      );

      await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${day.id}/entries/${entryB.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: entryA.sortOrder }),
        }
      );

      await fetch(
        `/api/workout-plans/${currentPlan.id}/days/${day.id}/entries/${entryA.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: entryB.sortOrder }),
        }
      );

      await loadCurrentPlan(currentPlan.id);
    } catch {
      alert('Failed to reorder exercises.');
    }
  }

  if (loading && !currentPlan && plans.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Dumbbell className="mx-auto h-8 w-8 animate-spin text-[#ff2a3b]" />
          <p className="mt-2 text-xs font-mono text-[#a1a1aa]">Loading your workout workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header & Plan Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-[#ff2a3b]">
            Active Training Workspace
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-[#ffffff] mt-1">
            My Workout Plan
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa]">
            Manage your personal workout splits, configure sets & reps, and organize your training.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {plans.length > 0 && (
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="rounded-xl border border-[#ffffff]/15 bg-[#0d0d0d] px-3.5 py-2.5 text-xs sm:text-sm font-mono font-semibold text-[#ffffff] shadow-sm focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              setNewPlanName('');
              setCreatePlanError(null);
              setCreatePlanModalOpen(true);
            }}
            className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>New Plan</span>
          </button>

          <Link
            href="/app/workout-plans"
            className="kinetik-btn-dark px-3.5 py-2.5 text-xs font-mono font-bold uppercase inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <Layers className="h-4 w-4 text-[#ff2a3b]" />
            <span>Catalogue</span>
          </Link>
        </div>
      </div>

      {/* When user has no plans */}
      {plans.length === 0 ? (
        <div className="kinetik-card p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#ff2a3b]/60" />
          <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
            You don&apos;t have any workout plans yet
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa] max-w-md mx-auto">
            Create an empty plan from scratch or apply verified split programmes from our curated catalogue.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setNewPlanName('My Custom Plan');
                setCreatePlanError(null);
                setCreatePlanModalOpen(true);
              }}
              className="kinetik-btn-lime px-5 py-2.5 text-xs font-extrabold uppercase min-h-[44px]"
            >
              Create Empty Plan
            </button>
            <Link
              href="/app/workout-plans"
              className="kinetik-btn-dark px-5 py-2.5 text-xs font-mono font-bold uppercase min-h-[44px]"
            >
              Browse Curated Templates
            </Link>
          </div>
        </div>
      ) : currentPlan ? (
        <div className="space-y-6">
          {/* Plan Header Card */}
          <div className="kinetik-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-[#ffffff]">
                  {currentPlan.name}
                </h2>
                <button
                  onClick={() => {
                    setRenamePlanName(currentPlan.name);
                    setRenamePlanError(null);
                    setRenamePlanModalOpen(true);
                  }}
                  className="rounded p-1 text-[#a1a1aa] hover:text-[#ff2a3b] transition"
                  title="Rename Plan"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>

              {currentPlan.sourceTemplateNameSnapshot && (
                <p className="mt-1 text-xs font-mono text-[#a1a1aa]">
                  Origin: <span className="text-[#ffffff]">{currentPlan.sourceTemplateNameSnapshot}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewDayName(`Day ${currentPlan.days.length + 1}`);
                  setAddDayError(null);
                  setAddDayModalOpen(true);
                }}
                className="kinetik-btn-dark px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5 text-[#ff2a3b]" />
                <span>Add Day</span>
              </button>

              <button
                onClick={handleDeletePlan}
                className="rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-1.5 text-xs font-mono font-semibold text-red-300 transition hover:bg-red-900/60 inline-flex items-center gap-1.5 min-h-[38px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Plan</span>
              </button>
            </div>
          </div>

          {/* Days & Exercises */}
          {currentPlan.days.length === 0 ? (
            <div className="kinetik-card border-dashed p-8 text-center">
              <p className="text-xs sm:text-sm font-mono text-[#a1a1aa]">This plan has no days yet.</p>
              <button
                onClick={() => {
                  setNewDayName('Day 1');
                  setAddDayModalOpen(true);
                }}
                className="mt-3 kinetik-btn-lime px-4 py-2 text-xs font-bold uppercase inline-flex items-center gap-1.5 min-h-[40px]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Day
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {currentPlan.days.map((day) => (
                <div
                  key={day.id}
                  className="kinetik-card p-5 sm:p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-[#ffffff]/10 pb-3">
                    <div>
                      <span className="eyebrow text-[#ff2a3b]">
                        {day.dayNumber ? `Day ${day.dayNumber}` : 'Day'}
                      </span>
                      <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff] mt-0.5">
                        {day.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddExercise(day.id)}
                        className="kinetik-btn-lime px-3 py-1.5 text-xs font-bold uppercase inline-flex items-center gap-1 min-h-[36px]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Exercise</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDay(day.id, day.name)}
                        className="rounded-lg p-1.5 text-[#a1a1aa] hover:text-red-400 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete Day"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Exercise entries */}
                  {day.entries.length === 0 ? (
                    <p className="mt-4 text-xs italic font-mono text-[#71717a]">
                      No exercises added to this day yet.
                    </p>
                  ) : (
                    <div className="mt-4 divide-y divide-[#ffffff]/5">
                      {day.entries.map((entry, idx) => (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between px-2 rounded-xl transition-colors hover:bg-[#1a1a1a]/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#000000] text-xs font-mono font-bold text-[#ff2a3b] border border-[#ffffff]/10">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-[#ffffff]">
                                  {entry.exerciseName}
                                </span>
                                {entry.sourceLabel === 'Custom' && (
                                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                                    Custom
                                  </span>
                                )}
                                {entry.muscleGroup && (
                                  <span className="rounded-full bg-[#1a1a1a] border border-[#ff2a3b]/20 px-2 py-0.5 text-[10px] font-mono uppercase text-[#ff2a3b]">
                                    {entry.muscleGroup}
                                  </span>
                                )}
                              </div>
                              {entry.sourceLabel && entry.sourceLabel !== entry.exerciseName && entry.sourceLabel !== 'Custom' && (
                                <span className="text-xs font-mono text-[#a1a1aa]">
                                  Label: {entry.sourceLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pl-9 sm:pl-0">
                            {/* Sets & Reps Prescriptions */}
                            {entry.sets !== null || entry.reps !== null ? (
                              <span className="rounded-lg border border-[#ffffff]/10 bg-[#000000] px-2.5 py-1 text-xs font-mono font-bold text-[#ff2a3b]">
                                {entry.sets ? `${entry.sets} sets` : ''}{' '}
                                {entry.reps ? `× ${entry.reps} reps` : ''}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono italic text-[#71717a]">
                                Unset prescription
                              </span>
                            )}

                            {/* Video link if any */}
                            {entry.videoUrl && (
                              <a
                                href={entry.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="kinetik-btn-dark px-2.5 py-1 text-xs font-mono inline-flex items-center gap-1.5 min-h-[32px]"
                                title="Watch YouTube Tutorial"
                              >
                                <Play className="h-3 w-3 text-[#ff2a3b] fill-[#ff2a3b]" />
                                <span>Tutorial</span>
                                <ExternalLink className="h-3 w-3 text-[#a1a1aa]" />
                              </a>
                            )}

                            {/* View Progress History */}
                            <Link
                              href={`/app/workout-progress/${entry.exerciseId}`}
                              className="kinetik-btn-dark px-2.5 py-1 text-xs font-mono inline-flex items-center gap-1 min-h-[32px]"
                              title="View Performance Progress"
                            >
                              <TrendingUp className="h-3 w-3 text-[#ff2a3b]" />
                              <span>Progress</span>
                            </Link>

                            {/* Reorder actions */}
                            <div className="flex items-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveEntry(day, idx, 'up')}
                                className="rounded p-1 text-[#a1a1aa] hover:text-[#ffffff] disabled:opacity-30 transition"
                                title="Move Up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                disabled={idx === day.entries.length - 1}
                                onClick={() => handleMoveEntry(day, idx, 'down')}
                                className="rounded p-1 text-[#a1a1aa] hover:text-[#ffffff] disabled:opacity-30 transition"
                                title="Move Down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Edit prescription */}
                            <button
                              onClick={() => {
                                setEditingEntry({
                                  dayId: day.id,
                                  entryId: entry.id,
                                  exerciseName: entry.exerciseName,
                                  sets: entry.sets?.toString() || '3',
                                  reps: entry.reps?.toString() || '10',
                                  videoUrl: entry.videoUrl || '',
                                });
                                setEditEntryError(null);
                                setEditEntryModalOpen(true);
                              }}
                              className="rounded p-1 text-[#a1a1aa] hover:text-[#ff2a3b] min-h-[32px] min-w-[32px] flex items-center justify-center transition"
                              title="Edit Prescription & Video"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Remove entry */}
                            <button
                              onClick={() => handleDeleteEntry(day.id, entry.id, entry.exerciseName)}
                              className="rounded p-1 text-[#a1a1aa] hover:text-red-400 transition"
                              title="Remove Exercise"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Modal: Create Plan */}
      {createPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
              Create New Workout Plan
            </h3>
            {createPlanError && (
              <p className="mt-2 text-xs font-mono text-red-400">{createPlanError}</p>
            )}
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="e.g. Hypertrophy Split 2026"
              className="mt-3 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
            />
            <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-[#ffffff]/10">
              <button
                onClick={() => setCreatePlanModalOpen(false)}
                className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase min-h-[44px]"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename Plan */}
      {renamePlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
              Rename Workout Plan
            </h3>
            {renamePlanError && (
              <p className="mt-2 text-xs font-mono text-red-400">{renamePlanError}</p>
            )}
            <input
              type="text"
              value={renamePlanName}
              onChange={(e) => setRenamePlanName(e.target.value)}
              className="mt-3 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
            />
            <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-[#ffffff]/10">
              <button
                onClick={() => setRenamePlanModalOpen(false)}
                className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleRenamePlan}
                className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase min-h-[44px]"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Day */}
      {addDayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
            <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#ffffff]">
              Add Workout Day
            </h3>
            {addDayError && (
              <p className="mt-2 text-xs font-mono text-red-400">{addDayError}</p>
            )}
            <input
              type="text"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="e.g. Chest & Triceps"
              className="mt-3 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
            />
            <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-[#ffffff]/10">
              <button
                onClick={() => setAddDayModalOpen(false)}
                className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDay}
                className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase min-h-[44px]"
              >
                Add Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Exercise Picker & Custom Workout Creator */}
      {addExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="flex h-[92vh] max-h-[820px] w-full max-w-4xl flex-col rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ffffff]/10 p-5 bg-[#000000]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1a1a1a] text-[#ff2a3b] border border-[#ff2a3b]/30">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[#ffffff]">
                    Add Workout to Plan
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-[#a1a1aa]">
                  Select an evidence-based exercise or create your own custom workout with a YouTube tutorial.
                </p>
              </div>
              <button
                onClick={() => setAddExerciseModalOpen(false)}
                className="rounded-lg p-1.5 text-[#a1a1aa] hover:text-[#ffffff] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-[#ffffff]/10 bg-[#000000] px-5">
              <button
                type="button"
                onClick={() => {
                  setAddExerciseTab('curated');
                  setAddEntryError(null);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition ${
                  addExerciseTab === 'curated'
                    ? 'border-[#ff2a3b] text-[#ff2a3b]'
                    : 'border-transparent text-[#a1a1aa] hover:text-[#ffffff]'
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Evidence-Based Library</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddExerciseTab('custom');
                  setAddEntryError(null);
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition ${
                  addExerciseTab === 'custom'
                    ? 'border-[#ff2a3b] text-[#ff2a3b]'
                    : 'border-transparent text-[#a1a1aa] hover:text-[#ffffff]'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>+ Custom Workout</span>
              </button>
            </div>

            {/* Tab Content */}
            {addExerciseTab === 'custom' ? (
              /* Custom Workout Form */
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="mx-auto max-w-xl space-y-5">
                  <div className="rounded-2xl border border-[#ff2a3b]/20 bg-[#000000] p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a] text-[#ff2a3b] border border-[#ff2a3b]/30">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display text-base font-bold uppercase tracking-tight text-[#ffffff]">
                          Create Customized Workout
                        </h4>
                        <p className="text-xs text-[#a1a1aa]">
                          Add your own custom movement (e.g. Jumping, Box Jumps), attach a YouTube video tutorial link, and set your target sets and reps.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {addEntryError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs font-mono text-red-300">
                      {addEntryError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Workout Name */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                        Workout Name <span className="text-[#ff2a3b]">*</span>
                      </label>
                      <input
                        type="text"
                        value={customWorkoutName}
                        onChange={(e) => setCustomWorkoutName(e.target.value)}
                        placeholder="e.g. Jumping, Box Jumps, Burpees, Cable Fly"
                        className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                      />
                      <p className="mt-1 text-[11px] font-mono text-[#71717a]">
                        Give your workout an identifiable title.
                      </p>
                    </div>

                    {/* Muscle Group / Category */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                        Muscle Group / Category
                      </label>
                      <select
                        value={customMuscleGroup}
                        onChange={(e) => setCustomMuscleGroup(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                      >
                        {[
                          'Full Body',
                          'Chest',
                          'Back',
                          'Shoulders',
                          'Biceps',
                          'Triceps',
                          'Quads',
                          'Hamstrings',
                          'Glutes',
                          'Calves',
                          'Abs',
                          'Forearms',
                          'Cardio',
                        ].map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* YouTube Video URL */}
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                        YouTube Tutorial Link <span className="font-normal text-[#71717a]">(Optional)</span>
                      </label>
                      <div className="relative mt-1.5">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Play className="h-4 w-4 fill-[#ff2a3b] text-[#ff2a3b]" />
                        </div>
                        <input
                          type="url"
                          value={customVideoUrl}
                          onChange={(e) => setCustomVideoUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          className="w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] py-2.5 pl-9 pr-3.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <p className="mt-1 text-[11px] font-mono text-[#71717a]">
                        A &quot;Tutorial&quot; button will appear next to this exercise so you can watch form and execution anytime.
                      </p>
                    </div>

                    {/* Target Sets & Reps */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                          Target Sets (1–20)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={customSetsInput}
                          onChange={(e) => setCustomSetsInput(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                          Target Reps (1–200)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={customRepsInput}
                          onChange={(e) => setCustomRepsInput(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-3 border-t border-[#ffffff]/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setAddExerciseModalOpen(false)}
                      className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomWorkout}
                      disabled={isSubmittingCustom || !customWorkoutName.trim()}
                      className="kinetik-btn-lime px-5 py-2.5 text-xs font-extrabold uppercase disabled:opacity-50 min-h-[44px] inline-flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{isSubmittingCustom ? 'Adding Workout...' : 'Add Custom Workout to Day'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Curated Library View */
              <>
                {/* Filter & Search Bar */}
                <div className="border-b border-[#ffffff]/10 bg-[#000000] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#71717a]" />
                      <input
                        type="text"
                        value={exerciseSearchQuery}
                        onChange={(e) => setExerciseSearchQuery(e.target.value)}
                        placeholder="Search exercise, muscle target, or mechanism..."
                        className="w-full rounded-xl border border-[#ffffff]/15 bg-[#0d0d0d] py-2 pl-9 pr-3 text-xs text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[40px]"
                      />
                    </div>

                    {/* Top 5 Ranked Toggle */}
                    <button
                      type="button"
                      onClick={() => setTopRankedOnlyFilter(!topRankedOnlyFilter)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-mono font-bold transition min-h-[40px] ${
                        topRankedOnlyFilter
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] text-[#ff2a3b]'
                          : 'border-[#ffffff]/15 bg-[#0d0d0d] text-[#a1a1aa] hover:border-[#ffffff]/30 hover:text-[#ffffff]'
                      }`}
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Top 5 Ranked</span>
                      {topRankedOnlyFilter && <span className="ml-0.5 text-[10px] text-[#ff2a3b]">(Active)</span>}
                    </button>
                  </div>

                  {/* Muscle Group Horizontal Filter Pills */}
                  <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <Filter className="mr-1 h-3.5 w-3.5 shrink-0 text-[#a1a1aa]" />
                    {exerciseMuscleGroups.map((muscle) => (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => setSelectedMuscleFilter(muscle)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-mono transition ${
                          selectedMuscleFilter === muscle
                            ? 'bg-[#ff2a3b] text-white font-bold'
                            : 'bg-[#0d0d0d] text-[#a1a1aa] hover:text-[#ffffff] border border-[#ffffff]/10'
                        }`}
                      >
                        {muscle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error message */}
                {addEntryError && (
                  <div className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-950/40 p-2.5 text-xs font-mono text-red-300">
                    {addEntryError}
                  </div>
                )}

                {/* Exercise Selection Cards List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {(() => {
                    const filtered = canonicalExercises.filter((ex) => {
                      let matchesMuscle = true;
                      if (selectedMuscleFilter !== 'All') {
                        const targetM = selectedMuscleFilter.toLowerCase();
                        const exM = (ex.muscleGroup || '').toLowerCase();
                        if (targetM === 'shoulders' || targetM === 'shoulder') {
                          matchesMuscle = exM === 'shoulder' || exM === 'shoulders';
                        } else if (targetM === 'forearms' || targetM === 'forearm') {
                          matchesMuscle = exM === 'forearm' || exM === 'forearms';
                        } else if (targetM === 'legs') {
                          matchesMuscle = ['legs', 'quads', 'hamstrings', 'glutes', 'calves'].includes(exM);
                        } else {
                          matchesMuscle = exM === targetM;
                        }
                      }

                      const query = exerciseSearchQuery.trim().toLowerCase();
                      const matchesSearch =
                        !query ||
                        ex.name.toLowerCase().includes(query) ||
                        (ex.targetHead && ex.targetHead.toLowerCase().includes(query)) ||
                        (ex.biomechanicalAdvantage && ex.biomechanicalAdvantage.toLowerCase().includes(query)) ||
                        (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(query));

                      const matchesRank = !topRankedOnlyFilter || (ex.rank !== null && ex.rank !== undefined && ex.rank <= 5);

                      return matchesMuscle && matchesSearch && matchesRank;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="kinetik-card p-8 text-center">
                          <Dumbbell className="mx-auto h-8 w-8 text-[#ff2a3b]/50" />
                          <p className="mt-2 text-sm font-bold text-[#ffffff]">
                            No exercises match your filter criteria
                          </p>
                          <p className="mt-1 text-xs text-[#a1a1aa]">
                            Try switching muscle group to &quot;All&quot; or clearing your search term, or switch to the &quot;+ Custom Workout&quot; tab to add your own.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {filtered.map((ex) => {
                          const isSelected = selectedExerciseId === ex.id;
                          return (
                            <div
                              key={ex.id}
                              onClick={() => handleSelectExerciseItem(ex)}
                              className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                                isSelected
                                  ? 'border-[#ff2a3b] bg-[#1a1a1a] shadow-[0_0_15px_rgba(255, 42, 59, 0.15)] ring-1 ring-[#ff2a3b]'
                                  : 'border-[#ffffff]/10 bg-[#000000] hover:border-[#ff2a3b]/40'
                              }`}
                            >
                              <div>
                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {ex.rank ? (
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                                          ex.rank === 1
                                            ? 'bg-[#ff2a3b] text-white'
                                            : 'bg-[#1a1a1a] text-[#ff2a3b] border border-[#ff2a3b]/20'
                                        }`}
                                      >
                                        {ex.rank === 1 ? '👑' : ex.rank === 2 ? '🥈' : ex.rank === 3 ? '🥉' : '#' + ex.rank}
                                        Rank #{ex.rank} • {ex.tier || 'S-Tier'}
                                      </span>
                                    ) : (
                                      <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] font-mono text-[#ff2a3b]">
                                        Exercise
                                      </span>
                                    )}

                                    {ex.hypertrophyScore && (
                                      <span className="rounded-full bg-[#000000] border border-[#ffffff]/10 px-2 py-0.5 text-[10px] font-mono text-[#a1a1aa]">
                                        {ex.hypertrophyScore}/100
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-[11px] font-mono text-[#a1a1aa]">
                                    {ex.muscleGroup || 'General'}
                                  </span>
                                </div>

                                {/* Name & Target Head */}
                                <div className="mt-2">
                                  <h4 className="text-sm font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                                    {ex.name}
                                  </h4>
                                  {ex.targetHead && (
                                    <p className="text-[11px] font-mono text-[#a1a1aa]">
                                      Target: <span className="text-[#ffffff]">{ex.targetHead}</span>
                                    </p>
                                  )}
                                </div>

                                {/* Biomechanical advantage badge */}
                                {ex.biomechanicalAdvantage && (
                                  <div className="mt-2 inline-flex items-center gap-1 rounded border border-[#ff2a3b]/20 bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-mono text-[#ff2a3b]">
                                    <span>⚡</span>
                                    <span>{ex.biomechanicalAdvantage}</span>
                                  </div>
                                )}

                                {/* Evidence Rationale */}
                                {ex.evidenceRationale && (
                                  <p className="mt-2 text-[11px] leading-relaxed text-[#a1a1aa] line-clamp-2">
                                    {ex.evidenceRationale}
                                  </p>
                                )}
                              </div>

                              {/* Footer of Card */}
                              <div className="mt-3 flex items-center justify-between border-t border-[#ffffff]/10 pt-2 text-[11px]">
                                {ex.recommendedRepRange ? (
                                  <span className="rounded bg-[#000000] px-2 py-0.5 font-mono text-[#a1a1aa] border border-[#ffffff]/10">
                                    Sug: {ex.recommendedSets || 3} sets × {ex.recommendedRepRange}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-[#71717a]">3 sets × 10 reps</span>
                                )}

                                <div className="flex items-center gap-1 font-mono text-xs font-bold">
                                  {isSelected ? (
                                    <span className="inline-flex items-center gap-1 text-[#ff2a3b]">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Selected
                                    </span>
                                  ) : (
                                    <span className="text-[#71717a] group-hover:text-[#ff2a3b]">
                                      Select
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Footer with Sets, Reps and Add button */}
                <div className="border-t border-[#ffffff]/10 bg-[#000000] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold uppercase text-[#ffffff]">
                        {canonicalExercises.find((e) => e.id === selectedExerciseId)?.name || 'No exercise selected'}
                      </div>
                      <p className="text-[11px] text-[#a1a1aa]">
                        Configure sets and reps for this workout entry.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-mono font-bold text-[#a1a1aa]">Sets:</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={entrySetsInput}
                          onChange={(e) => setEntrySetsInput(e.target.value)}
                          className="w-16 rounded-lg border border-[#ffffff]/20 bg-[#0d0d0d] px-2 py-1 text-center text-xs font-mono font-bold text-[#ff2a3b] focus:border-[#ff2a3b] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-mono font-bold text-[#a1a1aa]">Reps:</label>
                        <input
                          type="number"
                          min="1"
                          max="200"
                          value={entryRepsInput}
                          onChange={(e) => setEntryRepsInput(e.target.value)}
                          className="w-16 rounded-lg border border-[#ffffff]/20 bg-[#0d0d0d] px-2 py-1 text-center text-xs font-mono font-bold text-[#ff2a3b] focus:border-[#ff2a3b] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAddExercise}
                        disabled={!selectedExerciseId}
                        className="kinetik-btn-lime px-4 py-2 text-xs font-extrabold uppercase disabled:opacity-50 min-h-[38px]"
                      >
                        Add Exercise to Day
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Edit Sets, Reps & YouTube Tutorial Link */}
      {editEntryModalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl border border-[#ff2a3b]/30 bg-[#0d0d0d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#ffffff]/20 sm:hidden" />
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-[#ffffff]">
              Edit Prescription: {editingEntry.exerciseName}
            </h3>

            {editEntryError && (
              <p className="mt-2 text-xs font-mono text-red-400">{editEntryError}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                  Sets (1–20)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editingEntry.sets}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, sets: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                  Reps (1–200)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={editingEntry.reps}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, reps: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* YouTube Tutorial Link Field */}
            <div className="mt-3.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                YouTube Tutorial Link (optional)
              </label>
              <div className="relative mt-1">
                <input
                  type="url"
                  value={editingEntry.videoUrl}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-[#ffffff]/15 bg-[#000000] px-3.5 py-2.5 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                />
              </div>
              <p className="mt-1 text-[11px] font-mono text-[#71717a]">
                Provide or update the YouTube tutorial URL for this movement.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-[#ffffff]/10 pt-3">
              <button
                onClick={() => setEditEntryModalOpen(false)}
                className="kinetik-btn-dark px-4 py-2.5 text-xs font-mono font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedEntry}
                className="kinetik-btn-lime px-4 py-2.5 text-xs font-extrabold uppercase min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
