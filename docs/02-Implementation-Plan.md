# 02 — Implementation Plan

**Product:** Tamil Nadu Fitness Companion  
**Document:** `docs/02-Implementation-Plan.md`  
**Version:** 0.4  
**Status:** Draft for Review  

This document outlines the architecture, phases, and technical strategies to implement the product described in `01-PRD.md`. It incorporates specific product owner decisions regarding data models, security, testing, source-fidelity, and application behavior.

---

## 1. Architecture Overview

- **Framework:** Next.js (App Router) with TypeScript (Strict Mode).
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Row Level Security).
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide Icons.
- **Data Visualization:** Recharts (for workout progress charts).
- **State & Form Management:** React Hook Form combined with Zod for robust client and server validation.
- **Date & Timezone Management:** `date-fns` and `date-fns-tz` with strict handling of user-local dates.

**Core Principles:**
- Use **React Server Components (RSC)** for data fetching and layout to minimize client payload.
- Use **Client Components** only for interactive features (forms, charts, habit toggles).
- **Domain Logic Separation:** Calorie algorithms, streak calculations, and nutrition sums will be pure, framework-agnostic TypeScript functions to allow exhaustive unit testing.

---

## 2. Database Inventory & Data Model

The PostgreSQL database must separate global, immutable content from private, user-owned data. All user-owned data requires Row Level Security (RLS).

### Global Entities (Shared, Read-Only)
- **`exercises`**: `id`, `name`, `muscle_group`, `equipment`, `source_type` (source vs. researched). (Canonical reference).
- **`templates`**: `id`, `name`, `type`.
- **`template_days`**: `id`, `template_id`, `day_name`, `order_index`.
- **`template_warmups`**: `id`, `template_day_id`, `name`, `reps_or_duration`, `weight_or_intensity`. (To preserve exact warm-ups prescribed in the PDF).
- **`template_entries`**: `id`, `template_day_id`, `exercise_id`, `source_label` (Exact name in PDF), `video_url` (Exact YouTube URL + query params in PDF), `sets` (Nullable), `reps` (Nullable), `order_index`.
  - *Fidelity Rule:* If sets/reps are not specified in the source PDF, they remain `null` here. They must never be fabricated.
- **`foods`**: `id`, `name`, `category` (veg/egg/non-veg), `serving_size`, `serving_unit`, `kcal`, `protein`, `carbs`, `fat`, `fiber`, `source_reference` (e.g., IFCT 2017 primary, USDA backup), `match_details`, `prep_state` (raw/cooked), `is_approximate`.

### User-Owned Entities (Private, RLS Protected)
- **`profiles`**: `id` (PK, matches `auth.uid()`), `age`, `sex_coefficient`, `height`, `weight`, `activity_level`, `goal`, `target_kcal`, `timezone` (e.g., 'Asia/Kolkata' for accurate habit dates).
- **`workout_plans`**: `id`, `user_id`, `name`, `created_at`.
- **`workout_days`**: `id`, `plan_id`, `user_id`, `day_name`, `order_index`, `source_template_day_id` (Provenance for idempotency).
  - *Unique Constraint:* `(plan_id, source_template_day_id)` to prevent importing the same source day twice into a single target plan.
- **`workout_entries`**: `id`, `day_id`, `user_id`, `exercise_id`, `custom_label`, `video_url_snapshot`, `sets`, `reps`, `order_index`, `source_template_entry_id` (Provenance for idempotency).
  - *Unique Constraint:* `(day_id, source_template_entry_id)` to prevent duplicate source template entries within the same target day.
- **`workout_logs`**: `id`, `user_id`, `exercise_id`, `logged_weight` (Nullable), `logged_unit` (e.g., 'kg', 'lbs'), `is_bodyweight` (Boolean), `logged_date`, `notes`. 
  - *(FK to `exercise_id`, NOT `workout_entries`, to preserve history if a plan is deleted/replaced).*
- **`habits`**: `id`, `user_id`, `name`, `created_at`, `archived`.
- **`habit_logs`**: `id`, `habit_id`, `user_id`, `completed_date` (Type: PostgreSQL `DATE`). Unique constraint on `(habit_id, completed_date)`.
- **`meal_plans`**: `id`, `user_id`, `name`, `target_kcal`, `created_at`.
- **`meal_plan_items`**: `id`, `plan_id`, `user_id`, `food_id`, `serving_multiplier`.

### Delete Behavior & Integrity
- Child rows must safely cascade upon deletion of parents.
- The schema ensures child rows cannot reference another user's parent row by enforcing composite ownership constraints and strict RLS path rules.

---

## 3. Authentication & Authorization

- **Session Validation:** Every server action and route handler must validate the active session via `@supabase/ssr`.
- **Database RLS:** RLS is the ultimate line of defense. Policies will restrict `SELECT`, `INSERT`, `UPDATE`, and `DELETE` exclusively to `auth.uid() = user_id`.
- **Secret Management:** The `SUPABASE_SERVICE_ROLE_KEY` will remain strictly server-side and will never be exposed to the browser.
- **Responsibilities:** 
  - *App Server:* Validates inputs (Zod), formats data, executes domain logic, and checks auth state.
  - *Supabase Database:* Enforces data integrity, cascading rules, unique constraints, executes atomic RPC transactions, and hard security boundaries (RLS).

---

## 4. Implementation Phases

### Phase 1: Project Setup, Security & Operations
- Initialize Next.js, Supabase, Tailwind, and versioned migration strategy.
- Implement Auth flows and the responsive shell.
- **Traceability:** FR-1, FR-2, FR-22, NFR-1, NFR-6, NFR-8, NFR-9, NFR-10, NFR-12.

### Phase 2: Calorie Calculator (Safe & Pure)
- Pure Mifflin-St Jeor calculation logic relying strictly on `docs/05-domain-logic.md` for safety boundaries (no silent target clamping).
- UI form with sex-specific constants (clear explanations, skip option, no gender assumptions).
- **Traceability:** FR-3, FR-4, FR-5, FR-6, FR-21, NFR-7.

### Phase 3: Workout Data Model & Catalog
- Seed `exercises`, `templates`, `template_days`, `template_warmups`, and `template_entries` exactly from `Finalized Workout.pdf`.
- Maintain source integrity: exact labels and YouTube links mapped per-entry, not globally. Leave unspecified sets/reps as `null`.
- **Traceability:** FR-7, FR-8, NFR-11.

### Phase 4: Workout Templating, Planning & Logging
- Build UI for viewing, editing, and logging workouts.
- **Truly Atomic Template Replace/Merge Operations:** 
  - *Execution:* Both Replace and Merge will be implemented as single PostgreSQL transactions executed via Supabase RPC (database functions). A failed operation will rollback entirely, leaving the previous plan unchanged.
  - *Replace:* Deletes the explicitly selected `workout_plan`'s children and copies the template's structure over inside the transaction.
  - *Merge:* Preserves existing user-created days/entries. Concurrent retries are safe because database unique constraints on `(plan_id, source_template_day_id)` and `(day_id, source_template_entry_id)` will prevent accidental duplication. Exercises are never deduplicated globally across different workout days.
- **Complete Workout-Load Logging:**
  - Provide an explicit mode for external load vs. bodyweight/no-external-load (`is_bodyweight` flag). Zero is not to be used as a substitute for bodyweight mode.
  - Record and display loads securely using `logged_unit` to properly handle metric vs imperial settings.
  - Validate against invalid/negative loads. Historical logs are strictly preserved during plan replacement or deletion.
- **Traceability:** FR-9, FR-10, FR-11, FR-12, FR-13, FR-26.

### Phase 5: Habit Tracking & Timezones
- User's timezone (e.g., `Asia/Kolkata`) is saved in `profiles`.
- Check-ins resolve the user's local date dynamically on the server based on their stored timezone.
- Use PostgreSQL `DATE` in `habit_logs` with a unique composite index to ensure idempotency and prevent double-logging.
- **Traceability:** FR-14, FR-15, FR-16, NFR-7.

### Phase 6: Nutrition & Meal Plans
- Seed `foods` with IFCT 2017 / USDA provenance, tracking match details, prep state, and approximation status.
- Build Diet catalog with Veg/Egg/Non-Veg filters. Allow users to build/save meal plans with editable portions and reproducible day totals. Include sample 1-day weight loss/gain plans.
- **Traceability:** FR-17, FR-18, FR-19, FR-20, NFR-11.

### Phase 7: Compliance, Polish & Launch
- Implement data export (JSON) and cascading account deletion.
- Final WCAG 2.2 AA accessibility and responsive pass.
- **Traceability:** FR-23, FR-24, FR-25, NFR-2, NFR-3, NFR-4, NFR-5.

---

## 5. Testing Strategy

| Scope | Tool/Focus | Coverage Target |
| :--- | :--- | :--- |
| **Domain Logic (Unit)** | Vitest / Jest | Calculator safety bounds. Streak calculations. Nutrition source metadata, approximate values, serving conversions, and reproducible meal/day totals. Unit conversion for workout loads, handling of zero loads, bodyweight logic, and invalid load rejection. |
| **Timezone & Dates (Unit)** | Vitest / Jest | Habit uniqueness, midnight boundaries, timezone changes, repeated submissions, and missed days. |
| **Database & RLS (Integration)** | Supabase Local / pgTAP | Verify User A cannot read/write User B's profile. Block cross-user child-record references. Verify child rows cascade safely. Ensure failed/partial operations rollback cleanly. Test execution of atomic Supabase RPC transactions for Replace/Merge. |
| **Core Workflows (E2E)** | Playwright / Cypress | Sign up -> Calc -> Build Plan. Test Template Replace, Merge, and repeated-merge idempotency safely respecting unique constraints. Ensure historical workout logs are preserved unconditionally. Save Meal. Data export and account deletion flows. |
| **Content Integrity** | Script / Jest | Test exact source exercise labels, per-template-entry YouTube URLs, missing source sets/reps, and separately labelled recommendations. |
| **Accessibility & UI** | axe-core, Lighthouse | Contrast, focus states, responsive mobile layouts, loading states, error recovery, chart fallbacks. |

---

## 6. Operational Details

- **Migrations:** Managed via Supabase CLI. Versioned SQL scripts checked into version control.
- **Environment Variables:** `.env.local` will house `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase service keys will not be stored locally, only in CI/Server environment.
- **Error Reporting:** Unhandled exceptions logged via server standard output/monitoring. Client-side errors caught by React Error Boundaries, obscuring sensitive stack traces and returning request correlation IDs.
- **Backups:** Handled automatically by the chosen Supabase project tier (PITR where applicable).

---

## 7. Unresolved Source-Content Questions

1. **Upper/Lower Template B:** The source file `fitness_website_prompt.md` has not been provided. The architecture supports adding templates, but this specific template will remain unseeded. No exercises or video URLs will be invented to fill this gap.

---
*Please review version 0.4 of this implementation plan. Once approved, we can proceed with Phase 1.*
