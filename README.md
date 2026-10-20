<!-- README.md was written with assistance from GPT-6.1-Sol via Codex, a generative AI tool, in accordance with CS50's final project guidelines, which permit AI tools beyond CS50's own as helpers, provided the work remains the student's own and AI use is cited. See https://cs50.harvard.edu/x/project/#getting-started. -->

# Scheduled Blocker

#### Video Demo: [https://youtu.be/xKj1nfcn3oA](https://youtu.be/xKj1nfcn3oA)

#### Description:

Scheduled Blocker is a Chrome extension that blocks the websites you choose on the days and at the times you set. It helps reduce distractions during work or study while allowing access outside those hours. You manage the blocked sites and schedule through a popup in Chrome's toolbar. The extension uses JavaScript, HTML, CSS, and Chrome's extension APIs, with no external dependencies or build step.

You can enter a domain such as [`youtube.com`](https://youtube.com) or paste a complete address such as [`https://www.youtube.com/playlist?list=PLhQjrBD2T380hlTqAU8HfvVepCcjCqTg6`](https://www.youtube.com/playlist?list=PLhQjrBD2T380hlTqAU8HfvVepCcjCqTg6). The extension keeps the hostname and removes a leading `www.`. Each entry covers both that domain and its subdomains, so [`youtube.com`](https://youtube.com) also blocks [`www.youtube.com`](https://www.youtube.com) and [`m.youtube.com`](https://m.youtube.com). Paths are discarded, meaning the block applies to the whole domain rather than one video or page. Invalid entries and duplicate domains produce a message in the popup.

Each time period has its own days, start time, and end time. All blocked sites share the same schedule, and blocking applies whenever any period covers the current local time. Multiple periods allow breaks during the day or different hours on different days. The initial schedule is Monday through Friday, 9:00 AM to 5:00 PM, with no blocked sites. Settings are saved locally with `chrome.storage.local` and persist between browser sessions.

During a scheduled period, visiting a matching site redirects the tab to a blocked page. That page identifies the site and, when an opening is found within the next week, displays when it will become available again. The extension remembers the complete original URL and automatically returns to it when the block ends. Sites already open are checked every minute, and changing the saved sites or periods also triggers a check.

## Getting started

1. Download or clone this repository to your computer. Extract it first if you downloaded a ZIP file.
2. Open [`chrome://extensions`](chrome://extensions) in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project directory containing [`manifest.json`](manifest.json).
5. Open Chrome's extensions menu and pin **Scheduled Blocker** for convenient access.
6. Click its toolbar icon to open the popup.

No package installation, server, or account is required.

## Using the extension

Under **Blocked sites**, enter a domain or full URL and click **Add**. Use **Remove** beside an entry to delete it. Under **Schedule**, select at least one day, choose the **From** and **to** times, and click **Add time period**. To change an existing period, remove it and add a replacement. With no sites or no periods, nothing is blocked.

For a weekday schedule with a lunch break, remove the default period and add these two:

| Days | From | To |
| --- | --- | --- |
| Monday–Friday | 9:00 AM | 1:00 PM |
| Monday–Friday | 2:00 PM | 5:00 PM |

A listed site is then available during lunch and outside those hours. Start times are inclusive and end times are exclusive: the morning period applies at 9:00 AM, but ends at 1:00 PM.

Periods with a start later than the end cover both the late and early hours of each selected calendar day. For example, selecting only Monday with 10:00 PM–6:00 AM blocks Monday before 6:00 AM and from 10:00 PM onward. Tuesday must also be selected to block early Tuesday. Equal start and end times block the entire selected day.

Settings changes make blocked pages retry their original addresses immediately. If a site still matches an active period, it is blocked again; otherwise, it opens normally. A tab left open outside blocked hours is caught by the next one-minute check after a period starts.

## Implementation and design

The Manifest V3 service worker handles navigation and checks open tabs. Combining navigation events with a recurring alarm covers both newly visited pages and tabs left open across schedule boundaries. Only top-level HTTP and HTTPS pages are checked, so embedded frames are not redirected individually.

Domain matching accepts an exact hostname or a hostname ending in a dot followed by the listed domain. This includes subdomains without accidentally matching an unrelated hostname such as `notyoutube.com` against [`youtube.com`](https://youtube.com).

The schedule is stored as a list of periods, each containing day numbers and time strings. Checking whether any period applies makes overlaps work naturally. To calculate availability, `nextAvailableTime` advances one minute at a time, looking up to a week ahead for the first unblocked minute. This handles touching and overlapping periods without treating the end of just one period as the end of the block. If no opening is found, the blocked page omits the availability message.

The blocked page receives the site, original URL, and optional return time through query parameters. It checks the clock every second and uses `window.location.replace` to return, replacing its own browser history entry. It also listens for settings changes so removing a site or period can release the tab promptly.

The manifest requests four permissions: `storage` for settings, `webNavigation` for navigation events, `tabs` for inspecting and redirecting tabs, and `alarms` for periodic checks. Local storage keeps configuration in the browser without a backend or sign-in.

## Project files

| File | Purpose |
| --- | --- |
| [`manifest.json`](manifest.json) | Defines extension metadata, permissions, icons, popup, and background service worker. |
| [`service_worker.js`](service_worker.js) | Initializes settings, checks navigation and open tabs, matches domains and periods, and calculates the next available time. |
| [`popup.html`](popup.html) | Defines the popup's forms, site and period lists, and styling. |
| [`popup.js`](popup.js) | Validates and normalizes site entries, adds and removes sites and periods, saves settings, and renders the lists. |
| [`blocked.html`](blocked.html) | Defines the blocked page's message and layout. |
| [`blocked.js`](blocked.js) | Displays the site and availability time and returns to the original URL when time or settings change. |
| [`icons/icon.svg`](icons/icon.svg) | Vector icon artwork. |
| [`icons/icon16.png`](icons/icon16.png), [`icon32.png`](icons/icon32.png), [`icon48.png`](icons/icon48.png), [`icon128.png`](icons/icon128.png) | Icons referenced by the manifest. |
| [`.gitignore`](.gitignore) | Excludes temporary files and generated directories from Git. |
| [`README.md`](README.md) | Documents setup, usage, behavior, design, and project files. |
