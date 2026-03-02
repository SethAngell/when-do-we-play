# Workspace Mandates: `when-do-we-play`

## Project Overview
This project is an automated tool that scrapes volleyball scheduling websites to extract playtimes for specific leagues and teams. It generates `.ical` feeds for team subscriptions, sends SMS reminders via Twilio on game mornings, and hosts the generated calendar links on a GitHub Pages HTML site. The entire process is orchestrated via GitHub Actions.

## Core Technologies
- **Scraping:** Playwright (TypeScript)
- **Data Storage:** JSON (for intermediate playtimes and configuration)
- **Calendar Generation:** `.ical` document generation
- **Notifications:** Twilio SMS API
- **Automation:** GitHub Actions
- **Hosting:** GitHub Pages (basic HTML for iCal links)

## Architectural Guidelines

### 1. Parameterization & Configuration
- The system MUST be highly parameterized. All league and team configurations must be driven by an external JSON configuration file to easily support multiple leagues and teams without code changes.
- Avoid hardcoding URLs, team names, or league identifiers in the scraping logic.

### 2. Separation of Concerns
Maintain a clear separation between:
- **Scraping Layer:** Responsible solely for navigating the website, extracting the raw schedule data, and returning a normalized data structure.
- **Processing Layer:** Responsible for matching the extracted data against the JSON configuration to find relevant playtimes.
- **Output Layer:** Responsible for writing the intermediate JSON, generating the `.ical` documents, and building the static HTML page.
- **Notification Layer:** Responsible for checking the schedule and dispatching Twilio SMS messages on the appropriate mornings.

### 3. Reliability & Idempotency
- **Scraping:** Ensure scraping scripts are resilient to minor DOM changes where possible (e.g., using robust locators).
- **GitHub Actions:** Workflows should be idempotent. If a run fails and is restarted, it should not produce duplicate calendar events or send duplicate texts.
- **Notifications:** Ensure SMS reminders are sent exactly once per game day.

### 4. Code Quality & Style
- **TypeScript:** Use strict typing for all configurations and data models (e.g., Schedule, Team, League).
- **Testing:** Include tests for the data processing and `.ical` generation logic to ensure timezones and date parsing are handled correctly.

## Workflow & Planning
- All new features and significant refactors must be planned out in the `plans/` directory before implementation begins.
- Break down tasks into discrete, verifiable steps.
