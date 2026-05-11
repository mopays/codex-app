const SPREADSHEET_ID = '1WmLVcOH3nPOfgXbLFrLBvKDtntjRtPW54ArdZm3kgDg';
const DATA_SHEET_NAME = 'investment_data';
const HEADER_ROW = 1;
const DATA_START_ROW = 2;

function doGet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);

  return jsonResponse_({
    ok: Boolean(sheet),
    spreadsheetId: SPREADSHEET_ID,
    sheetName: DATA_SHEET_NAME,
    lastRow: sheet ? sheet.getLastRow() : null
  });
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);

  const tradeDate = params.tradeDate ? new Date(params.tradeDate) : null;
  const ticker = String(params.ticker || '').trim().toUpperCase();
  const price = Number(params.price);
  const amount = Number(params.amount);
  const dividendPerShare = Number(params.dividendPerShare);
  const dividendTax = Number(params.dividendTax || 0.10);

  if (!sheet) {
    return jsonResponse_({ ok: false, error: 'missing_data_sheet' });
  }

  if (!tradeDate || !ticker || !price || !amount || !dividendPerShare) {
    return jsonResponse_({ ok: false, error: 'missing_required_fields' });
  }

  const previous = getPreviousTotals_(sheet);
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

  return jsonResponse_({
    ok: true,
    row: writeRow,
    id,
    shares,
    expectedDividend,
    cumulativeInvestment,
    cumulativeShares,
    cumulativeDividend
  });
}

function getPreviousTotals_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return { investment: 0, shares: 0 };
  }

  const lastData = sheet.getRange(lastRow, 1, 1, 16).getValues()[0];
  return {
    investment: Number(lastData[10]) || 0,
    shares: Number(lastData[11]) || 0
  };
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
