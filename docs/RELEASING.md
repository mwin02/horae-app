# Releasing updates to the App Store

Horae ships via EAS Build → EAS Submit → App Store Connect → TestFlight → App Store. Build numbers are managed remotely by EAS (`eas.json` has `appVersionSource: "remote"` and `autoIncrement: true` on the `production` profile), so you only ever hand-edit the marketing version.

## Versioning model

- **Marketing version** (`expo.version` in [`app.json`](../app.json)) — what users see in the App Store. Semver-ish: bump `1.0.0` → `1.0.1` for bugfix-only updates, `1.1.0` for new features.
- **Build number** — `ios.buildNumber` is **not** set in `app.json`. EAS owns it remotely and auto-increments on every production build. You never touch this.

Apple requires that every binary you upload has a build number strictly greater than the last one uploaded for the same marketing version (or any earlier marketing version). EAS handles that for you.

## Release flow for a bugfix update (e.g. 1.0.0 → 1.0.1)

1. **Branch & fix.** Standard feature-branch flow (see [`CLAUDE.md`](../CLAUDE.md) → Development Workflow). One branch per bug, or a single `fix/post-1.0-bugs` branch if you're batching several small fixes.
2. **Test on a real device.** `npx expo run:ios` on a physical device, not just the simulator — some bugs (notifications, widgets, Live Activities) only repro on hardware.
3. **Bump the marketing version.** Edit [`app.json`](../app.json) → `expo.version` from `"1.0.0"` to `"1.0.1"`. Also bump `version` in [`package.json`](../package.json) to keep them in sync (cosmetic, but nice).
4. **Merge to `main`.** PR → squash merge → pull `main` locally.
5. **Build for production.**
   ```bash
   eas build --platform ios --profile production
   ```
   EAS will: pull the next build number from its remote counter, build in the cloud, and upload the `.ipa` artifact. Takes ~15–25 min.
6. **Submit to App Store Connect.**
   ```bash
   eas submit --platform ios --profile production --latest
   ```
   `--latest` grabs the build you just produced. Alternatively pass `--id <build-id>` from the EAS dashboard.
7. **Wait for processing.** App Store Connect takes 5–30 min to process the binary. You'll get an email when it's done (or when it's rejected for a metadata/encryption/missing-icon issue).
8. **Pick a release strategy in App Store Connect** (web UI → My Apps → Horae → iOS App → `+ Version or Platform`):
   - Create a new version `1.0.1`.
   - Fill in **"What's New in This Version"** (required for every update — even a one-line "Bug fixes and improvements" works).
   - Attach the processed build.
   - Choose release: **Automatic** (ships as soon as approved), **Manual** (you press the button after approval), or **Scheduled**.
   - Submit for review.
9. **Review.** Subsequent reviews are usually faster than the first (often <24h). If rejected, fix the issue, bump build number is automatic on next `eas build`, resubmit.

## TestFlight (optional but recommended for non-trivial fixes)

Every build you submit via `eas submit` is automatically available in TestFlight once App Store Connect finishes processing. Add yourself + a few testers to the **Internal Testing** group to smoke-test the binary on real devices before pushing it to App Store review.

- Internal testers (up to 100) can install immediately, no Apple review needed.
- External testers require a one-time Beta App Review (usually <24h).

For a tiny bugfix you can skip TestFlight and go straight to review. For anything touching auth, sync, notifications, or the widget, run it through TestFlight first.

## Quick reference

```bash
# 1. Bump version in app.json (and package.json for tidiness)
# 2. Build
eas build --platform ios --profile production

# 3. Submit the build that just finished
eas submit --platform ios --profile production --latest

# 4. Fill in "What's New" + attach build in App Store Connect web UI
# 5. Submit for review
```

## When you need to change more than the JS bundle

EAS Build produces a fresh native binary every time, so native config changes (new Expo plugin, new entitlement, deployment-target bump, etc.) are picked up automatically — no extra steps. Just make sure to:

- Re-run prebuild locally if you want to inspect the generated `ios/` folder (`npx expo prebuild --platform ios --clean`), but **do not commit it** — this project is managed (no checked-in `ios/`).
- Test on a physical device before submitting if you touched anything native.

## Things that do NOT need a new App Store release

None right now — Horae doesn't use EAS Update / OTA updates. Every fix, even a one-line JS change, requires a new binary + review. If post-launch you want to ship JS-only hotfixes without going through review, look at [EAS Update](https://docs.expo.dev/eas-update/introduction/) — but that's a separate setup decision (and has App Store policy constraints around what you can change OTA).

## Rollback

There is no "rollback" button on the App Store. If 1.0.1 ships a regression:

1. Use **Phased Release** (App Store Connect → Version → Phased Release for Automatic Updates) when shipping risky updates — gives you 7 days of gradual rollout you can pause.
2. If it's already out and broken, fix forward: cut 1.0.2 ASAP and request **Expedited Review** in App Store Connect (use sparingly — Apple grants 1–2 per year).
3. You can **Remove from Sale** to stop new downloads of the bad version, but existing users keep what they have.
