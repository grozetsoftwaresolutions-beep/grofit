# 11 — Software Test Plan

**Project:** Tamil Nadu Fitness Companion  
**Document:** Software Test Plan  
**Status:** Ready for Antigravity review  
**Testing approach:** Risk-based testing with unit, component, integration, security, and end-to-end tests  
**Application:** Next.js App Router, TypeScript, Supabase, PostgreSQL  
**Primary test language:** TypeScript  
**Initial UI language:** English

---

## 1. Purpose

This document defines the test strategy, test scope, test environments, test data, acceptance criteria, and release gates for the Tamil Nadu Fitness Companion.

The objective is to verify that the application is correct, secure, accessible, reliable, and consistent with the approved documentation.

Testing must establish that:

1. The calorie calculator follows the approved mathematical and safety rules.
2. Workout source content is accurate and missing prescriptions are not invented.
3. Personal workout plans behave correctly when created, edited, replaced, merged, or deleted.
4. Exercise-progress history survives changes to the current workout plan.
5. Habit completions, dates, and streaks follow the approved domain rules.
6. Food and meal-plan calculations preserve correct units, source information, and missing-value semantics.
7. Supabase RLS prevents unauthorized access to personal data.
8. API operations validate input, authorize requests, and preserve database integrity.
9. Export and account deletion follow the approved security and privacy requirements.
10. The UI handles loading, empty, success, error, and responsive states appropriately.

A page that renders correctly is not sufficient evidence that the feature works. Tests must also verify calculations, persistence, authorization, and the resulting data.

## 2. Testing principles

### 2.1 Risk-based priorities

Prioritize failures that could cause serious problems:

- Exposure of one user's data to another user.
- Incorrect calorie calculations or inappropriate target handling.
- Fabricated exercise prescriptions or misleading nutrition totals.
- Destruction of workout history.
- Incorrect habit streaks caused by date or timezone errors.
- Partial or duplicated workout-plan mutations.
- Unauthorized account deletion or data export.

Visual polish is important, but it must not take priority over data integrity and security.

### 2.2 Test the actual behavior

Test the implementation rather than merely confirming that:

- A button exists.
- A page loads.
- A form accepts an input.
- A success message appears.
- An RLS policy is present in a migration.

Verify the resulting calculation, database state, authorization decision, or user-visible output.

### 2.3 Independent verification

Where appropriate, expected results should be calculated independently from the implementation under test.

For example, do not generate a calorie-calculator expected result by calling the same function used to calculate the application's actual result. That could cause the same defect to appear in both values.

### 2.4 Repeatable tests

Tests must be repeatable and must not depend on unrelated personal data, uncontrolled external websites, real users, or production database contents.

Use controlled fixtures and approved test environments.

### 2.5 Documented uncertainty

When a product rule remains unresolved, identify it as a blocked decision or conditional test requirement.

Do not silently invent a product rule merely to make a test pass.

### 2.6 No destructive production testing

Do not execute database resets, destructive test fixtures, simulated account deletions, or experimental RLS changes against production user data.

---

## 3. Scope

### 3.1 In scope

The following areas require testing.

| Area | Main verification goals |
|---|---|
| Authentication | Sign-in state, protected access, session handling |
| Calorie Calculator | Input validation, formulas, rounding, safety behavior |
| Workout Plans | Template content, personal plans, Replace, Merge |
| Workout Progress | Logging, history, units, historical integrity |
| Habit Tracker | Completion, date handling, current and longest streak |
| Diet Foods | Search, source attribution, data-quality indicators |
| Meal Plans | Portion validation, unit compatibility, nutrient totals |
| Profile and settings | Preferences, timezone, display units |
| Data export | Correct owner, correct contents, safe downloads |
| Account deletion | Authorization, deletion lifecycle, failure behavior |
| Database | Constraints, relationships, RLS, transactions, seed repeatability |
| UI/UX | Accessibility, responsive layouts, loading and error states |
| Deployment | Build checks, configuration, migrations, regression verification |

### 3.2 Out of scope unless separately approved

Do not assume the initial release requires:

- Large-scale distributed load testing.
- Native Android or iOS application testing.
- Offline-first synchronization.
- Microservice integration testing.
- Medical-device certification.
- Clinical validation of calorie estimates.
- Validation of every possible medical diet.
- A complete penetration test conducted by an external security company.

If a new requirement introduces one of these needs, record it and establish the corresponding test scope separately.

---

## 4. Test levels

Use a layered testing strategy.

### 4.1 Unit tests

Unit tests verify deterministic business rules and calculations independently of the database and browser.

Primary targets include:

- Calorie calculation functions.
- Input normalization and numerical validation.
- Exercise prescription validation.
- Habit-streak calculations.
- Food-portion scaling.
- Nutrient total calculations.
- Unit conversion functions.
- Date and timezone handling.

Unit tests should be fast and should not require a live Supabase project.

### 4.2 Component tests

Component tests verify individual UI components and their behavior.

Examples include:

- Calculator fields and validation messages.
- Workout prescription editors.
- Replace/Merge confirmation dialogs.
- Progress-log forms.
- Habit completion controls.
- Food-search results.
- Meal-portion inputs.
- Dialogs, navigation, and error messages.

Verify that users can understand the current state, submit valid inputs, recover from errors, and receive accurate feedback.

### 4.3 Integration tests

Integration tests verify that application modules work correctly with the persistence layer and other relevant services.

Examples include:

- Creating a personal workout plan in PostgreSQL.
- Applying a workout template transactionally.
- Preventing duplicate habit-completion rows.
- Saving progress logs with valid units.
- Enforcing owner-consistent parent-child relationships.
- Preserving historical logs after plan modifications.
- Applying RLS to authenticated database requests.
- Running content seeds more than once without unwanted duplication.

### 4.4 API tests

API tests verify:

- HTTP methods and status codes.
- Request and response contracts.
- Runtime validation.
- Authentication requirements.
- Ownership checks.
- Safe error responses.
- Transactional mutation behavior.
- Retry and conflict handling.

Where a route's visibility policy deliberately hides private-resource existence, test the actual approved response behavior.

### 4.5 End-to-end tests

End-to-end tests simulate important real-user workflows through the interface.

They must verify persisted outcomes rather than only visible feedback.

Use dedicated test accounts and a controlled test database.

### 4.6 Database security tests

Database security tests directly examine the effective authorization boundary.

They must confirm that different authenticated users cannot access each other's private records, including through manipulated UUIDs or invalid parent-child references.

Testing the UI alone does not replace these tests.

---

## 5. Test environment and tooling

### 5.1 Environment requirements

Maintain an isolated test environment with:

- A supported Node.js version compatible with the repository.
- The repository's existing package manager and lockfile.
- The project's actual Next.js and TypeScript dependencies.
- A controlled Supabase/PostgreSQL test environment or supported local equivalent.
- Approved environment variables containing test credentials only.
- Seed fixtures for repeatable application tests.
- Dedicated test users.
- A clean way to reset disposable test data.

Do not add a second package manager or duplicate testing framework without a documented reason.

### 5.2 Test tools

Use the existing toolchain where possible.

The intended responsibilities are:

| Test need | Tool category |
|---|---|
| Business logic | Unit-test runner supported by the repository |
| UI interactions | React/component testing tools where appropriate |
| Browser workflows | Playwright or an equivalent approved browser-testing tool |
| Input validation | Tests against actual Zod schemas and server behavior |
| Database integration | Isolated Supabase/PostgreSQL test environment |
| Accessibility | Automated accessibility checks plus manual keyboard and screen-reader review |
| Static quality | TypeScript checks, ESLint, and the production build |
| Dependency review | Appropriate dependency vulnerability checks |

These are tool categories, not an instruction to install every possible library. Confirm the existing dependencies before choosing additional tools.

### 5.3 Environment separation

Tests must not accidentally connect to production.

Use separate development, test, and production configuration where available.

Destructive database operations must fail safely when the target is not an explicitly authorized test environment.

### 5.4 Test commands

Antigravity must inspect the existing `package.json` before documenting or invoking commands.

Implement appropriate scripts for:

- Unit and component tests.
- Integration tests.
- End-to-end tests.
- Type checking.
- Linting.
- Production build.
- Any other checks adopted by the project.

Do not claim a command exists until it has been added and verified.

---

## 6. Test data and fixtures

### 6.1 General requirements

Test fixtures must be deterministic, understandable, and independent of production user data.

Use stable fixture identities where useful for repeatable tests.

Reset or isolate state between tests so a previous execution cannot silently change the next result.

### 6.2 Authentication fixtures

Provide at least two independent authenticated users for authorization tests.

For example:

- Test User A.
- Test User B.

Each user should have different plans, exercise logs, habits, and meal plans so cross-user isolation can be proven.

Also test unauthenticated access.

These are test identities only, not real user accounts.

### 6.3 Workout fixtures

Use:

- A verified source-template fixture.
- A template with repeated exercise use across multiple days.
- A template containing an exercise with no source sets or repetitions.
- A template containing the available source labels and video links.
- A personal plan with existing user-created entries.
- A personal plan with progress history that must survive replacement.

The source-content verification suite must compare actual imported content with `Finalized Workout.pdf`.

Do not invent source exercises or prescriptions to make fixtures more convenient.

### 6.4 Nutrition fixtures

Use clearly identified test records that cover:

- A verified source food.
- A valid zero nutrient where supported by the source.
- A missing nutrient value.
- An approximate food match.
- An incomplete nutritional record.
- A supported reference quantity.
- A portion with a valid compatible conversion.
- A portion with an unsupported conversion.

Synthetic fixture values may be used to test arithmetic, but they must be labelled as synthetic and must not be presented as real nutritional facts.

### 6.5 Habit fixtures

Cover:

- No completions.
- Completion today.
- Completion yesterday but not today.
- Consecutive completed dates.
- A missing day inside an otherwise completed sequence.
- Multiple habits owned by different users.
- Date boundaries near midnight in the user's configured timezone.
- Duplicate completion attempts.

### 6.6 Fixture cleanup

Fixture cleanup must delete only data created for the test.

Do not let test teardown delete curated content or records belonging to unrelated users.

---

## 7. Calorie Calculator test cases

### 7.1 Mathematical correctness

Verify the approved Mifflin–St Jeor equations and activity multipliers independently.

Check the exact calculation stages:

1. Normalize height and weight to canonical units.
2. Validate all inputs.
3. Calculate BMR using the selected conventional coefficient.
4. Calculate maintenance energy using the approved activity multiplier.
5. Apply the selected goal adjustment.
6. Apply the approved rounding rules.
7. Apply the approved minimum-target guardrail.
8. Return a valid result or a clearly withheld result.

### 7.2 Reference calculation

Use the following documented reference case:

- Age: 25 years.
- Height: 180 cm.
- Weight: 90 kg.
- BMR coefficient: `+5`.
- Activity level: moderately active.
- Goal: maintenance.

Expected calculations:

\[
BMR = 10(90) + 6.25(180) - 5(25) + 5
\]

\[
BMR = 1905 \text{ kcal/day}
\]

Using the activity multiplier of \(1.55\):

\[
TDEE = 1905 \times 1.55 = 2952.75
\]

With the documented display rounding to the nearest ten:

\[
TDEE \approx 2950 \text{ kcal/day}
\]

The maintenance goal applies no goal adjustment. The displayed target should follow the approved rounding and presentation contract.

This example tests the established mathematical behavior. It is not a personalized dietary recommendation.

### 7.3 Input-boundary tests

Test:

- Age below 18.
- Age 18.
- Age 120.
- Age above 120.
- Height below the approved minimum.
- Height at each approved boundary.
- Height above the approved maximum.
- Weight below the approved minimum.
- Weight at each approved boundary.
- Weight above the approved maximum.
- Zero or negative values.
- Missing values.
- Unsupported units.
- Malformed numeric values.
- Invalid enum values.

Use the approved limits from `docs/05-domain-logic.md`:

| Input | Approved range |
|---|---|
| Age | 18–120 years |
| Height | 100–250 cm |
| Weight | 25–350 kg |

Also test valid imperial input conversion where the UI supports it.

### 7.4 Goal and activity tests

Verify the approved values for each activity level and goal.

Test all supported activity multipliers and goal adjustments rather than relying on one example.

Use exact expected numerical results based on the approved calculation and rounding order.

### 7.5 Safety behavior

Verify that:

- Under-18 requests never return calorie targets.
- Invalid inputs do not produce results.
- The application does not silently clamp an unsafe or withheld result.
- The disclaimer is available in the calculator experience.
- Withheld targets are represented consistently between the API and UI.

**Release dependency:** Product-owner acceptance of the documented `1200 kcal/day` guardrail remains required before production release. Its behavior must not be invented by a test implementation.

### 7.6 Persistence tests

Confirm that calculation requests do not automatically create profile records or a calculation history unless an approved requirement explicitly adds persistence.

---

## 8. Workout-content and personal-plan tests

### 8.1 Source-content fidelity

Verify that:

- The six-day source programme is represented using its actual day assignments.
- Exercise names match the source.
- Exercise order and grouping match the source.
- Available sets and repetitions are preserved.
- Missing source prescriptions remain unset.
- Source labels and video URLs are preserved accurately.
- Warm-up content reflects the supplied document.
- No unverified Upper/Lower Template B is added.

These tests must use the actual `Finalized Workout.pdf` as the source of truth.

Where the PDF is ambiguous, record a manual review requirement instead of making an automated test assert a fabricated answer.

### 8.2 Template retrieval

Check:

- Published templates appear in the catalogue.
- Unpublished content is not exposed through the normal user-facing API.
- Template days and exercise entries use the correct order.
- Optional source fields remain correctly nullable.
- External source links are handled safely.

### 8.3 Personal-plan CRUD

Verify that a user can:

- Create a personal plan.
- Retrieve that plan.
- Edit approved plan fields.
- Add a day.
- Reorder days.
- Add an exercise entry.
- Edit sets and repetitions.
- Reorder exercises.
- Remove an exercise entry.
- Delete a personal plan according to the documented lifecycle.

Verify that another user cannot perform these operations on the plan.

### 8.4 Replace behavior

Test that Replace:

- Applies the selected template to the intended plan.
- Removes or replaces the applicable current plan content according to the approved semantics.
- Preserves the correct source order.
- Preserves source attribution.
- Does not invent missing prescriptions.
- Does not modify another plan.
- Does not remove exercise-progress history.
- Executes atomically.
- Leaves the original persisted state intact if the transaction fails.

### 8.5 Merge behavior

Test that Merge:

- Adds the selected source content.
- Retains existing user content.
- Allows legitimate exercise repetition on different days.
- Preserves ordering.
- Avoids unintended duplicates when the same request is retried.
- Preserves historical logs.
- Rolls back incomplete transactions.

### 8.6 Transaction and concurrency tests

Force representative database failures during Replace and Merge.

After a failed operation, inspect the database to verify that no partial state was committed.

Test conflicting or repeated requests where practical.

Do not infer atomicity merely because the API returns an error.

---

## 9. Workout-progress tests

### 9.1 CRUD behavior

Verify that users can create, retrieve, update, and delete their own progress records as permitted by the API specification.

### 9.2 Validation

Test:

- Valid logged dates.
- Invalid dates.
- Missing exercise identity.
- Invalid sets or repetitions.
- Invalid load values.
- Missing units for a recorded external load.
- Unsupported load units.
- Bodyweight entries with no external load.
- Invalid combinations of bodyweight and external-load fields.
- Empty or invalid note input.

Apply the approved domain rules consistently.

### 9.3 History independence

This is a critical regression test.

1. Create a personal plan.
2. Add an exercise.
3. Record progress for that exercise.
4. Remove the exercise from the plan.
5. Confirm that the progress record remains available.
6. Replace or delete the relevant personal plan.
7. Confirm that historical progress is still available through the approved independent history route.

The history must belong to the user and exercise identity, not solely to the current plan entry.

### 9.4 Measurement integrity

Confirm that missing load measurements remain null and are not converted to zero.

Verify that displayed load units correctly match the persisted measurement.

### 9.5 Chart behavior

Test the progress display with:

- No records.
- One record.
- Multiple records in chronological order.
- Missing optional measurements.
- Records spanning different dates.
- Invalid data responses.

Do not manufacture trend lines or additional data points for empty or incomplete history.

---

## 10. Habit-tracking tests

### 10.1 Basic operations

Verify that users can:

- Create a habit.
- Retrieve their habits.
- Rename a habit.
- Archive a habit.
- View completion history.
- Mark an eligible date complete.
- Unmark a completion.

Follow the approved behavior for unsupported destructive actions.

### 10.2 Duplicate prevention

Submit two completion requests for the same habit and date.

Confirm that the database contains only one completion record.

Test repeated requests through the actual API or data-access path rather than disabling the duplicate request only in the UI.

### 10.3 Current streak

Implement tests against the exact algorithm in `docs/05-domain-logic.md`.

The documented behavior is:

- A completion today allows the streak to start from today.
- If today is incomplete, a completion yesterday can allow the streak to continue while today is still in progress.
- If neither today nor yesterday qualifies under the documented rule, the current streak is zero.
- Count qualifying consecutive completion dates backwards.

Test those conditions explicitly, including transitions between dates.

Do not substitute a different streak definition because another tracker uses it.

### 10.4 Longest streak

Verify that the longest streak reflects the longest consecutive run in the stored completion history.

Include tests with gaps, multiple distinct streaks, and empty history.

### 10.5 Date and timezone boundaries

Test:

- User actions near midnight in `Asia/Kolkata`.
- A configured timezone different from the default, where supported.
- Day transitions and daylight-saving transitions in applicable timezones.
- Date-only persistence and retrieval.
- Consistent streak results after a page refresh.

Do not rely on a tester's machine timezone to determine the expected result.

### 10.6 Retention

Verify that ordinary habit archiving does not unintentionally delete completion history.

The individual habit-deletion retention decision remains unresolved. Do not create a test that assumes destructive deletion behavior before that rule is approved.

---

## 11. Food catalogue and nutrition tests

### 11.1 Catalogue integrity

Verify that each published food includes the required source and reference information.

Where applicable, verify:

- Stable identity.
- Display name.
- Food category.
- Preparation or food form.
- Reference quantity and unit.
- Available nutrient values.
- Source name and source reference.
- Approximation or verification status.

### 11.2 Source validation

Confirm that:

- IFCT 2017 is preferred when an appropriate entry is available.
- USDA FoodData Central is identified as the fallback source when used.
- A USDA record is not mislabeled as IFCT-derived.
- Unverified matching decisions are flagged.
- Unsupported nutrient values are not published as verified facts.

### 11.3 Portion scaling

For a supported nutrient value \(N_R\) associated with reference quantity \(R\), verify:

\[
N_Q = N_R \times \frac{Q}{R}
\]

Test a range of quantities and verify the results using independently calculated expected values.

Also test:

- Missing reference quantities.
- Incompatible units.
- Zero or negative quantities.
- Raw versus cooked food distinctions.
- Valid household-measure conversions when explicitly supported.

Do not assume that all food quantities can be converted to grams using one universal factor.

### 11.4 Missing and zero nutrient values

Verify that the application distinguishes between:

- A genuine source-supported zero.
- A missing nutrient value.
- An approximate source match.
- A calculated value.
- A result that is incomplete.

Do not use a truthiness check that treats numeric zero as missing or uses missing data as zero.

### 11.5 Data-quality display

Verify that approximate and incomplete records are clearly identified where required by the UI specification.

Do not present incomplete or approximate nutrition totals as exact, verified values.

### 11.6 Search

Test:

- Matching display names.
- Supported alternate names.
- No-match behavior.
- Special characters.
- Whitespace.
- Empty queries.
- Query length limits.
- Safe handling of untrusted search input.

Do not allow search input to change query structure or bypass data-access controls.

---

## 12. Meal-plan tests

### 12.1 CRUD behavior

Verify:

- Creating a personal meal plan.
- Retrieving a meal plan.
- Updating plan metadata.
- Adding a food item.
- Editing portion quantities.
- Changing approved meal groups.
- Reordering meal items.
- Removing a food item.
- Deleting a meal plan.

All operations must verify ownership.

### 12.2 Quantity and unit validation

Test:

- Positive supported quantities.
- Zero and negative quantities.
- Malformed numeric values.
- Unsupported units.
- Valid food-specific conversions.
- Unsupported conversions.
- Cooked versus uncooked reference mismatches.

The system must not generate precise-looking calorie totals from incompatible units.

### 12.3 Meal and daily totals

Use synthetic nutrient fixtures with known values to verify the arithmetic independently.

Test meals containing:

- Complete nutrient records.
- Missing energy values.
- Missing macro values.
- Approximate food matches.
- Mixed complete and incomplete items.

Verify that a missing nutrient does not silently become zero.

Confirm that the application's result correctly communicates whether the total is complete, approximate, or incomplete.

### 12.4 Calorie-target comparison

Verify that any displayed difference is calculated correctly using the selected target and the available valid meal-plan data.

The acceptable matching tolerance is still unresolved.

Until that decision is approved, tests must not require the application to label a meal plan as an exact or accepted target match based on an invented tolerance.

### 12.5 Persistence and data freshness

Verify that changing relevant food data or portion values does not leave the interface showing stale or inconsistent totals.

The UI must display results consistent with the approved source-of-truth and calculation strategy.

---

## 13. API validation and error-handling tests

### 13.1 Request validation

For every API route, test:

- Missing fields.
- Unsupported fields where rejection is required.
- Invalid UUIDs.
- Invalid dates.
- Unsupported enum values.
- Out-of-range numbers.
- Wrong input types.
- Overlong strings.
- Invalid parent-child relationships.
- Unauthorized owner IDs.

### 13.2 Status codes and contracts

Verify that endpoints return status codes and response envelopes consistent with `docs/09-api-spec.md`.

Test expected success and failure paths.

Ensure that an operation does not return a success status before the database mutation has succeeded.

### 13.3 Safe errors

Verify that responses do not expose:

- Raw SQL statements.
- Stack traces.
- Environment variables.
- Service-role credentials.
- Authentication tokens.
- Another user's private record content.

### 13.4 Expected and unexpected failures

Test known domain errors separately from unexpected server failures.

For example, a validation failure should provide useful safe feedback, while an internal database failure should return a generic error with suitable internal diagnostics.

### 13.5 Retry behavior

Verify the retry behavior of:

- Habit completions.
- Template application.
- Other mutations where repeating the request may create duplicates or destructive changes.

Do not assume that disabling a button prevents retries from browsers, networks, or direct API clients.

---

## 14. Authentication and RLS security tests

These tests are release-critical.

### 14.1 Two-user isolation

Create at least two test users with distinct private records.

Verify that User A cannot retrieve, modify, or delete User B's:

- Personal workout plans.
- Workout-plan days and entries.
- Workout-progress logs.
- Habits and habit logs.
- Meal plans and meal items.
- Private profile information.
- Account export data.

Repeat the tests in the reverse direction.

### 14.2 Forged identifier tests

Submit valid UUIDs belonging to another user.

Test attempts to:

- Retrieve another user's resource.
- Change a parent resource ID.
- Move a child record into another user's parent.
- Insert a record with another user's `user_id`.
- Modify an owner field.
- Delete records by guessing an ID.

Confirm that authorization is enforced by trusted application logic and effective database policies.

### 14.3 Direct database access

Where supported by the test environment, perform requests using the authenticated user's scoped Supabase access and verify that RLS still blocks unauthorized rows.

Do not test only through the normal application server, because an incorrect privileged service-role implementation could otherwise bypass the intended database boundary.

### 14.4 Anonymous access

Verify that unauthenticated clients cannot access private records or modify curated content.

Check effective privileges and RLS policies rather than assuming that missing UI navigation makes records inaccessible.

### 14.5 Privileged operations

Review every operation that uses service-role access.

Verify that it performs appropriate independent authentication and authorization checks.

Service-role access must not be used as a substitute for missing RLS policies.

---

## 15. Account export and deletion tests

### 15.1 Export

Verify that:

- Authentication is required.
- Export contains only the current user's applicable personal records.
- The export is usable and internally consistent.
- Required identifiers, relationships, and units are included.
- No secrets or unnecessary operational details are present.
- Private downloads are not exposed to unrelated users or shared caches.
- Export failures are handled safely.

### 15.2 Deletion authorization

Verify that the deletion endpoint cannot target another user's account through a submitted ID or manipulated request.

Check the approved confirmation and reauthentication requirements.

### 15.3 Deletion lifecycle

Using disposable test accounts, verify that successful account deletion follows the approved lifecycle across Supabase Auth and the application database.

Confirm that:

- User-owned personal records are handled according to the approved deletion rules.
- Shared exercises, templates, and foods remain available.
- Historical records do not become unintentionally orphaned.
- Failed operations do not falsely report success.
- Retried operations do not produce an unsafe or inconsistent state.

### 15.4 Partial failures

Where the deletion process spans systems that cannot share one transaction, simulate representative failures.

Verify the documented recovery or cleanup behavior.

Do not claim that all account data was deleted merely because a single API call returned a successful status.

---

## 16. UI, responsive design, and accessibility tests

### 16.1 Responsive layouts

Test the supported page layouts at representative mobile, tablet, and desktop viewport sizes.

Check:

- Primary navigation.
- Forms and validation messages.
- Workout tables or exercise lists.
- Progress charts.
- Habit controls.
- Food-search results.
- Meal-plan editors.
- Dialogs and confirmations.
- Long names and empty states.

Verify that content remains readable and usable without unintended horizontal overflow.

### 16.2 Keyboard accessibility

Verify that users can navigate and operate essential features using the keyboard.

Check:

- Logical tab order.
- Visible focus indicators.
- Dialog focus behavior.
- Escape behavior where appropriate.
- Form error focus and feedback.
- No keyboard traps.
- Accessible interaction for menus and interactive elements.

### 16.3 Screen-reader support

Verify that important controls have meaningful accessible names, roles, and states.

Confirm that input labels, validation messages, charts or chart summaries, navigation landmarks, and completion states are understandable with assistive technology.

### 16.4 Contrast and visual clarity

Check text and component contrast against the approved accessibility requirements.

Do not rely solely on color to communicate success, error, completion, or data quality.

### 16.5 Automated accessibility checks

Use automated accessibility checks where practical, but combine them with manual keyboard and assistive-technology review.

A clean automated report does not prove full accessibility compliance.

### 16.6 WCAG target

Use WCAG 2.2 Level AA as the target established by the UI/UX specification.

Record actual findings, including checks that cannot be fully automated.

---

## 17. Performance and reliability tests

### 17.1 Performance priorities

Focus on the application's actual high-value operations:

- Opening authenticated feature pages.
- Retrieving workout templates.
- Loading a personal plan.
- Saving progress.
- Loading habit history.
- Searching foods.
- Calculating meal-plan totals.

### 17.2 Query efficiency

Verify that common page loads do not cause unnecessary repeated database queries.

Inspect slow or unexpectedly expensive queries and add indexes only when justified by real access patterns.

Do not load an entire catalogue when a paginated or filtered query is sufficient.

### 17.3 Failure recovery

Test reasonable failure cases such as:

- Database unavailable.
- Authentication session expired.
- Mutation rejected.
- Network interruption.
- Repeated request after a timeout.
- Stale client data.

Verify that the UI communicates the actual state and does not report a failed operation as successful.

### 17.4 Performance thresholds

Define explicit performance budgets before treating performance as a release gate.

These budgets should be based on the deployment environment, expected data volume, and agreed user-experience goals.

Do not fabricate measured performance numbers in the test report or assume that the production app meets a target without collecting evidence.

---

## 18. Regression testing

Every meaningful fix must include a relevant regression test where practical.

### 18.1 Regression priorities

Always rerun affected tests for:

- Calorie calculation changes.
- Date or timezone changes.
- RLS or ownership-policy changes.
- Database migrations.
- Workout Replace/Merge changes.
- Workout-history relationships.
- Nutrition scaling.
- Account export or deletion.
- Shared component changes.
- Authentication integration.
- Production environment configuration.

### 18.2 Seed-data regression

Verify that content seeding:

- Does not create uncontrolled duplicates.
- Preserves source provenance.
- Does not invent missing source values.
- Does not reset user data.
- Does not overwrite personal records.
- Produces the intended published catalogue.

### 18.3 Historical-data regression

After database changes, confirm that existing valid progress logs, habits, and meal-plan references remain consistent with their approved lifecycle.

### 18.4 No unrelated fixes

A fix must not silently change an approved product rule simply to make a test pass.

If a test exposes a contradiction between approved documents, record the conflict and resolve it before proceeding.

---

## 19. Test traceability

Each test case should have a stable identifier and enough information to trace it to product requirements and implementation.

Recommended fields:

| Field | Purpose |
|---|---|
| Test ID | Stable test-case identifier |
| Feature | Feature under test |
| Requirement reference | Relevant FR or user-story ID |
| Test level | Unit, component, integration, API, security, or E2E |
| Preconditions | Required test setup |
| Test input | Input values or fixture |
| Steps | Reproducible execution steps |
| Expected result | Objective expected behavior |
| Actual result | Observed behavior after execution |
| Status | Pass, fail, blocked, or not run |
| Defect reference | Related issue if the test fails |
| Evidence | Relevant report or artifact |

### 19.1 Requirement mapping

Use the approved FR and US identifiers from Documents 01 and 02 when mapping tests.

Do not invent requirement IDs or rewrite the product requirements simply to match the current code.

Every critical requirement should have an identifiable test or documented manual verification.

### 19.2 Evidence

Evidence may include:

- Test reports.
- Browser traces.
- Screenshots where useful.
- Sanitized request/response examples.
- Database assertion results.
- RLS test outcomes.
- Build and type-check reports.

Remove authentication secrets and unnecessary personal data from evidence.

---

## 20. Defect management

### 20.1 Defect record

A defect report should include:

- Defect ID.
- Clear summary.
- Environment.
- Preconditions.
- Reproduction steps.
- Expected behavior.
- Actual behavior.
- Severity.
- Priority.
- Relevant screenshots, logs, or test evidence.
- Linked requirement or test case.
- Resolution and regression-test details.

### 20.2 Severity guidance

Use the approved defect classification convention consistently.

Examples of critical defects include cross-user data exposure, privileged-key leakage, and unauthorized account deletion.

High-priority defects include loss of workout history, invalid safety behavior, incorrect persisted ownership, and data corruption.

Visual defects may be lower priority only when they do not make a feature unusable, mislead users, or prevent access for users with disabilities.

### 20.3 Retesting

After a fix:

1. Reproduce or execute the original failing case.
2. Verify the corrected result.
3. Run relevant regression tests.
4. Confirm that the fix did not weaken authorization or alter unrelated behavior.
5. Record the final test result.

Do not close a defect solely because the code was changed.

---

## 21. Release gates

The application must not be considered ready for production merely because it starts successfully.

### 21.1 Required technical checks

Before a release, verify that the agreed checks pass:

- TypeScript type checking.
- Linting.
- Unit and component tests.
- Critical integration tests.
- API contract tests.
- RLS and authorization tests.
- Critical end-to-end tests.
- Accessibility checks.
- Production build.
- Database migration validation.
- Seed-content validation.
- Applicable dependency and secret-exposure checks.

The exact executable commands must be derived from the actual repository.

### 21.2 Critical release blockers

Do not release while any of the following remains unresolved:

- Unauthorized access to private data.
- A leaked privileged credential.
- A critical database-integrity failure.
- A destructive account-deletion defect.
- An unapproved or incorrect under-18 calorie-target path.
- A failure to preserve required workout history.
- Partial or corrupt workout-plan transactions.
- Materially misleading calorie or nutrition calculations.
- Invalid source prescriptions presented as verified.
- A failed critical user journey without an approved mitigation.

### 21.3 Open product decisions

Some decisions remain explicitly unresolved in earlier documentation.

In particular:

- The documented minimum calorie-target guardrail requires product-owner acceptance before production release.
- The meal-plan matching tolerance must be approved before the application labels a plan as satisfying that tolerance.
- Individual habit-deletion retention semantics must be resolved before destructive deletion behavior is implemented.

Tests must reflect the approved decision once made. They must not invent the missing rules.

### 21.4 Test reporting

The release report must distinguish:

- Passed tests.
- Failed tests.
- Blocked tests.
- Tests not run.
- Known defects.
- Unresolved product decisions.
- Security checks that remain unverified.

Do not claim that all tests pass if some were skipped or could not be executed.

---

## 22. Definition of done

The test plan is ready for implementation when:

1. Every major feature has a defined test strategy.
2. Deterministic domain rules have testable expected results.
3. Source-content fidelity is verified against the actual workout document.
4. User-owned data isolation is tested with independent test users.
5. Database RLS, foreign keys, and uniqueness constraints are tested directly.
6. Workout Replace/Merge behavior includes rollback and retry testing.
7. Workout progress remains available after relevant plan changes.
8. Habit tests cover completion dates, streak calculations, and timezone behavior.
9. Nutrition tests cover units, missing values, and approximate results.
10. Export and account deletion are tested safely.
11. UI and accessibility checks cover key workflows.
12. Critical release-blocking conditions are documented.
13. Tests can run repeatably without production data.
14. Results can be traced to approved requirements and user stories.
15. Test reports distinguish verified behavior from assumptions or untested areas.

---

## 23. Instructions for Antigravity review

Review `docs/11-test-plan.md` against Documents 01–10, the existing repository, and the actual testing dependencies.

Report:

- Important missing tests.
- Tests that contradict the approved domain rules.
- Security tests that verify only the UI rather than RLS.
- Test cases that depend on invented data or assumptions.
- Missing regression coverage for destructive or multi-record operations.
- Tooling already available in the repository.
- Tests that cannot run until a documented product decision is approved.

Do not claim a test has passed unless it has actually executed successfully. Do not start application implementation during this documentation-review step.

**Implementation rule:** A passing test suite provides evidence for the behaviors it actually tests. It does not prove that untested requirements are correct, secure, or ready for production.

filename:docs/11-test-plan.md
