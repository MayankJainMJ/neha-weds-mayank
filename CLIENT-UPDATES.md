# Wedding invitation — client progress updates

**Last updated: 12 September 2026 · v7.4.1 live; production reveal checks passed**

**Current position: v7.4.1 is live.** Names and wedding details now take 50% longer to appear, as requested. The envelope, 5.5-second prelude and card lift keep their timing. Production reveal checks passed in Chromium and WebKit; review found no new blocker. **RB-01 and RB-03 remain resolved**. RB-02 remains open, and physical phone checks are pending.

Live invitation: https://mayankjainmj.github.io/neha-weds-mayank/

## What guests can experience today

- Music attempts to start on every visit, including a refresh.
- When the browser blocks music, **Play invite** appears in the top-right corner. The envelope waits for confirmed playback.
- Once music starts, two romantic lines appear during a **5.5-second prelude**, followed by the envelope opening.
- Guests can RSVP on the same page while the invitation soundtrack continues.

Guests now see the slower v7.4.1 names-and-details reveal, verified on the live site in Chromium and WebKit. Physical iPhone Safari and WhatsApp in-app browser checks remain pending.

## What is happening now

The requested slower appearance is implemented and deployed. The implementation agent’s slower-reveal and reduced-motion heading tests passed locally in both engines; the reviewer inspected the latest changes and found no new blocker. Updated production reveal checks also passed. Earlier audio and layout evidence is labeled below by release.

The live sequence is: **card settles → names → date and countdown → venue → bonfire message → RSVP and footer links**, with flowers appearing in gentle stages around the card. Timing now follows the card’s actual lift, helping the sequence stay coordinated even when the browser starts an animation late.

### Guest-visible before and after

“After” describes v7.4.1, now deployed and checked on the live site.

| Moment | Before — v7.4 | After — live v7.4.1 |
| --- | --- | --- |
| Card arrival and names | Card settles first; handwriting takes 0.85s, formal names 0.45s. | Same card arrival; handwriting takes 1.275s, formal names 0.675s. |
| Date and venue | Details fade in over 0.5s, with starts 0.5s apart. | Fades and spacing each take 0.75s, giving guests more reading time. |
| Bonfire message and actions | Separate message, then RSVP/footer; reveal completes around 4.6s after lift. | Same reading order at a slower pace; completion starts around 6.35s and waits for the actual fade to finish. |
| Flowers | First blooms, sides and lower flowers lead into drifting petals at 3.1s. | First three stages retain their timing; petals wait until 4.1s to accompany the venue. |

### Implemented pacing at a glance

These are the live timing settings **from the actual start of the card lift**, after the music prelude and initial envelope movement. Access waits for the actions to finish fading in fully.

- **0–1.05 seconds:** card moves into place and settles.
- **1.10 seconds:** handwriting begins, lasting **1.275 seconds**.
- **2.45–3.125 seconds:** formal names appear over **0.675 seconds**.
- **3.35 seconds:** date, year and countdown follow.
- **4.10 seconds:** divider and venue appear.
- **4.85 seconds:** bonfire message appears separately.
- **5.60 seconds:** RSVP and footer links appear.
- **About 6.35 seconds onward:** reveal completes once the actual final fade has finished.

Flowers begin in stages: first blooms at **1.05 seconds**, sides at **1.55**, lower flowers at **2.05**, and drifting petals at **4.10**. Detail fades and the interval between their starts are now **0.75 seconds** each.

The complete entry takes approximately **13.3 seconds after music is confirmed**, previously 11.6 seconds. The **5.5-second prelude**, envelope and card-lift timing are unchanged. Any wait for the guest to press Play invite comes before this.

**How much slower?** Appearance durations are **50% longer**: handwriting **0.85 → 1.275s**, formal names **0.45 → 0.675s**, and detail fades/spacing **0.5 → 0.75s**. Production unlock after lift: normal **6.373s Chromium / 6.421s WebKit**; delayed start **6.388s / 6.419s**, with actions fully visible.

## Completed checks and remaining follow-up

**v7.4.1 production reveal: PASS, Chromium and WebKit.** The parent ran the updated `refined-reveal.mjs` against the live URL: full timing, delayed animation-frame start, opacity, music gates (pending/error/keyboard/retry/refresh), reduced-motion interruption, static/deep links and scoped script fallback checks passed. Local slower-reveal and `refined-reveal-rm-heading.mjs` checks passed in both engines; reviewer inspection found no new blocker.

**Audio evidence:** no new real-audio suite was run for v7.4.1; the audio controller was untouched. Real MP3/gain evidence below belongs to v7.4.

### Historical v7.4 verification

**Production verification: passed in Chromium and WebKit.** Against the live URL, `refined-reveal.mjs` passed normal 390px and delayed-start 1280px timelines, pending/error music states, keyboard retry, refresh, reduced-motion interruptions, static deep links and the scoped missing/late-script fallback checks. `refined-reveal-audio.mjs` passed real MP3 decoding, real Web Audio gain with simulated read-only element volume, the full reveal, continuous RSVP audio and per-visit mute. Tests mocked `cloud.js` to avoid production writes; these checks do not close RB-02.

**Implementation-agent QA: passed locally in Chromium and WebKit at 390px and 1280px widths.** Reported coverage includes:

- Reveal timing, including a deliberately delayed animation start.
- Fully visible content and restored interaction at the end of the reveal.
- Keyboard use, refresh and mute behavior.
- Safely finishing the reveal when reduced motion is enabled mid-sequence.
- Actual MP3 playback and the alternative audio-volume control path.

**Independent browser review: passed for the normal reveal; no new blocker found.** The reviewer’s own `refined-reveal` and `refined-reveal-audio` suites passed. Access was restored **4.612–4.659 seconds** after the lift with full opacity. All **14/14 layout comparisons** matched the baseline after fonts loaded: seven viewports × Chromium and WebKit, with no overflow. The original reveal-timing finding (**RB-01**) is resolved.

**Reduced-motion polish (RB-03): resolved and independently verified.** Switching to reduced motion could leave the formal names briefly fading in. The fix makes them immediately fully visible and stops the remaining animation. The reviewer inspected the fix and ran `refined-reveal-rm-heading.mjs` in Chromium and WebKit, confirming an active fade before the switch, then opacity **1** and **zero animations** immediately in the same task after the reveal was stopped. Subsequent frames and samples through **one second**, including after restoring normal motion, stayed clean. Reveal cleanup, restored interaction and cleared inline styles also passed. This independently confirms the implementation agent’s earlier results.

### Current follow-up

**Existing uncommon follow-up (RB-02): still tracked.** A direct RSVP link (`?entry=0#rsvp`) may remain non-interactive if `entry.js` fails to load. This is a preexisting script-failure case, separate from the normal reveal that passed browser checks. The suggested startup-timer recovery fix has not been applied; this issue is not marked resolved.

**Physical iPhone Safari and WhatsApp in-app browsers remain untested.**

## Progress tracker

**Status key:** Planned = agreed, awaiting work/results; In progress = work underway; Implemented = changes reported in code; Verified = checks passed with evidence; Live = deployment confirmed. Pending checks are not passes.

| Item | Current status | Evidence / next milestone |
| --- | --- | --- |
| Music-led envelope opening | **Live in v7.4.1** | Current production gate checks pass; real MP3/gain tests passed historically in v7.4. |
| Names and detail appearance 50% longer | **Live in v7.4.1** | Local and production slower-reveal checks pass; reviewer found no new blocker. |
| Separate bonfire message; RSVP/footer last | **Live in v7.4.1** | Message at 4.85s; actions at 5.6s; normal production unlock 6.373s / 6.421s after lift, fully visible. |
| Floral staging | **Live in v7.4.1** | Stages start at 1.05 / 1.55 / 2.05 / 4.10s after lift. |
| Remove hidden eight-tap names surprise; make names non-interactive | **Planned** | Approved fixes listed as pending in `STATUS.md`; awaiting actual fix results. |
| Implementation-agent QA | **Verified locally for v7.4.1** | Slower-reveal and reduced-motion heading tests PASS Chromium/WebKit. |
| Independent review | **Latest changes inspected** | No new blocker; 14/14 layout comparisons and independent audio-suite results are historical v7.4 evidence. |
| Reduced-motion names fix — RB-03 | **Live in v7.4.1 — resolved** | Current local heading tests and production reduced-motion interruption checks pass in both engines. |
| Existing direct-RSVP script-failure issue — RB-02 | **Tracked follow-up — open** | Uncommon preexisting failure case; proposed recovery fix not applied. |
| Release of the slower reveal | **Live — production reveal verified** | App `6259774`; successful Pages run `34700102114`; updated production reveal suite passed in Chromium/WebKit. |

## Remaining milestones

1. **Physical phone checks:** check the live invitation in physical iPhone Safari and WhatsApp’s in-app browser.
2. **Existing follow-up:** address and verify RB-02’s uncommon direct-RSVP script-failure recovery separately. The v7.4.1 release and production reveal verification are complete.

Separate tracked work: RB-02 recovery remains open, and completion evidence for the previously approved names-interaction/eight-tap-surprise fixes has not been supplied. Neither is claimed complete by the reveal QA results.

## Short progress log

- **12 September 2026 — Live baseline recorded.** The v7.3 release record confirms the music-first opening, top-right Play invite fallback and 5.5-second romantic prelude are deployed, with production Chromium/WebKit checks reported as passed.
- **12 September 2026 — Reveal direction approved; work underway.** Card settling and names take priority, followed by date/countdown, venue, a separate bonfire message, then RSVP/footer. Gentler floral staging is included.
- **12 September 2026 — Client tracker created.** Implementation and bug-review handoffs are awaited. No new refinement has yet been marked implemented, verified or live in this tracker.
- **12 September 2026 — Local implementation completed.** The reveal now follows the actual card lift, gives names priority, separates the message from actions, and stages flowers more gently. Entry is approximately 11.6 seconds after music confirmation, including the 5.5-second prelude.
- **12 September 2026 — Implementation-agent QA passed.** Local Chromium/WebKit checks at 390px and 1280px cover timing, delayed animation start, final visibility/access, keyboard, refresh/mute, reduced-motion interruption and actual audio playback. Measured access restoration: 4.625–4.670 seconds after lift.
- **12 September 2026 — Independent review underway.** Earlier timing, reduced-motion heading and direct-RSVP script-failure findings await final review disposition. No new commit, push or deployment; v7.3 remains live.
- **12 September 2026 — Independent reveal checks passed.** No new blocker found; RB-01 resolved. Access restored at 4.612–4.659 seconds with full visibility. All 14/14 loaded-font layout comparisons across seven viewports and two engines matched baseline with no overflow; reviewer reveal/audio suites passed.
- **12 September 2026 — Reduced-motion polish fixed.** RB-03 now shows fully visible names with zero remaining animations in implementation-agent Chromium/WebKit checks. Independent confirmation is underway. RB-02 remains an existing, uncommon direct-RSVP script-failure follow-up; its proposed fix was not applied.
- **12 September 2026 — Release-decision handoff.** Local implementation and browser verification complete; ready for release decision subject to RB-03 independent confirmation, with existing follow-up tracked. Physical phone checks pending; no commit or deployment, and v7.3 remains live.
- **12 September 2026 — Final independent confirmation passed.** Reviewer inspection and `refined-reveal-rm-heading.mjs` passed in Chromium/WebKit: active fade stops immediately at full opacity with zero animations, stays clean through one second and after restoring normal motion, and cleans up/unlocks correctly. RB-01 and RB-03 resolved; RB-02 remains the existing tracked follow-up. No new blocker: ready for release decision. Current local cache references are CSS `66` / entry `16`; no commit or deployment, physical phones untested, v7.3 still live.

- **12 September 2026 — v7.4 live and production verified.** User-authorized app release `1b3c526` committed/pushed; Pages run `34698513067` succeeded. Live reveal and real-audio suites passed in Chromium/WebKit, with normal unlock at 4.632s / 4.627s after lift. RB-01/RB-03 resolved; RB-02 unchanged and open. Physical phones remain untested.

- **12 September 2026 — v7.4.1 slower reveal live.** Names/detail appearance durations increased 50%; total entry ~13.3s, with prelude/envelope/card lift unchanged. App `6259774`, Pages `34700102114` succeeded; updated production reveal checks PASS both engines. Local slower/reduced-motion tests pass; reviewer found no new blocker. Real-audio evidence remains from v7.4; RB-02 and physical-phone follow-ups remain open.

### Evidence behind this update

**v7.4.1 release:** app `6259774f651cdd1e537116ed8842f3d8fd9dd432`; Pages `34700102114` succeeded. Current cache references: CSS **67** / entry **17**. Parent-reported updated `refined-reveal.mjs` PASS with `QA_BASE=https://mayankjainmj.github.io/neha-weds-mayank/` in both engines; local and review evidence supplied in the latest handoff. No new real-audio run for this release.

**v7.4 release:** user-authorized commit/push of app `1b3c526cf3576e29a42c5a1d1c50202bcca172f1`; successful Pages run `34698513067`. The parent agent reported PASS for `refined-reveal.mjs` and `refined-reveal-audio.mjs` with `QA_BASE=https://mayankjainmj.github.io/neha-weds-mayank/`, covering both Chromium and WebKit as detailed above. Cloud writes were mocked during these production tests.

Historical v7.3/v7.4 evidence comes from `STATUS.md` and the supplied release/review handoffs, including 14/14 geometry comparisons and independent reduced-motion checks. The v7.4.1 release evidence above establishes the current live state.
