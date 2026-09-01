// Receives waitlist signups from the site's hero form and appends them to the
// spreadsheet this script is bound to.
//
// This does not run in CI and is not called by anything else in the repo. It
// lives here so the endpoint's behaviour is reviewable alongside the form that
// posts to it — the deployed copy is pasted into the sheet's Apps Script editor
// (Extensions › Apps Script) and published as a web app.
//
// Deploy settings that matter:
//   Execute as:      Me
//   Who has access:  Anyone
// "Anyone" is what lets an unauthenticated visitor's browser post, and it opens
// up the endpoint, not the spreadsheet — the sheet's own sharing is untouched
// and a stranger with this URL still cannot open it. There is no doGet, so the
// only thing reachable is the append below, and every reply is the same two
// fixed shapes regardless of what is in the sheet.

const SHEET_NAME = 'Sheet1';
const HEADERS = ['Email', 'Signed up', 'Source'];

function doPost(e) {
  try {
    // The form posts text/plain to avoid a CORS preflight, so the body arrives
    // as a raw string rather than in e.parameter.
    const data = JSON.parse(e.postData.contents);
    // Capped before anything else. The endpoint is public, so the body is
    // whatever a stranger decided to send; without a limit a single request can
    // write a cell megabytes long.
    const email = String(data.email || '').trim().toLowerCase().slice(0, 254);
    const source = String(data.source || '').slice(0, 200);

    // Honeypot: the form's "company" field is invisible to people, so anything
    // in it means the submission was automated. Reply exactly as if it worked —
    // telling a bot it was caught only tells whoever wrote it what to fix.
    if (String(data.company || '').trim()) return reply({ ok: true });

    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return reply({ ok: false });

    const sheet = getSheet();

    // Re-submitting the same address is a normal thing for a person to do —
    // they forget they signed up. Treat it as success and do not add a row.
    //
    // The reply is deliberately identical to a first-time signup. Saying
    // "duplicate" would let anyone with the endpoint URL test whether a given
    // address is on the list, one address at a time. The browser cannot read
    // this response anyway (the form posts no-cors), but curl can.
    const existing = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String)
      : [];
    if (existing.includes(email)) return reply({ ok: true });

    sheet.appendRow([email, new Date(), source]);
    return reply({ ok: true });
  } catch (err) {
    // Logged where only the owner can see it. Returning the message would hand
    // a stranger details about the script and the sheet behind it.
    console.error(err);
    return reply({ ok: false });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  // Label the columns on the first write, so the sheet is readable without
  // anyone having to set it up by hand beforehand.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
