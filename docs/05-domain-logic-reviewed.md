# 05 — Domain Logic

**Product:** Tamil Nadu Fitness Companion

**Document:** `docs/05-domain-logic.md`

**Version:** 0.1

**Status:** Initial domain logic specification for review

**Depends on:** `docs/01-PRD.md`, `docs/02-user-stories.md`, approved `docs/02-Implementation-Plan.md` v0.4, `docs/03-information-architecture.md`, and `docs/04-ui-ux-spec.md`

**Audience:** Product owner, developer, QA, and Antigravity coding agent

---

## 1. Purpose

This document defines the calculations, validation rules, state transitions, and business logic used by the Tamil Nadu Fitness Companion.

It is the canonical specification for:

1. Calorie and energy estimates.
2. Unit conversion and numeric validation.
3. Workout templates and personal workout plans.
4. Exercise load logging and historical progression.
5. Habit check-ins and streak calculations.
6. Food nutrition calculations.
7. Meal-plan totals and target-based suggestions.
8. Data integrity, rounding, and error handling.

The same rules must be used throughout the application. Client-side components may preview calculations, but the server must validate persisted values and any operation that depends on trusted data.

**Important:** These estimates are educational fitness tools, not medical advice. The application must not diagnose conditions or guarantee that a calculated calorie target is appropriate for every person.

## 2. Domain principles

### DP-1 — One canonical implementation

Each calculation or rule must have one canonical implementation, preferably as a pure TypeScript domain function.

Avoid implementing slightly different versions in a React component, a Server Action, and a database function.

### DP-2 — Validate before calculating

Reject invalid, incomplete, non-finite, or ineligible inputs before producing a normal successful result.

Never turn invalid values into zero or silently correct them into a different value.

### DP-3 — Keep unknown values distinct from zero

A missing weight, unspecified repetition count, or unavailable nutrient value is not the same as zero.

Use `null` or an explicit status for unavailable values according to the database schema.

### DP-4 — Preserve provenance

Source-provided workout information must remain distinguishable from user edits and researched recommendations.

Nutritional values must retain their source and approximation status.

### DP-5 — Historical records survive plan changes

Workout logs belong to the authenticated user and canonical exercise, not exclusively to a particular workout-plan entry. Replacing or deleting a workout plan must not delete those historical logs.

### DP-6 — Date-only records represent calendar dates

Habit completions use the user's local calendar date and must not shift to another day because of UTC conversion.

### DP-7 — Safety rules must be explicit

When a calculation is not eligible, explain the result status. Do not silently clamp, substitute, or fabricate data to obtain a preferred result.

---

## 3. Common numeric and unit rules

### 3.1 Numeric input validation

All numeric inputs must be finite numbers.

Reject:
- Empty required fields.
- `NaN`.
- Positive or negative infinity.
- Unsupported negative values.
- Values outside the documented input bounds.
- Malformed numeric strings.
- Unsupported unit values.

Optional fields may remain `null` when the domain permits them to be unset.

Do not assume that an empty numeric input is zero.

### 3.2 Canonical units

Use canonical internal units for calculations. Convert display values at the input or output boundary.

| Quantity | Canonical unit |
|---|---|
| Body weight | Kilograms (kg) |
| Height | Centimetres (cm) |
| Energy | Kilocalories (kcal) |
| Macronutrients and fibre | Grams (g) |
| External exercise load | Kilograms (kg), with original display unit retained where required |
| Habit date | Local calendar date represented as `YYYY-MM-DD` |

### 3.3 Conversion rules

Use these exact conversion constants:

| Conversion | Rule |
|---|---|
| Inches to centimetres | `cm = inches × 2.54` |
| Pounds to kilograms | `kg = pounds × 0.45359237` |
| Centimetres to inches | `inches = cm ÷ 2.54` |
| Kilograms to pounds | `pounds = kg ÷ 0.45359237` |

When supported, feet and inches must be combined into total inches before converting to centimetres.

Conversions must not repeatedly round intermediate values. Keep sufficient precision internally and round only for display or at a specifically defined persistence boundary.

A user changing the display unit must not change the underlying physical quantity.

### 3.4 Rounding

Use a shared formatting policy:
- BMR: nearest whole kcal/day for display.
- TDEE: nearest whole kcal/day for display.
- Daily calorie target: nearest 10 kcal/day for display, after safety checks.
- Food energy: nearest whole kcal for display.
- Food macronutrients and fibre: one decimal place per item where useful.
- Meal-plan nutrient totals: use a consistent precision defined by the nutrition UI and content specification.
- Exercise loads: display appropriate precision for the unit and entered value.
- Streaks: whole calendar days.

Keep unrounded intermediate values for subsequent calculations. Display rounding must not create a different eligibility outcome.

### 3.5 Determinism

The same validated inputs and the same stored source data must produce the same result.

Domain calculations must not depend on browser locale, current time, random values, or UI formatting.

---

## 4. Calorie calculator

### 4.1 Eligibility

The calculator provides estimates only to adults aged 18 or older.

An age below 18 must not produce a calorie target.

The user must also supply valid height, weight, activity level, goal, and the required formula coefficient.

If the user declines to choose a required formula coefficient, the calculator must stop without a target.

### 4.2 Input bounds

The initial validation policy is:

| Input | Required validation |
|---|---|
| Age | Integer from 18 through 120 |
| Height | Finite value from 100 through 250 cm after conversion |
| Weight | Finite value from 25 through 350 kg after conversion |
| Formula coefficient | One of the explicitly supported choices |
| Activity level | One of the configured activity levels |
| Goal | `lose`, `maintain`, or `gain` |
| Units | One of the supported unit choices |

These are broad application validation bounds, not claims that every value inside them is medically appropriate.

Reject invalid input with a useful field-level explanation. Never clamp an out-of-range input into the accepted range.

### 4.3 BMR formula

Use the Mifflin–St Jeor resting energy estimation equation.

First convert the user's weight to kilograms and height to centimetres.

Define:
- \(W\) = weight in kilograms.
- \(H\) = height in centimetres.
- \(A\) = age in whole years.
- \(C\) = selected formula coefficient.

Calculate:

\[
\operatorname{BMR}=10W+6.25H-5A+C
\]

The supported conventional coefficients are:

| Formula option | Coefficient |
|---|---:|
| Conventional male-equation coefficient | `+5` |
| Conventional female-equation coefficient | `-161` |

In the UI, explain that the selection is a mathematical parameter used by the equation. It must not be presented as a declaration of gender identity.

Do not infer the coefficient automatically from a user's name, appearance, or other unrelated profile attributes.

### 4.4 BMR validation

After calculating BMR:

1. Confirm that the output is finite.
2. Confirm that it is greater than zero.
3. Do not apply a hidden minimum or replace an invalid output with zero.
4. If validation fails, mark the calculation as invalid and withhold the normal results.

Use the unrounded BMR for subsequent calculations.

### 4.5 Activity multipliers

Use the following configured activity levels:

| Activity level | Multiplier | Intended interpretation |
|---|---:|---|
| Sedentary | `1.200` | Little routine physical activity |
| Lightly active | `1.375` | Light activity and some exercise |
| Moderately active | `1.550` | Moderate routine activity and exercise |
| Very active | `1.725` | High routine activity and frequent exercise |
| Extra active | `1.900` | Very high activity demands |

Descriptions are explanatory estimates, not precise measurements of activity.

The UI must explain the options so users can select the closest applicable level.

### 4.6 TDEE calculation

Total Daily Energy Expenditure (TDEE) is estimated using:

\[
\operatorname{TDEE}=\operatorname{BMR}\times\operatorname{ActivityMultiplier}
\]

The result must be finite and greater than zero.

TDEE is an estimate of daily energy expenditure, not a direct measurement of the user's actual calorie use.

### 4.7 Goal-based adjustment

The initial application policy uses the following target adjustments:

| Goal | Adjustment | Formula |
|---|---:|---|
| Weight loss | `-15%` | `TDEE × 0.85` |
| Maintenance | `0%` | `TDEE` |
| Weight gain | `+10%` | `TDEE × 1.10` |

The goal target is:

\[
\operatorname{Target}=\operatorname{TDEE}\times(1+\operatorname{GoalAdjustment})
\]

These are configurable product defaults, not universal prescriptions. They must remain centralized in the domain layer instead of being repeated as hardcoded numbers across the UI.

### 4.8 Minimum calorie-target guardrail

For the initial release, define:

`MIN_DAILY_TARGET_KCAL = 1200`

If the **unrounded** goal target is below this guardrail, the application must withhold the personalized calorie target and mark the result as ineligible.

Requirements:
- Do not silently raise the result to 1200.
- Do not display a blocked result as a successful personalized recommendation.
- Explain that the estimate cannot be provided under the application's current safety rules.
- Encourage appropriate professional guidance where relevant.
- Do not describe 1200 kcal/day as a universally safe intake.

This is a product guardrail, not a clinical determination of an individual's nutritional needs. It requires explicit product-owner acceptance before production release. If the guardrail is changed, update the canonical constant, documentation, and tests together.

### 4.9 Result status

Represent the calculation outcome with an explicit domain status, such as:
- `success`
- `invalid_input`
- `underage`
- `missing_coefficient`
- `invalid_calculation`
- `target_below_guardrail`

Do not rely on an error message string to determine the status.

For a successful result, return the validated BMR, TDEE, goal adjustment, daily target, and relevant calculation assumptions.

For an ineligible result, do not return a usable personalized calorie target.

### 4.10 Example calculation

Given:
- Age: 25 years.
- Height: 180 cm.
- Weight: 90 kg.
- Formula coefficient: `+5`.
- Activity level: moderately active.
- Goal: maintenance.

BMR:

\[
10(90)+6.25(180)-5(25)+5=1905
\]

TDEE:

\[
1905\times1.55=2952.75
\]

Maintenance target:

\[
2952.75\times1.00=2952.75
\]

The underlying daily target is 2952.75 kcal before display rounding. TDEE displays as 2953 kcal/day, and the daily target displays as 2950 kcal/day under the nearest-10 policy.

This is an illustrative calculation, not a personal recommendation.

---

## 5. Workout templates and personal plans

### 5.1 Separation of data

The domain must distinguish:
- Global exercise catalogue records.
- Global source workout templates.
- Source template days.
- Source template entries.
- User-owned workout plans.
- User-owned workout days.
- User-owned workout entries.
- User-owned workout logs.

Editing a personal plan must not modify a global source template.

### 5.2 Source-content integrity

For source-template data:

1. Preserve the original exercise label.
2. Preserve entry order and workout-day order.
3. Preserve supplied warm-up information.
4. Preserve per-entry source video URLs.
5. Keep source provenance.
6. Keep unspecified sets and reps unset.
7. Do not replace missing source values with guessed values.

A researched recommendation may be added only when approved and must be labelled separately from source-provided information.

The missing Upper/Lower Template B must not be fabricated.

### 5.3 Configuring sets and reps

For user-configured exercise entries:
- Sets must be a whole number from 1 through 20.
- Repetitions must be a whole number from 1 through 200 when repetitions apply.
- Required values must be present before the entry is considered fully configured.
- Unsupported or malformed values must be rejected.
- An unspecified source value may remain `null` until the user configures it.

Do not invent a prescription merely because a UI component requires a value.

If the application later supports repetition ranges, those ranges must have an explicitly defined data representation and validation policy.

### 5.4 Exercise ordering

Workout days and entries use explicit ordering.

Reordering one entry must not unintentionally transfer it to another day.

The persisted order is authoritative. The UI must not present a new order as saved until the change is confirmed.

### 5.5 Replace semantics

Replace changes the selected personal plan to reflect the chosen template.

Requirements:

1. Identify the target plan and its owner.
2. Validate the selected source template.
3. Require the specified user confirmation before committing a destructive replacement.
4. Execute the replacement atomically.
5. If any required step fails, preserve the previous plan.
6. Keep historical exercise logs independent of the plan replacement.

Replace must not delete unrelated personal plans.

### 5.6 Merge semantics

Merge adds eligible source content to the selected personal plan.

Requirements:
- Preserve source day and entry order.
- Keep legitimate repeated exercise occurrences on different days.
- Prevent accidental re-import of the same source entries into the same plan.
- Make a repeated merge safe.
- Do not deduplicate solely by exercise name or canonical exercise ID.
- Perform the operation atomically.
- Preserve existing plan content if the operation fails.

Use the approved database constraints and transactional RPC design for persistence-level enforcement. Client-side duplicate checks alone are insufficient.

### 5.7 Operation outcomes

Workout mutations must have explicit outcomes, such as:
- `success`
- `invalid_input`
- `not_found`
- `not_authorized`
- `duplicate_import`
- `conflict`
- `operation_failed`

A failed operation must never be reported as success.

---

## 6. Exercise load logging and progression

### 6.1 Log ownership

Each workout log belongs to:
- The authenticated user.
- A canonical exercise.
- A recorded workout date.

A log must not depend exclusively on a plan ID or workout-entry ID.

This design ensures historical progression remains accessible after personal plans are changed or deleted.

### 6.2 Log types

The domain must distinguish the following cases:

| Log type | `logged_weight` | `is_bodyweight` | Unit |
|---|---|---|---|
| External load | Positive finite number | `false` | Required supported unit |
| Bodyweight | `null` | `true` | Not required |
| No external load | `null` | `false` | Not required |

This representation follows the approved data model. Do not use zero as a substitute for missing external weight.

If the schema is changed later to include an explicit log-type enum, update the domain and database specifications together.

### 6.3 Load validation

For external-load records:
- Weight must be finite and greater than zero.
- Unit must be supported.
- Conversion must use the canonical conversion constants.
- The stored value and unit must have one unambiguous meaning.

For bodyweight and no-external-load records, external weight must remain `null`.

Optional notes must be treated as plain text. Do not interpret user notes as code or executable content.

### 6.4 Date behavior

A workout log records the selected workout date as a calendar date.

Use the user's profile timezone when deriving a default date from the current time.

Persist the date-only value without a UTC conversion that shifts it to a different calendar day.

Users may enter or edit historical dates according to the approved product rules. Reject invalid calendar dates.

### 6.5 Editing and deleting logs

Editing a log updates the selected log owned by the authenticated user.

Deleting a log removes only the selected authorized record.

The server must verify ownership for each mutation.

Removing an exercise from a plan must not automatically remove the associated exercise history.

### 6.6 Progress calculations

For each exercise, retrieve the authenticated user's permitted logs and order them chronologically.

The chart and data table must use the same authoritative set of records.

For external-load progression:
- Compare values only when units can be normalized correctly.
- Do not silently combine bodyweight records or no-external-load records into a numeric external-load series.
- Do not infer that a bodyweight log has a known numeric load.
- Do not invent missing dates or weights.
- Show an empty state when there are no records.

Any additional statistic, such as a maximum recorded external load, must be derived only from valid records and must clearly describe what is being measured.

---

## 7. Habit check-ins and streaks

### 7.1 Habit validation

Habit names must be trimmed of leading and trailing whitespace.

Reject empty names and values that exceed the configured application limit.

Habit creation and editing must follow the approved database validation and retention rules.

Do not silently convert an invalid habit name into an unrelated value.

### 7.2 Local calendar date

Use the IANA timezone stored in the user's profile. The default for the application may be `Asia/Kolkata`, but the timezone must remain an explicit profile setting rather than an assumed fixed UTC offset.

The authoritative habit completion date is the user's local calendar date.

Store habit completion dates as date-only values, not timestamps that can shift across calendar days.

### 7.3 Check-in uniqueness

For a given habit and local date, at most one completion record may exist.

The uniqueness requirement is:

`UNIQUE (habit_id, completed_date)`

Repeated submission and request retries must not create duplicate completion records.

Use database constraints and safe mutation behavior to enforce uniqueness.

### 7.4 Check-in operations

A check-in operation must:

1. Authenticate the user.
2. Verify that the habit belongs to that user.
3. Validate the requested date.
4. Apply the approved policy for active or archived habits and permitted dates.
5. Insert or remove the appropriate completion record.
6. Report success only after the mutation is confirmed.

The UI must distinguish a request failure from an unchecked habit.

The permitted behavior for editing historical dates must be consistent with the approved user stories and UI specification.

### 7.5 Current streak algorithm

A current streak is a consecutive sequence of local calendar dates with recorded completions.

Define:
- `today` as the user's current local date.
- `completedDates` as the distinct, valid local completion dates for the habit.

Algorithm:

1. If today is completed, use today as the streak endpoint.
2. Otherwise, if yesterday is completed, use yesterday as the streak endpoint. The current day may still be in progress.
3. Otherwise, the current streak is zero.
4. Starting from the selected endpoint, count consecutive dates backwards while each date is present in `completedDates`.
5. Stop at the first missing date.

The current streak must not count future dates.

### 7.6 Best streak algorithm

The best streak is the longest sequence of consecutive completed calendar dates across all retained valid completion dates.

Algorithm:

1. Deduplicate completion dates.
2. Sort dates chronologically.
3. Compare each date with the previous date.
4. If it is exactly one calendar day later, extend the current run.
5. If there is a gap, start a new run.
6. Track the maximum run length.
7. Return zero if no completion dates exist.

Use calendar-date arithmetic in the user's timezone. Do not calculate streaks by dividing elapsed milliseconds by 24 hours, because timezone transitions can make this incorrect.

### 7.7 Archived and deleted habits

Archiving a habit must follow the approved retention policy. Retained history must not be removed as a side effect of archive.

Archived habits must not receive new completions unless the product explicitly supports reactivation.

The UI must not present an archived habit as an active daily habit.

Permanent deletion and its associated check-in handling must follow the database cascade and retention rules defined in `docs/08-database.md`.

---

## 8. Nutrition and food calculations

### 8.1 Food record requirements

A food record must retain sufficient metadata to interpret its nutritional values, including:
- Food identity and name.
- Reference quantity.
- Reference unit.
- Calories in kcal, if available.
- Protein, carbohydrates, fat, and fibre, when available.
- Source attribution.
- Approximation status.
- Preparation state or other distinctions needed to identify the food accurately.

Do not treat two foods with different preparation states as interchangeable without explicit data support.

### 8.2 Nutrition values and missing data

A nutrient value of `null` means that the value is unavailable.

A value of zero is permitted only when zero is a genuine known value supported by the data source or an explicitly verified domain rule.

Never replace a missing nutrient value with zero simply to make totals calculate.

### 8.3 Serving-scaling formula

Let:
- \(Q\) = selected food quantity.
- \(R\) = reference food quantity.
- \(N_R\) = known nutrient value for the reference quantity.

When the selected quantity and reference quantity use compatible units, calculate:

\[
N_Q=N_R\times\frac{Q}{R}
\]

Apply this formula separately to each known nutrient.

Reject zero or negative reference quantities and unsupported selected quantities.

Do not convert volume units to mass units unless the food data includes an explicit, valid conversion for that particular food.

### 8.4 Meal-level totals

For each nutrient, calculate the total by summing the values of its eligible food entries.

For a nutrient with complete values:

\[
N\_{\text{meal}}=\sum\_{i=1}^{n}N_i
\]

Preserve internal precision through the summation and apply display rounding only after calculating the total.

If one or more selected entries lack a value for a given nutrient:
- Do not treat the missing values as zero.
- Mark the total as incomplete or partial.
- If a partial subtotal is displayed, label it as partial.
- Do not present a partial subtotal as the complete total.

Apply the same rules to daily meal-plan totals.

### 8.5 Food energy and macronutrients

The energy and macronutrient values used by the application must come from the selected food records and their documented source data.

Do not recalculate or override source calories using generic macronutrient conversion factors unless a separately approved domain rule requires that calculation for a specific purpose.

If a selected food lacks the calorie value required to compute the plan's energy total, the application must indicate that the total cannot be fully calculated.

### 8.6 Approximation status

Approximate food values remain marked as approximate in the catalogue and relevant meal-plan views.

Changing a serving quantity must not remove the approximation notice.

A sum containing approximate entries must not be presented as an exact measured nutritional result.

### 8.7 Food selection and filtering

Search and filters select from the existing approved food catalogue.

They must not create synthetic food records or fill missing fields.

Food categories, meal types, and dietary labels must use the canonical values established by the content and database specifications.

---

## 9. Meal-plan suggestions

### 9.1 Eligibility

Personalized suggestions require an eligible calculator result and valid stored food data.

If the user has no eligible result, the application may still display approved general sample-day plans and the food catalogue, but it must not claim that those plans were personalized to the user's calculated requirements.

### 9.2 Approved candidate plans

Generate suggestions only from approved sample plans, supported meal-plan content, and existing food records.

Each candidate must have a valid nutritional basis for its reported totals.

Do not generate foods, servings, or calorie values merely to make a plan match a target.

### 9.3 Target comparison

For a candidate with a complete calorie total and an eligible daily target:

\[
\operatorname{Difference}=
\operatorname{CandidateCalories}-\operatorname{TargetCalories}
\]

A normalized comparison may use:

\[
\operatorname{DifferencePercent}=
\frac{\operatorname{Difference}}{\operatorname{TargetCalories}}\times100
\]

Only calculate the percentage when the target is valid and greater than zero.

Candidate ordering and acceptance tolerances must be centralized in the domain layer and clearly defined before implementation. Do not invent a tolerance inside a page component.

If no candidate is sufficiently close to the target, show the best available candidates with their actual totals and differences, or explain that no suitable candidate is available.

Do not claim that the candidate meets the target when it does not.

### 9.4 Serving edits

When the user changes a food quantity:

1. Validate the quantity.
2. Recalculate the affected item.
3. Recalculate the affected meal total.
4. Recalculate the daily totals.
5. Re-evaluate any target comparison.
6. Mark the plan as unsaved until persistence succeeds.

The calculation must use the current quantity and current underlying food record.

### 9.5 Saving meal plans

Validate the plan before saving.

Persist only valid user-owned records and supported quantities.

The server must derive totals from trusted food data instead of trusting a total supplied by the client.

A failed save must leave the saved version unchanged and must not discard user edits unnecessarily.

---

## 10. Profile data and preferences

### 10.1 Stored profile values

The saved profile may contain age, formula coefficient, height, weight, activity level, goal, calculator target, display-unit preference, and timezone as specified in the database schema.

Each value must be validated according to its applicable domain rules.

Do not assume that a profile field is valid merely because it was valid when first entered. Revalidate when using stored data for a new calculation.

### 10.2 Saved and current values

The application must distinguish saved profile values from unsaved form values.

Only persist profile updates through an authorized operation.

Changes to display units must not alter the physical quantity represented by saved measurements.

### 10.3 Timezone changes

Timezone changes affect the interpretation of the current local date for future date-dependent behavior.

Existing habit check-ins are stored as date-only values and must not be shifted or rewritten solely because the user's timezone setting changes.

---

## 11. Error handling and domain results

### 11.1 Explicit results

Domain operations should return typed results that clearly separate success from failure.

A representative pattern is:

```ts
type DomainResult\<T, E extends string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };
```

This is an illustration of the result contract, not a requirement to use this exact type name.

Avoid using thrown exceptions for ordinary validation outcomes. Unexpected infrastructure failures may still use the application's established error-handling mechanism.

### 11.2 Validation versus infrastructure failures

Distinguish:
- Invalid input.
- Ineligible calculation.
- Missing resource.
- Unauthorized operation.
- Conflicting state.
- Duplicate operation.
- Database or network failure.
- Unexpected internal failure.

Messages intended for users must be safe and understandable.

Log technical details through approved server-side observability where appropriate, without exposing secrets or unnecessary personal data.

### 11.3 No silent corrections

The domain layer must not silently:
- Clamp a calorie target.
- Replace missing weight with zero.
- Invent sets and reps.
- Replace missing nutrient data with zero.
- Shift a habit date.
- Delete historical logs when changing a plan.
- Fabricate missing template content.

When the requested operation is invalid, return an explicit failure or ineligible result.

---

## 12. Recommended pure domain functions

Implement calculation logic in small testable functions. The names below are recommendations; existing approved naming conventions may be used instead.

| Function responsibility | Example function |
|---|---|
| Convert supported units | `convertMeasurement` |
| Validate calculator inputs | `validateCalorieInputs` |
| Calculate BMR | `calculateBmr` |
| Calculate TDEE | `calculateTdee` |
| Calculate a goal target | `calculateGoalTarget` |
| Evaluate calorie-target eligibility | `evaluateCalorieTargetEligibility` |
| Validate workout entry configuration | `validateWorkoutEntry` |
| Validate exercise log | `validateWorkoutLog` |
| Calculate current streak | `calculateCurrentStreak` |
| Calculate best streak | `calculateBestStreak` |
| Calculate food nutrients for a quantity | `scaleFoodNutrition` |
| Calculate a meal total | `calculateMealNutrition` |
| Calculate a daily plan total | `calculateDailyNutrition` |
| Compare a candidate with a daily target | `compareMealPlanWithTarget` |

Pure domain functions must not directly access the browser, network, database, React state, or current system time.

For date-dependent calculations, pass the relevant local date or timezone-derived date as an explicit input.

---

## 13. Testing requirements

Each canonical rule must have automated tests.

### 13.1 Calorie calculator tests

Test:
- Known BMR calculation examples for both formula coefficients.
- Each activity multiplier.
- Each goal adjustment.
- Supported unit conversions.
- Invalid and out-of-range inputs.
- Age below 18.
- Missing formula coefficient.
- Non-finite inputs.
- Non-positive BMR or TDEE.
- Targets below the configured guardrail.
- Rounding at display boundaries.
- The rule that an ineligible calculation never returns a usable target.
- Regression tests that ensure no silent clamping occurs.

### 13.2 Workout tests

Test:
- Correct preservation of source order and labels.
- Unset source sets/reps remain unset.
- Invalid user-configured sets/reps are rejected.
- Replace does not change unrelated personal plans.
- Merge is safe when repeated.
- The same exercise can occur legitimately on different workout days.
- Failed Replace/Merge operations preserve the previous plan.
- Plan changes do not delete independent workout logs.
- Another user's plan or log cannot be modified.

### 13.3 Habit tests

Test:
- First completion produces a streak of one.
- Consecutive dates extend a streak.
- Missing dates break a streak.
- Current streak includes yesterday when today is not yet complete.
- Current streak is zero when neither today nor yesterday has a completion.
- Best streak remains the longest historical consecutive run.
- Duplicate dates do not inflate a streak.
- Date calculations work across month, year, leap-year, and timezone boundaries.
- Repeated requests cannot create duplicate habit-date records.
- Timezone changes do not shift existing date-only completion records.

### 13.4 Nutrition tests

Test:
- Scaling a food to a different valid quantity.
- Correct summation across multiple foods.
- Missing nutrient values remain incomplete rather than being treated as zero.
- Approximation metadata is preserved.
- Invalid quantities are rejected.
- Unsupported unit conversions are rejected.
- Meal and daily totals are derived from trusted food records.
- Candidate-target comparisons use the stored values and valid target.
- Saved totals remain consistent with their food entries.

### 13.5 Test quality

Prefer table-driven unit tests for repeated calculation cases.

Include boundary tests, invalid-input tests, and regression tests for every safety-critical rule.

The test suite must verify results, not just that functions execute without throwing.

---

## 14. Product decisions requiring approval

The following decisions must be resolved and kept consistent across the application:

| Decision | Initial specification | Required action |
|---|---|---|
| Calorie equation | Mifflin–St Jeor | Keep equation and coefficient values centralized |
| Activity multipliers | Five configured levels | Confirm during product review |
| Weight-loss adjustment | 15% below TDEE | Confirm as an initial product default |
| Weight-gain adjustment | 10% above TDEE | Confirm as an initial product default |
| Minimum calorie-target guardrail | 1200 kcal/day | Explicit product-owner acceptance required before production |
| Meal-plan matching tolerance | Not yet specified | Define before implementing candidate ranking |
| Allowed historical habit-check-in dates | Subject to approved product policy | Confirm consistently with user stories |
| Permanent habit deletion and log retention | Governed by the approved database retention policy | Ensure database and domain rules agree |

No coding agent may silently resolve these decisions differently in separate modules.

If an approved value changes, update this document, its canonical implementation, and the corresponding tests together.

---

## 15. Acceptance criteria

The domain implementation is consistent with this document when:

1. Calculator outputs use the specified equation, coefficients, activity multipliers, and goal adjustments.
2. Invalid, underage, and ineligible inputs never produce a valid personalized target.
3. The minimum-target guardrail is applied before display rounding and never silently clamps results.
4. Unit conversions are consistent and do not introduce repeated-rounding errors.
5. Source-template data and user-owned personal-plan data remain separate.
6. Replace and Merge operations follow the approved atomicity and idempotency rules.
7. Exercise logs remain accessible independently of workout plans.
8. Log values distinguish external weight, bodyweight, and no external load.
9. Habit dates use the user's local calendar date, and streaks follow the canonical algorithms.
10. Food nutrition values are scaled from their declared reference quantities and units.
11. Missing nutrition values are never treated as zero.
12. Meal-plan totals are calculated from trusted food records.
13. Personalized suggestions do not invent foods, quantities, or nutrient values.
14. All domain operations have clear success and failure outcomes.
15. The canonical functions have deterministic automated tests, including boundary and regression cases.
16. Product decisions requiring approval are resolved before their behavior is treated as final for production.

---

## 16. Definition of done

This document is ready for implementation planning when:
- All core calculation formulas and validation rules are explicit.
- Date and streak algorithms are deterministic.
- Historical workout records remain independent of workout-plan lifecycle.
- Food scaling and nutrition-total completeness are unambiguous.
- Domain operations have testable outcomes.
- Product decisions and unresolved policies are documented.
- No critical domain behavior depends on undocumented guesses by the coding agent.

**End of Document 5 — Domain Logic.**
