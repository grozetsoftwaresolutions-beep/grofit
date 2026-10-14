# 01 — Product Requirements Document (PRD)

**Product:** Tamil Nadu Fitness Companion  
**Document:** `docs/01-PRD.md`  
**Version:** 0.1  
**Status:** Initial build specification  
**Audience:** Product owner, designer, developer, and Antigravity coding agent  
**Primary platform:** Responsive web application

## 1. Product vision

Build a practical, English-first fitness web application for adult gym-goers in Tamil Nadu. The app connects four daily activities in one place: estimating an appropriate calorie target, selecting and following workouts, recording workout progress, and building habits.

Diet recommendations should use familiar Tamil Nadu foods and make portion sizes adjustable to a user's goal. The application must be useful on a phone at the gym, understandable to a beginner, and structured so Tamil localization can be added without rewriting the product.

The product is a self-management and educational tool. It is not a medical device, a diagnosis service, or a substitute for individualized advice from a qualified healthcare professional or registered dietitian.

## 2. Product goals and measurable outcomes

| ID | Goal | Measurement / acceptance signal |
|---|---|---|
| G-1 | Let an adult calculate a daily energy target for weight maintenance, loss, or gain. | A valid profile can generate and explain BMR, estimated TDEE, goal adjustment, and target calories; calculation tests match the formula specification in `05-domain-logic.md`. |
| G-2 | Let users build a personal workout plan from exercise libraries and the supplied templates. | A selected exercise can be configured with sets/reps and appears in My Workout Plan without being re-entered. |
| G-3 | Make workout progression visible. | A user can record an exercise's working weight by date and see the history in a chart and tabular fallback. |
| G-4 | Encourage consistent habits without punitive mechanics. | A user can mark a habit complete for a local calendar date and see the current and best streak calculated from persisted records. |
| G-5 | Make nutrition guidance locally relevant. | Meal suggestions use a reviewed Tamil Nadu food database, show serving-level nutrition, and adapt portions or selections to the calculated calorie target. |
| G-6 | Protect personal records. | Cross-user reads/writes are rejected by Supabase Row Level Security (RLS), verified by automated tests. |
| G-7 | Work well on mobile and remain Tamil-ready. | All core flows function at 360 CSS pixels wide; user-facing strings are centralized for future Tamil translation. |

Success metrics should be instrumented only after a clear privacy notice is presented. Candidate product metrics are calculator completion rate, workout-plan creation rate, workouts with logged weight, weekly active users, and habit check-in rate.

Do not collect sensitive analytics payloads containing body measurements or meal logs unless explicitly justified and disclosed.

## 3. Non-goals

The first release will not:

- Diagnose, treat, or monitor medical conditions, injuries, eating disorders, or pregnancy.
- Prescribe diets for minors or calculate target calories for users under 18.
- Promise a particular rate of fat loss, muscle gain, or athletic performance.
- Provide real-time coaching, video analysis, wearable integrations, gym equipment integrations, or exercise form detection.
- Include social feeds, public profiles, leaderboards, messaging, trainer-client management, paid subscriptions, or e-commerce.
- Replace a dietitian's individualized plan or guarantee that a food value precisely matches a home-cooked recipe.
- Copy, host, or redistribute third-party exercise videos. Verified user-supplied YouTube URLs may be linked to externally.
- Silently change the exercises or YouTube links in the owner's source workout template.

## 4. Target users and personas

### Persona A — Routine-focused gym-goer

An adult gym-goer in Tamil Nadu who follows a split routine, wants a place to assemble workouts, records weights, and prefers familiar gym terminology.

**Primary needs:** Low-friction exercise selection, a clear weekly plan, and a visible progression history.

### Persona B — Goal-oriented beginner

An adult starting a weight-loss or weight-gain phase. They need plain-language explanations of calorie estimates, safe bounds, approachable food options, and clear indications that results are estimates rather than medical advice.

### Persona C — Consistency builder

An adult who understands basic training and nutrition but struggles to maintain routines. They want a lightweight habit checklist, a meaningful streak calculation, and progress that does not shame them for missed days.

### Persona D — Tamil-first future user

A Tamil-speaking gym-goer who may prefer Tamil UI labels. The first release is English-first, but layouts, content keys, dates, numbers, and units must support localization in a later phase.

## 5. Product principles

1. **User control:** Users choose exercises, edit set/rep targets, and can remove or reorder exercises in their plan.
2. **Safe defaults:** Calculator inputs are validated, recommendations stay within documented bounds, and the app makes limitations visible.
3. **Explain estimates:** Show the formula inputs and explain that BMR/TDEE and food nutrition are estimates.
4. **Source integrity:** Source workout names and verified video links are preserved exactly when imported. Research additions are explicitly labelled as researched additions.
5. **No false precision:** Display nutrition values with serving sizes and an approximation flag where recipes or food composition vary.
6. **Private by default:** Body metrics, workout records, food preferences, and habit logs are private to the signed-in owner.
7. **Mobile-first utility:** Primary actions must be usable with one hand on a phone; never make chart interaction the only way to read data.

## 6. Scope

### 6.1 Release 1 — required

- Supabase authentication and an authenticated app shell.
- Left navigation for **Calorie Calculator**, **Workout Plans**, **My Workout Plan**, **Habit Tracker**, and **Diet Foods**.
- Adult-only calculator supporting weight maintenance, weight loss, and weight gain estimates.
- A searchable/filterable exercise library grouped by Back, Biceps, Forearm, Chest, Triceps, Shoulder, Legs, Abs, and Cardio.
- Exercise selection with configurable sets and reps; chosen exercises are reflected in My Workout Plan.
- Built-in workout templates based on the source material available to the project, with source content separated from researched additions.
- Weekly exercise-weight logging and a progress chart with a readable table alternative.
- Habit creation, completion by local date, and current/best streak display.
- Tamil Nadu food catalogue with serving size, kcal, protein, carbohydrates, fat, fibre, source, and confidence/approximation metadata.
- Example weight-loss and weight-gain day plans; calculator-goal-based meal suggestions with editable food and portion selections.
- Basic account data export and account/data deletion path.
- Responsive layout, accessibility baseline, health disclaimer, automated tests, and a documented migration/deployment workflow.

### 6.2 Release 1 — intentionally limited

- Nutrition recommendations are rule-based and transparent, not AI-generated medical prescriptions.
- Progress charts show the data the user logs; they do not infer muscle gain or body-fat percentage.
- Users may select more than one workout template, but the app must never silently merge template exercises into a user's plan. The merge/replace choice must be explicit.
- The food catalogue starts with reviewed seed data and allows the user to change serving quantity. User-created recipes are not required for the first release.

### 6.3 Later candidates, not release blockers

Tamil translations, reminders/notifications, PWA/offline check-ins, custom recipes, body-weight trend charts, import/export to common fitness formats, and wearable integrations may be considered after release 1 based on user feedback and privacy impact.

## 7. Functional requirements

Priority values: **P0** = release blocker; **P1** = expected in the first usable release; **P2** = follow-up.

Each requirement must be testable.

| ID | Priority | Requirement | Acceptance condition |
|---|---|---|---|
| FR-1 | P0 | The system shall allow a visitor to sign up, sign in, sign out, and recover access using the configured Supabase Auth flows. | Authenticated pages require a valid session; signing out prevents access to private data on subsequent requests. |
| FR-2 | P0 | The system shall store private user settings and fitness records under the authenticated user's identity. | Database integration tests prove a user cannot read or mutate another user's rows. |
| FR-3 | P0 | The calculator shall collect age, sex coefficient required by the selected Mifflin-St Jeor equation, height, weight, activity level, units, and goal. | Missing, out-of-range, non-finite, or unsupported values show field-level errors and do not create a result. The UI explains how the sex coefficient is used by the formula. |
| FR-4 | P0 | The calculator shall show estimated BMR, estimated TDEE, goal adjustment, target kcal/day, and a safety explanation. | For the same valid input, server and client-visible result match the documented domain function; test cases cover loss, maintenance, and gain. |
| FR-5 | P0 | The system shall block calorie-target calculation for users younger than 18. | Entering an age below 18 returns a clear adult-only message and no calorie target. |
| FR-6 | P0 | The app shall display a persistent health disclaimer at calculator and diet-plan decision points. | Disclaimer is visible before a user relies on a target and is available from the global navigation/footer. |
| FR-7 | P0 | The exercise library shall organize exercises under Back, Biceps, Forearm, Chest, Triceps, Shoulder, Legs, Abs, and Cardio. | Each listed exercise has a stable ID, display name, primary muscle/group, equipment metadata when known, source classification, and video URL that is either verified or empty. |
| FR-8 | P0 | The system shall preserve source workout templates as authored and distinguish them from researched additions. | Seed-data tests compare source template names/exercise labels/YouTube URLs with the supplied source; researched items carry a separate source label and never receive invented video URLs. |
| FR-9 | P0 | A user shall be able to choose exercises and configure sets, reps, and their position in a personal plan. | Valid choices persist after reload and are shown in My Workout Plan in the user's chosen order. |
| FR-10 | P0 | My Workout Plan shall be a user-owned, editable view of selected exercises. | Adding, editing, reordering, or removing an exercise updates only that user's plan and is reflected consistently after reload. |
| FR-11 | P1 | The user shall be able to start from a provided template and explicitly choose whether to replace or merge it with the current plan. | A confirmation step identifies the action; cancel leaves the prior plan unchanged. |
| FR-12 | P0 | The user shall be able to log the load/weight used for a selected exercise with a date and optional note. | Valid entries persist with the exercise and timestamp/date; invalid or negative loads are rejected; the user can edit or delete their own entry. |
| FR-13 | P0 | The app shall chart per-exercise logged load over time. | A selected exercise displays dated points in chronological order and an accessible table/list containing the same values. Empty history has a useful empty state. |
| FR-14 | P0 | The user shall be able to create, rename, archive, and delete personal habits. | Each action updates persisted data and is scoped to the authenticated user. |
| FR-15 | P0 | The user shall be able to check a habit complete for a local calendar date and undo that check-in. | A habit has at most one completion per user/date; undo removes or reverses that date's completion; streaks recompute correctly. |
| FR-16 | P1 | The app shall show current and best habit streaks. | Consecutive dates follow the documented domain rules and tests cover today, yesterday, missed days, timezone boundaries, and duplicate check-ins. |
| FR-17 | P0 | The app shall provide a Tamil Nadu food catalogue with serving-level kcal, protein, carbs, fat, fibre, data source, and approximation status. | Every published row has a serving definition, units, values, source citation/identifier, and an approximation marker when values are recipe-dependent or estimated. |
| FR-18 | P0 | The app shall generate editable example meal plans for weight loss and weight gain using food catalogue entries. | Each meal/serving subtotal and daily nutrition total is computed from food entries; the UI labels example plans as estimates. |
| FR-19 | P0 | The app shall tailor food suggestions to the user's selected calculator goal and target calorie range. | Suggestions respond to the stored target and selected preferences; user edits to food or serving size recompute displayed totals immediately or after save. |
| FR-20 | P1 | The user shall be able to filter food entries by meal, vegetarian/egg/non-vegetarian category, and food/search term. | Filter combinations return only matching items and the empty state offers a way to clear filters. |
| FR-21 | P1 | The system shall support metric units as the default and permit display/input conversion for imperial units. | Equivalent metric/imperial inputs resolve to the same normalized internal measurements within the documented rounding tolerance. |
| FR-22 | P0 | The app shall display loading, empty, validation-error, permission-error, and recoverable server-error states for primary flows. | Each primary page has an explicit state and does not leave the user with an indefinite spinner or silent failure. |
| FR-23 | P1 | The user shall be able to export personal workout, habit, calculator-profile, and nutrition-preference data in a documented machine-readable format. | Authenticated export contains only the requesting user's data and returns a usable JSON download. |
| FR-24 | P1 | The user shall be able to request deletion of their account and associated application data. | The flow explains consequences, requires explicit confirmation, and removes/de-identifies user-owned app records according to the documented deletion strategy. |
| FR-25 | P1 | All user-facing text shall be organized for future English/Tamil localization. | No critical UI strings are scattered as unexplained literals across components; a locale can be switched or added without changing domain calculations. |
| FR-26 | P1 | The app shall offer an accessible text alternative for all charts and non-text status indicators. | Keyboard users can operate core flows; charts have labels/summary tables; status is not conveyed by colour alone. |

## 8. Non-functional requirements

| ID | Area | Requirement / measurable criterion |
|---|---|---|
| NFR-1 | Security | Supabase RLS is enabled on every user-owned table; policies scope access using the authenticated user ID. Automated cross-user access tests must pass before deployment. |
| NFR-2 | Privacy | Collect only fields needed for the advertised features. No personal fitness metrics in third-party analytics by default. Publish privacy and deletion explanations before public launch. |
| NFR-3 | Performance | On a typical broadband connection, the authenticated shell should become usable within 2.5 seconds at the 75th percentile after cache warm-up; server-backed primary actions should return within 800 ms at the 75th percentile under normal staging load, excluding third-party auth email delivery. Measure rather than assume. |
| NFR-4 | Availability / resilience | A failed save must preserve the unsaved form data when practical and show a retry action; duplicate submissions must not create duplicate check-ins or plan items. |
| NFR-5 | Accessibility | Target WCAG 2.2 AA for core flows, including visible focus, keyboard access, labels, contrast, error association, reduced-motion respect, and chart text alternatives. |
| NFR-6 | Responsiveness | No horizontal page overflow at 360 px, 390 px, tablet widths, or desktop widths. Sidebar becomes a drawer or compact navigation on narrow screens. |
| NFR-7 | Correctness | Domain calculations are pure, unit-tested, and shared consistently across UI and server actions; dates/streaks use an explicitly defined user-local timezone policy. |
| NFR-8 | Maintainability | TypeScript strict mode is enabled. Database changes use versioned migrations. Validation schemas and domain calculations are not duplicated across components. |
| NFR-9 | Observability | Server errors include a correlation/request ID and are logged without body measurements, credentials, tokens, or private meal/habit content. Error rates and failed mutations are measurable. |
| NFR-10 | Compatibility | Support current stable Chrome, Edge, Firefox, and Safari, with mobile Chrome and Safari as priority test targets. |
| NFR-11 | Content integrity | Every nutrition seed row is traceable to IFCT 2017 or USDA FoodData Central, or explicitly marked as an approximate recipe estimate when no directly comparable item exists. |
| NFR-12 | Recoverability | Database backups and restore verification are configured according to the selected Supabase plan and documented in `12-devops.md`. |

## 9. Core business rules and product decisions

1. **Adult-only calorie targets:** Age must be 18 or above. No calorie target is generated for minors.
2. **Estimates, not prescriptions:** Calorie and macro outputs must display an explanation that real energy needs vary and results should be reviewed if the user has a relevant medical condition or a history of disordered eating.
3. **Safe target bounds:** The exact deficit/surplus, minimum energy thresholds, macro logic, and handling of low computed targets are normative in `05-domain-logic.md`. No UI component may independently invent a calorie floor.
4. **Workout source immutability:** Imported source templates retain source exercise labels and video URLs. Correcting spelling in display labels, swapping an exercise, or changing a link requires an explicit data change and source-owner approval.
5. **Unknown video URL:** Store an empty/null URL. Do not guess, auto-generate, or search-and-substitute a different video URL without verification.
6. **Exercise dose is editable:** Default sets/reps are suggestions only unless the source explicitly specifies them; users can override plan settings.
7. **Weight log meaning:** The weight recorded for an exercise means the external load used in that session, not the user's body weight. If a movement does not have an external load, the UI must support an explicit bodyweight/no-load mode rather than forcing a misleading zero.
8. **Habit date semantics:** Check-ins are keyed to the user's selected local calendar date; timezone and streak edge cases are defined in `05-domain-logic.md` and `08-database.md`.
9. **Food totals:** Per-serving figures are estimates. Recipe variants, cooked/raw state, oil, portion mass, and preparation method must be documented when known.
10. **Template operations:** Applying a template never silently deletes a user's current plan. Replace and merge actions require an explicit user choice and confirmation.

## 10. Dependencies and technical direction

The required stack is Next.js App Router with TypeScript, Supabase Auth/Postgres/RLS, Tailwind CSS, shadcn/ui, and Recharts.

The later architecture specification may add quality-of-life dependencies if justified, such as Zod for validation, React Hook Form for complex forms, a date utility library for timezone-safe date handling, and a test stack for unit, integration, and browser-level testing.

Keep application logic independent of any UI component library.

Primary external dependencies are Supabase availability and configuration, nutrition reference databases, and external YouTube links. Failure of external video links must not block plan use. Seed content must be reviewed before production.

## 11. Source-of-truth status and assumptions

The request refers to `fitness_website_prompt.md`, but the file available in this conversation is `Finalized Workout.pdf`. That PDF contains a Monday-to-Saturday six-day split, warm-up notes, exercise selections, and YouTube links; it does not expose the full named Markdown prompt or a clearly identified Upper/Lower Template B.

Therefore:

- This PRD uses the feature list in the user's message as the source for product functionality.
- The available PDF is the current source for the visible workout template, warm-up notes, and video links.
- The exact exercise names and YouTube URLs will be transcribed and tested in the content/seed-data document without replacement or invented links.
- Template B will not be fabricated. Until the referenced Markdown is supplied, the implementation plan must mark the Upper/Lower template as awaiting source input rather than seeding invented movements.
- New exercises requested for coverage gaps will be labelled `researched` and will have no video URL unless that URL is verified independently.

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Nutrition values differ from a home recipe or serving size. | Users may interpret estimates as exact. | Store serving definitions, food state, source and confidence; mark approximate items; allow serving adjustment; display disclaimers. |
| Calculator output is interpreted as medical advice. | Potential health harm. | Adult-only targets, conservative limits, transparent equations, health notices, and testable safety guards. |
| A source exercise or video URL is changed accidentally. | Loss of source fidelity and trust. | Treat source rows as versioned seed data; include regression tests for source labels and URLs. |
| RLS is misconfigured. | Exposure or corruption of private records. | Enable RLS for each user-owned table and run two-user integration tests in CI/staging. |
| Streaks are wrong near midnight or across timezones. | User frustration and inaccurate records. | Define local-date semantics once, store date-only check-ins where suitable, and test timezone boundaries. |
| Feature scope overwhelms a single coding-agent pass. | Incomplete or hard-to-debug implementation. | Implement in small roadmap phases with exit criteria, migrations, and tests before moving forward. |

## 13. Definition of product acceptance

The first release is acceptable only when:

- All P0 requirements have automated tests or documented manual verification where automation is not appropriate.
- Source workout labels and verified links match the supplied source data.
- All core user data is protected by RLS and cross-user tests pass.
- Calculator outputs match domain-logic test cases and block unsafe/unsupported inputs.
- Meal-plan totals are reproducible from the seeded food records and serving quantities.
- Exercise selection, plan editing, weight logging, habit check-ins, and mobile navigation work on a small viewport.
- Loading, empty, error, and permission states exist for primary flows.
- An accessibility pass covers keyboard use, labels, focus, contrast, errors, and chart alternatives.
- Environment variables, migrations, deployment, backups, export, and deletion are documented.
- No placeholder content, fabricated exercise/video source, or undocumented nutrition values ship to production.

## 14. OPEN QUESTIONS

1. **Source prompt:** Please provide `fitness_website_prompt.md`. It was referenced as the full source of truth, but it was not available among the files I could access; only `Finalized Workout.pdf` was attached. This is needed to verify any additional feature details and recover the exact Upper/Lower Template B.
2. **Public calculator:** Should the app require users to sign in before using the calorie calculator, or allow anonymous calculation and require sign-in only to save plans and history? **Working assumption:** sign-in is required for the app's main pages and persisted data; a public landing page may explain features but will not save calculations.
3. **Mifflin-St Jeor coefficient:** Should the profile use the formula's conventional male/female coefficient choice, or should the app provide an additional pathway for users who cannot or do not wish to choose either coefficient? **Working assumption:** offer a clearly explained formula-coefficient selector and avoid implying that it represents gender identity; allow users to stop without receiving a target if they cannot select a coefficient.
4. **Template switching:** Should users be able to switch workout templates after they begin logging progress against their personal plan? **Working assumption:** yes, with explicit replace/merge confirmation, while historical logs remain intact.
