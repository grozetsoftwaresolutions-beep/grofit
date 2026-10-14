import { NextResponse } from 'next/server';
import { getAuthenticatedSupabaseClient } from '@/lib/supabase/auth-helper';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabaseClient(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    // 1. Fetch Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, display_name, timezone, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to export profile data.' } },
        { status: 500 }
      );
    }

    // 2. Fetch Personal Workout Plans with Days and Entries
    const { data: rawPlans, error: plansErr } = await supabase
      .from('workout_plans')
      .select(`
        id,
        name,
        source_template_id,
        source_template_name_snapshot,
        created_at,
        updated_at,
        workout_plan_days (
          id,
          day_number,
          name,
          sort_order,
          created_at,
          updated_at,
          workout_plan_entries (
            id,
            exercise_id,
            exercise_name_snapshot,
            source_label,
            video_url,
            source_sets,
            source_reps,
            source_prescription_text,
            sets,
            reps,
            sort_order,
            created_at,
            updated_at,
            exercises (
              id,
              name,
              muscle_group,
              description
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (plansErr) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: `Failed to export workout plan data: ${plansErr.message}` } },
        { status: 500 }
      );
    }

    // 3. Fetch Workout Progress Logs
    const { data: rawLogs, error: logsErr } = await supabase
      .from('workout_logs')
      .select(`
        id,
        exercise_id,
        logged_on,
        sets_completed,
        reps_completed,
        external_load,
        external_load_unit,
        is_bodyweight,
        notes,
        created_at,
        updated_at,
        exercises (
          id,
          name,
          muscle_group,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('logged_on', { ascending: false });

    if (logsErr) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: `Failed to export workout logs: ${logsErr.message}` } },
        { status: 500 }
      );
    }

    // 4. Fetch Habits with Completion Logs
    const { data: rawHabits, error: habitsErr } = await supabase
      .from('habits')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at,
        habit_logs (
          id,
          completed_on,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (habitsErr) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: `Failed to export habit data: ${habitsErr.message}` } },
        { status: 500 }
      );
    }

    // 5. Fetch Meal Plans with Items
    const { data: rawMealPlans, error: mealsErr } = await supabase
      .from('meal_plans')
      .select(`
        id,
        name,
        target_kcal,
        created_at,
        updated_at,
        meal_plan_items (
          id,
          food_id,
          meal_slot,
          quantity,
          quantity_unit,
          sort_order,
          created_at,
          foods (
            id,
            name,
            category,
            food_form,
            reference_quantity,
            reference_unit,
            energy_kcal,
            protein_g,
            carbohydrates_g,
            fat_g,
            fibre_g
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (mealsErr) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: `Failed to export meal plan data: ${mealsErr.message}` } },
        { status: 500 }
      );
    }

    // 6. Format into documented, versioned JSON structure
    interface ExerciseRow {
      id: string;
      name: string;
      muscle_group?: string;
      description?: string;
    }

    interface PlanEntryRow {
      id: string;
      exercise_id: string;
      exercise_name_snapshot: string;
      source_label: string | null;
      video_url: string | null;
      source_sets: number | null;
      source_reps: number | null;
      source_prescription_text: string | null;
      sets: number | null;
      reps: number | null;
      sort_order: number;
      created_at: string;
      updated_at: string;
      exercises: ExerciseRow | null;
    }

    interface PlanDayRow {
      id: string;
      day_number: number | null;
      name: string;
      sort_order: number;
      created_at: string;
      updated_at: string;
      workout_plan_entries: PlanEntryRow[];
    }

    interface PlanRow {
      id: string;
      name: string;
      source_template_id: string | null;
      source_template_name_snapshot: string | null;
      created_at: string;
      updated_at: string;
      workout_plan_days: PlanDayRow[];
    }

    const formattedWorkoutPlans = (rawPlans as unknown as PlanRow[] || []).map((p) => ({
      id: p.id,
      name: p.name,
      sourceTemplateId: p.source_template_id,
      sourceTemplateName: p.source_template_name_snapshot,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      days: (p.workout_plan_days || []).map((d) => ({
        id: d.id,
        dayNumber: d.day_number,
        name: d.name,
        sortOrder: d.sort_order,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        entries: (d.workout_plan_entries || []).map((e) => ({
          id: e.id,
          exerciseId: e.exercise_id,
          exerciseName: e.exercises?.name ?? e.exercise_name_snapshot,
          muscleGroup: e.exercises?.muscle_group ?? null,
          description: e.exercises?.description ?? null,
          sets: e.sets,
          reps: e.reps,
          sourceLabel: e.source_label,
          sourceSets: e.source_sets,
          sourceReps: e.source_reps,
          sourcePrescriptionText: e.source_prescription_text,
          sortOrder: e.sort_order,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })),
      })),
    }));

    interface LogRow {
      id: string;
      exercise_id: string;
      logged_on: string;
      sets_completed: number | null;
      reps_completed: number | null;
      external_load: number | string | null;
      external_load_unit: string | null;
      is_bodyweight: boolean;
      notes: string | null;
      created_at: string;
      updated_at: string;
      exercises: ExerciseRow | null;
    }

    const formattedWorkoutLogs = (rawLogs as unknown as LogRow[] || []).map((l) => ({
      id: l.id,
      exerciseId: l.exercise_id,
      exerciseName: l.exercises?.name ?? null,
      muscleGroup: l.exercises?.muscle_group ?? null,
      description: l.exercises?.description ?? null,
      loggedOn: l.logged_on,
      setsCompleted: l.sets_completed,
      repsCompleted: l.reps_completed,
      externalLoad: l.external_load !== null ? Number(l.external_load) : null,
      externalLoadUnit: l.external_load_unit,
      isBodyweight: l.is_bodyweight,
      notes: l.notes,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }));

    interface HabitLogRow {
      id: string;
      completed_on: string;
      created_at: string;
    }

    interface HabitRow {
      id: string;
      name: string;
      description: string | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      habit_logs: HabitLogRow[];
    }

    const formattedHabits = (rawHabits as unknown as HabitRow[] || []).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      isActive: h.is_active,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
      completedDates: (h.habit_logs || []).map((hl) => ({
        id: hl.id,
        completedOn: hl.completed_on,
        createdAt: hl.created_at,
      })),
    }));

    interface FoodRow {
      id: string;
      name: string;
      category: string;
      food_form: string | null;
      reference_quantity: number | string;
      reference_unit: string;
      energy_kcal: number | null;
      protein_g: number | null;
      carbohydrates_g: number | null;
      fat_g: number | null;
      fibre_g: number | null;
    }

    interface MealItemRow {
      id: string;
      food_id: string;
      meal_slot: string;
      quantity: number | string;
      quantity_unit: string;
      sort_order: number;
      created_at: string;
      foods: FoodRow | null;
    }

    interface MealPlanRow {
      id: string;
      name: string;
      target_kcal: number | null;
      created_at: string;
      updated_at: string;
      meal_plan_items: MealItemRow[];
    }

    const formattedMealPlans = (rawMealPlans as unknown as MealPlanRow[] || []).map((m) => ({
      id: m.id,
      name: m.name,
      targetKcal: m.target_kcal !== null ? Number(m.target_kcal) : null,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      items: (m.meal_plan_items || []).map((item) => ({
        id: item.id,
        foodId: item.food_id,
        foodName: item.foods?.name ?? null,
        category: item.foods?.category ?? null,
        foodForm: item.foods?.food_form ?? null,
        quantity: Number(item.quantity),
        quantityUnit: item.quantity_unit,
        mealSlot: item.meal_slot,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        referenceFoodBasis: item.foods ? {
          referenceQuantity: Number(item.foods.reference_quantity),
          referenceUnit: item.foods.reference_unit,
          energyKcal: item.foods.energy_kcal !== null ? Number(item.foods.energy_kcal) : null,
          proteinG: item.foods.protein_g !== null ? Number(item.foods.protein_g) : null,
          carbohydratesG: item.foods.carbohydrates_g !== null ? Number(item.foods.carbohydrates_g) : null,
          fatG: item.foods.fat_g !== null ? Number(item.foods.fat_g) : null,
          fibreG: item.foods.fibre_g !== null ? Number(item.foods.fibre_g) : null,
        } : null,
      })),
    }));

    const exportPayload = {
      metadata: {
        exportFormat: 'tamil-nadu-fitness-companion-export',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        userId: user.id,
      },
      profile: profile ? {
        displayName: profile.display_name,
        timezone: profile.timezone || 'Asia/Kolkata',
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      } : null,
      workoutPlans: formattedWorkoutPlans,
      workoutLogs: formattedWorkoutLogs,
      habits: formattedHabits,
      mealPlans: formattedMealPlans,
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `fitness-data-export-${dateStr}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: `An unexpected error occurred during data export: ${msg}` } },
      { status: 500 }
    );
  }
}
