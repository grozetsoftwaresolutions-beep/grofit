# 09 — API Specification

**Project:** Tamil Nadu Fitness Companion  
**Document:** API Specification  
**Status:** Ready for Antigravity review  
**Frontend:** Next.js App Router and TypeScript  
**Backend:** Next.js server operations and Supabase  
**Database:** PostgreSQL  
**Authentication:** Supabase Auth  
**API format:** JSON over HTTPS  
**Canonical units:** kg, cm, kcal, and g where applicable  
**Timezone default:** `Asia/Kolkata`

---

## 1. Purpose

This document defines the application-facing API contracts for the Tamil Nadu Fitness Companion.

It describes how authenticated users interact with:

1. The calorie calculator.
2. Curated workout templates.
3. Personal workout plans and their exercise entries.
4. Exercise-progress history.
5. Habit tracking and completion logs.
6. The sourced food catalogue.
7. Personal meal plans and nutrient calculations.
8. User preferences, data export, and account deletion.

The API must enforce the approved business rules, maintain data integrity, preserve workout history, and prevent unauthorized access to user-owned records.

This specification complements:

- `docs/01-PRD.md`
- `docs/02-user-stories.md`
- `docs/03-information-architecture.md`
- `docs/04-ui-ux-spec.md`
- `docs/05-domain-logic.md`
- `docs/06-content-spec.md`
- `docs/07-architecture.md`
- `docs/08-database.md`

The API must not invent missing workout prescriptions, unverified nutrition values, or unapproved product rules.

## 2. API design principles

### 2.1 Predictable contracts

Each endpoint must define its accepted input, successful response, and failure behavior.

Use consistent JSON property names and predictable error structures.

### 2.2 Authenticate and authorize every private operation

Private endpoints must validate the authenticated Supabase user.

The server must derive the owner's identity from the validated session, not from a `userId` submitted by the client.

An authenticated user must never be able to access another user's data by changing a plan ID, habit ID, exercise ID, meal-plan ID, or other identifier.

### 2.3 Validate input at runtime

Validate request bodies, path parameters, query parameters, units, dates, enums, and numerical ranges on the server.

TypeScript interfaces alone do not validate untrusted runtime input.

Use Zod or an equivalent established runtime-validation mechanism.

### 2.4 Keep domain logic centralized

The API must call the approved domain logic for calculations and validation.

Do not reimplement calorie formulas, streak algorithms, nutrition scaling, or workout prescription rules independently in each endpoint.

### 2.5 Use database transactions when required

Operations that change multiple related records must use the required database transaction or trusted PostgreSQL function.

A successful API response must represent a completed operation, not a series of partially successful writes.

### 2.6 Protect sensitive information

Do not return passwords, authentication tokens unnecessarily, secret keys, SQL errors, stack traces, or internal infrastructure details in API responses.

### 2.7 Preserve missing and approximate values

Unknown calorie or nutrient values must not be silently replaced with zero.

Missing sets or repetitions in source workout content must remain missing until a user provides a value or verified source content supplies it.

### 2.8 Keep implementation choices consistent

Use Next.js Route Handlers for the documented `/api/...` HTTP contracts.

Server Components may call approved server-side data-access functions directly for server-rendered pages where appropriate.

Do not expose the same operation through several competing implementations without a documented reason.

---

## 3. Base URL and conventions

### 3.1 Base path

Application API endpoints use:

`/api`

Examples:

- `/api/calorie-calculator/calculate`
- `/api/workout-templates`
- `/api/workout-plans`
- `/api/habits`
- `/api/foods`

The exact placement of files in the Next.js App Router must follow the existing repository structure.

### 3.2 HTTP methods

Use standard HTTP methods:

| Method | Purpose |
|---|---|
| `GET` | Read data without changing persistent state |
| `POST` | Create a resource or perform an explicit operation |
| `PUT` | Create or replace a resource at a known identity where appropriate |
| `PATCH` | Partially update an existing resource |
| `DELETE` | Delete a resource or remove a supported association |

Choose methods consistently with each route's documented semantics.

### 3.3 Content type

JSON request bodies must use:

`Content-Type: application/json`

Successful JSON responses must use:

`Content-Type: application/json; charset=utf-8`

An endpoint returning a downloadable file may use an appropriate download content type instead.

### 3.4 Identifiers

Use the UUIDs defined by the database schema for resource identifiers.

Clients must treat IDs as opaque strings. Do not generate an ID from a display name or rely on the current ordering of a catalogue.

Validate path IDs before using them in database operations.

### 3.5 Dates

Represent calendar dates using ISO 8601 date strings:

`YYYY-MM-DD`

For example, `2026-10-10`.

Workout-log dates and habit-completion dates use calendar-date semantics. Do not convert date-only values to timestamps and back in a manner that shifts them into a different day.

Timestamps representing instants must include timezone information.

### 3.6 Units

Use the units defined by the domain and database specifications.

- Weight: kilograms internally.
- Height: centimetres internally.
- Energy: kilocalories.
- Food macros: grams where applicable.

Endpoints accepting alternative display units must validate and normalize them before calculations or persistence.

Do not assume that every food portion can be converted into grams without a supported conversion.

### 3.7 Response status codes

Use appropriate HTTP status codes, including:

| Status | Meaning |
|---|---|
| `200 OK` | Successful read or operation |
| `201 Created` | Resource created |
| `204 No Content` | Successful operation with no response body |
| `400 Bad Request` | Malformed request or invalid request structure |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated identity is not permitted to perform the operation |
| `404 Not Found` | Resource unavailable under the endpoint's documented visibility rules |
| `409 Conflict` | A conflicting state or uniqueness constraint prevents the operation |
| `422 Unprocessable Content` | Well-formed request that violates domain validation |
| `429 Too Many Requests` | Request rate limit exceeded, where rate limiting is enabled |
| `500 Internal Server Error` | Unexpected server failure |

Do not use `200 OK` for an operation that failed. Do not return stack traces or database internals to make errors easier to debug.

For private resources, use a consistent policy that avoids disclosing another user's resource existence.

---

## 4. Authentication and authorization

### 4.1 Authentication method

Use the project's approved Supabase Auth session integration for Next.js.

The application must follow the framework's supported server-side cookie/session handling pattern.

For requests using cookie-based authentication:

- Validate the session on the server.
- Use appropriate cookie security settings in production.
- Protect state-changing requests against cross-site request forgery as required by the chosen authentication pattern.
- Do not assume that the presence of a cookie alone proves a valid user identity.

If the application deliberately supports bearer-token authentication for a particular client, validate the token using the approved Supabase authentication process.

Do not invent a separate application token system unnecessarily.

### 4.2 Protected endpoints

All private feature endpoints require an authenticated session unless an approved product requirement explicitly allows the operation to be public.

The default is that all five primary application features require authentication.

### 4.3 Owner identity

For every private mutation:

1. Validate the session.
2. Obtain the authenticated user ID.
3. Validate the submitted data.
4. Verify resource ownership and parent relationships.
5. Execute the operation using the approved user-scoped database access.
6. Return only the information the user is authorized to access.

A client-submitted `user_id` must never override the validated identity.

### 4.4 Supabase access

Use a server-side Supabase client that respects the authenticated user's authorization and RLS policies for ordinary private-data operations.

Do not use service-role credentials as the default database access method.

If a privileged account-deletion or administrative operation genuinely requires service-role access, isolate that path on the server and enforce the security specification.

### 4.5 Authorization failures

A failed ownership check must not reveal another user's private records.

Use a consistent `403` or `404` behavior according to the endpoint's documented visibility policy.

Do not allow repeated probing of UUIDs to return private record details.

---

## 5. Standard response envelopes

Use the following response conventions for application APIs.

### 5.1 Successful resource response

```json
{
  "data": {
    "id": "resource-uuid",
    "name": "Example"
  }
}
```

The fields inside `data` vary according to the endpoint. The example is illustrative, not a real seeded record.

### 5.2 Successful collection response

```json
{
  "data": [
    {
      "id": "resource-uuid",
      "name": "Example"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

Include collection metadata only when it is accurate and useful. Do not calculate an expensive total merely to populate the envelope.

If pagination is implemented, document the actual pagination contract rather than inventing totals or cursors.

### 5.3 Error response

Use a consistent error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fieldErrors": {
      "ageYears": "Enter a valid age."
    }
  }
}
```

Requirements:

- `code` must be a stable, machine-readable identifier.
- `message` must be safe to display to the user.
- `fieldErrors` is optional and must contain only safe validation feedback.
- Do not include SQL statements, stack traces, session tokens, secret values, or internal database error details.

The implementation may add a documented correlation ID for support and diagnostics.

### 5.4 Error-code consistency

Use a shared error-code catalogue for recurring cases, including:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_ERROR`
- `DOMAIN_RULE_VIOLATION`
- `CONFLICT`
- `INVALID_DATE`
- `INVALID_UNIT`
- `INCOMPLETE_NUTRITION_DATA`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

Do not return an error code that contradicts the HTTP status or actual failure.

---

## 6. Calorie calculator API

### 6.1 Calculate calorie estimates

**Endpoint:** `POST /api/calorie-calculator/calculate`

**Authentication:** Required by default, consistent with the private calculator page.

**Purpose:** Validate calculator inputs and apply the approved calculation rules.

#### Request

```json
{
  "ageYears": 25,
  "height": {
    "value": 180,
    "unit": "cm"
  },
  "weight": {
    "value": 90,
    "unit": "kg"
  },
  "bmrVariant": "plus_5",
  "activityLevel": "moderately_active",
  "goal": "maintain"
}
```

This request illustrates the shape of the input. The selected values are examples, not recommended settings for a real user.

Allowed fields and enumerations must match the approved domain logic.

`bmrVariant` identifies the conventional Mifflin–St Jeor coefficient selection. Its UI wording and selection behavior must be made explicit and must not be inferred from gender identity.

#### Validation

Validate:

- `ageYears`: integer within the documented input range of 18–120.
- Height: positive value with a supported unit and a normalized value within the approved bounds of 100–250 cm.
- Weight: positive value with a supported unit and a normalized value within the approved bounds of 25–350 kg.
- `bmrVariant`: an explicitly supported coefficient option.
- `activityLevel`: an approved activity-level enum.
- `goal`: an approved goal enum.

The documented activity categories correspond to the established multipliers:

- Sedentary: `1.2`
- Lightly active: `1.375`
- Moderately active: `1.55`
- Very active: `1.725`
- Extra active: `1.9`

The documented goals are:

- Weight loss: `-15%`
- Maintenance: `0%`
- Weight gain: `+10%`

The implementation must use the exact approved labels and mappings from `docs/05-domain-logic.md`.

If an under-18 value is submitted, return a safe validation or domain-rule response and do not calculate or return a calorie target.

#### Successful response

```json
{
  "data": {
    "status": "calculated",
    "bmrKcalPerDay": 1905,
    "maintenanceKcalPerDay": 2950,
    "targetKcalPerDay": 2950,
    "units": {
      "energy": "kcal/day",
      "height": "cm",
      "weight": "kg"
    },
    "method": "mifflin_st_jeor",
    "estimateDisclaimer": "This is an estimate, not an individualized medical prescription."
  }
}
```

This response demonstrates a maintenance calculation with one illustrative input set. Actual responses must be calculated from the validated request and approved rounding rules.

#### Target withheld

If a calculation is withheld under an approved domain safeguard, return a response that clearly identifies the withheld result without inventing an alternative target.

Example:

```json
{
  "data": {
    "status": "target_withheld",
    "bmrKcalPerDay": 1500,
    "maintenanceKcalPerDay": 1800,
    "targetKcalPerDay": null,
    "reasonCode": "TARGET_BELOW_APPROVED_MINIMUM"
  }
}
```

This is an illustrative response contract. Use the actual reason-code name approved during implementation.

The documented `1200 kcal/day` guardrail must not silently clamp a lower calculated target to 1200. The corresponding product-owner acceptance remains required before production release, as noted in the domain-logic document.

#### Important requirements

- Do not store a calculation in the user's profile automatically.
- Do not create a calorie-history table unless an approved requirement is introduced.
- Do not expose unsupported target values for under-18 users.
- Do not silently substitute invalid input values.
- Ensure client and server calculations cannot diverge.

---

## 7. Curated workout-template API

### 7.1 List templates

**Endpoint:** `GET /api/workout-templates`

**Authentication:** Required by default.

**Purpose:** Retrieve published workout templates available to the current user.

#### Optional query parameters

- `query`: text search, where supported.
- `page` and `pageSize`: only if the chosen collection-pagination implementation supports them.

Do not introduce multiple pagination conventions across catalogue endpoints.

#### Successful response

```json
{
  "data": [
    {
      "id": "template-uuid",
      "name": "Example Workout Template",
      "description": null,
      "sortOrder": 1
    }
  ]
}
```

The example uses an illustrative name. Production data must come from verified curated content.

Only expose approved templates. Do not return unpublished source content through the public-facing template list.

### 7.2 Retrieve a template

**Endpoint:** `GET /api/workout-templates/{templateId}`

**Purpose:** Retrieve one template and the day/exercise information required to display it.

The response should include, where applicable:

- Template ID and name.
- Source attribution.
- Workout-day ordering.
- Exercise identity and name.
- Entry ordering.
- Source-provided sets and repetitions.
- Source labels and verified video URLs.
- Warm-up information.
- Data fields that legitimately remain null because the source did not provide them.

Example shape:

```json
{
  "data": {
    "id": "template-uuid",
    "name": "Example Template",
    "sourceReference": "Finalized Workout.pdf",
    "days": [
      {
        "id": "template-day-uuid",
        "name": "Source Day Heading",
        "sortOrder": 0,
        "entries": [
          {
            "id": "template-entry-uuid",
            "exerciseId": "exercise-uuid",
            "exerciseName": "Example Exercise",
            "sets": null,
            "reps": null,
            "sourceLabel": null,
            "videoUrl": null,
            "sortOrder": 0
          }
        ],
        "warmups": []
      }
    ]
  }
}
```

The null values illustrate how missing source details must be represented. They are not a claim that any specific source entry has those values.

### 7.3 Validation and visibility

- Validate the UUID.
- Confirm that the template is published.
- Return a consistent not-found response for unavailable templates.
- Preserve source order and optional values.
- Do not fabricate a missing template, prescription, label, warm-up, or video URL.

---

## 8. Personal workout-plan API

### 8.1 List personal plans

**Endpoint:** `GET /api/workout-plans`

Return only workout plans owned by the authenticated user.

The list must not include plans owned by another user or unpublished source templates masquerading as personal plans.

### 8.2 Create a plan

**Endpoint:** `POST /api/workout-plans`

**Request**

```json
{
  "name": "My Workout Plan"
}
```

A plan may be created independently of a source template unless the approved UI explicitly requires a template.

**Success:** `201 Created`.

The response must include the created plan's identifier and saved fields.

### 8.3 Retrieve a plan

**Endpoint:** `GET /api/workout-plans/{planId}`

Return the specified plan with its days and ordered exercise entries.

Before returning data, verify ownership.

Preserve:

- Current user-entered prescriptions.
- Original source prescriptions where supported.
- Source attribution and URLs where available.
- Relevant display snapshots.
- Current plan-day and entry order.

### 8.4 Update a plan

**Endpoint:** `PATCH /api/workout-plans/{planId}`

Use this endpoint to update supported plan-level fields such as the plan name.

Validate all submitted fields. Do not permit changing the plan owner through a request body.

### 8.5 Delete a plan

**Endpoint:** `DELETE /api/workout-plans/{planId}`

Delete only a plan owned by the authenticated user.

Apply the approved database deletion rules for plan days and entries.

**Critical:** Deleting a plan must not delete independent workout-progress history.

Return `204 No Content` after successful deletion, or the documented error response on failure.

### 8.6 Apply a template using Replace or Merge

**Endpoint:** `POST /api/workout-plans/{planId}/apply-template`

**Purpose:** Apply a published template to an existing personal plan.

#### Request

```json
{
  "templateId": "template-uuid",
  "mode": "merge"
}
```

Supported `mode` values:

- `replace`
- `merge`

#### Replace behavior

- Replace the plan's applicable workout content with the selected template content.
- Preserve the intended day order and exercise occurrence order.
- Preserve the source values and source attribution available at copy time.
- Do not modify unrelated plans.
- Do not delete workout-progress history.
- Execute all related database changes atomically.

#### Merge behavior

- Add the selected template content to the intended personal plan.
- Preserve existing user-created content.
- Preserve legitimate repeated exercises on different days.
- Prevent accidental duplicate insertions when an import is retried.
- Execute related changes atomically.

The initial plan-level endpoint uses plan-level semantics. If the product later requires applying a template to only one selected day or section, document that behavior explicitly rather than silently changing this contract.

#### Successful response

Return the updated plan or a documented operation summary, including the resulting plan identifier and applicable day/entry counts.

Do not return success until the transaction completes successfully.

#### Errors

Possible failures include:

- `401` for an unauthenticated request.
- `404` for an unavailable or unauthorized plan/template.
- `422` for invalid mode or domain validation.
- `409` for a conflicting persisted state.
- `500` for unexpected failure.

Use transactional persistence and stable source-occurrence identifiers to prevent accidental duplicate imports. Do not assume that a partially completed sequence of client writes is equivalent to a transaction.

---

## 9. Personal workout-day and exercise-entry API

These endpoints support individual edits to personal plans.

### 9.1 Create a day

**Endpoint:** `POST /api/workout-plans/{planId}/days`

Example request:

```json
{
  "name": "Day 1",
  "sortOrder": 0
}
```

Validate the plan's ownership, day name, and ordering requirements.

### 9.2 Update a day

**Endpoint:** `PATCH /api/workout-plans/{planId}/days/{dayId}`

Support only approved editable fields, such as the day name and order.

Verify that the day belongs to the path's plan and that the plan belongs to the authenticated user.

### 9.3 Delete a day

**Endpoint:** `DELETE /api/workout-plans/{planId}/days/{dayId}`

Delete only the specified day within the authenticated user's plan.

Follow the documented child-entry deletion behavior.

Deleting a day must not delete independent exercise-progress history.

### 9.4 Create an exercise entry

**Endpoint:** `POST /api/workout-plans/{planId}/days/{dayId}/entries`

Example request:

```json
{
  "exerciseId": "exercise-uuid",
  "sets": 3,
  "reps": 12,
  "sortOrder": 0
}
```

The values are illustrative user-entered values, not prescriptions for a specific exercise.

The server must:

- Verify plan ownership.
- Verify that the day belongs to the specified plan.
- Verify that the exercise is valid and available for the intended use.
- Validate sets and repetitions against the domain rules.
- Preserve the correct source/user distinction.
- Reject attempts to reference another user's data through forged identifiers.

When the source does not provide a prescription, the personal entry may contain an approved user-entered value without altering the source catalogue.

### 9.5 Update an exercise entry

**Endpoint:** `PATCH /api/workout-plans/{planId}/days/{dayId}/entries/{entryId}`

Support valid edits to user-configurable fields, such as:

- Sets.
- Repetitions.
- Entry ordering.

Do not allow a normal edit to modify the authenticated owner or replace source provenance improperly.

### 9.6 Delete an exercise entry

**Endpoint:** `DELETE /api/workout-plans/{planId}/days/{dayId}/entries/{entryId}`

Remove the specified exercise occurrence from the personal plan.

The operation must not delete historical workout logs tied to the exercise identity.

### 9.7 Ordering and concurrency

Validate the final persisted order and prevent conflicting updates from leaving duplicate or invalid ordering states.

Where a reorder modifies several entries, use an appropriate transaction.

The API must not require globally unique exercise order across different days.

---

## 10. Workout-progress API

Progress history is independent of the current workout-plan entry.

### 10.1 List exercise history

**Endpoint:** `GET /api/workout-progress`

Supported query parameter:

- `exerciseId` — required for exercise-specific history unless a broader history query is explicitly implemented.
- `from` and `to` — optional ISO date boundaries where date-range filtering is supported.

Validate date boundaries and use one consistent, documented inclusion rule for date ranges.

Return only the authenticated user's logs.

The UI must not lose access to history simply because an exercise is removed from the current workout plan.

### 10.2 Create a progress record

**Endpoint:** `POST /api/workout-progress`

Example request:

```json
{
  "exerciseId": "exercise-uuid",
  "loggedOn": "2026-10-10",
  "setsCompleted": 3,
  "repsCompleted": 10,
  "externalLoad": 20,
  "externalLoadUnit": "kg",
  "isBodyweight": false,
  "notes": null
}
```

This is a structural example, not a training recommendation.

Validate:

- Exercise identity.
- Date format and approved date-domain rules.
- Completed-set and repetition values when present.
- Load and unit compatibility.
- Bodyweight/external-load consistency.
- Note length and accepted text input.

Apply the following established rules:

- An externally loaded exercise requires a valid positive load when a load is recorded.
- A bodyweight record uses `isBodyweight: true` with no external load or external-load unit.
- A record without an external load and not classified as bodyweight has null load and unit values.
- Do not use zero to represent an absent external load.

**Success:** `201 Created`.

### 10.3 Update a progress record

**Endpoint:** `PATCH /api/workout-progress/{logId}`

Allow edits to supported log fields.

Validate the record's ownership before updating it.

Do not permit moving a log to another user through the request.

### 10.4 Delete a progress record

**Endpoint:** `DELETE /api/workout-progress/{logId}`

Delete only a progress record owned by the authenticated user.

Return the documented success response after persistence succeeds.

### 10.5 Progress response contract

Responses should include:

- Log identifier.
- Exercise identifier and an appropriate display name.
- Logged calendar date.
- Recorded measurements.
- Recorded units.
- Applicable bodyweight classification.
- Optional note.
- Relevant creation/modification metadata where needed.

Do not fabricate measurements, missing entries, or historical chart points.

---

## 11. Habit-tracking API

### 11.1 List habits

**Endpoint:** `GET /api/habits`

Return the authenticated user's habits.

Support the approved filter for active or archived habits if needed by the UI.

Use the user's configured timezone when resolving date-dependent display information.

### 11.2 Create a habit

**Endpoint:** `POST /api/habits`

Example request:

```json
{
  "name": "Read for 30 minutes",
  "description": null
}
```

Validate the name and supported fields.

The record owner must come from the authenticated session.

**Success:** `201 Created`.

### 11.3 Update or archive a habit

**Endpoint:** `PATCH /api/habits/{habitId}`

Support approved changes such as name, description, and active/archive status.

Until the habit-history deletion rule is approved, use archiving rather than introducing an unapproved destructive habit-deletion contract.

### 11.4 Retrieve completion history

**Endpoint:** `GET /api/habits/{habitId}/logs`

Return completion dates for the specified habit after checking ownership.

Dates must be represented as `YYYY-MM-DD`.

### 11.5 Mark a date complete

**Endpoint:** `PUT /api/habits/{habitId}/logs/{date}`

Use a known habit and date in the path.

For example:

`PUT /api/habits/{habitId}/logs/2026-10-10`

The handler must:

1. Authenticate the user.
2. Validate the date.
3. Verify that the habit belongs to the user.
4. Apply the approved date and timezone rules.
5. Create the completion record if it does not already exist.
6. Return the documented completed state.

The operation must be retry-safe and must not create duplicate completion rows.

### 11.6 Unmark a completion

**Endpoint:** `DELETE /api/habits/{habitId}/logs/{date}`

Remove the completion record for that habit and date, provided it belongs to the authenticated user.

Do not delete the habit itself.

### 11.7 Streak calculation

Current and longest streaks must use the approved algorithm in `docs/05-domain-logic.md`.

They must be derived from authoritative completion history and consistent timezone/date semantics.

If the API returns precomputed streak fields, use the shared domain logic. Do not create a second implementation of streak rules inside a React component.

---

## 12. Food-catalogue API

### 12.1 Search foods

**Endpoint:** `GET /api/foods`

Supported query parameters may include:

- `query` — search phrase.
- `category` — food category.
- `page` and `pageSize` — if supported by the selected pagination convention.

Validate query length, category, and pagination inputs.

Return only approved, available food records.

### 12.2 Retrieve a food

**Endpoint:** `GET /api/foods/{foodId}`

Return the food's:

- Stable ID.
- Display name and available alternate names.
- Category and relevant preparation state.
- Nutrient values and units.
- Reference quantity and reference unit.
- Source name and source reference.
- Match/approximation status.
- Other data-quality information required by the UI.

Unknown nutrients must remain distinguishable from valid zero values.

### 12.3 Nutrition response example

```json
{
  "data": {
    "id": "food-uuid",
    "name": "Example Food",
    "referenceQuantity": 100,
    "referenceUnit": "g",
    "energyKcal": null,
    "proteinG": 5,
    "carbohydratesG": null,
    "fatG": 2,
    "fibreG": null,
    "sourceName": "IFCT_2017",
    "matchStatus": "needs_review",
    "valueMethod": "source"
  }
}
```

This is an illustrative structure only. It is not a claim about the nutritional composition of a real food or an actual IFCT entry.

### 12.4 Validation and data quality

- Ensure the requested food is available for display.
- Do not expose unreviewed content as verified.
- Do not replace nullable nutrients with zero.
- Do not report an approximate source match as exact.
- Do not invent alternate names or nutrient data.
- Keep source attribution available to the frontend.

---

## 13. Meal-plan API

### 13.1 List personal meal plans

**Endpoint:** `GET /api/meal-plans`

Return meal plans belonging to the authenticated user only.

### 13.2 Create a meal plan

**Endpoint:** `POST /api/meal-plans`

Example request:

```json
{
  "name": "My Meal Plan",
  "targetKcal": 2200
}
```

The example target is illustrative and is not a recommendation.

`targetKcal` is optional if permitted by the approved data model. Validate it against the approved domain rules; do not assume that a saved target is a current medical recommendation.

### 13.3 Retrieve a meal plan

**Endpoint:** `GET /api/meal-plans/{mealPlanId}`

Return the requested user's plan and its ordered meal items.

For each item, provide the referenced food information necessary to display the selection and calculate its nutrition.

### 13.4 Update a meal plan

**Endpoint:** `PATCH /api/meal-plans/{mealPlanId}`

Allow approved plan-level updates such as the name and supported target field.

Do not allow owner reassignment through a request body.

### 13.5 Delete a meal plan

**Endpoint:** `DELETE /api/meal-plans/{mealPlanId}`

Delete the specified user's meal plan according to the approved database deletion rules.

Do not delete curated food records as a side effect.

### 13.6 Add a food item

**Endpoint:** `POST /api/meal-plans/{mealPlanId}/items`

Example request:

```json
{
  "foodId": "food-uuid",
  "mealSlot": "breakfast",
  "quantity": 150,
  "quantityUnit": "g",
  "sortOrder": 0
}
```

This is a structural example only.

Validate:

- Plan ownership.
- Food availability.
- Positive portion quantity.
- Supported meal-slot value.
- Compatible units or a documented conversion.
- Valid entry ordering.

Do not assume that every household measure converts to the same number of grams for every food.

### 13.7 Update a meal item

**Endpoint:** `PATCH /api/meal-plans/{mealPlanId}/items/{itemId}`

Support approved edits to the item quantity, unit, grouping, and order.

The item must belong to the plan in the path, and the plan must belong to the authenticated user.

### 13.8 Remove a meal item

**Endpoint:** `DELETE /api/meal-plans/{mealPlanId}/items/{itemId}`

Remove only the specified item from the user's meal plan.

Do not delete the underlying curated food record.

### 13.9 Nutrition calculation contract

Meal-item, meal, and daily nutrition totals may be calculated in a shared server-side domain service or through a reviewed equivalent implementation.

All calculations must use compatible units and the proper food reference basis.

Where required nutrient data is unavailable:

- Do not treat the unknown value as zero.
- Identify the calculated result as incomplete.
- Preserve approximate-source information.
- Avoid displaying an unsupported exact total.

### 13.10 Calorie-target matching

The acceptable calorie-difference tolerance has not been finalized.

Until the product-owner decision is approved, the API may return a valid calculated difference where the necessary data exists, but it must not claim that a meal plan satisfies an exact matching tolerance.

Do not hardcode an arbitrary tolerance into an endpoint.

---

## 14. User preferences API

### 14.1 Retrieve preferences

**Endpoint:** `GET /api/profile`

Return the authenticated user's permitted application profile and preferences.

Do not return another user's profile or unrelated Auth metadata.

### 14.2 Update preferences

**Endpoint:** `PATCH /api/profile`

Example request:

```json
{
  "timezone": "Asia/Kolkata",
  "preferredWeightUnit": "kg",
  "preferredHeightUnit": "cm"
}
```

Validate the timezone against supported IANA timezone identifiers and units against the approved list.

Do not allow a request to change the profile owner's ID.

The backend must continue using canonical calculation units even if the user changes their display preference.

Do not automatically persist sensitive calculator inputs merely because this endpoint exists.

---

## 15. Export and account deletion

### 15.1 Export personal data

**Endpoint:** `GET /api/account/export`

**Authentication:** Required.

Return an export of the authenticated user's applicable personal data in the approved format, using authenticated-owner-scoped queries.

The export should include the personal records required by the PRD, including relevant:

- Profile preferences.
- Workout plans and exercise configurations.
- Exercise-progress records.
- Habits and completion dates.
- Meal plans and meal items.

The export must be understandable independently of the application where practical. Include relevant identifiers, display snapshots, and measurement units.

Do not include:

- Another user's records.
- Secret keys or authentication tokens.
- Unnecessary internal operational data.
- Privileged database metadata.

The final export format and any additional downloadable-file behavior must follow the approved UI and security specifications.

### 15.2 Delete account

**Endpoint:** `DELETE /api/account`

**Authentication:** Required.

This is a destructive operation and must follow the approved account-deletion flow.

Before deletion:

- Apply the required confirmation and any reauthentication requirements.
- Verify the current authenticated identity.
- Reject attempts to submit another user's identity as the deletion target.
- Ensure the deletion process uses the authorized server-side workflow.

After authorization, delete the account and its user-owned data according to the documented lifecycle for Supabase Auth and the database.

The service-role key, if required for the Auth user-deletion operation, must remain server-only and must be used exclusively inside this authorized code path.

A successful destructive action must not be reported before the required operation succeeds.

If deletion fails partway through a multi-system process, follow the documented failure and recovery strategy rather than pretending all account data was deleted.

Do not delete shared curated exercise, template, or food content when one user deletes their account.

The required reauthentication behavior, deletion confirmation UX, and operational recovery details must follow `docs/10-security-privacy.md` and `docs/12-devops.md`.

---

## 16. Validation rules across endpoints

### 16.1 Strings

- Trim fields where whitespace-only input is invalid.
- Enforce appropriate maximum lengths.
- Reject malformed input rather than silently truncating meaningful data.
- Treat user notes as untrusted text.
- Escape text appropriately when rendering it in the UI.

### 16.2 Numbers

- Reject `NaN`, infinity, invalid numeric types, and unsupported values.
- Validate integer-only fields as integers.
- Validate quantities against the approved positive-value rules.
- Use the domain-specified numerical bounds.
- Do not silently clamp values unless an explicit domain rule requires it.

### 16.3 Enums

Reject unsupported activity levels, goals, units, modes, meal slots, and status values.

Do not treat an unknown value as a default choice.

### 16.4 UUIDs

Validate every path and body UUID before using it to identify a database record.

A syntactically valid UUID does not imply that the requester owns the referenced resource.

### 16.5 Dates and timezones

Use strict ISO date validation for date-only values.

Validate calendar correctness, not just string shape.

Use the approved timezone rules. Do not add unapproved historical or future-date limits.

### 16.6 Relationships

Verify all relevant parent-child relationships before performing a mutation.

For example, a valid meal-item UUID and a valid meal-plan UUID do not prove that the item belongs to that plan.

Enforce these relationships through database constraints and RLS in addition to application checks.

---

## 17. Idempotency and concurrency

### 17.1 Habit completion

Marking a habit complete for an already completed date must not create a second record.

Use the database's unique constraint and a retry-safe operation.

### 17.2 Template application

Replace and Merge must be atomic.

Use stable source-entry identity and the approved database transaction/function to prevent accidental duplicate imports when the request is retried.

Do not claim exactly-once delivery merely because the frontend disables a button while a request is pending.

### 17.3 Other mutations

Where a retry could create duplicate resources or cause a destructive operation to run more than once, define the endpoint's retry behavior explicitly.

Use uniqueness constraints or another reviewed idempotency mechanism where appropriate.

### 17.4 Concurrent edits

If two requests update the same plan or reorder the same entries concurrently, the persisted state must remain valid.

Use transactions, constraints, and appropriate concurrency handling.

Return a conflict response where the intended change cannot safely be applied to the current state.

---

## 18. Rate limiting and abuse protection

Rate limiting must be applied where appropriate to control abusive or unexpectedly expensive operations.

Pay particular attention to:

- Authentication-related flows.
- Repeated calculator requests.
- Repeated failed private-resource requests.
- Account export.
- Account deletion.
- Expensive searches or queries if introduced.

Limits must be configured from an approved policy and suitable deployment capabilities; do not invent a production threshold in the API contract.

When a limit is exceeded, return `429 Too Many Requests` with a safe error response.

For cookie-authenticated state-changing endpoints, apply the security controls appropriate to the chosen Next.js/Supabase session pattern.

Do not expose whether another user's private UUID exists through a rate-limited probing endpoint.

---

## 19. Error handling

### 19.1 Expected failures

Convert expected failures to safe, documented API errors.

Examples include:

- Invalid form input.
- Unsupported units.
- Under-18 calculator requests.
- A withheld calculator target.
- Unavailable source content.
- Missing or unowned personal resources.
- Invalid exercise prescriptions.
- Invalid habit dates.
- Incompatible food quantities.
- Incomplete nutrition data.
- Conflicting plan updates.

### 19.2 Unexpected failures

Unexpected failures must be logged through the approved server-side logging system.

Return a generic `INTERNAL_ERROR` response to the client and a suitable HTTP status.

Never expose stack traces, raw SQL errors, secret configuration, or tokens to a user.

### 19.3 Client feedback

The frontend must distinguish:

- Field-validation feedback.
- Domain-rule warnings.
- Authentication failures.
- Permission failures.
- Missing resources.
- Network failures.
- Unexpected server failures.

Do not display a success notification before the server confirms a successful mutation.

### 19.4 Logging

Logs should support troubleshooting without unnecessarily recording:

- Authentication secrets.
- Full session cookies.
- Passwords.
- Sensitive personal values.
- Full personal notes.
- Complete exported personal datasets.

Where a request or error needs correlation, use a suitable request ID or correlation ID rather than exposing personal data.

---

## 20. API testing requirements

The test plan must verify endpoint contracts as well as database behavior.

### 20.1 Authentication tests

- Unauthenticated requests cannot access protected private endpoints.
- Invalid sessions are rejected.
- Users can access their own records.
- Cross-user requests do not reveal private data.
- A submitted `userId` cannot override the session identity.

### 20.2 Validation tests

- Missing required fields are rejected.
- Unsupported enum values are rejected.
- Invalid units and date strings are rejected.
- Numeric bounds match the domain specification.
- An under-18 calculator request does not produce a target.
- Missing nutrition data remains missing.
- Invalid parent-child combinations are rejected.

### 20.3 Workout tests

- Template reads contain only appropriate published content.
- Source sets, repetitions, labels, and video URLs are preserved.
- Missing source prescriptions are not invented.
- Replace behaves distinctly from Merge.
- Failed template operations do not leave partial state.
- Retries do not create unintended duplicate entries.
- Removing a plan entry does not delete exercise-progress history.

### 20.4 Progress tests

- Logs are returned only for the authenticated owner.
- Exercise history remains available independently of the current plan.
- Invalid load and bodyweight combinations are rejected.
- Date handling follows the approved date-only rules.
- Edits and deletions cannot affect another user's logs.

### 20.5 Habit tests

- Duplicate completion for one habit/date is prevented.
- Unmarking a date removes the intended completion only.
- Streak data follows the documented domain algorithm.
- Archived habits follow the approved visibility behavior.
- Cross-user habit and log access is rejected.

### 20.6 Nutrition tests

- Food search returns only approved records.
- Source names and data-quality statuses are preserved.
- Incompatible units do not produce a fabricated total.
- Unknown nutrients do not become zero.
- Approximate and incomplete results are identified correctly.
- Meal items cannot be added to another user's plan.

### 20.7 Export and deletion tests

- Export contains only the authenticated user's approved personal records.
- Account deletion cannot target a different user.
- Confirmation and reauthentication safeguards are enforced.
- Shared curated content survives individual account deletion.
- Failures are reported accurately and follow the documented recovery process.

---

## 21. Endpoint summary

The initial API surface is summarized below.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/calorie-calculator/calculate` | Calculate approved calorie estimates |
| `GET` | `/api/workout-templates` | List curated templates |
| `GET` | `/api/workout-templates/{templateId}` | Retrieve a curated template |
| `GET` | `/api/workout-plans` | List personal plans |
| `POST` | `/api/workout-plans` | Create a personal plan |
| `GET` | `/api/workout-plans/{planId}` | Retrieve a personal plan |
| `PATCH` | `/api/workout-plans/{planId}` | Update a personal plan |
| `DELETE` | `/api/workout-plans/{planId}` | Delete a personal plan |
| `POST` | `/api/workout-plans/{planId}/apply-template` | Apply Replace or Merge |
| `POST` | `/api/workout-plans/{planId}/days` | Add a personal plan day |
| `PATCH` | `/api/workout-plans/{planId}/days/{dayId}` | Update a personal plan day |
| `DELETE` | `/api/workout-plans/{planId}/days/{dayId}` | Delete a personal plan day |
| `POST` | `/api/workout-plans/{planId}/days/{dayId}/entries` | Add a plan exercise entry |
| `PATCH` | `/api/workout-plans/{planId}/days/{dayId}/entries/{entryId}` | Update a plan exercise entry |
| `DELETE` | `/api/workout-plans/{planId}/days/{dayId}/entries/{entryId}` | Remove a plan exercise entry |
| `GET` | `/api/workout-progress` | Retrieve exercise history |
| `POST` | `/api/workout-progress` | Create a progress log |
| `PATCH` | `/api/workout-progress/{logId}` | Update a progress log |
| `DELETE` | `/api/workout-progress/{logId}` | Delete a progress log |
| `GET` | `/api/habits` | List personal habits |
| `POST` | `/api/habits` | Create a habit |
| `PATCH` | `/api/habits/{habitId}` | Update or archive a habit |
| `GET` | `/api/habits/{habitId}/logs` | Retrieve habit history |
| `PUT` | `/api/habits/{habitId}/logs/{date}` | Mark a date complete |
| `DELETE` | `/api/habits/{habitId}/logs/{date}` | Unmark a completion |
| `GET` | `/api/foods` | Search the food catalogue |
| `GET` | `/api/foods/{foodId}` | Retrieve a food record |
| `GET` | `/api/meal-plans` | List personal meal plans |
| `POST` | `/api/meal-plans` | Create a meal plan |
| `GET` | `/api/meal-plans/{mealPlanId}` | Retrieve a meal plan |
| `PATCH` | `/api/meal-plans/{mealPlanId}` | Update a meal plan |
| `DELETE` | `/api/meal-plans/{mealPlanId}` | Delete a meal plan |
| `POST` | `/api/meal-plans/{mealPlanId}/items` | Add a food item |
| `PATCH` | `/api/meal-plans/{mealPlanId}/items/{itemId}` | Update a food item |
| `DELETE` | `/api/meal-plans/{mealPlanId}/items/{itemId}` | Remove a food item |
| `GET` | `/api/profile` | Retrieve profile preferences |
| `PATCH` | `/api/profile` | Update profile preferences |
| `GET` | `/api/account/export` | Export personal data |
| `DELETE` | `/api/account` | Initiate the approved account-deletion flow |

This is the initial contract inventory. Antigravity must compare it with the existing repository and approved requirements before implementation. Do not add routes merely to increase the endpoint count.

---

## 22. Definition of done

The API specification is ready for implementation when:

1. Every primary feature has a defined data-access contract.
2. Request and response structures are consistent.
3. Private routes validate authentication and resource ownership.
4. Client-submitted identifiers cannot override trusted identity or bypass parent relationships.
5. Domain validation matches the approved domain-logic specification.
6. Replace and Merge use atomic, retry-safe behavior.
7. Exercise progress remains independent of the current plan structure.
8. Habit completion follows date-only semantics and is protected against duplicate records.
9. Food and meal responses preserve source, unit, approximation, and missing-value information.
10. Export and account deletion use the approved privacy and security behavior.
11. Errors are predictable and safe to display.
12. Automated tests cover authorization, validation, transactional behavior, and data integrity.
13. Any unresolved product decision remains explicitly unresolved until approved.
14. The API contract is consistent with Documents 01–08 and the current project repository.

---

## 23. Instructions for Antigravity review

Review this document against Documents 01–08, the current repository, and the actual Supabase schema where available.

Report:

- Contradictions with approved product behavior.
- Missing operations required by existing user stories.
- Endpoint or response fields that conflict with the database schema.
- Security or ownership-check weaknesses.
- Operations that need transactions or idempotent handling.
- Any unresolved behavior that must be approved before implementation.

Do not invent missing requirements, silently change existing domain rules, or begin coding during this review.

**Implementation rule:** The API is not secure merely because a user must sign in. Every private operation must validate input, enforce authorization, preserve domain invariants, and use persistence operations that maintain database integrity.


filename:docs/09-api-spec.md
