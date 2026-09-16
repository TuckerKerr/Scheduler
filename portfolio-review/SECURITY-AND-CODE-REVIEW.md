# Historical audit — original source findings

This is the original source review retained for context. Its unresolved statuses and line numbers predate the security changes in this static copy. See [current security changes](../SECURITY-CHANGES.md) for remediation and current limits.

# Scheduler: publication and code review

Reviewed September 15, 2026. **Do not publish the current repository as-is.** Confirmed publication blockers include embedded credentials in legacy source and Git-tracked debug logs containing employee/schedule fields. All findings below are flags; no fixes were applied.

Paths and line numbers refer to the original Scheduler directory. No credential values or employee log contents are reproduced here.

## Scope and limitations

Inventory covered the current project, frontend/backend source, legacy/testing files, CSS, migration, asset filenames and log field indicators. Git index and recent commit metadata were checked without changing configuration. Historical file contents, external `sts` source, database contents, server configuration, binary image metadata and image usage rights were not audited. This is a source review, not a penetration test or a guarantee that no additional secrets exist.

The root `db_connect.php` was not opened. One initial file-filter operation accidentally included `testing/db_connect.php`; this was disclosed immediately and the filtering was corrected. No further connection files were inspected, and no contents from that excluded file were copied into this package. Findings about tracked connection filenames rely on Git metadata, not a review of the excluded helper code. Authentication/capacity behavior inside those helpers remains unknown.

## Publication blockers

### Critical: hardcoded credentials in tracked legacy PHP

- `Depricated/login.php:11`–14 and `Depricated/register.php:8`–11 contain connection settings including literal passwords and an internal server address.
- Both files are tracked by Git. Code can expose secrets even when the pages are unused or the application is hosted elsewhere.
- Flagged action: remove embedded secrets before publication, use externally supplied configuration, and rotate any still-valid credentials that were exposed or shared. Review existing history before making the repository public; deleting the current file does not remove older committed copies.

### High: ignore rule does not match connection filenames

- `.gitignore:1` contains `db_connection.php`.
- `git ls-files` reports both `db_connect.php` and `testing/db_connect.php` as tracked.
- Flagged action: exclude connection configuration at every relevant directory level, remove it from the public index, and review historical copies. Ignore rules do not untrack existing files. No history rewriting or untracking was performed.

### High: employee/schedule logs are tracked

- Root `debug.log` and `testing/debug.log` are tracked despite `debug.log` appearing in `.gitignore:3`.
- These logs, plus untracked `INDEX-PHP/debug.log`, contain employee ID, name and shift-date markers. Approximate sizes are 0.82 MB, 0.15 MB and 11.95 MB respectively. Values were not reproduced.
- `testing/submitshift.php`, `testing/submitshift_test.php` and `Depricated/submitshift.php` append request payloads to logs.
- `Depricated/login.php:67` logs a query result whose SELECT includes `password_hash`; this creates a password-hash disclosure risk in server logs. Existing project log field checks did not find the `password_hash` label, which does not establish that other logs are clean.
- Flagged action: exclude logs from public source and web serving, remove historical personal records as needed, and stop sensitive payload/hash logging in a separately reviewed code change.

## Runtime security flags

These matter when PHP is deployed. The reviewed endpoint bodies do not show complete authorization enforcement; excluded helper files or external infrastructure might add checks. Verify those independently before declaring a working exploit or publishing a live backend.

| Severity | Location | Observation and flagged action |
| --- | --- | --- |
| High | `INDEX-PHP/submitshift.php:28`, `:30`, `:35`, `:47`; `INDEX-PHP/shiftUpdate.php:51`, `:54` | Employee identity and staff privilege come from request data; `staff` is passed into capacity helpers. Derive identity and privilege from a verified server session and authorize operations against the target employee. A browser storage value must not confer staff powers. Helper enforcement was not reviewed. |
| High | `INDEX-HTML/schedule_integration.html:726`, `:775`; `INDEX-HTML/ShiftCreation_integration.html:364`, `:856` | Admin visibility uses hardcoded names and editable sessionStorage; requests send `is_staff` from storage. These are presentation checks, not a security boundary. Retain the UI if desired but enforce permissions on the server. |
| High | `INDEX-PHP/shiftUpdate.php:64`, `:74`, `:138`; `INDEX-PHP/MaxStudentsPerSlot.php:10` | Sensitive update/delete/capacity actions have no visible per-operation role/ownership checks in these endpoint bodies. Verify central checks, accepted HTTP methods and CSRF enforcement. The max-slots frontend sends a CSRF header but its endpoint does not visibly validate it. |
| High | `INDEX-PHP/search-assets.php:101`, `:111`, `:132`; `INDEX-JS/testindexsearch.js:28`; `INDEX-HTML/schedule_integration.html:683` | Database values are interpolated into HTML and assigned to `innerHTML`. If untrusted values enter those fields, stored script injection is possible. Escape text or sanitize explicitly allowed markup. Fictional safe fixtures do not fix this sink. |
| Medium | `INDEX-HTML/confirmation_page.html:60` | localStorage content is rendered as HTML. Treat stored values as untrusted and render text safely. |
| High | `Depricated/register.php:26` onward | A matching active worker name is sufficient for registration; no invitation or verified identity is shown. If deployed, a person knowing an unclaimed name could register that identity. Keep legacy registration out of a public demo or add identity verification in a reviewed change. |
| Medium | `INDEX-PHP/shiftUpdate.php:4`, endpoint exception responses, legacy login/register | Detailed errors are enabled or returned to clients. Use generic external errors and private diagnostic logs. |
| Medium | `INDEX-PHP/search-assets.php:20` onward; weekly/admin employee endpoints | Search covers multiple operational views; employee/shift reads have no visible endpoint-level access checks. Review permitted data exposure and result fields before public deployment. |
| Medium | `Depricated/login.php:69` onward | No session ID regeneration after login or login throttling is visible here. Verify server/session configuration and add controls if absent. Different unknown-user/password messages disclose account existence. |
| Low | `INDEX-HTML/schedule_integration.html:868`, `INDEX-HTML/ShiftCreation_integration.html:989` | Third-party JavaScript uses `@latest` without integrity metadata. Pin reviewed versions and consider integrity/CSP in deployment. No claim is made that the current CDN package has a known vulnerability. |

Prepared statements and password hashing/verification are present in several reviewed paths. The concerns above do not imply that every query is SQL-injectable; authorization and rendering risks remain separate.

## Functionality and presentation flags — left unchanged

1. **Missing application dependencies.** `schedule_integration.html:18` loads `../../sts/Styles.css`; both integrated pages load `../../sts/global.js`, external branding, navigation and functions. Shift creation requests `../../sts/FORM-PHP/semDateSubmit.php`. The overview redirects to `../../sts/index.html` without a stored username. These dependencies are not in Scheduler. Their absence prevents this folder from being a complete standalone portfolio app.
2. **Creation page runtime error.** `ShiftCreation_integration.html:1011` looks for `.table-wrapper`, absent from that page, then dereferences it on line 1012 during load/resize.
3. **Stale edit state.** `ShiftCreation_integration.html:390` only updates selected hours/form mode when returned shifts are nonempty; line 422 sets update mode without a matching reset for an empty result. Switching user/week/campus can leave old hours or update mode.
4. **Availability race.** Lines 711–712 start `checkTimeslot` and `grabShifts` without awaiting their order. Availability checks inspect selected state while that state is still loading.
5. **Request volume.** `checkTimeslot` makes two sequential requests for each of 180 cells, about 360 requests per week/campus check. This can make demonstrations slow; aggregate availability in a future change.
6. **Confirmation data gap.** The confirmation page reads `submittedShifts`, but the integrated creation page does not write that key. A successful submission may display “No shifts were selected for submission.”
7. **Partial-success feedback.** Submission can return `success: true` with rejected slots in `message`; updates return `rejected_shifts`. The creation page checks success but does not surface these rejections, so its success alert can imply all shifts were accepted.
8. **Cross-campus form deletion.** `shiftUpdate.php:64` deletes shifts scoped to a campus, while line 74 deletes form submissions for the employee/week without campus scoping. Impact depends on foreign keys/cascade behavior, which was not inspected: it may fail, orphan rows, or affect shifts for the other campus.
9. **Mixed database APIs.** `shiftUpdate.php:127` uses `$conn` and later mysqli-style result methods while the surrounding handler uses `$pdo`. Whether `$conn` exists depends on excluded configuration; verify this deletion path.
10. **Legacy standalone endpoint paths.** `INDEX-HTML/weekly_schedule.html:209` requests `weekly_schedule_load.php` within its own directory, but the file is in `INDEX-PHP`. Testing/legacy variants contain similar stale relative links.
11. **Old test runtime references.** `testing/weekly_schedule_test.html` references `shiftList` outside the function where it is declared. `testing/confirmation_page.html` misspells `summaryContainer` in its empty-state branch. Keep these flags visible rather than presenting test pages as finished entry points.
12. **Admin identity coupling.** Fictional employee names cannot activate hardcoded real-name admin controls without changing code or adopting one of those existing identities. This package does neither; an eventual demo adapter needs an explicit decision on admin demonstration.
13. **Fixed-date demo.** Existing pages default to the current week, whereas fixtures cover four explicit Mondays. Integration must support that selection or provide a separately reviewed rolling-date mechanism.
14. **Legacy calendar default.** Root `script.js` sets a fixed 2025 date and an empty event array. It is not the integrated weekly data consumer.

## Before a public repository or live demonstration

- Resolve the confirmed credential and personal-log publication blockers, including previously committed copies. Verify remote visibility separately; remote exposure was not checked.
- Keep the public demo data and runtime isolated from real systems. Do not import these records into a production database.
- Decide whether to use a separate server adapter with unchanged source or approve a frontend demo adapter. Preserve existing CSS/UI while addressing missing dependencies explicitly.
- Verify all read/write operations, roles, input validation and capacity enforcement, including the excluded helper implementation, in a review you authorize separately.
- Review organization logos/backgrounds for suitability and permission to present publicly; visual assets were only inventoried here.
- Test overview, campus switch, new/edit schedules, rejection feedback, repeat weeks, admin actions and mobile/theme behavior after integration. No deployment was performed in this review.
