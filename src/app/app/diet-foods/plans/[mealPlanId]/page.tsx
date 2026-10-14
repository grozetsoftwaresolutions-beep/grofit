'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Utensils,
  Plus,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  SUPPORTED_MEAL_SLOTS,
  NutritionTotals,
  TargetComparisonResult,
} from '@/lib/nutrition/domain';
import { VERIFIED_FOOD_SEEDS } from '@/lib/nutrition/seed-data';

interface FoodItem {
  id: string;
  name: string;
  category: string;
  referenceQuantity: number;
  referenceUnit: string;
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fibreG: number | null;
}

interface MealPlanItemRow {
  id: string;
  mealPlanId: string;
  foodId: string;
  mealSlot: string;
  quantity: number;
  quantityUnit: string;
  sortOrder: number;
  food: FoodItem;
  scaledNutrients: {
    energyKcal: number | null;
    proteinG: number | null;
    carbohydratesG: number | null;
    fatG: number | null;
    fibreG: number | null;
    isApproximate: boolean;
  } | null;
}

interface MealPlanDetail {
  id: string;
  name: string;
  targetKcal: number | null;
  items: MealPlanItemRow[];
  slotTotals: Record<string, NutritionTotals>;
  dailyTotals: NutritionTotals;
  targetComparison: TargetComparisonResult;
}

function SavedPlanContent({ planId }: { planId: string }) {
  const router = useRouter();
  const [plan, setPlan] = useState<MealPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Edit Plan Details Modal
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Edit Portion Modal
  const [editItemModal, setEditItemModal] = useState<MealPlanItemRow | null>(null);
  const [editPortion, setEditPortion] = useState<number>(100);
  const [editSlot, setEditSlot] = useState<string>('breakfast');
  const [savingItem, setSavingItem] = useState(false);

  // Add Item Modal
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [availableFoods] = useState(VERIFIED_FOOD_SEEDS);
  const [selectedFoodId, setSelectedFoodId] = useState(VERIFIED_FOOD_SEEDS[0]?.id || '');
  const [addPortion, setAddPortion] = useState(100);
  const [addSlot, setAddSlot] = useState('lunch');
  const [addingItem, setAddingItem] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let unmounted = false;
    async function fetchPlan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/meal-plans/${planId}`);
        if (res.ok) {
          const json = await res.json();
          if (!unmounted && json.data) {
            setPlan(json.data);
            setEditName(json.data.name);
            setEditTarget(json.data.targetKcal ? String(json.data.targetKcal) : '');
          }
        } else if (res.status === 404) {
          router.push('/app/diet-foods');
        }
      } catch {
        // ignore
      } finally {
        if (!unmounted) {
          setLoading(false);
        }
      }
    }
    fetchPlan();
    return () => {
      unmounted = true;
    };
  }, [planId, reloadTrigger, router]);

  async function handleUpdatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setSavingPlan(true);
      const res = await fetch(`/api/meal-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          targetKcal: editTarget ? parseInt(editTarget, 10) : null,
        }),
      });

      if (res.ok) {
        setEditPlanModal(false);
        setReloadTrigger((k) => k + 1);
        setNotice('Plan settings updated.');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      alert('Error updating plan settings.');
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleUpdatePortion(e: React.FormEvent) {
    e.preventDefault();
    if (!editItemModal) return;

    try {
      setSavingItem(true);
      const res = await fetch(`/api/meal-plans/${planId}/items/${editItemModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editPortion,
          mealSlot: editSlot,
        }),
      });

      if (res.ok) {
        setEditItemModal(null);
        setReloadTrigger((k) => k + 1);
        setNotice('Portion updated.');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      alert('Error updating portion.');
    } finally {
      setSavingItem(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const sel = availableFoods.find((f) => f.id === selectedFoodId);
    if (!sel) return;

    try {
      setAddingItem(true);
      const res = await fetch(`/api/meal-plans/${planId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodId: sel.id,
          mealSlot: addSlot,
          quantity: addPortion,
          quantityUnit: sel.referenceUnit,
        }),
      });

      if (res.ok) {
        setAddFoodModal(false);
        setReloadTrigger((k) => k + 1);
        setNotice(`Added ${sel.name} to ${addSlot}.`);
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      alert('Error adding item.');
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remove this food from your meal plan?')) return;

    try {
      const res = await fetch(`/api/meal-plans/${planId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReloadTrigger((k) => k + 1);
        setNotice('Item removed.');
        setTimeout(() => setNotice(null), 3000);
      }
    } catch {
      alert('Error removing item.');
    }
  }

  async function handleDeletePlan() {
    if (!confirm('Are you sure you want to delete this entire meal plan?')) return;

    try {
      const res = await fetch(`/api/meal-plans/${planId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/app/diet-foods');
      }
    } catch {
      alert('Error deleting plan.');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl text-center py-12">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Meal plan not found or access denied.</p>
        <Link
          href="/app/diet-foods"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 hover:underline dark:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Diet Foods
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8 text-zinc-900 dark:text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/app/diet-foods"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-[44px] py-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Diet Foods
          </Link>
        </div>

        {/* Notice Toast */}
        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-zinc-900 dark:text-white" />
            {notice}
          </div>
        )}

        {/* Plan Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Utensils className="h-4 w-4" /> Personal Meal Plan
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{plan.name}</h1>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Daily Target: <strong className="text-zinc-900 dark:text-white">{plan.targetKcal ? `${plan.targetKcal} kcal` : 'Not specified'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditPlanModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 min-h-[44px]"
            >
              <Edit2 className="h-3.5 w-3.5" /> Rename / Goal
            </button>
            <button
              type="button"
              onClick={() => setAddFoodModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm min-h-[44px]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Food
            </button>
            <button
              type="button"
              onClick={handleDeletePlan}
              className="rounded-xl border border-zinc-200 p-2.5 text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-rose-400 dark:hover:bg-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nutritional Disclaimer */}
        <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <Info className="h-4 w-4 flex-shrink-0 text-zinc-900 dark:text-white mt-0.5" />
          <p>
            <strong>Guidance Notice:</strong> All nutrient calculations are based on verified IFCT 2017 & USDA reference data for fitness and portion tracking purposes only.
          </p>
        </div>

        {/* Daily Totals Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Daily Nutrition Totals
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {plan.dailyTotals.isComplete ? 'Complete Calculation' : 'Incomplete Totals'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Total Calories</span>
              <span className="text-lg font-extrabold text-zinc-900 dark:text-white">
                {plan.dailyTotals.energyKcal !== null ? `${plan.dailyTotals.energyKcal} kcal` : 'Incomplete'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Protein</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {plan.dailyTotals.proteinG !== null ? `${plan.dailyTotals.proteinG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Carbohydrates</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {plan.dailyTotals.carbohydratesG !== null ? `${plan.dailyTotals.carbohydratesG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80">
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Fat</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {plan.dailyTotals.fatG !== null ? `${plan.dailyTotals.fatG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80 col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-zinc-500 dark:text-zinc-400">Fibre</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {plan.dailyTotals.fibreG !== null ? `${plan.dailyTotals.fibreG}g` : '—'}
              </span>
            </div>
          </div>

          {/* Calorie Target Comparison */}
          {plan.targetComparison.canCompare ? (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Target Comparison:</span>{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {plan.targetComparison.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {(plan.targetComparison.differenceKcal ?? 0) > 0 ? '+' : ''}
                  {plan.targetComparison.differenceKcal} kcal
                </span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  ({((plan.targetComparison.differencePercent ?? 0) > 0 ? '+' : '')}
                  {plan.targetComparison.differencePercent}%)
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Meal Slots with Foods */}
        <div className="space-y-4">
          {SUPPORTED_MEAL_SLOTS.map((slot) => {
            const slotItems = plan.items.filter((i) => i.mealSlot === slot);
            const slotTotal = plan.slotTotals[slot];

            return (
              <div key={slot} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white capitalize">{slot}</h3>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {slotItems.length} food{slotItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {slotTotal?.energyKcal !== null && slotTotal?.energyKcal !== undefined
                        ? `${slotTotal.energyKcal} kcal`
                        : 'Incomplete'}
                    </span>
                    {slotTotal?.proteinG !== null && slotTotal?.proteinG !== undefined && (
                      <span className="text-zinc-500 dark:text-zinc-400 text-[10px] ml-2">
                        P: {slotTotal.proteinG}g
                      </span>
                    )}
                  </div>
                </div>

                {slotItems.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    No foods in this meal slot.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {slotItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-3 text-xs gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-zinc-900 dark:text-white truncate">{item.food.name}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Portion: <strong className="text-zinc-800 dark:text-zinc-200">{item.quantity} {item.quantityUnit}</strong>
                            {item.scaledNutrients && item.scaledNutrients.energyKcal !== null
                              ? ` (${item.scaledNutrients.energyKcal} kcal)`
                              : ' (kcal missing)'}
                            {item.scaledNutrients && item.scaledNutrients.proteinG !== null && ` • ${item.scaledNutrients.proteinG}g P`}
                            {item.scaledNutrients && item.scaledNutrients.carbohydratesG !== null && ` • ${item.scaledNutrients.carbohydratesG}g C`}
                            {item.scaledNutrients && item.scaledNutrients.fatG !== null && ` • ${item.scaledNutrients.fatG}g F`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditItemModal(item);
                              setEditPortion(item.quantity);
                              setEditSlot(item.mealSlot);
                            }}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                            title="Edit Portion"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-rose-400 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                            title="Remove Food"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODAL / BOTTOM SHEET: EDIT PLAN SETTINGS */}
        {editPlanModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
              <div className="flex items-start justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Edit Plan Settings</h3>
                <button
                  type="button"
                  onClick={() => setEditPlanModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePlan} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Daily Calorie Target (kcal)</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    placeholder="e.g. 2000"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditPlanModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                  >
                    {savingPlan ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL / BOTTOM SHEET: EDIT PORTION */}
        {editItemModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
              <div className="flex items-start justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base">Edit Portion</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{editItemModal.food.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditItemModal(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePortion} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Quantity ({editItemModal.quantityUnit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={editPortion}
                    onChange={(e) => setEditPortion(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Slot</label>
                  <select
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 capitalize focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  >
                    {SUPPORTED_MEAL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditItemModal(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                  >
                    {savingItem ? 'Saving...' : 'Save Portion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL / BOTTOM SHEET: ADD FOOD */}
        {addFoodModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
              <div className="flex items-start justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Add Food to Plan</h3>
                <button
                  type="button"
                  onClick={() => setAddFoodModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Select Food</label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  >
                    {availableFoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.referenceQuantity}{f.referenceUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Slot</label>
                  <select
                    value={addSlot}
                    onChange={(e) => setAddSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 capitalize focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  >
                    {SUPPORTED_MEAL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Portion</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={addPortion}
                    onChange={(e) => setAddPortion(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAddFoodModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                  >
                    {addingItem ? 'Adding...' : 'Add Food'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SavedPlanParamsWrapper({ params }: { params: Promise<{ mealPlanId: string }> }) {
  const { mealPlanId } = use(params);
  return <SavedPlanContent planId={mealPlanId} />;
}

export default function SavedMealPlanPage({ params }: { params: Promise<{ mealPlanId: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8 text-zinc-900 dark:text-zinc-100 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="h-6 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>
      }
    >
      <SavedPlanParamsWrapper params={params} />
    </Suspense>
  );
}
