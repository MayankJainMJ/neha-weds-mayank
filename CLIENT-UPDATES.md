# Wedding invitation — client progress updates

**Last updated: 12 September 2026 · Independent verification complete; ready for release decision**

**Current position: Ready for release decision; existing follow-up tracked.** Local implementation and independent browser verification are complete, including the final reduced-motion fix. **RB-01 and RB-03 are resolved**; independent review found no new blocker. **The live invitation remains v7.3**; the refinement has not been committed, pushed or deployed. Physical phone checks remain pending.

Live invitation: https://mayankjainmj.github.io/neha-weds-mayank/

## What guests can experience today

- Music attempts to start on every visit, including a refresh.
- When the browser blocks music, **Play invite** appears in the top-right corner. The envelope waits for confirmed playback.
- Once music starts, two romantic lines appear during a **5.5-second prelude**, followed by the envelope opening.
- Guests can RSVP on the same page while the invitation soundtrack continues.

The v7.3 release record reports successful deployment and production checks in Chromium and WebKit. Physical iPhone Safari and WhatsApp in-app browser checks remain pending.

## What is happening now

The implementation agent has completed the approved reveal changes. Both the implementation agent’s checks and the independent reviewer’s reveal/audio suites passed. The reviewer confirmed the finished card matches the previous layout across seven screen sizes in both browser engines, with no overflow. Independent checks of the final reduced-motion fix have also passed, completing this reveal review.

The locally implemented sequence is: **card settles → names → date and countdown → venue → bonfire message → RSVP and footer links**, with flowers appearing in gentle stages around the card. Timing now follows the card’s actual lift, helping the sequence stay coordinated even when the browser starts an animation late.

### Guest-visible before and after

“After” describes the completed, independently browser-verified local implementation. The release decision and deployment are pending.

| Moment | Before — deployed v7.3 sequence | After — implemented locally |
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

## Completed checks and remaining follow-up

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
| v7.3 music-led envelope opening | **Live** | `STATUS.md` records app release `6086d99`, successful Pages deployment `34694955656`, and production Chromium/WebKit checks. Documentation reference supplied for this snapshot: `4ba6aea`. |
| Card settles before names; details appear in reading order | **Verified locally** | Implementation and independent reveal suites passed; RB-01 timing issue resolved. |
| Separate bonfire message; RSVP/footer last | **Verified locally** | Message starts at 3.6 seconds; actions at 4.1 seconds; independent measured access restoration at 4.612–4.659 seconds, fully visible. |
| Gentler floral staging | **Verified locally** | Reveal suites passed; stages start at 1.05 / 1.55 / 2.05 / 3.10 seconds after lift. |
| Remove hidden eight-tap names surprise; make names non-interactive | **Planned** | Approved fixes listed as pending in `STATUS.md`; awaiting actual fix results. |
| Implementation-agent QA | **Verified locally — agent QA passed** | Chromium/WebKit, 390px and 1280px; timing, final visibility/access, keyboard, refresh/mute, reduced-motion interruption and real audio checks reported above. |
| Independent reveal/audio and layout checks | **Verified locally** | Reviewer suites passed; no new blocker; 14/14 loaded-font layout comparisons match baseline with no overflow. |
| Reduced-motion names fix — RB-03 | **Independently verified locally — resolved** | `refined-reveal-rm-heading.mjs` passed in both engines: immediate full opacity, zero animations, clean samples through one second, restored interaction and cleared inline styles. |
| Existing direct-RSVP script-failure issue — RB-02 | **Tracked follow-up — open** | Uncommon preexisting failure case; proposed recovery fix not applied. |
| Release of the refined reveal | **Ready for release decision** | Independent verification complete; no new blocker. Existing follow-up tracked. Local changes only; no commit, push or deployment. |

## Remaining milestones

1. **Make the release decision:** independent browser verification is complete, with RB-01 and RB-03 resolved and no new blocker. Keep the existing RB-02 follow-up visible. Physical iPhone Safari and WhatsApp checks remain outstanding.
2. **Confirm what is live:** after an approved release, record commit/deployment evidence and production checks. Until then, v7.3 remains the confirmed live baseline.

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

### Evidence behind this update

Baseline claims come from `STATUS.md` (the v7.3 changelog and automatic-entry/embedded-RSVP section), the deployed-release version of `js/entry.js` at `6086d99`, and the supplied release context. Local completion and QA claims come from the supplied implementation-agent handoffs, including `refined-reveal.mjs` and `refined-reveal-audio.mjs`. Reported changes are coordinated animation-frame timing in `js/entry.js`, handwriting timing/dissolve adjustments in CSS, current HTML cache references CSS `66` / entry `16`, and a forced style commit for the final RB-03 fix. Independent suite results, timing measurements, 14/14 geometry comparisons and RB dispositions come from the supplied final review evidence. Final RB-03 verification comes from the reviewer’s inspection and Chromium/WebKit runs of `refined-reveal-rm-heading.mjs`. Historical production checks verify v7.3 only; local QA does not establish that the refinement is live.
