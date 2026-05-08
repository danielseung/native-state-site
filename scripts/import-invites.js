#!/usr/bin/env node
// Import filled artists.csv into Firestore as invites.
// Each row becomes invites/{lowercased-email} with { name, joined_show, role }.
//
// Setup (one time):
//   1. Firebase Console → Project Settings → Service Accounts → Generate new private key
//   2. Save the file as scripts/serviceAccountKey.json (already gitignored)
//   3. From repo root:  npm install --prefix scripts firebase-admin
//
// Usage: node scripts/import-invites.js
//   Skips rows with no email.

const fs = require('fs');
const path = require('path');

const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(KEY_PATH)) {
  console.error('Missing scripts/serviceAccountKey.json — see header comment for setup.');
  process.exit(1);
}

const csvPath = path.join(__dirname, 'artists.csv');
if (!fs.existsSync(csvPath)) {
  console.error('Missing scripts/artists.csv — run extract-artists.js first.');
  process.exit(1);
}

let admin;
try { admin = require('firebase-admin'); }
catch (e) {
  console.error('firebase-admin not installed. Run:  npm install --prefix scripts firebase-admin');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(KEY_PATH)),
  projectId: 'ras-common',
});
const db = admin.firestore();

// Tiny CSV parser that handles quoted fields with commas.
function parseCsv(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.length);
  for (const line of lines) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    rows.push(out);
  }
  return rows;
}

(async () => {
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  const headers = rows.shift();
  const idx = (h) => headers.indexOf(h);
  const iName = idx('name'), iShow = idx('joined_show'), iEmail = idx('email'), iRole = idx('role');
  if (iName < 0 || iEmail < 0) {
    console.error('CSV must have headers: name,joined_show,email,role');
    process.exit(1);
  }

  let created = 0, skipped = 0;
  for (const row of rows) {
    const name = (row[iName] || '').trim();
    const email = (row[iEmail] || '').trim().toLowerCase();
    const joined_show = (row[iShow] || '').trim();
    const role = (row[iRole] || 'artist').trim() || 'artist';
    if (!email || !email.includes('@')) { skipped++; continue; }
    await db.collection('invites').doc(email).set({
      name, joined_show, role,
      invited_at: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    }, { merge: true });
    console.log(`  ✓ ${email}  (${name} · ${joined_show})`);
    created++;
  }
  console.log(`\nDone. Created/updated ${created} invites. Skipped ${skipped} rows with no email.`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
