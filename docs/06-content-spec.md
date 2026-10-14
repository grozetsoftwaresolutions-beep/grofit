# 06 — Content Specification

**Project:** Tamil Nadu Fitness Companion  
**Document:** Content Specification  
**Status:** Ready for Antigravity review  
**Primary language:** English  
**Primary food-data source:** Indian Food Composition Tables (IFCT), 2017  
**Fallback food-data source:** USDA FoodData Central  
**Workout source of truth:** `Finalized Workout.pdf`

---

## 1. Purpose

This document defines the content requirements, sourcing rules, data-quality standards, and acceptance criteria for the Tamil Nadu Fitness Companion.

It covers:

1. Workout exercises, warm-ups, and workout templates.
2. The relationship between source workout content and user-created workout plans.
3. Exercise instructions, source labels, and video links.
4. The Tamil Nadu food catalogue and nutrition information.
5. Starter meal-plan content and nutrient calculations.
6. Content provenance, completeness, accuracy, and maintenance.
7. Requirements for future English and Tamil localization.

This document defines **what content the product must contain and how it must be validated**. Database schema, API behavior, authorization, and implementation architecture are defined in the corresponding technical documents.

## 2. Content principles

All content must follow these principles.

### 2.1 Accuracy over completeness

Do not invent exercise instructions, sets, repetitions, video URLs, nutritional values, serving sizes, or food-source references merely to make the catalogue appear complete.

When a value cannot be verified, use the appropriate missing or unverified state defined in this document.

### 2.2 Traceable sources

Every sourced workout item and sourced nutritional record must be traceable to its original source.

Users and maintainers must be able to distinguish source-provided information from application-generated information.

### 2.3 Preserve the source workout

`Finalized Workout.pdf` is the source of truth for the supplied workout programme.

Preserve its exercise names, day assignments, grouping, available warm-ups, source labels, video URLs, sets, and repetitions wherever those details are actually supplied.

Do not silently replace the source programme with a different fitness programme.

### 2.4 Nutrition values must be evidence-based

Use IFCT 2017 as the preferred source for Indian foods when an applicable entry is available and sufficiently specific.

Use USDA FoodData Central as a fallback when an appropriate IFCT entry cannot be identified.

Record which source was used for each food record. A fallback value must never be presented as an IFCT value.

### 2.5 Clear separation of content and user data

Distinguish between:

- Curated application content.
- Content selected or copied into a user's personal plan.
- User-created exercise configurations.
- User-entered workout logs.
- User-created habits and meal-plan entries.

Editing a personal plan must not silently modify the shared source workout catalogue.

---

## 3. Content categories

The product contains the following content categories.

| Category | Purpose | Main requirements |
|---|---|---|
| Exercise catalogue | Supplies exercises used by workout templates and personal plans | Stable identity, names, source references, optional prescription values |
| Warm-up content | Presents the warm-up information available in the source programme | Preserve supplied text and sequence |
| Workout templates | Provides predefined workout programmes | Preserve day order, grouping, and available exercise details |
| Personal workout content | Stores a user's custom selection and configuration | Editable independently of shared source content |
| Exercise progress content | Supports exercise-based performance tracking | Stable exercise identity and historical workout records |
| Food catalogue | Provides Tamil Nadu-relevant foods and nutrient information | Source, food identity, reference basis, units, and data-quality flags |
| Meal-plan content | Provides meal suggestions and calculations | Food portions, meal grouping, and transparent nutrition totals |
| Educational and safety content | Explains limitations and safe use of the application | Accurate, readable, non-diagnostic language |

## 4. Workout content specification

### 4.1 Source file

The supplied source file is:

`Finalized Workout.pdf`

Use this file to populate the initial source workout content.

Do not substitute another workout PDF, a general online workout, or an assumed workout split for the supplied programme.

### 4.2 Exercise information

Capture the exercise details that are explicitly present in the source.

Conceptually, an exercise record may include:

| Field | Requirement |
|---|---|
| Stable exercise ID | Required and unique |
| Exercise name | Required; preserve the supplied name where possible |
| Source label | Preserve the source-provided label when available |
| Video URL | Preserve the source-provided URL when available |
| Exercise description | Include only when supplied or separately verified |
| Sets | Optional when absent from the source |
| Repetitions | Optional when absent from the source |
| Source reference | Required for imported source content |
| Import or verification status | Must distinguish verified content from content requiring review |

The exact technical field names and database constraints are defined in the database specification.

### 4.3 Preserve workout-day structure

The supplied workout programme contains a six-day split.

Preserve the source's day assignments and exercise order. Do not reorganize exercises between days merely to conform to a preferred training methodology.

Maintain separate groups where the source identifies separate exercise groups or sections.

When exercise names, day headings, or exercise order are ambiguous in the PDF, mark the affected content for manual review rather than guessing.

### 4.4 Sets and repetitions

Apply the following rules:

1. Import the number of sets when it is explicitly supplied.
2. Import the repetition prescription when it is explicitly supplied.
3. If the source omits sets or repetitions, leave those values unset.
4. Do not replace missing values with common gym conventions such as three sets of twelve repetitions.
5. Allow users to configure missing prescription values in their personal workout plans where supported.
6. Clearly distinguish source-provided prescriptions from user-modified prescriptions.

An unset prescription is not an error when the original source does not provide that information.

### 4.5 Warm-up content

Preserve warm-up sections and their ordering as provided by the source workout.

Do not introduce additional warm-up exercises, durations, repetitions, or recommendations unless they have been separately reviewed and approved as new content.

Where the source does not specify a duration or repetition count, leave that information unspecified.

### 4.6 Source labels and video URLs

For every sourced workout item:

- Preserve the original source label.
- Preserve the original URL exactly as supplied, subject to validation and safe URL handling.
- Do not construct URLs from exercise names.
- Do not substitute a different video simply because the supplied link appears incomplete.
- Identify invalid, inaccessible, or ambiguous links for review.
- Display source attribution wherever required by the UI specification.

A missing video URL must remain missing until a suitable replacement has been independently verified and approved.

### 4.7 Upper/Lower Template B

The currently established source does not provide a verified Upper/Lower Template B.

Therefore:

- Do not create or import an assumed Upper/Lower Template B.
- Do not infer its exercises from another template.
- Do not manufacture a source label or video URL for it.
- Do not represent a newly created template as an original source template.

A new template may be added later only as separately identified, reviewed content. Its status and source must be transparent.

### 4.8 Exercise identity and reuse

An exercise may appear on more than one day or in more than one template.

Do not create duplicate catalogue exercises solely because an exercise is used in different workout days.

Conversely, do not merge two exercises solely because their names look similar. Resolve identity differences using the source material and manual review when necessary.

Exercise progress history must remain associated with the intended exercise identity rather than depending exclusively on a particular plan entry. Removing or rearranging an exercise in a personal plan must not silently erase historical progress.

---

## 5. Workout templates and user-created content

### 5.1 Curated templates

A curated template must retain:

- Template name.
- Source attribution.
- Workout-day order.
- Day names or headings, where supplied.
- Exercise order within each day.
- Source exercise identity.
- Available source prescription values.
- Available source labels and video URLs.
- Any source-provided warm-up content.

Do not add unverified exercises or prescriptions merely to make templates appear more complete.

### 5.2 Copying content into a personal plan

When a user copies a template into a personal workout plan, the user's plan must have its own editable plan and entry data.

The copy must preserve the supplied content values at the time it is created. Subsequent user changes must not rewrite the shared source template.

Personal changes must not be misrepresented as content from the original PDF.

### 5.3 Replace and Merge operations

The application supports distinct Replace and Merge actions for applying workout content to a personal plan.

Their content behavior must be explicit:

**Replace**
- Replace the intended target content with the selected source content.
- Avoid modifying unrelated plans or days.
- Preserve workout history.
- Do not delete historical exercise logs as a side effect of replacing a plan.

**Merge**
- Add the selected source content to the intended target.
- Avoid accidental duplicate insertion when the same import operation is retried.
- Do not remove existing user content as a side effect.
- Preserve legitimate exercise repetitions across different days when they are part of the selected programme.

These operations must not use exercise-name matching alone to erase legitimate repeated exercises. Detailed transactional behavior is specified in the domain-logic, architecture, and database documents.

### 5.4 User-created exercises or prescriptions

When users create or modify personal exercise content:

- Keep the content distinguishable from immutable source content.
- Validate user-entered prescription values.
- Preserve the original source values where the product needs to show what was changed.
- Never claim that a user-entered value was supplied by the source PDF.

The application must not silently fill omitted source values with assumed training prescriptions.

---

## 6. Food catalogue specification

### 6.1 Intended coverage

The food catalogue should prioritize foods that are relevant to Tamil Nadu eating patterns, including commonly consumed:

- Rice and other grain-based foods.
- Idli, dosa, and related preparations.
- Chapati and other commonly used staple foods.
- Pulses, beans, and legumes.
- Vegetables and greens.
- Fruits.
- Milk, curd, and other dairy foods.
- Eggs, poultry, fish, and other applicable protein sources.
- Commonly used oils, nuts, and seeds.
- Frequently used ingredients and prepared dishes.

These categories define the intended scope; they do not establish that every food has already been sourced or verified.

The catalogue must use specific, identifiable food records rather than treating all foods within a category as nutritionally identical.

### 6.2 Food identity

Each food record should describe one identifiable food and its nutritional reference basis.

For example, plain cooked rice and uncooked rice must not be treated as interchangeable records. Similarly, an ingredient and a prepared dish must remain distinct when their water content, ingredients, or preparation methods materially affect their nutritional values.

Conceptual fields include:

| Field | Requirement |
|---|---|
| Stable food ID | Required and unique |
| Display name | Required |
| Alternate names | Optional; use verified names and synonyms |
| Food category | Required for catalogue organization |
| Food form or preparation | Record where relevant |
| Reference quantity | Required for nutrient scaling |
| Reference unit | Required |
| Nutrient values | Store available, source-supported values |
| Nutrient units | Must be explicit and compatible |
| Source name | Required |
| Source record or citation | Required where the source provides an identifiable reference |
| Approximation status | Required where values or food matching are approximate |
| Verification status | Must distinguish verified data from data awaiting review |

The final field names are determined in the database specification.

### 6.3 Primary source: IFCT 2017

Use the Indian Food Composition Tables (2017) as the preferred source for matching Indian food records.

For each selected IFCT entry:

1. Match the food identity and preparation basis as closely as possible.
2. Record the source's food name or reference.
3. Preserve the applicable reference quantity and units.
4. Capture only the nutrient values actually provided by the source.
5. Record any required conversion or mapping decision.
6. Flag approximate matches instead of treating them as exact matches.

Do not label a food record as IFCT-derived merely because the food is commonly consumed in India.

### 6.4 Fallback source: USDA FoodData Central

Use USDA FoodData Central when no suitable IFCT entry can be identified for the required food.

For each fallback record:

- Identify USDA FoodData Central as the source.
- Retain the available food description or source record identifier.
- Confirm that the food form and preparation are appropriate for the intended use.
- Preserve nutrient units and reference quantities.
- Flag any differences or uncertainty in matching the requested food.

An American food entry must not automatically be treated as nutritionally equivalent to a Tamil Nadu preparation with different ingredients or cooking methods.

### 6.5 Prepared foods and recipes

Prepared foods can vary by recipe, ingredient ratios, cooking method, and water content.

If a source record genuinely matches the intended prepared food, document that match.

If the catalogue represents a generic dish rather than a specific standardized recipe, clearly classify the record as approximate where appropriate.

Do not present an illustrative or estimated recipe value as an exact laboratory measurement.

Where practical, represent a custom recipe using its known ingredients and quantities. If ingredient quantities or nutrient data are unavailable, identify the result as incomplete or approximate as appropriate.

### 6.6 Nutrient fields

Store nutrient values only when supported by the selected source or a documented calculation based on valid source data.

The product may use available nutrient fields such as:

- Energy.
- Protein.
- Carbohydrates.
- Total fat.
- Fibre.
- Other nutrients when explicitly supported by the data source and required by the product.

Do not require every food to have every possible nutrient value.

Represent unavailable or unknown nutrients as missing values, not zero.

A recorded zero is valid only when the source or a documented, appropriate calculation supports a zero value. Missing data must not be converted into zero for convenience.

### 6.7 Nutrition-data quality flags

The system must support clear distinctions between these situations:

**Verified source match:** The record closely corresponds to an identifiable source entry.

**Approximate match:** The record uses a related food entry or generalized preparation that may differ from the user's intended food.

**Calculated value:** The value has been derived from valid inputs using a documented calculation.

**Incomplete nutrients:** One or more nutrient fields required for a requested total are unavailable.

**Needs review:** The record's identity, source mapping, units, or values have not been adequately verified.

The implementation may use database enums, booleans, or structured metadata, but the distinctions must remain available to the application.

Do not present all of these statuses as equivalent confidence levels.

### 6.8 Nutrient units and conversions

Use a consistent canonical representation for nutrient quantities.

For energy, the app's primary calculator and meal-plan comparison use kilocalories (kcal). For food macros, use grams (g) where supported.

The system must retain enough information to interpret the original reference quantity and units.

When a nutrient value \(N_R\) is defined for a source reference quantity \(R\), the value for compatible quantity \(Q\) may be calculated as:

\[
N_Q = N_R \times \frac{Q}{R}
\]

This scaling is valid only when the units and food reference basis are compatible.

For example, scaling a nutrient value for 100 g of a specific food to 150 g of the same food form is valid when the reference units match. Scaling a value for uncooked rice directly to cooked rice by weight is not valid without a documented, appropriate conversion model.

Do not perform incompatible unit conversions or silently mix values from different preparation states.

### 6.9 Food names and search

Food names must be clear, recognizable, and consistent.

Where verified alternate names exist, they may be used to improve search. Alternate names must not create a new food identity unless there is a substantive difference in the food.

The search experience should support practical food discovery without conflating materially different food forms.

Use stable IDs for internal references rather than depending on display names, which may change with future localization.

---

## 7. Meal-plan content

### 7.1 Purpose

Meal-plan content helps users explore meal combinations using the available food catalogue and compare estimated food energy with their selected calorie target.

Meal plans must not be represented as individualized medical nutrition prescriptions.

### 7.2 Meal and portion structure

A meal-plan item should identify:

- The referenced food.
- The quantity or serving size.
- Its unit.
- The applicable nutrient reference basis.
- Its calculated nutrient contribution, when calculable.
- Whether the contribution is complete, approximate, or incomplete.

Meal items must reference canonical food records where possible. Duplicating food nutrient values into unrelated static meal-plan records can create inconsistencies when a source record is corrected.

### 7.3 Portion consistency

The user must be able to distinguish the portion entered for a meal item from the source's nutrient reference quantity.

For example, a food record may provide values per 100 g while a meal uses 150 g. The calculation must scale the reference value using compatible units and the correct food form.

Household measures must not be converted into gram values unless an appropriate conversion is documented.

Where a portion cannot be reliably converted, request an appropriate quantity or mark the result as approximate. Do not invent a precise gram weight for an unspecified bowl, cup, or serving.

### 7.4 Meal-plan totals

Calculate meal totals from the valid nutrient contributions of their items.

The meal-plan summary should distinguish between:

- A complete total calculated from the required available values.
- An approximate total based on explicitly identified approximate records.
- An incomplete total when required nutrient values are missing.

Never treat a missing energy value as zero when determining a complete calorie total.

If a total cannot be calculated reliably, communicate that limitation rather than displaying a misleading exact-looking number.

### 7.5 Comparison with calorie targets

The application may compare the meal-plan calorie estimate with the user's selected daily calorie target.

Use the established domain logic to calculate the difference between the candidate meal-plan energy and the target.

The acceptable matching tolerance has not been finalized. Do not invent a tolerance in the seed content or embed an arbitrary tolerance in individual meal plans.

Until that rule is approved, the app may show the calculated difference without claiming that a plan is an exact or approved match.

### 7.6 Meal-plan variety and representation

Starter meal plans should reflect Tamil Nadu food choices rather than assuming that every user follows the same diet.

The catalogue should make it possible to build varied combinations of staple foods, vegetables, pulses, protein sources, fruits, and other common food groups.

Do not claim that a meal plan is suitable for diabetes, kidney disease, pregnancy, or another medical condition without the appropriate professional validation and a separate product decision.

The application must display its nutrition disclaimer in the locations defined by the UI/UX and domain-logic specifications.

---

## 8. Nutrition and fitness safety content

The product must clearly communicate that:

- Calorie estimates are estimates and may not match an individual's actual energy requirements.
- Food nutrient values can vary by food selection, portion size, preparation, and data source.
- Workout programmes must be adapted to an individual's abilities and circumstances.
- General fitness content is not a substitute for individualized medical advice.
- Users should seek appropriate professional guidance when needed.

Safety language must be readable and visible in the relevant experiences, not hidden exclusively in a legal page.

Do not claim that the calorie calculator, exercise templates, habits, or meal plans diagnose, treat, or prevent disease.

The under-18 behavior and calorie-target guardrails must follow the product requirements and domain-logic specification. Content must not bypass those safeguards by supplying alternative targets or recommendations.

Any safety claim added beyond these established requirements must be separately reviewed before publication.

---

## 9. Localization and naming

### 9.1 Initial language

The initial release uses English for the interface and curated content.

Keep user-facing text, food names, and localization-ready fields structured so that Tamil can be added in a later release.

### 9.2 Future Tamil support

Where localization is introduced:

- Preserve the stable identity of foods, exercises, templates, and other content.
- Store localized display names independently from internal IDs.
- Preserve the source name and source attribution.
- Use reviewed translations for important fitness and nutrition terminology.
- Avoid machine-translated medical or safety statements being published without review.
- Ensure that localized text does not change numerical units or the meaning of a source record.

Tamil aliases may help users search for a food, but they must not cause two distinct food records to be merged incorrectly.

### 9.3 Units and display

Use the canonical units defined by the domain-logic specification for internal calculations.

A user's preferred display units must affect presentation and permitted input conversion only. It must not cause inconsistent stored quantities or nutrition calculations.

Do not hardcode unit assumptions inside individual food names or plan descriptions.

---

## 10. Content import and review workflow

Use the following workflow when preparing initial content or adding new records.

### Step 1: Identify the source

Record the source document or database and identify the exact item being imported.

### Step 2: Extract source information

Extract only details that are actually supported by the source.

For workout content, retain the day, group, exercise order, available prescription, source label, and URL.

For food data, retain the source food identity, reference basis, supported nutrients, and applicable source metadata.

### Step 3: Normalize

Normalize naming, units, and internal identifiers without changing the underlying meaning.

Do not make an unverified food substitution or infer missing workout prescriptions during normalization.

### Step 4: Validate

Check required fields, units, value types, reference quantities, and source links.

Identify uncertain exercise mappings, missing values, duplicate identities, and incompatible food matches.

### Step 5: Record data quality

Mark approximate, incomplete, calculated, or unverified content appropriately.

Do not silently convert a record requiring review into a verified record.

### Step 6: Review exceptions

Require manual review for ambiguous source content, unsupported conversions, potentially incorrect food matches, or invalid source links that would materially affect user results.

### Step 7: Seed or update content

Load the approved content using a repeatable process.

Rerunning a seed operation must not generate uncontrolled duplicate source records.

Content updates must not overwrite user-owned plans, logs, habits, or other personal records.

### Step 8: Verify the result

Check representative imported records against the original source and confirm that the application displays the intended content, data-quality state, and attribution.

---

## 11. Content integrity and maintenance

### 11.1 Source provenance

Every sourced record must have sufficient provenance to answer:

- Where did this information come from?
- Which source item or reference was used?
- What food form or workout context does it describe?
- Was the value copied directly or calculated?
- Is any important approximation or limitation known?

### 11.2 Corrections

When an error is identified:

1. Record the affected content and the reason for correction.
2. Verify the intended replacement against its source.
3. Update the curated record through the approved content-maintenance process.
4. Review any dependent totals, displays, or references.
5. Avoid altering users' historical records without an explicit, documented product rule.

### 11.3 Deletion

Do not delete a shared exercise or food merely because it is no longer part of a currently featured template or meal plan.

Check whether the record is referenced by personal plans, workout history, or existing meal-plan items. The database and domain specifications govern archival, foreign-key behavior, and historical preservation.

### 11.4 Seed repeatability

The initial exercise, template, warm-up, and food seed content must support safe, repeatable development and deployment workflows.

Seed operations must have a stable way to identify existing curated records.

Repeated execution must not:

- Duplicate the same source exercise.
- Duplicate source templates or template days.
- Create duplicate seed entries unintentionally.
- Replace user-created content with default values.
- Reset user workout logs, habit history, or meal plans.

---

## 12. Content acceptance criteria

The following checks must pass before the corresponding content is considered ready.

### 12.1 Workout content

- [ ] The six-day source programme is represented using the source's actual day assignments.
- [ ] Exercise names and order are consistent with the supplied PDF.
- [ ] Existing source labels and video URLs are preserved accurately.
- [ ] Missing sets and repetitions remain unset rather than being fabricated.
- [ ] Warm-up content matches what the source provides.
- [ ] No unverified Upper/Lower Template B is created.
- [ ] Repeated uses of an exercise do not create unnecessary duplicate catalogue identities.
- [ ] Source content remains distinguishable from user-modified content.
- [ ] Invalid or ambiguous source details are recorded for review.

### 12.2 Food catalogue

- [ ] Each published food has a stable identity and understandable name.
- [ ] Each sourced nutrition record identifies IFCT 2017 or USDA FoodData Central as appropriate.
- [ ] Food form and preparation state are recorded when materially relevant.
- [ ] Reference quantities and nutrient units are explicit.
- [ ] Missing nutrient values are stored as missing, not silently replaced with zero.
- [ ] Approximate matches and incomplete records are identified.
- [ ] Nutrient scaling uses compatible quantities, units, and food forms.
- [ ] Duplicate names and aliases do not merge materially different foods.
- [ ] No unsupported numerical nutrient values are published as verified facts.

### 12.3 Meal plans

- [ ] Meal items reference the intended food identity.
- [ ] Portions and reference quantities can be distinguished.
- [ ] Valid nutrient values are scaled using the documented calculation.
- [ ] Incomplete nutrient data does not produce a falsely complete total.
- [ ] Approximate values remain clearly identified.
- [ ] No unapproved calorie-target tolerance is hardcoded.
- [ ] Starter plans are presented as general information rather than medical prescriptions.

### 12.4 Integrity and localization

- [ ] Source content can be traced to its origin.
- [ ] Repeating the content-seeding process does not create unintended duplicates.
- [ ] Content updates do not reset user-owned records.
- [ ] Stable identifiers do not depend on the display language.
- [ ] English remains the supported initial language.
- [ ] Content fields are structured to support future Tamil localization.

---

## 13. Out of scope for this document

This document does not define:

- Database table names, SQL migrations, or row-level security policies.
- API endpoint names or request and response schemas.
- Authentication and authorization implementation.
- Exact calorie equation and activity-multiplier implementation beyond the established domain-logic document.
- An unapproved meal-plan matching tolerance.
- Additional workout templates that are not verified by their source.
- A guaranteed complete nutritional profile for every food.
- Medical nutrition therapy or diagnosis.
- The final product implementation sequence.

These matters belong to the relevant product, domain-logic, architecture, database, API, security, testing, and roadmap documents.

---

## 14. Definition of done

This content specification is ready for implementation when:

1. The source workout content can be imported without inventing missing details.
2. Food records can preserve their source, reference basis, units, and data-quality status.
3. Meal-plan calculations distinguish complete, approximate, and incomplete results.
4. User-owned content remains separate from curated source content.
5. Content import and correction workflows protect existing user data.
6. Acceptance checks can be implemented as automated tests where practical and manual source-verification checks where necessary.
7. Any ambiguity discovered during source extraction is recorded for review instead of silently guessed.

**Implementation rule:** Follow this specification together with the approved product requirements, user stories, information architecture, UI/UX specification, domain logic, and subsequent technical documents. If documents conflict, identify the conflict and request resolution rather than silently inventing a new product rule.
