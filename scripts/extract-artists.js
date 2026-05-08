#!/usr/bin/env node
// Extract artist names from index.html (NEXT.artists + ARCHIVE[].artists)
// and emit a CSV template at scripts/artists.csv.
// Usage: node scripts/extract-artists.js
//
// The CSV has columns: name, joined_show, email, role
// Fill in `email` for each artist you want to invite, then run import-invites.js.

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Pull the JS block where NEXT and ARCHIVE are defined.
const nextMatch = html.match(/const NEXT\s*=\s*({[\s\S]*?});/);
const archiveMatch = html.match(/const ARCHIVE\s*=\s*(\[[\s\S]*?\]);/);
if (!nextMatch || !archiveMatch) {
  console.error('Could not find NEXT or ARCHIVE in index.html — aborting.');
  process.exit(1);
}

// We can't safely eval directly. Use Function() with restricted scope.
const NEXT = Function('"use strict"; return (' + nextMatch[1] + ');')();
const ARCHIVE = Function('"use strict"; return (' + archiveMatch[1] + ');')();

const allShows = [
  { number: NEXT.number ? `Native State ${NEXT.number}` : 'Native State (next)', artists: NEXT.artists },
  ...ARCHIVE.map(s => ({ number: s.number, artists: s.artists })),
];

// De-duplicate by name. First occurrence wins for joined_show.
const seen = new Map();
for (const show of allShows) {
  for (const a of show.artists) {
    const name = typeof a === 'string' ? a : a.name;
    if (!name) continue;
    if (!seen.has(name)) seen.set(name, show.number);
  }
}

// Sort by name for stable output.
const rows = [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));

const csv = ['name,joined_show,email,role'];
for (const [name, joined_show] of rows) {
  // Escape any embedded commas or quotes by quoting the field.
  const safe = (v) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  csv.push(`${safe(name)},${safe(joined_show)},,artist`);
}

const outPath = path.join(__dirname, 'artists.csv');
fs.writeFileSync(outPath, csv.join('\n') + '\n');
console.log(`Wrote ${rows.length} unique artists to ${outPath}`);
console.log('Next: open the CSV, fill in emails, then run:  node scripts/import-invites.js');
