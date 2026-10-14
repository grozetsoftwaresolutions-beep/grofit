     # 03 — Information Architecture



     \*\*Product:\*\* Tamil Nadu Fitness Companion  

     \*\*Document:\*\* \`docs/03-information-architecture.md\`  

     \*\*Version:\*\* 0.2  

     \*\*Status:\*\* Revised information architecture specification  

     \*\*Depends on:\*\* \`docs/01-PRD.md\`, \`docs/02-user-stories.md\`, approved \`docs/02-Implementation-Plan.md\` v0.4  

     \*\*Audience:\*\* Product owner, UX designer, developer, QA, and Antigravity coding agent



     ---



     ## 1. Purpose



     This document defines the application's information architecture: sitemap, route hierarchy, navigation, protected pages, and major user flows.



     Its purpose is to ensure that the interface has a predictable structure before UI implementation begins.



     All URLs and navigation behaviors in this document are normative unless explicitly identified as an assumption. The visual layout and detailed component behavior will be specified in \`docs/04-ui-ux-spec.md\`.



     The application must follow these product decisions:



     - Users must sign in to access the main application and persist personal data.

     - The public landing page explains the product without exposing saved personal information.

     - The five main sidebar destinations are Calorie Calculator, Workout Plans, My Workout Plan, Habit Tracker, and Diet Foods.

     - Historical exercise logs must remain accessible when workout plans are changed or replaced.

     - English is the initial language, with a structure that supports Tamil localization.

     - The supplied six-day workout template must retain its source exercise labels and per-entry video URLs.

     - The missing Upper/Lower Template B must not be invented.



     ## 2. Information architecture principles



     ### IA-1 — Five primary navigation destinations



     The application shall expose exactly five primary sidebar destinations:



     1. Calorie Calculator

     2. Workout Plans

     3. My Workout Plan

     4. Habit Tracker

     5. Diet Foods



     Account settings, data export, and account deletion are secondary destinations, accessible through the account menu or settings page rather than additional primary sidebar items.



     ### IA-2 — One consistent application shell



     All authenticated pages use a shared application shell containing:



     - Primary navigation sidebar or mobile navigation drawer.

     - Application header.

     - Page title and optional breadcrumbs.

     - Main content region.

     - Account menu.

     - Consistent loading, empty, and error presentation.



     Page-specific features may differ, but primary navigation and account access must remain consistent.



     ### IA-3 — Preserve navigation context



     Users should be able to move between related pages without losing saved work.



     For example, opening an exercise's progression history must preserve useful back-navigation context without making the history depend on a selected plan or plan ID. Workout logs are tied to the authenticated user and exercise, so they remain available when a plan is replaced or deleted. When a user navigates from a meal suggestion to its saved meal plan, the selected foods and serving quantities must remain consistent.



     ### IA-4 — Separate source templates from personal plans



     \`Workout Plans\` provides access to available templates and the exercise library. \`My Workout Plan\` represents the authenticated user's editable plan.



     Changing a personal plan must not modify the global source template. Template Replace/Merge operations require explicit user choice and confirmation.



     ### IA-5 — Keep private information private



     Private routes require an authenticated session. Every server action, route handler, and database operation must independently enforce authentication and authorization as specified in \`07-architecture.md\`, \`08-database.md\`, and \`10-security-privacy.md\`.



     A protected page layout or middleware check alone is not sufficient authorization.



     ---



     ## 3. Sitemap



     \`\`\`text

     Tamil Nadu Fitness Companion

     |

     |-- Public Pages

     |   |-- /

     |   |-- /privacy

     |   |-- /health-disclaimer

     |

     |-- Authentication

     |   |-- /auth/sign-up

     |   |-- /auth/sign-in

     |   |-- /auth/forgot-password

     |   |-- /auth/reset-password

     |   |-- /auth/callback

     |

     |-- Authenticated Application

     |   |-- /app

     |   |

     |   |-- /app/calorie-calculator

     |   |

     |   |-- /app/workout-plans

     |   |   |-- /app/workout-plans/[templateId]

     |   |

     |   |-- /app/my-workout-plan

     |   |   |-- /app/my-workout-plan/[planId]

     |   |

     |   |-- /app/workout-progress/[exerciseId]

     |   |

     |   |-- /app/habit-tracker

     |   |

     |   |-- /app/diet-foods

     |   |   |-- /app/diet-foods/plans/[mealPlanId]

     |   |

     |   |-- /app/settings

     |       |-- /app/settings/profile

     |       |-- /app/settings/data

     |

     |-- Framework-Level States

     |-- not-found

     |-- error boundary

     |-- loading boundary

     \`\`\`



     ### Route interpretation



     - \`[templateId]\`, \`[planId]\`, \`[exerciseId]\`, and \`[mealPlanId]\` represent dynamic identifiers.

     - Next.js route groups may be used internally to organize files without changing the URLs.

     - Framework-level loading and error boundaries are states of a page, not separate public destinations.

     - \`/app\` is the authenticated entry point. It redirects to \`/app/calorie-calculator\` unless a dedicated overview page is deliberately approved later.

     - \`/app/workout-progress/[exerciseId]\` is an authenticated exercise-history view independent of any workout plan. It is not a sixth sidebar destination; its log query is scoped to the signed-in user and selected exercise.

     - \`/app/diet-foods/plans/[mealPlanId]\` opens an individual saved meal plan. It remains under Diet Foods in the navigation hierarchy.



     ## 4. Route specification



     | Route | Access | Purpose | Primary actions |

     |---|---|---|---|

     | \`/\` | Public | Explain the product and its main features. | Sign up, sign in, view privacy/health information. |

     | \`/privacy\` | Public | Explain what user data is collected, how it is used, and how export/deletion work. | Return to landing page, sign in. |

     | \`/health-disclaimer\` | Public | Explain that calorie, nutrition, and exercise information is educational and not medical advice. | Return to calculator or landing page. |

     | \`/auth/sign-up\` | Public | Create a user account. | Submit registration, navigate to sign in. |

     | \`/auth/sign-in\` | Public | Authenticate a returning user. | Sign in, recover access, register. |

     | \`/auth/forgot-password\` | Public | Request account recovery. | Submit recovery request. |

     | \`/auth/reset-password\` | Recovery session | Allow a verified recovery flow to set a new password. | Submit new password, return to sign in. |

     | \`/auth/callback\` | Auth callback handler | Complete the configured Supabase authentication/recovery callback. | Establish session and redirect safely. |

     | \`/app\` | Authenticated | Resolve the initial application destination. | Redirect to the default primary page. |

     | \`/app/calorie-calculator\` | Authenticated | Estimate BMR, TDEE, and goal-based calorie targets. | Calculate, review, and save supported profile settings. |

     | \`/app/workout-plans\` | Authenticated | Browse available templates and the exercise catalogue. | Search/filter exercises, open template details, choose exercises. |

     | \`/app/workout-plans/[templateId]\` | Authenticated | Preview a template and its days, exercises, source labels, warm-ups, and available video links. | Apply template using Replace/Merge where applicable. |

     | \`/app/my-workout-plan\` | Authenticated | View and manage the user's current or selected personal plan. | Add/edit/reorder/remove exercises, select active plan, log exercise loads. |

     | \`/app/my-workout-plan/[planId]\` | Authenticated, owner-scoped | View and edit a specific personal plan and its workout days. | Configure exercises and sets/reps, reorder days and entries, log loads. |

     | \`/app/workout-progress/[exerciseId]\` | Authenticated, user-owned logs | View a selected exercise's historical load entries, independently of any workout plan. | Add/edit/delete the signed-in user's logs, view chart and table. |

     | \`/app/habit-tracker\` | Authenticated | Manage habits, complete daily check-ins, and inspect streaks. | Create/edit/archive/delete habit, check off or undo a date. |

     | \`/app/diet-foods\` | Authenticated | Browse foods, inspect nutrition, and generate sample or personalized meal plans. | Search/filter, adjust servings, create/save meal plans. |

     | \`/app/diet-foods/plans/[mealPlanId]\` | Authenticated, owner-scoped | View and edit a saved personal meal plan. | Add/remove foods, change quantities, review totals, save. |

     | \`/app/settings\` | Authenticated | Provide a settings landing page. | Open profile or data settings. |

     | \`/app/settings/profile\` | Authenticated | Manage saved profile, display units, and timezone where supported. | View/update personal settings. |

     | \`/app/settings/data\` | Authenticated | Manage data export and account deletion. | Request JSON export, confirm deletion. |



     ### Route requirements



     1. Every authenticated route must validate the session on the server before returning private data.

     2. A route containing a resource ID must verify that the authenticated user owns the underlying resource.

     3. Unknown or inaccessible resource IDs must not reveal another user's information.

     4. An unauthenticated user attempting to open a protected page is redirected to sign in, with a safe return destination retained where appropriate.

     5. A signed-in user visiting sign-in or sign-up is redirected to the authenticated application unless the page is part of a supported authentication callback or recovery flow.

     6. Authentication return destinations must be restricted to safe internal paths to prevent open redirects.

     7. Direct URL access must work for authorized resources; access must not depend on first visiting a parent page.

     8. Missing, expired, or invalid resources must display a suitable not-found or access-required state, rather than raw database errors.

      9. The \`/app/workout-progress/[exerciseId]\` route must retrieve logs using the authenticated user and exercise, without requiring an existing plan or plan ID. Log access must be enforced by server-side authorization and RLS. Historical entries must remain accessible after a plan is replaced or deleted.



     ---



     ## 5. Primary navigation specification



     ### Desktop navigation



     The sidebar contains the following destinations in this order:



     | Order | Label | Route | Icon intent |

     |---|---|---|---|

     | 1 | Calorie Calculator | \`/app/calorie-calculator\` | Calculator |

     | 2 | Workout Plans | \`/app/workout-plans\` | Dumbbell or library |

     | 3 | My Workout Plan | \`/app/my-workout-plan\` | Clipboard/checklist |

     | 4 | Habit Tracker | \`/app/habit-tracker\` | Calendar/check |

     | 5 | Diet Foods | \`/app/diet-foods\` | Utensils/apple |



     Icon names are implementation choices. They must use a consistent icon library and must not replace accessible text labels.



     ### Sidebar behavior



     - The active destination must be visually distinguishable and programmatically identified using appropriate navigation semantics, such as \`aria-current="page"\`.

     - The independent workout-progress route should keep My Workout Plan selected as its contextual primary navigation section. Saved meal-plan pages must retain Diet Foods as the active section.

     - Opening a detail page must not add a new primary sidebar destination.

     - The sidebar may support collapse/expand on desktop if usability remains clear.

     - The selected route should remain identifiable when the sidebar is collapsed, through accessible labels and tooltips where necessary.



     ### Mobile navigation



     At narrow viewport widths, the desktop sidebar changes to an accessible mobile drawer or equivalent compact navigation.



     The mobile navigation must:



     - Expose all five primary destinations.

     - Show the active destination.

     - Allow keyboard and touch operation.

     - Support dismissal using an appropriate close action and keyboard behavior.

     - Return focus appropriately when dismissed.

     - Avoid blocking critical save actions or form controls.

     - Preserve form state when opened, closed, or when the viewport changes.



     ### Header



     The shared authenticated header contains:



     - Current page title or a route-specific title region.

     - A compact navigation trigger on mobile.

     - Account menu with profile settings, data management, and sign-out.

     - Optional contextual actions, such as adding an exercise or saving a plan.



     The header must not contain private profile values in URLs or expose tokens or sensitive identifiers.



     ---



     ## 6. Information hierarchy within each main destination



     ### 6.1 Calorie Calculator



     \*\*Route:\*\* \`/app/calorie-calculator\`



     Recommended content hierarchy:



     1. Page title and brief explanation.

     2. Health disclaimer and adult-only notice.

     3. Profile inputs: age, formula coefficient, height, weight, activity level, units, and goal.

     4. Input validation and explanatory hints.

     5. Calculate action.

     6. Results section, displayed only when an eligible calculation succeeds.

     7. Estimated BMR, estimated TDEE, goal adjustment, daily calorie target, and calculation assumptions.

     8. Next step: review relevant food suggestions in Diet Foods.



     Rules:



     - Users under 18 must not receive calorie targets.

     - A user who declines the required formula coefficient must be able to stop without a target.

     - Unsafe results follow \`05-domain-logic.md\` and must not be silently clamped.

     - Saving a profile does not mean every subsequent calculator input is automatically saved.

     - The page must distinguish saved settings, unsaved form changes, valid results, and rejected calculations.



     The calculator may link to Diet Foods. The food planner must use only an eligible, validated target and must apply the documented nutrition safety rules.



     ### 6.2 Workout Plans



     \*\*Route:\*\* \`/app/workout-plans\`



     This destination provides two clear content areas or tabs:



     - \*\*Templates:\*\* Source workout templates and their individual day structures.

     - \*\*Exercise Library:\*\* Exercises grouped by Back, Biceps, Forearm, Chest, Triceps, Shoulder, Legs, Abs, and Cardio.



     The page should support:



     - Search by exercise name.

     - Filter by muscle group.

     - Open exercise details.

     - Display source or researched provenance.

     - Display a video link only when one exists and is verified.

     - Add an eligible exercise to the personal plan.

     - Open a template for review before applying it.



     Template detail hierarchy:



     1. Template name and provenance.

     2. Overview of the weekly split or available days.

     3. Individual workout days in the specified order.

     4. Warm-up details where supplied by the source.

     5. Exercise entries, retaining original labels and per-entry video URLs.

     6. Sets/reps when supplied or configured; unspecified source values remain unset.

     7. Apply Template action.



     The unavailable Upper/Lower Template B must not be shown as a fabricated or ready-to-use template.



     ### 6.3 My Workout Plan



     \*\*Routes:\*\* \`/app/my-workout-plan\` and \`/app/my-workout-plan/[planId]\`



     This destination is the user's personal workspace, separate from the global template catalogue.



     Recommended hierarchy:



     1. Plan selector or current-plan title.

     2. Plan-level actions: create, rename, apply template, or select another plan.

     3. Ordered list of workout days.

     4. Within each day, ordered exercise entries.

     5. Exercise-specific configuration: sets, reps, notes, and source metadata where applicable.

     6. Exercise actions: edit, reorder, remove, and log load.

     7. Link to exercise progression history at \`/app/workout-progress/[exerciseId]\`. This destination is independent of the plan route.



     For source-template exercises:



     - Source labels and associated video URL snapshots must be preserved.

     - Missing source sets/reps must remain unset until the user configures them.

     - A researched default recommendation, where approved, must be explicitly differentiated from a source-specified prescription.

     - Editing a personal entry must not alter the global template.



     Template application must explicitly present Replace or Merge when an existing plan is affected. The interface must explain the consequences and obtain confirmation before committing the operation.



     The backend must execute Replace/Merge atomically. A failed operation leaves the existing plan unchanged. Repeated merges must not create accidental duplicate source imports, while legitimate occurrences of the same exercise on different days remain valid.



     ### 6.4 Habit Tracker



     \*\*Route:\*\* \`/app/habit-tracker\`



     Recommended hierarchy:



     1. Page title and selected local date.

     2. Daily completion summary.

     3. Habit list with completion controls.

     4. Current and best streak information.

     5. Add-habit action.

     6. Habit management controls.

     7. Optional date-history view.



     Behavior:



     - A check-in applies to the user's local calendar date.

     - A habit/date combination can have at most one completion.

     - A completed habit can be unchecked according to the defined history policy.

     - Repeated submission or retry cannot create duplicate check-ins.

     - The interface distinguishes a missing completion from a failed request.

     - A streak is calculated using the canonical algorithm in \`05-domain-logic.md\`.



     Deleting or archiving a habit must follow the documented data-retention and cascade rules.



     ### 6.5 Diet Foods



     \*\*Routes:\*\* \`/app/diet-foods\` and \`/app/diet-foods/plans/[mealPlanId]\`



     The Diet Foods destination includes:



     - Food catalogue.

     - Food details and serving controls.

     - Filters for meal type and vegetarian, egg, and non-vegetarian categories.

     - Weight-loss sample day.

     - Weight-gain sample day.

     - User-goal-based meal suggestions when eligible calculator data exists.

     - Saved meal-plan access.



     Food detail hierarchy:



     1. Food name.

     2. Reference serving and units.

     3. kcal, protein, carbohydrates, fat, and fibre.

     4. Dietary category and meal category.

     5. Source attribution and approximation status.

     6. Editable quantity or serving multiplier.

     7. Updated nutrient totals.



     Meal-plan hierarchy:



     1. Meal-plan name and goal context.

     2. Daily target when available and eligible.

     3. Meals grouped by meal type.

     4. Food entries and serving quantities.

     5. Per-meal nutrient totals.

     6. Daily nutrient totals.

     7. Save or update action.

     8. Visible disclaimer and approximation notices where relevant.



     Totals must be calculated deterministically from the stored food data and selected serving quantities. The system must not invent missing foods or nutrition values to satisfy a calorie target.



     ### 6.6 Settings and data management



     \*\*Routes:\*\* \`/app/settings\`, \`/app/settings/profile\`, \`/app/settings/data\`



     The settings area is secondary navigation.



     \*\*Profile settings\*\* covers supported personal settings, display units, and timezone.



     \*\*Data management\*\* covers:



     - Export personal application data in JSON.

     - Explain the export scope and file format.

     - Provide an explicit account-deletion action.

     - Explain deletion consequences and require the documented confirmation/re-authentication step.



     Account deletion must not be triggered by accidentally opening the page or by a single unconfirmed click.



     ---



     ## 7. Major user flows



     ### Flow A — New user registration



     \`\`\`text

     Public Landing

     |

     v

     Sign Up

     |

     v

     Supabase Auth Registration

     |

     +-- Email confirmation required

     |       |

     |       v

     |   Confirmation / Callback

     |       |

     |       v

     |   Authenticated Application

     |

     +-- Confirmation not required

               |

               v

          Authenticated Application

     \`\`\`



     Expected behavior:



     - Invalid input stays on the sign-up page with field-level errors.

     - Authentication errors use safe messages.

     - The post-authentication destination is a safe internal route.

     - The main application is not accessible without a valid session.



     ### Flow B — Returning user sign-in



     \`\`\`text

     Sign In

     |

     +-- Invalid credentials --> Show safe error

     |

     +-- Forgot password --> Recovery flow

     |

     +-- Valid session

               |

               v

     /app/calorie-calculator

     \`\`\`



     A user redirected from a protected page may return to that destination after authentication, provided the destination is safe and authorized.



     ### Flow C — Calculate calories and explore food



     \`\`\`text

     Calorie Calculator

          |

          v

     Enter Profile and Goal

          |

          v

     Validate Inputs

          |

          +-- Under 18 / missing coefficient /

          |   invalid inputs / unsafe result

          |            |

          |            v

          |      No target; explain next step

          |

          +-- Eligible result

                         |

                         v

               Display BMR/TDEE/Target

                         |

                         v

                    Diet Foods

                         |

                         v

               Review Meal Suggestions

                         |

                         v

               Edit Serving Sizes

                         |

                         v

                    Save Meal Plan

     \`\`\`



     The calculator result must not automatically bypass the documented domain safety rules. Navigating to Diet Foods does not itself guarantee that a personalized plan can be generated.



     ### Flow D — Select and apply a workout template



     \`\`\`text

     Workout Plans

          |

          v

     Choose Template

          |

          v

     Review Template Days and Exercises

          |

          v

     Apply Template

          |

          +-- No existing target-plan content

          |          |

          |          v

          |      Confirm/apply

          |

          +-- Existing plan content

                    |

                    v

          Choose Replace or Merge

                    |

                    v

               Confirm

                    |

                    v

          Atomic Server Transaction

                    |

                    +-- Failure --> Preserve old plan

                    |

                    +-- Success --> My Workout Plan

     \`\`\`



     The flow must preserve source-template integrity, avoid cross-day deduplication, retain historical exercise logs, and make repeated merge operations safe.



     ### Flow E — Build and track a personal workout



     \`\`\`text

     Workout Plans / Exercise Library

               |

               v

          Select Exercise

               |

               v

          Configure Plan Entry

               |

               v

          My Workout Plan

               |

               v

          Choose Workout Day/Exercise

               |

               v

               Log Load

               |

               v

          Save Exercise Record

               |

               v

          View Progression

          /            \\

          v              v

     Chart View       Data Table

     \`\`\`



     The user must be able to log either an external load or a bodyweight/no-external-load entry, with appropriate validation and unit handling.



     Changing or deleting a plan does not erase its historical workout records. Progression is opened at \`/app/workout-progress/[exerciseId]\`; the route queries logs by the authenticated user and exercise, not by a plan ID.



     ### Flow F — Daily habit check-in



     \`\`\`text

     Habit Tracker

          |

          v

     Resolve User-Local Date

          |

          v

     Display Habit Status

          |

          v

     Check Off / Undo

          |

          v

     Persist Unique Habit-Date Record

          |

          v

     Recalculate Current and Best Streaks

          |

          v

     Update UI

     \`\`\`



     If the request fails, the interface must report failure without falsely showing a persisted completion. Retrying must not create duplicate rows.



     ### Flow G — Data export



     \`\`\`text

     Account Menu

          |

          v

     Settings > Data

          |

          v

     Request Export

          |

          v

     Validate Session and Owner

          |

          v

     Collect User-Owned Records

          |

          v

     Generate Versioned JSON

          |

          v

     Download Export

     \`\`\`



     The export must contain only the authenticated user's application data.



     ### Flow H — Account deletion



     \`\`\`text

     Account Menu

          |

          v

     Settings > Data

          |

          v

     Review Deletion Consequences

          |

          v

     Explicit Confirmation

          |

          v

     Required Re-authentication

          |

          v

     Server-Side Deletion Workflow

          |

          +-- Failure --> Report/recovery state

          |

          +-- Success --> Invalidate Session

                         |

                         v

                    Public Page

     \`\`\`



     The application must never claim that deletion succeeded until completion has been verified according to the deletion workflow in \`10-security-privacy.md\`.



     ---



     ## 8. Navigation and interaction rules



     ### Back navigation



     - Internal links should use the correct application route.

     - Browser back navigation should preserve expected page context where feasible.

     - Navigating away from an unsaved form should trigger an appropriate unsaved-changes warning when data could be lost.

     - Successful saves should not create confusing duplicate browser-history entries.



     ### Breadcrumbs



     Breadcrumbs are useful on detail routes.



     Examples:



     - \`Workout Plans > Six-Day Template\`

     - \`Workout Progress > Exercise History\`

     - \`Diet Foods > Saved Meal Plan\`



     Breadcrumbs should link only to accessible parent destinations.



     ### Deep links



     A user may open a direct link to a template, personal plan, progression view, or saved meal plan.



     The application must:



     1. Validate route parameters.

     2. Check authentication and ownership where applicable.

     3. Load only authorized data.

     4. Show an appropriate empty, not-found, or access-required state when the resource is absent or inaccessible.



     Deep linking cannot bypass RLS or other server-side authorization.



     ### Confirmation dialogs



     A confirmation is required before:



     - Replacing an existing workout plan.

     - Merging a template into an existing plan.

     - Performing destructive actions where the UX specification requires confirmation.

     - Deleting an account.



     The dialog must explain the effect of the operation and provide a cancel action. It must not imply that the operation succeeded before the server confirms success.



     ### Query-string rules



     Query parameters may represent non-sensitive UI state, such as an exercise filter or a supported post-login return route.



     Do not put passwords, access tokens, body measurements, private nutrition records, or other sensitive user data into query strings.



     All return-route parameters must be validated against safe internal destinations.



     ---



     ## 9. Authentication and authorization boundaries



     The route hierarchy is not the security boundary by itself.



     ### Public resources



     Public resources are restricted to the approved landing page, privacy information, health disclaimer, and authentication flows.



     The public landing page must not display another user's profile, saved calculator values, workout plans, habits, or meal plans.



     ### Protected resources



     Every \`/app\` destination requires a valid authenticated Supabase session.



     Private resources must additionally be scoped to the authenticated owner. The same requirement applies when data is accessed through:



     - Server Components.

     - Server Actions.

     - Route Handlers.

     - Supabase queries and mutations.

     - RPC/database functions.



     RLS is mandatory for user-owned database tables. Any necessary privileged database operation must be explicitly reviewed and must never expose privileged credentials to client code.



     ### Missing or expired session



     When a protected route is requested without a valid session, redirect to \`/auth/sign-in\` and retain a safe return destination if appropriate.



     When a session expires during an operation:



     - Do not present a failed save as successful.

     - Preserve form input where practical.

     - Prompt the user to re-authenticate.

     - Retry a mutation only when its idempotency and current session make the retry safe.



     ### Missing or inaccessible resources



     A missing resource and another user's private resource must not disclose sensitive ownership details. Render a suitable not-found or access-required state without exposing database implementation details.



     ---



     ## 10. Route-to-requirement traceability



     | Route or route group | Main requirements supported |

     |---|---|

     | \`/\`, \`/privacy\`, \`/health-disclaimer\` | FR-6, NFR-2, public product information |

     | \`/auth/\*\` | FR-1, NFR-1 |

     | \`/app/calorie-calculator\` | FR-3, FR-4, FR-5, FR-6, FR-21 |

     | \`/app/workout-plans/\*\` | FR-7, FR-8, FR-9, FR-11 |

     | \`/app/my-workout-plan/\*\` | FR-9, FR-10, FR-11, FR-26 |
      | \`/app/workout-progress/[exerciseId]\` | FR-12, FR-13, FR-26 |

     | \`/app/habit-tracker\` | FR-14, FR-15, FR-16 |

     | \`/app/diet-foods/\*\` | FR-17, FR-18, FR-19, FR-20, FR-6 |

     | \`/app/settings/profile\` | FR-2, FR-3, FR-21, FR-25 |

     | \`/app/settings/data\` | FR-23, FR-24, NFR-2 |

     | All routes and shared shell | FR-22, FR-25, FR-26, NFR-4, NFR-5, NFR-6, NFR-9, NFR-10 |



     Non-functional requirements related to database ownership, performance, backup/restore, architecture, and monitoring also apply across multiple route groups. Their implementation and verification are defined in the architecture, security, test-plan, and DevOps documents.



     ---



     ## 11. Information architecture acceptance criteria



     The implementation is consistent with this document when all of the following are true:



     1. The five primary sidebar destinations appear in the specified order.

     2. Public routes and authenticated routes are clearly separated.

     3. A user without a valid session cannot access protected page data.

     4. Direct navigation to a protected route checks authentication and authorization.

     5. Personal workout plans are distinct from immutable global workout templates.

     6. Progress history remains available at \`/app/workout-progress/[exerciseId]\`, independently of a workout plan and without adding a sixth primary navigation item. Historical logs remain accessible after plan replacement or deletion and are scoped to the authenticated user.

     7. Saved meal plans are accessible beneath Diet Foods.

     8. Account settings, data export, and deletion are reachable without adding additional primary sidebar destinations.

     9. Mobile navigation exposes all five primary destinations and supports keyboard/touch interaction.

     10. The UI handles unauthorized, missing, loading, empty, and error states without exposing private data or raw database errors.

     11. The exercise library exposes the required muscle-group categories.

     12. Source workout labels, source-specific video links, warm-ups, and unspecified sets/reps retain their correct meaning.

     13. The app does not invent Upper/Lower Template B.

     14. All routes and flows remain consistent with the PRD, user stories, and approved implementation plan.



     ---



     ## 12. Assumptions and unresolved inputs



     1. \*\*Upper/Lower Template B:\*\* The referenced \`fitness_website_prompt.md\` has not been provided. The initial route structure supports future templates, but Template B must not be fabricated.

     2. \*\*Application entry:\*\* \`/app\` redirects to \`/app/calorie-calculator\`. A separate dashboard is not included in the initial scope because it was not requested as a sixth navigation destination.

     3. \*\*Multiple personal plans:\*\* The IA supports multiple personal plans and a route for selecting/editing a plan. The detailed active-plan and plan-creation behavior must be finalized in \`04-ui-ux-spec.md\` and implemented consistently with the database specification.

     4. \*\*Public access:\*\* The calculator remains behind authentication in the first release. The landing page and approved informational pages are public.

     5. \*\*Localization:\*\* The initial interface is English-first. All navigation labels and user-facing messages must support future translation.



     These assumptions must be carried forward into the UI/UX, architecture, database, and testing documents rather than independently reinterpreted by the coding agent.



     ## 13. Definition of done



     This document is complete for implementation planning when:



     - The sitemap and route table are accepted.

     - Navigation contains exactly the specified five primary destinations.

     - Each primary user journey has defined start, successful outcome, cancellation/error behavior, and authorization requirements.

     - Detail routes preserve their parent navigation context.

     - Security rules are explicit for direct route access and resource ownership.

     - The implementation does not depend on unprovided template data or fabricated source content.



     \*\*End of Document 3 — Information Architecture.\*\*
