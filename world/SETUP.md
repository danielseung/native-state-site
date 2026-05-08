# Native State Members — Setup

The `/world` app is a static site. All backend is Firebase (project `ras-common`). Setup has three parts:

1. **Enable email-link sign-in** in the Firebase console.
2. **Deploy security rules** (Firestore + RTDB).
3. **Add invites** — one for yourself first, then bulk-add the past artists.

---

## 1. Enable email-link sign-in

1. Open https://console.firebase.google.com → project **ras-common** → **Authentication** → **Sign-in method**.
2. Enable the **Email/Password** provider, **and** check **Email link (passwordless sign-in)**.
3. Under **Authorized domains**, add: `nativestate.info` and `localhost`. (`ras-common.firebaseapp.com` is added by default.)

## 2. Deploy security rules

From the repo root:

```bash
firebase use ras-common
firebase deploy --only firestore:rules,database
```

Verify on the Firebase console that `firestore.rules` and `database.rules.json` show the new content.

If `firebase use` complains about no project alias, run:
```bash
firebase login   # if not already
firebase use --add   # pick ras-common, alias it as 'default'
```

## 3. Bootstrap your admin invite

The members app gates account creation on a Firestore `invites/{email}` doc. The first one — yours — has to be added manually since you can't yet sign in to use the admin UI.

In the Firebase console → **Firestore Database** → click **Start collection**:
- Collection ID: `invites`
- Document ID: your email **lowercased** (e.g. `danielseung@gmail.com`)
- Fields:
  - `name` (string): "Seungmin Lee"
  - `joined_show` (string): "Native State Pilot"
  - `role` (string): **`admin`**
  - `used` (boolean): `false`

Save. Now go to `https://nativestate.info/world/`, enter that email, click the link in your inbox. You're in as admin.

## 4. Bulk-invite past artists

```bash
cd scripts
npm install                    # installs firebase-admin
node extract-artists.js        # reads index.html, writes scripts/artists.csv
```

Open `scripts/artists.csv` in a spreadsheet. The CSV has 4 columns: `name, joined_show, email, role`. Fill in the `email` column for everyone you want to invite. Leave email blank to skip a row. Save.

Get a service account key:
- Firebase Console → Project Settings (gear icon) → **Service Accounts** → **Generate new private key**.
- Save the JSON file as `scripts/serviceAccountKey.json` (gitignored).

Then:
```bash
node import-invites.js
```

This writes one invite doc per filled email. Re-runnable — uses `merge: true`, so editing the CSV and re-running just updates the existing invites.

## 5. Send the magic links

Each invited person goes to `https://nativestate.info/world/`, types their email, and gets a sign-in link. Subject and body are Firebase defaults (you can customize the email template in Firebase console → Authentication → Templates).

For a personal touch, you can email them yourself first:
> *Hi — built a private members space for Native State artists. Go to nativestate.info/world and sign in with this email. Pick a handle when you land.*

---

## Local dev

```bash
# from repo root
npx http-server -p 8080 -c-1
# then open http://localhost:8080/world/
```

For the magic-link flow to work locally, `localhost` must be on the Firebase Authorized Domains list (step 1 above).

## Architecture quick-ref

| Surface | Storage | Purpose |
|---|---|---|
| `/world/` HTML | GitHub Pages | App shell |
| Firebase Auth | ras-common | Magic-link email sign-in |
| Firestore `users/{uid}` | ras-common | Profiles |
| Firestore `events/{id}` + `events/{id}/rsvps/{uid}` | ras-common | Calendar |
| Firestore `invites/{email}` | ras-common | Curation gate |
| RTDB `m/channels/general/messages` | ras-common | #general chat |
| RTDB `m/presence/{uid}` | ras-common | Live presence dot |

`/gr1` and `/tp` continue to use the **public** RTDB paths `gr1/state` and `tp/state` — completely separate from `/world/*`. (RTDB still uses the `m/` prefix for members data — internal key, not user-visible.)
