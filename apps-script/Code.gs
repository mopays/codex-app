const SPREADSHEET_ID = '1WmLVcOH3nPOfgXbLFrLBvKDtntjRtPW54ArdZm3kgDg';
const DATA_SHEET_NAME = 'investment_data';
const DATA_START_ROW = 2;
const USERS = ['folk', 'jane'];

function doGet(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);
  const params = (e && e.parameter) || {};

  if (params.action === 'list') {
    return jsonOrJsonpResponse_(buildListResponse_(sheet, Number(params.limit || 10), normalizeUser_(params.user)), params.callback);
  }

  return jsonOrJsonpResponse_({
    ok: Boolean(sheet),
    spreadsheetId: SPREADSHEET_ID,
    sheetName: DATA_SHEET_NAME,
    lastRow: sheet ? sheet.getLastRow() : null
  }, params.callback);
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);

  const user = normalizeUser_(params.user);
  const tradeDate = params.tradeDate ? new Date(params.tradeDate) : null;
  const ticker = String(params.ticker || '').trim().toUpperCase();
  const price = Number(params.price);
  const amount = Number(params.amount);
  const dividendPerShare = Number(params.dividendPerShare);
  const dividendTax = Number(params.dividendTax || 0.10);

  if (!sheet) {
    return jsonResponse_({ ok: false, error: 'missing_data_sheet' });
  }

  if (!user || !tradeDate || !ticker || !price || !amount || !dividendPerShare) {
    return jsonResponse_({ ok: false, error: 'missing_required_fields' });
  }

  const previous = getPreviousTotals_(sheet, user);
  const shares = amount / price;
  const expectedDividend = shares * dividendPerShare * (1 - dividendTax);
  const cumulativeInvestment = previous.investment + amount;
  const cumulativeShares = previous.shares + shares;
  const cumulativeDividend = cumulativeShares * dividendPerShare * (1 - dividendTax);
  const createdAt = new Date();
  const id = Utilities.getUuid();

  const writeRow = Math.max(sheet.getLastRow() + 1, DATA_START_ROW);
  sheet.getRange(writeRow, 1, 1, 16).setValues([[
    id,
    createdAt,
    tradeDate,
    ticker,
    price,
    amount,
    shares,
    dividendPerShare,
    dividendTax,
    expectedDividend,
    cumulativeInvestment,
    cumulativeShares,
    cumulativeDividend,
    'web',
    '',
    JSON.stringify(params)
  ]]);
  sheet.getRange(writeRow, 17).setValue(user);

  return jsonResponse_({
    ok: true,
    row: writeRow,
    id,
    user,
    shares,
    expectedDividend,
    cumulativeInvestment,
    cumulativeShares,
    cumulativeDividend
  });
}

function getPreviousTotals_(sheet, user) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return { investment: 0, shares: 0 };
  }

  const values = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, sheet.getLastColumn()).getValues();
  const matching = values.filter((row) => getRowUser_(row) === user);
  const lastData = matching[matching.length - 1] || [];

  return {
    investment: Number(lastData[10]) || 0,
    shares: Number(lastData[11]) || 0
  };
}

function buildListResponse_(sheet, limit, user) {
  if (!sheet) {
    return { ok: false, error: 'missing_data_sheet', rows: [], totals: {} };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return {
      ok: true,
      user,
      rows: [],
      totals: {
        cumulativeInvestment: 0,
        cumulativeShares: 0,
        cumulativeDividend: 0
      }
    };
  }

  const rowCount = lastRow - DATA_START_ROW + 1;
  const values = sheet.getRange(DATA_START_ROW, 1, rowCount, sheet.getLastColumn()).getValues();
  const filtered = values.filter((row) => getRowUser_(row) === user);
  const recent = filtered
    .slice(-Math.max(1, Math.min(limit || 10, 50)))
    .reverse();
  const lastData = filtered[filtered.length - 1] || [];

  return {
    ok: true,
    user,
    rows: recent.map(rowToRecord_),
    totals: {
      cumulativeInvestment: Number(lastData[10]) || 0,
      cumulativeShares: Number(lastData[11]) || 0,
      cumulativeDividend: Number(lastData[12]) || 0
    }
  };
}

function rowToRecord_(row) {
  return {
    id: row[0],
    createdAt: toIso_(row[1]),
    tradeDate: toIso_(row[2]),
    ticker: row[3],
    price: Number(row[4]) || 0,
    amount: Number(row[5]) || 0,
    shares: Number(row[6]) || 0,
    dividendPerShare: Number(row[7]) || 0,
    dividendTax: Number(row[8]) || 0,
    expectedDividend: Number(row[9]) || 0,
    cumulativeInvestment: Number(row[10]) || 0,
    cumulativeShares: Number(row[11]) || 0,
    cumulativeDividend: Number(row[12]) || 0,
    source: row[13],
    note: row[14],
    user: getRowUser_(row)
  };
}

function normalizeUser_(value) {
  const user = String(value || 'folk').trim().toLowerCase();
  return USERS.indexOf(user) >= 0 ? user : 'folk';
}

function getRowUser_(row) {
  const directUser = String(row[16] || '').trim().toLowerCase();
  if (USERS.indexOf(directUser) >= 0) {
    return directUser;
  }

  try {
    const payload = JSON.parse(String(row[15] || '{}'));
    return normalizeUser_(payload.user);
  } catch (error) {
    return 'folk';
  }
}

function toIso_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  return String(value);
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonpResponse_(body, callback) {
  if (!callback) {
    return jsonResponse_(body);
  }

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(body)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
