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

Pick one of the three options below — all keep the anti-schedule thesis but resolve the "no planning required" vs "set realistic goals" tension differently. Updatable anytime without review, so you can A/B these post-launch.

**Option A — drop "goals" from promo entirely** *(135 chars, recommended)*
```
Built for people who can't stick to schedules. Track where your time actually goes and watch the patterns emerge — no planning required.
```

**Option B — goals as post-hoc nudges** *(145 chars)*
```
Built for people who can't stick to schedules. Track where your time actually goes, see the patterns emerge, then nudge them toward what matters.
```

**Option C — reframe goals as targets** *(157 chars)*
```
Built for people who can't stick to schedules. Track what you actually do, set the targets that matter, and see how the real day compares — no plan required.
```

Recommendation: **A** — tightest, no internal tension, and goals get their dedicated paragraph in the description anyway.

---

## Keywords (100 chars, comma-separated, no spaces)

```
time,productivity,goals,focus,timer,habits,adhd,journal,log,routine,daily,planner,schedule,minimal
```
*99 chars.*

Notes:
- Words in the app name and subtitle are already indexed by Apple; don't repeat them here. That's why `track`, `tracking`, and `day` (all in the title/subtitle) are not in the keyword list.
- `schedule` is intentional — Horae is the anti-schedule alternative.
- `adhd` widens reach to a community that genuinely benefits from descriptive (vs. prescriptive) tracking. Keep.
- Swap candidates if a keyword underperforms post-launch: `tracker` (high-intent, not in title) is the strongest alternative — could replace `journal` or `log`.

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

`https://usehorae.com/support`

App Store Connect requires the URL to be publicly reachable when you submit. A 404 is a rejection — verify the landing-site `/support` route is live before pressing submit.

## Marketing URL (optional)

`https://usehorae.com/`

## Privacy Policy URL (REQUIRED)

`https://usehorae.com/privacy`

Apple WILL reject submissions without a working privacy policy URL. The privacy policy text is drafted in [`privacy-policy.md`](./privacy-policy.md) and rendered at the URL above by the `landing/` Next.js app (it reads from `landing/content/privacy-policy.md`, which is auto-synced from `docs/privacy-policy.md` via the `sync:docs` script).

## Support email

`support@usehorae.com` — also the contact address in the privacy policy and the destination of the in-app feedback button.

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

Apple only strictly requires the **6.7" iPhone** size: **1290 × 2796 PNG**. Provide 3–10 screenshots; 8 is the planned set.

Capture from the iPhone 15 Pro Max or 16 Pro Max simulator: ⌘ + S saves to Desktop, then drag into App Store Connect. Use the same color scheme (light or dark) across all screens — visual consistency reads as polish.

Each slot is a **composed marketing screenshot**, not a raw simulator capture: solid background + headline + the real screen content. See the **Screenshot design spec** below for layout and typography. The screen content itself must be a real capture — Apple forbids mocked UI that doesn't exist in the app.

Slot-by-slot plan (8 screens, story arc: *capture → reflect → set targets → compare → drill → start → make it yours → privacy*):

| # | Screen | Headline (≤7 words) | Subhead (optional, ≤10 words) |
| --- | --- | --- | --- |
| 1 | **Active timer card** (hero) — running session, elapsed time clearly visible | `Track your day, not your plan` | `Start a timer. That's the whole loop.` |
| 2 | **Day timeline** with a full day filled in (variety of categories, no gaps) | `See where your hours actually went` | `The day you had, not the one you planned.` |
| 3 | **Ideal allocations** ([app/ideal-allocations.tsx](app/ideal-allocations.tsx)) — goal-setting screen with category targets visible | `Set the targets that matter to you` | `Daily or weekly. No streaks. No guilt.` |
| 4 | **Insights — Daily** showing actual-vs-ideal comparison bars | `Patterns, not pressure` | `Your real time, against the targets you set.` |
| 5 | **Insights — Activity drill-down** with the donut chart visible | `Find where the day disappeared` | `Drill into any category. No spreadsheets.` |
| 6 | **New session modal** showing 4–6 categories in the picker | `Real life isn't just work` | `Sleep, Health, Family — track what matters.` |
| 7 | **Manage categories** ([app/manage-categories.tsx](app/manage-categories.tsx)) — list of categories with colors and icons, ideally mid-edit | `Make it yours` | `Add, rename, recolor. Your life, your categories.` |
| 8 | **Settings → Manage data** | `Everything stays on your iPhone` | `No accounts. No cloud. Export or wipe anytime.` |

Notes:
- Slots 3 (goals) and 7 (customization) carry the "this app adapts to you" story — they were added because the original 6 emphasized capture/analysis but understated how much the app bends to fit a non-standard life.
- Slot 4's headline previously read "Real time vs. the targets you set yourself" — shortened so it doesn't echo the slot-3 subhead.
- Privacy-first is a key differentiator and is otherwise invisible in the screenshot reel — that's why slot 8 exists.
- Apple allows up to 10 screenshots; 8 is well within the budget and leaves room to add an "app preview" video later without crowding.

Pre-capture checklist:
- [ ] Use realistic-sounding activity names ("Deep work", "Morning run", "Reading"). Avoid placeholder text.
- [ ] Status bar in clean state — full battery, full signal, no notifications. (Simulator's default is usually fine; otherwise use the Status Bar override in `xcrun simctl`.)
- [ ] No debug section visible (unset `EXPO_PUBLIC_ENABLE_DEBUG` in `.env`).
- [ ] Same time of day across screenshots (don't show 9:00 AM on one and 11:30 PM on another — looks unprofessional).

---

### Screenshot design spec

The goal is **clean and indie**, not corporate. The brand voice is honest and anti-prescriptive — heavy illustrations or stock-photo backgrounds would contradict the positioning. Aim for the visual register of Bear, Things, or Streaks.

**Canvas:** 1290 × 2796 (6.7" iPhone), exported PNG, sRGB.

**Background:** single flat off-white `#F7F5F2` (or a very subtle vertical gradient to `#EFEBE6` at the bottom). Same background across all 6 — consistency reads as polish. Avoid pure white (#FFF) — it looks unfinished and clashes with the App Store carousel chrome.

**Layout (top → bottom):**
1. **Headline** — 96 pt, Manrope Bold, color `#1A1A1A`, centered, max 2 lines. Top padding: 180 pt from the canvas top. Tight tracking (-1%).
2. **Subhead** (optional) — 44 pt, Plus Jakarta Sans Regular, color `#5A5A5A`, centered, max 1 line. 32 pt below the headline.
3. **Device screen** — real capture, no iPhone bezel/frame (frameless reads more modern in 2026). Width: 1050 pt centered. Rounded corners at 72 pt radius to imply the device. Drop shadow: 0/40/80 px, 12% black opacity. Top edge sits 180 pt below the subhead.
4. **Bottom safe area** — leave ≥120 pt below the device so nothing crowds the App Store page indicator dots.

**Per-screen background tint (optional, subtle):** if all 6 in flat off-white feels flat, give each screen a barely-perceptible accent wash matching the dominant category color in that capture — e.g. timeline shot has a 3%-opacity warm tint, insights shot has a 3% cool tint. Keep it whisper-quiet; the test is "does it still look like one coherent set when you scroll the carousel fast?".

**Don't:**
- ❌ Add fake reviews, awards, or "Featured in" badges (Apple rejects fabricated social proof).
- ❌ Mock UI elements that don't exist in the app (Apple guideline 2.3.3).
- ❌ Use comic-sans-tier serifs, neon gradients, or 3D mockups. The category is full of those and they all look like 2015.
- ❌ Crowd the headline with the screen — 180 pt breathing room above and below is the difference between "polished" and "indie-amateur".

**Suggested tools:** Figma (free, frame template `App Store Screenshot 6.7"` available in community files), or Screenshots.pro / Picasso if you want a faster preset-driven workflow. Figma gives more control; presets ship faster. For v1, Figma is worth the extra hour.

**Order of operations:**
1. Capture clean app screens from the iPhone 16 Pro Max simulator into one folder.
2. In Figma: build one template frame with the background + headline placeholder + screen-image placeholder + shadow.
3. Duplicate × 6, swap headline text + screen capture per slot.
4. Export all 6 at 1× as PNG.
5. Drag into App Store Connect; verify order is 1 → 6 (Apple uses upload order as carousel order).

---

## Pre-submission checklist (in App Store Connect)

- [ ] App icon uploaded (Apple pulls it from the build, so just verify it shows correctly in the listing preview)
- [ ] All metadata in this doc pasted in
- [ ] 8 screenshots uploaded
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
