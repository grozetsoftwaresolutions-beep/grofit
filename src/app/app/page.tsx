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
  Award,
  ShieldCheck,
  ChevronRight,
  Check,
  Plus,
  Scale,
  Loader2,
} from 'lucide-react';

interface ProfileData {
  displayName: string | null;
  email: string | null;
}

interface UserWorkoutPlan {
  id: string;
  name: string;
  dayCount: number;
  todayDayName?: string;
  entries: {
    id: string;
    exerciseName: string;
    muscleGroup: string | null;
    sets: number | null;
    reps: number | null;
  }[];
}

interface UserMealPlan {
  id: string;
  name: string;
  targetKcal: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  itemCount: number;
  sampleFoods: string[];
}

interface UserHabit {
  id: string;
  name: string;
  description: string | null;
  currentStreak: number;
  bestStreak: number;
  isCompletedToday: boolean;
}

export default function AppPage() {
  const [greeting, setGreeting] = useState('Welcome back');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [rankedTab, setRankedTab] = useState<'chest' | 'back' | 'legs' | 'arms'>('chest');

  // Client Customized Data States
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<UserWorkoutPlan | null>(null);
  const [mealPlan, setMealPlan] = useState<UserMealPlan | null>(null);
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [userToday, setUserToday] = useState<string>('');
  const [loadingData, setLoadingData] = useState(true);

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

    // Fetch Client Customized Data
    async function fetchClientDashboardData() {
      try {
        setLoadingData(true);

        // 1. Fetch Profile
        fetch('/api/profile')
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            if (json?.data) {
              setProfile({
                displayName: json.data.displayName,
                email: json.data.email,
              });
            }
          })
          .catch(() => {});

        // 2. Fetch User Workout Plans
        fetch('/api/workout-plans')
          .then((res) => (res.ok ? res.json() : null))
          .then(async (json) => {
            const plans = json?.data || [];
            if (plans.length > 0) {
              // Fetch details of the active/first plan
              const detailRes = await fetch(`/api/workout-plans/${plans[0].id}`);
              if (detailRes.ok) {
                const detailJson = await detailRes.json();
                const planDetail = detailJson.data;
                const firstDay = planDetail.days?.[0];
                setWorkoutPlan({
                  id: planDetail.id,
                  name: planDetail.name,
                  dayCount: planDetail.days?.length || 0,
                  todayDayName: firstDay?.name || 'Day 1',
                  entries: (firstDay?.entries || []).map((e: any) => ({
                    id: e.id,
                    exerciseName: e.exerciseName,
                    muscleGroup: e.muscleGroup,
                    sets: e.sets,
                    reps: e.reps,
                  })),
                });
              }
            } else {
              setWorkoutPlan(null);
            }
          })
          .catch(() => {});

        // 3. Fetch User Meal Plans
        fetch('/api/meal-plans')
          .then((res) => (res.ok ? res.json() : null))
          .then(async (json) => {
            const plans = json?.data || [];
            if (plans.length > 0) {
              const detailRes = await fetch(`/api/meal-plans/${plans[0].id}`);
              if (detailRes.ok) {
                const detailJson = await detailRes.json();
                const plan = detailJson.data;
                const items = plan.items || [];
                const sampleFoodNames = items
                  .slice(0, 4)
                  .map((item: any) => item.food?.name)
                  .filter(Boolean);

                setMealPlan({
                  id: plan.id,
                  name: plan.name,
                  targetKcal: plan.targetKcal,
                  calories: plan.dailyTotals?.energyKcal || 0,
                  protein: plan.dailyTotals?.proteinG || 0,
                  carbs: plan.dailyTotals?.carbohydratesG || 0,
                  fats: plan.dailyTotals?.fatG || 0,
                  itemCount: items.length,
                  sampleFoods: sampleFoodNames,
                });
              }
            } else {
              setMealPlan(null);
            }
          })
          .catch(() => {});

        // 4. Fetch User Habits (To-Do List)
        fetch('/api/habits')
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            if (json) {
              const list: UserHabit[] = (json.data || []).map((h: any) => ({
                id: h.id,
                name: h.name,
                description: h.description,
                currentStreak: h.currentStreak || 0,
                bestStreak: h.bestStreak || 0,
                isCompletedToday: Boolean(h.isCompletedToday),
              }));
              setHabits(list);
              const todayStr = json.meta?.today || new Date().toISOString().split('T')[0];
              setUserToday(todayStr);
            }
          })
          .catch(() => {});
      } finally {
        setLoadingData(false);
      }
    }

    fetchClientDashboardData();
  }, []);

  async function toggleHabit(habitId: string) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayDate = userToday || new Date().toISOString().split('T')[0];
    const willBeCompleted = !habit.isCompletedToday;

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habitId
          ? {
              ...h,
              isCompletedToday: willBeCompleted,
              currentStreak: willBeCompleted
                ? h.currentStreak + 1
                : Math.max(0, h.currentStreak - 1),
            }
          : h
      )
    );

    try {
      const method = willBeCompleted ? 'POST' : 'DELETE';
      const res = await fetch(`/api/habits/${habitId}/logs/${todayDate}`, { method });
      if (!res.ok) {
        // Revert on error
        setHabits((prev) => prev.map((h) => (h.id === habitId ? habit : h)));
      }
    } catch {
      // Revert on network error
      setHabits((prev) => prev.map((h) => (h.id === habitId ? habit : h)));
    }
  }

  const completedCount = habits.filter((h) => h.isCompletedToday).length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak || 0)) : 0;

  const clientGreetingName =
    profile?.displayName ||
    (profile?.email ? profile.email.split('@')[0] : 'Athlete');

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
    <div className="space-y-6 sm:space-y-8 pb-12 min-w-0">
      {/* Dashboard Hero Greeting & Quick Actions */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black p-5 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-64 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
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

            <h1 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white capitalize">
              {greeting}, {clientGreetingName}!
            </h1>
            <p className="mt-1 max-w-xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Track your calibrated splits, log IFCT lab-verified foods, maintain daily streaks, and maximize hypertrophy with sports biomechanics.
            </p>
          </div>

          {/* Dynamic Client Consistency Streak Card */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-800 bg-black/60 p-3.5 sm:p-5 backdrop-blur shrink-0 self-start md:self-auto">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">{maxStreak}</span>
                <span className="text-xs font-semibold text-amber-400">
                  {maxStreak === 1 ? 'Day Active' : 'Days Active'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                Current Consistency Streak
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/app/workout-plans"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Dumbbell className="h-4 w-4 text-white shrink-0" />
              <span className="truncate">Workout Templates</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/my-workout-plan"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarCheck className="h-4 w-4 text-white shrink-0" />
              <span className="truncate">My Workout Plan</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/diet-foods"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Utensils className="h-4 w-4 text-white shrink-0" />
              <span className="truncate">Diet &amp; Foods</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/calorie-calculator"
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs font-semibold text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Scale className="h-4 w-4 text-white shrink-0" />
              <span className="truncate">Macro Calculator</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:text-white shrink-0 ml-1" />
          </Link>
        </div>
      </section>

      {/* Two-Column Core Status Cards: Client's Customized Workout Routine & Client's Customized Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Client's Customized Workout Routine Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 flex flex-col justify-between shadow-xl min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 shrink-0">
                <Dumbbell className="h-3.5 w-3.5 text-white" />
                {workoutPlan ? `Active Split (${workoutPlan.dayCount} Days)` : 'Active Workout Split'}
              </span>
              <span className="text-xs font-mono text-zinc-400 shrink-0 truncate">
                {workoutPlan?.todayDayName || 'Personalized Routine'}
              </span>
            </div>

            <h2 className="mt-3.5 text-lg sm:text-xl font-bold text-white break-words">
              {workoutPlan ? workoutPlan.name : 'Start Your First Workout Split'}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {workoutPlan
                ? `Customized workout split with target prescriptions and volume tracking`
                : 'Select from vetted scientific splits or create your own custom exercise routine.'}
            </p>

            {workoutPlan ? (
              <div className="mt-4 space-y-2">
                {workoutPlan.entries.length > 0 ? (
                  workoutPlan.entries.slice(0, 3).map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700 min-w-0 gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">
                            {entry.exerciseName}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {entry.muscleGroup || 'Target Muscle'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-300 bg-black/60 px-2.5 py-1 rounded-md border border-zinc-800 shrink-0">
                        {entry.sets || 3} × {entry.reps || 10} reps
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-center text-xs text-zinc-400">
                    No exercises added to this split yet. Customize your routine in My Workout Plan.
                  </div>
                )}
                {workoutPlan.entries.length > 3 && (
                  <p className="text-center text-[11px] text-zinc-500 pt-1">
                    +{workoutPlan.entries.length - 3} more exercises in this session
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-5 text-center">
                <Dumbbell className="mx-auto h-8 w-8 text-zinc-500" />
                <p className="mt-2 text-xs font-semibold text-white">No active workout plan yet</p>
                <p className="mt-1 text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Browse science-based splits or create a custom workout plan tailored to your goals.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
            <Link
              href={workoutPlan ? `/app/my-workout-plan?planId=${workoutPlan.id}` : '/app/workout-plans'}
              className="text-xs text-zinc-400 hover:text-white transition font-medium truncate"
            >
              {workoutPlan ? 'Customize in My Workout Plan →' : 'Browse Templates →'}
            </Link>
            <Link
              href={workoutPlan ? '/app/my-workout-plan' : '/app/workout-plans'}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-sm shrink-0"
            >
              <span>{workoutPlan ? 'Manage Routine' : 'Choose Plan'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Client's Customized Nutrition & Macro Targets Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 flex flex-col justify-between shadow-xl min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-zinc-300 shrink-0">
                <Utensils className="h-3.5 w-3.5 text-white" />
                {mealPlan ? `Active Diet (${mealPlan.itemCount} Foods)` : 'Diet & Nutrition'}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold shrink-0">
                {mealPlan?.targetKcal
                  ? `Target: ${mealPlan.targetKcal.toLocaleString()} kcal`
                  : mealPlan
                  ? `${Math.round(mealPlan.calories).toLocaleString()} kcal`
                  : 'IFCT 2017 Verified'}
              </span>
            </div>

            <h2 className="mt-3.5 text-lg sm:text-xl font-bold text-white break-words">
              {mealPlan ? mealPlan.name : 'Build Your Customized Diet Plan'}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {mealPlan
                ? `Gram-accurate macronutrient distribution calculated from lab-verified IFCT foods`
                : 'Calculate your TDEE calories and assemble meal plans from 40+ lab-tested foods.'}
            </p>

            {mealPlan ? (
              <div className="mt-4">
                {/* Real Macro Breakdown Bars */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Protein
                    </span>
                    <p className="mt-1 text-base sm:text-xl font-black text-white">
                      {Math.round(mealPlan.protein)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.protein * 4 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {Math.round(mealPlan.protein * 4)} kcal
                    </span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Carbs
                    </span>
                    <p className="mt-1 text-base sm:text-xl font-black text-white">
                      {Math.round(mealPlan.carbs)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.carbs * 4 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {Math.round(mealPlan.carbs * 4)} kcal
                    </span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Fats
                    </span>
                    <p className="mt-1 text-base sm:text-xl font-black text-white">
                      {Math.round(mealPlan.fats)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.fats * 9 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      {Math.round(mealPlan.fats * 9)} kcal
                    </span>
                  </div>
                </div>

                {/* Sample Client Food Items */}
                <div className="mt-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 sm:p-3 text-xs flex items-center justify-between text-zinc-300 min-w-0">
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <Sparkles className="h-3.5 w-3.5 text-white shrink-0" />
                    <span className="truncate">
                      {mealPlan.sampleFoods.length > 0
                        ? mealPlan.sampleFoods.join(', ')
                        : 'Custom ingredients tracked'}
                    </span>
                  </span>
                  <span className="font-semibold text-white shrink-0 ml-2">
                    {mealPlan.itemCount} Items
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-5 text-center">
                <Utensils className="mx-auto h-8 w-8 text-zinc-500" />
                <p className="mt-2 text-xs font-semibold text-white">No custom meal plan created yet</p>
                <p className="mt-1 text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Build custom daily meal plans or calculate precise energy needs with the Macro Calculator.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
            <Link
              href="/app/calorie-calculator"
              className="text-xs text-zinc-400 hover:text-white transition font-medium truncate"
            >
              Recalculate BMR / TDEE →
            </Link>
            <Link
              href="/app/diet-foods"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-sm shrink-0"
            >
              <span>{mealPlan ? 'Manage Diet' : 'Build Meal Plan'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Client Customized Daily Habits Interactive Checklist (To-Do List) */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-8 shadow-xl min-w-0">
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
            <h2 className="mt-2.5 text-lg sm:text-2xl font-bold text-white">
              Consistency Builds The Physique
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-zinc-400">
              Tap any habit below to mark your progress for today. Streaks update automatically.
            </p>
          </div>

          <Link
            href="/app/habits"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white self-start sm:self-auto shrink-0"
          >
            <span>Full Streak History &amp; PDF Reports</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {habits.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`flex items-start gap-3 rounded-2xl border p-3.5 sm:p-4 text-left transition-all cursor-pointer min-w-0 ${
                  habit.isCompletedToday
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition mt-0.5 ${
                    habit.isCompletedToday
                      ? 'border-emerald-400 bg-emerald-500 text-black'
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                >
                  {habit.isCompletedToday && <Check className="h-4 w-4 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
                      {habit.currentStreak > 0 ? `${habit.currentStreak} Day Streak` : 'Daily Habit'}
                    </span>
                    {habit.currentStreak > 0 && (
                      <span className="flex items-center text-[10px] font-bold text-amber-400 shrink-0">
                        <Flame className="h-2.5 w-2.5 mr-0.5 fill-amber-400" />
                        {habit.currentStreak}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white mt-0.5 leading-snug break-words">
                    {habit.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {habit.isCompletedToday ? '✓ Logged for today' : 'Tap to check-in'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center">
            <CheckSquare className="mx-auto h-8 w-8 text-zinc-500" />
            <p className="mt-2 text-xs font-semibold text-white">No habits in your to-do list yet</p>
            <p className="mt-1 text-[11px] text-zinc-400 max-w-sm mx-auto">
              Build daily momentum by tracking your hydration, sleep, protein intake, or workout sessions.
            </p>
            <Link
              href="/app/habits"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Your First Habit</span>
            </Link>
          </div>
        )}
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
                Workout Templates
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                Browse canonical exercise rankings, EMG studies, and full routine templates with video tutorials.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-white">
              <span>Explore Templates</span>
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
