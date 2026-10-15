'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Dumbbell,
  Flame,
  Apple,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Star,
  Smartphone,
  Sparkles,
  Menu,
  X,
  Play,
  Award,
  Activity,
  Scale,
  Check,
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState<'chest' | 'back' | 'legs' | 'arms'>('chest')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const muscleRankings = {
    chest: [
      { rank: 1, name: 'Incline Dumbbell Bench Press', metric: '30° Incline / 91% Clavicular EMG activation', source: 'Barnett et al. (1995)' },
      { rank: 2, name: 'Flat Barbell Bench Press', metric: 'Maximum Sternocostal Mechanical Tension', source: 'Schoenfeld et al. (2020)' },
      { rank: 3, name: 'Dips / Chest Dips (Bodyweight or Weighted)', metric: 'High lower-pectoral motor unit recruitment', source: 'Contreras (2010)' },
      { rank: 4, name: 'Cable Chest Flye / Crossover', metric: 'Continuous tension at fully shortened peak contraction', source: 'Buskies (1999)' },
      { rank: 5, name: 'Deficit Push-Up / Push-Up', metric: 'Safe Scapular freedom & active serratus anterior', source: 'Calisthenicmovement (2021)' },
    ],
    back: [
      { rank: 1, name: 'Chest-Supported Row', metric: 'Highest mid-trap & lat activation with 0 lumbar fatigue', source: 'Edelburg et al. (2018)' },
      { rank: 2, name: 'Pronated Pull-Up (Bodyweight or Weighted)', metric: 'Optimal vertical latissimus mechanical overload', source: 'Youdas et al. (2010)' },
      { rank: 3, name: 'Neutral-Grip Lat Pulldown', metric: 'Maximizes lat line-of-pull & elbow drive', source: 'Schoenfeld (2016)' },
      { rank: 4, name: 'Single-Arm Dumbbell Row', metric: 'Full lat stretch at bottom with rotational clearance', source: 'Contreras (2010)' },
      { rank: 5, name: 'Inverted Bodyweight Row', metric: 'Horizontal pull scapular retraction at home', source: 'FitnessFAQs (2022)' },
    ],
    legs: [
      { rank: 1, name: 'Barbell Back Squat / Hack Squat', metric: 'Highest axial knee extension torque & quad growth', source: 'Schoenfeld et al. (2021)' },
      { rank: 2, name: 'Romanian Deadlift (RDL)', metric: 'Peak loaded eccentric hamstring & glute tension', source: 'McAllister et al. (2014)' },
      { rank: 3, name: 'Bulgarian Split Squat', metric: 'Unilateral quad/glute overload without spine compression', source: 'DeForest et al. (2014)' },
      { rank: 4, name: 'Seated Leg Curl', metric: 'Lengthened position hamstring hypertrophy superiority', source: 'Maeo et al. (2021)' },
      { rank: 5, name: 'Standing Calf Raise', metric: 'Full plantar flexion stretch under strict load', source: 'Kassiano et al. (2023)' },
    ],
    arms: [
      { rank: 1, name: 'Incline Dumbbell Biceps Curl', metric: 'Peak long-head stretch at deep shoulder extension', source: 'Oliveira et al. (2009)' },
      { rank: 2, name: 'Overhead Cable Triceps Extension', metric: 'Long-head triceps hypertrophy at maximum stretch', source: 'Maeo et al. (2022)' },
      { rank: 3, name: 'Preacher Curl', metric: 'Strict peak biceps tension in the initial 90° range', source: 'Nunes et al. (2020)' },
      { rank: 4, name: 'Triceps Rope Pushdown', metric: 'Peak lateral & medial head triceps lockout', source: 'Boeckh-Behrens & Buskies (2000)' },
      { rank: 5, name: 'Hammer Curl', metric: 'Targeted brachialis & brachioradialis arm thickness', source: 'Schoenfeld (2016)' },
    ],
  }

  const faqs = [
    {
      q: 'How does GroFit determine the top 5 ranked exercises for each muscle?',
      a: 'We evaluate peer-reviewed electromyographic (EMG) studies, biomechanical tension curves, and hypertrophy outcome trials (such as research from Dr. Brad Schoenfeld, Bret Contreras, and Maeo et al.). Exercises are ranked based on their ability to create mechanical tension throughout deep stretch positions, motor unit recruitment, and progressive overload potential.',
    },
    {
      q: 'Can I follow workouts at home without gym equipment?',
      a: 'Yes! GroFit includes a dedicated Home Calisthenics & Bodyweight Hypertrophy Split designed with progressive variations of push-ups, pull-ups, dips, and inverted rows. Every exercise includes verified tutorial video links and attribution from leading calisthenics educators like Calisthenicmovement and FitnessFAQs.',
    },
    {
      q: 'Where does GroFit get its food and nutrition data?',
      a: 'GroFit uses official, laboratory-verified data from the Indian Food Composition Tables (IFCT 2017) published by ICMR-NIN. All nutritional values (calories, protein, carbohydrates, fats, and fiber) are measured per 100g, allowing precise mathematical portion scaling without generic estimates.',
    },
    {
      q: 'How does the Calorie & Macro Calculator work?',
      a: 'Our calculator implements the clinically recognized Mifflin-St Jeor equation combined with activity multipliers and deficit/surplus modifiers. It also enforces safety guardrails, withholding reckless extreme deficits below 1,200 kcal/day to protect hormonal and metabolic health.',
    },
    {
      q: 'Is GroFit free to use?',
      a: 'Yes, GroFit is 100% free to use. You can create custom personal workout routines, log your sessions, track daily habit streaks, plan meals, and calculate your target calories without any paywalls or subscriptions.',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-white">
      {/* ─── NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-black text-base shadow-sm transition group-hover:scale-105">
              G
            </div>
            <span className="text-xl font-black tracking-tight text-white">grofit</span>
            <span className="hidden rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-zinc-400 sm:inline-block">
              Evidence-Based
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#rankings" className="transition hover:text-white">
              Ranked Exercises
            </a>
            <a href="#nutrition" className="transition hover:text-white">
              Nutrition
            </a>
            <a href="#mobile" className="transition hover:text-white">
              Mobile App
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-95 shadow-sm"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:text-white md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-5 md:hidden">
            <div className="flex flex-col gap-3 text-base font-medium">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                Features
              </a>
              <a
                href="#rankings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                Ranked Exercises
              </a>
              <a
                href="#nutrition"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                Nutrition
              </a>
              <a
                href="#mobile"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                Mobile App
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                FAQ
              </a>
            </div>
            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-zinc-900">
              <Link
                href="/auth/login"
                className="flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 font-semibold text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="flex min-h-[44px] items-center justify-center rounded-xl bg-white font-semibold text-black"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Subtle radial glow background */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-zinc-800/20 via-zinc-900/10 to-transparent blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Built on Peer-Reviewed Sports Science & Biomechanics</span>
          </div>

          {/* Main Headline */}
          <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            Sculpt Your Body With{' '}
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Science
            </span>
            , Not Guesswork.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-zinc-400 leading-relaxed font-normal">
            Top-5 ranked EMG exercises, structured calisthenics & gym splits with creator tutorials, verified ICMR-NIN nutrition databases, and daily habit tracking — built for mobile thumb ergonomics.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/signup"
              className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-base font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/5"
            >
              Start Training Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="flex min-h-[48px] w-full sm:w-auto items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 px-7 py-3 text-base font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto pt-8 border-t border-zinc-900">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">Top 5</span>
              <span className="text-xs sm:text-sm text-zinc-400 mt-0.5">Ranked Exercises / Muscle</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">40+</span>
              <span className="text-xs sm:text-sm text-zinc-400 mt-0.5">IFCT Lab-Verified Foods</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">100%</span>
              <span className="text-xs sm:text-sm text-zinc-400 mt-0.5">Evidence-Based</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">Free</span>
              <span className="text-xs sm:text-sm text-zinc-400 mt-0.5">No Paywalls</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE APP PREVIEW MOCKUP ─── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950 p-4 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-900 text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-800" />
              <div className="h-3 w-3 rounded-full bg-zinc-800" />
              <div className="h-3 w-3 rounded-full bg-zinc-800" />
              <span className="ml-2 hidden sm:inline text-zinc-400">grofit.vercel.app/app</span>
            </div>
            <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-400">
              Live Preview
            </span>
          </div>

          {/* Mock Dashboard Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Today's Workout */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Workout Split</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">Day 1</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">Home Calisthenics & Strength</h3>
                <p className="mt-1 text-xs text-zinc-400">Schoenfeld, Calisthenicmovement & FitnessFAQs</p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">Pull-Ups (Overhand)</span>
                    <span className="text-zinc-400 font-mono">3 sets × 8-12</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">Deficit Push-Ups</span>
                    <span className="text-zinc-400 font-mono">3 sets × 12-15</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">Parallel Bar Dips</span>
                    <span className="text-zinc-400 font-mono">3 sets × 8-10</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Verified Tutorial Links</span>
                <span className="font-semibold text-white">5 Exercises</span>
              </div>
            </div>

            {/* Card 2: Diet & Meal Planner */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nutrition Plan</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">IFCT 2017</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">High Protein Hypertrophy</h3>
                <p className="mt-1 text-xs text-zinc-400">Target: 2,400 kcal • 160g Protein</p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <div>
                      <p className="font-medium text-white">Boiled Egg Whites (150g)</p>
                      <p className="text-[10px] text-zinc-500">Breakfast</p>
                    </div>
                    <span className="text-zinc-300 font-mono">16.5g Pro</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <div>
                      <p className="font-medium text-white">Cooked Chicken Breast (200g)</p>
                      <p className="text-[10px] text-zinc-500">Lunch</p>
                    </div>
                    <span className="text-zinc-300 font-mono">54.0g Pro</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <div>
                      <p className="font-medium text-white">Cooked Ponni Rice (150g)</p>
                      <p className="text-[10px] text-zinc-500">Lunch</p>
                    </div>
                    <span className="text-zinc-300 font-mono">42.3g Carb</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Daily Total</span>
                <span className="font-semibold text-white">162g Pro / 2,380 kcal</span>
              </div>
            </div>

            {/* Card 3: Habit Streaks & Intelligence */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Consistency</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    14 Days
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">Daily Habit Tracking</h3>
                <p className="mt-1 text-xs text-zinc-400">Streak milestones & weekly consistency</p>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">Workout Completed</span>
                    <span className="text-emerald-400 font-bold">✓ Today</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">160g Protein Goal</span>
                    <span className="text-emerald-400 font-bold">✓ Today</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/50 p-2.5 border border-zinc-800/80">
                    <span className="font-medium text-white">3L Water Intake</span>
                    <span className="text-emerald-400 font-bold">✓ Today</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <span>Best Streak</span>
                <span className="font-semibold text-white">28 Consecutive Days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE RANKED EXERCISES SECTION ─── */}
      <section id="rankings" className="py-20 border-t border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Biomechanical Evaluation
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              At Least 5 Top-Ranked Workouts Per Muscle
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Every exercise in GroFit is ranked based on peer-reviewed EMG activation, deep-stretch tension, and progressive overload potential so clients choose exercises with guaranteed results.
            </p>

            {/* Muscle Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {(['chest', 'back', 'legs', 'arms'] as const).map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`min-h-[42px] rounded-xl px-5 py-2 text-sm font-semibold capitalize transition ${
                    selectedMuscle === muscle
                      ? 'bg-white text-black shadow-md'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Ranked List Cards */}
          <div className="mt-10 max-w-3xl mx-auto space-y-3">
            {muscleRankings[selectedMuscle].map((item) => (
              <div
                key={item.rank}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono font-bold text-white text-sm">
                    #{item.rank}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.metric}</p>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-1.5 self-end sm:self-center text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
                  <ShieldCheck className="h-3 w-3 text-zinc-400" />
                  <span>{item.source}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white underline underline-offset-4 hover:text-zinc-300"
            >
              Explore all 24 canonical hypertrophy exercises in GroFit →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4 PILLARS FEATURES SECTION ─── */}
      <section id="features" className="py-20 border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Complete Platform</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Engineered For Maximum Physical Transformation
            </h2>
            <p className="mt-3 text-zinc-400 text-sm sm:text-base">
              Four scientifically validated systems work together seamlessly in your pocket.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">Sourced Hypertrophy & Calisthenics Splits</h3>
              <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                Choose between the 6-Day Push/Pull/Legs Hypertrophy Split, the 4-Day DADBODS Science Split, or the 3-Day Home Calisthenics routine. Each movement features verified form tutorials with full attribution to premier educators like Jeff Nippard, Renaissance Periodization, Scott Herman, Squat University, ATHLEAN-X, and Calisthenicmovement.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Home bodyweight variations: pull-ups, push-ups, dips, rows
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Prescribed warmup routines and target sets/reps
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                <Apple className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">Verified IFCT 2017 Nutritional Intelligence</h3>
              <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                Build custom meal plans backed by lab-analyzed ICMR-NIN nutritional composition data. Track calories, protein, carbohydrates, fats, and fiber with mathematical portion scaling (grams/ml) for everyday staple grains, legumes, meats, and dairy.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Custom meal slots: Breakfast, Lunch, Dinner, Snack
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Real-time calorie deficit/surplus comparison against your targets
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">Clinical Calorie & Macro Calculator</h3>
              <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                Compute Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE) using the clinical Mifflin-St Jeor equation. Goal multipliers calculate recommended calorie deficits or lean surplus targets, backed by safety guardrails preventing harmful starvation diets below 1,200 kcal/day.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Customized protein, carb, and fat gram distributions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Evidence-based activity multipliers (sedentary to highly active)
                </li>
              </ul>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                <Flame className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-white">Daily Habit Consistency & Streaks</h3>
              <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed">
                Fitness is won by daily repetition. Log your hydration, sleep, protein intake, and training check-ins with one tap. GroFit automatically tracks your current and best streaks, generating clean visual progress reports across 1-month, 3-month, 6-month, and 1-year horizons.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  One-tap idempotent daily check-ins
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-white" />
                  Printable & exportable PDF consistency reports
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOBILE-FIRST SPOTLIGHT ─── */}
      <section id="mobile" className="py-20 border-t border-zinc-900 bg-zinc-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-300">
                <Smartphone className="h-3.5 w-3.5 text-white" />
                Mobile is Primary Focus
              </div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-black text-white leading-tight">
                Built For Seamless One-Handed Gym Use.
              </h2>
              <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                Most fitness web apps are clunky on mobile devices. GroFit was re-engineered from the ground up for handheld thumb reachability:
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-black font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Fixed Bottom Navigation Dock</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Instantly switch between Workouts, My Plan, Diet, Habits, and Calories without stretching your thumb to the top of the screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-black font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Tactile Bottom-Sheet Drawers</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Editing sets, renaming workout plans, or adding foods slides up smoothly as native bottom sheets with drag handles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-black font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">48px Accessible Tap Targets</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Buttons and inputs are calibrated to minimum 44–48px heights, ensuring you never misclick even with sweaty hands between sets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/auth/signup"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-zinc-200"
                >
                  Experience GroFit on Mobile →
                </Link>
              </div>
            </div>

            {/* Mobile Visual Graphic */}
            <div className="flex justify-center">
              <div className="w-[300px] sm:w-[320px] rounded-[42px] border-4 border-zinc-800 bg-black p-3 shadow-2xl shadow-zinc-900/60">
                {/* Speaker pill */}
                <div className="mx-auto h-4 w-28 rounded-full bg-zinc-900 mb-3" />

                {/* Inner Screen */}
                <div className="rounded-[30px] border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">grofit</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <p className="text-[10px] text-zinc-400 uppercase font-mono">Today&apos;s Focus</p>
                    <p className="text-sm font-bold text-white mt-0.5">Day 1: Calisthenics</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full w-3/4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <p className="text-[10px] text-zinc-400 uppercase font-mono">Top #1 Movement</p>
                    <p className="text-xs font-semibold text-white mt-0.5">Incline DB Press</p>
                    <p className="text-[10px] text-zinc-500 mt-1">EMG: 91% Clavicular activation</p>
                  </div>

                  {/* Mock Bottom Dock */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-[10px] text-zinc-400">
                      <span className="text-white font-bold">Workouts</span>
                      <span>Plan</span>
                      <span>Diet</span>
                      <span>Habits</span>
                      <span>Macros</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS / SOCIAL PROOF ─── */}
      <section className="py-20 border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">User Experiences</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Trusted By Serious Athletes & Lifters
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;Having the top 5 exercises ranked by actual EMG studies saved me from wasting time on junk volume. The Incline DB press and chest-supported rows completely changed my chest and back growth.&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                  AR
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Arjun R.</p>
                  <p className="text-[11px] text-zinc-500">Hypertrophy Lifter (3 yrs)</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;The Home Calisthenics split with video links to Calisthenicmovement is incredible. I train in my living room with a pull-up bar and gymnastics rings and made more progress than at commercial gyms.&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                  SK
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Suresh K.</p>
                  <p className="text-[11px] text-zinc-500">Calisthenics Enthusiast</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between">
              <p className="text-sm text-zinc-300 leading-relaxed">
                &ldquo;The IFCT food database is a game-changer. Most nutrition apps don&apos;t have real South Indian staples measured accurately. Here I can scale cooked ponni rice, lentils, and eggs down to the exact gram.&rdquo;
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-xs">
                  MD
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Mohamed D.</p>
                  <p className="text-[11px] text-zinc-500">Natural Bodybuilder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section id="faq" className="py-20 border-t border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Questions & Answers</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                      openFaq === index ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CALL TO ACTION ─── */}
      <section className="py-20 border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-black p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-48 w-96 -translate-x-1/2 rounded-full bg-white/5 blur-2xl" />

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Upgrade Your Fitness Journey?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-zinc-400">
              Create your account in seconds. Apply evidence-based workout templates, track your nutrition, and build lifelong consistency.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3 text-base font-bold text-black transition hover:bg-zinc-200 active:scale-95"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="flex min-h-[48px] w-full sm:w-auto items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-3 text-base font-semibold text-white transition hover:bg-zinc-800"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-900 py-10 bg-black text-zinc-500 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-black font-black text-xs">
              G
            </div>
            <span className="text-sm font-bold text-white">grofit</span>
            <span className="text-zinc-600">|</span>
            <span>Evidence-Based Training & Nutrition Platform</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-400">
            <Link href="/auth/login" className="hover:text-white transition">
              Sign In
            </Link>
            <Link href="/auth/signup" className="hover:text-white transition">
              Sign Up
            </Link>
            <a href="#rankings" className="hover:text-white transition">
              Rankings
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
          </div>

          <p className="text-zinc-600">
            &copy; 2026 GroFit Software Solutions. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
