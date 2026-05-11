const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3ARhcx99nURf1Hg0szf-yrQ842d3nh7gBK-uxc0VTQzw6oln1JjzyENB8CoAT7e11yw/exec";

const refreshButton = document.querySelector("#refreshButton");
const userFilter = document.querySelector("#userFilter");
const dashboardStatus = document.querySelector("#dashboardStatus");
const recentRows = document.querySelector("#recentRows");

const dashboard = {
  investment: document.querySelector("#totalInvestment"),
  shares: document.querySelector("#totalShares"),
  dividend: document.querySelector("#totalDividend"),
};

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function number(value, digits = 4) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function isWebAppUrl() {
  return APPS_SCRIPT_URL.includes("script.google.com/macros/s/") && APPS_SCRIPT_URL.endsWith("/exec");
}

function loadDashboard() {
  if (!isWebAppUrl()) {
    dashboardStatus.textContent = "ยังไม่ได้ตั้งค่า Apps Script Web App URL";
    return;
  }

  const callbackName = `renderInvestmentDashboard_${Date.now()}`;
  const script = document.createElement("script");
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "list");
  url.searchParams.set("limit", "10");
  url.searchParams.set("user", userFilter.value);
  url.searchParams.set("callback", callbackName);

  dashboardStatus.textContent = "กำลังโหลดข้อมูล...";

  window[callbackName] = (data) => {
    delete window[callbackName];
    script.remove();
    renderDashboard(data);
  };

  script.onerror = () => {
    delete window[callbackName];
    script.remove();
    dashboardStatus.textContent = "โหลด Dashboard ไม่สำเร็จ";
  };

  script.src = url.toString();
  document.body.appendChild(script);
}

function renderDashboard(data) {
  if (!data || !data.ok) {
    dashboardStatus.textContent = "อ่านข้อมูลจาก Google Sheet ไม่สำเร็จ";
    return;
  }

  const totals = data.totals || {};
  const selectedUser = userFilter.value;
  const rows = (data.rows || []).filter((row) => {
    const rowUser = String(row.user || "").toLowerCase();
    return !rowUser || rowUser === selectedUser;
  });

  dashboard.investment.textContent = money(totals.cumulativeInvestment);
  dashboard.shares.textContent = number(totals.cumulativeShares);
  dashboard.dividend.textContent = money(totals.cumulativeDividend);

  if (!rows.length) {
    recentRows.innerHTML = `<tr><td colspan="6">ยังไม่มีข้อมูล</td></tr>`;
    dashboardStatus.textContent = `ยังไม่มีรายการของ ${selectedUser}`;
    return;
  }

  recentRows.innerHTML = rows.map((row) => `
    <tr>
      <td>${formatDate(row.tradeDate)}</td>
      <td>${row.ticker || "-"}</td>
      <td>${money(row.price)}</td>
      <td>${money(row.amount)}</td>
      <td>${number(row.shares)}</td>
      <td>${money(row.expectedDividend)}</td>
    </tr>
  `).join("");

  dashboardStatus.textContent = `แสดง ${rows.length} รายการล่าสุดของ ${selectedUser}`;
}

userFilter.addEventListener("change", loadDashboard);
refreshButton.addEventListener("click", loadDashboard);
loadDashboard();
