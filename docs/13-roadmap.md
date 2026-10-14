# 13 — Product Development Roadmap

**Project:** Tamil Nadu Fitness Companion  
**Document:** Product Development Roadmap  
**Status:** Ready for Antigravity review  
**Development approach:** Phased implementation with explicit acceptance gates  
**Frontend:** Next.js App Router, React, TypeScript  
**Backend:** Supabase Auth and PostgreSQL  
**Deployment target:** Vercel-compatible Next.js deployment

---

## 1. Purpose

This document defines the implementation sequence for the Tamil Nadu Fitness Companion.

The project must move from approved documentation to a working, tested, and deployable application through manageable phases.

Each phase must have clear deliverables, dependencies, tests, and completion criteria.

The roadmap must prevent:

- Generating the entire application in a single uncontrolled coding pass.
- Building features before their data model and domain rules are clear.
- Implementing UI-only security without database-level authorization.
- Importing fabricated workout prescriptions or unverified food data.
- Losing exercise-progress history when workout plans change.
- Moving forward while critical tests or migrations are failing.
- Repeatedly rewriting already approved documentation instead of implementing the application.

The roadmap follows the product requirements, user stories, information architecture, UI/UX specification, domain logic, content specification, architecture, database design, API contracts, security specification, test plan, and DevOps specification.

## 2. Development principles

### 2.1 Documentation before implementation

Complete and review the planned documentation set before beginning application implementation.

The planned set includes:

1. `docs/01-PRD.md`
2. `docs/02-user-stories.md`
3. `docs/03-information-architecture.md`
4. `docs/04-ui-ux-spec.md`
5. `docs/05-domain-logic.md`
6. `docs/06-content-spec.md`
7. `docs/07-architecture.md`
8. `docs/08-database.md`
9. `docs/09-api-spec.md`
10. `docs/10-security-privacy.md`
11. `docs/11-test-plan.md`
12. `docs/12-devops.md`
13. `docs/13-roadmap.md`
14. `AGENTS.md`

Review the existing repository and approved implementation plan as part of the documentation process.

Do not start writing actual application features until the documentation phase is explicitly closed.

### 2.2 Implement incrementally

Build a small, coherent foundation first.

After each phase, verify the implementation before adding the next major feature.

Do not create placeholder screens that falsely imply a feature is complete.

### 2.3 Security is a foundation requirement

Authentication, ownership enforcement, RLS, secret management, and safe database access must be established before building extensive user-owned data functionality.

Security must not be postponed until the final testing phase.

### 2.4 Test each phase

Each phase must produce verifiable results.

Use unit tests, database tests, API tests, UI tests, and end-to-end tests according to the relevant requirements.

### 2.5 Preserve approved decisions

Use the approved documents as the source of truth.

If implementation reveals a real contradiction, missing requirement, or infeasible assumption, report it and propose the smallest necessary correction.

Do not silently invent new features, change domain formulas, or rewrite approved requirements to suit the generated code.

### 2.6 Work with the existing repository

Before adding or changing files:

- Inspect the existing project structure.
- Inspect `package.json` and the lockfile.
- Inspect existing Supabase configuration and migrations.
- Inspect Git status and existing user changes.
- Reuse working components and configuration where appropriate.

Do not create a competing project structure unnecessarily.

---

## 3. Roadmap overview

The implementation should proceed through the following seven phases.

| Phase | Focus | Main outcome |
|---|---|---|
| 1 | Foundation, authentication, and security | A functioning, protected application foundation |
| 2 | Calorie Calculator | A validated calculator with tested domain logic |
| 3 | Workout content and personal plans | Curated templates and editable user-owned plans |
| 4 | Workout progress | Persistent exercise history and progress views |
| 5 | Habit Tracker | Habit management, completion history, and streaks |
| 6 | Diet Foods and meal planning | Sourced food catalogue and validated nutrition calculations |
| 7 | Hardening, deployment, and release readiness | An integrated, tested, deployment-ready application |

These phases define the implementation order, not a guaranteed calendar schedule. Do not invent completion dates or time estimates without an agreed project schedule.

A phase may contain multiple smaller implementation tasks. Each task must be completed and verified before dependent work proceeds.

---

## 4. Phase 0 — Close the documentation phase

### Objective

Finish and review the documentation required to implement the project reliably.

### Required work

- Complete the 14 planned documentation files.
- Resolve concrete contradictions between the files.
- Compare technical specifications with the existing repository.
- Review the actual `Finalized Workout.pdf` before importing workout content.
- Identify unresolved product decisions.
- Confirm that the database, API, security, testing, and deployment documents describe compatible behavior.
- Confirm that `AGENTS.md` tells Antigravity how to work with the approved documentation and implementation workflow.

### Required outputs

- The approved documentation set.
- A record of unresolved decisions.
- A repository-aware implementation plan.
- An explicit transition from documentation to application implementation.

### Acceptance criteria

- All planned documents have been reviewed.
- Blocking contradictions are resolved or explicitly approved for deferral.
- The source workout has not been replaced by guessed content.
- Required implementation prerequisites are identified.
- No major product rule is silently invented to fill a documentation gap.

**Gate:** Do not begin Phase 1 until the documentation phase has been explicitly closed.

---

## 5. Phase 1 — Foundation, authentication, and security

### Objective

Create the technical foundation on which every subsequent feature can safely depend.

### 5.1 Repository and framework setup

- Inspect and preserve the existing Next.js project.
- Establish the approved directory conventions.
- Verify TypeScript configuration.
- Configure Tailwind CSS and shadcn/ui according to the existing project.
- Create or organize shared layout and UI components.
- Configure the verified package scripts for development, testing, and building.
- Establish clean error-handling and environment-validation conventions.

Do not add duplicate dependencies or recreate existing infrastructure without a clear reason.

### 5.2 Supabase integration

- Configure the browser Supabase client where required.
- Configure the authenticated server-side Supabase client.
- Establish the approved session-handling approach.
- Configure environment variables for the intended development environment.
- Keep privileged credentials server-only.
- Confirm that missing configuration fails safely.

### 5.3 Authentication

Implement the authentication flows defined by the approved product requirements.

Ensure that:

- Registration and sign-in work through Supabase Auth.
- Sign-out behaves correctly.
- Session state is handled consistently.
- Private routes follow the approved access and redirect behavior.
- Profile creation or provisioning follows the approved database workflow.

Do not invent optional social login, multi-factor authentication, or unrelated account features outside the approved scope.

### 5.4 Database foundation

- Establish the initial version-controlled database migrations.
- Implement the approved profile and identity relationships.
- Configure and verify RLS for existing tables.
- Establish the user-ownership conventions used by later features.
- Add basic migration validation.
- Prepare safe seed and testing workflows.

Implement the required database objects incrementally rather than generating the whole schema without validating it.

### 5.5 Security baseline

- Review `.gitignore` and `.env.example`.
- Verify that actual secret-bearing files are excluded from Git.
- Establish trusted server-side mutation conventions.
- Implement safe errors and runtime input validation conventions.
- Confirm that browser requests cannot access another user's private data.
- Confirm that ordinary users cannot modify shared curated content.
- Establish the initial security regression tests.

### 5.6 Layout and navigation

Implement the shared application shell and the five primary navigation destinations:

1. Calorie Calculator.
2. Workout Plans.
3. My Workout Plan.
4. Habit Tracker.
5. Diet Foods.

Include the approved route for independent workout progress, even though the detailed progress functionality arrives in Phase 4.

Do not introduce additional primary navigation destinations unless approved.

### Required tests

- Development server starts.
- Type checking passes.
- Linting passes.
- Production build succeeds.
- Authentication integration tests pass.
- Private route access is correctly restricted.
- Initial RLS tests pass.
- Public and server-only configuration remain separated.

### Phase 1 acceptance criteria

The project has a functioning technical foundation, a working authentication path, protected private routes, a verified initial database/security setup, and repeatable development commands.

**Gate:** Do not build extensive feature functionality on top of an unverified authentication or ownership foundation.

---

## 6. Phase 2 — Calorie Calculator

### Objective

Deliver the first complete domain feature using centralized, tested calculation logic.

### Required work

- Build the calculator form and validation.
- Implement approved input units and normalization.
- Implement the approved Mifflin–St Jeor calculation.
- Implement the approved activity multipliers and goal adjustments.
- Apply the approved rounding order.
- Implement the under-18 restriction.
- Implement the target-withholding behavior defined by the domain specification.
- Display the resulting estimates and disclaimer.
- Handle invalid inputs, loading, and error states.
- Ensure calculator requests do not create unapproved persistent history.

### Domain requirements

Use `docs/05-domain-logic.md` as the authority for the formula and supported ranges.

Do not duplicate the calculation implementation in several components or endpoints.

The calculator must not silently clamp a calculated result to a different target.

### Required tests

- Reference calculation test.
- Unit-normalization tests.
- Minimum and maximum input tests.
- Unsupported-unit tests.
- All approved activity-level and goal combinations.
- Under-18 blocking behavior.
- Invalid-input and withheld-target behavior.
- UI validation and result-display tests.
- Verification that unapproved persistence does not occur.

### Phase 2 acceptance criteria

A user can enter valid values, receive a result consistent with the approved formula, and understand the estimate's limitations. Invalid or restricted inputs are handled correctly.

### Release dependency

The documented `1200 kcal/day` guardrail requires product-owner acceptance before production release. Its behavior must not be silently changed during implementation.

**Gate:** The calculation logic and safety-related behavior must pass their tests before the feature is considered complete.

---

## 7. Phase 3 — Workout content and personal workout plans

### Objective

Make the verified workout programme available and allow users to manage their own plans independently of shared content.

### 7.1 Source-content import

- Inspect the actual `Finalized Workout.pdf`.
- Create an approved, repeatable content-seeding process.
- Import the source workout structure.
- Preserve day names, order, exercise names, and grouping.
- Preserve available source prescriptions.
- Preserve source labels and video URLs.
- Store missing source prescriptions as unset.
- Mark ambiguous content for review.

Do not substitute another programme or invent missing sets, repetitions, URLs, or warm-up instructions.

Do not fabricate an Upper/Lower Template B.

### 7.2 Workout-template library

Implement:

- Template listing.
- Template details.
- Ordered workout days.
- Ordered exercise entries.
- Available warm-up content.
- Source attribution.
- Safe external links.
- Appropriate empty, loading, and error states.

Only approved, published content should be available through user-facing queries.

### 7.3 Personal workout plans

Implement:

- Creating a personal plan.
- Viewing a plan.
- Editing approved plan-level fields.
- Adding and ordering days.
- Adding exercises.
- Editing prescriptions.
- Reordering exercises.
- Removing exercise entries.
- Deleting plans according to the approved lifecycle.

Keep the user's editable plan data distinct from the source template.

### 7.4 Replace and Merge

Implement the documented Replace and Merge operations through the approved transactional database path.

Verify that:

- Replace applies the selected content to the intended plan.
- Merge preserves existing content and adds the selected content.
- Retries do not create unintended duplicates.
- Legitimate exercise repetition across different days is allowed.
- A failed transaction does not leave a partially modified plan.
- Source data is not accidentally edited through the user's plan.

### Required tests

- Content fidelity against the original PDF.
- Template publication and retrieval.
- Personal-plan ownership and CRUD behavior.
- Nullable sets and repetitions.
- Valid ordering constraints.
- Replace and Merge behavior.
- Transaction rollback.
- Retry behavior.
- Direct RLS testing.
- Preservation of independent workout history.

### Phase 3 acceptance criteria

A user can browse verified templates and create or edit a personal workout plan without changing shared content. Template application behaves correctly and safely.

**Gate:** All critical plan-integrity and ownership tests must pass before proceeding.

---

## 8. Phase 4 — Workout Progress

### Objective

Implement exercise-based performance tracking that survives changes to personal workout plans.

### Required work

- Create progress-log forms.
- Validate logged dates and measurements.
- Validate external-load units and bodyweight classification.
- Persist progress against the authenticated user and exercise identity.
- Retrieve history independently of the current plan.
- Build approved history and progress views.
- Display charts only when the underlying data supports them.
- Provide useful empty and error states.

### Historical-data rules

Progress records must not depend exclusively on a personal plan-entry ID.

Removing an exercise from a plan must not delete its history.

Replacing or deleting a workout plan must not make valid historical progress inaccessible.

### Required tests

- Creating and updating a progress record.
- Date validation.
- Load and unit validation.
- Bodyweight consistency.
- User ownership and RLS.
- Empty-history behavior.
- Chart handling for missing measurements.
- History surviving entry removal.
- History surviving plan replacement and deletion.

### Phase 4 acceptance criteria

Users can record and review their own exercise progress, and historical records remain available independently of their current plan structure.

**Gate:** Progress-history preservation is a critical acceptance criterion.

---

## 9. Phase 5 — Habit Tracker

### Objective

Deliver habit management with accurate completion history and streak calculations.

### Required work

- Create and list habits.
- Edit habit details.
- Support the approved archive behavior.
- Mark dates complete.
- Unmark completion dates.
- Display completion history.
- Calculate current and longest streaks using the approved domain logic.
- Use the configured IANA timezone consistently.
- Apply database uniqueness constraints to prevent duplicate completions.

Use `Asia/Kolkata` as the default timezone when no custom timezone is configured.

### Domain requirements

The completion history in PostgreSQL is the source of truth.

Do not create competing streak algorithms in the frontend and backend.

Use date-only semantics for completion dates.

Prevent repeated requests from producing duplicate completion records.

### Required tests

- Habit creation, editing, and archiving.
- Completing and unmarking a date.
- Duplicate completion attempts.
- Current-streak cases.
- Longest-streak cases.
- Missing days and interrupted streaks.
- Date transitions near midnight.
- Custom timezone behavior where supported.
- Cross-user isolation.
- History preservation under the approved lifecycle.

### Phase 5 acceptance criteria

Users can track habits over time, and displayed completion dates and streaks are consistent with stored history and the approved algorithm.

### Release dependency

Individual habit-deletion retention is unresolved. Implement archiving and preserve history until the deletion behavior has been explicitly approved.

**Gate:** Date correctness, streak tests, and ownership checks must pass.

---

## 10. Phase 6 — Diet Foods and Meal Planning

### Objective

Deliver a sourced food catalogue and meal-plan calculations that handle quantities, missing nutrient data, and source uncertainty correctly.

### 10.1 Food catalogue

- Prepare approved food records.
- Prefer IFCT 2017 where an appropriate entry is available.
- Use USDA FoodData Central as the documented fallback.
- Preserve food identity and preparation state.
- Store reference quantities, units, and supported nutrients.
- Preserve source identifiers or references.
- Identify approximate matches and incomplete records.
- Implement approved food search and filtering.

Do not create unsupported numerical nutrient values to fill catalogue gaps.

### 10.2 Meal-plan management

Implement:

- Creating personal meal plans.
- Listing and retrieving plans.
- Adding food items.
- Editing portions.
- Managing meal groups.
- Reordering items.
- Removing items.
- Deleting plans according to the approved lifecycle.

Every mutation must verify ownership.

### 10.3 Nutrition calculations

Implement the approved scaling calculation using compatible units and reference quantities.

Preserve distinctions between:

- Complete totals.
- Approximate totals.
- Incomplete totals.

Do not silently treat missing nutrient values as zero.

Do not assume that every household measure can be converted precisely into grams.

### 10.4 Calorie-target comparison

Display the calculated difference between the meal-plan estimate and the selected target when the required data is available.

Do not claim that a plan satisfies an exact calorie-matching tolerance until the product owner has approved that tolerance.

### Required tests

- Source-data verification.
- Food search and filtering.
- Correct nutrient scaling.
- Compatible and incompatible units.
- Missing nutrient behavior.
- Valid zero-value behavior.
- Approximate-match indicators.
- Meal-plan CRUD.
- Portion validation.
- Correct complete/approximate/incomplete totals.
- User isolation and RLS.
- Repeatable content seeding.

### Phase 6 acceptance criteria

Users can find foods, understand the provenance and limitations of nutrient data, and build personal meal plans with accurate calculations for supported quantities.

**Gate:** Do not publish unverified food values as verified facts or present incomplete totals as exact.

---

## 11. Phase 7 — Integration, hardening, and release readiness

### Objective

Verify the complete application, resolve integration defects, and establish that the intended release can be deployed and operated safely.

### 11.1 Cross-feature integration

Verify that the five main navigation destinations and the independent workout-progress route behave consistently within the authenticated application.

Check shared:

- Navigation and layouts.
- Form validation.
- Loading and empty states.
- Dialogs and confirmation behavior.
- Error messages.
- Responsive design.
- Unit preferences.
- Session and data-access conventions.

### 11.2 Security hardening

Review:

- Supabase RLS policies.
- Parent-child ownership constraints.
- Authentication and session behavior.
- Service-role usage.
- Environment configuration.
- Request validation.
- Safe external links.
- Safe redirects.
- CSRF protections where applicable.
- Caching of private responses.
- Account export and deletion.
- Dependency and secret-exposure checks.

Do not describe the application as security-tested until the relevant checks have executed successfully.

### 11.3 Accessibility

Verify the approved WCAG 2.2 Level AA target using automated checks and manual review.

Test the main journeys with keyboard navigation and representative assistive-technology checks.

### 11.4 Performance and reliability

Review actual behavior for common database queries and main page journeys.

Fix demonstrated bottlenecks, redundant requests, and broken error recovery.

Do not introduce new infrastructure merely to optimize a hypothetical problem.

### 11.5 Production configuration

- Validate environment variables.
- Validate Supabase authentication redirects.
- Run reviewed migrations.
- Verify production content.
- Confirm test and production data are separated.
- Run required quality checks.
- Perform safe post-deployment verification.
- Document the applicable rollback and recovery procedures.

### 11.6 Account lifecycle

Test export and account deletion using appropriate isolated test accounts.

Verify that the application does not report successful deletion when required operations fail.

### Required tests

Run the release checks specified in `docs/11-test-plan.md`, including applicable:

- Type checking.
- Linting.
- Unit tests.
- Integration and API tests.
- RLS tests.
- Critical end-to-end tests.
- Accessibility checks.
- Production build.
- Migration and seed validation.
- Dependency and secret-exposure checks.

### Phase 7 acceptance criteria

The application passes agreed release gates, the critical workflows work end to end, private data remains protected, database migrations and seeds are controlled, and operational limitations are documented.

---

## 12. Cross-phase technical requirements

The following requirements apply throughout all implementation phases.

### 12.1 Type safety

Maintain appropriate TypeScript types and runtime validation.

Do not use broad `any` types to bypass unresolved errors.

### 12.2 Domain logic

Keep domain rules centralized in testable modules.

Do not duplicate business formulas across UI components and server endpoints.

### 12.3 Persistence

Use PostgreSQL as the source of truth for saved user-owned records.

Do not implement critical persistent features as browser-only state.

### 12.4 Security

Enforce authorization in server operations and at the database boundary.

Do not weaken RLS because a page or endpoint encounters an access error.

### 12.5 User experience

Every major feature must handle loading, empty, success, validation, and error states.

Do not leave controls that imply functionality exists when the corresponding operation has not been implemented.

### 12.6 Accessibility

Use semantic HTML and accessible shared components from the beginning.

Avoid postponing basic keyboard accessibility until the hardening phase.

### 12.7 Source integrity

Do not fabricate workout prescriptions, source URLs, food values, or citations.

Mark uncertain or incomplete content explicitly.

### 12.8 Documentation

Update relevant technical documentation when an approved implementation decision changes an API, data model, or security boundary.

Do not repeatedly rewrite approved documents when no substantive change is necessary.

---

## 13. Progress tracking

Track work at the phase and task level.

Every implementation task should have:

- A stable task identifier.
- A concise description.
- Its relevant requirement or story reference.
- Dependencies.
- Files or modules affected.
- Expected implementation result.
- Tests required.
- Actual completion status.
- Outstanding defects or decisions.

### 13.1 Status values

Use a small, consistent set of statuses:

- `Not Started`
- `In Progress`
- `Blocked`
- `Ready for Review`
- `Verified Complete`

A task must not be marked `Verified Complete` solely because code was generated.

### 13.2 Completion evidence

Appropriate evidence includes:

- A successful test report.
- A verified migration.
- A passing ownership/RLS test.
- A confirmed database outcome.
- A working end-to-end workflow.
- A checked accessibility result.
- A successful production build.

### 13.3 Blocked tasks

When a task is blocked, document the concrete reason.

Examples include:

- A missing source value.
- An unresolved product decision.
- A migration conflict.
- A security defect.
- A failed dependency.
- An inaccessible verification environment.

Do not bypass a blocker by inventing data or silently weakening requirements.

---

## 14. Phase-gate policy

A phase can move forward when:

1. Its required functionality is implemented.
2. Its defined tests have passed, or any permitted exception is explicitly approved.
3. Relevant security and data-integrity requirements are verified.
4. No unresolved critical defect remains.
5. Documentation reflects any approved implementation decisions.
6. The resulting code builds successfully at the appropriate checkpoint.

A blocked task must remain visible.

A test that has not executed must not be marked as passing.

A phase can have lower-priority work remaining only when the scope and deferral are documented and the remaining work does not violate a release-critical requirement.

Do not move a known critical defect into the next phase merely to maintain apparent progress.

---

## 15. Risk and dependency management

Track risks that could delay implementation or invalidate the results.

| Risk | Required response |
|---|---|
| Unclear source workout content | Verify against the supplied PDF and escalate ambiguity |
| Missing exercise prescriptions | Preserve missing values and avoid fabrication |
| Invalid or incomplete nutrition data | Preserve provenance and data-quality states |
| Weak RLS or cross-user access | Stop feature progression until resolved |
| Partial Replace/Merge operation | Enforce transaction boundaries and rollback tests |
| Lost exercise history | Correct the data model and test persistence |
| Timezone-dependent habit defects | Standardize date semantics and add boundary tests |
| Incomplete account-deletion behavior | Resolve lifecycle and recovery strategy before release |
| Unapproved calorie guardrail | Obtain the required product-owner decision |
| Unapproved meal matching tolerance | Avoid exact-match claims until accepted |
| Environment misconfiguration | Validate the actual target before migration or deployment |
| Repeated documentation rewrites | Use the approved documents as the baseline and make only justified changes |

### 15.1 Dependency policy

Features may be developed in parallel only when their interfaces, schemas, and domain rules are sufficiently stable.

Do not build dependent features against invented API responses or speculative database tables.

The lead implementation workflow should resolve conflicting changes rather than allowing several tasks to independently redefine the same contract.

---

## 16. Scope control

The initial release should focus on the approved five primary destinations and the necessary exercise-progress route.

Do not add unrelated functionality merely because it appears useful.

Examples of scope expansion requiring explicit approval include:

- Social features.
- Coaching marketplaces.
- Payment processing.
- Public user profiles.
- Native mobile applications.
- Medical diagnosis or treatment recommendations.
- External fitness-device integrations.
- AI-generated workout prescriptions.
- Automated personalized medical diets.
- Unapproved analytics or advertising integrations.

Future features may be documented and prioritized later, but they must not distract from the approved initial application.

---

## 17. Definition of done

The roadmap is ready for implementation when:

1. The documentation phase is complete and explicitly closed.
2. Phase 1 establishes a functioning and protected foundation.
3. Each feature has defined implementation and test gates.
4. Domain calculations are centrally implemented and independently tested.
5. Workout templates and personal plans preserve source fidelity and user data.
6. Exercise-progress history remains independent of current plan entries.
7. Habit dates and streaks follow the approved logic.
8. Nutrition calculations preserve units, provenance, and missing-value semantics.
9. Security testing covers database and API boundaries.
10. Deployment and recovery processes are tested against the actual environment.
11. Unresolved decisions remain visible and are not silently guessed.
12. Each phase has a clear acceptance gate before dependent work proceeds.
13. Completion status is supported by actual verification evidence.
14. The roadmap aligns with Documents 01–12 and the existing implementation plan.

---

## 18. Instructions for Antigravity review

Review `docs/13-roadmap.md` against Documents 01–12, the current repository, and the approved implementation plan.

Report:

- Missing dependencies between phases.
- Duplicate or conflicting feature responsibilities.
- Required security work that has been deferred too late.
- Test gates that are incomplete.
- Features inconsistent with the PRD or user stories.
- Technical steps that conflict with the current repository.
- Unresolved product decisions that block a particular phase.

Do not invent calendar deadlines or declare unverified tests complete.

Do not start application implementation during this documentation-review step.

**Implementation rule:** Follow the phases in order, verify each phase, preserve approved behavior, and resolve blockers explicitly. The objective is a working, secure application—not the largest possible amount of generated code.

filename:docs/13-roadmap.md
