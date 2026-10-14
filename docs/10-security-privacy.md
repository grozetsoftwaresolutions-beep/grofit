# 10 — Security and Privacy Specification

**Project:** Tamil Nadu Fitness Companion  
**Document:** Security and Privacy Specification  
**Status:** Ready for Antigravity review  
**Frontend:** Next.js App Router and TypeScript  
**Backend:** Supabase  
**Database:** PostgreSQL with Row Level Security (RLS)  
**Authentication:** Supabase Auth  
**Deployment:** Vercel-compatible Next.js deployment  
**Default timezone:** `Asia/Kolkata`

---

## 1. Purpose

This document defines the security and privacy requirements for the Tamil Nadu Fitness Companion.

The application handles user accounts and private records, including workout plans, exercise-progress history, habits, meal plans, preferences, and calculator inputs. These records must not be exposed to unauthorized users or unnecessarily collected, retained, logged, or shared.

The security design must protect:

1. User authentication and session integrity.
2. Authorization of every private read and mutation.
3. User-owned records through database-level RLS.
4. Database relationships and historical records.
5. API inputs, outputs, and state-changing requests.
6. Secrets, environment configuration, and privileged access.
7. Personal-data export and account deletion.
8. Application logs, errors, and operational diagnostics.
9. Content sources and third-party links.
10. The application against common web vulnerabilities and accidental data exposure.

Security controls must be enforced by the actual application and database, not merely described in documentation.

This specification complements Documents 01–09 and the approved implementation plan.

## 2. Security principles

### 2.1 Deny by default

Access must be denied unless an authenticated user or explicitly authorized application role is permitted to perform the requested operation.

Do not grant access merely because a record ID is difficult to guess.

### 2.2 Defense in depth

Use multiple appropriate controls:

- Authentication.
- Server-side authorization.
- PostgreSQL RLS.
- Database constraints.
- Runtime input validation.
- Secure session handling.
- Secret management.
- Safe output rendering.
- Appropriate monitoring and testing.

No single control replaces the others.

### 2.3 Minimize sensitive data

Collect and retain only the information required by approved product features.

Do not automatically save every calculator input or calculated result to a profile.

Avoid collecting health information, identity details, or other personal information that the app does not need.

### 2.4 Protect historical integrity

Security operations must not silently corrupt workout history, habit records, or other personal data.

Administrative content maintenance must not overwrite private user records.

### 2.5 Transparency

Users must receive clear information about relevant calorie-estimate limitations, food-data uncertainty, account deletion, and data export.

Do not present approximate fitness or nutrition outputs as guaranteed medical advice.

### 2.6 No security through obscurity

Hidden routes, opaque UUIDs, client-side guards, disabled buttons, and undocumented API endpoints are not authorization controls.

### 2.7 Verify rather than assume

Security must be tested with real authorization boundaries, representative malicious requests, database policies, and the deployed configuration.

A feature is not secure merely because it works in a normal browser session.

---

## 3. Threat model

### 3.1 Assets to protect

| Asset | Security concern |
|---|---|
| Authentication sessions | Account takeover and unauthorized access |
| Profile preferences | Disclosure or unauthorized modification |
| Personal workout plans | Cross-user access or destructive modifications |
| Workout-progress logs | Exposure or corruption of private performance history |
| Habits and completion dates | Disclosure or unauthorized changes |
| Personal meal plans | Disclosure or modification by another user |
| Calculator inputs and outputs | Unnecessary collection or disclosure |
| Database credentials | Unauthorized database access |
| Supabase service-role key | Privileged access that may bypass RLS |
| Curated workout and food content | Unauthorized modification or fabricated content |
| Exported personal data | Accidental disclosure or unauthorized downloads |
| Operational logs | Sensitive data leakage |
| Deployed application | Exploitation, abuse, or service disruption |

### 3.2 Trust boundaries

The architecture must distinguish between:

1. The user's browser.
2. Next.js server-side execution.
3. Supabase Auth.
4. PostgreSQL and RLS.
5. Privileged administrative operations.
6. External sites linked from content.
7. Deployment configuration and operational systems.

All data received from a browser must be treated as untrusted, even when the browser is part of the official application.

### 3.3 Principal threats

The implementation and test plan must consider:

- Unauthenticated access to private routes.
- Broken object-level authorization.
- Cross-user data access through manipulated UUIDs.
- Privilege escalation through unsafe server-side code.
- SQL injection.
- Cross-site scripting (XSS).
- Cross-site request forgery (CSRF), where applicable to the chosen session mechanism.
- Leaked environment variables or secret keys.
- Insecure account-deletion behavior.
- Race conditions and partial multi-record mutations.
- Abuse of expensive endpoints.
- Unsafe redirects or untrusted external links.
- Personal information appearing in logs or error messages.
- Malicious or compromised dependencies.
- Misconfigured production environments.
- Unauthorized modification of curated content.

The security implementation must address the threats relevant to the actual framework, authentication configuration, APIs, and deployment.

---

## 4. Authentication

### 4.1 Authentication provider

Use Supabase Auth as the authentication provider.

Do not implement a separate password-storage or token-generation system unless an explicit, reviewed requirement justifies it.

Follow the supported Supabase and Next.js session-handling pattern appropriate to the installed library versions.

### 4.2 Public and private areas

Clearly distinguish public pages from authenticated application pages.

Private application features include:

- Calorie Calculator.
- Workout Plans.
- My Workout Plan.
- Workout Progress.
- Habit Tracker.
- Diet Foods and personal meal-plan management.
- Account settings.
- Personal data export and account deletion.

Follow the approved information architecture for route access and redirect behavior.

### 4.3 Server-side session validation

Every protected server-side operation must validate the current session and establish the authenticated identity using the approved Supabase Auth integration.

Do not trust a client-provided user ID as evidence of identity.

Do not rely solely on:

- Client-side route guards.
- Navigation visibility.
- Local storage.
- A user ID stored in React state.
- A cookie's mere presence without the necessary session validation.

### 4.4 Session handling

Use the official, supported session-management approach for the project's Next.js and Supabase versions.

Requirements:

- Handle expired or invalid sessions consistently.
- Redirect unauthenticated users according to the approved UX.
- Prevent session tokens from appearing in application logs.
- Do not put session credentials in URL query parameters.
- Use appropriate cookie protections in production.
- Keep authentication handling consistent across Server Components, Server Actions, and Route Handlers.

The implementation must not invent a custom token-refresh mechanism if the supported library already handles the required behavior.

### 4.5 Cookie security

For production cookies, use the secure cookie options supported by the selected authentication integration, including `Secure`, `HttpOnly`, and an appropriate `SameSite` policy where applicable.

Follow the integration's requirements for client-accessible authentication cookies rather than indiscriminately changing cookie attributes and breaking authentication.

Use HTTPS in production.

### 4.6 Signup and profile creation

Profile creation must use a controlled, documented workflow.

Do not grant users the ability to create profiles for arbitrary Auth user IDs.

If a database trigger or trusted provisioning process is used, ensure it is scoped to the intended operation and does not introduce an unintended privilege-escalation path.

### 4.7 Authentication failure

A failed authentication check must not expose private data.

Treat missing, expired, and invalid sessions consistently.

Do not reveal whether a different user's private record exists as a side effect of an unauthenticated request.

---

## 5. Authorization and user ownership

### 5.1 General rule

All private data access must enforce this invariant:

**A user may access or modify only records they are authorized to access.**

The authenticated identity is derived from the validated session or database authorization context, not from a request field supplied by the client.

### 5.2 Server-side checks

For every private mutation:

1. Validate authentication.
2. Parse and validate the request.
3. Establish the authenticated user identity.
4. Verify ownership of the target record.
5. Verify ownership and validity of related parent records.
6. Execute the mutation using the approved data-access method.
7. Return only authorized information.

For private reads, verify authorization before returning resource content.

### 5.3 Prevent object-level authorization failures

Do not assume that knowing a valid UUID grants permission to use it.

A user must not be able to:

- Read another user's workout plan by changing `planId`.
- Add an entry to another user's plan by changing `dayId`.
- Read another user's progress by changing `exerciseId` or `logId`.
- Mark another user's habit complete by changing `habitId`.
- Add food items to another user's meal plan.
- Export another user's records.
- Delete another user's account or data.

Every path parameter and related record must be checked against the authenticated owner and the actual database relationships.

### 5.4 Child-resource authorization

Authorization must validate relationships, not just individual IDs.

For example, a workout-plan entry update must verify that:

- The entry exists under the specified day.
- The day belongs to the specified plan.
- The plan belongs to the authenticated user.

Equivalent checks are required for habit logs and meal-plan items.

Implement the relevant composite foreign keys, RLS policies, and server-side checks defined in `docs/08-database.md`.

### 5.5 Ownership immutability

Normal user-facing updates must not permit a record's `user_id` or owner identity to be reassigned.

Reject unexpected ownership fields or ensure they cannot affect the stored owner.

### 5.6 Resource-existence privacy

For private resources, use the documented `403` or `404` behavior consistently.

Do not expose another user's personal record details in authorization errors.

---

## 6. PostgreSQL Row Level Security

### 6.1 Mandatory RLS

Enable and configure RLS for every application table containing private data.

This includes the approved user-owned profile, workout-plan, progress-log, habit, meal-plan, and related child tables.

RLS is required even when all normal requests are expected to pass through Next.js.

### 6.2 User-owned tables

For user-owned records, policies must enforce ownership using the authenticated database identity.

Conceptually:

- Read: the existing row belongs to the authenticated user.
- Insert: the new row's owner is the authenticated user.
- Update: the old row is owned by the authenticated user, and the resulting row remains owned by that user.
- Delete: the existing row is owned by the authenticated user.

Translate these rules into explicit policies for each table and supported operation.

### 6.3 Parent-child constraints

A child record must not reference a parent owned by a different user.

Enforce this through appropriate relationships and constraints in addition to RLS.

For example, a user-owned meal-plan item must not be assigned to another user's meal plan by submitting that plan's UUID.

### 6.4 Curated-content policies

Ordinary authenticated users may read only curated content approved for display.

They must not receive unrestricted INSERT, UPDATE, or DELETE privileges for shared workout or food records.

Publishing, revising, or retiring curated content must use the approved content-maintenance workflow.

### 6.5 Default-deny behavior

For tables using RLS:

- Avoid permissive policies broader than the product requires.
- Do not add a policy that grants general access to solve a single failing query.
- Do not assume a missing policy will protect a table if another permissive policy already grants access.
- Review all applicable policies together.
- Verify effective grants as well as row policies.

### 6.6 Service-role risk

The Supabase service-role key can bypass normal RLS protections.

Therefore, RLS alone is not sufficient to protect data from an incorrectly implemented privileged server operation.

Any operation using elevated privileges must independently validate authorization and follow the approved privileged-access rules.

### 6.7 RLS tests

Test every applicable table using at least two independent authenticated test users.

Verify that unauthorized reads, inserts, updates, and deletes fail at the database boundary, not merely in the UI.

Also verify behavior for anonymous access wherever it should be denied.

---

## 7. Secret management and environment variables

### 7.1 Public versus secret configuration

The application must distinguish public configuration from privileged credentials.

A public Supabase project URL and the appropriate public client key may be available to browser code when required by the selected Supabase setup.

The service-role key and any other privileged secrets must remain server-only.

### 7.2 Prevent browser exposure

Never expose a secret by:

- Prefixing it with `NEXT_PUBLIC_`.
- Importing privileged configuration into a Client Component.
- Returning it from an API response.
- Logging it.
- Including it in rendered HTML.
- Embedding it in a client-side JavaScript bundle.
- Committing it to source control.

Use an appropriate server-only module boundary for code requiring secret credentials.

### 7.3 Environment files

Requirements:

- Commit an `.env.example` containing variable names and safe placeholders only.
- Ensure local environment files containing secrets are excluded from version control.
- Review `.gitignore` after changes to verify the exclusions remain effective.
- Do not put real values into documentation examples, screenshots, or issues.
- Keep production secrets in the approved deployment environment's secret-management facility.

A public placeholder value must never resemble an actual credential in a way that creates confusion.

### 7.4 Separate environments

Keep development, testing, and production environments appropriately separated.

Do not point automated tests at a production database when they can use a controlled test environment.

Do not use real user data unnecessarily in development or test fixtures.

### 7.5 Key rotation

If a secret is exposed, follow the provider's approved revocation or rotation process, remove the exposed value from active configuration, and investigate the affected systems.

Deleting the visible value from the latest Git commit is not sufficient if the secret was already published in repository history or other accessible locations.

---

## 8. API security

### 8.1 Runtime validation

All untrusted requests must be validated on the server.

Validate:

- Request bodies.
- Query parameters.
- Path parameters.
- UUID formats.
- Allowed enums.
- Numeric ranges.
- Units.
- Dates and timezones.
- String lengths.
- Parent-child references.

Use the approved Zod schemas or equivalent runtime-validation mechanisms.

Do not assume that values submitted by a TypeScript frontend are valid.

### 8.2 SQL injection

Use parameterized queries and supported Supabase query builders or appropriately parameterized SQL.

Do not concatenate user-supplied search terms, identifiers, or values into executable SQL.

Where PostgreSQL functions accept parameters, use safe parameter handling and avoid dynamically constructed SQL where it is unnecessary.

### 8.3 Safe database errors

Do not send raw database exceptions to users.

Return documented error codes and safe messages.

Keep sensitive diagnostic information on the server and restrict access to the resulting logs.

### 8.4 Mutation authorization

Every state-changing request must verify authentication and resource ownership.

The UI must not be treated as the security boundary.

Operations involving multiple related rows must use the required database transaction or trusted database function.

### 8.5 CSRF protection

Review CSRF risk based on the actual authentication mechanism.

For cookie-authenticated state-changing endpoints:

- Use the framework's supported safeguards where applicable.
- Validate request origin where appropriate.
- Use correct cookie attributes.
- Introduce CSRF tokens if the chosen session architecture requires them.
- Avoid creating mutations that can be triggered through simple cross-site form submissions.

Do not disable the framework's protections casually or assume that `SameSite` alone is sufficient for every request pattern.

### 8.6 CORS

Do not enable permissive cross-origin access without an explicit need.

If a separate approved client requires cross-origin API access, allow only the intended origins, methods, and headers.

Do not combine wildcard origins with credentialed requests.

### 8.7 Request size limits

Set sensible request-size limits for endpoints accepting text, structured data, or imports.

Reject unexpectedly large requests before performing expensive database work.

The actual limits must follow the endpoint's purpose and hosting constraints rather than an arbitrary universal value.

---

## 9. Browser and interface security

### 9.1 Cross-site scripting

Treat user-controlled and externally sourced text as untrusted.

Use React's normal escaped text rendering and avoid inserting untrusted content as raw HTML.

Do not use unsafe HTML-injection APIs unless a documented requirement exists and the content is sanitized with an appropriate reviewed solution.

Exercise names, notes, food names, source descriptions, and other text must not be able to inject executable scripts into the interface.

### 9.2 External video and source links

Workout video URLs and nutrition-source links must be validated before publication and handled safely when rendered.

Requirements:

- Allow only appropriate protocols, normally HTTPS for external sources.
- Reject executable or unexpected URL schemes.
- Validate curated source URLs through the content-maintenance process.
- Do not construct a URL from arbitrary user input and automatically navigate to it.
- Open new browser tabs safely, using appropriate `rel` attributes when applicable.

A valid URL must not be represented as a verified or endorsed source unless it has actually been reviewed.

### 9.3 Redirect safety

Authentication redirects and post-operation redirects must use approved internal destinations or a strict allowlist.

Do not redirect to an arbitrary URL supplied through an untrusted query parameter.

### 9.4 Sensitive browser storage

Do not store passwords, service-role keys, or privileged access tokens in local storage.

Do not use local storage as the authoritative record of private user-owned data.

Persist data using the approved database and authentication model.

### 9.5 Browser caching

Review whether private responses, account exports, or sensitive pages may be cached.

Use appropriate cache directives and framework behavior to prevent private information from being shared through a cache or incorrectly reused across users.

Do not place personalized responses in a shared cache unless the caching strategy explicitly and safely partitions them.

---

## 10. Privacy and data minimization

### 10.1 Data inventory

The application should collect only data required by its approved functions.

Relevant data categories include:

| Data category | Examples | Privacy requirement |
|---|---|---|
| Account identity | Auth-managed user identity | Protect authentication data |
| Preferences | Timezone and display units | Private to the owner |
| Calculator inputs | Age, height, weight, activity level, goal | Use for the calculation unless persistence is explicitly approved |
| Workout records | Plans, exercise prescriptions, progress logs | Private to the owner |
| Habit records | Habit names and completion dates | Private to the owner |
| Nutrition records | Personal meal plans and portions | Private to the owner |
| Operational diagnostics | Error codes and correlation IDs | Minimize content and restrict access |

### 10.2 Calculator inputs

Do not automatically persist age, height, weight, activity level, or calculator results in the profile merely because the user submits the calculator form.

Persist those values only when an approved feature explicitly requires it and the user-facing behavior is clear.

Do not create a calculation-history feature or database table without an approved requirement.

### 10.3 Health-related interpretation

The app provides general fitness and nutrition estimates, not individualized medical diagnosis or treatment.

Do not infer a medical condition from a user's weight, workout history, diet, or habits.

Do not use private fitness or nutrition data for unrelated purposes without a documented and approved product decision.

### 10.4 Optional information

Keep optional profile information optional.

Do not require additional personal details simply because a framework or authentication provider makes them available.

### 10.5 Future analytics

Any future analytics or behavioral tracking must undergo a separate privacy review.

Do not introduce third-party tracking, advertising pixels, or unrelated data-sharing integrations as part of the initial implementation without an approved requirement.

---

## 11. Data retention and deletion

### 11.1 General retention principle

Retain user-owned information for the supported product purpose and approved retention period.

Do not introduce undocumented indefinite retention rules for personal data, logs, or exports.

Do not assume that deleting a visible UI record automatically removes related records elsewhere.

### 11.2 Individual record deletion

A user's deletion of a personal workout plan must not silently erase independent workout-progress history.

Other resources must follow the parent-child deletion behavior defined in the database specification.

For habits, the retention behavior of completion history following individual habit deletion remains an unresolved product decision.

Until that decision is approved:

- Prefer archiving a habit.
- Preserve its completion history during ordinary habit management.
- Do not introduce destructive deletion behavior with undefined consequences.

### 11.3 Account deletion

Account deletion must follow an explicit, authorized workflow.

The workflow must:

1. Require a clear user-initiated action.
2. Display an understandable description of the consequences.
3. Apply the approved confirmation and reauthentication requirements.
4. Validate the current account identity.
5. Initiate the approved server-side deletion process.
6. Delete the account's user-owned records according to database lifecycle rules.
7. Remove the Auth identity through the authorized integration.
8. Handle failure without falsely claiming that deletion has completed.
9. Avoid deleting shared curated content.
10. Document the behavior of operational logs and backup retention.

The implementation must not report success until the required operations have succeeded according to the approved deletion workflow.

### 11.4 Multi-system deletion

Supabase Auth deletion and application-database cleanup must be designed as one coherent lifecycle, even if the systems cannot participate in a single transaction.

The implementation must address:

- The order of operations.
- Authorization and reauthentication.
- Idempotent retries.
- Partial failure.
- Prevention of continued unauthorized access during deletion.
- Safe recovery or cleanup after an interrupted operation.

Choose and document a concrete strategy before coding this workflow. Do not invent the details during implementation without review.

### 11.5 Backups and operational retention

Database backups and provider-managed recovery mechanisms may have retention behavior separate from ordinary account deletion.

Document the applicable provider and deployment behavior and communicate relevant retention limitations accurately.

Do not claim that all copies of personal data disappear instantly if backups or operational systems retain data under their applicable policies.

---

## 12. User data export

### 12.1 Authorization

An export must include only data that the authenticated user is authorized to access.

Do not trust a submitted user ID to choose the export owner.

### 12.2 Data scope

The export must follow the approved product requirements and include the applicable personal information, including:

- Profile preferences.
- Personal workout plans and their configured entries.
- Exercise-progress history.
- Habits and completion dates.
- Personal meal plans and meal items.

Include enough names, identifiers, units, and relationships to make the exported personal records understandable.

Curated public content need not be duplicated wholesale unless a documented requirement makes it necessary to interpret a personal record.

### 12.3 Download security

- Require authentication before generating the export.
- Prevent other users from retrieving the generated file.
- Use appropriate response headers for a private download.
- Avoid placing personal data in public object storage.
- Avoid logging the complete exported data.
- Do not leave exports publicly accessible after generation.
- Ensure export requests cannot target another user's records.

If temporary export files are introduced, the implementation must specify their location, access controls, expiration, cleanup, and deletion behavior before using them.

### 12.4 Successful export feedback

Do not report a successful export until the file or response has been generated and made available according to the documented workflow.

Handle failures safely and avoid exposing internal database details.

---

## 13. Authentication and account lifecycle security

### 13.1 Sign-in and sign-out

Use Supabase Auth's supported operations.

Sign-out must clear or invalidate the applicable session according to the supported integration.

After sign-out, private routes and data-access operations must not continue to authorize the old session.

### 13.2 Reauthentication for sensitive actions

Require the approved stronger verification or recent authentication for security-sensitive operations where appropriate, particularly account deletion and other destructive account actions.

Define the actual reauthentication mechanism based on the configured Supabase Auth providers and supported application behavior.

Do not introduce a custom password collection or insecure verification shortcut.

### 13.3 Password and recovery flows

If password-based authentication or recovery is enabled:

- Use the provider's supported mechanisms.
- Do not log submitted passwords.
- Do not include passwords in application database records.
- Use safe recovery redirects.
- Avoid revealing account information through overly detailed recovery responses where that would create a security risk.

The exact enabled authentication methods must match the approved account UX and provider configuration.

### 13.4 Account takeover response

Provide an operational procedure for responding to suspected account compromise.

The procedure should cover session invalidation where supported, credential or provider recovery, investigation of affected records, and communication through the approved support process.

Do not promise capabilities that the selected authentication configuration does not support.

---

## 14. Curated-content security and integrity

### 14.1 Restricted writes

Ordinary users must not be able to update shared exercises, templates, warm-ups, or food-nutrition records.

Use the reviewed seed, migration, or administrative workflow for curated content changes.

### 14.2 Source verification

Content imported from `Finalized Workout.pdf`, IFCT 2017, or USDA FoodData Central must preserve appropriate provenance.

Do not turn a missing value into an invented value to satisfy a database constraint.

Do not allow unsupported workout or nutritional content to be published as verified.

### 14.3 Repeatable seeding

Seed operations must be designed to avoid unnecessary duplicates and must not reset private user-owned records.

Test seed operations against a controlled database before relying on them in deployment workflows.

### 14.4 Source URL handling

Validate external URLs before making them available as clickable links.

Reject unsafe protocols and do not assume that an arbitrary external domain is trustworthy.

Do not automatically fetch arbitrary user-submitted URLs from the server unless an explicit, reviewed feature requires it.

This restriction helps prevent server-side request forgery and unauthorized access to internal network resources.

### 14.5 Administrative operations

If an administrative content-management capability is added, define its authentication, authorization, and audit requirements separately.

Do not expose an administrative mutation endpoint simply because content updates need to be possible.

---

## 15. Security headers and browser protections

Configure suitable production security headers for the actual application's behavior.

Review the following controls:

- Content Security Policy (CSP).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy`.
- An appropriate frame-embedding policy, such as `frame-ancestors` in CSP.
- HSTS where the production domain is HTTPS-only and the deployment configuration supports it safely.
- Suitable cookie security attributes.

### 15.1 Content Security Policy

Introduce a CSP compatible with the application's actual scripts, styles, authentication flow, charts, and permitted external resources.

Prefer restrictive policies and avoid broad `unsafe-eval` or overly broad external-source allowances without a justified need.

Test the policy in the actual deployment environment before enforcing it if existing framework behavior requires adjustment.

Do not treat the presence of a CSP header as proof that the application is secure.

### 15.2 Framing

Prevent unauthorized embedding of private application pages where appropriate.

Choose a policy compatible with any explicitly required authentication or hosting integrations.

### 15.3 Referrer policy

Avoid unnecessarily sharing path or query information with external sites.

The policy should be appropriate for an authenticated application that may link to third-party exercise or nutrition sources.

### 15.4 Transport security

Use HTTPS for production traffic and external source links.

Do not weaken transport-security settings to work around an improperly configured production environment.

---

## 16. Rate limiting and abuse protection

Rate limiting and abuse controls must be introduced for endpoints where excessive requests could threaten availability, disclose information through probing, or create disproportionate processing costs.

Consider:

- Authentication-related operations.
- Repeated failed authorization attempts.
- Calculator endpoints.
- Expensive searches.
- Repeated template-application requests.
- Account export.
- Account deletion.
- Any newly added costly processing operation.

### 16.1 Policy

The actual thresholds and enforcement mechanism must be chosen based on the endpoint's behavior, the hosting environment, and the approved product requirements.

Do not invent universal request limits in this specification.

### 16.2 Safe rejection

Return a suitable `429 Too Many Requests` response when an applicable limit is exceeded.

Do not reveal private record existence or sensitive user information through the rate-limit response.

### 16.3 Mutation safety

Rate limiting does not replace authorization, uniqueness constraints, or transactions.

A request that is permitted by rate limits must still undergo all normal validation and ownership checks.

---

## 17. Logging, monitoring, and incident response

### 17.1 Privacy-conscious logs

Log useful operational information without collecting unnecessary personal data.

Prefer recording:

- Timestamp.
- Operation category.
- Safe error code.
- Request or correlation ID.
- Relevant non-sensitive system context.
- Whether a protected operation failed or succeeded, where appropriate.

Avoid logging:

- Passwords.
- Authentication tokens.
- Session cookies.
- Service-role keys.
- Full personal exports.
- Unnecessary calculator inputs.
- Full workout notes or other personal free-text content.
- Raw request bodies containing personal information.

### 17.2 Error messages

User-facing error messages must remain safe.

Server-side diagnostic details must be accessible only through appropriately restricted operational systems.

Do not expose SQL statements, stack traces, credentials, or internal infrastructure details in normal responses.

### 17.3 Monitoring

Use monitoring that is proportionate to the application's size and risk.

Detect and investigate relevant patterns such as repeated authorization failures, unexpected server errors, abnormal mutation attempts, and suspicious export or deletion requests.

Do not introduce unnecessary third-party tracking simply to obtain monitoring data.

### 17.4 Incident response

Maintain a documented response process for:

- Exposed secrets.
- Suspected unauthorized account access.
- RLS or authorization defects.
- Accidental personal-data disclosure.
- Compromised dependencies.
- Database permission misconfiguration.

The response process should identify:

1. How to contain the issue.
2. Which credentials or sessions may require revocation.
3. How to assess affected data and users.
4. How to preserve appropriate operational evidence.
5. How to correct the root cause.
6. How to verify the fix.
7. How to satisfy applicable communication and legal obligations.

Do not assert a particular legal notification deadline without verifying which requirements apply to the actual service and jurisdiction.

---

## 18. Dependency and supply-chain security

### 18.1 Package management

Use the repository's established package manager and lockfile.

Do not introduce unreviewed packages merely to duplicate functionality already available in the stack.

Prefer supported packages from reputable maintainers and review their relevant permissions, maintenance state, and security implications.

### 18.2 Dependency updates

Review security advisories and dependency vulnerabilities using appropriate tools.

Prioritize actionable vulnerabilities affecting packages and code paths actually used by the application.

Test updates before deploying them.

Do not perform unnecessary major-version upgrades during feature implementation without a documented reason.

### 18.3 Build integrity

The application must pass the approved build, type-checking, linting, and security-related checks before deployment.

Do not suppress build failures or TypeScript errors solely to force deployment.

Do not commit generated secrets, temporary exports, local database files containing private data, or credentials.

---

## 19. Deployment and environment security

### 19.1 Environment separation

Use the appropriate Supabase and deployment configuration for development, testing, and production.

Test destructive migrations, content imports, and account deletion against non-production data before production use.

### 19.2 Production access

Restrict who can access production configuration, privileged credentials, and database administration capabilities to the level appropriate for the project.

Do not embed administrative database access in end-user pages.

### 19.3 Migration security

Review database migrations for:

- Accidental public access.
- Missing RLS.
- Overly broad grants.
- Incorrect ownership relationships.
- Unsafe functions or privileged execution.
- Unintended cascades.
- Destructive data changes.
- Exposure of sensitive records.

Deploy application changes and database migrations in a controlled order compatible with the new and existing application code.

### 19.4 Production data

Do not use production personal data as a default development fixture.

If production data is needed for a specific diagnostic process, require a separately approved, appropriately controlled procedure and minimize the data exposed.

### 19.5 Backup and recovery

Document the database backup and recovery capabilities available through the chosen Supabase configuration and deployment arrangement.

Test appropriate recovery procedures without unnecessarily exposing user data.

Do not claim backup or point-in-time recovery capabilities unless they are actually enabled for the selected plan and configuration.

---

## 20. Security testing requirements

Security testing must be conducted against the actual authorization and persistence boundaries.

### 20.1 Authentication

- Unauthenticated users cannot access private data.
- Expired sessions do not authorize protected operations.
- Sign-out prevents continued use of an invalidated session.
- Sensitive operations follow approved reauthentication rules.

### 20.2 Cross-user isolation

Use two separate test users and verify that one cannot:

- Retrieve the other's plans.
- Modify or delete the other's workout entries.
- Read the other's progress logs.
- Read or modify the other's habits and logs.
- Read or modify the other's meal plans.
- Export the other's records.
- Delete the other's account.
- Change ownership by submitting another user's ID.

### 20.3 Database security

- RLS is enabled for all required tables.
- Anonymous access is rejected wherever prohibited.
- Cross-user parent-child references are rejected.
- Curated content cannot be modified by ordinary users.
- Privileged code paths validate authorization independently.
- Database constraints prevent invalid records even when application validation is bypassed.

### 20.4 Input and browser security

Test for:

- Malformed and unexpected input.
- SQL injection attempts.
- Script injection in free-text fields.
- Unsafe URL schemes.
- Unsafe redirects.
- Oversized requests.
- Relevant CSRF scenarios.
- Incorrect cross-origin access.
- Accidental caching of private content.

### 20.5 Data lifecycle

- Export returns only the authorized user's records.
- Failed account deletion does not falsely report completion.
- Successful account deletion follows the approved record lifecycle.
- Shared source content survives individual user deletion.
- Workout logs survive personal plan changes.
- Habit-history behavior follows the explicitly approved retention policy.

### 20.6 Secret exposure

Inspect the repository, client bundle, deployment configuration, logs, and API responses for unintended secret exposure.

Use placeholders in tests and documentation.

A test report must distinguish checks actually performed from checks that remain unverified.

---

## 21. Open decisions and required approvals

The following matters must be resolved through the appropriate product, domain, security, or operations review rather than guessed during coding:

1. **Calorie guardrail:** The documented minimum target of `1200 kcal/day` requires product-owner acceptance before production release. It must not silently clamp a lower calculated result.
2. **Habit-history retention:** The behavior of an individual habit's completion history following habit deletion has not been finalized.
3. **Account-deletion recovery:** The final strategy for coordinating Auth deletion and database cleanup must be documented and tested.
4. **Reauthentication:** The exact supported mechanism for sensitive account actions must match the enabled authentication providers.
5. **Operational retention:** Actual log and backup retention behavior must be verified against deployment configuration and applicable requirements.
6. **External monitoring:** Any new third-party monitoring or analytics service requires review of its data collection and access implications.

These open decisions do not justify leaving basic authentication, user isolation, secret protection, or RLS unimplemented.

---

## 22. Definition of done

The security and privacy specification is ready for implementation when:

1. Every private operation enforces the authenticated identity.
2. User-owned data is protected by appropriate RLS policies.
3. Child-resource authorization verifies parent ownership.
4. Curated content cannot be modified through unrestricted user access.
5. Privileged credentials remain server-only.
6. Input validation, safe errors, and appropriate browser protections are implemented.
7. Session handling and state-changing requests follow the chosen authentication pattern securely.
8. Personal data is collected and logged only as needed.
9. Export and account deletion follow approved authorization and retention rules.
10. Workout history and other required records survive unrelated modifications.
11. Rate limiting, monitoring, and dependency checks are appropriate to the deployment.
12. Security tests verify effective controls rather than just the appearance of protected UI.
13. Unresolved product and operational decisions are visible and tracked.
14. The implemented behavior is consistent with Documents 01–09.

---

## 23. Instructions for Antigravity review

Review this document against Documents 01–09, the current repository, the configured Supabase project, and the actual deployment setup where available.

Report:

- Missing or overly permissive RLS policies.
- Cross-user access risks.
- Privileged operations that lack independent authorization checks.
- Secret-exposure risks.
- Unsafe account-deletion or export behavior.
- Conflicts with existing authentication and session handling.
- Data-retention assumptions that are not verified.
- Security requirements that cannot be confirmed from the current repository.

Do not claim a security control is verified merely because a document describes it. Distinguish documented intent from implemented and tested behavior.

Do not introduce unnecessary infrastructure or weaken existing security controls to make implementation easier.

**Implementation rule:** Security must be enforced at the server and database boundaries. A user interface that looks private does not prove that its underlying data is private.


filename:docs/10-security-privacy.md
