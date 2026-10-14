'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Flame className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Calorie Calculator
            </h1>
            <p className="text-sm text-zinc-400 md:text-base">
              Calculate your basal metabolic rate (BMR), maintenance energy (TDEE), and daily nutrition targets using the scientific Mifflin–St Jeor equation.
            </p>
          </div>
        </div>

        {/* Notice & Adult-Only Banner */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 md:text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong>Adult Fitness Tool:</strong> This calculator provides educational energy estimates for adults aged 18 and older. These calculations are mathematical estimates, not individualized medical prescriptions.
          </p>
        </div>
      </div>

      {/* Main Grid: Form & Results */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Form Column */}
        <div className={result ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <form
            onSubmit={handleCalculate}
            className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8"
            noValidate
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Your Measurements & Goals
            </h2>

            {/* Error Announcement */}
            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Age Input */}
            <div className="space-y-2">
              <label
                htmlFor="calculator-age"
                className="block text-sm font-medium text-zinc-900 dark:text-zinc-200"
              >
                Age <span className="text-zinc-400">(years, 18–120)</span>
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
                className={`w-full rounded-xl border bg-zinc-50 px-4 py-2.5 text-zinc-900 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-zinc-800/50 dark:text-white dark:focus:bg-zinc-800 ${
                  clientErrors.age
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700'
                }`}
              />
              {clientErrors.age && (
                <p id="age-error" className="text-xs text-red-600 dark:text-red-400">
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
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                  >
                    <Ruler className="h-4 w-4 text-zinc-500" />
                    Height
                  </label>
                  <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`rounded px-2 py-0.5 font-medium transition ${
                        heightUnit === 'cm'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('in')}
                      className={`rounded px-2 py-0.5 font-medium transition ${
                        heightUnit === 'in'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
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
                  className={`w-full rounded-xl border bg-zinc-50 px-4 py-2.5 text-zinc-900 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-zinc-800/50 dark:text-white dark:focus:bg-zinc-800 ${
                    clientErrors.height
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700'
                  }`}
                />
                {clientErrors.height && (
                  <p id="height-error" className="text-xs text-red-600 dark:text-red-400">
                    {clientErrors.height}
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  {heightUnit === 'cm' ? 'Accepted: 100–250 cm' : 'Accepted: 39.4–98.4 inches'}
                </p>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="calculator-weight"
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-200"
                  >
                    <Scale className="h-4 w-4 text-zinc-500" />
                    Weight
                  </label>
                  <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`rounded px-2 py-0.5 font-medium transition ${
                        weightUnit === 'kg'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`rounded px-2 py-0.5 font-medium transition ${
                        weightUnit === 'lbs'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
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
                  className={`w-full rounded-xl border bg-zinc-50 px-4 py-2.5 text-zinc-900 transition focus:bg-white focus:outline-none focus:ring-2 dark:bg-zinc-800/50 dark:text-white dark:focus:bg-zinc-800 ${
                    clientErrors.weight
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-zinc-300 focus:border-orange-500 focus:ring-orange-500/20 dark:border-zinc-700'
                  }`}
                />
                {clientErrors.weight && (
                  <p id="weight-error" className="text-xs text-red-600 dark:text-red-400">
                    {clientErrors.weight}
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  {weightUnit === 'kg' ? 'Accepted: 25–350 kg' : 'Accepted: 55.1–771.6 lbs'}
                </p>
              </div>
            </div>

            {/* Formula Coefficient Selection */}
            <div className="space-y-2">
              <fieldset>
                <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                  Calculation Formula Coefficient
                </legend>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  The Mifflin–St Jeor formula uses a mathematical coefficient parameter. Select the formula parameter that best reflects your metabolic baseline. (This is a mathematical parameter, not a declaration of gender identity).
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                      bmrVariant === 'plus_5'
                        ? 'border-orange-500 bg-orange-50/40 dark:border-orange-500 dark:bg-orange-950/20'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bmrVariant"
                      value="plus_5"
                      checked={bmrVariant === 'plus_5'}
                      onChange={() => setBmrVariant('plus_5')}
                      className="mt-1 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Coefficient +5
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Conventional male-equation baseline parameter.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                      bmrVariant === 'minus_161'
                        ? 'border-orange-500 bg-orange-50/40 dark:border-orange-500 dark:bg-orange-950/20'
                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bmrVariant"
                      value="minus_161"
                      checked={bmrVariant === 'minus_161'}
                      onChange={() => setBmrVariant('minus_161')}
                      className="mt-1 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Coefficient −161
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                <legend className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-200">
                  <Activity className="h-4 w-4 text-zinc-500" />
                  Activity Level
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
                      desc: 'Very intense daily exercise or physically demanding job',
                    },
                  ].map((level) => (
                    <label
                      key={level.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                        activityLevel === level.id
                          ? 'border-orange-500 bg-orange-50/40 dark:border-orange-500 dark:bg-orange-950/20'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activityLevel"
                          value={level.id}
                          checked={activityLevel === level.id}
                          onChange={() => setActivityLevel(level.id as ActivityLevel)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-zinc-900 dark:text-white">
                            {level.label}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
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
                <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                  Primary Fitness Goal
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'lose',
                      title: 'Weight Loss',
                      badge: '−15% Deficit',
                      desc: 'Sustainable fat reduction',
                    },
                    {
                      id: 'maintain',
                      title: 'Maintenance',
                      badge: '0% Balance',
                      desc: 'Maintain current weight',
                    },
                    {
                      id: 'gain',
                      title: 'Weight Gain',
                      badge: '+10% Surplus',
                      desc: 'Muscle building & recovery',
                    },
                  ].map((g) => (
                    <label
                      key={g.id}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition ${
                        goal === g.id
                          ? 'border-orange-500 bg-orange-50/40 dark:border-orange-500 dark:bg-orange-950/20'
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                          {g.title}
                        </span>
                        <input
                          type="radio"
                          name="goal"
                          value={g.id}
                          checked={goal === g.id}
                          onChange={() => setGoal(g.id as Goal)}
                          className="mt-0.5 text-orange-600 focus:ring-orange-500"
                        />
                      </div>
                      <div className="mt-2 space-y-1">
                        <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {g.badge}
                        </span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{g.desc}</p>
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Column */}
        {result && (
          <div className="space-y-6 lg:col-span-5">
            {result.status === 'calculated' && (
              <div className="space-y-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/50 p-6 shadow-sm dark:border-orange-950 dark:from-zinc-900 dark:to-orange-950/20 md:p-8">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Calculated Result
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Mifflin–St Jeor
                  </span>
                </div>

                {/* Main Calorie Target Hero */}
                <div className="rounded-xl border border-orange-200/60 bg-white/80 p-6 text-center shadow-xs backdrop-blur-xs dark:border-orange-900/40 dark:bg-zinc-900/80">
                  <span className="text-xs font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Recommended Daily Intake
                  </span>
                  <div className="mt-2 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                    {result.targetKcalPerDay?.toLocaleString()}
                    <span className="ml-1.5 text-lg font-medium text-zinc-500 dark:text-zinc-400">
                      kcal/day
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Rounded to the nearest 10 kcal/day for practical dietary tracking.
                  </p>
                </div>

                {/* Breakdown Metrics */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Basal Metabolic Rate (BMR)
                    </div>
                    <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                      {result.bmrKcalPerDay.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-zinc-500">kcal/day</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Energy expended at complete resting baseline.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Maintenance (TDEE)
                    </div>
                    <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
                      {result.maintenanceKcalPerDay.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-zinc-500">kcal/day</span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Daily expenditure based on activity multiplier.
                    </p>
                  </div>
                </div>

                {/* Estimate Disclaimer */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
                  <p className="font-medium text-zinc-900 dark:text-zinc-200">
                    Estimate Disclaimer:
                  </p>
                  <p className="mt-0.5">{result.estimateDisclaimer}</p>
                </div>

                {/* Next Step Action to Diet Foods */}
                <Link
                  href="/app/diet"
                  className="flex items-center justify-between rounded-xl bg-zinc-900 p-4 text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  <div>
                    <div className="text-sm font-semibold">Explore Suitable Diet Foods</div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-600">
                      Find South Indian foods matched to your target
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            )}

            {/* Target Withheld Guardrail View */}
            {result.status === 'target_withheld' && (
              <div className="space-y-6 rounded-2xl border border-amber-300 bg-amber-50/70 p-6 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/20 md:p-8">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-amber-950 dark:text-amber-200">
                      Target Withheld for Safety
                    </h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80">
                      Reason Code: {result.reasonCode}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white/80 p-4 text-sm text-zinc-700 dark:border-amber-900/40 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <p>{result.message}</p>
                </div>

                {/* Informational Breakdown */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-amber-200/60 bg-white/60 p-3.5 dark:border-amber-900/30 dark:bg-zinc-900/60">
                    <div className="text-xs text-zinc-500">Estimated BMR</div>
                    <div className="text-base font-bold text-zinc-900 dark:text-white">
                      {result.bmrKcalPerDay} kcal/day
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-200/60 bg-white/60 p-3.5 dark:border-amber-900/30 dark:bg-zinc-900/60">
                    <div className="text-xs text-zinc-500">Estimated TDEE</div>
                    <div className="text-base font-bold text-zinc-900 dark:text-white">
                      {result.maintenanceKcalPerDay} kcal/day
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
