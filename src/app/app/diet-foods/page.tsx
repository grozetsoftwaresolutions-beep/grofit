'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Search,
  Plus,
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen,
  Trash2,
  Edit2,
  X,
  Copy,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  SUPPORTED_MEAL_SLOTS,
  NutritionTotals,
  TargetComparisonResult,
} from '@/lib/nutrition/domain';
import { VERIFIED_FOOD_SEEDS } from '@/lib/nutrition/seed-data';
import { getAllComputedSamplePlans, ComputedSamplePlan } from '@/lib/nutrition/sample-plans';

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  foodForm: string | null;
  dietaryPreference: string;
  mealTypes: string[];
  referenceQuantity: number;
  referenceUnit: string;
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  fibreG: number | null;
  sourceName: string;
  sourceRecordId: string | null;
  sourceReference: string;
  matchStatus: string;
  valueMethod: string;
}

interface MealPlanSummary {
  id: string;
  name: string;
  targetKcal: number | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
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

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'grains_cereals', label: 'Grains & Cereals' },
  { value: 'pulses_legumes', label: 'Pulses & Legumes' },
  { value: 'prepared_dishes', label: 'Traditional Dishes' },
  { value: 'vegetables', label: 'Vegetables & Greens' },
  { value: 'dairy', label: 'Milk & Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'poultry_meat', label: 'Chicken & Meat' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'nuts_seeds', label: 'Nuts & Seeds' },
  { value: 'beverages', label: 'Beverages' },
];

const DIETARY_OPTIONS = [
  { value: 'all', label: 'All Diets' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'egg', label: 'Egg' },
  { value: 'non_vegetarian', label: 'Non-Veg' },
];

function DietFoodsContent() {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'samples' | 'my-plans'>('catalogue');

  // Catalogue State
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [foodSearch, setFoodSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDiet, setSelectedDiet] = useState('all');

  // Meal Plans State
  const [userPlans, setUserPlans] = useState<MealPlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activePlanDetail, setActivePlanDetail] = useState<MealPlanDetail | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planReloadTrigger, setPlanReloadTrigger] = useState(0);

  // Modals
  const [addFoodModal, setAddFoodModal] = useState<FoodItem | null>(null);
  const [addPortion, setAddPortion] = useState<number>(100);
  const [addUnit, setAddUnit] = useState<string>('g');
  const [addSlot, setAddSlot] = useState<string>('breakfast');
  const [targetPlanIdForAdd, setTargetPlanIdForAdd] = useState<string>('');

  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTarget, setNewPlanTarget] = useState<string>('2000');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editItemModal, setEditItemModal] = useState<MealPlanItemRow | null>(null);
  const [editPortion, setEditPortion] = useState<number>(100);
  const [editSlot, setEditSlot] = useState<string>('breakfast');

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Computed sample days dynamically calculated from verified food seeds
  const samplePlans: ComputedSamplePlan[] = useMemo(() => {
    return getAllComputedSamplePlans();
  }, []);

  // 1. Fetch Food Catalogue
  useEffect(() => {
    let unmounted = false;
    async function fetchCatalogue() {
      try {
        setLoadingFoods(true);
        const res = await fetch('/api/foods');
        if (res.ok) {
          const json = await res.json();
          if (!unmounted && json.data) {
            setFoods(json.data);
          }
        }
      } catch {
        if (!unmounted) {
          setFoods(
            VERIFIED_FOOD_SEEDS.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              category: s.category,
              foodForm: s.foodForm,
              dietaryPreference: s.dietaryPreference,
              mealTypes: s.mealTypes,
              referenceQuantity: s.referenceQuantity,
              referenceUnit: s.referenceUnit,
              energyKcal: s.energyKcal,
              proteinG: s.proteinG,
              carbohydratesG: s.carbohydratesG,
              fatG: s.fatG,
              fibreG: s.fibreG,
              sourceName: s.sourceName,
              sourceRecordId: s.sourceRecordId,
              sourceReference: s.sourceReference,
              matchStatus: s.matchStatus,
              valueMethod: s.valueMethod,
            }))
          );
        }
      } finally {
        if (!unmounted) {
          setLoadingFoods(false);
        }
      }
    }
    fetchCatalogue();
    return () => {
      unmounted = true;
    };
  }, []);

  // 2. Fetch User Meal Plans
  useEffect(() => {
    let unmounted = false;
    async function fetchPlans() {
      try {
        const res = await fetch('/api/meal-plans');
        if (res.ok) {
          const json = await res.json();
          if (!unmounted && json.data) {
            setUserPlans(json.data);
            if (json.data.length > 0 && !selectedPlanId) {
              setSelectedPlanId(json.data[0].id);
            }
          }
        }
      } catch {
        // ignore
      }
    }
    fetchPlans();
    return () => {
      unmounted = true;
    };
  }, [planReloadTrigger, selectedPlanId]);

  // 3. Fetch Selected Meal Plan Detail
  useEffect(() => {
    let unmounted = false;
    async function fetchDetail() {
      if (!selectedPlanId) {
        if (!unmounted) {
          setActivePlanDetail(null);
        }
        return;
      }
      try {
        setLoadingPlan(true);
        const res = await fetch(`/api/meal-plans/${selectedPlanId}`);
        if (res.ok) {
          const json = await res.json();
          if (!unmounted) {
            setActivePlanDetail(json.data);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!unmounted) {
          setLoadingPlan(false);
        }
      }
    }
    fetchDetail();
    return () => {
      unmounted = true;
    };
  }, [selectedPlanId, planReloadTrigger]);

  // Filtered Foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      if (foodSearch) {
        const q = foodSearch.toLowerCase();
        const matchesName = food.name.toLowerCase().includes(q);
        const matchesDesc = food.description ? food.description.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedCategory !== 'all' && food.category !== selectedCategory) {
        return false;
      }
      if (selectedDiet !== 'all' && food.dietaryPreference !== selectedDiet) {
        return false;
      }
      return true;
    });
  }, [foods, foodSearch, selectedCategory, selectedDiet]);

  // Handlers
  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!newPlanName.trim()) {
      setFormError('Please enter a meal plan name.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlanName.trim(),
          targetKcal: newPlanTarget ? parseInt(newPlanTarget, 10) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error?.message || 'Failed to create meal plan.');
        return;
      }

      setCreatePlanModal(false);
      setNewPlanName('');
      setSelectedPlanId(json.data.id);
      setPlanReloadTrigger((k) => k + 1);
      setActiveTab('my-plans');
      setActionNotice(`Plan "${json.data.name}" created.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setFormError('Network error while creating meal plan.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddItemToPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!addFoodModal || !targetPlanIdForAdd) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/meal-plans/${targetPlanIdForAdd}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodId: addFoodModal.id,
          mealSlot: addSlot,
          quantity: addPortion,
          quantityUnit: addUnit,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error?.message || 'Failed to add food to meal plan.');
        return;
      }

      setAddFoodModal(null);
      setSelectedPlanId(targetPlanIdForAdd);
      setPlanReloadTrigger((k) => k + 1);
      setActiveTab('my-plans');
      setActionNotice(`Added ${addFoodModal.name} (${addPortion}${addUnit}) to ${addSlot}.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      alert('Network error while adding food.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editItemModal || !selectedPlanId) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/meal-plans/${selectedPlanId}/items/${editItemModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: editPortion,
          mealSlot: editSlot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error?.message || 'Failed to update portion.');
        return;
      }

      setEditItemModal(null);
      setPlanReloadTrigger((k) => k + 1);
      setActionNotice('Portion updated.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      alert('Network error while updating portion.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!selectedPlanId) return;
    if (!confirm('Remove this food from your meal plan?')) return;

    try {
      const res = await fetch(`/api/meal-plans/${selectedPlanId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlanReloadTrigger((k) => k + 1);
        setActionNotice('Item removed from plan.');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      alert('Error removing item.');
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/meal-plans/${planId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedPlanId(null);
        setPlanReloadTrigger((k) => k + 1);
        setActionNotice('Meal plan deleted.');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      alert('Error deleting plan.');
    }
  }

  async function handleCopySamplePlan(sample: ComputedSamplePlan) {
    try {
      setSubmitting(true);
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sample.name,
          targetKcal: sample.targetKcal,
        }),
      });

      if (!res.ok) {
        alert('Failed to initialize sample plan.');
        return;
      }

      const planJson = await res.json();
      const newPlanId = planJson.data.id;

      // Copy each computed item into personal meal plan
      for (const item of sample.items) {
        await fetch(`/api/meal-plans/${newPlanId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foodId: item.food.id,
            mealSlot: item.mealSlot,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit,
          }),
        });
      }

      setSelectedPlanId(newPlanId);
      setPlanReloadTrigger((k) => k + 1);
      setActiveTab('my-plans');
      setActionNotice(`Copied "${sample.name}" with ${sample.items.length} items to My Meal Plans.`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch {
      alert('Error copying sample plan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Utensils className="h-4 w-4 text-zinc-900 dark:text-white" /> Nutrition & Planning
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Diet Foods Catalogue & Meal Planning
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Verified Indian Food Composition Tables (IFCT 2017) and USDA nutrition records tailored for authentic Tamil Nadu eating patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="create-meal-plan-btn"
            onClick={() => {
              setFormError(null);
              setCreatePlanModal(true);
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> Create Meal Plan
          </button>
        </div>
      </div>

      {/* Nutritional Guidance Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <Info className="h-4 w-4 flex-shrink-0 text-zinc-500 dark:text-zinc-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Nutritional Guidance Notice:</strong> Meal plans and nutrition calculations are provided for educational and fitness planning purposes only. They do not constitute individualized clinical dietary prescriptions or medical advice. Exact nutrition may vary based on specific recipe preparation.
        </p>
      </div>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-medium text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
          <CheckCircle2 className="h-4 w-4 text-zinc-900 dark:text-white" />
          {actionNotice}
        </div>
      )}

      {/* Tab Navigation - Horizontally scrollable on mobile */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar gap-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          type="button"
          id="tab-catalogue"
          onClick={() => setActiveTab('catalogue')}
          className={`flex items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs tracking-wide transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'catalogue'
              ? 'border-zinc-900 text-zinc-900 font-bold dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Food Catalogue ({foods.length})
        </button>
        <button
          type="button"
          id="tab-samples"
          onClick={() => setActiveTab('samples')}
          className={`flex items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs tracking-wide transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'samples'
              ? 'border-zinc-900 text-zinc-900 font-bold dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Sample Meal Plans ({samplePlans.length})
        </button>
        <button
          type="button"
          id="tab-my-plans"
          onClick={() => setActiveTab('my-plans')}
          className={`flex items-center gap-2 border-b-2 px-4 sm:px-5 py-3 text-xs tracking-wide transition-colors whitespace-nowrap min-h-[44px] ${
            activeTab === 'my-plans'
              ? 'border-zinc-900 text-zinc-900 font-bold dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white font-medium'
          }`}
        >
          <Layers className="h-4 w-4" /> My Meal Plans ({userPlans.length})
        </button>
      </div>

      {/* TAB 1: FOOD CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search foods (e.g. Idli, Chicken, Paneer)..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white min-h-[44px]"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-white min-h-[44px]"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedDiet}
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:border-zinc-900 focus:outline-none dark:focus:border-white min-h-[44px]"
              >
                {DIETARY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Food Grid */}
          {loadingFoods ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
              ))}
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              No foods matched your search criteria. Try clearing search filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {food.category.replace('_', ' ')}
                        </span>
                        <h3 className="mt-0.5 text-base font-bold text-zinc-900 dark:text-white">{food.name}</h3>
                      </div>
                      {food.foodForm && (
                        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 capitalize">
                          {food.foodForm}
                        </span>
                      )}
                    </div>

                    {food.description && (
                      <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {food.description}
                      </p>
                    )}

                    {/* Macronutrients Display */}
                    <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/60">
                      <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        Per Reference Portion: <strong className="text-zinc-900 dark:text-zinc-100">{food.referenceQuantity} {food.referenceUnit}</strong>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-white p-1.5 border border-zinc-200/60 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Calories</span>
                          <span className="font-extrabold text-zinc-900 dark:text-white">
                            {food.energyKcal !== null ? `${food.energyKcal}` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-1.5 border border-zinc-200/60 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Protein</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {food.proteinG !== null ? `${food.proteinG}g` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-1.5 border border-zinc-200/60 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Carbs</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {food.carbohydratesG !== null ? `${food.carbohydratesG}g` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-1.5 border border-zinc-200/60 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Fat</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {food.fatG !== null ? `${food.fatG}g` : 'null'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Provenance Metadata */}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>Source: <strong className="text-zinc-700 dark:text-zinc-300">{food.sourceName}</strong></span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium border border-zinc-200 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {food.matchStatus}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAddFoodModal(food);
                        setAddPortion(food.referenceQuantity);
                        setAddUnit(food.referenceUnit);
                        setAddSlot('breakfast');
                        if (userPlans.length > 0) {
                          setTargetPlanIdForAdd(selectedPlanId || userPlans[0].id);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-white dark:hover:text-zinc-900 transition-colors min-h-[44px] active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add to Meal Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAMPLE MEAL PLANS */}
      {activeTab === 'samples' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            These sample days illustrate balanced meal structures using authentic Tamil Nadu staples. All nutritional totals are <strong>dynamically calculated</strong> from the verified food items and portion references below.
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {samplePlans.map((sample) => (
              <div
                key={sample.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="rounded bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-900 dark:bg-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-700">
                        {sample.badge}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-white">
                        {sample.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-zinc-900 dark:text-white">
                        {sample.dailyTotals.isApproximate ? '~' : ''}{sample.dailyTotals.energyKcal} kcal
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        P: {sample.dailyTotals.proteinG}g | C: {sample.dailyTotals.carbohydratesG}g | F: {sample.dailyTotals.fatG}g
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">{sample.description}</p>

                  {/* Meal Slots with calculated subtotals */}
                  <div className="mt-4 space-y-3 text-xs">
                    {SUPPORTED_MEAL_SLOTS.map((slot) => {
                      const slotItems = sample.items.filter((i) => i.mealSlot === slot);
                      const slotTotal = sample.slotTotals[slot];
                      if (slotItems.length === 0) return null;

                      return (
                        <div key={slot} className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 dark:bg-zinc-950/60 dark:border-zinc-800/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-zinc-900 dark:text-white capitalize">
                              {slot}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {slotTotal.isApproximate ? '~' : ''}{slotTotal.energyKcal} kcal
                            </span>
                          </div>
                          <ul className="text-zinc-700 dark:text-zinc-300 space-y-0.5 text-[11px]">
                            {slotItems.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>• {item.food.name} ({item.quantity}{item.quantityUnit})</span>
                                <span className="text-zinc-500">{item.scaled.energyKcal} kcal</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleCopySamplePlan(sample)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                  >
                    <Copy className="h-4 w-4" /> Copy into My Meal Plans
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY MEAL PLANS */}
      {activeTab === 'my-plans' && (
        <div className="space-y-6">
          {userPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <Utensils className="mx-auto h-8 w-8 text-zinc-400 mb-3" />
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">No Saved Meal Plans Yet</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Create a custom meal plan or copy one of our authentic Tamil Nadu sample days to start tracking your daily nutrition.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setCreatePlanModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 min-h-[44px]"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('samples')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  Browse Samples
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Plan Selector Sidebar */}
              <div className="space-y-2 lg:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Your Saved Plans
                </div>
                {userPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`group flex items-center justify-between rounded-xl border p-3 transition-colors ${
                      selectedPlanId === plan.id
                        ? 'border-zinc-900 bg-zinc-100 text-zinc-900 dark:border-white dark:bg-zinc-800 dark:text-white font-semibold'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="flex-1 text-left min-h-[40px]"
                    >
                      <div className="text-xs font-semibold truncate">{plan.name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {plan.itemCount} foods • {plan.targetKcal ? `${plan.targetKcal} kcal target` : 'No target'}
                      </div>
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/app/diet-foods/plans/${plan.id}`}
                        title="Open Plan Page"
                        className="rounded p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-zinc-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        title="Delete Plan"
                        className="rounded p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-zinc-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Plan Detail View */}
              <div className="lg:col-span-3">
                {loadingPlan ? (
                  <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
                ) : activePlanDetail ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
                    {/* Plan Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{activePlanDetail.name}</h2>
                          <Link
                            href={`/app/diet-foods/plans/${activePlanDetail.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:underline"
                          >
                            Dedicated URL <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Daily Target: <strong className="text-zinc-900 dark:text-zinc-100">{activePlanDetail.targetKcal ? `${activePlanDetail.targetKcal} kcal` : 'None'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('catalogue');
                            setTargetPlanIdForAdd(activePlanDetail.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 min-h-[40px]"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Foods
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(activePlanDetail.id)}
                          className="rounded-xl border border-zinc-200 p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Delete Plan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Daily Nutrition Totals Card */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                          Daily Nutrition Totals
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {activePlanDetail.dailyTotals.isComplete ? 'Complete Calculation' : 'Incomplete Totals'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                        <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Energy</span>
                          <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                            {activePlanDetail.dailyTotals.energyKcal !== null ? `${activePlanDetail.dailyTotals.energyKcal} kcal` : 'Incomplete'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Protein</span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">
                            {activePlanDetail.dailyTotals.proteinG !== null ? `${activePlanDetail.dailyTotals.proteinG}g` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Carbohydrates</span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">
                            {activePlanDetail.dailyTotals.carbohydratesG !== null ? `${activePlanDetail.dailyTotals.carbohydratesG}g` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800">
                          <span className="block text-[10px] text-zinc-500">Fat</span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">
                            {activePlanDetail.dailyTotals.fatG !== null ? `${activePlanDetail.dailyTotals.fatG}g` : 'null'}
                          </span>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 col-span-2 sm:col-span-1">
                          <span className="block text-[10px] text-zinc-500">Dietary Fibre</span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">
                            {activePlanDetail.dailyTotals.fibreG !== null ? `${activePlanDetail.dailyTotals.fibreG}g` : 'null'}
                          </span>
                        </div>
                      </div>

                      {/* Calorie Target Comparison */}
                      {activePlanDetail.targetComparison.canCompare ? (
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-400">Target Variance:</span>{' '}
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {activePlanDetail.targetComparison.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                              {(activePlanDetail.targetComparison.differenceKcal ?? 0) > 0 ? '+' : ''}
                              {activePlanDetail.targetComparison.differenceKcal} kcal
                            </span>
                            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                              ({((activePlanDetail.targetComparison.differencePercent ?? 0) > 0 ? '+' : '')}
                              {activePlanDetail.targetComparison.differencePercent}%)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 text-[10px] text-zinc-500 dark:text-zinc-400">
                          {activePlanDetail.targetKcal
                            ? 'Comparison unavailable: energy data is missing from one or more items.'
                            : 'Set a target calorie goal when creating or renaming this plan to review variance.'}
                        </div>
                      )}
                    </div>

                    {/* Meal Slots with Food Items */}
                    <div className="space-y-4">
                      {SUPPORTED_MEAL_SLOTS.map((slot) => {
                        const slotItems = activePlanDetail.items.filter((i) => i.mealSlot === slot);
                        const slotTotal = activePlanDetail.slotTotals[slot];

                        return (
                          <div key={slot} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
                              <div className="py-2 text-center text-xs text-zinc-400 dark:text-zinc-500">
                                No foods in this meal slot.
                              </div>
                            ) : (
                              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {slotItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between py-3 text-xs"
                                  >
                                    <div>
                                      <div className="font-semibold text-zinc-900 dark:text-white">{item.food.name}</div>
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

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditItemModal(item);
                                          setEditPortion(item.quantity);
                                          setEditSlot(item.mealSlot);
                                        }}
                                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                                        title="Edit Portion"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white min-h-[36px] min-w-[36px] flex items-center justify-center"
                                        title="Remove Food"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
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
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD FOOD TO MEAL PLAN (Mobile Bottom-Sheet on small screens) */}
      {addFoodModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Add to Meal Plan</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{addFoodModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddFoodModal(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {userPlans.length === 0 ? (
              <div className="mt-4 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  You do not have any meal plans yet. Create one first!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAddFoodModal(null);
                    setCreatePlanModal(true);
                  }}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 min-h-[44px]"
                >
                  Create a Meal Plan
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddItemToPlan} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Select Plan</label>
                  <select
                    value={targetPlanIdForAdd}
                    onChange={(e) => setTargetPlanIdForAdd(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[44px]"
                  >
                    {userPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Slot</label>
                  <select
                    value={addSlot}
                    onChange={(e) => setAddSlot(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white capitalize min-h-[44px]"
                  >
                    {SUPPORTED_MEAL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Portion Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={addPortion}
                      onChange={(e) => setAddPortion(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Unit</label>
                    <input
                      type="text"
                      disabled
                      value={addUnit}
                      className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAddFoodModal(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                  >
                    {submitting ? 'Adding...' : 'Add to Plan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE MEAL PLAN */}
      {createPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Create New Meal Plan</h3>
              <button
                type="button"
                onClick={() => setCreatePlanModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamil Nadu Muscle Gain Plan"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Daily Calorie Target (kcal, Optional)</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  placeholder="2000"
                  value={newPlanTarget}
                  onChange={(e) => setNewPlanTarget(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[44px]"
                />
                <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                  Used to show calorie variance against your goal.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreatePlanModal(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PORTION */}
      {editItemModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">Edit Portion</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{editItemModal.food.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditItemModal(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="mt-4 space-y-4">
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
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Meal Slot</label>
                <select
                  value={editSlot}
                  onChange={(e) => setEditSlot(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white capitalize min-h-[44px]"
                >
                  {SUPPORTED_MEAL_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditItemModal(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'Saving...' : 'Save Portion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietFoodsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-16 w-full animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
            <div className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
            <div className="h-48 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
          </div>
        </div>
      }
    >
      <DietFoodsContent />
    </Suspense>
  );
}
