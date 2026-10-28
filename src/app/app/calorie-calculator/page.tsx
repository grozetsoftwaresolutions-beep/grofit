'use client';

import { useState } from 'react';
import Link from 'next/link';
import ElectricBorder from '@/components/ElectricBorder';
import {
  Flame,
  Activity,
  Scale,
  Ruler,
  Info,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  BmrVariant,
  ActivityLevel,
  Goal,
  HeightUnit,
  WeightUnit,
} from '@/lib/domain/calorie-calculator';

interface CalculationResponse {
  data?: {
    status: 'calculated' | 'target_withheld';
    bmrKcalPerDay: number;
    maintenanceKcalPerDay: number;
    targetKcalPerDay: number | null;
    reasonCode?: string;
    units?: {
      energy: string;
      height: string;
      weight: string;
    };
    method?: string;
    estimateDisclaimer?: string;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export default function CalorieCalculatorPage() {
  // Form state
  const [age, setAge] = useState<string>('25');
  const [heightValue, setHeightValue] = useState<string>('180');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [weightValue, setWeightValue] = useState<string>('90');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [bmrVariant, setBmrVariant] = useState<BmrVariant>('plus_5');
  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>('moderately_active');
  const [goal, setGoal] = useState<Goal>('maintain');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResponse['data'] | null>(null);

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    const numAge = Number(age);
    if (!age || Number.isNaN(numAge) || !Number.isInteger(numAge)) {
      errors.age = 'Please enter a valid whole number for age.';
    } else if (numAge < 18) {
      errors.age =
        'The calculator is intended for adults aged 18 and older. Calorie targets cannot be estimated for individuals under 18.';
    } else if (numAge > 120) {
      errors.age = 'Age must not exceed 120 years.';
    }

    const numHeight = Number(heightValue);
    if (!heightValue || Number.isNaN(numHeight) || numHeight <= 0) {
      errors.height = 'Please enter a positive height value.';
    } else {
      const heightInCm = heightUnit === 'in' ? numHeight * 2.54 : numHeight;
      if (heightInCm < 100 || heightInCm > 250) {
        errors.height =
          heightUnit === 'cm'
            ? 'Height must be between 100 and 250 cm.'
            : 'Height must be between 39.4 and 98.4 inches.';
      }
    }

    const numWeight = Number(weightValue);
    if (!weightValue || Number.isNaN(numWeight) || numWeight <= 0) {
      errors.weight = 'Please enter a positive weight value.';
    } else {
      const weightInKg = weightUnit === 'lbs' ? numWeight * 0.45359237 : numWeight;
      if (weightInKg < 25 || weightInKg > 350) {
        errors.weight =
          weightUnit === 'kg'
            ? 'Weight must be between 25 and 350 kg.'
            : 'Weight must be between 55.1 and 771.6 lbs.';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClient()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ageYears: Number(age),
        height: {
          value: Number(heightValue),
          unit: heightUnit,
        },
        weight: {
          value: Number(weightValue),
          unit: weightUnit,
        },
        bmrVariant,
        activityLevel,
        goal,
      };

      const res = await fetch('/api/calorie-calculator/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: CalculationResponse = await res.json();

      if (!res.ok) {
        setServerError(data.error?.message || 'Calculation request failed.');
        setResult(null);
      } else if (data.data) {
        setResult(data.data);
      }
    } catch {
      setServerError('Network error while requesting calculation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setServerError(null);
    setClientErrors({});
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header Banner */}
      <ElectricBorder borderRadius={20}>
        <div className="kinetik-card rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a] border border-[#ff2a3b]/30 text-[#ff2a3b]">
            <Flame className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="eyebrow flex items-center gap-2 text-xs">
              <Activity className="h-3.5 w-3.5 text-[#ff2a3b]" /> METABOLIC EXPENDITURE &amp; TDEE
            </div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-[#ffffff] md:text-4xl">
              CALORIE ARCHITECTURE
            </h1>
            <p className="text-xs sm:text-sm text-[#ffffff]/60 max-w-2xl font-light">
              Calculate your basal metabolic rate (BMR), total daily energy expenditure (TDEE), and precision macronutrient caloric targets using the Mifflin–St Jeor formula.
            </p>
          </div>
        </div>

        {/* Notice & Adult-Only Banner */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#1b3d27]/70 bg-[#000000]/60 p-4 text-xs text-[#ffffff]/70">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#ff2a3b]" />
          <p>
            <strong className="text-[#ffffff] uppercase tracking-wide">Adult Fitness Protocol:</strong> This tool provides educational baseline energy estimates for adults aged 18 and older. Calculations represent biological mathematical estimates, not individualized medical prescriptions.
          </p>
        </div>
      </div>
      </ElectricBorder>

      {/* Main Grid: Form & Results */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Column */}
        <div className={result ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <ElectricBorder borderRadius={20} className="h-full">
            <form
              onSubmit={handleCalculate}
              className="kinetik-card space-y-6 rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-6 shadow-sm md:p-8 h-full"
              noValidate
            >
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-[#ffffff]">
              YOUR MEASUREMENTS &amp; GOALS
            </h2>

            {/* Error Announcement */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-xs text-rose-300"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Age Input */}
            <div className="space-y-2">
              <label
                htmlFor="calculator-age"
                className="block text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70"
              >
                Age <span className="text-[#ffffff]/40 font-mono">(years, 18–120)</span>
              </label>
              <input
                id="calculator-age"
                type="number"
                min="18"
                max="120"
                step="1"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-describedby={clientErrors.age ? 'age-error' : undefined}
                aria-invalid={Boolean(clientErrors.age)}
                required
                className={`w-full rounded-xl border bg-[#000000] px-4 py-2.5 text-xs text-[#ffffff] transition focus:outline-none focus:ring-1 min-h-[44px] ${
                  clientErrors.age
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-[#1b3d27] focus:border-[#ff2a3b] focus:ring-[#ff2a3b]'
                }`}
              />
              {clientErrors.age && (
                <p id="age-error" className="text-xs text-rose-400">
                  {clientErrors.age}
                </p>
              )}
            </div>

            {/* Height & Weight Inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="calculator-height"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70"
                  >
                    <Ruler className="h-4 w-4 text-[#ff2a3b]" />
                    Height
                  </label>
                  <div className="inline-flex rounded-lg border border-[#1b3d27] bg-[#000000] p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`rounded px-2 py-0.5 font-bold transition ${
                        heightUnit === 'cm'
                          ? 'bg-[#ff2a3b] text-white shadow-xs'
                          : 'text-[#ffffff]/50 hover:text-[#ffffff]'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('in')}
                      className={`rounded px-2 py-0.5 font-bold transition ${
                        heightUnit === 'in'
                          ? 'bg-[#ff2a3b] text-white shadow-xs'
                          : 'text-[#ffffff]/50 hover:text-[#ffffff]'
                      }`}
                    >
                      in
                    </button>
                  </div>
                </div>
                <input
                  id="calculator-height"
                  type="number"
                  step="any"
                  value={heightValue}
                  onChange={(e) => setHeightValue(e.target.value)}
                  aria-describedby={clientErrors.height ? 'height-error' : undefined}
                  aria-invalid={Boolean(clientErrors.height)}
                  required
                  placeholder={heightUnit === 'cm' ? '180' : '71'}
                  className={`w-full rounded-xl border bg-[#000000] px-4 py-2.5 text-xs text-[#ffffff] transition focus:outline-none focus:ring-1 min-h-[44px] ${
                    clientErrors.height
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-[#1b3d27] focus:border-[#ff2a3b] focus:ring-[#ff2a3b]'
                  }`}
                />
                {clientErrors.height && (
                  <p id="height-error" className="text-xs text-rose-400">
                    {clientErrors.height}
                  </p>
                )}
                <p className="text-[10px] font-mono text-[#ffffff]/40">
                  {heightUnit === 'cm' ? 'Accepted: 100–250 cm' : 'Accepted: 39.4–98.4 inches'}
                </p>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="calculator-weight"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70"
                  >
                    <Scale className="h-4 w-4 text-[#ff2a3b]" />
                    Weight
                  </label>
                  <div className="inline-flex rounded-lg border border-[#1b3d27] bg-[#000000] p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`rounded px-2 py-0.5 font-bold transition ${
                        weightUnit === 'kg'
                          ? 'bg-[#ff2a3b] text-white shadow-xs'
                          : 'text-[#ffffff]/50 hover:text-[#ffffff]'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`rounded px-2 py-0.5 font-bold transition ${
                        weightUnit === 'lbs'
                          ? 'bg-[#ff2a3b] text-white shadow-xs'
                          : 'text-[#ffffff]/50 hover:text-[#ffffff]'
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
                <input
                  id="calculator-weight"
                  type="number"
                  step="any"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  aria-describedby={clientErrors.weight ? 'weight-error' : undefined}
                  aria-invalid={Boolean(clientErrors.weight)}
                  required
                  placeholder={weightUnit === 'kg' ? '90' : '198'}
                  className={`w-full rounded-xl border bg-[#000000] px-4 py-2.5 text-xs text-[#ffffff] transition focus:outline-none focus:ring-1 min-h-[44px] ${
                    clientErrors.weight
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-[#1b3d27] focus:border-[#ff2a3b] focus:ring-[#ff2a3b]'
                  }`}
                />
                {clientErrors.weight && (
                  <p id="weight-error" className="text-xs text-rose-400">
                    {clientErrors.weight}
                  </p>
                )}
                <p className="text-[10px] font-mono text-[#ffffff]/40">
                  {weightUnit === 'kg' ? 'Accepted: 25–350 kg' : 'Accepted: 55.1–771.6 lbs'}
                </p>
              </div>
            </div>

            {/* Formula Coefficient Selection */}
            <div className="space-y-2">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                  Calculation Formula Coefficient
                </legend>
                <p className="mt-0.5 text-xs text-[#ffffff]/50 font-light">
                  The Mifflin–St Jeor formula utilizes an empirical metabolic baseline parameter. (This is a mathematical metabolic coefficient, not a declaration of gender identity).
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      bmrVariant === 'plus_5'
                        ? 'border-[#ff2a3b] bg-[#1a1a1a] shadow-[0_0_12px_rgba(255, 42, 59, 0.1)]'
                        : 'border-[#1b3d27] bg-[#000000]/60 hover:border-[#ff2a3b]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bmrVariant"
                      value="plus_5"
                      checked={bmrVariant === 'plus_5'}
                      onChange={() => setBmrVariant('plus_5')}
                      className="mt-1 accent-[#ff2a3b]"
                    />
                    <div className="space-y-0.5">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                        Coefficient +5
                      </span>
                      <p className="text-xs text-[#ffffff]/60">
                        Conventional male-equation baseline parameter.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                      bmrVariant === 'minus_161'
                        ? 'border-[#ff2a3b] bg-[#1a1a1a] shadow-[0_0_12px_rgba(255, 42, 59, 0.1)]'
                        : 'border-[#1b3d27] bg-[#000000]/60 hover:border-[#ff2a3b]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bmrVariant"
                      value="minus_161"
                      checked={bmrVariant === 'minus_161'}
                      onChange={() => setBmrVariant('minus_161')}
                      className="mt-1 accent-[#ff2a3b]"
                    />
                    <div className="space-y-0.5">
                      <span className="font-display text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                        Coefficient −161
                      </span>
                      <p className="text-xs text-[#ffffff]/60">
                        Conventional female-equation baseline parameter.
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* Activity Level Selector */}
            <div className="space-y-2">
              <fieldset>
                <legend className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                  <Activity className="h-4 w-4 text-[#ff2a3b]" />
                  Activity Multiplier
                </legend>
                <div className="mt-2 space-y-2">
                  {[
                    {
                      id: 'sedentary',
                      label: 'Sedentary (1.2×)',
                      desc: 'Little or no routine physical activity; desk work',
                    },
                    {
                      id: 'lightly_active',
                      label: 'Lightly Active (1.375×)',
                      desc: 'Light activity and exercise 1–3 days per week',
                    },
                    {
                      id: 'moderately_active',
                      label: 'Moderately Active (1.55×)',
                      desc: 'Moderate exercise or sports 3–5 days per week',
                    },
                    {
                      id: 'very_active',
                      label: 'Very Active (1.725×)',
                      desc: 'Hard exercise or sports 6–7 days per week',
                    },
                    {
                      id: 'extra_active',
                      label: 'Extra Active (1.9×)',
                      desc: 'Very intense daily athletic training or physically demanding trade',
                    },
                  ].map((level) => (
                    <label
                      key={level.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                        activityLevel === level.id
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] shadow-[0_0_12px_rgba(255, 42, 59, 0.08)]'
                          : 'border-[#1b3d27] bg-[#000000]/50 hover:border-[#ff2a3b]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activityLevel"
                          value={level.id}
                          checked={activityLevel === level.id}
                          onChange={() => setActivityLevel(level.id as ActivityLevel)}
                          className="accent-[#ff2a3b]"
                        />
                        <div>
                          <div className="font-display text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                            {level.label}
                          </div>
                          <div className="text-xs text-[#ffffff]/60">
                            {level.desc}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Goal Selector */}
            <div className="space-y-2">
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                  Primary Caloric Target Goal
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'lose',
                      title: 'Fat Loss',
                      badge: '−15% Deficit',
                      desc: 'Sustainable fat reduction',
                    },
                    {
                      id: 'maintain',
                      title: 'Maintenance',
                      badge: '0% Balance',
                      desc: 'Maintain current body mass',
                    },
                    {
                      id: 'gain',
                      title: 'Hypertrophy Surplus',
                      badge: '+10% Surplus',
                      desc: 'Muscle building & performance',
                    },
                  ].map((g) => (
                    <label
                      key={g.id}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                        goal === g.id
                          ? 'border-[#ff2a3b] bg-[#1a1a1a] shadow-[0_0_12px_rgba(255, 42, 59, 0.08)]'
                          : 'border-[#1b3d27] bg-[#000000]/50 hover:border-[#ff2a3b]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-display text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                          {g.title}
                        </span>
                        <input
                          type="radio"
                          name="goal"
                          value={g.id}
                          checked={goal === g.id}
                          onChange={() => setGoal(g.id as Goal)}
                          className="mt-0.5 accent-[#ff2a3b]"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="inline-block rounded-md bg-[#000000] border border-[#1b3d27] px-2 py-0.5 text-[10px] font-mono font-bold text-[#ff2a3b]">
                          {g.badge}
                        </span>
                        <p className="text-xs text-[#ffffff]/60">{g.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="kinetik-btn-lime flex flex-1 items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50 min-h-[46px]"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#000000] border-t-transparent" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Calculate Daily Target
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="kinetik-btn-dark flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider min-h-[46px]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </form>
          </ElectricBorder>
        </div>

        {/* Results Column */}
        {result && (
          <div className="space-y-6 lg:col-span-5">
            {result.status === 'calculated' && (
              <ElectricBorder borderRadius={20}>
                <div className="kinetik-card space-y-6 rounded-2xl border border-[#ff2a3b]/40 bg-[#0d0d0d]/90 p-6 shadow-xl md:p-8">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff2a3b]/30 bg-[#1a1a1a] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ff2a3b]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Calculated Result
                  </span>
                  <span className="text-[11px] font-mono text-[#ffffff]/50">
                    Mifflin–St Jeor
                  </span>
                </div>

                {/* Main Calorie Target Hero */}
                <div className="rounded-2xl border border-[#1b3d27] bg-[#000000] p-6 text-center shadow-lg">
                  <span className="eyebrow text-xs text-[#ff2a3b]">
                    RECOMMENDED DAILY INTAKE
                  </span>
                  <div className="mt-2 font-display text-5xl font-black tracking-tight text-[#ff2a3b] md:text-6xl">
                    {result.targetKcalPerDay?.toLocaleString()}
                    <span className="ml-2 font-mono text-base font-bold text-[#ffffff]/60">
                      kcal/day
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] font-mono text-[#ffffff]/50">
                    Calibrated to the nearest 10 kcal/day for dietary adherence.
                  </p>
                </div>

                {/* Breakdown Metrics */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#1b3d27] bg-[#000000]/80 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#ffffff]/50">
                      Basal Metabolic Rate (BMR)
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-[#ffffff]">
                      {result.bmrKcalPerDay.toLocaleString()}
                      <span className="ml-1 text-xs font-mono font-normal text-[#ffffff]/50">kcal/day</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#ffffff]/50">
                      Energy expended at complete resting baseline.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#1b3d27] bg-[#000000]/80 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#ffffff]/50">
                      Maintenance (TDEE)
                    </div>
                    <div className="mt-1 font-display text-2xl font-bold text-[#ffffff]">
                      {result.maintenanceKcalPerDay.toLocaleString()}
                      <span className="ml-1 text-xs font-mono font-normal text-[#ffffff]/50">kcal/day</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#ffffff]/50">
                      Daily expenditure based on activity multiplier.
                    </p>
                  </div>
                </div>

                {/* Estimate Disclaimer */}
                <div className="rounded-xl border border-[#1b3d27] bg-[#000000]/60 p-4 text-xs text-[#ffffff]/60">
                  <p className="font-bold text-[#ffffff]">
                    Estimate Disclaimer:
                  </p>
                  <p className="mt-0.5 leading-relaxed">{result.estimateDisclaimer}</p>
                </div>

                {/* Next Step Action to Diet Foods */}
                <Link
                  href="/app/diet-foods"
                  className="kinetik-btn-lime flex items-center justify-between p-4 font-bold uppercase tracking-wider min-h-[48px]"
                >
                  <div>
                    <div className="text-xs font-bold text-white">Explore Verified Diet Foods</div>
                    <div className="text-[10px] text-white/80 font-normal">
                      Match Tamil Nadu staples to your calculated target
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white" />
                </Link>
              </div>
              </ElectricBorder>
            )}

            {/* Target Withheld Guardrail View */}
            {result.status === 'target_withheld' && (
              <div className="kinetik-card space-y-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 shadow-sm md:p-8 text-[#ffffff]">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-amber-400" />
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-amber-200">
                      Target Withheld for Safety
                    </h3>
                    <p className="text-xs font-mono text-amber-300/80">
                      Reason Code: {result.reasonCode}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-[#000000]/80 p-4 text-xs text-[#ffffff]/80 leading-relaxed">
                  <p>{result.message}</p>
                </div>

                {/* Informational Breakdown */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-3.5">
                    <div className="text-[10px] font-mono text-[#ffffff]/50">Estimated BMR</div>
                    <div className="font-display text-lg font-bold text-[#ffffff]">
                      {result.bmrKcalPerDay} kcal/day
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#1b3d27] bg-[#000000] p-3.5">
                    <div className="text-[10px] font-mono text-[#ffffff]/50">Estimated TDEE</div>
                    <div className="font-display text-lg font-bold text-[#ffffff]">
                      {result.maintenanceKcalPerDay} kcal/day
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#ffffff]/50 leading-relaxed">
                  The application adheres to an unyielding minimum safety floor (1,200 kcal/day) and will not automatically recommend deficits below this threshold without professional medical guidance.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
