# 02 — User Stories and Acceptance Criteria

**Product:** Tamil Nadu Fitness Companion  
**Document:** `docs/02-user-stories.md`  
**Version:** 0.1  
**Status:** Initial acceptance specification  
**Depends on:** `docs/01-PRD.md`  
**Audience:** Product owner, QA, developer, and Antigravity coding agent

## 1. Purpose and conventions

This document converts the Product Requirements Document into user stories that can be implemented and tested independently. The functional requirement IDs in `01-PRD.md` are normative. Where a story mentions a target or safety rule, the detailed calculation rule will be defined in `05-domain-logic.md`; where it mentions tables or policy enforcement, the implementation contract will be defined in `08-database.md` and `10-security-privacy.md`.

Story format:

- **As a** user type, **I want** an action, **so that** I can achieve an outcome.
- Every story includes Given/When/Then acceptance criteria.
- “And” clauses in a Then condition are cumulative requirements, not alternatives.
- Validation must run on the server even when the same validation is also provided in the UI.
- Data changes must be scoped to the authenticated owner and must survive page refresh when the story describes persisted data.

Priority: **P0** = release blocker; **P1** = first-release expected. Story IDs are stable references for issues, tests, and implementation prompts.

## 2. Epic A — Account access and data privacy

### US-001 — Create an account

**Requirement mapping:** FR-1, FR-2, NFR-1, NFR-2  
**Priority:** P0

As a new user, I want to create an account, so that I can save my personal workout, habit, and nutrition data.

**Acceptance criteria**

- **Given** I am signed out and the sign-up page is available, **when** I submit a valid email address and a password that satisfies the configured Auth policy, **then** the application submits the request to Supabase Auth and displays the correct confirmation or signed-in state for the project's configured email-confirmation setting.
- **Given** the email is invalid or required fields are missing, **when** I submit the form, **then** field-level errors are displayed and no successful-account state is shown.
- **Given** Supabase Auth rejects the request, **when** the response is received, **then** I see a safe, actionable error that does not expose secrets or internal exception details.
- **Given** account creation succeeds, **when** my authenticated session is established, **then** my user-owned application data is associated with my authenticated user ID and RLS protects it from other users.

### US-002 — Sign in and sign out

**Requirement mapping:** FR-1, FR-2  
**Priority:** P0

As a returning user, I want to sign in and out, so that I can access my data and safely end a session on a shared device.

**Acceptance criteria**

- **Given** I have a valid account and am signed out, **when** I submit correct credentials, **then** the application establishes the configured Supabase session and navigates me to the authenticated app.
- **Given** I submit incorrect credentials, **when** authentication fails, **then** the app shows a generic safe error and does not reveal whether an account exists unless the provider's required flow explicitly permits it.
- **Given** I am signed in, **when** I choose Sign out, **then** the session is cleared and private pages redirect to the sign-in route or display an access-required screen.
- **Given** I have signed out, **when** I use browser navigation to revisit a private page, **then** the app does not reveal cached private data or authorize a private server request.

### US-003 — Recover account access

**Requirement mapping:** FR-1  
**Priority:** P0

As a user who cannot sign in, I want to request account recovery, so that I can regain access without contacting the developer.

**Acceptance criteria**

- **Given** I am on the recovery screen, **when** I submit a syntactically valid email address, **then** the app submits the configured Supabase recovery request and displays a neutral confirmation message.
- **Given** the submitted address is invalid, **when** I submit the form, **then** the UI displays a validation error and does not send a recovery request.
- **Given** the provider request fails, **when** the app receives the failure, **then** it offers a retryable error and does not expose credentials, tokens, or provider internals.

### US-004 — Keep records private to the owner

**Requirement mapping:** FR-2, FR-23, FR-24, NFR-1, NFR-2  
**Priority:** P0

As a user, I want my measurements, plans, workout logs, habits, and preferences to remain private, so that another account cannot access or change them.

**Acceptance criteria**

- **Given** User A owns a plan and User B has a valid session, **when** User B attempts to select User A's row by ID, **then** the database/API returns no accessible row or an authorization failure and reveals no private field values.
- **Given** User B submits a create, update, or delete request containing User A's user ID, **when** the request reaches the server/database, **then** authorization derives from the validated session and RLS rejects cross-user access.
- **Given** a row is user-owned, **when** User A retrieves it using an authorized query, **then** the row is available to User A as expected.
- **Given** an error occurs during an unauthorized request, **when** the failure is logged, **then** logs exclude access tokens, passwords, private body metrics, and full personal meal/habit content.

## 3. Epic B — Calorie calculator

### US-005 — Enter calculator profile and goal

**Requirement mapping:** FR-3, FR-5, FR-21  
**Priority:** P0

As an adult user, I want to enter my age, formula coefficient, height, weight, activity level, units, and goal, so that the application can estimate a daily calorie target.

**Acceptance criteria**

- **Given** I open the calculator, **when** the form renders, **then** it presents all required inputs with labels, units, inline explanations, and a choice of weight-maintenance, weight-loss, or weight-gain goal.
- **Given** I enter valid supported values, **when** I submit the form, **then** the server validates the values and calculates the result through the shared domain logic specified in `05-domain-logic.md`.
- **Given** a required field is missing, a value is non-finite, or a value is outside the documented allowed range, **when** I submit, **then** the form identifies the invalid field and does not display a newly calculated target.
- **Given** I select imperial units, **when** I enter height or weight, **then** the UI clearly identifies the units and normalizes values before calculation; equivalent metric and imperial inputs produce equivalent results within the documented rounding tolerance.
- **Given** I do not wish to choose a coefficient used by the selected equation, **when** I reach that required input, **then** the app explains why it is used and allows me to stop without generating a calorie target.

### US-006 — Prevent calculator targets for minors

**Requirement mapping:** FR-5, FR-6  
**Priority:** P0

As a user under 18, I want the application to explain its age limitation, so that I am not given an adult calorie target that may be inappropriate for me.

**Acceptance criteria**

- **Given** the age field contains a value below 18, **when** I attempt to calculate, **then** the server rejects the request and returns no target calories, macro target, or generated weight-loss/weight-gain plan.
- **Given** the submitted age is below 18, **when** the form receives the validation response, **then** it displays an age-related explanation and recommends involving a parent/guardian and qualified healthcare professional for nutrition guidance.
- **Given** a request is sent directly to the server while bypassing the UI, **when** the age is below 18, **then** the server still rejects it.

### US-007 — Understand the calorie estimate

**Requirement mapping:** FR-4, FR-6, FR-21  
**Priority:** P0

As a user, I want to understand how my calorie target was estimated, so that I can interpret it as guidance rather than a guaranteed requirement.

**Acceptance criteria**

- **Given** a valid calculation completes, **when** the result appears, **then** it shows estimated BMR, estimated TDEE, the selected goal adjustment, the daily calorie target, measurement units, and the key profile inputs used.
- **Given** the goal is maintenance, **when** the result is shown, **then** the goal adjustment is zero and the target equals the rounded TDEE according to `05-domain-logic.md`.
- **Given** the calculation produces a target outside the documented safety bounds, **when** the server evaluates the result, **then** the application follows the canonical rules in `docs/05-domain-logic.md`. An unsafe target is rejected or handled through an explicitly documented safety response; no target is silently clamped. Any permitted adjustment must be explained to the user.
- **Given** a result is shown, **when** I view it on any device, **then** the health disclaimer is visible at the result decision point and the output is labelled as an estimate.
- **Given** a calculation is outside the configured safety bounds, **when** the server evaluates it, **then** the app does not silently clamp it into an apparently normal prescription; it returns the specific safe-handling state defined in `05-domain-logic.md`.

### US-008 — Save and reuse calculator settings

**Requirement mapping:** FR-2, FR-3, FR-4  
**Priority:** P1

As a signed-in user, I want to save my calculator profile and goal, so that I can return to my settings without entering everything again.

**Acceptance criteria**

- **Given** I am signed in and submit a valid profile, **when** I choose Save, **then** the validated profile/settings are persisted under my user ID.
- **Given** I return to the calculator, **when** my saved profile exists, **then** the form loads it and clearly identifies the current goal/settings used for a new calculation.
- **Given** I change a field and cancel or navigate away before saving, **when** I return, **then** the application does not imply that unsaved changes were saved.
- **Given** User B is signed in, **when** User B requests User A's saved profile, **then** RLS denies access.

## 4. Epic C — Workout plans and exercise selection

### US-009 — Browse exercises by muscle group

**Requirement mapping:** FR-7, FR-8  
**Priority:** P0

As a gym-goer, I want to browse and search exercises by muscle group, so that I can find movements suitable for my workout.

**Acceptance criteria**

- **Given** I open the exercise library, **when** it loads successfully, **then** I can navigate the groups Back, Biceps, Forearm, Chest, Triceps, Shoulder, Legs, Abs, and Cardio.
- **Given** I select a group or enter a search term, **when** the filter applies, **then** only matching records appear and clearing filters restores the full permitted list.
- **Given** an exercise has a verified source video URL, **when** its details are displayed, **then** the URL points to the exact stored value and opens as an external link with safe link handling.
- **Given** an exercise has no verified URL, **when** its details are displayed, **then** no broken/fabricated video link appears and the rest of the exercise information remains usable.
- **Given** the exercise library request fails, **when** the page receives the error, **then** it shows a retry state rather than an indefinite spinner.

### US-010 — Preserve source workout templates

**Requirement mapping:** FR-8, FR-11  
**Priority:** P0

As the product owner, I want my source workout templates and video links preserved accurately, so that the application reflects my supplied plan rather than a silently rewritten plan.

**Acceptance criteria**

- **Given** a source template is imported from the available source file, **when** seed data is generated, **then** source exercise labels and video URLs match the source exactly, including the original URL query string.
- **Given** an item is added after exercise research, **when** it is stored, **then** its provenance is marked `researched` and it is distinguishable from source-template content.
- **Given** a video URL is absent or cannot be verified, **when** the seed is generated, **then** the URL is null/empty rather than inferred or invented.
- **Given** Template B's source content is not available to the implementation, **when** the initial seed is prepared, **then** the application does not fabricate Template B exercises; the missing source is called out in project documentation.
- **Given** source-template seed data changes, **when** its regression test runs, **then** it fails if protected exercise labels or URLs differ from the approved source snapshot.

### US-011 — Add an exercise to my plan

**Requirement mapping:** FR-9, FR-10, FR-2  
**Priority:** P0

As a user, I want to select an exercise and configure sets and reps, so that it automatically appears in My Workout Plan.

**Acceptance criteria**

- **Given** I am signed in and viewing a selectable exercise, **when** I choose Add to plan and provide valid set/rep values, **then** the application saves the item and it appears in My Workout Plan without requiring duplicate manual entry.
- **Given** I add a new exercise that requires user-configured sets and reps, **when** I submit missing, invalid, zero, negative, or out-of-range values, **then** the application rejects the invalid submission and explains the issue.
- **Given** an imported source-template exercise has unspecified sets or reps, **when** it appears in My Workout Plan, **then** the missing values remain unset and are clearly labelled as unspecified in the source; the application must not invent defaults. I can configure those values separately.
- **Given** I add an exercise that is already in my plan, **when** the duplicate action is submitted, **then** the UI follows the documented duplicate policy (edit existing plan item or explicitly add another instance) and never creates an accidental duplicate through a repeated request.
- **Given** the save request fails, **when** the response returns, **then** the form retains its values and offers retry.

### US-012 — Edit, reorder, and remove plan items

**Requirement mapping:** FR-9, FR-10, FR-2  
**Priority:** P0

As a user, I want to edit or reorder my selected exercises, so that My Workout Plan matches my actual training routine.

**Acceptance criteria**

- **Given** my plan contains one or more exercises, **when** I edit an item's sets/reps or notes and save, **then** the updated values persist after reload.
- **Given** I use the move-up/move-down or accessible reorder controls, **when** I change an item's position, **then** its new order persists and is reflected in the plan view.
- **Given** I remove a plan item, **when** I confirm the removal if a confirmation is required, **then** the plan item is removed but historical weight-log records are not silently deleted.
- **Given** I am offline or a save fails, **when** an edit is not committed, **then** the application communicates the failure and does not show an unpersisted change as permanently saved.
- **Given** another user owns a plan item ID, **when** I submit an update or delete request for that ID, **then** the request is rejected by server-side authorization/RLS.

### US-013 — Apply a workout template safely

**Requirement mapping:** FR-8, FR-11  
**Priority:** P0

As a user, I want to start from a provided workout template, so that I can set up a routine without entering every exercise individually.

**Acceptance criteria**

- **Given** I choose a template and my current plan is empty, **when** I select Apply, **then** the template exercise order and applicable source metadata are copied to my personal plan.
- **Given** my personal plan already contains exercises, **when** I choose Apply Template, **then** the application asks me to choose Replace or Merge and explains the effect of each option.
- **Given** I cancel the confirmation, **when** the dialog closes, **then** my current plan remains unchanged.
- **Given** I select Replace and confirm, **when** the transaction succeeds, **then** the new plan reflects the selected template and historical exercise logs remain intact.
- **Given** I select Merge and confirm, **when** the transaction succeeds, **then** template items are merged according to the documented duplicate policy and existing item ordering is deterministic.
- **Given** the template operation fails, **when** the app displays the error, **then** it does not leave a partially replaced plan.

## 5. Epic D — Workout weight tracking

### US-014 — Log an exercise load

**Requirement mapping:** FR-12, FR-2, FR-21  
**Priority:** P0

As a gym-goer, I want to record the load used for an exercise on a workout date, so that I can monitor progress over time.

**Acceptance criteria**

- **Given** an exercise is available in my plan, **when** I enter a valid load, unit, date, and optional note and save, **then** the entry is stored and associated with my user and exercise/plan context.
- **Given** the load is negative or non-finite, the date is invalid, or a required field is missing, **when** I submit, **then** validation prevents persistence and explains the error.
- **Given** I perform a bodyweight or no-external-load exercise, **when** I log it, **then** I can choose an explicit bodyweight/no-load mode rather than entering a misleading zero load.
- **Given** I edit or delete a log, **when** the operation succeeds, **then** the change appears in the history and chart and affects only my own data.
- **Given** the network/server request fails, **when** the app returns the error, **then** it preserves entered values where practical and offers retry.

### US-015 — Review exercise progression

**Requirement mapping:** FR-13, FR-26, NFR-5, NFR-7  
**Priority:** P0

As a user, I want to view my exercise load history on a chart and in a table, so that I can understand my logged progression even if the chart is difficult to use.

**Acceptance criteria**

- **Given** I select an exercise with saved entries, **when** its progression view loads, **then** entries are shown in chronological order and each point exposes its date and load/unit.
- **Given** two or more entries exist, **when** I view the chart, **then** the horizontal axis represents dates and the vertical axis represents the recorded load in the selected/normalized unit; the table shows the same source values.
- **Given** there are no entries, **when** I open progression, **then** I see an empty state explaining how to log the first entry.
- **Given** there is one entry, **when** the chart is rendered, **then** the UI still presents the point clearly and does not fabricate a trend line or claim that progression occurred.
- **Given** the chart cannot be operated with my input method, **when** I access the same page, **then** I can inspect the data in the text/table alternative.

## 6. Epic E — Habit tracker

### US-016 — Create and manage habits

**Requirement mapping:** FR-14, FR-2  
**Priority:** P0

As a user, I want to create and manage personal habits, so that I can track consistency in activities I choose.

**Acceptance criteria**

- **Given** I am signed in, **when** I create a habit with a valid name, **then** the habit is saved under my user ID and appears in the tracker.
- **Given** the name is blank or exceeds the documented limit, **when** I submit, **then** validation prevents saving and indicates the issue.
- **Given** I rename, archive, restore where supported, or delete a habit, **when** the action succeeds, **then** the updated state persists and the UI reflects it.
- **Given** I try to access a habit belonging to another user, **when** the request is sent, **then** RLS/authorization prevents access.

### US-017 — Check off a habit for a date

**Requirement mapping:** FR-15, FR-16, NFR-7  
**Priority:** P0

As a user, I want to mark a habit complete for a particular local date and undo it, so that the tracker reflects my actual activity.

**Acceptance criteria**

- **Given** a habit exists, **when** I mark it complete for the current user-local date, **then** exactly one completion record exists for that habit and date.
- **Given** I tap complete repeatedly or retry after a timeout, **when** the request is processed, **then** uniqueness/idempotency rules prevent duplicate completion records.
- **Given** I undo a completion, **when** the request succeeds, **then** the date is marked incomplete and the current/best streaks are recomputed.
- **Given** I select a permitted past local date, **when** I check off the habit, **then** the completion is stored against that local date and not shifted by server UTC conversion.
- **Given** the selected date is outside the documented permitted range, **when** I submit, **then** the app rejects the date and explains the allowed range.

### US-018 — Understand habit streaks

**Requirement mapping:** FR-16, FR-15, NFR-7  
**Priority:** P1

As a user, I want to see current and best streaks, so that I can understand consistency over time without being shamed for breaks.

**Acceptance criteria**

- **Given** a habit has no check-ins, **when** I open the tracker, **then** its current and best streaks display as zero.
- **Given** check-ins exist on consecutive dates, **when** streaks are calculated, **then** the current streak and best streak match the canonical algorithm in `05-domain-logic.md`.
- **Given** I miss a day, **when** I view the tracker after the miss, **then** the current streak follows the documented rule for whether today or yesterday is the latest completed date, and the best historical streak is preserved.
- **Given** I view the tracker around local midnight or after a timezone setting changes, **when** the page refreshes, **then** dates are evaluated using the documented user-local timezone policy and do not shift unexpectedly.
- **Given** I delete a habit, **when** the deletion policy runs, **then** its completion records follow the documented retention/cascade rule and unrelated habit history is unchanged.

## 7. Epic F — Tamil Nadu food catalogue and meal plans

### US-019 — Browse the Tamil Nadu food database

**Requirement mapping:** FR-17, FR-20, FR-26, NFR-11  
**Priority:** P0

As a user, I want to browse Tamil Nadu foods by meal and dietary category, so that I can choose foods that fit my preferences and calorie goal.

**Acceptance criteria**

- **Given** I open Diet Foods, **when** the catalogue loads, **then** each published entry displays its name, serving size/unit, kcal, protein, carbohydrates, fat, fibre, dietary category, and source/approximation status.
- **Given** an entry is directly sourced from IFCT 2017 or USDA FoodData Central, **when** it is displayed, **then** its source is attributable in the content details or source note.
- **Given** a cooked mixed dish has no directly comparable source value, **when** it is published, **then** it is labelled approximate and includes the recipe/serving assumptions used to estimate it.
- **Given** I filter by breakfast, lunch, snack, drink, fruit, vegetarian, egg, or non-vegetarian category, **when** filters apply, **then** only matching entries display.
- **Given** I search for a food name, **when** matching results exist, **then** results are shown; otherwise an empty state offers a clear-filter action.

### US-020 — Adjust a food serving

**Requirement mapping:** FR-17, FR-18, FR-19  
**Priority:** P0

As a user, I want to change a food's serving quantity, so that displayed nutrition reflects the quantity I plan to eat.

**Acceptance criteria**

- **Given** a catalogue entry defines nutrition per reference serving, **when** I choose a valid multiplier or quantity, **then** kcal, protein, carbohydrates, fat, and fibre are recalculated proportionally using the documented serving conversion rule.
- **Given** a quantity is zero, negative, non-finite, or exceeds the documented supported range, **when** I attempt to save it, **then** validation blocks the change.
- **Given** values are rounded for display, **when** I view the meal and daily totals, **then** totals are calculated from unrounded stored/reference values and rounded only at the documented presentation step.
- **Given** the entry is flagged approximate, **when** I adjust its serving, **then** the approximation notice remains visible.

### US-021 — Generate a weight-loss or weight-gain sample day

**Requirement mapping:** FR-18, FR-19, FR-6  
**Priority:** P0

As a user, I want to see a sample Tamil Nadu-style day of meals for weight loss or weight gain, so that I can understand what a goal-aligned day might look like.

**Acceptance criteria**

- **Given** I choose the loss or gain sample, **when** the day plan appears, **then** meals use existing catalogue IDs and show item/serving quantities, per-meal totals, and daily totals.
- **Given** any listed food has an approximate nutrition estimate, **when** the plan is shown, **then** the relevant item and plan summary disclose that totals are approximate.
- **Given** the user's configured calorie target is known, **when** goal-based suggestions are generated, **then** portions or selections are chosen by the deterministic rules in `05-domain-logic.md`, not by an opaque model response.
- **Given** the target is outside the safe range or no safe plan can be produced from the configured database, **when** generation is requested, **then** the app refuses to imply that a safe individualized plan exists and explains the limitation.
- **Given** a sample plan is rendered, **when** I view it, **then** the medical disclaimer is visible and the plan is described as an example, not a medical prescription.

### US-022 — Edit a meal plan and recalculate totals

**Requirement mapping:** FR-18, FR-19, FR-20  
**Priority:** P1

As a user, I want to add, remove, or adjust foods in a suggested plan, so that it reflects my preferences and available foods.

**Acceptance criteria**

- **Given** a meal plan is displayed, **when** I add an eligible catalogue item, remove an item, or change a quantity, **then** relevant meal and daily nutrition totals are recalculated.
- **Given** I select an item incompatible with an active food preference/filter, **when** the UI submits the change, **then** the app applies the documented preference behavior and does not silently mislabel the plan's dietary category.
- **Given** I save the edited plan while signed in, **when** I return to Diet Foods, **then** the saved plan is restored under my account.
- **Given** no matching foods satisfy a filter, **when** the planner evaluates choices, **then** it shows a clear limitation instead of inventing food items or nutrition data.

## 8. Epic G — Data export and account deletion

### US-023 — Export my data

**Requirement mapping:** FR-23, FR-2, NFR-2  
**Priority:** P1

As a user, I want to export my personal application data, so that I can retain a copy outside the application.

**Acceptance criteria**

- **Given** I am signed in, **when** I request an export, **then** the server produces valid JSON covering my calculator profile/settings, personal workout plan, exercise logs, habit definitions/check-ins, and saved nutrition preferences/plans that exist.
- **Given** other users have records in the system, **when** my export is generated, **then** it contains no other user's rows or identifying information.
- **Given** export generation fails, **when** the failure is displayed, **then** the app offers a safe retry and does not expose a partial response as a valid export.
- **Given** an export is ready, **when** I download it, **then** the file has a clear filename, JSON encoding, and documented schema/version metadata.

### US-024 — Delete my account and related data

**Requirement mapping:** FR-24, FR-2, NFR-2  
**Priority:** P1

As a user, I want to request account and application-data deletion, so that I can stop using the service and remove my records.

**Acceptance criteria**

- **Given** I open account deletion, **when** the page loads, **then** it explains the consequences, scope, and whether the operation is immediate or asynchronous before I confirm.
- **Given** I have not confirmed deletion, **when** I leave or cancel the page, **then** no deletion is performed.
- **Given** I confirm deletion through the required re-authentication/confirmation step, **when** the deletion succeeds, **then** the documented account-deletion process removes or de-identifies associated application data and invalidates the session.
- **Given** deletion fails partially, **when** the system detects the failure, **then** the outcome is logged safely, an appropriate recovery path is triggered, and the UI does not claim successful completion without verified completion.
- **Given** I try to sign in after completed deletion, **when** the request is processed, **then** access behaves according to the configured Supabase account deletion and recovery policy, and removed application records are not restored accidentally.

## 9. Epic H — Responsive, accessible, resilient UI

### US-025 — Use the app on a phone

**Requirement mapping:** FR-22, NFR-6, NFR-10  
**Priority:** P0

As a gym-goer using a phone, I want the app's essential actions to work on a small screen, so that I can check workouts between sets.

**Acceptance criteria**

- **Given** viewport width is 360 CSS pixels, **when** I use the calculator, exercise library, My Workout Plan, weight logging, habit tracker, and Diet Foods, **then** there is no horizontal page overflow and each primary action remains visible and operable.
- **Given** the viewport is below the desktop sidebar breakpoint, **when** the app shell renders, **then** the sidebar is presented as a mobile drawer or an equivalent accessible compact navigation pattern.
- **Given** I open the mobile navigation, **when** I select a destination, **then** the correct page opens and the navigation can be dismissed using keyboard and touch input.
- **Given** I rotate or resize the viewport during a form, **when** layout reflows, **then** the entered form data is retained.

### US-026 — Identify loading, empty, and error states

**Requirement mapping:** FR-22, NFR-4, NFR-9  
**Priority:** P0

As a user, I want clear feedback while data loads or fails, so that I know whether an action succeeded and how to recover.

**Acceptance criteria**

- **Given** a primary page is fetching required data, **when** the request is pending, **then** a meaningful loading indicator or skeleton is displayed without presenting stale data as newly saved.
- **Given** the user has no saved items, **when** the page loads successfully, **then** a helpful empty state explains the first action and does not show a server error.
- **Given** a request fails, **when** the error is handled, **then** the UI shows a user-safe message and retry path when retry is appropriate.
- **Given** a save is in progress, **when** I submit repeatedly, **then** controls prevent accidental duplicate submission and the backend remains idempotent where required.
- **Given** server diagnostics are needed, **when** an error is recorded, **then** a correlation/request ID is available to support investigation without logging private payloads.

### US-027 — Navigate the app with keyboard and assistive technology

**Requirement mapping:** FR-26, FR-22, NFR-5  
**Priority:** P0

As a user who navigates by keyboard or assistive technology, I want the core features to be accessible, so that I can use the same essential functionality as other users.

**Acceptance criteria**

- **Given** I use only a keyboard, **when** I navigate all core flows, **then** every actionable control is reachable in a logical order, has visible focus, and can be activated without a pointer.
- **Given** a form field has an error, **when** the error appears, **then** it is programmatically associated with the field and not communicated only by colour.
- **Given** content updates after a save or check-in, **when** the update completes, **then** relevant status is announced appropriately without moving focus unexpectedly.
- **Given** a chart is rendered, **when** I cannot inspect it visually or interact with the chart, **then** a labelled data table or equivalent text alternative exposes the same values.
- **Given** reduced-motion preferences are enabled, **when** transitions/animations are rendered, **then** nonessential animation is reduced or removed.

### US-028 — Prepare for English/Tamil localization

**Requirement mapping:** FR-25, FR-21, NFR-6  
**Priority:** P1

As a future Tamil-speaking user, I want app labels and date/number presentation to be localizable, so that the app can support Tamil without changing its core behavior.

**Acceptance criteria**

- **Given** a user-facing page is implemented, **when** the UI code is reviewed, **then** user-facing labels/messages are sourced from the agreed localization mechanism rather than scattered hard-coded strings, excluding developer-only logs and stable technical identifiers.
- **Given** a longer translated label is substituted in a test locale, **when** the page renders, **then** layout does not clip critical text or hide primary actions at supported viewport sizes.
- **Given** a date, decimal, or measurement is displayed, **when** locale formatting is applied, **then** the underlying stored value and domain calculation remain locale-independent and numerically correct.
- **Given** English is the only shipped locale, **when** the app starts, **then** English is the default and no incomplete Tamil translation is presented as finished content.

## 10. Cross-cutting acceptance rules

The following rules apply to every story that reads or mutates persisted user data:

1. The server validates input independently of client-side validation.
2. The authenticated identity comes from the validated Supabase session, not from a user ID supplied by the browser.
3. Database authorization and RLS enforce ownership even if a caller bypasses the UI.
4. A failed mutation must not be presented as successful; retry must not create unintended duplicates.
5. Error messages must be useful without revealing secrets, internal stack traces, or another user's data.
6. Source nutrition/workout content must retain provenance; unsupported facts are not filled in by guesswork.
7. Primary pages implement explicit loading, empty, error, and success states.
8. All domain formulas, bounds, rounding, timezone interpretation, and cascade behavior are canonical in the corresponding domain/database/security documents, not independently reimplemented in page components.

## 11. Suggested story-to-test mapping

Use these story IDs as stable names in automated test descriptions. Detailed test case IDs and environment requirements belong in `11-test-plan.md`.

| Story IDs | Minimum automated test coverage |
|---|---|
| US-001–US-004 | Auth form validation; session lifecycle; recovery request; two-user RLS read/write denial; safe error handling. |
| US-005–US-008 | Calculator required/range validation; minors rejected at server; formula example cases; unit conversion equivalence; save/load profile; disclaimer presence. |
| US-009–US-013 | Exercise group/filter behavior; source seed snapshot; empty URL behavior; add/edit/reorder/remove plan item; replace/merge/cancel template operations. |
| US-014–US-015 | Load validation and bodyweight mode; idempotent retry; chronological history; chart/table equivalence; empty and single-entry states. |
| US-016–US-018 | Habit CRUD; unique completion by date; undo completion; streak algorithm; local-date/timezone boundary tests. |
| US-019–US-022 | Food source metadata; category/search filters; portion scaling; meal/daily totals; approximate labels; safe planner fallback. |
| US-023–US-024 | Export schema and owner scoping; deletion confirmation, successful removal, and partial-failure handling. |
| US-025–US-028 | Responsive viewport checks; loading/empty/error states; keyboard/automated accessibility checks; localization string/layout checks. |

## 12. Assumptions carried into implementation

- Authentication is required to persist personal data and access the main app pages.
- Calculation rules, calorie floors, macro ranges, input bounds, serving conversion, duplicate-plan behavior, habit-streak semantics, permitted backdated check-in dates, and deletion cascades will be defined once in the domain/database documents and shared by all entry points.
- Template source content remains immutable unless the product owner explicitly approves a source correction.
- If the referenced `fitness_website_prompt.md` becomes available, additional explicit requirements in it must be added to this story set before implementation of the affected feature. Until then, no missing Template B exercises or links will be invented.

## 13. Traceability index

| PRD requirement | Story coverage |
|---|---|
| FR-1 | US-001, US-002, US-003 |
| FR-2 | US-001, US-004, US-008, US-011, US-012, US-014, US-016, US-023, US-024 |
| FR-3 | US-005, US-008 |
| FR-4 | US-007, US-008 |
| FR-5 | US-005, US-006 |
| FR-6 | US-006, US-007, US-021 |
| FR-7 | US-009 |
| FR-8 | US-010, US-013 |
| FR-9 | US-011, US-012 |
| FR-10 | US-011, US-012 |
| FR-11 | US-013 |
| FR-12 | US-014 |
| FR-13 | US-015 |
| FR-14 | US-016 |
| FR-15 | US-017, US-018 |
| FR-16 | US-017, US-018 |
| FR-17 | US-019, US-020 |
| FR-18 | US-021, US-022 |
| FR-19 | US-020, US-021, US-022 |
| FR-20 | US-019, US-022 |
| FR-21 | US-005, US-007, US-014, US-020, US-028 |
| FR-22 | US-009, US-025, US-026, US-027 |
| FR-23 | US-004, US-023 |
| FR-24 | US-004, US-024 |
| FR-25 | US-028 |
| FR-26 | US-015, US-019, US-027 |
| NFR-1 | US-001, US-004, US-008, US-011, US-012, US-016, US-023, US-024 |
| NFR-2 | US-001, US-004, US-023, US-024 |
| NFR-3 | To be verified by performance tests in `11-test-plan.md` and monitoring in `12-devops.md`. |
| NFR-4 | US-012, US-014, US-026 |
| NFR-5 | US-015, US-025, US-027 |
| NFR-6 | US-025, US-028 |
| NFR-7 | US-007, US-017, US-018, US-020 |
| NFR-8 | Architecture and implementation constraints in `07-architecture.md`; CI gates in `12-devops.md`. |
| NFR-9 | US-004, US-026 |
| NFR-10 | US-025 |
| NFR-11 | US-019, US-021 |
| NFR-12 | Restore-verification scenarios in `11-test-plan.md` and `12-devops.md`. |
