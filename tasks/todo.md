# Native State World Guest Access

## Plan
- [x] Sync local checkout with deployed `origin/master`.
- [x] Correct Firebase setup docs/scripts to use the deployed `nativestate-ac877` project.
- [x] Make `/world/` viewable by guests without sign-in.
- [x] Keep mutating actions gated to signed-in users/admins.
- [x] Verify the static page and rules are internally consistent.

## Login Open Access
- [x] Remove invite requirement from first-time profile creation.
- [x] Update Firestore rules so any signed-in user can create their own profile.
- [x] Stop presenting email magic links as the primary login path.
- [x] Update setup docs to match open login.
- [x] Push site and verify live login surface.

## Review
- Local branch is synced to `origin/master`.
- `/world/` now renders a public guest calendar/chat shell immediately, without waiting for Firebase Auth.
- Guest writes are gated behind sign-in prompts; directory/profile/admin remain signed-in/admin surfaces.
- Firebase setup and invite import now target `nativestate-ac877`.
- Checks passed: `node --check` via NVM Node, `deno check --allow-import=www.gstatic.com`, `git diff --check`, and JSON validation for `database.rules.json`.
- Firebase RTDB, Storage, and Firestore rules deployed to `nativestate-ac877`.
- Open-login Firestore rules deployed to `nativestate-ac877`.
- Google sign-in provider is enabled in Firebase Auth.
- Commit `cdfc9ed` pushed to `origin/master`.
- Live `https://nativestate.info/world/` serves the Google-only login surface and no longer contains the email magic-link form.
