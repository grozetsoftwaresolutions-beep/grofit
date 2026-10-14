'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  CalendarCheck,
  Utensils,
  CheckSquare,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
  ShieldCheck,
  ChevronRight,
  Clock,
  Check,
  Plus,
  Scale,
  Activity,
  Zap,
} from 'lucide-react';

interface QuickHabit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
}

export default function AppPage() {
  const [greeting, setGreeting] = useState('Welcome back');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [rankedTab, setRankedTab] = useState<'chest' | 'back' | 'legs' | 'arms'>('chest');

  // Interactive Quick Habits check-off state for home dashboard
  const [habits, setHabits] = useState<QuickHabit[]>([
    { id: 'h1', name: 'Hit 160g Daily Protein Target', category: 'Nutrition', completed: true },
    { id: 'h2', name: 'Log Today’s Workout Session', category: 'Training', completed: true },
    { id: 'h3', name: 'Drink 3L of Water', category: 'Hydration', completed: false },
    { id: 'h4', name: '8 Hours Restorative Sleep', category: 'Recovery', completed: false },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDateStr(new Date().toLocaleDateString(undefined, options));
  }, []);

  function toggleHabit(id: string) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  }

  const completedCount = habits.filter((h) => h.completed).length;

  const exerciseRankings = {
    chest: [
      { rank: 1, name: 'Incline Dumbbell Bench Press', tag: '30° Incline / 91% Clavicular EMG', source: 'Barnett et al. (1995)' },
      { rank: 2, name: 'Flat Barbell Bench Press', tag: 'Maximum Sternocostal Mechanical Tension', source: 'Schoenfeld (2020)' },
      { rank: 3, name: 'Chest Dips (Bodyweight or Weighted)', tag: 'High Lower-Pectoral Motor Unit Recruitment', source: 'Contreras (2010)' },
    ],
    back: [
      { rank: 1, name: 'Chest-Supported T-Bar Row', tag: 'Spinal Sparing Lat & Rhomboid Tension', source: 'Lehman et al. (2004)' },
      { rank: 2, name: 'Neutral-Grip Lat Pulldown / Pull-Up', tag: 'Maximum Latissimus Dorsi Stretch', source: 'Andersen et al. (2014)' },
      { rank: 3, name: 'Single-Arm Dumbbell Row', tag: 'Full Range Deep Iliac Lat Excursion', source: 'Contreras (2010)' },
    ],
    legs: [
      { rank: 1, name: 'Barbell Back Squat / Hack Squat', tag: 'High Quad Mechanical Overload', source: 'Schoenfeld (2016)' },
      { rank: 2, name: 'Romanian Deadlift (RDL)', tag: 'Loaded Lengthened Hamstring Stretch', source: 'Maeo et al. (2021)' },
      { rank: 3, name: 'Bulgarian Split Squat', tag: 'Unilateral Glute & Quad Hypertrophy', source: 'McCurdy et al. (2010)' },
    ],
    arms: [
      { rank: 1, name: 'Incline Dumbbell Biceps Curl', tag: 'Max Long Head Stretch Under Load', source: 'Oliveira et al. (2009)' },
      { rank: 2, name: 'Overhead Cable Triceps Extension', tag: 'Long Head Stretch-Mediated Hypertrophy', source: 'Maeo et al. (2022)' },
      { rank: 3, name: 'Cross-Body Cable Triceps Pushdown', tag: 'Continuous Lateral & Medial Head Tension', source: 'Busch (2018)' },
    ],
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Hero Greeting & Quick Actions */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-64 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                <Sparkles className="h-3 w-3 text-white" />
                Evidence-Based Member Dashboard
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {currentDateStr || 'Today'}
              </span>
            </div>

            <h1 className="mt-2.5 text-2xl sm:text-4xl font-black tracking-tight text-white">
              {greeting}, Athlete!
            </h1>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Track your calibrated splits, log IFCT lab-verified foods, maintain daily streaks, and maximize hypertrophy with sports biomechanics.
            </p>
          </div>

          {/* Quick Streak Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-black/60 p-4 sm:p-5 backdrop-blur shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="h-6 w-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-white">14</span>
                <span className="text-xs font-semibold text-amber-400">Days Active</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Current Consistency Streak
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/app/workout-plans"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group"
          >
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-white" />
              <span>Workout Plans</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <Link
            href="/app/my-workout-plan"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group"
          >
            <span className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-white" />
              <span>My Workout Plan</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <Link
            href="/app/diet-foods"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group"
          >
            <span className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-white" />
              <span>Diet & Foods</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          <Link
            href="/app/calorie-calculator"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group"
          >
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-white" />
              <span>Macro Calculator</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>
        </div>
      </section>

      {/* Two-Column Core Status Cards: Today's Routine & Today's Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Training Split Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                <Dumbbell className="h-3.5 w-3.5 text-white" />
                Active Workout Split
              </span>
              <span className="text-xs font-mono text-zinc-500">Day 1 Routine</span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-white">
              Home Calisthenics & Strength Split
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Curated biomechanics split sourced from Calisthenicmovement & FitnessFAQs
            </p>

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white">Pull-Ups (Overhand)</p>
                    <p className="text-[11px] text-zinc-400">Latissimus dorsi & elbow flexors</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-zinc-300 bg-black/60 px-2.5 py-1 rounded-md border border-zinc-800">
                  3 × 8-12 reps
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white">Deficit Push-Ups</p>
                    <p className="text-[11px] text-zinc-400">Deep chest stretch & serratus anterior</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-zinc-300 bg-black/60 px-2.5 py-1 rounded-md border border-zinc-800">
                  3 × 12-15 reps
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white">Parallel Bar Dips</p>
                    <p className="text-[11px] text-zinc-400">Lower pectoral & triceps recruitment</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-zinc-300 bg-black/60 px-2.5 py-1 rounded-md border border-zinc-800">
                  3 × 8-10 reps
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
            <Link
              href="/app/my-workout-plan"
              className="text-xs text-zinc-400 hover:text-white transition font-medium"
            >
              Customize in My Workout Plan →
            </Link>
            <Link
              href="/app/workout-plans"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-sm"
            >
              <span>View All Routines</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Today's Nutrition & Macro Targets Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                <Utensils className="h-3.5 w-3.5 text-white" />
                Nutritional Plan &amp; IFCT 2017
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">Target: 2,400 kcal</span>
            </div>

            <h2 className="mt-4 text-xl font-bold text-white">
              High-Protein Hypertrophy Fuel
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Gram-accurate macronutrient distribution based on clinical Mifflin-St Jeor formulas
            </p>

            {/* Macro Bars */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Protein</span>
                <p className="mt-1 text-lg sm:text-xl font-black text-white">160g</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '85%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">640 kcal (27%)</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Carbs</span>
                <p className="mt-1 text-lg sm:text-xl font-black text-white">260g</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '70%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">1,040 kcal (43%)</span>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Fats</span>
                <p className="mt-1 text-lg sm:text-xl font-black text-white">65g</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '60%' }} />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">585 kcal (24%)</span>
              </div>
            </div>

            {/* Quick Sample Items */}
            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-xs flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-white" />
                <span>Lab-analyzed staples: Chicken breast, boiled eggs, ponni rice, lentils</span>
              </span>
              <span className="font-semibold text-white">40+ Foods</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
            <Link
              href="/app/calorie-calculator"
              className="text-xs text-zinc-400 hover:text-white transition font-medium"
            >
              Recalculate BMR / TDEE →
            </Link>
            <Link
              href="/app/diet-foods"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-sm"
            >
              <span>Manage Meal Plans</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Daily Habits Interactive Checklist */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                <CheckSquare className="h-3.5 w-3.5 text-white" />
                Daily Habit Routine
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {completedCount} of {habits.length} Completed Today
              </span>
            </div>
            <h2 className="mt-3 text-xl sm:text-2xl font-bold text-white">
              Consistency Builds The Physique
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Tap any habit below to mark your progress for today. Streaks update automatically.
            </p>
          </div>

          <Link
            href="/app/habits"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white self-start sm:self-auto"
          >
            <span>Full Streak History &amp; PDF Reports</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                habit.completed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-white shadow-sm'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                  habit.completed
                    ? 'border-emerald-400 bg-emerald-500 text-black'
                    : 'border-zinc-700 bg-zinc-800'
                }`}
              >
                {habit.completed && <Check className="h-4 w-4 stroke-[3]" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {habit.category}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white mt-0.5 leading-snug">
                  {habit.name}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {habit.completed ? '✓ Logged for today' : 'Tap to check-in'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Top 5 Ranked Biomechanical Exercises Explorer */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Sports Science Biomechanics
            </span>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">
              Canonical Exercise Rankings
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400">
              Peer-reviewed EMG tension ratings to select exercises with guaranteed hypertrophic return.
            </p>
          </div>

          {/* Muscle Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1">
            {(['chest', 'back', 'legs', 'arms'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRankedTab(tab)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                  rankedTab === tab
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {exerciseRankings[rankedTab].map((item) => (
            <div
              key={item.rank}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 font-mono font-bold text-white text-xs">
                  #{item.rank}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">{item.name}</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{item.tag}</p>
                </div>
              </div>

              <div className="mt-2 sm:mt-0 flex items-center gap-1.5 self-end sm:self-center text-[10px] font-mono text-zinc-400 bg-black/60 px-2.5 py-1 rounded-md border border-zinc-800">
                <ShieldCheck className="h-3 w-3 text-zinc-400" />
                <span>{item.source}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-900 text-center">
          <Link
            href="/app/workout-plans"
            className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:text-zinc-300 underline underline-offset-4"
          >
            <span>Explore all 24 canonical exercises and video form tutorials in the Workout Library</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Complete Platform Navigation Cards */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Platform Modules</h2>
          <p className="text-xs text-zinc-400">Everything you need to sculpt and optimize your body</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/app/workout-plans"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                Workout Plans
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Browse canonical exercise rankings, EMG studies, and full routine templates with video tutorials.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Explore Plans</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/app/my-workout-plan"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                My Workout Plan
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Build your custom daily splits with warmups, target rep ranges, load tracking, and supersets.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Open My Plan</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/app/diet-foods"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <Utensils className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                Diet &amp; Foods
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Track meals using lab-analyzed ICMR-NIN nutritional databases with gram-level portion scaling.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>View Food Database</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/app/habits"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                Habit Tracker
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Log daily check-ins in your timezone, build unbreakable streaks, and generate printable reports.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Track Habits</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/app/calorie-calculator"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                Calorie &amp; Macro Calculator
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Mifflin-St Jeor clinical BMR/TDEE math with safety guardrails and personalized macro splits.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Calculate Macros</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/app/settings"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/50 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white group-hover:text-zinc-200">
                Account &amp; Settings
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Manage profile name, application timezone, measurement units, and download full data export.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Manage Settings</span>
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
