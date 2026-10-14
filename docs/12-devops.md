# 12 — DevOps and Deployment Specification

**Project:** Tamil Nadu Fitness Companion  
**Document:** DevOps and Deployment Specification  
**Status:** Ready for Antigravity review  
**Application:** Next.js App Router, React, TypeScript  
**Database and authentication:** Supabase  
**Deployment target:** Vercel-compatible Next.js hosting  
**Version control:** Git  
**Default timezone:** Asia/Kolkata

---

## 1. Purpose

This document defines the development workflow, environment configuration, database migration strategy, content seeding, automated quality checks, deployment process, monitoring, backup considerations, and recovery procedures for the Tamil Nadu Fitness Companion.

The goal is to make development and deployment repeatable without exposing credentials, losing user data, or introducing unreviewed changes into production.

The deployment workflow must support:

1. Local development.
2. Controlled database migrations.
3. Repeatable workout and food content seeding.
4. Automated quality checks.
5. Preview deployments where supported.
6. Production deployment.
7. Secure environment-variable management.
8. Error monitoring and operational diagnostics.
9. Database backup and recovery planning.
10. Safe rollback and incident response.

This document complements Documents 01–11 and the approved implementation plan.

## 2. DevOps principles

### 2.1 Reproducible environments

A developer should be able to set up the application from the repository and its documented configuration without relying on undocumented local changes.

### 2.2 Controlled database changes

Database schema changes must be version controlled, reviewed, and applied through a repeatable migration process.

Do not make undocumented production-only schema modifications.

### 2.3 Protect production data

Development scripts, test fixtures, content seeds, and reset commands must not accidentally delete or overwrite production user data.

### 2.4 Fail early

Run type checking, linting, tests, and production builds before deployment.

A deployment must not be considered successful merely because the source code was uploaded.

### 2.5 Secrets stay secret

Privileged credentials must remain in approved secret-management facilities or local environment files excluded from Git.

Never expose a Supabase service-role key through browser code or a publicly accessible build artifact.

### 2.6 Observable and recoverable systems

Operational failures must produce enough safe diagnostic information to investigate them without unnecessarily logging personal data.

Define recovery procedures before relying on destructive migrations, account deletion, or production content changes.

### 2.7 Do not invent deployment capabilities

Verify the capabilities available in the actual Vercel and Supabase projects. Do not claim that backups, preview databases, monitoring, or recovery features are enabled merely because the provider may offer them.

---

## 3. Environments

Use clearly separated configurations for local development, automated testing, previews, and production.

| Environment | Purpose | Data policy |
|---|---|---|
| Local development | Feature development and debugging | Disposable or development-only data |
| Automated testing | Repeatable unit, integration, and security tests | Controlled fixtures and isolated test data |
| Preview deployment | Review changes before production | Non-production configuration and safe test data |
| Production | Real application use | Protected user data and controlled migrations |

Not every environment must have a separate Supabase project if the project arrangement is constrained, but database separation must be evaluated carefully.

At minimum, destructive automated tests must never run against the production database.

### 3.1 Environment separation requirements

- Use the correct Supabase project URL and public client key for each environment.
- Keep service-role credentials server-only.
- Prevent preview branches from automatically mutating production user data.
- Avoid using real user data as development fixtures.
- Ensure migrations and seeds target the intended database.
- Verify the target environment before any destructive command.
- Do not reuse production secrets in local examples, test fixtures, or public documentation.

### 3.2 Environment naming

Use clear environment labels in the deployment platform and documentation.

Do not rely only on an engineer's memory to distinguish production from development.

---

## 4. Local development setup

### 4.1 Repository prerequisites

Before modifying the project, inspect:

- The existing `package.json`.
- The lockfile and package manager.
- The installed Node.js version requirements.
- The Next.js and Supabase dependency versions.
- Existing environment-variable conventions.
- Existing Git branches and uncommitted changes.
- Existing database migrations and test scripts.

Do not create a second Next.js application or replace established configuration without an identified requirement.

### 4.2 Initial setup workflow

The documented setup process should follow this sequence:

1. Obtain the project repository.
2. Check out the intended development branch.
3. Install dependencies using the repository's existing package manager.
4. Configure local environment variables.
5. Start the approved local application and database environment.
6. Apply the required database migrations to the intended development database.
7. Seed the approved curated content.
8. Run type checking, linting, and relevant tests.
9. Start the Next.js development server.
10. Verify authentication and the primary feature routes.

Use the actual scripts and package commands present in the repository. Do not document a command as available until it exists and has been verified.

### 4.3 Environment example file

Maintain an `.env.example` containing the names and descriptions of required variables, using safe placeholders only.

Potential configuration categories include:

| Variable category | Exposure | Purpose |
|---|---|---|
| Supabase project URL | Public where required | Identifies the configured Supabase project |
| Supabase public client key | Public where required | Browser-compatible Supabase access |
| Supabase service-role secret | Server-only | Restricted privileged operations, only when required |
| Optional monitoring configuration | Depends on integration | Approved operational monitoring |
| Test configuration | Test environment only | Isolated automated testing |

Use the actual environment-variable names required by the installed libraries and existing project.

Do not add monitoring credentials or privileged variables if the corresponding feature is not required.

### 4.4 Local secrets

- Keep local `.env` files containing credentials out of source control.
- Confirm that `.gitignore` covers the actual secret-bearing files.
- Never place real credentials inside source files or Markdown documentation.
- Do not commit a populated local database file containing personal data.
- If a secret is accidentally committed, treat it as exposed and follow the rotation procedure.

### 4.5 Running locally

The application should run through the repository's documented development command.

During development, verify that:

- The server starts without fatal errors.
- Required environment variables are validated.
- Authentication operates against the intended Supabase project.
- Protected routes behave correctly.
- Database mutations reach the intended database.
- Missing configuration produces an actionable error rather than an obscure runtime failure.

Do not use production credentials simply to avoid configuring the local environment.

---

## 5. Git and change-management workflow

### 5.1 Version control

Track application source, tests, documentation, database migrations, and approved seed scripts in Git.

Do not commit:

- Actual secret values.
- Local session files.
- Personal export files.
- Temporary debugging artifacts containing sensitive information.
- Generated files that the repository intentionally excludes.
- Unreviewed database dumps containing personal data.

### 5.2 Branches

Use the repository's established branch strategy.

Keep feature development separate from protected production branches where the project's workflow supports it.

Before switching branches or applying large changes, inspect the Git working tree to avoid overwriting unrelated work.

### 5.3 Pull requests or equivalent reviews

Before merging significant changes, review:

- The functional behavior.
- Database migrations.
- RLS policies.
- Input validation and authorization.
- Added or changed dependencies.
- Secret exposure.
- Test coverage.
- Documentation updates.
- Deployment implications.

A review must consider security and database effects, not merely whether the UI looks correct.

### 5.4 Documentation consistency

When an approved schema, route, or domain rule changes, update the corresponding documentation.

Do not let implementation details silently diverge from the approved API, database, security, or domain-logic contracts.

---

## 6. Database migrations

### 6.1 Version-controlled schema

All schema changes must have a recorded migration.

Migrations must define changes to:

- Tables and columns.
- Primary and foreign keys.
- Check and uniqueness constraints.
- Indexes.
- RLS enablement and policies.
- Database functions and triggers, where approved.
- Relevant permissions and grants.

Do not treat a manually edited production schema as the authoritative definition.

### 6.2 Migration workflow

Use the project's established Supabase migration tooling and workflow.

The process should be:

1. Develop the schema change in a controlled environment.
2. Create a migration with a clear purpose.
3. Review the SQL for integrity, security, and deletion effects.
4. Apply it to the local or designated development database.
5. Run the relevant schema, RLS, and integration tests.
6. Inspect its effects on existing data where applicable.
7. Apply it to the preview or staging environment when available.
8. Apply it to production through the approved deployment process.
9. Verify the resulting schema and application behavior.
10. Record the migration outcome.

Use the installed Supabase CLI and its current supported commands. Antigravity must inspect the actual project before choosing exact command syntax.

### 6.3 Migration ordering

Keep migrations ordered and reproducible.

A fresh development database and an existing database applying the complete migration history should converge on the intended schema, subject to the documented baseline and versioning process.

Do not edit an already-applied migration as if it had never run without following an explicit correction strategy.

### 6.4 Destructive migrations

Treat operations such as these as high risk:

- Dropping columns or tables.
- Changing column types.
- Removing foreign keys.
- Changing `ON DELETE` behavior.
- Deleting source content.
- Weakening or removing RLS policies.
- Backfilling personal data.
- Changing ownership relationships.

Before a destructive migration:

1. Confirm the requirement.
2. Inspect affected records and dependencies.
3. Establish a suitable backup or recovery point based on actual platform capabilities.
4. Test the migration against representative data.
5. Define the recovery procedure.
6. Obtain the necessary review.
7. Confirm the target environment before execution.

Do not make destructive schema changes to solve an ordinary UI bug.

### 6.5 Backward-compatible deployment

When schema changes can break the currently deployed application, use a staged migration where practical.

For example, introduce a new compatible field, migrate or backfill required data, update application code, and remove an obsolete field only after the dependency has been safely eliminated.

The exact migration strategy must suit the actual change. Do not force unnecessary complexity onto simple additive migrations.

### 6.6 Migration failure

If a production migration fails:

- Stop automatic retries when repeating the operation could cause additional damage.
- Capture safe diagnostics.
- Determine whether the migration partially changed the database.
- Inspect the actual schema and data before retrying.
- Follow the tested correction or recovery procedure.
- Verify both database integrity and application behavior afterward.

Do not blindly delete migration history or execute guessed SQL in production.

---

## 7. Content seeding

### 7.1 Seed responsibilities

The content-seeding process populates the initial curated content required by the application, including:

- Source workout exercises.
- Workout templates and days.
- Template exercise entries.
- Available warm-up content.
- Approved food records.
- Nutrition source metadata.

The verified source workout file is `Finalized Workout.pdf`.

Nutritional content must follow `docs/06-content-spec.md`, using IFCT 2017 as the preferred source and USDA FoodData Central as the documented fallback where appropriate.

### 7.2 Repeatable seeding

Seed scripts must be safe to run more than once.

Use stable content identifiers or source keys to recognize existing records.

A repeated seed execution must not create uncontrolled duplicates or reset user-owned data.

### 7.3 Source fidelity

Do not seed invented:

- Exercise prescriptions.
- Video URLs.
- Source labels.
- Warm-up details.
- Food nutrient values.
- Source references.

Preserve unset source values as missing where appropriate.

Do not create an unverified Upper/Lower Template B.

### 7.4 Seed execution environments

Seed scripts must clearly distinguish their permitted targets.

Development test fixtures may be reset where the target has been positively identified as a disposable test database.

Production content updates must use a controlled, reviewable process that preserves user-owned records.

Do not use an unconditional database reset as a production seeding strategy.

### 7.5 Seed validation

Before a seed release, verify:

- Expected source records exist.
- Day and exercise ordering is correct.
- Source attribution is preserved.
- Nullable source prescriptions remain nullable.
- Food reference quantities and units are valid.
- Nutrient values are not silently fabricated.
- RLS does not expose unpublished content.
- Re-running the seed creates no unintended duplicates.
- Existing personal records remain intact.

Record any unverified content as a review item instead of declaring the entire dataset verified.

---

## 8. Automated quality checks

### 8.1 Required checks

The project must have a documented and reproducible way to run the applicable checks:

- TypeScript type checking.
- Linting.
- Unit tests.
- Component tests where configured.
- Integration tests.
- Database and RLS security tests.
- Critical end-to-end tests.
- Production build.
- Applicable dependency and secret-exposure checks.

The actual commands must be derived from the repository's installed dependencies and scripts.

### 8.2 Continuous integration

Where the chosen repository platform supports CI, configure an automated workflow for relevant changes.

The workflow should perform the applicable static-quality checks and tests before changes are accepted.

For database-dependent tests, use an isolated test database or another explicitly controlled environment.

Do not expose production secrets to ordinary pull-request checks.

### 8.3 Test failure handling

A failing critical test must not be ignored just to allow a deployment.

If a test is unreliable or blocked by an external dependency:

1. Determine the reason.
2. Separate a genuine application defect from an infrastructure issue.
3. Document the limitation.
4. Correct or quarantine the test through a reviewed process.
5. Do not describe an unexecuted test as passing.

### 8.4 Build verification

A successful development server start is not proof that a production build will succeed.

Run the actual production build before release and resolve relevant TypeScript, rendering, routing, and configuration errors.

Do not suppress errors broadly to force a build through.

---

## 9. Supabase operational configuration

### 9.1 Project configuration

Document the project URL and public-key configuration for each environment.

Privileged secrets must remain server-only.

Verify that the application points to the intended Supabase project before executing migrations, seeds, or destructive operations.

### 9.2 Authentication configuration

Validate the authentication provider configuration for the deployed application.

Review:

- Site URL.
- Permitted redirect URLs.
- Production domain.
- Preview-domain requirements, if applicable.
- Cookie and session behavior.
- Recovery redirects when those flows are enabled.

Do not allow open redirects through arbitrary user-supplied destinations.

Exact settings must be verified in the actual Supabase project, not assumed from the documentation.

### 9.3 Database access

Use the approved authenticated user-scoped database access for ordinary private operations.

Confirm that RLS is enabled and tested on required tables.

Do not use service-role credentials as a general workaround for a failed user-scoped query.

### 9.4 Connection and capacity considerations

Keep database access compatible with the hosting and Supabase configuration.

Inspect actual query behavior and resource limits when performance issues arise.

Do not introduce a separate database connection-management layer unless the chosen deployment model requires it.

---

## 10. Preview and production deployments

### 10.1 Preview deployments

Where supported, use preview deployments to review changes before production release.

Preview environments should use their intended configuration and should not automatically run destructive operations against production.

Preview-specific authentication redirects must be configured deliberately.

Do not assume a preview URL is authorized by Supabase merely because the application deploys successfully.

### 10.2 Production environment variables

Configure required environment variables in the production deployment environment.

Before releasing, verify:

- All required variables exist.
- Public and server-only variables are correctly classified.
- Secret values are not logged or included in browser output.
- The Supabase project matches the intended production environment.
- Authentication redirects match the production domain.
- Any optional integrations are configured only when they are enabled.

Never paste production secrets into public build logs or support discussions.

### 10.3 Production build

Before deployment, confirm that the production build completes successfully using the production-compatible configuration.

If build-time configuration differs from runtime configuration, validate both.

Do not allow the production build to silently fall back to an unintended Supabase project.

### 10.4 Deployment sequence

Use this general release sequence:

1. Review the proposed change.
2. Run required automated quality checks.
3. Review relevant database migrations and content changes.
4. Verify the target environment.
5. Apply approved backward-compatible migrations as required by the release plan.
6. Deploy the corresponding application code.
7. Run safe post-deployment verification.
8. Verify authentication and RLS-dependent access.
9. Verify the affected feature workflows.
10. Record the outcome and any follow-up defects.

The precise order may need adjustment when a specific database or application change requires an established compatibility strategy. Document such exceptions before executing them.

### 10.5 Production verification

After deployment, verify representative critical workflows:

- Application availability.
- Sign-in and protected-page access.
- Calorie calculator behavior.
- Workout-template retrieval.
- Personal-plan persistence.
- Exercise-progress history.
- Habit completion.
- Food search and portion calculation.
- Any modified export, deletion, or privileged operation.

Run destructive account-deletion checks only against dedicated test accounts in a safe environment, not against real customer accounts.

---

## 11. Database backups and recovery

### 11.1 Verify actual backup capabilities

Determine which backup, restore, and point-in-time recovery capabilities are available in the chosen Supabase project and plan.

Document the settings actually enabled.

Do not claim that a backup or recovery feature is available or active without verifying the project's configuration.

### 11.2 Recovery objectives

Define reasonable recovery objectives appropriate to the application's size and risk.

These should identify:

- How much recent data loss could be tolerated.
- How quickly the app should be restored after a serious failure.
- Which data and services must be restored first.
- Who is responsible for authorizing the recovery.

Do not invent numerical recovery commitments before the project owner establishes them and confirms that the infrastructure can support them.

### 11.3 Recovery testing

Where backup and restore capabilities are available:

- Document the recovery procedure.
- Test restoration in a non-production environment where possible.
- Verify the schema and data after restoration.
- Validate authentication relationships and RLS policies.
- Confirm that the restored app can access the expected records.
- Document any provider-specific limitations.

A configured backup is not proof that restoration will succeed.

### 11.4 Migration recovery

A failed or destructive database migration may require a different recovery strategy from a general database outage.

Prefer an explicit corrective migration when it is safe and appropriate.

Use a backup restore only after evaluating its effect on changes made since the backup and the possibility of data loss.

Do not blindly restore an older database over new user activity without an approved recovery decision.

---

## 12. Monitoring and observability

### 12.1 Operational visibility

Maintain appropriate visibility into:

- Application errors.
- Failed critical server operations.
- Authentication configuration problems.
- Database connectivity issues.
- Migration failures.
- Deployment failures.
- Unusual authorization failures.
- Unexpectedly slow queries or endpoints where measurable.

### 12.2 Error reports

Error reports should contain enough safe diagnostic context to identify the failing operation.

Use correlation IDs or equivalent identifiers where useful.

Never include service-role secrets, session cookies, passwords, or unnecessary private data in error reports.

### 12.3 Provider dashboards

Use available Vercel and Supabase operational dashboards where appropriate.

Verify actual settings, retention, alert availability, and access permissions in the deployed environment.

Do not assume an alert is active merely because a metric appears in a dashboard.

### 12.4 Alerting

Add alerts for operational failures that materially affect the product, where the chosen platform supports them.

Choose thresholds based on observed behavior and the application's needs rather than arbitrary values inserted into this document.

### 12.5 Privacy

Logs and monitoring must follow `docs/10-security-privacy.md`.

Operational tooling must not become an unnecessary repository of sensitive user information.

---

## 13. Dependency and secret maintenance

### 13.1 Dependencies

Maintain the existing package-manager lockfile.

Review relevant security advisories and dependency vulnerabilities.

Update vulnerable dependencies using a controlled process and run the appropriate regression tests afterward.

Do not upgrade unrelated major dependency versions simply because a newer release exists.

### 13.2 Secret scanning

Use suitable checks to detect accidentally committed credentials where practical.

Review Git changes for environment files, database dumps, exports, debugging output, and secrets before merging or deploying.

### 13.3 Incident handling

If a secret is exposed:

1. Determine which secret was exposed and where.
2. Revoke or rotate it using the provider's supported process.
3. Update the affected environment configuration.
4. Check for unauthorized access or changes.
5. Remove the exposed secret from active code and configuration.
6. Address repository history or published artifacts as appropriate.
7. Verify the corrected application behavior.
8. Record the incident and preventive action.

Do not assume that deleting a value from the current source file makes a published secret safe.

---

## 14. Performance and resource management

### 14.1 Measure actual bottlenecks

Investigate real application and database performance rather than introducing infrastructure preemptively.

Use available logs, query plans, build output, and runtime metrics.

### 14.2 Database queries

- Retrieve only fields needed for the page or operation.
- Use suitable indexes for demonstrated query patterns.
- Avoid unnecessary repeated requests.
- Avoid loading entire catalogues when filtering or pagination is appropriate.
- Preserve RLS and ownership checks while optimizing query structure.

### 14.3 Caching

Review caching behavior carefully for authenticated and private responses.

Do not serve one user's private records through a shared cache to another user.

Cache curated content only when the invalidation and publication behavior are understood and safe.

Do not add a separate caching service without a demonstrated requirement.

### 14.4 Hosting limits

Confirm application behavior against the actual hosting plan and configuration, including timeouts, request sizes, and resource limits.

Do not assume that a deployment target has unlimited execution time or database capacity.

---

## 15. Deployment rollback

### 15.1 Application rollback

Where the deployment platform supports it, maintain the ability to return to a previously working application deployment.

Before rollback, consider whether the current database schema remains compatible with the older application code.

### 15.2 Database compatibility

Application rollback does not automatically reverse database migrations.

Avoid destructive migrations that make the previous application version unusable unless the deployment strategy explicitly accounts for that consequence.

Where necessary, use forward-compatible migrations or a documented recovery path.

### 15.3 Rollback procedure

If a deployment introduces a critical issue:

1. Identify the affected change.
2. Determine whether it is safe to roll back the application.
3. Assess whether the database schema or data was also changed.
4. Stop affected operations if they risk further damage.
5. Perform the approved application rollback or corrective deployment.
6. Restore or repair database state only through the reviewed recovery procedure.
7. Verify authentication, RLS, persistence, and critical workflows.
8. Record the cause and required follow-up work.

Do not automatically restore a database backup merely because a frontend deployment failed.

### 15.4 Post-rollback checks

Confirm that the resulting application and database remain compatible.

Test the critical path affected by the incident and monitor for recurrence.

A rollback is not complete merely because the hosting platform displays an earlier deployment.

---

## 16. Account deletion and other privileged operations

### 16.1 Account deletion

The deployed deletion workflow must follow the API, database, and security specifications.

Verify:

- User authorization.
- The approved confirmation process.
- Required reauthentication.
- Correct handling of Auth identity and user-owned records.
- Protection of shared curated content.
- Safe behavior during partial failure.
- Idempotent retry and recovery behavior.

Test this workflow with disposable test accounts before production release.

### 16.2 Privileged database tasks

Any operation requiring service-role or other elevated privileges must have a clearly defined purpose and owner.

Keep the relevant code server-only.

Before execution, validate authorization and the intended target.

Avoid exposing arbitrary administrative database functions through ordinary user-facing routes.

### 16.3 Destructive maintenance

Document the target, expected impact, preconditions, and recovery plan before running destructive maintenance operations.

Commands that reset or truncate tables must be explicitly restricted to the intended disposable test environment.

---

## 17. Release checklist

Use this checklist before a production deployment.

### Source and configuration

- [ ] Changes reviewed.
- [ ] No unintended secrets or personal data in Git changes.
- [ ] Required environment variables are configured.
- [ ] Production points to the intended Supabase project.
- [ ] Authentication redirect settings are correct.
- [ ] Dependency changes are reviewed.

### Database and content

- [ ] Migrations are version controlled and reviewed.
- [ ] Destructive changes have an approved recovery strategy.
- [ ] RLS policies are enabled and tested.
- [ ] Composite ownership constraints and foreign keys are correct.
- [ ] Content seeds are repeatable.
- [ ] Source workout content has been verified.
- [ ] Nutritional content has the correct provenance and data-quality state.
- [ ] Existing user data will not be reset or overwritten.

### Quality assurance

- [ ] Type checking passes.
- [ ] Linting passes.
- [ ] Required tests pass.
- [ ] Critical security tests pass.
- [ ] Critical E2E journeys pass.
- [ ] Production build succeeds.
- [ ] Relevant accessibility checks pass.
- [ ] Failed, blocked, and unrun tests are documented.

### Production rollout

- [ ] Database migration order is appropriate.
- [ ] Deployment configuration is correct.
- [ ] Post-deployment verification is planned.
- [ ] Rollback compatibility has been considered.
- [ ] Monitoring and diagnostic access are available where configured.
- [ ] No unresolved release-blocking defect remains.
- [ ] Required product-owner decisions are approved before production release.

---

## 18. Open operational decisions

Resolve the following through the appropriate project-owner or operations review:

1. **Environment layout:** Final selection of development, test, preview, and production Supabase projects.
2. **Recovery targets:** Acceptable data-loss and restoration-time objectives.
3. **Backup configuration:** Actual backup and recovery capabilities enabled for the chosen plan.
4. **Monitoring:** Whether an additional monitoring service is needed beyond provider tooling.
5. **CI/CD policy:** Required automated checks and branch protections supported by the selected repository platform.
6. **Production migration permissions:** Which users or deployment workflows may apply production migrations.
7. **Account-deletion recovery:** Final process for handling partial failure across Auth and database cleanup.

These open decisions do not justify skipping secure local development, version-controlled migrations, tested RLS policies, or protection of production credentials.

---

## 19. Definition of done

The DevOps and deployment specification is ready for implementation when:

1. Local development can be reproduced from the documented repository setup.
2. Environment variables are classified and documented safely.
3. Development and production data are appropriately separated.
4. Database migrations are version controlled, repeatable, and reviewed.
5. Seed operations are idempotent and preserve user-owned records.
6. Automated quality checks run through verified repository commands.
7. Preview and production configuration are clearly distinguished.
8. Production deployment includes safe migration and post-deployment verification.
9. Backup and recovery capabilities are documented accurately.
10. Rollback procedures account for database-schema compatibility.
11. Logs and monitoring avoid unnecessary sensitive information.
12. Privileged operations have appropriate authorization and recovery plans.
13. Release checks cover the critical application and security requirements.
14. Operational decisions remain documented until approved.
15. The workflow aligns with Documents 01–11 and the actual deployment configuration.

---

## 20. Instructions for Antigravity review

Review this document against Documents 01–11, the actual Git repository, the existing `package.json`, Supabase migrations, and the intended Vercel/Supabase deployment configuration where available.

Report:

- Existing scripts and configuration that the document should reuse.
- Missing migration or seed safeguards.
- Risks to production data.
- Environment-variable or secret-handling problems.
- Deployment sequencing and rollback conflicts.
- Recovery or backup claims that cannot be verified.
- Commands or provider features that are assumed but not configured.

Distinguish between procedures that already exist and procedures that still need implementation.

Do not invent platform capabilities, expose secrets, modify production data, or begin application implementation during this documentation-review phase.

**Implementation rule:** A deployment is complete only when the application, database, authorization policies, configuration, and persisted data are verified together. A successful build or hosting deployment alone does not establish production readiness.


filename:docs/12-devops.md
