# Stock Investment Logger

Static HTML/CSS/JS web app for recording stock investments into Google Sheets.

## Project Files

- `index.html` - public web page
- `styles.css` - page styling
- `script.js` - browser-side submit logic
- `apps-script/Code.gs` - Google Apps Script Web App backend
- `.gitignore` - safe defaults for Git

## Google Sheet Structure

Target spreadsheet:

`1WmLVcOH3nPOfgXbLFrLBvKDtntjRtPW54ArdZm3kgDg`

Main data sheet:

`investment_data`

Columns:

1. `id`
2. `created_at`
3. `trade_date`
4. `ticker`
5. `price`
6. `amount`
7. `shares`
8. `dividend_per_share`
9. `dividend_tax`
10. `expected_dividend`
11. `cumulative_investment`
12. `cumulative_shares`
13. `cumulative_expected_dividend`
14. `source`
15. `note`
16. `raw_payload`

## Setup Apps Script

1. Open the Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Delete the old code in `Code.gs`.
4. Paste the code from `apps-script/Code.gs`.
5. Click `Deploy > New deployment`.
6. Select type `Web app`.
7. Set `Execute as` to `Me`.
8. Set `Who has access` to `Anyone`.
9. Deploy and copy the Web App URL.
10. Open `script.js` and replace:

```js
PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE
```

with your Web App URL.

## Free Public Hosting

Recommended: Cloudflare Pages

1. Create a GitHub repository.
2. Push this folder to GitHub.
3. Open Cloudflare Dashboard > Workers & Pages.
4. Create application > Pages.
5. Import the GitHub repository.
6. Build command: `exit 0`
7. Build output directory: `/`
8. Deploy.

Cloudflare will give you a public URL like:

`https://your-project.pages.dev`

## Security Note

The Apps Script Web App endpoint accepts public POST requests when deployed as `Anyone`.
For private use this is usually fine, but do not share the endpoint widely.
If this becomes public-facing, add a secret token check in both `script.js` and `apps-script/Code.gs`.
