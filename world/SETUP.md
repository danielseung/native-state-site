# Native State Members — Setup

The `/world` app is a static site. All backend is Firebase (project `nativestate-ac877`). Setup has three parts:

1. **Enable Google sign-in** in the Firebase console.
2. **Deploy security rules** (Firestore + RTDB).
3. **Optional: add invite metadata** for prefilled profiles or admin roles.

---

## 1. Enable Google sign-in

1. Open https://console.firebase.google.com → project **nativestate-ac877** → **Authentication** → **Sign-in method**.
2. Enable **Google** sign-in.
3. Under **Authorized domains**, add: `nativestate.info`, `www.nativestate.info`, and `localhost`. (`nativestate-ac877.firebaseapp.com` is added by default.)

## 2. Deploy security rules

From the repo root:

```bash
firebase use nativestate-ac877
firebase deploy --only firestore:rules,database,storage
```

Verify on the Firebase console that `firestore.rules` and `database.rules.json` show the new content.

If `firebase use` complains about no project alias, run:
```bash
firebase login   # if not already
firebase use --add   # pick nativestate-ac877, alias it as 'default'
```

## 3. Optional: bootstrap an admin invite

Anyone with a Google account can sign in and create a profile. The `invites/{email}` collection is now optional metadata: it can prefill name/show and assign `admin` on first profile creation.

In the Firebase console → **Firestore Database** → click **Start collection**:
- Collection ID: `invites`
- Document ID: your email **lowercased** (e.g. `danielseung@gmail.com`)
- Fields:
  - `name` (string): "Seungmin Lee"
  - `joined_show` (string): "Native State Pilot"
  - `role` (string): **`admin`**
  - `used` (boolean): `false`

Save. Now go to `https://nativestate.info/world/` and continue with Google using that email. You're in as admin.

## 4. Optional: bulk-load invite metadata

```bash
cd scripts
npm install                    # installs firebase-admin
node extract-artists.js        # reads index.html, writes scripts/artists.csv
```

Open `scripts/artists.csv` in a spreadsheet. The CSV has 4 columns: `name, joined_show, email, role`. Fill in the `email` column for anyone whose profile should be prefilled. Leave email blank to skip a row. Save.

Get a service account key:
- Firebase Console → Project Settings (gear icon) → **Service Accounts** → **Generate new private key**.
- Save the JSON file as `scripts/serviceAccountKey.json` (gitignored).

Then:
```bash
node import-invites.js
```

This writes one invite metadata doc per filled email. Re-runnable — uses `merge: true`, so editing the CSV and re-running just updates the existing docs.

## 5. Send the login link

Anyone can go to `https://nativestate.info/world/` and continue with Google. No invite is required.

For a personal touch, you can email them yourself first:
> *Hi — built a members space for Native State artists. Go to nativestate.info/world and continue with Google. Pick a handle when you land.*

---

## Local dev

```bash
# from repo root
npx http-server -p 8080 -c-1
# then open http://localhost:8080/world/
```

For Google sign-in to work locally, `localhost` must be on the Firebase Authorized Domains list (step 1 above).

## Architecture quick-ref

| Surface | Storage | Purpose |
|---|---|---|
| `/world/` HTML | GitHub Pages | App shell |
| Firebase Auth | nativestate-ac877 | Google sign-in |
| Firestore `users/{uid}` | nativestate-ac877 | Signed-in profiles |
| Firestore `events/{id}` + `events/{id}/rsvps/{uid}` | nativestate-ac877 | Public calendar, signed-in posting |
| Firestore `channels/{id}` | nativestate-ac877 | Public chat channel list, admin-managed |
| Firestore `invites/{email}` | nativestate-ac877 | Optional profile/admin metadata |
| RTDB `m/channels/{id}/messages` | nativestate-ac877 | Public read-only chat for guests, signed-in posting |
| RTDB `m/presence/{uid}` | nativestate-ac877 | Signed-in live presence dot |

`/gr1` and `/tp` continue to use the **public** RTDB paths `gr1/state` and `tp/state` — completely separate from `/world/*`. (RTDB still uses the `m/` prefix for members data — internal key, not user-visible.)
