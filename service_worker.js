const DEFAULT_PERIODS = [
  { days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" },
];

chrome.runtime.onInstalled.addListener(async () => {
  const saved = await chrome.storage.local.get(["sites", "periods"]);
  await chrome.storage.local.set({
    sites: saved.sites || [],
    periods: saved.periods || DEFAULT_PERIODS,
  });
});

chrome.webNavigation.onBeforeNavigate.addListener(checkNavigation, {
  url: [{ schemes: ["http", "https"] }],
});

chrome.storage.onChanged.addListener(checkOpenTabs);

chrome.alarms.onAlarm.addListener(checkOpenTabs);
createAlarmIfMissing();

async function checkNavigation(details) {
  if (
    details.frameType !== "outermost_frame" ||
    details.documentLifecycle === "prerender"
  ) {
    return;
  }

  await blockTabIfNeeded(details.tabId, details.url);
}

async function checkOpenTabs() {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    await blockTabIfNeeded(tab.id, tab.url);
  }
}

async function createAlarmIfMissing() {
  const alarm = await chrome.alarms.get("check-open-tabs");
  if (!alarm) {
    await chrome.alarms.create("check-open-tabs", { periodInMinutes: 1 });
  }
}

async function blockTabIfNeeded(tabId, url) {
  const { sites, periods } = await chrome.storage.local.get([
    "sites",
    "periods",
  ]);
  const now = new Date();
  if (!isBlockedTime(periods, now)) {
    return;
  }

  const hostname = new URL(url).hostname;
  for (const domain of sites) {
    if (matchesSite(hostname, domain)) {
      const blockedPage = new URL(chrome.runtime.getURL("blocked.html"));
      blockedPage.searchParams.set("site", domain);
      blockedPage.searchParams.set("url", url);
      const availableAt = nextAvailableTime(periods, now);
      if (availableAt !== null) {
        blockedPage.searchParams.set("until", availableAt.getTime());
      }
      chrome.tabs.update(tabId, { url: blockedPage.href });
      return;
    }
  }
}

function isBlockedTime(periods, now) {
  return periods.some((period) => isInPeriod(period, now));
}

function nextAvailableTime(periods, now) {
  const start = new Date(now);
  start.setSeconds(0, 0);

  const minutesInWeek = 7 * 24 * 60;
  for (let minute = 1; minute <= minutesInWeek; minute++) {
    const time = new Date(start.getTime() + minute * 60 * 1000);
    if (!isBlockedTime(periods, time)) {
      return time;
    }
  }
  return null;
}

function isInPeriod(period, now) {
  if (!period.days.includes(now.getDay())) {
    return false;
  }

  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(period.start);
  const end = toMinutes(period.end);

  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

function toMinutes(time) {
  const parts = time.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function matchesSite(hostname, domain) {
  return hostname === domain || hostname.endsWith("." + domain);
}
