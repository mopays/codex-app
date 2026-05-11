const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3ARhcx99nURf1Hg0szf-yrQ842d3nh7gBK-uxc0VTQzw6oln1JjzyENB8CoAT7e11yw/exec";

const form = document.querySelector("#investmentForm");
const submitButton = document.querySelector("#submitButton");
const statusMessage = document.querySelector("#statusMessage");

const fields = {
  user: document.querySelector("#user"),
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
  }).format(Number(value) || 0);
}

function number(value, digits = 4) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
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

function isWebAppUrl() {
  return APPS_SCRIPT_URL.includes("script.google.com/macros/s/") && APPS_SCRIPT_URL.endsWith("/exec");
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", updatePreview);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isWebAppUrl()) {
    setStatus("Apps Script URL ต้องเป็น Web App URL ที่ลงท้าย /exec", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("กำลังบันทึก...");

  const payload = new FormData(form);
  payload.set("user", fields.user.value);
  payload.set("dividendTax", String(Number(fields.dividendTax.value || 10) / 100));

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: payload,
    });

    setStatus("ส่งข้อมูลแล้ว เปิดหน้า Dashboard เพื่อตรวจรายการล่าสุด", "success");
    form.reset();
    fields.user.value = "folk";
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
