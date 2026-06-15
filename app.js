const BRAND_MAP = {
  ptt: "PTT OR",
  bcp: "Bangchak",
  shell: "Shell",
  caltex: "Caltex",
  pt: "PT",
  susco: "Susco",
  pure: "Pure"
};

const FUEL_KEYS = {
  "Gasohol 95": ["gasohol_95"],
  "Gasohol 91": ["gasohol_91"]
};

/** Bangkok retail → Khon Kaen provincial (no BKK maintenance tax, + transport) */
const KHON_KAEN_OFFSET = {
  "Gasohol 95": -4.85,
  "Gasohol 91": -4.85
};

const brandColors = {
  "PTT OR": "#1d5aa6",
  Bangchak: "#16a05d",
  Shell: "#d73a2f",
  Caltex: "#284f9f",
  PT: "#c42131",
  Susco: "#f09b22",
  Pure: "#6b4c9a"
};

const state = {
  data: null,
  fuel: "Gasohol 95"
};

const els = {
  dataDate: document.querySelector("#dataDate"),
  dataStatus: document.querySelector("#dataStatus"),
  fuelSelect: document.querySelector("#fuelSelect"),
  refreshBtn: document.querySelector("#refreshBtn"),
  cheapestValue: document.querySelector("#cheapestValue"),
  cheapestLabel: document.querySelector("#cheapestLabel"),
  highestValue: document.querySelector("#highestValue"),
  highestLabel: document.querySelector("#highestLabel"),
  spreadValue: document.querySelector("#spreadValue"),
  brandCount: document.querySelector("#brandCount"),
  boardTitle: document.querySelector("#boardTitle"),
  boardHint: document.querySelector("#boardHint"),
  priceList: document.querySelector("#priceList"),
  dualGrid: document.querySelector("#dualGrid")
};

init();

async function init() {
  renderFuelSelect();
  await loadPrices();
  els.fuelSelect.addEventListener("change", (e) => {
    state.fuel = e.target.value;
    render();
  });
  els.refreshBtn.addEventListener("click", () => loadPrices(true));
}

function renderFuelSelect() {
  els.fuelSelect.innerHTML = ["Gasohol 95", "Gasohol 91"]
    .map((f) => `<option value="${f}">${f}</option>`)
    .join("");
  els.fuelSelect.value = state.fuel;
}

async function loadPrices(manual = false) {
  els.dataStatus.textContent = manual ? "กำลังอัปเดต..." : "กำลังโหลด...";
  try {
    const live = await fetchLivePrices();
    if (live) {
      state.data = live;
      els.dataStatus.textContent = "อัปเดตจาก API แบรนด์หลัก";
    } else {
      state.data = await fetchStaticPrices();
      els.dataStatus.textContent = "ใช้ข้อมูลสำรอง (data/prices.json)";
    }
  } catch {
    state.data = await fetchStaticPrices();
    els.dataStatus.textContent = "ใช้ข้อมูลสำรอง";
  }
  render();
}

async function fetchStaticPrices() {
  const res = await fetch("data/prices.json", { cache: "no-store" });
  return normalizeStatic(await res.json());
}

async function fetchLivePrices() {
  const res = await fetch("https://api.chnwt.dev/thai-oil-api/latest", { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.status !== "success" || !json.response?.stations) return null;
  return normalizeLive(json.response);
}

function normalizeStatic(data) {
  return {
    date: data.date || today(),
    district: data.district || "Mueang Khon Kaen",
    brands: (data.brands || []).map((b) => ({
      brand: b.brand,
      prices: {
        "Gasohol 95": b.prices?.["Gasohol 95"],
        "Gasohol 91": b.prices?.["Gasohol 91"]
      },
      source: b.source || "Static"
    }))
  };
}

function normalizeLive(response) {
  const stations = response.stations;
  const dateStr = response.date || today();
  const brands = [];

  for (const [key, label] of Object.entries(BRAND_MAP)) {
    const station = stations[key];
    if (!station) continue;

    const prices = {};
    for (const [fuel, keys] of Object.entries(FUEL_KEYS)) {
      const raw = keys.map((k) => station[k]?.price).find((p) => p != null);
      if (raw != null) {
        const base = parseFloat(raw);
        prices[fuel] = round2(base + KHON_KAEN_OFFSET[fuel]);
      }
    }

    if (prices["Gasohol 95"] != null || prices["Gasohol 91"] != null) {
      brands.push({
        brand: label,
        prices,
        source: "thai-oil-api + KK provincial"
      });
    }
  }

  return {
    date: parseThaiDate(dateStr) || today(),
    district: "Mueang Khon Kaen",
    brands: brands.sort((a, b) => comparePrices(a.prices["Gasohol 95"], b.prices["Gasohol 95"]))
  };
}

function parseThaiDate(str) {
  const m = str.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!m) return null;
  const months = {
    มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
    พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
    กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12
  };
  const day = parseInt(m[1], 10);
  const month = months[m[2]];
  const year = parseInt(m[3], 10) - 543;
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function render() {
  if (!state.data) return;

  const rows = getSortedRows(state.fuel);
  const priced = rows.filter((r) => typeof r.price === "number");
  const cheapest = priced[0];
  const highest = priced[priced.length - 1];
  const spread = cheapest && highest ? highest.price - cheapest.price : null;

  els.dataDate.textContent = `วันที่ ${formatDisplayDate(state.data.date)}`;
  els.boardTitle.textContent = `${state.fuel} — อำเภอเมืองขอนแก่น`;
  els.boardHint.textContent = `${priced.length} แบรนด์ · เรียงจากถูกไปแพง`;

  els.cheapestValue.textContent = cheapest ? formatPrice(cheapest.price) : "—";
  els.cheapestLabel.textContent = cheapest?.brand ?? "—";
  els.highestValue.textContent = highest ? formatPrice(highest.price) : "—";
  els.highestLabel.textContent = highest?.brand ?? "—";
  els.spreadValue.textContent = spread == null ? "—" : spread.toFixed(2);
  els.brandCount.textContent = priced.length;

  renderPriceList(rows, cheapest);
  renderDualGrid();
}

function getSortedRows(fuel) {
  return state.data.brands
    .map((b) => ({ ...b, price: b.prices[fuel] }))
    .sort((a, b) => comparePrices(a.price, b.price));
}

function renderPriceList(rows, cheapest) {
  els.priceList.innerHTML = rows.map((row, i) => {
    const hasPrice = typeof row.price === "number";
    const diff = hasPrice && cheapest ? row.price - cheapest.price : null;
    const rank = i + 1;
    const color = brandColors[row.brand] || "#647084";

    return `
      <article class="price-row ${rank === 1 ? "is-best" : ""}" style="--brand:${color}">
        <div class="rank">${rank}</div>
        <div class="brand-block">
          <span class="swatch"></span>
          <div>
            <strong class="brand-name">${escapeHtml(row.brand)}</strong>
            <span class="source">${escapeHtml(row.source)}</span>
          </div>
        </div>
        <div class="price-block">
          <span class="price">${hasPrice ? formatPrice(row.price) : "N/A"}</span>
          <span class="diff ${diff === 0 ? "diff-best" : "diff-more"}">
            ${diff == null ? "—" : diff === 0 ? "ถูกที่สุด" : `+${diff.toFixed(2)} บาท`}
          </span>
        </div>
      </article>
    `;
  }).join("") || "<p class='empty'>ไม่มีข้อมูลราคา</p>";
}

function renderDualGrid() {
  const fuels = ["Gasohol 95", "Gasohol 91"];
  els.dualGrid.innerHTML = fuels.map((fuel) => {
    const rows = getSortedRows(fuel);
    return `
      <div class="dual-card">
        <h3>${fuel}</h3>
        <ol class="mini-list">
          ${rows.map((r, i) => `
            <li>
              <span class="mini-rank">${i + 1}</span>
              <span class="mini-brand" style="color:${brandColors[r.brand] || "#18212f"}">${escapeHtml(r.brand)}</span>
              <span class="mini-price">${typeof r.price === "number" ? r.price.toFixed(2) : "—"}</span>
            </li>
          `).join("")}
        </ol>
      </div>
    `;
  }).join("");
}

function comparePrices(a, b) {
  const left = typeof a === "number" ? a : Infinity;
  const right = typeof b === "number" ? b : Infinity;
  return left - right;
}

function formatPrice(v) {
  return `${v.toFixed(2)} ฿`;
}

function formatDisplayDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function escapeHtml(v) {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
