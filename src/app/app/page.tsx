'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ElectricBorder from '@/components/ElectricBorder';
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
  ArrowUpRight,
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
            if (json?.data && json.data.length > 0) {
              const firstPlan = json.data[0];
              const detailRes = await fetch(`/api/workout-plans/${firstPlan.id}`);
              if (detailRes.ok) {
                const detailJson = await detailRes.json();
                const planDetail = detailJson.data;

                const dayIndex = new Date().getDay();
                const days = planDetail.days || [];
                const dayToUse =
                  days.length > 0
                    ? days[dayIndex % days.length] || days[0]
                    : null;

                const entriesList = dayToUse?.entries || [];

                setWorkoutPlan({
                  id: planDetail.id,
                  name: planDetail.name,
                  dayCount: days.length,
                  todayDayName: dayToUse ? dayToUse.name : 'Today',
                  entries: entriesList.map((e: any) => ({
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
            if (json?.data && json.data.length > 0) {
              const firstMealPlan = json.data[0];
              const detailRes = await fetch(`/api/meal-plans/${firstMealPlan.id}`);
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

        // 4. Fetch User Habits
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
        setHabits((prev) => prev.map((h) => (h.id === habitId ? habit : h)));
      }
    } catch {
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
      {/* ─── DASHBOARD HERO GREETING & STREAK BANNER ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-[#ffffff]/10 bg-black/65 backdrop-blur-xl p-5 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-64 w-96 rounded-full bg-[#ff2a3b]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1.5">
                <span className="text-[#ff2a3b]">✳</span> MEMBER DASHBOARD / 001
              </span>
              <span className="text-xs font-mono text-[#71717a]">
                {currentDateStr || 'Today'}
              </span>
            </div>

            <h1 className="mt-2.5 font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#ffffff] uppercase leading-[0.95]">
              {greeting}, <em>{clientGreetingName}.</em>
            </h1>
            <p className="mt-2 max-w-xl text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
              Track calibrated splits, log IFCT lab-verified foods, maintain daily streaks, and maximize hypertrophy with sports biomechanics.
            </p>
          </div>

          {/* Dynamic Consistency Streak Card */}
          <div className="flex items-center gap-4 rounded-2xl border border-[#ffffff]/10 bg-black/60 backdrop-blur-lg p-4 sm:p-5 shrink-0 self-start md:self-auto shadow-md">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#1a1a1a] border border-[#ff2a3b]/30 text-[#ff2a3b]">
              <Flame className="h-6 w-6 sm:h-7 sm:w-7 fill-[#ff2a3b]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-3xl sm:text-4xl font-black text-[#ffffff]">{maxStreak}</span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ff2a3b]">
                  {maxStreak === 1 ? 'Day Active' : 'Days Active'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-[#a1a1aa] mt-0.5">
                Current Consistency Streak
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#ffffff]/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/app/workout-plans"
            className="kinetik-card px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ffffff] flex items-center justify-between group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Dumbbell className="h-4 w-4 text-[#ff2a3b] shrink-0" />
              <span className="truncate">Workout Templates</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#71717a] group-hover:text-[#ff2a3b] group-hover:translate-x-0.5 transition shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/my-workout-plan"
            className="kinetik-card px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ffffff] flex items-center justify-between group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarCheck className="h-4 w-4 text-[#ff2a3b] shrink-0" />
              <span className="truncate">My Workout Plan</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#71717a] group-hover:text-[#ff2a3b] group-hover:translate-x-0.5 transition shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/diet-foods"
            className="kinetik-card px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ffffff] flex items-center justify-between group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Utensils className="h-4 w-4 text-[#ff2a3b] shrink-0" />
              <span className="truncate">Diet &amp; Foods</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#71717a] group-hover:text-[#ff2a3b] group-hover:translate-x-0.5 transition shrink-0 ml-1" />
          </Link>

          <Link
            href="/app/calorie-calculator"
            className="kinetik-card px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ffffff] flex items-center justify-between group min-w-0"
          >
            <span className="flex items-center gap-2 truncate">
              <Scale className="h-4 w-4 text-[#ff2a3b] shrink-0" />
              <span className="truncate">Macro Calculator</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#71717a] group-hover:text-[#ff2a3b] group-hover:translate-x-0.5 transition shrink-0 ml-1" />
          </Link>
        </div>
      </section>

      {/* ─── TWO-COLUMN CORE STATUS CARDS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Active Workout Routine Card */}
        <ElectricBorder borderRadius={20} className="h-full">
          <div className="kinetik-card p-5 sm:p-6 flex flex-col justify-between shadow-xl min-w-0 h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#ffffff]/10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffffff]/10 bg-[#000000] px-3 py-1 text-xs font-bold font-mono tracking-wider text-[#ff2a3b] uppercase shrink-0">
                <Dumbbell className="h-3.5 w-3.5 text-[#ff2a3b]" />
                {workoutPlan ? `Active Split (${workoutPlan.dayCount} Days)` : 'Active Workout Split'}
              </span>
              <span className="text-xs font-mono text-[#a1a1aa] shrink-0 truncate">
                {workoutPlan?.todayDayName || 'Personalized Routine'}
              </span>
            </div>

            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#ffffff] break-words">
              {workoutPlan ? workoutPlan.name : 'Start Your First Workout Split'}
            </h2>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              {workoutPlan
                ? 'Customized workout split with target prescriptions and volume tracking'
                : 'Select from vetted scientific splits or create your own custom exercise routine.'}
            </p>

            {workoutPlan ? (
              <div className="mt-4 space-y-2">
                {workoutPlan.entries.length > 0 ? (
                  workoutPlan.entries.slice(0, 3).map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="flex items-center justify-between rounded-xl border border-[#ffffff]/10 bg-[#000000] p-3 transition hover:border-[#ff2a3b]/40 min-w-0 gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#ffffff]/10 font-display font-black text-xs text-[#ff2a3b] shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#ffffff] truncate">
                            {entry.exerciseName}
                          </p>
                          <p className="text-[11px] font-mono text-[#a1a1aa] truncate">
                            {entry.muscleGroup || 'Target Muscle'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#ff2a3b] bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-[#ffffff]/10 shrink-0">
                        {entry.sets || 3} × {entry.reps || 10} REPS
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[#ffffff]/10 bg-[#000000] p-4 text-center text-xs text-[#a1a1aa]">
                    No exercises added to this split yet. Customize your routine in My Workout Plan.
                  </div>
                )}
                {workoutPlan.entries.length > 3 && (
                  <p className="text-center text-[11px] font-mono text-[#71717a] pt-1">
                    +{workoutPlan.entries.length - 3} MORE MOVEMENTS IN THIS SESSION
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#ffffff]/15 bg-[#000000]/50 p-6 text-center">
                <Dumbbell className="mx-auto h-8 w-8 text-[#71717a]" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#ffffff]">
                  No active workout plan yet
                </p>
                <p className="mt-1 text-[11px] text-[#a1a1aa] max-w-sm mx-auto">
                  Browse science-based splits or create a custom workout plan tailored to your goals.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-[#ffffff]/10 flex items-center justify-between gap-3">
            <Link
              href={workoutPlan ? `/app/my-workout-plan?planId=${workoutPlan.id}` : '/app/workout-plans'}
              className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ff2a3b] transition truncate"
            >
              {workoutPlan ? 'Customize Split →' : 'Browse Templates →'}
            </Link>
            <Link
              href={workoutPlan ? '/app/my-workout-plan' : '/app/workout-plans'}
              className="kinetik-btn-lime px-4 py-2 text-xs font-extrabold shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>{workoutPlan ? 'Manage Routine' : 'Choose Plan'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        </ElectricBorder>

        {/* Active Nutrition & Macros Card */}
        <ElectricBorder borderRadius={20} className="h-full">
          <div className="kinetik-card p-5 sm:p-6 flex flex-col justify-between shadow-xl min-w-0 h-full">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#ffffff]/10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffffff]/10 bg-[#000000] px-3 py-1 text-xs font-bold font-mono tracking-wider text-[#ff2a3b] uppercase shrink-0">
                <Utensils className="h-3.5 w-3.5 text-[#ff2a3b]" />
                {mealPlan ? `Active Diet (${mealPlan.itemCount} Foods)` : 'Diet & Nutrition'}
              </span>
              <span className="text-xs font-mono text-[#ff2a3b] font-bold shrink-0">
                {mealPlan?.targetKcal
                  ? `TARGET: ${mealPlan.targetKcal.toLocaleString()} KCAL`
                  : mealPlan
                  ? `${Math.round(mealPlan.calories).toLocaleString()} KCAL`
                  : 'IFCT 2017 VERIFIED'}
              </span>
            </div>

            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-[#ffffff] break-words">
              {mealPlan ? mealPlan.name : 'Build Your Customized Diet Plan'}
            </h2>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              {mealPlan
                ? 'Gram-accurate macronutrient distribution calculated from lab-verified IFCT foods'
                : 'Calculate your TDEE calories and assemble meal plans from 40+ lab-tested foods.'}
            </p>

            {mealPlan ? (
              <div className="mt-4">
                {/* Real Macro Breakdown Bars */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-3 text-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Protein
                    </span>
                    <p className="mt-1 font-display text-2xl font-black text-[#ff2a3b]">
                      {Math.round(mealPlan.protein)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                      <div
                        className="h-full bg-[#ff2a3b] rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.protein * 4 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#71717a] mt-1 block">
                      {Math.round(mealPlan.protein * 4)} kcal
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-3 text-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Carbs
                    </span>
                    <p className="mt-1 font-display text-2xl font-black text-[#ffffff]">
                      {Math.round(mealPlan.carbs)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                      <div
                        className="h-full bg-[#9da991] rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.carbs * 4 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#71717a] mt-1 block">
                      {Math.round(mealPlan.carbs * 4)} kcal
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-3 text-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Fats
                    </span>
                    <p className="mt-1 font-display text-2xl font-black text-[#ffffff]">
                      {Math.round(mealPlan.fats)}g
                    </p>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                      <div
                        className="h-full bg-[#71717a] rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(10, (mealPlan.fats * 9 / (mealPlan.calories || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#71717a] mt-1 block">
                      {Math.round(mealPlan.fats * 9)} kcal
                    </span>
                  </div>
                </div>

                {/* Sample Food Items */}
                <div className="mt-3.5 rounded-xl border border-[#ffffff]/10 bg-[#000000] p-2.5 sm:p-3 text-xs flex items-center justify-between text-[#a1a1aa] min-w-0">
                  <span className="flex items-center gap-2 min-w-0 truncate font-mono text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-[#ff2a3b] shrink-0" />
                    <span className="truncate">
                      {mealPlan.sampleFoods.length > 0
                        ? mealPlan.sampleFoods.join(', ')
                        : 'Custom ingredients tracked'}
                    </span>
                  </span>
                  <span className="font-mono font-bold text-[#ff2a3b] shrink-0 ml-2">
                    {mealPlan.itemCount} ITEMS
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#ffffff]/15 bg-[#000000]/50 p-6 text-center">
                <Utensils className="mx-auto h-8 w-8 text-[#71717a]" />
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#ffffff]">
                  No custom meal plan created yet
                </p>
                <p className="mt-1 text-[11px] text-[#a1a1aa] max-w-sm mx-auto">
                  Build custom daily meal plans or calculate precise energy needs with the Macro Calculator.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-[#ffffff]/10 flex items-center justify-between gap-3">
            <Link
              href="/app/calorie-calculator"
              className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] hover:text-[#ff2a3b] transition truncate"
            >
              Recalculate BMR / TDEE →
            </Link>
            <Link
              href="/app/diet-foods"
              className="kinetik-btn-lime px-4 py-2 text-xs font-extrabold shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <span>{mealPlan ? 'Manage Diet' : 'Build Meal Plan'}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        </ElectricBorder>
      </div>

      {/* ─── DAILY HABIT ROUTINE TO-DO CHECKLIST ─── */}
      <ElectricBorder borderRadius={20}>
        <section className="kinetik-card p-5 sm:p-8 shadow-xl min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ffffff]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-[#ff2a3b]" />
                DAILY HABIT MOMENTUM
              </span>
              <span className="text-xs font-mono font-bold text-[#ff2a3b]">
                {completedCount} OF {habits.length} COMPLETED TODAY
              </span>
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black text-[#ffffff] uppercase">
              CONSISTENCY BUILDS <em>THE PHYSIQUE.</em>
            </h2>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Tap any habit below to mark your check-in. Streaks update automatically.
            </p>
          </div>

          <Link
            href="/app/habits"
            className="kinetik-btn-dark px-4 py-2 text-xs font-bold uppercase tracking-wider shrink-0"
          >
            <span>Full History &amp; PDF</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        {habits.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {habits.map((habit) => (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all cursor-pointer min-w-0 ${
                  habit.isCompletedToday
                    ? 'border-[#ff2a3b]/50 bg-[#ff2a3b]/10 text-[#ffffff] shadow-[0_0_15px_rgba(255, 42, 59, 0.15)]'
                    : 'border-[#ffffff]/10 bg-[#000000] text-[#a1a1aa] hover:border-[#ff2a3b]/30 hover:bg-[#1a1a1a]'
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition mt-0.5 ${
                    habit.isCompletedToday
                      ? 'border-[#ff2a3b] bg-[#ff2a3b] text-white'
                      : 'border-[#ffffff]/20 bg-[#0d0d0d]'
                  }`}
                >
                  {habit.isCompletedToday && <Check className="h-4 w-4 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717a] truncate">
                      {habit.currentStreak > 0 ? `${habit.currentStreak} DAY STREAK` : 'DAILY HABIT'}
                    </span>
                    {habit.currentStreak > 0 && (
                      <span className="flex items-center text-[10px] font-mono font-bold text-[#ff2a3b] shrink-0">
                        <Flame className="h-3 w-3 mr-0.5 fill-[#ff2a3b]" />
                        {habit.currentStreak}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#ffffff] mt-1 leading-snug break-words">
                    {habit.name}
                  </p>
                  <p className="text-[10px] font-mono text-[#ff2a3b] mt-1">
                    {habit.isCompletedToday ? '✓ LOGGED FOR TODAY' : 'TAP TO LOG'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#ffffff]/15 bg-[#000000]/50 p-6 text-center">
            <CheckSquare className="mx-auto h-8 w-8 text-[#71717a]" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[#ffffff]">
              No habits in your to-do list yet
            </p>
            <p className="mt-1 text-[11px] text-[#a1a1aa] max-w-sm mx-auto">
              Build daily momentum by tracking your hydration, sleep, protein intake, or workout sessions.
            </p>
            <Link
              href="/app/habits"
              className="mt-4 kinetik-btn-lime px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Your First Habit</span>
            </Link>
          </div>
        )}
      </section>
      </ElectricBorder>

      {/* ─── CANONICAL EXERCISE EMG EXPLORER ─── */}
      <ElectricBorder borderRadius={20}>
        <section className="kinetik-card p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#ffffff]/10">
          <div>
            <span className="eyebrow">SPORTS SCIENCE BIOMECHANICS</span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black text-[#ffffff] uppercase">
              CANONICAL EXERCISE <em>RANKINGS.</em>
            </h2>
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Peer-reviewed EMG tension ratings to select exercises with guaranteed hypertrophic return.
            </p>
          </div>

          {/* Muscle Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-1">
            {(['chest', 'back', 'legs', 'arms'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRankedTab(tab)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  rankedTab === tab
                    ? 'bg-[#ff2a3b] text-white font-extrabold shadow-sm'
                    : 'text-[#a1a1aa] hover:text-[#ffffff]'
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
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-4 transition hover:border-[#ff2a3b]/40"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#ffffff]/10 font-display font-black text-[#ff2a3b] text-sm">
                  #{item.rank}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#ffffff]">{item.name}</h3>
                  <p className="text-[11px] text-[#a1a1aa] mt-0.5">{item.tag}</p>
                </div>
              </div>

              <div className="mt-2 sm:mt-0 flex items-center gap-1.5 self-end sm:self-center text-[10px] font-mono text-[#ff2a3b] bg-[#0d0d0d] px-2.5 py-1 rounded-md border border-[#ffffff]/10">
                <ShieldCheck className="h-3 w-3 text-[#ff2a3b]" />
                <span>{item.source}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#ffffff]/10 text-center">
          <Link
            href="/app/workout-plans"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b] hover:text-[#ff4d5e] transition"
          >
            <span>Explore all 24 canonical exercises and video form tutorials in the Workout Library</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
      </ElectricBorder>

      {/* ─── PLATFORM MODULES GRID ─── */}
      <section>
        <div className="mb-4">
          <span className="eyebrow">CORE ARCHITECTURE</span>
          <h2 className="mt-1 font-display text-2xl font-black text-[#ffffff] uppercase">
            PLATFORM <em>MODULES.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/workout-plans"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  Workout Templates
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Browse canonical exercise rankings, EMG studies, and full routine templates with video tutorials.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>Explore Templates</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>

          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/my-workout-plan"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  My Workout Plan
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Build your custom daily splits with warmups, target rep ranges, load tracking, and supersets.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>Open My Plan</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>

          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/diet-foods"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <Utensils className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  Diet &amp; Foods
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Track meals using lab-analyzed ICMR-NIN nutritional databases with gram-level portion scaling.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>View Food Database</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>

          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/habits"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  Habit Tracker
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Log daily check-ins in your timezone, build unbreakable streaks, and generate printable reports.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>Track Habits</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>

          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/calorie-calculator"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  Calorie Calculator
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Mifflin-St Jeor clinical BMR/TDEE math with safety guardrails and personalized macro splits.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>Calculate Macros</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>

          <ElectricBorder borderRadius={20} className="h-full">
            <Link
              href="/app/settings"
              className="kinetik-card p-5 flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-bold">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-[#ffffff] group-hover:text-[#ff2a3b] transition-colors">
                  Settings &amp; Data
                </h3>
                <p className="mt-1 text-xs text-[#a1a1aa] leading-relaxed">
                  Manage profile name, application timezone, measurement units, and download full data export.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#ff2a3b]">
                <span>Manage Settings</span>
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </ElectricBorder>
        </div>
      </section>
    </div>
  );
}
