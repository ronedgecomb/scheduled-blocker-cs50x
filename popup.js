const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const addSiteForm = document.querySelector("#add-site-form");
const domainInput = document.querySelector("#domain-input");
const siteList = document.querySelector("#site-list");

const addPeriodForm = document.querySelector("#add-period-form");
const dayCheckboxes = document.querySelectorAll('input[name="day"]');
const startInput = document.querySelector("#start-input");
const endInput = document.querySelector("#end-input");
const periodList = document.querySelector("#period-list");

const message = document.querySelector("#message");

showSites();
showPeriods();

addSiteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const domain = cleanDomain(domainInput.value);
  if (domain === null) {
    message.textContent =
      "That doesn't look like a website. Try something like example.com.";
    return;
  }

  const { sites } = await chrome.storage.local.get("sites");
  if (sites.includes(domain)) {
    message.textContent = `${domain} is already on the list.`;
    return;
  }

  sites.push(domain);
  await chrome.storage.local.set({ sites: sites });

  domainInput.value = "";
  message.textContent = "";
  showSites();
});

addPeriodForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const days = [];
  for (const checkbox of dayCheckboxes) {
    if (checkbox.checked) {
      days.push(Number(checkbox.value));
    }
  }
  if (days.length === 0) {
    message.textContent = "Pick at least one day.";
    return;
  }

  const { periods } = await chrome.storage.local.get("periods");
  periods.push({ days: days, start: startInput.value, end: endInput.value });
  await chrome.storage.local.set({ periods: periods });

  addPeriodForm.reset();
  message.textContent = "";
  showPeriods();
});

async function showSites() {
  const { sites } = await chrome.storage.local.get("sites");

  siteList.innerHTML = "";
  if (sites.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No sites yet.";
    siteList.append(item);
    return;
  }

  for (const domain of sites) {
    const item = document.createElement("li");
    item.textContent = domain;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removeSite(domain));

    item.append(removeButton);
    siteList.append(item);
  }
}

async function removeSite(domain) {
  const { sites } = await chrome.storage.local.get("sites");
  const remaining = sites.filter((site) => site !== domain);
  await chrome.storage.local.set({ sites: remaining });

  message.textContent = "";
  showSites();
}

async function showPeriods() {
  const { periods } = await chrome.storage.local.get("periods");

  periodList.innerHTML = "";
  if (periods.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No time periods yet.";
    periodList.append(item);
    return;
  }

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i];
    const dayNames = period.days.map((day) => DAY_NAMES[day]).join(", ");

    const item = document.createElement("li");
    item.textContent = `${dayNames}\n${formatTime(period.start)} to ${formatTime(period.end)}`;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removePeriod(i));

    item.append(removeButton);
    periodList.append(item);
  }
}

async function removePeriod(index) {
  const { periods } = await chrome.storage.local.get("periods");
  periods.splice(index, 1);
  await chrome.storage.local.set({ periods: periods });

  message.textContent = "";
  showPeriods();
}

function formatTime(time) {
  const parts = time.split(":");
  const date = new Date();
  date.setHours(Number(parts[0]), Number(parts[1]));
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function cleanDomain(text) {
  text = text.trim();
  if (!text.includes("://")) {
    text = "https://" + text;
  }

  let hostname;
  try {
    hostname = new URL(text).hostname;
  } catch {
    return null;
  }

  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }
  if (!hostname.includes(".")) {
    return null;
  }
  return hostname;
}
