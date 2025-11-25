// Simple region config: baseline FX values (1 local = X base currency, e.g., USD)
const regionConfig = {
  US: { code: "US", label: "United States", currency: "USD" },
  EU: { code: "EU", label: "Europe", currency: "EUR" },
  UK: { code: "UK", label: "United Kingdom", currency: "GBP" },
  JP: { code: "JP", label: "Japan", currency: "JPY" }
};

// Partners and primary regions they expose
const partners = [
  {
    id: "GSTAY_EU",
    name: "GlobalStay Hotels (EU-heavy)",
    region: "EU",
    note: "Hotel redemptions anchored in European pricing."
  },
  {
    id: "GSTAY_JP",
    name: "GlobalStay Hotels (JP)",
    region: "JP",
    note: "Hotel redemptions in JP, highly FX-sensitive."
  },
  {
    id: "MART_US",
    name: "MetroMart Retail (US)",
    region: "US",
    note: "US grocery/retail partner — acts as the USD baseline."
  },
  {
    id: "STREAM_UK",
    name: "StreamFlix Media (UK)",
    region: "UK",
    note: "Digital partner settled in GBP."
  }
];

// DOM references
const basePointValueEl = document.getElementById("base-point-value");
const pointsCostEl = document.getElementById("points-cost");

const fxUSEl = document.getElementById("fx-us");
const fxEUel = document.getElementById("fx-eu");
const fxUKel = document.getElementById("fx-uk");
const fxJPel = document.getElementById("fx-jp");

const driftSliderEl = document.getElementById("drift-slider");
const driftValueEl = document.getElementById("drift-value");
const resetBtn = document.getElementById("resetBtn");

const summaryBadgeEl = document.getElementById("summary-badge");
const summaryTextEl = document.getElementById("summary-text");
const rawOutputEl = document.getElementById("raw-output");
const barsContainerEl = document.getElementById("bars-container");

// Helpers

function parsePositiveNumber(value, fallback) {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return fallback;
  return n;
}

function formatPercent(n, decimals) {
  if (!isFinite(n)) return "0%";
  const d = decimals != null ? decimals : 1;
  return `${n.toFixed(d)}%`;
}

function formatCurrency(amount, currencyCode) {
  if (!isFinite(amount)) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2
  }).format(amount);
}

function updateSummaryBadge(statusKey, detailText) {
  summaryBadgeEl.classList.remove(
    "summary-badge-idle",
    "summary-badge-ok",
    "summary-badge-warn",
    "summary-badge-fail"
  );

  let label = "";
  if (statusKey === "low") {
    summaryBadgeEl.classList.add("summary-badge-ok");
    label = "Small FX drift";
  } else if (statusKey === "medium") {
    summaryBadgeEl.classList.add("summary-badge-warn");
    label = "Noticeable value drift";
  } else if (statusKey === "high") {
    summaryBadgeEl.classList.add("summary-badge-fail");
    label = "Distorted partner fairness";
  } else {
    summaryBadgeEl.classList.add("summary-badge-idle");
    label = "No drift applied.";
  }

  summaryBadgeEl.textContent = label;

  if (detailText) {
    summaryTextEl.textContent = detailText;
  }
}

function getBaselineFx() {
  return {
    US: parsePositiveNumber(fxUSEl.value, 1.0),
    EU: parsePositiveNumber(fxEUel.value, 1.1),
    UK: parsePositiveNumber(fxUKel.value, 1.27),
    JP: parsePositiveNumber(fxJPel.value, 0.007)
  };
}

function applyDriftToFx(baselineFx, driftPercent) {
  // Drift applies only to non-USD currencies in this model.
  const factor = 1 + driftPercent / 100;
  return {
    US: baselineFx.US, // USD anchor stays fixed
    EU: baselineFx.EU * factor,
    UK: baselineFx.UK * factor,
    JP: baselineFx.JP * factor
  };
}

function analyzeDrift() {
  const basePointValue = parsePositiveNumber(basePointValueEl.value, 0.01);
  const pointsCost = parsePositiveNumber(pointsCostEl.value, 10000);
  const driftPercent = parseFloat(driftSliderEl.value) || 0;

  driftValueEl.textContent = `${driftPercent > 0 ? "+" : ""}${driftPercent}%`;

  const baselineFx = getBaselineFx();
  const shiftedFx = applyDriftToFx(baselineFx, driftPercent);

  const baselinePointsValueBase = pointsCost * basePointValue; // liability in base

  const driftResults = partners.map((partner) => {
    const region = regionConfig[partner.region];
    const currency = region ? region.currency : "USD";

    const fxBase = baselineFx[partner.region];
    const fxShifted = shiftedFx[partner.region];

    const baselineLocal = baselinePointsValueBase / fxBase;
    const shiftedLocal = baselinePointsValueBase / fxShifted;

    const driftLocal = shiftedLocal - baselineLocal;
    const driftPct = baselineLocal > 0 ? (driftLocal / baselineLocal) * 100 : 0;

    return {
      id: partner.id,
      name: partner.name,
      regionCode: partner.region,
      regionLabel: region ? region.label : partner.region,
      currency,
      baselineLocal,
      shiftedLocal,
      driftLocal,
      driftPct
    };
  });

  // Determine max absolute drift to set severity
  const maxAbsDrift = driftResults.reduce(
    (max, r) => Math.max(max, Math.abs(r.driftPct)),
    0
  );

  let severity = "none";
  if (maxAbsDrift < 5) {
    severity = "low";
  } else if (maxAbsDrift < 15) {
    severity = "medium";
  } else {
    severity = "high";
  }

  // Who is most advantaged/disadvantaged?
  const sortedByDrift = [...driftResults].sort((a, b) => b.driftPct - a.driftPct);
  const top = sortedByDrift[0];
  const bottom = sortedByDrift[sortedByDrift.length - 1];

  let detailText = "No FX drift applied — all partners sit at their baseline value.";
  if (severity !== "none") {
    const topLabel = `${top.name} (${top.regionLabel})`;
    const bottomLabel = `${bottom.name} (${bottom.regionLabel})`;

    detailText =
      `With FX drift of ${driftPercent > 0 ? "+" : ""}${formatPercent(
        driftPercent,
        0
      )} applied to non-USD currencies, ` +
      `${topLabel} becomes the richest partner (~${formatPercent(
        top.driftPct,
        1
      )} vs baseline), while ${bottomLabel} is the most diluted (~${formatPercent(
        bottom.driftPct,
        1
      )}).`;
  }

  updateSummaryBadge(severity, detailText);
  renderBars(driftResults);
  renderRawOutput({
    basePointValue,
    pointsCost,
    driftPercent,
    baselineFx,
    shiftedFx,
    driftResults,
    severity
  });
}

function renderBars(results) {
  barsContainerEl.innerHTML = "";

  if (!results.length) {
    barsContainerEl.textContent = "No partners configured.";
    return;
  }

  const maxAbs = results.reduce(
    (max, r) => Math.max(max, Math.abs(r.driftPct)),
    0
  );
  const effectiveMax = Math.max(maxAbs, 1); // avoid div by zero

  results.forEach((r) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = r.name;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.classList.add("bar-fill");

    let fillClass = "bar-fill-neutral";
    if (r.driftPct > 1) {
      fillClass = "bar-fill-positive";
    } else if (r.driftPct < -1) {
      fillClass = "bar-fill-negative";
    }
    fill.classList.add(fillClass);

    const magnitude = Math.min(Math.abs(r.driftPct) / effectiveMax, 1);
    const widthPercent = magnitude * 50; // up to 50% of track on either side

    if (r.driftPct >= 0) {
      fill.style.left = "50%";
      fill.style.width = `${widthPercent}%`;
    } else {
      fill.style.right = "50%";
      fill.style.width = `${widthPercent}%`;
    }

    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "bar-value";

    let sign = "";
    if (r.driftPct > 0.1) sign = "+";
    if (r.driftPct < -0.1) sign = "";

    value.textContent = `${sign}${formatPercent(r.driftPct, 1)}`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);

    barsContainerEl.appendChild(row);
  });
}

function renderRawOutput(data) {
  const cleaned = {
    basePointValue: data.basePointValue,
    pointsCost: data.pointsCost,
    fxDriftPercent: data.driftPercent,
    baselineFx: data.baselineFx,
    shiftedFx: data.shiftedFx,
    severity: data.severity,
    partners: data.driftResults.map((r) => ({
      id: r.id,
      name: r.name,
      region: r.regionLabel,
      currency: r.currency,
      baselineLocalValue: r.baselineLocal,
      shiftedLocalValue: r.shiftedLocal,
      driftPercent: r.driftPct
    }))
  };

  rawOutputEl.textContent = JSON.stringify(cleaned, null, 2);
}

function resetToBaseline() {
  basePointValueEl.value = "0.01";
  pointsCostEl.value = "10000";

  fxUSEl.value = "1.00";
  fxEUel.value = "1.10";
  fxUKel.value = "1.27";
  fxJPel.value = "0.0070";

  driftSliderEl.value = "0";
  driftValueEl.textContent = "0%";

  updateSummaryBadge("none", "Set baseline economics and move the FX drift slider.");
  barsContainerEl.innerHTML = "";
  rawOutputEl.textContent = "No analysis yet.";
}

// Event wiring
driftSliderEl.addEventListener("input", analyzeDrift);
basePointValueEl.addEventListener("change", analyzeDrift);
pointsCostEl.addEventListener("change", analyzeDrift);
fxUSEl.addEventListener("change", analyzeDrift);
fxEUel.addEventListener("change", analyzeDrift);
fxUKel.addEventListener("change", analyzeDrift);
fxJPel.addEventListener("change", analyzeDrift);
resetBtn.addEventListener("click", () => {
  resetToBaseline();
  analyzeDrift();
});

// Initialize
resetToBaseline();
analyzeDrift();
