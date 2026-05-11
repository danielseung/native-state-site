# Native State World Guest Access

## Plan
- [x] Sync local checkout with deployed `origin/master`.
- [x] Correct Firebase setup docs/scripts to use the deployed `nativestate-ac877` project.
- [x] Make `/world/` viewable by guests without sign-in.
- [x] Keep mutating actions gated to signed-in users/admins.
- [x] Verify the static page and rules are internally consistent.

## Review
- Local branch is synced to `origin/master`.
- `/world/` now renders a public guest calendar/chat shell immediately, without waiting for Firebase Auth.
- Guest writes are gated behind sign-in prompts; directory/profile/admin remain signed-in/admin surfaces.
- Firebase setup and invite import now target `nativestate-ac877`.
- Checks passed: `node --check` via NVM Node, `deno check --allow-import=www.gstatic.com`, `git diff --check`, and JSON validation for `database.rules.json`.
- Firebase RTDB, Storage, and Firestore rules deployed to `nativestate-ac877`.
