const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbziC0ZKb6oOWXKBC2rI7v-jtViDX6UkWO2xaL_G_Pw77W6KC5DKPV-lgLUycdHOEVwDkA/exec";

const form = document.querySelector("#investmentForm");
const submitButton = document.querySelector("#submitButton");
const statusMessage = document.querySelector("#statusMessage");

const fields = {
  tradeDate: document.querySelector("#tradeDate"),
  ticker: document.querySelector("#ticker"),
  price: document.querySelector("#price"),
  amount: document.querySelector("#amount"),
  dividendPerShare: document.querySelector("#dividendPerShare"),
  dividendTax: document.querySelector("#dividendTax"),
};

const preview = {
  shares: document.querySelector("#previewShares"),
  dividend: document.querySelector("#previewDividend"),
  price: document.querySelector("#previewPrice"),
};

fields.tradeDate.valueAsDate = new Date();

function money(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(value);
}

function number(value, digits = 4) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function updatePreview() {
  const price = Number(fields.price.value);
  const amount = Number(fields.amount.value);
  const dividendPerShare = Number(fields.dividendPerShare.value);
  const taxRate = Number(fields.dividendTax.value || 10) / 100;

  if (!price || !amount) {
    preview.shares.textContent = "-";
    preview.dividend.textContent = "-";
    preview.price.textContent = "-";
    return;
  }

  const shares = amount / price;
  const expectedDividend = shares * dividendPerShare * (1 - taxRate);

  preview.shares.textContent = number(shares);
  preview.dividend.textContent = money(expectedDividend || 0);
  preview.price.textContent = money(price);
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status ${type}`.trim();
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", updatePreview);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isAppsScriptWebAppUrl =
    APPS_SCRIPT_URL.includes("script.google.com/macros/s/") &&
    APPS_SCRIPT_URL.endsWith("/exec");

  if (APPS_SCRIPT_URL.includes("PASTE_YOUR") || !isAppsScriptWebAppUrl) {
    setStatus("Apps Script URL ต้องเป็น Web App URL ที่ลงท้าย /exec ไม่ใช่หน้าแก้ไขสคริปต์", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("กำลังบันทึก...");

  const payload = new FormData(form);
  payload.set("dividendTax", String(Number(fields.dividendTax.value || 10) / 100));

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    });

    setStatus("ส่งข้อมูลแล้ว โปรดตรวจแถวใหม่ใน Google Sheet", "success");
    form.reset();
    fields.tradeDate.valueAsDate = new Date();
    fields.dividendTax.value = "10";
    updatePreview();
  } catch (error) {
    setStatus("บันทึกไม่สำเร็จ ลองตรวจ URL หรือสิทธิ์ Apps Script", "error");
  } finally {
    submitButton.disabled = false;
  }
});

updatePreview();
