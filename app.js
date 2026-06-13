const starterData = {
  date: "2026-06-13",
  province: "Khon Kaen",
  status: "Starter sample - replace with confirmed daily station prices",
  fuels: ["Gasohol 95", "Gasohol 91", "E20", "E85", "Diesel B7", "Premium Diesel"],
  stations: [
    {
      brand: "PTT OR",
      station: "PTT Station Mittraphap Khon Kaen",
      district: "Mueang Khon Kaen",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.15, "Gasohol 91": 36.78, E20: 34.94, E85: 33.59, "Diesel B7": 31.94, "Premium Diesel": 43.94 }
    },
    {
      brand: "Bangchak",
      station: "Bangchak Mueang Khon Kaen",
      district: "Mueang Khon Kaen",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.05, "Gasohol 91": 36.68, E20: 34.84, E85: 33.49, "Diesel B7": 31.94, "Premium Diesel": 43.84 }
    },
    {
      brand: "Shell",
      station: "Shell Mittraphap Khon Kaen",
      district: "Mueang Khon Kaen",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.35, "Gasohol 91": 36.98, E20: 35.14, E85: null, "Diesel B7": 32.14, "Premium Diesel": 45.44 }
    },
    {
      brand: "Caltex",
      station: "Caltex Khon Kaen",
      district: "Mueang Khon Kaen",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.24, "Gasohol 91": 36.87, E20: 35.03, E85: null, "Diesel B7": 32.04, "Premium Diesel": 44.74 }
    },
    {
      brand: "PT",
      station: "PT Ban Phai",
      district: "Ban Phai",
      source: "Manual daily check",
      prices: { "Gasohol 95": 36.99, "Gasohol 91": 36.62, E20: 34.78, E85: null, "Diesel B7": 31.89, "Premium Diesel": 43.69 }
    },
    {
      brand: "Susco",
      station: "Susco Chum Phae",
      district: "Chum Phae",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.09, "Gasohol 91": 36.72, E20: 34.88, E85: null, "Diesel B7": 31.94, "Premium Diesel": null }
    },
    {
      brand: "PTT OR",
      station: "PTT Station Nam Phong",
      district: "Nam Phong",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.15, "Gasohol 91": 36.78, E20: 34.94, E85: 33.59, "Diesel B7": 31.94, "Premium Diesel": 43.94 }
    },
    {
      brand: "Bangchak",
      station: "Bangchak Phon",
      district: "Phon",
      source: "Manual daily check",
      prices: { "Gasohol 95": 37.05, "Gasohol 91": 36.68, E20: 34.84, E85: null, "Diesel B7": 31.94, "Premium Diesel": 43.84 }
    }
  ]
};

const brandColors = {
  "PTT OR": "#1d5aa6",
  Bangchak: "#16a05d",
  Shell: "#d73a2f",
  Caltex: "#284f9f",
  PT: "#c42131",
  Susco: "#f09b22"
};

const state = {
  data: loadData(),
  fuel: "",
  district: "All districts",
  sort: "price"
};

const els = {
  dataDate: document.querySelector("#dataDate"),
  dataStatus: document.querySelector("#dataStatus"),
  fuelSelect: document.querySelector("#fuelSelect"),
  districtSelect: document.querySelector("#districtSelect"),
  sortSelect: document.querySelector("#sortSelect"),
  refreshBtn: document.querySelector("#refreshBtn"),
  editBtn: document.querySelector("#editBtn"),
  cheapestValue: document.querySelector("#cheapestValue"),
  cheapestLabel: document.querySelector("#cheapestLabel"),
  highestValue: document.querySelector("#highestValue"),
  highestLabel: document.querySelector("#highestLabel"),
  spreadValue: document.querySelector("#spreadValue"),
  stationCount: document.querySelector("#stationCount"),
  boardTitle: document.querySelector("#boardTitle"),
  boardHint: document.querySelector("#boardHint"),
  priceRows: document.querySelector("#priceRows"),
  brandCards: document.querySelector("#brandCards"),
  editor: document.querySelector("#editor"),
  dataEditor: document.querySelector("#dataEditor"),
  applyDataBtn: document.querySelector("#applyDataBtn"),
  resetDataBtn: document.querySelector("#resetDataBtn"),
  editorMessage: document.querySelector("#editorMessage")
};

init();

function init() {
  state.fuel = state.data.fuels[0] || "";
  renderControls();
  render();

  els.fuelSelect.addEventListener("change", (event) => {
    state.fuel = event.target.value;
    render();
  });

  els.districtSelect.addEventListener("change", (event) => {
    state.district = event.target.value;
    render();
  });

  els.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  els.editBtn.addEventListener("click", () => {
    els.editor.classList.toggle("is-hidden");
    els.dataEditor.value = JSON.stringify(state.data, null, 2);
    els.editorMessage.textContent = "";
  });

  els.applyDataBtn.addEventListener("click", applyEditedData);
  els.resetDataBtn.addEventListener("click", resetData);
  els.refreshBtn.addEventListener("click", refreshFromStaticJson);
}

function loadData() {
  const saved = localStorage.getItem("khonKaenOilPrices");
  if (!saved) return structuredClone(starterData);

  try {
    return normalizeData(JSON.parse(saved));
  } catch {
    return structuredClone(starterData);
  }
}

function normalizeData(data) {
  if (!data || !Array.isArray(data.stations)) {
    throw new Error("Missing stations array.");
  }

  const fuels = Array.isArray(data.fuels) && data.fuels.length
    ? data.fuels
    : Array.from(new Set(data.stations.flatMap((station) => Object.keys(station.prices || {}))));

  return {
    date: data.date || new Date().toISOString().slice(0, 10),
    province: data.province || "Khon Kaen",
    status: data.status || "User data",
    fuels,
    stations: data.stations.map((station) => ({
      brand: station.brand || "Unknown",
      station: station.station || "Unnamed station",
      district: station.district || "Unknown district",
      source: station.source || "Manual",
      prices: station.prices || {}
    }))
  };
}

function renderControls() {
  els.fuelSelect.innerHTML = state.data.fuels
    .map((fuel) => `<option value="${escapeHtml(fuel)}">${escapeHtml(fuel)}</option>`)
    .join("");

  const districts = ["All districts", ...Array.from(new Set(state.data.stations.map((station) => station.district))).sort()];
  els.districtSelect.innerHTML = districts
    .map((district) => `<option value="${escapeHtml(district)}">${escapeHtml(district)}</option>`)
    .join("");
  els.fuelSelect.value = state.fuel;
  els.districtSelect.value = state.district;
}

function render() {
  const rows = getRows();
  const pricedRows = rows.filter((row) => typeof row.price === "number");
  const cheapest = pricedRows[0];
  const highest = pricedRows[pricedRows.length - 1];
  const spread = cheapest && highest ? highest.price - cheapest.price : null;

  els.dataDate.textContent = `Date: ${state.data.date}`;
  els.dataStatus.textContent = state.data.status;
  els.boardTitle.textContent = `${state.fuel} in ${state.district === "All districts" ? state.data.province : state.district}`;
  els.boardHint.textContent = `${pricedRows.length} priced entries, ${rows.length - pricedRows.length} unavailable for this fuel.`;

  els.cheapestValue.textContent = cheapest ? formatPrice(cheapest.price) : "-";
  els.cheapestLabel.textContent = cheapest ? `${cheapest.brand} - ${cheapest.station}` : "-";
  els.highestValue.textContent = highest ? formatPrice(highest.price) : "-";
  els.highestLabel.textContent = highest ? `${highest.brand} - ${highest.station}` : "-";
  els.spreadValue.textContent = spread === null ? "-" : spread.toFixed(2);
  els.stationCount.textContent = rows.length;

  renderTable(rows, cheapest);
  renderBrandCards(pricedRows);
}

function getRows() {
  const rows = state.data.stations
    .filter((station) => state.district === "All districts" || station.district === state.district)
    .map((station) => ({
      ...station,
      price: station.prices[state.fuel]
    }));

  return rows.sort((a, b) => {
    if (state.sort === "brand") return a.brand.localeCompare(b.brand) || comparePrices(a.price, b.price);
    if (state.sort === "district") return a.district.localeCompare(b.district) || comparePrices(a.price, b.price);
    return comparePrices(a.price, b.price);
  });
}

function comparePrices(a, b) {
  const left = typeof a === "number" ? a : Number.POSITIVE_INFINITY;
  const right = typeof b === "number" ? b : Number.POSITIVE_INFINITY;
  return left - right;
}

function renderTable(rows, cheapest) {
  els.priceRows.innerHTML = rows.map((row) => {
    const hasPrice = typeof row.price === "number";
    const diff = hasPrice && cheapest ? row.price - cheapest.price : null;
    const diffClass = diff === 0 ? "diff-low" : "diff-high";

    return `
      <tr>
        <td>
          <span class="brand-pill">
            <span class="swatch" style="background:${brandColors[row.brand] || "#647084"}"></span>
            ${escapeHtml(row.brand)}
          </span>
        </td>
        <td>${escapeHtml(row.station)}</td>
        <td>${escapeHtml(row.district)}</td>
        <td class="num price">${hasPrice ? formatPrice(row.price) : "N/A"}</td>
        <td class="num ${diffClass}">${diff === null ? "-" : diff === 0 ? "Best" : `+${diff.toFixed(2)}`}</td>
        <td class="source">${escapeHtml(row.source)}</td>
      </tr>
    `;
  }).join("");
}

function renderBrandCards(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const bucket = grouped.get(row.brand) || [];
    bucket.push(row.price);
    grouped.set(row.brand, bucket);
  });

  els.brandCards.innerHTML = Array.from(grouped.entries()).map(([brand, prices]) => {
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const min = Math.min(...prices);
    return `
      <article class="brand-card">
        <span class="brand-pill">
          <span class="swatch" style="background:${brandColors[brand] || "#647084"}"></span>
          ${escapeHtml(brand)}
        </span>
        <strong>${formatPrice(average)}</strong>
        <small>Best ${formatPrice(min)} across ${prices.length} station${prices.length === 1 ? "" : "s"}</small>
      </article>
    `;
  }).join("") || "<p>No priced entries for this filter.</p>";
}

async function refreshFromStaticJson() {
  els.dataStatus.textContent = "Checking data/prices.json";
  try {
    const response = await fetch("data/prices.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No local JSON source found.");
    state.data = normalizeData(await response.json());
    state.fuel = state.data.fuels.includes(state.fuel) ? state.fuel : state.data.fuels[0];
    state.district = "All districts";
    saveData();
    renderControls();
    render();
  } catch (error) {
    els.dataStatus.textContent = "Refresh unavailable - using browser data";
    els.boardHint.textContent = `${error.message} Open through a local server for JSON refresh.`;
  }
}

function applyEditedData() {
  try {
    state.data = normalizeData(JSON.parse(els.dataEditor.value));
    state.fuel = state.data.fuels.includes(state.fuel) ? state.fuel : state.data.fuels[0];
    state.district = "All districts";
    saveData();
    renderControls();
    render();
    els.editorMessage.textContent = "Applied.";
  } catch (error) {
    els.editorMessage.textContent = error.message;
  }
}

function resetData() {
  localStorage.removeItem("khonKaenOilPrices");
  state.data = structuredClone(starterData);
  state.fuel = state.data.fuels[0];
  state.district = "All districts";
  els.dataEditor.value = JSON.stringify(state.data, null, 2);
  renderControls();
  render();
  els.editorMessage.textContent = "Reset.";
}

function saveData() {
  localStorage.setItem("khonKaenOilPrices", JSON.stringify(state.data));
}

function formatPrice(value) {
  return `${value.toFixed(2)} THB`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
