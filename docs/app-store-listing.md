# App Store Connect listing — Horae

Working draft of every piece of copy / config you'll paste into App Store Connect. Edit freely before submitting; Apple lets you change Promotional Text, Keywords, and Description at any time without re-review.

---

## App information

| Field | Value | Notes |
| --- | --- | --- |
| **Name** | `Horae — Daily Time Tracking` | 30/30 chars |
| **Subtitle** | `Track your day, not your plan` | 29/30 chars |
| **Bundle ID** | `com.myozawwin.horae` | Already in `app.json` |
| **SKU** | `horae-ios-001` | Internal-only identifier |
| **Primary language** | English (U.S.) | |
| **Primary category** | Productivity | |
| **Secondary category** | Lifestyle | (or Health & Fitness — pick whichever feels closer) |

---

## Promotional Text (170 chars, updatable without review)

```
Built for people who can't stick to schedules. Track where your time actually goes, set realistic goals, and watch the patterns emerge — no planning required.
```
*157 chars*

---

## Keywords (100 chars, comma-separated, no spaces)

```
time,productivity,goals,focus,timer,habits,adhd,journal,log,routine,daily,day,planner,schedule
```
*94 chars — leaves headroom for one swap.*

Notes:
- Words in the app name and subtitle are already indexed by Apple; don't repeat them here. (That's why "tracking" / "track" / "day" — wait, "day" IS in subtitle, drop it.)
- Revised: `time,productivity,goals,focus,timer,habits,adhd,journal,log,routine,daily,planner,schedule,minimal` *(99 chars)*
- "schedule" is intentional — Horae is the anti-schedule alternative.
- "adhd" widens reach to a community that genuinely benefits from descriptive (vs. prescriptive) tracking. Drop if you want.

---

## Description (4000 chars)

```
Horae is a time-tracking app for people who don't stick to schedules.

Most productivity apps assume you can plan your day in advance and follow that plan. If that's never quite worked for you, you're not broken — you just need a different approach. Horae works the other way around: track what you actually do, then see where your time really goes.

NO SCHEDULES, NO PLANS, NO GUILT
Start a timer when you start something. Stop it when you're done. Switch between activities as your day shifts. That's the whole loop. The app stays out of your way and shows you the patterns that emerge.

SET GOALS THAT FIT YOUR LIFE
Decide how much time you want to spend on Work, Sleep, Health, or anything else — daily, weekly, or monthly. Horae tells you how you're tracking against those goals without nagging you back into a rigid plan.

EVERYTHING ON YOUR DEVICE
- 100% offline. Your data lives in private storage on your iPhone.
- No accounts. No sign-up. No cloud uploads.
- No ads. No tracking. No analytics.
- Crash reports go through Sentry with personal text stripped out.
- Export everything as JSON or CSV anytime, or wipe it all in one tap.

WHAT'S INSIDE
- A clean timer that recalculates from the moment you started — never drifts.
- A day timeline showing how your hours actually flowed.
- Insights that compare your real time against your goals, daily and weekly.
- Activity-level drill-downs to spot where the day disappeared.
- Smart reminders for forgotten timers and long-running sessions (you control which fire and when).
- Quiet hours so notifications respect your evenings.
- Preset categories to start from, fully customizable to fit your life.

DESIGNED FOR REAL DAYS
Horae handles the messy stuff: timers spanning midnight, time zones when you travel, retroactive entries when you forgot to start, gap-filling when there's a hole in your day, and entries that bleed past their planned end.

PRIVACY-FIRST, ALWAYS
Your tracked time is nobody's business but yours. Future updates may add optional cloud sync for backup and multi-device — when they do, it'll be opt-in and you'll always be able to export your data and walk away.

If schedules don't work for you, give Horae a try. Track honestly. See clearly. Adjust as you go.
```
*~1,950 chars — well under the 4,000 limit. Plenty of room to expand if you want.*

---

## Support URL

Until the landing page is live, point this to a public support page. Cheapest options:
- GitHub repo issues: `https://github.com/mwin02/horae-app/issues` (works immediately)
- Once `horae.app` (or chosen domain) ships: `https://horae.app/support`

App Store Connect requires the URL to be publicly reachable when you submit. A 404 is a rejection.

## Marketing URL (optional)

Same as Support URL once landing page exists. Skip until then.

## Privacy Policy URL (REQUIRED)

Same domain as landing page (e.g. `https://horae.app/privacy`). Apple WILL reject submissions without a working privacy policy URL. The privacy policy text is drafted in [`privacy-policy.md`](./privacy-policy.md).

---

## App Privacy questionnaire

Walk through Apple's flow at App Store Connect → My Apps → your app → App Privacy. Answer for two surfaces:

### Surface 1 — App itself
**Does your app collect any data?** → **No**

The app stores everything in local SQLite via PowerSync. Nothing leaves the device. (Once Phase 3 sync ships, this answer changes — but for the v1 launch, it's a clean No.)

### Surface 2 — Sentry SDK
**Does your app collect any data?** → **Yes** (because Sentry collects crash data)

Then declare:

| Data type | Linked to user? | Used for tracking? | Purpose |
| --- | --- | --- | --- |
| **Crash Data** | No | No | App Functionality (Analytics) |

Justification:
- "Linked to user" = No — we explicitly clear `event.user` in `lib/sentry.ts` and don't send any user identifiers.
- "Used for tracking" = No — Sentry crash data isn't used to track the user across apps/sites; it's only used to debug crashes in this app.
- We do NOT collect: Diagnostics other than crash, Identifiers, Usage Data, Browsing History, Location, Contact Info, Health, Financial, anything else.

---

## Age rating

Walk Apple's age questionnaire. For Horae, every answer should be **None / No**:
- No violence, sexual content, profanity, drugs, gambling, horror, mature themes, contests, unrestricted web access, or user-generated content.

Expected result: **4+**

---

## Screenshots

Apple only strictly requires the **6.7" iPhone** size: **1290 × 2796 PNG**. Provide 3–6 screenshots; 5 is the sweet spot.

Capture from the iPhone 15 Pro Max or 16 Pro Max simulator: ⌘ + S saves to Desktop, then drag into App Store Connect. Use the same color scheme (light or dark) across all 5 — visual consistency reads as polish.

Suggested screens, in order:
1. **Active timer card** (hero) — running session, elapsed time clearly visible.
2. **Day timeline** with a full day filled in (variety of categories, no gaps if possible).
3. **Insights — Daily** showing category breakdown bars.
4. **Insights — Activity drill-down** with the donut chart visible.
5. **New session modal** showing 4–6 categories in the picker (variety = "this fits my life").

Optional 6th: a focused shot of the goal vs. actual comparison if it photographs well.

Pre-capture checklist:
- [ ] Use realistic-sounding activity names ("Deep work", "Morning run", "Reading"). Avoid placeholder text.
- [ ] Status bar in clean state — full battery, full signal, no notifications. (Simulator's default is usually fine; otherwise use the Status Bar override in `xcrun simctl`.)
- [ ] No debug section visible (unset `EXPO_PUBLIC_ENABLE_DEBUG` in `.env`).
- [ ] Same time of day across screenshots (don't show 9:00 AM on one and 11:30 PM on another — looks unprofessional).

---

## Pre-submission checklist (in App Store Connect)

- [ ] App icon uploaded (Apple pulls it from the build, so just verify it shows correctly in the listing preview)
- [ ] All metadata in this doc pasted in
- [ ] 5 screenshots uploaded
- [ ] Privacy Policy URL reachable
- [ ] Support URL reachable
- [ ] App Privacy questionnaire answered
- [ ] Age rating = 4+
- [ ] Build selected from TestFlight (must be processed first)
- [ ] **Demo account NOT needed** — Horae has no auth at launch. Apple may ask anyway; if they do, reply: "No account is required to use the app. All features are accessible immediately on launch."

---

## Notes for future updates

- **Promotional Text** is updatable anytime (no review). Use it for "What's new this month" hooks.
- **Description, Keywords** updatable with each version (review).
- **Subtitle** updatable with each version.
- **Screenshots** updatable anytime per app version (no review for the screenshots themselves).
