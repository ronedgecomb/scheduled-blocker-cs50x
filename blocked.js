const params = new URLSearchParams(window.location.search);
const site = params.get("site");
const originalUrl = params.get("url");
const until = params.get("until");

if (site) {
  document.querySelector("#site").textContent = site;
}

if (until) {
  const date = new Date(Number(until));
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date.toDateString() === new Date().toDateString()) {
    document.querySelector("#until").textContent =
      `It'll be available again at ${time}.`;
  } else {
    const day = date.toLocaleDateString([], { weekday: "long" });
    document.querySelector("#until").textContent =
      `It'll be available again on ${day} at ${time}.`;
  }

  const timer = setInterval(() => {
    if (Date.now() >= date.getTime()) {
      clearInterval(timer);
      goBack();
    }
  }, 1000);
}

chrome.storage.onChanged.addListener(goBack);

function goBack() {
  if (originalUrl) {
    window.location.replace(originalUrl);
  }
}
