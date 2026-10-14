# 04 — UI/UX Specification
**Product:** Tamil Nadu Fitness Companion

**Document:** `docs/04-ui-ux-spec.md`

**Version:** 0.1

**Status:** Initial UI/UX specification for review

**Depends on:** `docs/01-PRD.md`, `docs/02-user-stories.md`, approved `docs/02-Implementation-Plan.md` v0.4, and `docs/03-information-architecture.md`

**Audience:** Product owner, UX designer, developer, QA, and Antigravity coding agent

---

## 1. Purpose
This document specifies the visual system, page layouts, reusable components, interaction patterns, accessibility requirements, responsive behavior, and UI acceptance criteria for the Tamil Nadu Fitness Companion.

Its goal is to provide enough detail to implement a consistent, accessible, responsive application without requiring the coding agent to invent important UX behavior.

The implementation must follow the approved information architecture. This document does not authorize changes to the database schema, domain rules, security architecture, or primary navigation.

Unless otherwise stated, requirements in this document are normative.

## 2. UX principles
### UX-1 — Clear and predictable
Every page must have a clear title, a primary action where applicable, understandable navigation, and a predictable location for secondary actions.

Users should not need to guess whether an action saves data, changes a workout plan, marks a habit complete, or only updates a temporary preview.

### UX-2 — Prioritize the user's task
Present the controls needed for the current task before secondary information.

For example:

- The calorie calculator prioritizes inputs and results.

- Workout Plans prioritizes template discovery and exercise selection.

- My Workout Plan prioritizes plan structure and workout configuration.

- Habit Tracker prioritizes daily check-ins.

- Diet Foods prioritizes food discovery, nutrition values, serving quantities, and meal-plan totals.

### UX-3 — Keep destructive actions explicit
Replacing a workout plan, deleting data, and deleting an account require clear explanations and appropriate confirmation.

Do not perform destructive actions because a user opens a page or selects an ordinary navigation item.

### UX-4 — Never misrepresent system state
The UI must distinguish:

- Saved data from unsaved edits.

- A successful request from a failed request.

- An empty result from a loading state.

- An unavailable value from a numeric zero.

- Source-provided workout information from researched recommendations.

- Verified nutritional data from approximate data.

### UX-5 — Mobile-first usability
All five primary navigation destinations and their essential actions must work on mobile, tablet, and desktop screens.

Do not hide essential functionality behind hover-only interactions, desktop-only layouts, or controls that require a mouse.

### UX-6 — Accessible by default
Use semantic HTML, proper form labels, visible keyboard focus, sufficient color contrast, and accessible error messages. Charts and visual indicators must have non-visual alternatives.

### UX-7 — Respect privacy
Do not place private profile measurements, nutrition records, authentication tokens, or other sensitive information in URLs, page titles, notifications, or analytics events.

---

## 3. Visual design system
### 3.1 Overall visual direction
Use a modern, professional fitness and wellness dashboard style.

The interface should feel organized, calm, practical, and trustworthy rather than overly decorative or aggressive.

Prefer:

- Clear page hierarchy.

- Readable typography.

- Consistent spacing.

- Simple icons with text labels.

- Subtle borders and restrained shadows.

- Data displays that emphasize readability.

- Compact but comfortable forms.

- Cards used to group genuinely related information.

Avoid:

- Excessive gradients.

- Large decorative animations.

- Oversized headings on data-entry pages.

- Dense, crowded tables without responsive handling.

- Unnecessary card nesting.

- Excessive colored backgrounds.

- Icons without accessible names or text labels.

- Placeholder controls that appear functional but have no working behavior.

The UI should primarily use a light theme for the initial release. Dark mode is optional and must not delay the essential functionality.

### 3.2 Color tokens
Define colors through reusable design tokens or CSS variables. Do not scatter arbitrary color values throughout component files.

The following palette is the initial recommendation:

| Token | Suggested value | Purpose |

|---|---|---|

| `--background` | `#F8FAFC` | Main application background |

| `--surface` | `#FFFFFF` | Cards, forms, dialogs |

| `--foreground` | `#0F172A` | Primary text |

| `--muted-foreground` | `#475569` | Secondary text |

| `--border` | `#CBD5E1` | Input and section borders |

| `--primary` | `#166534` | Primary actions and selected controls |

| `--primary-foreground` | `#FFFFFF` | Text on primary controls |

| `--focus` | `#2563EB` | Keyboard-focus indicator |

| `--success` | `#166534` | Successful status |

| `--warning-foreground` | `#92400E` | Warning text |

| `--danger` | `#B91C1C` | Destructive actions and errors |

These values are starting tokens, not permission to bypass contrast testing.

Requirements:

1. Normal text must meet WCAG 2.2 AA contrast requirements.

2. Interactive boundaries and focus indicators must remain distinguishable.

3. Never use color alone to communicate success, failure, completion, or severity.

4. Avoid using the danger color for ordinary, non-destructive actions.

5. Validate text and icon contrast against their actual backgrounds before implementation approval.

### 3.3 Typography
Use a clean, readable sans-serif font consistent with the existing application setup.

Use the project's configured font if one exists. Do not add unnecessary font dependencies merely to satisfy this specification.

Recommended hierarchy:

| Element | Suggested size | Weight |

|---|---:|---|

| Page title | 28–32 px | Semibold |

| Section heading | 20–24 px | Semibold |

| Card heading | 16–18 px | Semibold |

| Body text | 14–16 px | Regular |

| Secondary text | 13–14 px | Regular |

| Form label | 14 px | Medium |

| Helper/error text | 12–14 px | Regular |

| Large result value | 28–36 px | Semibold |

The hierarchy may be adjusted for narrow screens without making text difficult to read.

Avoid using small text to fit too much information into a page.

### 3.4 Spacing and layout
Use a consistent spacing scale based on the existing Tailwind configuration.

Recommended layout guidance:

- Desktop sidebar: approximately 240–264 px wide when expanded.

- Main content: use available width with a comfortable maximum content width of approximately 1,200 px.

- Standard page padding: approximately 24–32 px on desktop.

- Mobile page padding: approximately 16 px.

- Standard form-field spacing: approximately 16–20 px.

- Standard section spacing: approximately 24–32 px.

- Card padding: approximately 16–24 px depending on content.

Use a smaller spacing scale for dense data tables and larger spacing for major sections.

### 3.5 Surfaces, cards, and borders
Use a consistent border radius for inputs, buttons, cards, and dialogs.

Cards should primarily group related information, such as:

- A workout template.

- An exercise.

- A habit.

- A food item.

- A calorie result.

- A saved meal plan.

Use borders for structure and shadows sparingly.

Do not wrap every individual label or paragraph inside its own card.

### 3.6 Icons
Use Lucide React icons, consistent with the approved implementation plan.

Icons may communicate navigation categories, status, or an action, but must not replace the accessible text label of a primary navigation item or an important action.

Icon-only buttons must have accessible names and suitable tooltips where needed.

### 3.7 Motion
Motion must be subtle and purposeful.

Use transitions primarily for:

- Opening and closing dialogs or drawers.

- Revealing form feedback.

- Expanding or collapsing sections.

- Indicating a loading or completion state when appropriate.

Respect reduced-motion preferences. Never depend on animation to communicate an important change.

---

## 4. Application shell
### 4.1 Desktop shell
All authenticated routes use the shared application shell.

The shell consists of:

1. Primary navigation sidebar.

2. Application header.

3. Main content region.

4. Page-specific content.

5. Account menu.

The five primary destinations must appear in this exact order:

1. Calorie Calculator

2. Workout Plans

3. My Workout Plan

4. Habit Tracker

5. Diet Foods

Account settings, profile management, data export, account deletion, and sign-out remain secondary destinations.

### 4.2 Sidebar
The sidebar must:

- Display the application name or brand mark.

- Display all five primary destinations.

- Clearly identify the current destination.

- Use accessible navigation semantics.

- Retain the correct parent-section context on subordinate pages.

- Support keyboard navigation.

- Keep text labels visible when expanded.

A collapsible desktop sidebar is optional.

If the sidebar is collapsed, icons must have accessible names and must not make route identification dependent on hover alone.

### 4.3 Header
The shared header should contain:

- A mobile navigation trigger where necessary.

- A route-specific page title or title area.

- An account menu.

- Optional page-specific actions where appropriate.

Do not fill the shared header with controls that only belong to one page.

The account menu should provide access to profile settings, data management, and sign-out.

### 4.4 Mobile shell
At narrow widths, replace the persistent desktop sidebar with an accessible navigation drawer or another compact layout that exposes the same five destinations.

The mobile navigation must:

- Open using a clearly identifiable control.

- Support keyboard and touch interaction.

- Close using an appropriate close control.

- Support Escape to close where applicable.

- Move and restore focus appropriately.

- Prevent background interaction while a modal drawer is active, where relevant.

- Preserve form state when the drawer opens or closes.

- Avoid obscuring essential save, submit, or confirmation controls.

### 4.5 Responsive breakpoints
Use the project's existing Tailwind breakpoints consistently.

For layout decisions, use these approximate viewport categories:

- **Mobile:** below 768 px.

- **Tablet:** 768–1023 px.

- **Desktop:** 1024 px and above.

The page must remain usable at intermediate widths, not only at a few predetermined device sizes.

Do not force a desktop table or multi-column form into a narrow viewport when a stacked layout is more usable.

---

## 5. Navigation and page layout
The route structure is defined in `docs/03-information-architecture.md`.

The five primary destinations are the only primary sidebar entries. Detail pages must retain an appropriate parent context without creating a new primary navigation item.

### 5.1 Page header pattern
A standard authenticated page should use the following hierarchy:

1. Page title.

2. Brief description where it improves understanding.

3. Main page action, if applicable.

4. Filters, tabs, or supporting controls.

5. Main content.

6. Secondary information, help text, and disclaimers where relevant.

Do not display every possible action at the same visual priority.

### 5.2 Breadcrumbs
Use breadcrumbs on pages where they meaningfully help users understand context or return to a parent page.

Examples:

- `Workout Plans > Six-Day Template`

- `My Workout Plan > Current Plan`

- `Workout Progress > Exercise History`

- `Diet Foods > Saved Meal Plan`

Breadcrumbs must correspond to valid, accessible routes.

The exercise progression page uses the independent route:

`/app/workout-progress/[exerciseId]`

It must not require the user to retain a particular workout plan ID to access historical logs.

### 5.3 Unsaved changes
When a page contains editable data, the UI should clearly indicate whether changes are saved.

If navigating away could discard meaningful edits, warn the user where technically appropriate.

Requirements:

- Do not interrupt users with warnings when no unsaved changes exist.

- Offer a clear way to remain on the page.

- Provide a safe way to discard edits when applicable.

- Preserve entered form values after validation failures and recoverable request errors.

- Do not claim changes were saved before the server confirms success.

---

## 6. Authentication pages
### 6.1 Sign-up
Route: `/auth/sign-up`

The page must contain:

- Clear heading and concise explanation.

- Required registration fields defined by the authentication implementation.

- Field-level validation.

- A primary submit button.

- A link to sign in.

- Appropriate loading, success, and error states.

- Terms, privacy, or health-information links where relevant.

The actual fields must match the approved authentication configuration; do not assume unsupported sign-up providers or registration fields.

During submission:

- Prevent accidental duplicate submissions.

- Show that the request is in progress.

- Preserve field values when safe to do so.

- Display a useful and non-sensitive message when registration fails.

If email confirmation is required, explain the next step without implying that the user already has an authenticated session.

### 6.2 Sign-in
Route: `/auth/sign-in`

The page must contain:

- Email or the supported account identifier.

- Password.

- Show/hide password control with an accessible name.

- Submit action.

- Link to password recovery.

- Link to registration.

Invalid credentials should produce a safe, understandable error. Do not expose internal authentication implementation details.

After successful authentication, navigate to the approved safe return destination where applicable; otherwise use the default authenticated destination defined in the information architecture.

### 6.3 Password recovery and reset
Routes:

- `/auth/forgot-password`

- `/auth/reset-password`

- `/auth/callback`

The recovery flow must distinguish requesting a reset from setting a new password.

Requirements:

- Explain the next step after requesting recovery.

- Use the configured Supabase recovery mechanism.

- Validate the recovery session before accepting a new password.

- Validate password requirements and confirmation when applicable.

- Provide success and failure states.

- Reject or safely handle expired and invalid recovery links.

- Validate post-authentication redirects to prevent open redirects.

### 6.4 Loading and error behavior
Authentication pages must provide clear feedback for:

- Invalid form values.

- Authentication request failure.

- Expired recovery sessions.

- Network errors.

- Registration confirmation requirements.

- Successful sign-in or recovery.

Never display session tokens, internal exceptions, or secret configuration values to the user.

---

## 7. Calorie Calculator
**Route:** `/app/calorie-calculator`

### 7.1 Page objective
Allow an authenticated adult user to enter the required profile information, calculate estimated energy requirements, understand the result, and proceed to Diet Foods when eligible.

### 7.2 Page hierarchy
Recommended structure:

1. Page title and brief explanation.

2. Health disclaimer and adult-only notice.

3. Calculator form.

4. Calculate action.

5. Validation or eligibility feedback.

6. Results section, shown only after an eligible successful calculation.

7. Link or action to explore suitable foods and meal suggestions.

The form and result layout must work on mobile without horizontal scrolling.

### 7.3 Form fields
The required UI inputs are defined by the PRD and domain-logic document and include:

- Age.

- Formula coefficient selection.

- Height.

- Weight.

- Activity level.

- Units.

- Goal.

Where unit conversions are supported, clearly indicate the selected unit next to the corresponding field.

Use appropriate numeric input types and validation.

Do not use placeholders as the only field labels.

### 7.4 Formula coefficient selection
Explain that the selected coefficient is a mathematical parameter used by the chosen estimation equation.

Do not present it as a declaration of gender identity.

The available choices and numerical values must follow `docs/05-domain-logic.md`.

A user who declines to choose a required coefficient must be able to stop without receiving a calculated target.

### 7.5 Validation and eligibility
Validation must distinguish ordinary input errors from results that are not eligible to be displayed.

Requirements:

- Users younger than 18 must not receive calorie targets.

- Invalid age, height, weight, coefficient, activity, or goal inputs must not produce a normal successful result.

- Unsafe results must follow the rules in `docs/05-domain-logic.md`.

- Do not silently clamp an unsafe result and present it as valid.

- Explain why a result cannot be provided using clear, non-alarming language.

- Preserve valid inputs when the user corrects a field or resubmits the form.

Do not make medical diagnoses or imply that the calculation replaces individualized professional advice.

### 7.6 Results section
After a valid calculation, display the supported results:

- Estimated BMR.

- Estimated TDEE.

- Goal-related adjustment.

- Estimated daily calorie target.

- Relevant assumptions and disclaimer.

Use clear labels and units.

Avoid displaying excessive precision. Apply the rounding and result-formatting rules specified in `docs/05-domain-logic.md`.

Do not show a success card or a valid target when calculation eligibility checks have failed.

### 7.7 Save behavior
If profile saving is supported, provide an explicit save action or another clearly specified saving mechanism.

The UI must distinguish saved profile settings from unsaved changes in the current calculator form.

Do not silently persist every intermediate input if the documented behavior requires explicit saving.

### 7.8 Primary actions
The page's main action is to calculate the estimate.

The next-step action may take users to Diet Foods, but personalized food recommendations must only use eligible, validated calculator data.

---

## 8. Workout Plans
**Routes:**

- `/app/workout-plans`

- `/app/workout-plans/[templateId]`

### 8.1 Page objective
Help users explore the available workout templates and exercise library before adding exercises or applying a template to a personal plan.

### 8.2 Main page layout
Provide two clearly labeled content areas or tabs:

1. **Templates**

2. **Exercise Library**

Changing tabs must not accidentally reset unrelated saved work.

The Templates area should show available templates with enough information to understand their structure and provenance.

The Exercise Library should organize exercises by the required categories:

- Back.

- Biceps.

- Forearm.

- Chest.

- Triceps.

- Shoulder.

- Legs.

- Abs.

- Cardio.

### 8.3 Template list
A template item may display:

- Template name.

- Short description or split summary when available.

- Number of workout days, when known.

- Provenance or source label.

- An action to open template details.

Do not invent template descriptions, source claims, or exact workout content.

The missing Upper/Lower Template B must not be represented as an available, fully defined template.

### 8.4 Exercise library
The library must support:

- Search by exercise name.

- Filter by muscle group.

- Clear active filters.

- View relevant exercise information.

- Display source or researched provenance.

- Add an eligible exercise to a personal plan.

Filters must not require a page reload unless an approved implementation decision explicitly requires it.

Provide an appropriate empty state when a search has no matches.

### 8.5 Exercise information
Exercise details may display:

- Exercise label.

- Muscle-group classification.

- Source information.

- Any approved instruction or description.

- Video link when a URL exists and has been verified.

Do not invent video links or claim that unverified external media is a source-provided link.

Clearly distinguish original source labels from normalized display labels when both need to be retained.

### 8.6 Template detail page
Use this hierarchy:

1. Template title and provenance.

2. Overview of the available split.

3. Workout days in source order.

4. Warm-up information when supplied.

5. Exercises in the correct order.

6. Sets and reps only when sourced or configured.

7. Apply Template action.

Unspecified source sets or reps must remain unset.

Do not fill missing values with plausible-looking numbers merely to make the page appear complete.

### 8.7 Applying a template
When the user selects Apply Template:

- Determine whether the selected target plan already contains content.

- If applying the template affects an existing plan, present the appropriate Replace/Merge choices.

- Explain the meaning and consequences of each choice.

- Provide a cancel action.

- Require confirmation before destructive replacement or merging.

- Display a pending state while the request is processed.

- Show success only after the server confirms the operation.

- Preserve the existing plan if the operation fails.

Follow the atomicity and repeated-merge rules in `docs/02-Implementation-Plan.md` and the database specification.

---

## 9. My Workout Plan
**Routes:**

- `/app/my-workout-plan`

- `/app/my-workout-plan/[planId]`

### 9.1 Page objective
Provide a workspace where users can manage personal workout plans, organize workout days, configure exercises, and enter progression logs.

The user's plan is separate from the global workout templates.

### 9.2 Plan overview
The page should provide:

- The current or selected plan.

- A plan selector where multiple plans are supported.

- Create and rename actions where supported.

- Workout-day list.

- Exercise count or other useful summaries when reliably available.

- Clear actions to open, edit, or configure a plan.

Do not display a plan as active or saved until its state is confirmed.

### 9.3 Plan detail
Display workout days in order, with exercise entries within their respective days.

Each entry should display relevant information such as:

- Exercise label.

- Sets and reps, if known.

- Notes or other supported configuration.

- Source metadata where relevant.

- Available video link.

- Actions to edit, reorder, remove, and log exercise load.

- A link to progression history.

Keep entry-level actions visually organized and usable on touch screens.

### 9.4 Missing sets and reps
When an imported source entry does not specify sets or reps, show a clear unset state instead of guessing.

Allow the user to configure required values through a validated editing interaction.

If a researched default recommendation is eventually approved, label it clearly as a recommendation rather than a source-provided value.

### 9.5 Adding and editing exercises
When adding or editing a workout entry:

- Provide labeled input fields.

- Validate values before saving.

- Preserve entered values after validation failures.

- Show success only after the server confirms persistence.

- Prevent duplicate submissions.

- Warn before discarding meaningful unsaved changes.

Reordering exercises must not unintentionally move an exercise to another workout day.

### 9.6 Removing an entry
Require appropriate confirmation for removal when it may destroy user configuration or create ambiguity about historical records.

Removing an exercise entry from a plan must not automatically delete the exercise's independent historical logs.

### 9.7 Replace and Merge
Replace/Merge behavior must be consistent with the template-application flow in Section 8.7.

Before confirmation, communicate what will change.

After confirmation, show a pending state. On failure, keep the original plan unchanged and explain the failure safely.

---

## 10. Workout Progress
**Route:** `/app/workout-progress/[exerciseId]`

### 10.1 Page objective
Let users inspect and manage historical logs for a selected exercise without requiring the exercise to belong to a currently existing workout plan.

The route is a subordinate authenticated page, not a sixth sidebar destination.

### 10.2 Independence from workout plans
The page must retrieve historical logs for the authenticated user and selected exercise independently of a specific workout plan.

Replacing, editing, or deleting a personal workout plan must not make otherwise retained logs inaccessible.

The page must not require a valid `planId`.

All requests must use server-side authentication and the ownership protections defined in the architecture, database, and security documents.

### 10.3 Page hierarchy
Recommended structure:

1. Breadcrumb: `Workout Progress > Exercise History`.

2. Exercise name and available contextual information.

3. Summary of recorded history, when sufficient data exists.

4. Progress chart.

5. Equivalent data table.

6. Action to add a log.

7. Actions to edit or delete an existing log where permitted.

Avoid inventing statistics when there are no suitable entries.

### 10.4 Logging an exercise
The logging interaction must support the documented log types:

- External load with an appropriate numeric value and unit.

- Bodyweight or no-external-load entry without using zero as a substitute for missing weight.

A log form should include relevant fields, such as:

- Exercise.

- Date.

- External load, when applicable.

- Load unit, when applicable.

- Bodyweight/no-external-load mode.

- Optional notes.

The actual validation rules must follow `docs/05-domain-logic.md` and the database specification.

The UI must distinguish a missing value from a deliberate bodyweight or no-external-load record.

### 10.5 Progress visualization
Display recorded progress chronologically.

When there is enough meaningful data, the chart may show external load by date. The title, axes, labels, and selected units must be clear.

Do not combine incompatible load modes into a misleading numerical series. Where necessary, separate them or represent the log type distinctly.

Provide an accessible table containing the underlying records so users are not required to understand a chart.

Use the same source records for the chart and table.

### 10.6 Empty and error states
When no logs exist, explain that the user has not recorded any history for this exercise and provide an action to add the first log.

If an exercise does not exist or is not accessible to the authenticated user, show an appropriate not-found or access-required state without revealing another user's data.

Do not show a successful save state after a failed request.

---

## 11. Habit Tracker
**Route:** `/app/habit-tracker`

### 11.1 Page objective
Allow users to create and manage habits, record daily completions, and understand their current and best streaks.

### 11.2 Page hierarchy
Recommended order:

1. Page title.

2. Selected user-local date.

3. Daily completion summary.

4. Habit list.

5. Current and best streak information.

6. Add-habit action.

7. Habit management controls.

8. Optional historical check-in view.

Make daily completion controls the easiest actions to find and use.

### 11.3 Habit item
A habit item should display:

- Habit name.

- Current completion state for the selected date.

- Current streak.

- Best streak, when available.

- An accessible completion control.

- Secondary management actions.

Do not display a streak as if it were a persisted field if it is calculated dynamically.

### 11.4 Daily check-in
The completion control must communicate whether the habit is complete for the selected local date.

Requirements:

- Prevent accidental repeated check-ins from creating duplicate records.

- Support undo according to the approved domain rules.

- Show a pending state where appropriate.

- Update the displayed completion only in a manner consistent with confirmed persistence or a clearly reversible optimistic-update pattern.

- Restore the correct state and show an error if persistence fails.

The selected date and streak behavior must follow `docs/05-domain-logic.md`.

### 11.5 Creating and editing habits
Use a labeled form or dialog.

Validate required fields and preserve input on recoverable errors.

Habit creation, editing, archiving, and deletion must follow the documented retention and cascade rules.

Require confirmation for destructive operations where necessary.

### 11.6 Streak presentation
Current and best streaks should be clearly distinguished.

Provide explanatory labels rather than relying only on fire icons, color, or decorative badges.

Streak values must be calculated using the canonical streak algorithm. Do not create a different UI-only interpretation.

### 11.7 Empty state
If the user has no habits, explain the purpose of the page and provide a clear action to create the first habit.

Do not present an empty habit list as an application error.

---

## 12. Diet Foods
**Routes:**

- `/app/diet-foods`

- `/app/diet-foods/plans/[mealPlanId]`

### 12.1 Page objective
Help users explore foods, inspect their nutritional values, adjust serving quantities, review sample meal plans, and save personalized meal plans when eligible data exists.

### 12.2 Main page layout
The page should organize content into understandable sections:

1. Page title and brief explanation.

2. Food search.

3. Dietary and meal filters.

4. Food catalogue.

5. Weight-loss sample day.

6. Weight-gain sample day.

7. Personalized meal suggestions where eligible.

8. Saved meal-plan access.

Use tabs or sections where this reduces clutter without obscuring the catalogue.

### 12.3 Food catalogue
A food card or list item should display applicable fields:

- Food name.

- Reference serving or quantity.

- Calories in kcal.

- Protein.

- Carbohydrates.

- Fat.

- Fibre, when available.

- Dietary category.

- Source attribution or approximation notice, where relevant.

- Action to inspect or select the food.

Use clear units and consistent precision.

Do not invent missing nutrition values. If a field is unavailable, display an appropriate unavailable state rather than zero.

### 12.4 Filters and search
Provide the documented filters for meal type and vegetarian, egg, and non-vegetarian categories.

Requirements:

- Filters must be clearly labeled.

- Active filters must be visible.

- Users must be able to clear filters.

- Search and filtering must produce a useful empty state.

- Filter changes must not silently discard unrelated unsaved meal-plan edits.

Avoid presenting too many filter controls at once on mobile. A compact filter drawer is acceptable if accessible.

### 12.5 Serving controls
For a selected food, allow an appropriate quantity or serving multiplier.

Display the selected quantity and its unit.

Recalculate nutrient totals from the stored food values and entered quantity using the documented domain rules.

Validate the input and prevent unsupported negative, invalid, or non-finite quantities.

Do not imply that a serving quantity is exact when its source data is approximate.

### 12.6 Sample meal plans
Provide the documented weight-loss and weight-gain sample-day experiences.

Each sample plan should show, where available:

- Meals grouped by meal type.

- Foods and serving quantities.

- Per-meal nutrient totals.

- Daily nutrient totals.

- Relevant source and approximation information.

- Appropriate disclaimer.

A sample day is educational content, not an individualized medical prescription.

Do not claim that a sample plan is appropriate for every person.

### 12.7 Personalized suggestions
Generate personalized suggestions only when the calculator data is eligible and the domain-logic rules permit it.

Display the applicable target and relevant assumptions.

If personalized suggestions cannot be generated, explain what is missing or ineligible and allow the user to browse the food catalogue independently.

The UI must never fabricate foods or nutritional values to force a plan to reach a target.

### 12.8 Saved meal-plan detail
The saved meal-plan page should display:

1. Plan name and goal context.

2. Daily target when eligible and available.

3. Meals grouped by meal type.

4. Food entries and quantities.

5. Per-meal totals.

6. Daily totals.

7. Save/update actions.

8. Visible approximation and disclaimer information where relevant.

Only the authenticated owner may view or modify a private saved meal plan.

### 12.9 Calculation and saving states
After a serving quantity changes:

- Display updated values using the documented calculation rules.

- Indicate loading if recalculation requires an asynchronous request.

- Keep the UI responsive.

- Prevent stale results from being presented as the final saved values.

The save action must distinguish unsaved changes from saved data.

A failed save must not be presented as successful. Preserve the user's edits wherever practical.

---

## 13. Settings and data management
**Routes:**

- `/app/settings`

- `/app/settings/profile`

- `/app/settings/data`

Settings remain secondary navigation.

### 13.1 Settings landing page
Provide clear links to:

- Profile and supported preferences.

- Data export.

- Account deletion.

Do not add settings as a sixth primary navigation destination.

### 13.2 Profile settings
Display supported saved settings with labeled controls.

Where applicable, support:

- Profile values used by the calculator.

- Display-unit preference.

- Timezone.

The values available for editing must be consistent with the database and domain specifications.

Provide explicit save feedback. Distinguish saved values from pending edits.

### 13.3 Data export
Explain that the user can export their own application data in the supported JSON format.

The interface must:

- Make the export action discoverable.

- Show a pending state while preparing the export.

- Download the generated file only when the request succeeds.

- Display a safe error if the operation fails.

- Avoid including another user's records.

Do not claim export success before a valid result is returned.

### 13.4 Account deletion
The deletion page must explain the consequences of deleting the account and its associated personal data.

Require the confirmation and re-authentication steps defined by `docs/10-security-privacy.md`.

Requirements:

- Opening the page must not delete anything.

- A single accidental click must not trigger deletion.

- Provide an explicit cancellation path.

- Clearly distinguish an ongoing deletion from a completed deletion.

- On failure, display a suitable recovery state.

- On confirmed success, invalidate the session and redirect to the approved public destination.

The UI must not claim deletion succeeded until the server-side deletion workflow has verified completion.

---

## 14. Reusable component specifications
Use the approved component stack: Tailwind CSS, shadcn/ui, Lucide React, React Hook Form, and Zod.

Reuse existing project components where suitable. Avoid building separate, inconsistent versions of the same control.

### 14.1 Buttons
Supported visual intent should include:

- Primary action.

- Secondary action.

- Outline or neutral action.

- Destructive action.

- Icon-only action where appropriate.

Requirements:

- Every button must have a clear purpose.

- Disabled actions must be visually distinguishable and semantically disabled.

- Pending submissions must prevent accidental duplicate mutations.

- Long text must not cause clipping.

- Button variants must be consistent across pages.

Do not style every control as a primary button.

### 14.2 Text inputs and numeric inputs
Requirements:

- Use persistent labels.

- Provide helper text only where it improves understanding.

- Show field-level errors adjacent to the affected field.

- Associate errors programmatically with inputs.

- Preserve entered values during validation.

- Avoid using placeholder text as a label.

- Use numeric validation appropriate to the field.

- Identify units explicitly.

### 14.3 Selects and segmented controls
Use selects for longer choices, such as activity level.

Use segmented controls when there are a few mutually exclusive options and all labels can remain readable.

Controls must support keyboard and touch interaction and communicate the current selected value.

### 14.4 Dialogs
Dialogs may be used for:

- Replace/Merge confirmation.

- Confirmed destructive actions.

- Short create/edit forms when appropriate.

Requirements:

- Include an accessible title.

- Explain the action and its consequences.

- Provide a clearly identifiable cancel action.

- Use a suitable confirmation action.

- Manage focus correctly.

- Support keyboard dismissal when safe.

- Prevent accidental interaction with the page behind a modal dialog.

Do not use a small dialog for a complex workflow that would be clearer as a dedicated page.

### 14.5 Toasts and inline feedback
Use concise notifications for suitable transient outcomes, such as a completed save.

Use persistent inline feedback for errors that need user action or explanation.

Examples:

- “Workout plan saved.”

- “Unable to save changes. Your edits are still available.”

- “Select a valid date before saving.”

- “No matching foods found.”

Avoid exposing raw database errors or sensitive values in notifications.

### 14.6 Tables
Tables are suitable for structured records, including exercise history and nutrition summaries.

Requirements:

- Use semantic table markup.

- Provide clear column headers.

- Preserve important data on small screens.

- Use horizontal scrolling only when necessary and make it understandable.

- Consider a stacked record layout on very narrow screens.

- Ensure keyboard users can reach all interactive cells and controls.

### 14.7 Charts
Charts are appropriate for meaningful numeric history.

Requirements:

- Use Recharts consistently with the approved stack.

- Provide descriptive chart titles.

- Label the axes and units.

- Avoid misleading combinations of incompatible data.

- Display a useful empty state when there is insufficient data.

- Provide an equivalent table or text-based summary.

- Ensure colors and visual encodings remain understandable to users with color-vision deficiencies.

### 14.8 Loading indicators and skeletons
Use loading states only when content is genuinely being loaded or a request is pending.

Requirements:

- Keep page layout reasonably stable during loading.

- Do not display skeletons indefinitely after errors.

- Avoid flashing large loading indicators for actions that complete immediately.

- Preserve relevant existing content when a background update does not require replacing the whole page.

---

## 15. UI state requirements
Every data-driven page must handle the following states where applicable.

| State | Required behavior |

|---|---|

| Initial loading | Show an appropriate loading indicator or skeleton. |

| Successful populated response | Display the returned content. |

| Empty response | Explain that there is no content and provide a relevant next action where available. |

| Validation failure | Identify affected fields or explain the failed eligibility check. |

| Request pending | Indicate that the action is in progress and prevent duplicate submissions. |

| Recoverable request failure | Show a clear error and preserve user input when practical. |

| Unauthenticated access | Redirect to sign-in using a safe return destination where appropriate. |

| Inaccessible resource | Display a suitable not-found or access-required state without disclosing another user's information. |

| Expired session | Explain that re-authentication is needed and avoid false success feedback. |

| Successful mutation | Reflect confirmed persisted data and provide suitable feedback. |

The visual appearance may vary between pages, but the meaning of each state must remain consistent.

---

## 16. Responsive behavior
### 16.1 Mobile
On mobile:

- Use a compact navigation drawer.

- Stack forms and summary cards vertically when necessary.

- Keep critical page actions reachable.

- Avoid horizontal page overflow.

- Use touch-friendly interactive controls.

- Make dialogs fit within the viewport and scroll when necessary.

- Preserve important table and chart information.

- Keep food quantities and units visible together.

- Use compact but readable workout-day and exercise-entry layouts.

### 16.2 Tablet
On tablet:

- Use a compact sidebar or drawer as appropriate.

- Allow two-column layouts only when the available width supports them.

- Prevent forms from becoming excessively wide.

- Avoid squeezing chart labels and table columns into unreadable spaces.

### 16.3 Desktop
On desktop:

- Use the shared sidebar and application header.

- Use available horizontal space for charts, multi-column forms, and comparison layouts where helpful.

- Align page titles and primary actions consistently.

- Preserve adequate reading width for explanatory content.

### 16.4 Responsive testing
Test at a minimum of:

- 360 px wide.

- 390 px wide.

- 768 px wide.

- 1024 px wide.

- 1440 px wide.

These are representative test widths, not the only supported viewport sizes.

---

## 17. Accessibility requirements
The implementation must target WCAG 2.2 AA.

### 17.1 Keyboard accessibility
All essential actions must be available using a keyboard.

Requirements:

- Logical tab order.

- Visible focus indicators.

- No keyboard traps.

- Functional Escape behavior for appropriate overlays.

- Correct focus placement after dialogs and drawers open or close.

- Focus restoration after modal interactions.

- No reliance on hover alone.

### 17.2 Screen-reader accessibility
Requirements:

- Use semantic headings in a logical hierarchy.

- Provide accessible names for controls.

- Associate form labels, descriptions, and errors.

- Announce important asynchronous outcomes appropriately.

- Use semantic buttons and links.

- Identify the active navigation destination programmatically.

- Expose chart summaries and tabular data.

- Ensure decorative icons do not generate confusing accessible names.

### 17.3 Contrast and non-color indicators
Requirements:

- Meet WCAG 2.2 AA text contrast.

- Maintain discernible interactive boundaries and focus states.

- Include text or icon cues for validation and status, not color alone.

- Ensure chart series can be distinguished by more than color alone where necessary.

### 17.4 Target size and spacing
Prefer interactive targets around 44 by 44 CSS pixels for frequently used touch controls.

Where a smaller target is used, verify that it complies with applicable WCAG 2.2 AA target-size requirements or a documented exception.

Do not place destructive and non-destructive controls so close together that accidental activation is likely.

### 17.5 Forms and errors
When validation fails:

- Keep focus and the user's position predictable.

- Associate each message with the corresponding field.

- Explain how to correct the error where feasible.

- Avoid clearing every field because one field is invalid.

- Make dynamically displayed feedback accessible to assistive technologies.

### 17.6 Reduced motion and zoom
Respect reduced-motion preferences.

The UI should remain usable at increased browser zoom and enlarged text without requiring two-dimensional scrolling for ordinary page content, except for content where two-dimensional layout is essential, such as certain tables.

---

## 18. Content, localization, and health communication
### 18.1 Language support
English is the initial language.

Design labels, buttons, validation messages, and status text so that they can be translated into Tamil later.

Requirements:

- Avoid hardcoding user-facing strings throughout complex component logic.

- Centralize or otherwise organize strings for future localization.

- Allow for differences in text length.

- Avoid clipping translated navigation and button labels.

- Do not assume every Tamil phrase has the same length as its English equivalent.

### 18.2 Health disclaimers
Show appropriate educational disclaimers in the calculator and nutrition-related experiences.

Explain that calorie and nutrition estimates are estimates, not medical advice.

Clearly communicate the adult-only restriction where relevant.

Do not hide important health limitations exclusively in the privacy policy or a footer.

### 18.3 Content provenance
Where a source provides workout names, warm-ups, video URLs, or other exercise information, preserve the source data and its intended meaning.

When researched additions are approved, label them as researched recommendations rather than source-provided material.

For food information, display source attribution and approximation status where applicable.

Do not fabricate unavailable template content, videos, nutrition values, or source citations.

### 18.4 Number and unit formatting
Use consistent formatting for:

- Calories in kcal.

- Body measurements.

- External exercise loads.

- Nutrient quantities.

- Dates and local calendar values.

- Streak counts.

Use the saved display-unit preferences when supported.

Date formatting must not change the underlying user-local calendar date or cause a shift in the stored habit completion date.

---

## 19. UI error handling and privacy
### 19.1 Error messages
User-facing errors should be understandable and actionable.

Prefer:

“Unable to save your workout plan. Your previous plan has not been changed. Please try again.”

Avoid showing raw database exceptions or implementation details.

### 19.2 Data ownership
The UI is not the security boundary.

Every data access and mutation must remain protected by server-side authentication, authorization, and the database access rules specified in the architecture, database, and security documents.

Hiding a button is not sufficient to prevent unauthorized access.

### 19.3 Sensitive data
Do not expose:

- Authentication tokens.

- Service-role credentials.

- Another user's profile information.

- Private workout records.

- Private habit records.

- Private nutrition records.

Do not place such data in query strings, client-visible error logs, or unnecessary analytics events.

### 19.4 False success prevention
The UI must only report a successful persisted mutation after the appropriate operation confirms success.

For optimistic updates, restore the correct state if the server reports a failure.

---

## 20. Testing and validation of UI behavior
The UI test suite must include the following areas.

### 20.1 Visual and responsive checks
Verify:

- The five navigation items appear in the specified order.

- Pages remain usable on mobile, tablet, and desktop.

- No essential controls are clipped or inaccessible.

- Forms and dialogs fit within the viewport.

- Tables and charts retain readable information.

- Loading, empty, and error states have suitable layouts.

### 20.2 Interaction checks
Verify:

- Buttons trigger the documented actions.

- Forms preserve user input on recoverable errors.

- Loading states prevent unintended duplicate submissions.

- Replace/Merge requires the specified confirmation.

- Habit check-ins handle repeat requests safely.

- Exercise logs can be added, edited, and deleted according to permissions.

- Chart values and table records correspond to the same underlying history.

- Food serving changes recalculate totals correctly.

- Successful saves show persisted values.

- Failed saves do not display false success.

### 20.3 Accessibility checks
Verify:

- Keyboard navigation.

- Focus indicators.

- Form-label associations.

- Accessible error messages.

- Dialog and drawer focus management.

- Text and interactive contrast.

- Chart alternatives.

- Screen-reader names for interactive controls.

- Reduced-motion behavior.

Automated accessibility tools are useful, but manual keyboard and screen-reader checks are also required.

### 20.4 Security-related UI checks
Verify:

- Protected pages redirect unauthenticated users appropriately.

- Inaccessible resources do not reveal another user's information.

- Editing controls cannot bypass server-side authorization.

- Expired sessions do not produce false success messages.

- Account deletion requires the approved confirmation and re-authentication flow.

Security testing requirements are defined further in `docs/10-security-privacy.md` and `docs/11-test-plan.md`.

---

## 21. UI acceptance criteria
The UI implementation is consistent with this specification when:

1. The shared application shell is consistent across authenticated pages.

2. The five primary navigation destinations appear in the specified order.

3. Desktop and mobile navigation are usable and accessible.

4. All pages have appropriate loading, empty, error, and success states.

5. Authentication pages provide usable validation and recovery behavior.

6. The calorie calculator distinguishes valid results from ineligible or unsafe calculations.

7. Workout templates preserve source order, labels, provenance, and available verified video links.

8. Missing source sets and reps are not silently invented.

9. Replace/Merge clearly communicates consequences and requires the required confirmation.

10. Personal workout plans remain separate from global templates.

11. Exercise history is accessible using `/app/workout-progress/[exerciseId]` independently of a particular workout plan.

12. Workout history presents suitable visual and tabular alternatives.

13. Habit completion and streak information follow the canonical domain rules.

14. Diet Foods displays clear units, serving quantities, nutrition values, and provenance.

15. Food and meal-plan totals use the documented calculation rules.

16. Settings, data export, and account deletion remain secondary navigation destinations.

17. Forms, buttons, dialogs, tables, and charts satisfy the applicable accessibility requirements.

18. UI strings and layouts support future Tamil localization.

19. The UI does not invent missing workout templates, source videos, or nutritional data.

20. User-owned records remain protected by server-side authorization and database access controls.

---

## 22. Assumptions and decisions carried forward
1. **Primary navigation:** Exactly five destinations, as defined in `docs/03-information-architecture.md`.

2. **Authentication:** The primary application and saved personal data require an authenticated session.

3. **Workout history:** Progress history uses `/app/workout-progress/[exerciseId]` and does not depend on a workout-plan ID.

4. **Exercise content:** Source information must not be fabricated. Unspecified source values remain unset.

5. **Personalized nutrition:** Meal suggestions require eligible calculator data and must follow the approved domain rules.

6. **Initial language:** English, with future Tamil localization supported by the UI structure.

7. **Visual direction:** A restrained, accessible fitness dashboard with reusable design tokens and responsive layouts.

8. **Security:** The client interface never replaces server-side authorization or database ownership rules.

9. **Dark mode:** Optional and not a prerequisite for the initial release.

10. **Implementation scope:** This document specifies UI/UX behavior. It does not authorize unrelated database changes or independent changes to the approved architecture.

These assumptions must be carried forward into the domain-logic, content, architecture, database, API, security, testing, and DevOps documents.

---

## 23. Definition of done
This document is ready for implementation planning when:

- The page hierarchies are clear.

- Reusable component behaviors are specified.

- Important user actions and their feedback states are defined.

- Responsive and accessibility requirements are explicit.

- Page routes agree with the approved information architecture.

- Source-content and nutrition-data integrity requirements remain intact.

- No critical behavior depends on undocumented guesses by the coding agent.

**End of Document 4 — UI/UX Specification.**
