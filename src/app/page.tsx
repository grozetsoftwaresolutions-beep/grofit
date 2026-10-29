'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import ElectricBorder from '@/components/ElectricBorder';
import {
  Dumbbell,
  Flame,
  Apple,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Play,
  Check,
  Layers,
  Activity,
  Scale,
  Smartphone,
} from 'lucide-react';
import EquipmentLab from '@/components/3d/EquipmentLab';

// Dynamically load the Hero 3D scene client-side only (Next.js dynamic ssr: false)
const DynamicHeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[480px] lg:h-[560px] flex items-center justify-center">
      <div className="h-10 w-10 border-2 border-[#ff2a3b] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<'chest' | 'back' | 'legs' | 'arms'>('chest');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            setIsRedirecting(true);
            router.replace('/app');
          }
        })
        .catch(() => {});

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setIsRedirecting(true);
          router.replace('/app');
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    } catch {
      // Supabase unconfigured or offline
    }
  }, [router]);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-[#ffffff]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff2a3b] border-t-transparent" />
          <p className="text-xs text-[#a1a1aa] font-mono tracking-widest uppercase">
            OPENING DASHBOARD...
          </p>
        </div>
      </div>
    );
  }

  const muscleRankings = {
    chest: [
      { rank: 1, name: 'Incline Dumbbell Bench Press', metric: '30° Incline / 91% Clavicular EMG activation', source: 'Barnett et al. (1995)' },
      { rank: 2, name: 'Flat Barbell Bench Press', metric: 'Maximum Sternocostal Mechanical Tension', source: 'Schoenfeld et al. (2020)' },
      { rank: 3, name: 'Dips / Chest Dips (Weighted or BW)', metric: 'High lower-pectoral motor unit recruitment', source: 'Contreras (2010)' },
      { rank: 4, name: 'Cable Chest Flye / Crossover', metric: 'Continuous tension at fully shortened peak contraction', source: 'Buskies (1999)' },
      { rank: 5, name: 'Deficit Push-Up / Parallel Push-Up', metric: 'Safe scapular freedom & active serratus anterior', source: 'Calisthenicmovement (2021)' },
    ],
    back: [
      { rank: 1, name: 'Chest-Supported Row', metric: 'Highest mid-trap & lat activation with 0 lumbar fatigue', source: 'Edelburg et al. (2018)' },
      { rank: 2, name: 'Pronated Pull-Up (Weighted or BW)', metric: 'Optimal vertical latissimus mechanical overload', source: 'Youdas et al. (2010)' },
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
  };

  const trainingPaths = [
    {
      code: 'PATH / 01',
      title: 'BUILD YOUR BASE',
      tag: 'LIFT',
      duration: '40—60 MIN',
      description: 'Structured 6-Day Push/Pull/Legs and 4-Day Science Splits built around high-tension compound movements and progressive overload.',
      points: [
        'Top 5 ranked EMG exercises per muscle',
        'Mechanical tension in lengthened stretch',
        'Video form tutorials with creator credit',
      ],
      linkText: 'EXPLORE PATH',
    },
    {
      code: 'PATH / 02',
      title: 'FIND YOUR ENGINE',
      tag: 'MOVE',
      duration: '25—45 MIN',
      description: 'Progressive calisthenics, bodyweight power, and athletic conditioning for building functional strength at home or on the road.',
      points: [
        'Calisthenicmovement & FitnessFAQs splits',
        'Pull-ups, dips, deficit push-ups & rows',
        'Zero equipment friction, pure body mastery',
      ],
      linkText: 'EXPLORE PATH',
    },
    {
      code: 'PATH / 03',
      title: 'FUEL & RECOVER',
      tag: 'NUTRITION',
      duration: 'DAILY RHYTHM',
      description: 'Laboratory-verified ICMR-NIN nutrition composition data, Mifflin-St Jeor metabolic tracking, and daily habit consistency streaks.',
      points: [
        'IFCT 2017 lab-verified food database',
        'Gram-accurate South Indian staple scaling',
        'Daily habit streaks & printable reports',
      ],
      linkText: 'EXPLORE PATH',
    },
  ];

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
  ];

  return (
    <div className="min-h-screen bg-transparent text-[#ffffff] selection:bg-[#ff2a3b] selection:text-white">
      {/* ─── STICKY MINIMAL HEADER (Matching Kinetik Header) ─── */}
      <header className="sticky top-0 z-50 border-b border-[#ffffff]/10 bg-[#000000]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1720px] w-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-14 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Image
                src="/images/grofit-crest.png"
                alt="GroFit Logo"
                width={44}
                height={44}
                className="h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow-[0_0_12px_rgba(255,42,59,0.35)]"
                priority
              />
            </div>
            <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#ffffff]">
              GRO<span className="text-[#ff2a3b]">FIT</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest text-[#a1a1aa] uppercase border-l border-[#ffffff]/15 pl-3">
              TRAIN WITH INTENT
            </span>
          </Link>

          {/* Center Spaced Micro-Label */}
          <div className="hidden lg:flex items-center text-[10px] font-mono tracking-widest text-[#71717a] uppercase">
            STRENGTH · CONDITIONING · MOBILITY
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider uppercase text-[#a1a1aa]">
            <a href="#approach" className="transition hover:text-[#ff2a3b]">
              The Method
            </a>
            <a href="#kinetic-lab" className="transition hover:text-[#ff2a3b]">
              3D Training Lab
            </a>
            <a href="#programs" className="transition hover:text-[#ff2a3b]">
              Training Paths
            </a>
            <a href="#rankings" className="transition hover:text-[#ff2a3b]">
              Rankings
            </a>
            <a href="#faq" className="transition hover:text-[#ff2a3b]">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-xs font-bold tracking-wider uppercase text-[#a1a1aa] hover:text-[#ffffff] transition"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="kinetik-btn-lime px-4 py-2 text-xs font-extrabold shadow-sm flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffffff]/10 bg-[#0d0d0d] text-[#a1a1aa] transition hover:text-[#ffffff] md:hidden cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-[#ffffff]/10 bg-[#0d0d0d] px-4 py-5 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-bold uppercase tracking-wider">
              <a
                href="#approach"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-[#ff2a3b]"
              >
                The Method
              </a>
              <a
                href="#kinetic-lab"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-[#ff2a3b]"
              >
                3D Training Lab
              </a>
              <a
                href="#programs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-[#ff2a3b]"
              >
                Training Paths
              </a>
              <a
                href="#rankings"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-[#ff2a3b]"
              >
                Ranked Exercises
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[#a1a1aa] hover:bg-[#1a1a1a] hover:text-[#ff2a3b]"
              >
                FAQ
              </a>
            </div>
            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-[#ffffff]/10">
              <Link
                href="/auth/login"
                className="kinetik-btn-dark py-2.5 text-xs font-bold uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="kinetik-btn-lime py-2.5 text-xs font-bold uppercase"
              >
                Create Free Account ↗
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION (KINETIK STYLE) ─── */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#ffffff]/10">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#ff2a3b]/10 via-[#0d0d0d]/20 to-transparent blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Big Headline & Narrative */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <p className="eyebrow flex items-center gap-2">
                <span>THE GROFIT METHOD / 001</span>
                <span className="h-1 w-6 bg-[#ff2a3b]" />
              </p>

              {/* Display Headline with Emphasized Italic Accent */}
              <h1 className="mt-4 font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.92] text-[#ffffff]">
                BUILT BY<br />
                <em>THE WORK.</em>
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg text-[#a1a1aa] leading-relaxed font-normal">
                Make movement a practice. Build strength, find your pace, and recover well enough to show up again. Sourced peer-reviewed sports science, verified IFCT 2017 nutrition, and an interactive 3D equipment lab.
              </p>

              {/* Action CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/auth/signup"
                  className="kinetik-btn-lime px-7 py-3.5 text-sm font-extrabold shadow-lg flex items-center gap-2"
                >
                  <span>START TRAINING FREE</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a
                  href="#kinetic-lab"
                  className="kinetik-btn-dark px-6 py-3.5 text-sm font-bold tracking-wider uppercase flex items-center gap-2"
                >
                  <span>EXPLORE 3D LAB</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Feature Tags Row */}
              <div className="mt-12 flex flex-wrap gap-2 text-[10px] font-mono tracking-widest text-[#ff2a3b] uppercase font-bold">
                <span className="px-3 py-1.5 rounded-full border border-[#ff2a3b]/25 bg-[#0d0d0d]/80 flex items-center gap-1.5">
                  <span className="text-[#ff2a3b]">✳</span> REAL-TIME 3D EQUIPMENT
                </span>
                <span className="px-3 py-1.5 rounded-full border border-[#ff2a3b]/25 bg-[#0d0d0d]/80 flex items-center gap-1.5">
                  <span className="text-[#ff2a3b]">✳</span> TRAINING PATHS
                </span>
                <span className="px-3 py-1.5 rounded-full border border-[#ff2a3b]/25 bg-[#0d0d0d]/80 flex items-center gap-1.5">
                  <span className="text-[#ff2a3b]">✳</span> WEEKLY PLAN BUILDER
                </span>
              </div>
            </div>

            {/* Right Column: 3D Kinetic Core Interactive Scene */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full relative rounded-3xl bg-gradient-to-b from-[#0d0d0d]/80 to-[#000000] border border-[#ffffff]/10 shadow-2xl p-2 sm:p-4">
                <DynamicHeroScene />
                <div className="px-4 py-2 flex items-center justify-between text-[10px] font-mono tracking-wider text-[#71717a] border-t border-[#ffffff]/10">
                  <span>KINETIC CORE SIMULATION</span>
                  <span className="text-[#ff2a3b]">3D WEBGL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-10 border-t border-[#ffffff]/10">
            <div>
              <span className="font-display text-4xl sm:text-5xl font-black text-[#ffffff]">TOP 5</span>
              <p className="text-xs font-mono tracking-wider uppercase text-[#a1a1aa] mt-1">
                Ranked Movements / Muscle
              </p>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl font-black text-[#ff2a3b]">40+</span>
              <p className="text-xs font-mono tracking-wider uppercase text-[#a1a1aa] mt-1">
                IFCT Lab-Verified Foods
              </p>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl font-black text-[#ffffff]">100%</span>
              <p className="text-xs font-mono tracking-wider uppercase text-[#a1a1aa] mt-1">
                Evidence-Based Science
              </p>
            </div>
            <div>
              <span className="font-display text-4xl sm:text-5xl font-black text-[#ff2a3b]">FREE</span>
              <p className="text-xs font-mono tracking-wider uppercase text-[#a1a1aa] mt-1">
                Zero Paywalls
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION #APPROACH: THE KINETIK METHOD / 001 ─── */}
      <section id="approach" className="py-20 lg:py-28 border-b border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#ffffff]/10">
            <div>
              <span className="eyebrow">01 / THE PHILOSOPHY</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#ffffff]">
                THE GROFIT <em>METHOD.</em>
              </h2>
            </div>
            <p className="max-w-md text-sm text-[#a1a1aa] leading-relaxed">
              We replace fitness bro-science with peer-reviewed electromyography, clinical metabolic equations, and sustainable daily habits.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 01 */}
            <ElectricBorder borderRadius={20} className="h-full">
              <div className="kinetik-card p-7 flex flex-col justify-between h-full">
                <div>
                  <span className="font-display text-3xl font-black text-[#ff2a3b]">01</span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-[#ffffff]">
                    MECHANICAL TENSION & EMG
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                    Every exercise in GroFit is ranked from peer-reviewed biomechanical literature (Schoenfeld, Contreras, Maeo). We select movements that maximize motor unit recruitment throughout deep stretch positions.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#ffffff]/10 text-[11px] font-mono text-[#ff2a3b]">
                  SCIENTIFIC OVERLOAD
                </div>
              </div>
            </ElectricBorder>

            {/* Pillar 02 */}
            <ElectricBorder borderRadius={20} className="h-full">
              <div className="kinetik-card p-7 flex flex-col justify-between h-full">
                <div>
                  <span className="font-display text-3xl font-black text-[#ff2a3b]">02</span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-[#ffffff]">
                    IFCT 2017 NUTRITIONAL ACCURACY
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                    No generic estimates. We use official ICMR-NIN Indian Food Composition Tables data. Scale staple foods like cooked ponni rice, lentils, chicken breast, and eggs down to the exact gram.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#ffffff]/10 text-[11px] font-mono text-[#ff2a3b]">
                  LAB-VERIFIED DATA
                </div>
              </div>
            </ElectricBorder>

            {/* Pillar 03 */}
            <ElectricBorder borderRadius={20} className="h-full">
              <div className="kinetik-card p-7 flex flex-col justify-between h-full">
                <div>
                  <span className="font-display text-3xl font-black text-[#ff2a3b]">03</span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-[#ffffff]">
                    HABIT REPETITION & RHYTHM
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                    Fitness is built by daily consistency, not periodic bursts. Log hydration, sleep, protein, and sessions with one tap. Visual streaks and printable reports give you accountability.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#ffffff]/10 text-[11px] font-mono text-[#ff2a3b]">
                  DAILY REPETITION
                </div>
              </div>
            </ElectricBorder>
          </div>
        </div>
      </section>

      {/* ─── SECTION #KINETIC-LAB: INTERACTIVE 3D EQUIPMENT LAB ─── */}
      <EquipmentLab />

      {/* ─── SECTION #PROGRAMS: TRAINING PATHS ─── */}
      <section id="programs" className="py-20 lg:py-28 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#ffffff]/10">
            <div>
              <span className="eyebrow">03 / STRUCTURED SPLITS</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#ffffff]">
                TRAINING <em>PATHS.</em>
              </h2>
            </div>
            <p className="max-w-md text-sm text-[#a1a1aa] leading-relaxed">
              Evidence-based workout splits curated for commercial gyms, home setups, or pure bodyweight training.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainingPaths.map((path, idx) => (
              <ElectricBorder key={idx} borderRadius={20} className="h-full">
                <div className="kinetik-card p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#ffffff]/10">
                      <span className="text-[11px] font-mono text-[#a1a1aa]">{path.code}</span>
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#ff2a3b]/15 text-[#ff2a3b] border border-[#ff2a3b]/30">
                        {path.tag} · {path.duration}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-[#ffffff]">
                      {path.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
                      {path.description}
                    </p>

                    <ul className="mt-5 space-y-2 text-xs text-[#f0f0f0] font-medium">
                      {path.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-[#ff2a3b] shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#ffffff]/10">
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-[#ff2a3b] hover:text-[#ff4d5e] transition"
                    >
                      <span>{path.linkText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </ElectricBorder>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION #SESSION-GUIDE: EMG RANKED EXERCISES ─── */}
      <section id="rankings" className="py-20 lg:py-28 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="eyebrow">04 / MOVEMENT INDEX</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#ffffff]">
              TOP-RANKED <em>MOVEMENTS.</em>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#a1a1aa]">
              Every exercise evaluated against peer-reviewed electromyographic research for guaranteed muscular hypertrophy and mechanical tension.
            </p>

            {/* Muscle Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {(['chest', 'back', 'legs', 'arms'] as const).map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`min-h-[42px] rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    selectedMuscle === muscle
                      ? 'bg-[#ff2a3b] text-white shadow-[0_0_20px_rgba(255, 42, 59, 0.3)] scale-[1.02]'
                      : 'border border-[#ffffff]/10 bg-[#0d0d0d] text-[#a1a1aa] hover:text-[#ffffff] hover:bg-[#1a1a1a]'
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
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d]/75 backdrop-blur-md p-4.5 transition hover:border-[#ff2a3b]/40"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#ffffff]/10 font-display font-black text-[#ff2a3b] text-lg">
                    #{item.rank}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#ffffff]">{item.name}</h4>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">{item.metric}</p>
                  </div>
                </div>
                <div className="mt-2.5 sm:mt-0 flex items-center gap-1.5 self-end sm:self-center text-[10px] font-mono text-[#ff2a3b] bg-[#000000] px-3 py-1 rounded-md border border-[#ffffff]/10">
                  <ShieldCheck className="h-3 w-3 text-[#ff2a3b]" />
                  <span>{item.source}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ff2a3b] hover:text-[#ff4d5e] transition"
            >
              <span>Explore all 24 canonical exercises with video tutorials</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SECTION #WEEKLY: WEEKLY PLAN BUILDER ─── */}
      <section id="weekly" className="py-20 lg:py-28 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#ffffff]/10">
            <div>
              <span className="eyebrow">05 / RHYTHM & SCHEDULING</span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#ffffff]">
                WEEKLY <em>RHYTHM.</em>
              </h2>
            </div>
            <p className="max-w-md text-sm text-[#a1a1aa] leading-relaxed">
              Design your custom weekly training split and meal schedule with flexible days, drag-and-drop ordering, and sets/reps prescriptions.
            </p>
          </div>

          {/* Interactive Weekly Preview Grid */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { day: 'MON', label: 'Push & Chest', type: 'STRENGTH', focus: 'Incline DB Press' },
              { day: 'TUE', label: 'Pull & Lats', type: 'STRENGTH', focus: 'Chest-Supported Row' },
              { day: 'WED', label: 'Rest & Recover', type: 'RESET', focus: 'Hydration & Sleep' },
              { day: 'THU', label: 'Legs & Quads', type: 'STRENGTH', focus: 'Barbell Back Squat' },
              { day: 'FRI', label: 'Arms & Shoulders', type: 'STRENGTH', focus: 'Incline Curl' },
              { day: 'SAT', label: 'Conditioning', type: 'MOVE', focus: 'Calisthenics Split' },
              { day: 'SUN', label: 'Weekly Check-in', type: 'RESET', focus: 'Weight & Habits' },
            ].map((schedule, i) => (
              <ElectricBorder key={i} borderRadius={16} className="h-full">
                <div
                  className="kinetik-card p-4 flex flex-col justify-between text-left min-h-[170px] h-full"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#ffffff]/10 text-[10px] font-mono">
                      <span className="font-bold text-[#ff2a3b]">{schedule.day}</span>
                      <span className="text-[#71717a]">{schedule.type}</span>
                    </div>
                    <h4 className="mt-2.5 text-xs font-bold text-[#ffffff]">{schedule.label}</h4>
                    <p className="mt-1 text-[11px] text-[#a1a1aa]">{schedule.focus}</p>
                  </div>
                  <div className="pt-2 border-t border-[#ffffff]/10 text-[10px] font-mono text-[#ff2a3b]">
                    DAY 0{i + 1}
                  </div>
                </div>
              </ElectricBorder>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/auth/signup"
              className="kinetik-btn-lime px-8 py-3.5 text-xs font-extrabold shadow-md inline-flex items-center gap-2"
            >
              <span>BUILD YOUR CUSTOM SPLIT</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── MOBILE-FIRST SPOTLIGHT ─── */}
      <section className="py-20 lg:py-28 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="eyebrow flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-[#ff2a3b]" />
                THUMB ERGONOMICS
              </span>
              <h2 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[#ffffff] leading-tight">
                BUILT FOR THE <em>GYM FLOOR.</em>
              </h2>
              <p className="mt-4 text-[#a1a1aa] text-sm sm:text-base leading-relaxed">
                Most web apps fall apart on mobile devices. GroFit was designed from the ground up for one-handed handheld usage between heavy sets.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-mono font-black text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#ffffff]">Fixed Bottom Navigation Dock</h4>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">
                      Instantly switch between Workouts, My Plan, Diet, Habits, and Calories without reaching for the top corner of your phone.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-mono font-black text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#ffffff]">Tactile Bottom Drawers</h4>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">
                      Editing sets, renaming workout plans, or searching foods slide up smoothly as native bottom drawers with drag indicators.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ff2a3b] text-white font-mono font-black text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#ffffff]">48px Accessible Tap Targets</h4>
                    <p className="text-xs text-[#a1a1aa] mt-0.5">
                      Buttons and inputs are calibrated to minimum 48px heights, ensuring you never misclick even with chalked or sweaty hands.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/auth/signup"
                  className="kinetik-btn-lime px-6 py-3 text-xs font-bold"
                >
                  Experience GroFit on Mobile ↗
                </Link>
              </div>
            </div>

            {/* Mobile Graphic Frame */}
            <div className="flex justify-center">
              <div className="w-[300px] sm:w-[320px] rounded-[42px] border-4 border-[#ffffff]/15 bg-[#000000] p-3 shadow-2xl shadow-[#ff2a3b]/10">
                <div className="mx-auto h-4 w-28 rounded-full bg-[#1a1a1a] mb-3" />
                <div className="rounded-[30px] border border-[#ffffff]/10 bg-[#0d0d0d]/80 backdrop-blur-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-sm text-[#ffffff]">GROFIT</span>
                    <span className="h-2 w-2 rounded-full bg-[#ff2a3b] animate-pulse" />
                  </div>

                  <div className="rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-3">
                    <p className="text-[10px] text-[#a1a1aa] uppercase font-mono">Today&apos;s Split</p>
                    <p className="text-sm font-bold text-[#ffffff] mt-0.5">Day 1: Calisthenics Strength</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                      <div className="h-full w-3/4 bg-[#ff2a3b] rounded-full" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#ffffff]/10 bg-[#000000] p-3">
                    <p className="text-[10px] text-[#a1a1aa] uppercase font-mono">Top #1 Movement</p>
                    <p className="text-xs font-semibold text-[#ffffff] mt-0.5">Incline DB Press</p>
                    <p className="text-[10px] text-[#ff2a3b] mt-1 font-mono">EMG: 91% Clavicular activation</p>
                  </div>

                  {/* Mock Bottom Dock */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between rounded-xl border border-[#ffffff]/10 bg-[#000000] px-3 py-2 text-[10px] text-[#a1a1aa]">
                      <span className="text-[#ff2a3b] font-bold">Workouts</span>
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

      {/* ─── SECTION #FAQ ─── */}
      <section id="faq" className="py-20 lg:py-28 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow">QUESTIONS & ANSWERS</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-black text-[#ffffff]">
              FREQUENTLY ASKED <em>QUESTIONS.</em>
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#ffffff]/10 bg-[#0d0d0d]/75 backdrop-blur-md overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-[#ffffff] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#a1a1aa] transition-transform ${
                      openFaq === index ? 'rotate-180 text-[#ff2a3b]' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed border-t border-[#ffffff]/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL ATHLETIC CTA ─── */}
      <section className="py-20 border-t border-[#ffffff]/10 bg-transparent">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#ffffff]/15 bg-gradient-to-b from-[#0d0d0d] to-[#000000] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-48 w-96 -translate-x-1/2 rounded-full bg-[#ff2a3b]/15 blur-2xl" />

            <span className="eyebrow">JOIN THE TRAINING CULTURE</span>
            <h2 className="mt-3 font-display text-4xl sm:text-6xl font-black text-[#ffffff] tracking-tight">
              READY TO TRAIN <em>WITH INTENT?</em>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-sm sm:text-base text-[#a1a1aa]">
              Create your account in seconds. Apply evidence-based workout templates, track your nutrition with IFCT 2017 data, and build lifelong consistency.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="kinetik-btn-lime px-8 py-3.5 text-sm font-extrabold flex items-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login"
                className="kinetik-btn-dark px-8 py-3.5 text-sm font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER (Matching Kinetik Minimal Athletic Footer) ─── */}
      <footer className="border-t border-[#ffffff]/10 py-10 bg-black/60 text-[#71717a] text-xs">
        <div className="mx-auto max-w-[1720px] w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-mono">
            <div className="relative h-8 w-8 flex items-center justify-center">
              <Image
                src="/images/grofit-crest.png"
                alt="GroFit Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="font-display font-black text-base text-[#ffffff]">GRO<span className="text-[#ff2a3b]">FIT</span></span>
            <span>/</span>
            <span className="text-[#a1a1aa]">TRAIN WITH INTENT</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono tracking-wider uppercase text-[#a1a1aa]">
            <a href="#approach" className="hover:text-[#ff2a3b] transition">
              Method
            </a>
            <a href="#kinetic-lab" className="hover:text-[#ff2a3b] transition">
              3D Lab
            </a>
            <a href="#programs" className="hover:text-[#ff2a3b] transition">
              Paths
            </a>
            <a href="#rankings" className="hover:text-[#ff2a3b] transition">
              Rankings
            </a>
            <a href="#faq" className="hover:text-[#ff2a3b] transition">
              FAQ
            </a>
          </div>

          <p className="font-mono text-[11px] text-[#71717a]">
            &copy; 2026 GroFit Software Solutions.
          </p>
        </div>
      </footer>
    </div>
  );
}
