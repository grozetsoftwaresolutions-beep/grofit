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
        <div className="h-6 w-36 animate-pulse rounded bg-[#0d0d0d] border border-[#1b3d27]" />
        <div className="h-48 animate-pulse rounded-2xl bg-[#0d0d0d]/60 border border-[#1b3d27]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-4xl text-center py-12">
        <p className="text-sm text-[#ffffff]/60">Meal plan not found or access denied.</p>
        <Link
          href="/app/diet-foods"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff2a3b] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Diet Foods
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] px-4 py-8 text-[#ffffff] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/app/diet-foods"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#ffffff]/60 hover:text-[#ff2a3b] transition-colors min-h-[44px] py-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Diet Foods
          </Link>
        </div>

        {/* Notice Toast */}
        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ff2a3b]/40 bg-[#1a1a1a] px-4 py-3 text-xs font-semibold text-[#ffffff] shadow-lg animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-[#ff2a3b]" />
            {notice}
          </div>
        )}

        {/* Plan Header Card */}
        <div className="kinetik-card flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-6 shadow-sm gap-4">
          <div>
            <div className="eyebrow flex items-center gap-2 text-xs">
              <Utensils className="h-4 w-4 text-[#ff2a3b]" /> PERSONAL MEAL ARCHITECTURE
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#ffffff]">{plan.name}</h1>
            <p className="mt-1 text-xs text-[#ffffff]/60">
              Daily Target: <strong className="text-[#ff2a3b] font-mono">{plan.targetKcal ? `${plan.targetKcal} kcal` : 'Not specified'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditPlanModal(true)}
              className="kinetik-btn-dark inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              <Edit2 className="h-3.5 w-3.5" /> Rename / Goal
            </button>
            <button
              type="button"
              onClick={() => setAddFoodModal(true)}
              className="kinetik-btn-lime inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Food
            </button>
            <button
              type="button"
              onClick={handleDeletePlan}
              className="rounded-xl border border-[#1b3d27] p-2.5 text-[#ffffff]/50 hover:text-rose-400 hover:bg-[#000000] min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nutritional Disclaimer */}
        <div className="kinetik-card flex items-start gap-3 rounded-2xl border border-[#1b3d27]/70 bg-[#0d0d0d]/50 p-4 text-xs text-[#ffffff]/70 shadow-sm">
          <Info className="h-4 w-4 flex-shrink-0 text-[#ff2a3b] mt-0.5" />
          <p>
            <strong className="text-[#ffffff] uppercase tracking-wide">Guidance Notice:</strong> All nutrient calculations are based on verified IFCT 2017 &amp; USDA reference data for athletic portion tracking and energy balance.
          </p>
        </div>

        {/* Daily Totals Card */}
        <div className="kinetik-card rounded-2xl border border-[#1b3d27]/80 bg-[#0d0d0d]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow text-xs text-[#ff2a3b]">
              DAILY NUTRITION TOTALS
            </span>
            <span className="text-[10px] font-mono text-[#ffffff]/50">
              {plan.dailyTotals.isComplete ? 'Complete Calculation' : 'Incomplete Totals'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="rounded-xl bg-[#000000] p-3 border border-[#1b3d27]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#ffffff]/50">Total Calories</span>
              <span className="font-display text-lg font-extrabold text-[#ff2a3b]">
                {plan.dailyTotals.energyKcal !== null ? `${plan.dailyTotals.energyKcal} kcal` : 'Incomplete'}
              </span>
            </div>
            <div className="rounded-xl bg-[#000000] p-3 border border-[#1b3d27]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#ffffff]/50">Protein</span>
              <span className="font-mono text-base font-bold text-[#ffffff]">
                {plan.dailyTotals.proteinG !== null ? `${plan.dailyTotals.proteinG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-[#000000] p-3 border border-[#1b3d27]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#ffffff]/50">Carbohydrates</span>
              <span className="font-mono text-base font-bold text-[#ffffff]">
                {plan.dailyTotals.carbohydratesG !== null ? `${plan.dailyTotals.carbohydratesG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-[#000000] p-3 border border-[#1b3d27]">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#ffffff]/50">Fat</span>
              <span className="font-mono text-base font-bold text-[#ffffff]">
                {plan.dailyTotals.fatG !== null ? `${plan.dailyTotals.fatG}g` : '—'}
              </span>
            </div>
            <div className="rounded-xl bg-[#000000] p-3 border border-[#1b3d27] col-span-2 sm:col-span-1">
              <span className="block text-[10px] uppercase font-mono tracking-wider text-[#ffffff]/50">Fibre</span>
              <span className="font-mono text-base font-bold text-[#ffffff]">
                {plan.dailyTotals.fibreG !== null ? `${plan.dailyTotals.fibreG}g` : '—'}
              </span>
            </div>
          </div>

          {/* Calorie Target Comparison */}
          {plan.targetComparison.canCompare ? (
            <div className="mt-4 pt-3 border-t border-[#1b3d27] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#ffffff]/50">Target Comparison:</span>{' '}
                <span className="font-mono font-bold text-[#ff2a3b] uppercase">
                  {plan.targetComparison.status}
                </span>
              </div>
              <div className="text-right">
                <span className="font-display text-base font-extrabold text-[#ffffff]">
                  {(plan.targetComparison.differenceKcal ?? 0) > 0 ? '+' : ''}
                  {plan.targetComparison.differenceKcal} kcal
                </span>
                <span className="ml-2 font-mono text-xs text-[#ff2a3b]">
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
              <div key={slot} className="kinetik-card rounded-2xl border border-[#1b3d27]/70 bg-[#0d0d0d]/70 p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#1b3d27]/60 pb-2 mb-3">
                  <div>
                    <h3 className="eyebrow text-xs text-[#ff2a3b]">{slot}</h3>
                    <span className="text-[10px] font-mono text-[#ffffff]/50">
                      {slotItems.length} food{slotItems.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="font-display font-bold text-[#ffffff]">
                      {slotTotal?.energyKcal !== null && slotTotal?.energyKcal !== undefined
                        ? `${slotTotal.energyKcal} kcal`
                        : 'Incomplete'}
                    </span>
                    {slotTotal?.proteinG !== null && slotTotal?.proteinG !== undefined && (
                      <span className="text-[#ff2a3b] font-mono text-[10px] ml-2">
                        P: {slotTotal.proteinG}g
                      </span>
                    )}
                  </div>
                </div>

                {slotItems.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#ffffff]/40">
                    No foods in this meal slot.
                  </div>
                ) : (
                  <div className="divide-y divide-[#1b3d27]/60">
                    {slotItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-3 text-xs gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#ffffff] truncate">{item.food.name}</div>
                          <div className="text-[11px] text-[#ffffff]/60 mt-0.5">
                            Portion: <strong className="text-[#ffffff] font-mono">{item.quantity} {item.quantityUnit}</strong>
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
                            className="rounded-lg p-2 text-[#ffffff]/50 hover:bg-[#1a1a1a] hover:text-[#ff2a3b] min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                            title="Edit Portion"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="rounded-lg p-2 text-[#ffffff]/50 hover:bg-[#1a1a1a] hover:text-rose-400 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000000]/80 p-0 sm:p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff] max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#1b3d27] sm:hidden" />
              <div className="flex items-start justify-between border-b border-[#1b3d27] pb-3">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">Edit Plan Settings</h3>
                <button
                  type="button"
                  onClick={() => setEditPlanModal(false)}
                  className="rounded-lg p-1.5 text-[#ffffff]/50 hover:bg-[#1a1a1a] hover:text-[#ffffff]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePlan} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Meal Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Daily Calorie Target (kcal)</label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    placeholder="e.g. 2000"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] placeholder-[#ffffff]/40 focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#1b3d27]">
                  <button
                    type="button"
                    onClick={() => setEditPlanModal(false)}
                    className="kinetik-btn-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="kinetik-btn-lime px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-h-[44px]"
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000000]/80 p-0 sm:p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff] max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#1b3d27] sm:hidden" />
              <div className="flex items-start justify-between border-b border-[#1b3d27] pb-3">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">Edit Portion</h3>
                  <p className="text-xs text-[#ff2a3b] mt-0.5">{editItemModal.food.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditItemModal(null)}
                  className="rounded-lg p-1.5 text-[#ffffff]/50 hover:bg-[#1a1a1a] hover:text-[#ffffff]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePortion} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">
                    Quantity ({editItemModal.quantityUnit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={editPortion}
                    onChange={(e) => setEditPortion(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Meal Slot</label>
                  <select
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] capitalize focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  >
                    {SUPPORTED_MEAL_SLOTS.map((s) => (
                      <option key={s} value={s} className="bg-[#000000] text-[#ffffff]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#1b3d27]">
                  <button
                    type="button"
                    onClick={() => setEditItemModal(null)}
                    className="kinetik-btn-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="kinetik-btn-lime px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-h-[44px]"
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#000000]/80 p-0 sm:p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-[#1b3d27] bg-[#0d0d0d] p-6 shadow-2xl text-[#ffffff] max-h-[90vh] overflow-y-auto">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#1b3d27] sm:hidden" />
              <div className="flex items-start justify-between border-b border-[#1b3d27] pb-3">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[#ffffff]">Add Food to Plan</h3>
                <button
                  type="button"
                  onClick={() => setAddFoodModal(false)}
                  className="rounded-lg p-1.5 text-[#ffffff]/50 hover:bg-[#1a1a1a] hover:text-[#ffffff]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Select Food</label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  >
                    {availableFoods.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#000000] text-[#ffffff]">
                        {f.name} ({f.referenceQuantity}{f.referenceUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Meal Slot</label>
                  <select
                    value={addSlot}
                    onChange={(e) => setAddSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] capitalize focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  >
                    {SUPPORTED_MEAL_SLOTS.map((s) => (
                      <option key={s} value={s} className="bg-[#000000] text-[#ffffff]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#ffffff]/70">Portion</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={addPortion}
                    onChange={(e) => setAddPortion(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#1b3d27] bg-[#000000] p-3 text-xs text-[#ffffff] focus:border-[#ff2a3b] focus:outline-none min-h-[44px]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#1b3d27]">
                  <button
                    type="button"
                    onClick={() => setAddFoodModal(false)}
                    className="kinetik-btn-dark px-4 py-2.5 text-xs font-bold uppercase tracking-wider min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="kinetik-btn-lime px-4 py-2.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 min-h-[44px]"
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
        <div className="min-h-screen bg-[#000000] px-4 py-8 text-[#ffffff] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="h-6 w-36 animate-pulse rounded bg-[#0d0d0d] border border-[#1b3d27]" />
            <div className="h-48 animate-pulse rounded-2xl bg-[#0d0d0d]/60 border border-[#1b3d27]" />
          </div>
        </div>
      }
    >
      <SavedPlanParamsWrapper params={params} />
    </Suspense>
  );
}
