<div style="text-align: center">
    <img src="./grimlock.png" />
</div>

# Grimlock

An automated, highly undetectable Rewards bot built with **Playwright** and **TypeScript**. 

Grimlock attaches directly to an active browser instance using the Chrome DevTools Protocol (CDP) to run human-like daily navigation workflows, scroll verification tasks, and form-query completions. By utilizing natural cursor trails and variable typing speeds, it simulates organic user behaviors completely undetected.

---

## Features

- **CDP Session Attachment**: Attaches to active browser cookies and existing sessions, avoiding the need for automated logins or credentials storage.
- **Human-like Interactions**: Simulates organic pointer paths using `ghost-cursor-playwright` and typing delay cadences.
- **Interactive Dashboard Solver**: Automatically executes card interactions, selects form options, and handles inline page navigation steps.
- **Jittered Search Workflows**: Performs desktop and mobile search queries with scroll checking and link clicks to emulate organic browsing.
- **CLI Workflow Selector**: Select which automation profile to run directly from the command line.

---

## Setup & Execution

### 1. Launch Browser with Remote Debugging

Grimlock connects to a running browser instance with remote debugging enabled:

**macOS (Edge)**:
```bash
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Microsoft Edge/Default"
```

**macOS (Chrome)**:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Google/Chrome/Default"
```

*Ensure the browser is logged in to your default account profiles before starting.*

### 2. Install Dependencies & Build
```sh
yarn install
yarn build
```

### 3. Run Grimlock
```sh
yarn start
```
Select a task from the CLI menu, or wait 30 seconds for the menu to auto-select **Run All**.

---

## Proposed Future Features (Roadmap)

The following improvements are planned for future releases:

1. **Multi-Account Profile Support**:
   - Spawning browser processes sequentially with separate profile directory arguments (`--profile-directory="Profile 1"`, `--profile-directory="Profile 2"`) to run the automated routines across up to five user profiles sequentially.
2. **AI-Generated Searches (Gemini Integration)**:
   - Integrating `@google/genai` to generate dynamic, context-aware search queries based on daily news feeds rather than relying on a hardcoded keyword library.
3. **CLI Progress Tracking Table**:
   - Querying navigation progress metrics in the browser context and rendering a clean CLI status board (e.g. `Queries: 35/35`, `Dashboard Tasks: 5/5`, `Total Status: Complete`).
4. **Automated Background Scheduling**:
   - Bundling OS-specific runners (e.g. macOS LaunchAgents / Windows Task Scheduler) to automatically spin up a debugger and execute Grimlock daily at a set time.
5. **Notification Alerts**:
   - Supporting Discord/Telegram webhooks to notify the user if manual interaction is required during a run.
