'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ElectricBorder from '@/components/ElectricBorder';
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
  ArrowUpRight,
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

function getFullCredits(tpl: WorkoutTemplate): string {
  if (tpl.name.includes('6-Day')) {
    return 'Jeff Nippard • Renaissance Periodization (Dr. Mike Israetel) • Scott Herman • Squat University • Sean Nalewanyj';
  }
  if (tpl.name.includes('4-Day')) {
    return 'DADBODS • Science-Based Hypertrophy & Verified Biomechanics';
  }
  if (tpl.name.includes('3-Day') || tpl.name.toLowerCase().includes('calisthenic')) {
    return 'Calisthenicmovement • FitnessFAQs • SaturnoMovement • Minus The Gym';
  }
  return tpl.sourceReference || 'Verified Sports Science Documentation';
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
    <div className="space-y-6 sm:space-y-8 min-w-0">
      {/* Header */}
      <div>
        <span className="eyebrow">01 / TRAINING PROGRAMMES</span>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#ffffff] uppercase">
          WORKOUT <em>TEMPLATES.</em>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa]">
          Discover vetted scientific workout templates and browse the canonical sports science exercise library.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#ffffff]/10 overflow-x-auto no-scrollbar gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
            activeTab === 'templates'
              ? 'border-[#ff2a3b] text-[#ff2a3b]'
              : 'border-transparent text-[#a1a1aa] hover:text-[#ffffff]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Templates Catalogue</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
            activeTab === 'library'
              ? 'border-[#ff2a3b] text-[#ff2a3b]'
              : 'border-transparent text-[#a1a1aa] hover:text-[#ffffff]'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Exercise Library</span>
        </button>
      </div>

      {/* Templates Content */}
      {activeTab === 'templates' && (
        <div className="space-y-4 sm:space-y-6">
          {loadingTemplates ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d]">
              <div className="text-center">
                <Dumbbell className="mx-auto h-8 w-8 animate-spin text-[#ff2a3b]" />
                <p className="mt-3 text-xs sm:text-sm font-mono tracking-wider text-[#a1a1aa] uppercase">
                  Loading verified workout templates...
                </p>
              </div>
            </div>
          ) : templateError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 sm:p-6 text-red-400 text-xs sm:text-sm font-mono">
              {templateError}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d] p-8 sm:p-12 text-center">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#71717a]" />
              <h3 className="mt-3 text-sm sm:text-base font-bold uppercase text-[#ffffff]">
                No templates published
              </h3>
              <p className="mt-1 text-xs text-[#a1a1aa]">
                Check back soon for curated fitness splits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {templates.map((tpl) => (
                <ElectricBorder key={tpl.id} borderRadius={20} className="h-full">
                  <div
                    className="kinetik-card p-5 sm:p-6 flex flex-col justify-between h-full"
                  >
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#ffffff]/10">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2a3b]/30 bg-[#1a1a1a] px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#ff2a3b] uppercase shrink-0">
                        <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        Source Verified
                      </span>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#a1a1aa] shrink-0">
                        {tpl.name.includes('3-Day')
                          ? '3-Day Split'
                          : tpl.name.includes('4-Day')
                            ? '4-Day Split'
                            : '6-Day Split'}
                      </span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#ffffff] break-words">
                      {tpl.name}
                    </h2>

                    {tpl.sourceReference && (() => {
                      const fullCredits = getFullCredits(tpl);
                      return (
                        <div
                          className="group/credit relative flex items-center bg-[#000000] px-3 py-1.5 rounded-xl border border-[#ffffff]/10 font-mono text-xs overflow-hidden cursor-default shadow-sm"
                          title={`Full Credits: ${fullCredits}`}
                        >
                          {/* Pinned Red Credits Label */}
                          <div className="z-10 bg-[#000000] pr-2 flex items-center gap-1 shrink-0 font-bold text-[#ff2a3b] border-r border-[#ffffff]/10 mr-2">
                            <span>Credits:</span>
                          </div>

                          {/* Smooth Right Edge Gradient Mask */}
                          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-black to-transparent z-10" />

                          {/* Continuous Marquee Ticker Track */}
                          <div className="overflow-hidden flex-1 relative flex items-center">
                            <div className="animate-credit-marquee flex items-center gap-6 shrink-0 text-[#ffffff]">
                              <span>{fullCredits}</span>
                              <span className="text-[#ff2a3b]">✦</span>
                              <span>{fullCredits}</span>
                              <span className="text-[#ff2a3b]">✦</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <p className="text-xs leading-relaxed text-[#a1a1aa] line-clamp-3 sm:line-clamp-none break-words">
                      {tpl.description || 'Curated workout programme sourced from verified fitness documentation.'}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-[#ffffff]/10 pt-4">
                    <Link
                      href={`/app/workout-plans/${tpl.id}`}
                      className="kinetik-btn-lime w-full py-2.5 text-xs font-extrabold uppercase shadow-sm flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <span>View Template Details</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </ElectricBorder>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Exercise Library Content */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Evidence banner */}
          <div className="rounded-3xl border border-[#ffffff]/10 bg-[#0d0d0d] p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#ff2a3b]/30 text-[#ff2a3b] shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#ffffff] uppercase">
                    Evidence-Based Hypertrophy Directory
                  </h3>
                  <p className="text-xs text-[#a1a1aa]">
                    Peer-reviewed rankings with at least 5 top workouts per muscle group and verified video tutorial credits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTopRankedOnly(!topRankedOnly)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer min-h-[40px] ${
                  topRankedOnly
                    ? 'border-[#ff2a3b] bg-[#ff2a3b] text-white shadow-md'
                    : 'border-[#ffffff]/10 bg-[#000000] text-[#a1a1aa] hover:text-[#ffffff]'
                }`}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Top 5 Ranked Only</span>
                {topRankedOnly && <span className="text-[10px] opacity-80">(Active)</span>}
              </button>
            </div>
          </div>

          {/* Controls: Search & Muscle Chips */}
          <div className="space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#71717a]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercise name, target head, or mechanism..."
                className="w-full rounded-2xl border border-[#ffffff]/10 bg-[#000000] py-3 pl-10 pr-4 text-xs sm:text-sm text-[#ffffff] placeholder-[#71717a] focus:border-[#ff2a3b] focus:outline-none transition-colors min-h-[44px]"
              />
            </div>

            {/* Muscle Filter Horizontal Scrolling Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              <Filter className="h-4 w-4 text-[#71717a] mr-1 shrink-0 hidden sm:inline-block" />
              {muscleGroups.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition cursor-pointer min-h-[34px] ${
                    selectedMuscle === muscle
                      ? 'bg-[#ff2a3b] text-white shadow-md'
                      : 'bg-[#0d0d0d] text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a] border border-[#ffffff]/10'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Grid */}
          {loadingExercises ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d]">
              <div className="text-center">
                <Dumbbell className="mx-auto h-8 w-8 animate-spin text-[#ff2a3b]" />
                <p className="mt-2 text-xs sm:text-sm font-mono text-[#a1a1aa] uppercase">Loading evidence-based exercises...</p>
              </div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d] p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-[#71717a]" />
              <h3 className="mt-3 text-base font-bold uppercase text-[#ffffff]">
                No exercises found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#a1a1aa]">
                Try adjusting your search query or switching the muscle filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((ex) => (
                <ElectricBorder key={ex.id} borderRadius={20} className="h-full">
                  <div
                    className="kinetik-card p-5 flex flex-col justify-between h-full"
                  >
                  <div className="min-w-0">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-[#ffffff]/10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ex.rank ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase ${
                              ex.rank === 1
                                ? 'bg-[#ff2a3b] text-white'
                                : ex.rank === 2
                                ? 'bg-[#1a1a1a] text-[#ff2a3b] border border-[#ff2a3b]/30'
                                : 'bg-[#000000] text-[#a1a1aa] border border-[#ffffff]/10'
                            }`}
                          >
                            #{ex.rank} • {ex.tier || 'S-Tier'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#000000] px-2.5 py-0.5 text-[11px] font-mono text-[#a1a1aa] border border-[#ffffff]/10">
                            Canonical
                          </span>
                        )}

                        {ex.hypertrophyScore && (
                          <span className="rounded-full bg-[#000000] px-2 py-0.5 text-[10px] font-mono text-[#ff2a3b] border border-[#ffffff]/10">
                            {ex.hypertrophyScore}/100 SCORE
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-[#a1a1aa] uppercase shrink-0">
                        {ex.muscleGroup || 'General'}
                      </span>
                    </div>

                    {/* Title & Target */}
                    <h3 className="mt-3 font-display text-lg font-bold text-[#ffffff]">
                      {ex.name}
                    </h3>
                    {ex.targetHead && (
                      <p className="text-xs text-[#a1a1aa] mt-0.5 font-mono">
                        TARGET: <span className="text-[#ffffff] font-bold">{ex.targetHead}</span>
                      </p>
                    )}

                    {/* Biomechanical mechanism */}
                    {ex.biomechanicalAdvantage && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#ffffff]/10 bg-[#000000] px-2.5 py-1 text-[11px] font-mono text-[#ff2a3b]">
                        <span>⚡</span>
                        <span>{ex.biomechanicalAdvantage}</span>
                      </div>
                    )}

                    {/* Evidence Rationale */}
                    {ex.evidenceRationale && (
                      <p className="mt-2.5 text-xs leading-relaxed text-[#a1a1aa]">
                        {ex.evidenceRationale}
                      </p>
                    )}

                    {/* YouTube Tutorial & Creator Credits */}
                    {ex.videoUrl && (
                      <div className="mt-4 flex items-center justify-between gap-2.5 rounded-2xl border border-red-500/20 bg-red-950/20 p-2.5 sm:p-3 transition-colors hover:border-red-500/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/30">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </span>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                              Tutorial Video
                            </span>
                            <span className="block text-xs font-semibold text-white truncate" title={`Credit: ${ex.videoCredit || 'Fitness Educator'}`}>
                              {ex.videoCredit || 'Fitness Educator'}
                            </span>
                          </div>
                        </div>

                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow transition min-h-[32px]"
                        >
                          <span>Watch</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 border-t border-[#ffffff]/10 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      {ex.recommendedRepRange ? (
                        <span className="rounded-lg bg-[#000000] border border-[#ffffff]/10 px-2 py-0.5 font-mono text-[11px] text-[#ff2a3b]">
                          {ex.recommendedSets || 3} SETS × {ex.recommendedRepRange}
                        </span>
                      ) : (
                        <span className="text-[#71717a] font-mono text-[11px]">3 SETS × 10 REPS</span>
                      )}

                      {ex.scientificReference && (
                        <span className="text-[10px] font-mono text-[#71717a] truncate max-w-[140px]" title={ex.scientificReference}>
                          {ex.scientificReference.split(';')[0].split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </ElectricBorder>
            ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
