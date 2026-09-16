# Historical sidebar integration notes

These notes describe the initial sidebar-only change. The later security update externalizes scripts, binds actions without inline handlers, uses local styles/assets and connects the demo dataset. See [current changes](../SECURITY-CHANGES.md).

# Authorized sidebar integration

Your follow-up authorized code changes specifically to integrate the supplied `sts/partials/sidebar.html`, while leaving login out of scope.

## Changes

- `partials/sidebar.html`: exact copy of the supplied sidebar and overlay, including all 15 navigation links.
- `INDEX-JS/sidebar.js`: loads the local partial and replaces the existing sidebar/overlay in place so the CSS sibling layout continues to work. Resolves the logo against the Scheduler asset directory, restores collapsed state and retains the old sidebar if loading fails.
- `INDEX-JS/Wrapper.js`: waits for sidebar loading before finding elements and attaching existing controls.
- `INDEX-HTML/schedule_integration.html` and `INDEX-HTML/ShiftCreation_integration.html`: load the sidebar script before Wrapper.js. Remove the stale body onload calls to `fetchChildGroups()` and global `loadTheme()`; the reviewed global.js supplies neither, and Wrapper.js already initializes the theme in its own scope.

No CSS, shift operations, database files, login checks or navigation destinations were changed. The pre-existing embedded sidebar stays as a fallback. This creates a local copy of the supplied partial: future edits to the original `sts` partial will not automatically update Scheduler's copy.

## Checks

JavaScript syntax checks passed for the loader and updated wrapper. Isolated loader checks passed for successful replacement, saved collapsed state, HTTP failure fallback, malformed-partial fallback, asset URL resolution and script ordering. The copied partial matches the supplied file byte for byte. These checks do not substitute for a full live browser/backend test.

## Remaining dependencies

Serve over HTTP(S); opening HTML with `file://` may block fetching the partial. The supplied links still require the sibling `sts`, inventory and RoomCheck applications. This change does not package those destinations. The overview still uses the external shared CSS and both pages retain their existing external scripts. Login was left alone as requested.

The fictional dataset remains in `portfolio-data/` after installation and is not automatically wired to PHP endpoints. Implementing a static-data adapter remains outside the sidebar-only code authorization. Security and unrelated functionality findings in the review were left unchanged.
