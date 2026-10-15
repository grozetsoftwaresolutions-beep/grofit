'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  Search,
  ChevronRight,
  ShieldCheck,
  Filter,
  Award,
  Sparkles,
  Play,
  ExternalLink,
  Video,
} from 'lucide-react';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  sourceReference: string | null;
  sortOrder: number;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string | null;
  sourceReference: string | null;
  videoUrl?: string | null;
  videoCredit?: string | null;
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
}

export default function WorkoutPlansPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'library'>('templates');

  // Templates state
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Library state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [topRankedOnly, setTopRankedOnly] = useState<boolean>(true);

  const muscleGroups = [
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

  // Fetch templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        const res = await fetch('/api/workout-templates');
        if (!res.ok) throw new Error('Failed to load templates.');
        const json = await res.json();
        setTemplates(json.data || []);
      } catch (err: unknown) {
        setTemplateError(err instanceof Error ? err.message : 'Error loading templates.');
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // Fetch exercises when library tab is selected
  useEffect(() => {
    if (activeTab === 'library' && exercises.length === 0) {
      async function loadExercises() {
        try {
          setLoadingExercises(true);
          const res = await fetch('/api/exercises');
          if (!res.ok) throw new Error('Failed to load exercises.');
          const json = await res.json();
          setExercises(json.data || []);
        } catch {
          // ignore
        } finally {
          setLoadingExercises(false);
        }
      }
      loadExercises();
    }
  }, [activeTab, exercises.length]);

  const filteredExercises = exercises.filter((ex) => {
    const matchesMuscle =
      selectedMuscle === 'All' ||
      (ex.muscleGroup && ex.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase());

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ex.name.toLowerCase().includes(query) ||
      (ex.muscleGroup && ex.muscleGroup.toLowerCase().includes(query)) ||
      (ex.targetHead && ex.targetHead.toLowerCase().includes(query)) ||
      (ex.biomechanicalAdvantage && ex.biomechanicalAdvantage.toLowerCase().includes(query));

    const matchesRank = !topRankedOnly || (ex.rank !== null && ex.rank !== undefined && ex.rank <= 5);

    return matchesSearch && matchesMuscle && matchesRank;
  });

  return (
    <div className="space-y-4 sm:space-y-8 min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
          Workout Templates
        </h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-zinc-400">
          Discover vetted workout templates and browse the canonical exercise library.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors shrink-0 min-h-[38px] sm:min-h-[44px] ${
            activeTab === 'templates'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Templates Catalogue
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 sm:gap-2 border-b-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors shrink-0 min-h-[38px] sm:min-h-[44px] ${
            activeTab === 'library'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Exercise Library
        </button>
      </div>

      {/* Templates Content */}
      {activeTab === 'templates' && (
        <div className="space-y-4 sm:space-y-6">
          {loadingTemplates ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/90">
              <div className="text-center">
                <Dumbbell className="mx-auto h-8 w-8 animate-spin text-white" />
                <p className="mt-2 text-xs sm:text-sm text-zinc-400">
                  Loading verified workout templates...
                </p>
              </div>
            </div>
          ) : templateError ? (
            <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5 sm:p-6 text-red-400 text-xs sm:text-sm">
              {templateError}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 sm:p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-zinc-400" />
              <h3 className="mt-3 text-sm sm:text-base font-semibold text-white">
                No templates published
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Check back soon for curated fitness splits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="min-w-0 flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/90 p-4 sm:p-6 shadow-sm transition hover:border-zinc-700"
                >
                  <div className="space-y-2.5 sm:space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-white shrink-0">
                        <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Source Verified
                      </span>
                      <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
                        {tpl.name.includes('3-Day')
                          ? '3-Day Split'
                          : tpl.name.includes('4-Day')
                            ? '4-Day Split'
                            : '6-Day Split'}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-white break-words">
                      {tpl.name}
                    </h2>

                    {tpl.sourceReference && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/80 font-medium min-w-0">
                        <span className="font-semibold text-white shrink-0">Credits:</span>
                        <span className="truncate min-w-0 text-zinc-300">
                          {tpl.name.includes('6-Day')
                            ? 'Jeff Nippard, RP, Scott Herman, Squat Univ & more'
                            : tpl.sourceReference}
                        </span>
                      </div>
                    )}

                    <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3 sm:line-clamp-none break-words">
                      {tpl.description || 'Curated workout programme sourced from verified fitness documentation.'}
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-6 border-t border-zinc-800/80 pt-3 sm:pt-4">
                    <Link
                      href={`/app/workout-plans/${tpl.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-black shadow-sm transition hover:bg-zinc-200 active:scale-95 min-h-[42px] sm:min-h-[44px]"
                    >
                      View Template Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exercise Library Content */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Evidence banner */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Evidence-Based Hypertrophy Directory
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Peer-reviewed rankings with at least 5 top workouts per muscle group, with verified YouTube tutorials & credits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTopRankedOnly(!topRankedOnly)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition active:scale-95 min-h-[40px] ${
                  topRankedOnly
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Top 5 Ranked Only</span>
                {topRankedOnly && <span className="text-[10px] opacity-80">(Active)</span>}
              </button>
            </div>
          </div>

          {/* Controls: Search & Horizontal Scroll Muscle Chips on Mobile */}
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise name, target head, or mechanism..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
              />
            </div>

            {/* Muscle Filter Horizontal Scrolling Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              <Filter className="h-4 w-4 text-zinc-400 mr-1 shrink-0 hidden sm:inline-block" />
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition active:scale-95 min-h-[34px] ${
                    selectedMuscle === muscle
                      ? 'bg-zinc-900 text-white font-semibold dark:bg-white dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Grid */}
          {loadingExercises ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-center">
                <Dumbbell className="mx-auto h-8 w-8 animate-spin text-zinc-900 dark:text-white" />
                <p className="mt-2 text-xs sm:text-sm text-zinc-500">Loading evidence-based exercises...</p>
              </div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <BookOpen className="mx-auto h-12 w-12 text-zinc-400" />
              <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-white">
                No exercises found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Try adjusting your search query or switching the muscle filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="min-w-0 flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/90 p-4 sm:p-5 shadow-sm transition hover:border-zinc-700"
                >
                  <div className="min-w-0">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ex.rank ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              ex.rank === 1
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                : ex.rank === 2
                                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                                : ex.rank === 3
                                ? 'bg-zinc-200/80 text-zinc-800 dark:bg-zinc-700/80 dark:text-zinc-200'
                                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {ex.rank === 1 ? '👑' : ex.rank === 2 ? '🥈' : ex.rank === 3 ? '🥉' : '#' + ex.rank}
                            Rank #{ex.rank} • {ex.tier || 'S-Tier'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            Canonical
                          </span>
                        )}

                        {ex.hypertrophyScore && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {ex.hypertrophyScore}/100 Score
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                        {ex.muscleGroup || 'General'}
                      </span>
                    </div>

                    {/* Title & Target */}
                    <h3 className="mt-2.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                      {ex.name}
                    </h3>
                    {ex.targetHead && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Target: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{ex.targetHead}</span>
                      </p>
                    )}

                    {/* Biomechanical mechanism */}
                    {ex.biomechanicalAdvantage && (
                      <div className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <span>⚡</span>
                        <span>{ex.biomechanicalAdvantage}</span>
                      </div>
                    )}

                    {/* Evidence Rationale */}
                    {ex.evidenceRationale && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {ex.evidenceRationale}
                      </p>
                    )}

                    {/* YouTube Tutorial & Creator Credits */}
                    {ex.videoUrl && (
                      <div className="mt-3.5 flex items-center justify-between gap-2.5 rounded-xl border border-red-500/20 bg-red-950/25 p-2.5 sm:p-3 transition-colors hover:border-red-500/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/30">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </span>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400">
                              Tutorial Video
                            </span>
                            <span className="block text-xs font-semibold text-zinc-100 truncate" title={`Credit: ${ex.videoCredit || 'Fitness Educator'}`}>
                              Credit: {ex.videoCredit || 'Fitness Educator'}
                            </span>
                          </div>
                        </div>

                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow transition-all duration-150 min-h-[32px]"
                        >
                          <span>Watch</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      {ex.recommendedRepRange ? (
                        <span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {ex.recommendedSets || 3} sets × {ex.recommendedRepRange}
                        </span>
                      ) : (
                        <span className="text-zinc-400">3 sets × 10 reps</span>
                      )}

                      {ex.scientificReference && (
                        <span className="text-[10px] text-zinc-400 truncate max-w-[140px]" title={ex.scientificReference}>
                          {ex.scientificReference.split(';')[0].split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
