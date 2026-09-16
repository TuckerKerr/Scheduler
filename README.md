# Campus Shift Scheduler

A web-based scheduling interface for coordinating student staff across multiple campus locations. The scheduler brings shift selection, weekly coverage, and employee hours into one place so staff can plan their schedules and supervisors can see how the week is covered.

This repository presents a portfolio version of the project, with fictional employees and schedules that let visitors explore its design and scheduling interactions.

## What it does

### Weekly schedule overview

The overview displays Monday through Friday in 15-minute intervals. Each employee has a consistent color, and scheduled cells identify the campus where they will be working. Weekly hour totals make it easy to compare workloads and see who has—or has not—been scheduled.

### Interactive shift creation

Users can click and drag across the scheduling grid to select time slots, switch between Downcity and Harborside, and review their total selected hours. Existing shifts load into the form for editing, while full slots are marked unavailable.

A selected weekly pattern can repeat through the end of the demo semester, reducing the need to enter the same schedule week by week.

### Scheduling rules

The demo checks schedules before saving them:

- Enforces the configured number of employees per campus and time slot.
- Prevents an employee from working overlapping shifts across campuses.
- Limits each employee to 25 hours per week across both locations.
- Validates employee, campus, date, and time-slot information.
- Preserves the previous schedule if an update cannot be accepted.
- Saves repeated weeks together, so a failed validation does not leave a partially updated schedule.

### Administrative controls

The portfolio demo exposes controls for selecting an employee, updating their schedule, deleting their demo schedule, and adjusting slot capacity. These controls operate only on fictional data in the visitor's browser.

### Interface features

- Light and dark themes.
- A collapsible sidebar shared across the scheduling pages.
- Color-coded employee schedules and campus indicators.
- A confirmation page showing saved shifts.
- Searchable fictional equipment records.
- A **Reset Demo** option that restores the starting dataset.

## What this project showcases

The scheduler demonstrates how an interactive interface can support practical scheduling constraints. It combines dynamic table generation, drag selection, date-based repeat scheduling, availability checks, and immediate feedback on selected hours.

The public version also demonstrates a separation between interface behavior and scheduling data. A dedicated JavaScript model validates changes, while the pages handle presentation and interaction. Automated tests cover scheduling limits, invalid input, overlapping shifts, and rollback behavior.

## Technology

- **HTML and CSS** for the page structure, shared components, themes, and layouts.
- **Vanilla JavaScript** for grid interaction, schedule rendering, validation, and demo state.
- **JSON fixtures** for eight fictional employees and four weeks of example schedules.
- **Session storage** for changes that remain within the visitor's browser tab.
- **Node.js's built-in test runner** for model and security checks.
- **Locally bundled Font Awesome and js-confetti** for icons and visual feedback.

The original application used PHP and database-backed endpoints. In this public portfolio version, those endpoints are disabled and scheduling runs entirely on fictional browser-local data. It does not require or connect to a real employee database.

## About the portfolio demo

The included schedules cover four weeks beginning September 14, 2026. Visitors can explore the scheduling workflow without affecting another visitor's data. Demo administrative controls are available for exploration; they are not a production authentication system.

The sidebar also contains links to related campus applications. Those separate applications are not included in this repository.