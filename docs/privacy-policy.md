# Privacy Policy — Horae

*Last updated: TODO — set to the date you publish this.*

This is the privacy policy for the Horae iPhone app ("Horae", "the app", "we"). It explains what data the app handles and what happens to it. Plain English, no fine-print games.

## The short version

- The app stores everything **locally on your iPhone**. We do not run servers that hold your data.
- The app **does not require an account** and does not collect any personal information.
- The app sends **anonymous crash reports** to Sentry so we can fix bugs. Personal text (notes, names, etc.) is stripped out before sending.
- We do not sell, share, or use your data for advertising.
- You can export everything as JSON or CSV at any time, or wipe all of it from Settings → Manage data.

## What data the app stores on your device

When you use Horae, the app saves these things in private storage on your iPhone:

- The activities you create (names, categories, icons, colors)
- The time entries you record (start/end times, duration, notes you write, the time zone you were in)
- Your goals, preferences, and notification settings

This data lives in a SQLite database that only the Horae app can read. It does not leave your device unless you explicitly export it via Settings → Manage data.

## What data leaves your device

### Crash reports (Sentry)

If the app crashes or hits an unexpected error, the app sends a crash report to **Sentry** (sentry.io), a third-party error-tracking service we use to find and fix bugs.

A crash report contains:
- Technical details about the error (stack trace, app version, iOS version, device model)
- A breadcrumb trail of recent UI actions

A crash report does NOT contain:
- Your name, email, phone number, or any account identifiers (we don't have any)
- The text of any notes you've written
- The names of activities, categories, or tags you've created (sensitive fields are explicitly redacted before sending)
- Any unique device identifier we attach
- Your location

We've configured the app to strip these fields out of every crash report before it leaves your phone. The code that does this is open-source and reviewable in the project repository.

Sentry's privacy policy: https://sentry.io/privacy/

### That's it

The app makes no other network requests. There are no analytics, no advertising SDKs, no tracking pixels, no usage telemetry, no remote feature flags, no A/B testing.

## What we do NOT do

- We do not sell your data.
- We do not share your data with advertisers, data brokers, or any third party (except Sentry, scoped as above).
- We do not track you across other apps or websites. The app is not capable of doing this — the relevant iOS frameworks are not used.
- We do not use your data for AI/ML training of any kind.

## Children's privacy

Horae is rated 4+ and is suitable for use by children. Because the app collects no personal information and requires no account, we do not knowingly collect any data from children. If you are a parent or guardian and you believe your child has somehow provided information to us, please contact us and we will help.

## Your rights

Because we don't store your data on our servers, the typical "request your data" / "request deletion" mechanics don't apply — you already have full control:

- **Access / export:** Settings → Manage data → Export data (JSON) or Export time entries (CSV). The exports include everything the app has stored.
- **Deletion:** Settings → Manage data → Delete time entries (keeps categories) or Delete all data (resets the app to first-launch state). Or simply uninstall the app, which removes all stored data from your device.
- **Crash report deletion:** Crash reports retained by Sentry are anonymous; we cannot link them back to you because they contain no identifiers. They expire from Sentry's storage on Sentry's standard retention schedule. If you want crash reports to never be sent, uninstall the app — there is no in-app toggle for this in v1, but we plan to add one.

## Future updates: optional cloud sync

A future version of Horae may offer **optional** cloud sync (for backup and using the app across multiple devices). When that ships:

- Sync will be opt-in. The app will continue to work fully offline if you don't want it.
- This privacy policy will be updated *before* the feature is available, and the new section will explain exactly what data is uploaded, where it's stored, and how it's protected.
- Existing users who never turn on sync are unaffected.

## Changes to this policy

If we change this policy, we'll update the "Last updated" date at the top and note what changed in the app's release notes. Material changes (anything that expands what data we collect or share) will be flagged prominently.

## Contact

Questions, concerns, or data requests:

📧 **TODO — replace with the dedicated support email before publishing.** *(See the "Pre-submission blockers" section in the launch plan; the in-app feedback button currently falls back to a personal Gmail address.)*

---

*Horae is built by an independent developer. The source code for the iOS app is publicly viewable on GitHub.*
