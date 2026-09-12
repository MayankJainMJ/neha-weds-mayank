# Wedding invitation — client progress updates

**Last updated: 12 September 2026 · v7.4 live; production browser checks passed**

**Current position: v7.4 is live.** The approved refinement was committed, pushed and successfully deployed; production reveal and audio checks passed in Chromium and WebKit. **RB-01 and RB-03 are resolved**. The existing RB-02 follow-up remains open, and physical phone checks remain pending.

Live invitation: https://mayankjainmj.github.io/neha-weds-mayank/

## What guests can experience today

- Music attempts to start on every visit, including a refresh.
- When the browser blocks music, **Play invite** appears in the top-right corner. The envelope waits for confirmed playback.
- Once music starts, two romantic lines appear during a **5.5-second prelude**, followed by the envelope opening.
- Guests can RSVP on the same page while the invitation soundtrack continues.

Guests now see the calmer v7.4 reveal, verified on the live site in Chromium and WebKit. Physical iPhone Safari and WhatsApp in-app browser checks remain pending.

## What is happening now

The implementation agent has completed the approved reveal changes. Both the implementation agent’s checks and the independent reviewer’s reveal/audio suites passed. The reviewer confirmed the finished card matches the previous layout across seven screen sizes in both browser engines, with no overflow. Independent checks of the final reduced-motion fix have also passed, completing this reveal review.

The live sequence is: **card settles → names → date and countdown → venue → bonfire message → RSVP and footer links**, with flowers appearing in gentle stages around the card. Timing now follows the card’s actual lift, helping the sequence stay coordinated even when the browser starts an animation late.

### Guest-visible before and after

“After” describes v7.4, now deployed and checked on the live site.

| Moment | Before — previous v7.3 sequence | After — live v7.4 |
| --- | --- | --- |
| Card arrival and names | The handwritten names begin while the card is still moving into place. | The card settles first, then the handwritten names lead into the formal names. |
| Wedding date | Date, year and countdown begin appearing before the formal names finish arriving. | The names get their own moment before the date, year and countdown appear together. |
| Venue | Venue follows the date in a closely spaced reveal. | The divider and venue receive a distinct next beat. |
| Bonfire message | The message arrives together with RSVP and footer links. | The bonfire message gets its own pause before the actions appear. |
| RSVP and footer | Actions enter alongside the message. | RSVP and footer links arrive last, after guests have seen the invitation details. |
| Flowers | Floral stages begin close together during the card’s arrival. | Floral appearances are more gently staggered to support the reading order. |

### Implemented pacing at a glance

These are the implemented timing settings **from the actual start of the card lift**, after the music prelude and initial envelope movement. Independent tests measured invitation access becoming available at **4.612–4.659 seconds** after the lift, with content fully visible.

- **0–1.05 seconds:** card moves into place and settles.
- **1.10 seconds:** handwritten names begin.
- **2.00–2.45 seconds:** formal names appear.
- **2.60 seconds:** date, year and countdown follow.
- **3.10 seconds:** divider and venue appear.
- **3.60 seconds:** bonfire message appears separately.
- **4.10 seconds:** RSVP and footer links appear.
- **About 4.60 seconds:** reveal completes.

Flowers begin in stages: first blooms at **1.05 seconds**, sides at **1.55**, lower flowers at **2.05**, and drifting petals at **3.10**. The extra handwriting delay has been removed, and its dissolve now lasts **0.45 seconds**.

The complete entry takes approximately **11.6 seconds after music is confirmed**, including the preserved **5.5-second romantic prelude**. Any wait for the guest to press Play invite comes before this.

**How much slower?** Detail spacing increases from about **200ms to 500ms**; the post-card reveal expands from about **2 to 4.6 seconds**. Total entry increases from about **9 to 11.6 seconds**, with the **5.5-second prelude unchanged**. Production access-restoration measurements after lift: **4.632 seconds in Chromium**, **4.627 seconds in WebKit**.

## Completed checks and remaining follow-up

**Production verification: passed in Chromium and WebKit.** Against the live URL, `refined-reveal.mjs` passed normal 390px and delayed-start 1280px timelines, pending/error music states, keyboard retry, refresh, reduced-motion interruptions, static deep links and the scoped missing/late-script fallback checks. `refined-reveal-audio.mjs` passed real MP3 decoding, real Web Audio gain with simulated read-only element volume, the full reveal, continuous RSVP audio and per-visit mute. Tests mocked `cloud.js` to avoid production writes; these checks do not close RB-02.

**Implementation-agent QA: passed locally in Chromium and WebKit at 390px and 1280px widths.** Reported coverage includes:

- Reveal timing, including a deliberately delayed animation start.
- Fully visible content and restored interaction at the end of the reveal.
- Keyboard use, refresh and mute behavior.
- Safely finishing the reveal when reduced motion is enabled mid-sequence.
- Actual MP3 playback and the alternative audio-volume control path.

**Independent browser review: passed for the normal reveal; no new blocker found.** The reviewer’s own `refined-reveal` and `refined-reveal-audio` suites passed. Access was restored **4.612–4.659 seconds** after the lift with full opacity. All **14/14 layout comparisons** matched the baseline after fonts loaded: seven viewports × Chromium and WebKit, with no overflow. The original reveal-timing finding (**RB-01**) is resolved.

**Reduced-motion polish (RB-03): resolved and independently verified.** Switching to reduced motion could leave the formal names briefly fading in. The fix makes them immediately fully visible and stops the remaining animation. The reviewer inspected the fix and ran `refined-reveal-rm-heading.mjs` in Chromium and WebKit, confirming an active fade before the switch, then opacity **1** and **zero animations** immediately in the same task after the reveal was stopped. Subsequent frames and samples through **one second**, including after restoring normal motion, stayed clean. Reveal cleanup, restored interaction and cleared inline styles also passed. This independently confirms the implementation agent’s earlier results.

**Existing uncommon follow-up (RB-02): still tracked.** A direct RSVP link (`?entry=0#rsvp`) may remain non-interactive if `entry.js` fails to load. This is a preexisting script-failure case, separate from the normal reveal that passed browser checks. The suggested startup-timer recovery fix has not been applied; this issue is not marked resolved.

Implementation-agent evidence includes temporary QA scripts `refined-reveal.mjs` and `refined-reveal-audio.mjs`. The independent results and latest reduced-motion measurements were supplied in the final handoff. **Physical iPhone Safari and WhatsApp in-app browsers remain untested.**

## Progress tracker

**Status key:** Planned = agreed, awaiting work/results; In progress = work underway; Implemented = changes reported in code; Verified = checks passed with evidence; Live = deployment confirmed. Pending checks are not passes.

| Item | Current status | Evidence / next milestone |
| --- | --- | --- |
| Music-led envelope opening | **Live in v7.4** | Production gate, retry, refresh, real music/gain and per-visit mute checks passed in both engines. |
| Card settles before names; details appear in reading order | **Live in v7.4** | Local, independent and production reveal suites passed; RB-01 resolved. |
| Separate bonfire message; RSVP/footer last | **Live in v7.4** | Message at 3.6 seconds; actions at 4.1 seconds; production access restored at 4.632s / 4.627s after lift. |
| Gentler floral staging | **Live in v7.4** | Deployed stages start at 1.05 / 1.55 / 2.05 / 3.10 seconds after lift; production reveal suites passed. |
| Remove hidden eight-tap names surprise; make names non-interactive | **Planned** | Approved fixes listed as pending in `STATUS.md`; awaiting actual fix results. |
| Implementation-agent QA | **Verified locally — agent QA passed** | Chromium/WebKit, 390px and 1280px; timing, final visibility/access, keyboard, refresh/mute, reduced-motion interruption and real audio checks reported above. |
| Independent reveal/audio and layout checks | **Verified locally** | Reviewer suites passed; no new blocker; 14/14 loaded-font layout comparisons match baseline with no overflow. |
| Reduced-motion names fix — RB-03 | **Live in v7.4 — resolved** | Independent targeted checks passed in both engines; production reduced-motion interruption checks also passed. |
| Existing direct-RSVP script-failure issue — RB-02 | **Tracked follow-up — open** | Uncommon preexisting failure case; proposed recovery fix not applied. |
| Release of the refined reveal | **Live — production verified** | App `1b3c526`; successful Pages run `34698513067`; production reveal/audio suites passed in Chromium/WebKit. |

## Remaining milestones

1. **Physical phone checks:** check the live invitation in physical iPhone Safari and WhatsApp’s in-app browser.
2. **Existing follow-up:** address and verify RB-02’s uncommon direct-RSVP script-failure recovery separately. The v7.4 release and production browser verification are complete.

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

### Evidence behind this update

**v7.4 release:** user-authorized commit/push of app `1b3c526cf3576e29a42c5a1d1c50202bcca172f1`; successful Pages run `34698513067`. The parent agent reported PASS for `refined-reveal.mjs` and `refined-reveal-audio.mjs` with `QA_BASE=https://mayankjainmj.github.io/neha-weds-mayank/`, covering both Chromium and WebKit as detailed above. Cloud writes were mocked during these production tests.

Historical baseline claims come from `STATUS.md`, `js/entry.js` at `6086d99`, and the supplied v7.3 release context. Local and independent QA evidence includes `refined-reveal.mjs`, `refined-reveal-audio.mjs`, 14/14 geometry comparisons and the reviewer’s Chromium/WebKit runs of `refined-reveal-rm-heading.mjs`. Current deployed cache references are CSS `66` / entry `16`. The v7.4 deployment and production evidence above establish the current live state.
