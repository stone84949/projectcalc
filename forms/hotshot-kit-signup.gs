/**
 * Hotshot Math operator-kit sign-up (Google Apps Script, free with a Google account).
 *
 * Lives inside a Google Sheet: Extensions > Apps Script. Deployed as a web app.
 * hotshot/hotshot.js POSTs the kit form here (form-encoded) and reads back JSON:
 *   { ok: true }  or  { ok: false, error: 'email' | 'consent' }
 * Each real sign-up adds one row to the Signups tab: time, email, consent, source page.
 * Setup steps: HOTSHOT-EMAIL-SETUP.md at the repo root. Modeled on the Knox Site Factory lead form.
 */
const SHEET_NAME = 'Signups';
const HEADERS = ['Received', 'Email', 'Consent', 'Source page', 'Status'];
const MAX_EMAIL = 254;
const MAX_SOURCE = 200;
const MIN_FILL_MS = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Bot checks. Answer "ok" so bots learn nothing, but store nothing.
  if (clean_(p.company_fax, 200)) return reply_(true);          // hidden field people never see
  if (!(Number(p.elapsed_ms) >= MIN_FILL_MS)) return reply_(true); // missing, or faster than a person types

  const email = clean_(p.email, MAX_EMAIL + 1).toLowerCase();
  if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) return reply_(false, 'email');
  if (!/^(yes|on|true)$/i.test(clean_(p.consent, 10))) return reply_(false, 'consent');
  const source = cleanSource_(p.source);

  // Same email twice inside two minutes is a double-click, not a new sign-up.
  const cache = CacheService.getScriptCache();
  const key = 'kit:' + email;
  if (cache.get(key)) return reply_(true);
  cache.put(key, '1', 120);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_();
    // Already on the list: say ok, keep one row per email.
    const found = sheet.getLastRow() > 1 &&
      sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(email).matchEntireCell(true).findNext();
    if (!found) sheet.appendRow([new Date(), safeCell_(email), 'yes', safeCell_(source), 'New']);
  } finally {
    lock.releaseLock();
  }
  return reply_(true);
}

function doGet() {
  return ContentService.createTextOutput('Hotshot Math kit sign-up is running.');
}

/** Run once from the editor: approves access to the sheet, then adds one test row. */
function testSignup() {
  const result = doPost({ parameter: {
    email: 'kit-test@example.com', consent: 'yes', source: '/hotshot/', elapsed_ms: '9999',
  } });
  console.log(result.getContent());
}

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Source page is a site path like /hotshot/ (no query string, no outside URLs).
function cleanSource_(value) {
  const path = clean_(value, MAX_SOURCE).split(/[?#]/)[0];
  return /^\/[A-Za-z0-9._~\/-]*$/.test(path) ? path : '';
}

function clean_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

// Stop a submitted value from running as a spreadsheet formula.
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function reply_(ok, error) {
  return ContentService.createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, error: error }))
    .setMimeType(ContentService.MimeType.JSON);
}
