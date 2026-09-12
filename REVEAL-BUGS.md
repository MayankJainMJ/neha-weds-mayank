# Post-envelope reveal — independent bug tracker

## Review state

- **2026-09-12, final working-tree review and targeted RB-03 fix verification completed. No blocking reveal issue remains.** RB-01 and RB-03 are resolved. RB-02 remains the previously reproduced, unchanged preexisting follow-up, not a blocker for this choreography change.
- Baseline: `4ba6aea132ab957853d5c882588f07774da4e913` (`docs: record v7.3 production verification`). Initial browser responses were pinned to that commit. Final tests used the **uncommitted working tree** served by Python at `http://127.0.0.1:8765/`, with `cloud.js` mocked in every browser context. No production RSVP writes.
- Final review inspected the entry/CSS/HTML diff; `game.html` and `404.html` changes only advance the shared CSS cache token. The latest delta is confined to heading cleanup in `bail()` and the entry cache token **16**. Application-file Git blob hashes below were identical **before and after the targeted RB-03 retest**. This state includes the independently verified reduced-motion heading fix.

| Reviewed working-tree file | Git blob hash |
| --- | --- |
| `js/entry.js` | `5cc96b2e7f8456a796096aafe12e8424c1175971` |
| `css/style.css` | `5eaea5b4d4b8e978e2dc5e4c442aa0fde439d13f` |
| `index.html` | `5e35ca1636f6f13bbadd771fffe9f7eb629b1007` |
| `js/invite-audio.js` | `612c9d58b79070b37acae185d5e7f69982259dc1` |
| `css/invite-audio.css` | `d3240adc3bb26b15edbade2081d3426d5b1cb050` |

- Read the container `AGENTS.md`, project handoff/status and relevant migration contract/QA guidance. No project `AGENTS.md` or `CLAUDE.md` was found. Reviewer owns only this tracker in the application repository.
- Priorities: **P2** = meaningful functional/choreography defect; **P3** = minor cleanup/polish defect. No P0/P1 finding established. Pending-verification items are not confirmed bugs.

## Target choreography

Use **actual card FLIP/lift launch inside the committed double-rAF**, not playback confirmation, seal opening, or the timer that requests the FLIP, as `t=0`:

| Milestone | Relative to actual lift |
| --- | ---: |
| Card settles | 1.05s |
| Handwritten names begin | 1.10s |
| Formal-name transition | 2.00–2.45s |
| Date/year/countdown begin | 2.60s |
| Venue begins | 3.10s |
| Note begins | 3.60s |
| RSVP/card footer begin | 4.10s |
| Complete/unlock | approximately 4.60s |

The existing confirmed-output **Play invite** gate and 5.5s romantic prelude remain. Including the existing approximately 1.4s envelope-to-FLIP delay, normal completion should be approximately **11.5s after playback confirmation**, plus rendering latency. “Card footer” is interpreted as `.inv-links`; inspect final grouping rather than assuming it includes the separate RSVP-section `.foot-nav`.

## Findings and final disposition

### RB-01 — P2 — Content clocks run ahead of the actual card lift

**Status: RESOLVED in the reviewed working tree.** Baseline evidence is retained below; final timing evidence is in **Resolved**.

- **Evidence:** baseline `js/entry.js:326–397` starts FLIP from a 1400ms timer plus double-rAF, but independently starts ink at 1750ms, date/venue/note+actions at 2250/2450/2650ms, and cleanup at 3400ms from opening. Despite the “after the card lands” comment, ink/date/venue begin before landing. Formal names start only when note/actions start. `contentGroups()` also combines note with actions (`:253–258`).
- **Browser repro:** load the baseline with successful mocked playback. Measured Chromium times relative to actual lift: ink **+0.307s**, date **+0.808s**, venue **+1.008s**, settle **+1.073s**, formal/note/actions **+1.208s**, complete **+1.959s**. WebKit reproduced the same order (ink +0.290s; date +0.790s; settle +1.060s).
- **Controlled scheduling stress:** delaying each of the two prelaunch rAF callbacks by 500ms made ink and date start **before actual lift**, and cleanup/unlock precede landing by approximately **100ms in both engines**. This is a synthetic delay repro, not a claim that every device naturally incurs it.
- **Suggested fix:** establish the reveal clock where the real transform animation starts; split note and actions; schedule both reveal and completion from that origin. Preserve the layer-commit double-rAF. Verify opacity onset/end, not merely callback times.
- **Implemented fix reviewed:** `entry.js` captures the clock immediately before the actual FLIP animation and drives post-lift cues through one rAF timeline. Note and actions are separate groups. `complete()` waits for actual group transitions before unlocking. Normal and deliberately delayed launch tests pass in both engines.

### RB-02 — P2 — Failed entry script leaves the direct RSVP route permanently inert

**Status: CONFIRMED REMAINING — preexisting tracked follow-up, not a reveal-release blocker.** The current changes do not worsen it.

- **Evidence:** `index.html:42` returns early for `?entry=0`, before installing the 4s safety timer. RSVP is initially `inert aria-hidden="true"` at `:75`; its usual unlock is in `entry.js`. With entry unavailable, no remaining code releases it on this route.
- **Browser repro:** abort `**/js/entry.js*`, visit `/?entry=0#rsvp`, allow audio, wait 4.5s, then focus `#name`. Chromium and WebKit retain `rsvp.inert === true`, `aria-hidden === "true"`, and focus remains on BODY. The visible form cannot be used. Control case `/` with the same script failure releases RSVP at the bootstrap timeout and accepts focus.
- **Suggested fix:** install RSVP fail-open protection independently of the animation-skip bootstrap branch; do not time out a healthy, deliberately waiting music gate. Test absent and very-late entry on both `/` and `/?entry=0#rsvp`.
- **Final working-tree repro:** abort `entry.js`, visit `/?entry=0#rsvp`, wait 4.5s and attempt `#name.focus()`. Both Chromium and WebKit still report `inert=true`, `aria-hidden="true"`, active element BODY. Root-route control unlocks and focuses `#name`. This exactly matches baseline behavior.
- **Minimal follow-up suggestion:** remove only the early `?entry=0` return from the inline bootstrap at `index.html:42`, so its existing `env-boot` lock and guarded 4s safety timer also run on the skip route. Keep the separate `entry.js` skip check, which still controls animated versus immediate entry. A healthy entry controller clears `env-boot` synchronously, so the timer will not bypass a waiting music gate; missing/late entry can use the existing expiry/unlock behavior. This suggestion was not applied or tested as a patch. Validate missing/late entry and healthy blocked-audio skip-route cases when implementing it.

### RB-03 — P3 — Reduced-motion bail leaves the formal-name fade running

**Status: RESOLVED — independently verified in Chromium and WebKit with entry cache token 16.** Historical reproductions below establish the defect; post-fix evidence is in **Resolved**.

- **Baseline evidence:** `bail()` cancels `card.getAnimations()` (baseline `js/entry.js:273`), which excludes descendant transitions. Clearing the names' inline transition (baseline `:279–280`) does not cancel an already-running opacity transition when its target value remains 1. The reduced-motion CSS (`css/style.css:1672–1677`) targets `.ck-g`, not `.inv-names`.
- **Browser repro:** enable reduced motion approximately 100ms after `.ink-keep` appears. After overlay removal/unlock, the heading still has a running animation: Chromium opacity **0.429**, then **0.880** 150ms later; WebKit **0.543**, then **0.926**. Reduced motion remained enabled for both samples. It eventually reaches 1; no stale ink or lock returns.
- **Suggested fix:** explicitly cancel the reveal-owned heading transition/animation as part of bail, or disable its transition property under reduced motion. Include descendants when checking completion; a zero count from `card.getAnimations()` alone misses this.
- **Pre-fix working-tree repro:** after `.ink-keep` has existed for at least 100ms, enable reduction and wait for overlay removal. With reduction still enabled, Chromium heading opacity was **0.576 → 0.925** over the next 150ms; WebKit **0.733 → 0.973**. `names.getAnimations()` still contained a running transition while `card.getAnimations()` was empty. It subsequently reached opacity 1, and restoring motion plus waiting 5.5s caused no re-lock or stale ink.
- **Implemented fix reviewed:** `bail()` now sets heading `transition = 'none'`, clears inline opacity, forces the computed-opacity style update, then clears inline transition. Committing the non-transitioning full-opacity state cancels the running CSS transition before normal styling is restored. This is confined to force-finish cleanup; the reveal timeline is unchanged.
- **Test gap closed:** the older `refined-reveal.mjs:193–205` checks heading opacity only after a 4.8s wait and counts parent animations only. The new `refined-reveal-rm-heading.mjs` directly checks heading opacity/animations in the bail task's mutation microtask, then subsequent frames and timed samples. Independent rerun passes.

## Implementation checks and remaining coverage

| ID | Check priority | Risk and suggested verification | Current evidence |
| --- | --- | --- | --- |
| RV-01 | High | **Clock and final fade** | **PASS:** normal 390×844 and delayed-double-rAF 1280×844 runs in both engines hit the requested order and unlock with CTA opacity 1. Hidden-state and mid-fade opacity samples pass. See RB-01 timing table. |
| RV-02 | High | **Queued work / live reduction** | **PASS for tested cancellation paths:** reduction during delayed commit, ink, formal fade and actions releases locks; no resurrection after original deadlines. Post-lift nested timers were removed. Targeted RB-03 retest now also confirms immediate heading opacity 1 and zero heading animations, without restart when normal motion is restored. Every possible frame boundary and each date/venue fade were not separately swept. |
| RV-03 | High | **Focus/inert/a11y** | **PASS for browser focus/DOM checks:** pre-unlock card/RSVP focus attempts fail, sampled fades remain inert, completion focuses names, blur removes tabindex, keyboard audio retry retains button focus. Card inertness lasts until after ink removal. Actual screen-reader announcements were not tested. |
| RV-04 | High | **Music gate** | **PASS:** pending/error/keyboard retry, full prelude, stale pending promise, refresh, initial reduced motion, skip-route gate, per-visit mute, real MP3 decode and Web Audio gain path, continuous audio through RSVP navigation. Audio controller/CSS are unchanged from baseline. Suspended-context-only event, background/pagehide and bfcache cases were not rerun in this final pass. |
| RV-05 | Medium | **Card geometry and painting** | **PASS for measured scope:** loaded-font card and all direct-child rectangles match baseline exactly at all seven sizes in both engines; no horizontal overflow. Normal animated runs preserve launch-target/final bounds and settle before names. Final 390px Chromium/1280px WebKit screenshots inspected. Mid-flight pixel continuity, live resize and late-font/logo arrival were not independently filmed/tested. |
| RV-06 | Medium | **Deep links / content completeness** | **PASS for tested paths:** healthy blocked-audio skip link unlocks immediately after retry; RSVP link/input remain usable with continuous audio. Date/year/countdown and CTA/footer cues align; note has its own beat; no residual ink/groups. Missing-script deep link remains RB-02. Saved/edit fixtures and Good to know were not rerun in final testing. |

## Baseline-era tests: useful coverage and gaps

External QA directory: `/var/folders/l0/3r2flvtx4zj0p4bggn67rxxm0000gp/T/opencode/invite-audio-qa/`.

- **`play-invite-gate.mjs`** covers blocked/error retry, keyboard gesture, refresh/legacy mute, static reduced-motion/deep-link gating, real decoder/gain fallback, and suspended output. Its `:44–49` completion check is approximately 9.15s after gesture, too early for the new sequence. Its reduced-motion check is performed while the gate is waiting, **not during the reveal**.
- **`auto-entry-rsvp.mjs`** covers autoplay fade, normal names focus, music-button focus preservation, inert unlock, local mocked RSVP persistence, dialogs, and routes. Completion checks at `:64–69` and `:116–118` use approximately 9s from playback. Update the owning agent's expectations to the new bounded duration; also verify timed milestones so a generous final timeout cannot hide bad order.
- **`romantic-prelude-visual.mjs`** currently forces blocked playback and screenshots the waiting gate at 4s. Despite its filename, it supplies no evidence for post-envelope choreography.
- These scripts mock `cloud.js`; retain that isolation. They were **read, not modified or rerun** by this reviewer. Historical STATUS test claims are not new-review passes.
- New checks should sample before and after each milestone, computed opacity/transform and descendant animations, plus final focus/inert state. Existing final-state assertions alone miss RB-01 and RB-03. Add the skipped-entry failure branch for RB-02.

## Checks performed in the initial baseline review

New diagnostic script, outside the repository:
`/var/folders/l0/3r2flvtx4zj0p4bggn67rxxm0000gp/T/opencode/reveal-baseline-review.mjs`

It pins all site assets to the baseline commit, uses a local Python HTTP server on port 8779, replaces `cloud.js` with an empty module, blocks external requests, and mocks media playback. It creates no RSVP records. **External fonts are blocked**, so its geometry is explicitly a fallback-font baseline, not final design approval.

- Completed eight diagnostic scenarios per engine in **Chromium and WebKit**: normal reveal, delayed double-rAF, missing entry on root, missing entry on skip/deep link, reduced motion during prelude/lift/formal fade, blocked gate → reduction → keyboard retry.
- Normal completion: card/RSVP unlocked, RSVP `aria-hidden` removed, heading focus and blur cleanup correct, no residual card animation/ink/groups. Gate retry retained music-button focus.
- Reduction: tested paths release locks and cancel parent FLIP; after restoring motion and waiting 9.5s, no queued re-lock/re-hide/ink resurrection. The formal fade residue is separately confirmed as RB-03.
- Focused rerun of formal-fade cancellation kept reduction enabled for another 150ms and reproduced RB-03 in both engines. Initial overloaded parallel diagnostics were replaced with sequential runs and event-based cancellation waits; short polling delays from that first attempt are not reported as product bugs.
- Physical iPhone Safari, WhatsApp, real soundtrack/output, background/bfcache lifecycle, loaded-font screenshots, and the full responsive matrix were not exercised by this review.

Reproduce all baseline cases:

```sh
PLAYWRIGHT_BROWSERS_PATH="/var/folders/l0/3r2flvtx4zj0p4bggn67rxxm0000gp/T/opencode/invite-audio-qa/browsers" node "/var/folders/l0/3r2flvtx4zj0p4bggn67rxxm0000gp/T/opencode/reveal-baseline-review.mjs"
```

`QA_CASE=6` selects only the formal-fade cancellation case. The script is diagnostic: it reports known failures rather than treating completion of the run as an all-pass verdict. It always tests the pinned baseline, not the new working tree.

## Resolved

### RB-01 — resolved with working-tree timing and rendering evidence

Independent rerun of the implementation agent's `refined-reveal.mjs` passed in Chromium and WebKit. These are observed milliseconds from instrumented actual FLIP launch, not nominal constants:

| Case | Ink | Formal starts | Ink removed | Date | Venue | Note | Actions/footer | Unlock |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chromium 390×844 | 1107 | 2006 | 2456 | 2606 | 3106 | 3606 | 4106 | 4612 |
| Chromium 1280×844, delayed commit | 1108 | 2007 | 2458 | 2608 | 3107 | 3608 | 4107 | 4629 |
| WebKit 390×844 | 1113 | 2011 | 2478 | 2611 | 3112 | 3618 | 4125–4126 | 4659 |
| WebKit 1280×844, delayed commit | 1130 | 2029 | 2463 | 2629 | 3129 | 3610 | 4108 | 4635 |

- Delayed commit-to-lift intervals were approximately 427–428ms; content remained relative to actual lift. Prelude measured approximately 5504–5505ms from confirmed audio.
- The suite checks identity/near-identity card transform at +1075ms, no card transform at +1500ms, names hidden during handwriting, formal opacity 1 before date, staged partial opacities for date/venue/note/actions, all sampled stages inert, and CTA opacity 1 at unlock.
- This broader suite predates the RB-03 fix; immediate heading cancellation is verified separately below.

### RB-03 — resolved with same-task and post-restoration evidence

Inspected the heading-only cleanup change and independently ran the unchanged external `refined-reveal-rm-heading.mjs` against the latest working tree, with `cloud.js` mocked and media playback simulated.

| Engine | Heading immediately before reduction | Same-task post-bail heading | Later samples |
| --- | --- | --- | --- |
| Chromium | Opacity **0.261494**, one running `CSSTransition` | Opacity **1**, **zero animations** | First/second frames and 50/150/500/1000ms: opacity 1, zero animations |
| WebKit | Opacity **0.356153**, one running `CSSTransition` | Opacity **1**, **zero animations** | First/second frames and 50/150/500/1000ms: opacity 1, zero animations |

- The immediate snapshot runs in mutation delivery after `bail()`, before another paint, closing the gap that previously allowed a short surviving fade to go unnoticed.
- Normal motion is restored after that snapshot. Every subsequent sample remains fully opaque with no surviving or restarted heading transition; inline opacity/transition are cleared, overlay/ink are absent, card/RSVP are unlocked, and RSVP `aria-hidden` is removed. No page errors.
- **Result: RB-03 PASS in both engines.** This targeted retest was sufficient for the isolated cleanup/cache-token change; broader suites were not rerun.

## Final validation record

- **Validation states:** the broader suites, geometry comparisons and historical RB-02/RB-03 repros below ran on pre-heading-fix entry blob `b03605c22727d9dc2971e6dad2dab3a50b60efe7` and index blob `13c32cf1eeb11d484a446df1841ff59945bb6d29`. The later heading-only fix and entry cache token 16 were inspected and tested with the focused suite above; latest hashes are at the top. CSS/audio hashes did not change. RB-02's bootstrap path is unchanged and was not redundantly retested in the heading-fix pass.
- **Ran unchanged existing scripts:** `refined-reveal.mjs` and `refined-reveal-audio.mjs` in the external QA directory. Both report PASS for **Chromium and WebKit**. They use a Python-served working tree and replace `cloud.js` with an empty module. Native-audio checks exercise real MP3 decoding/AudioContext gain with simulated read-only element volume; they do not constitute an iPhone-hardware test.
- **Independent targeted checks, read-only inline Node/Playwright:** repeated missing-entry root/skip-route repro and formal-fade reduction with immediate, +150ms, later-static and post-deadline samples in both engines. Results are recorded under RB-02/RB-03. No existing QA scripts were edited.
- **Independent geometry comparison:** loaded current HTML with baseline HEAD `entry.js`/`style.css` supplied through browser routes, versus final working versions. Used successful mocked audio and `?entry=0`; waited for font readiness and image decoding. Verified Cormorant and Great Vibes loaded. Compared the entire card rectangle and every direct child's rectangle at **320×568, 375×667, 375×812, 390×844, 430×932, 1280×800, 800×430**, in both engines: **14/14 paired comparisons identical**, no horizontal overflow. Current index differs from baseline only in cache tokens, so the compared card markup is identical.
- At 800×430, both versions have card top 20px and bottom 502.3125px: existing landscape vertical scroll remains, without worsening. At 320×568 the measured card fits from y=28.0625 to 539.9375; the historical 17px report is not a current measurement.
- Reviewed regenerated final screenshots `refined-chromium-390.png` and `refined-webkit-1280.png`; names/date/venue/note/actions are readable with no duplicate ink residue. These are final-state screenshots, not proof of every in-flight frame.
- `node --check js/entry.js`, `node --check js/invite-audio.js`, and `git diff --check` passed in the broader review. After the RB-03 fix, the entry syntax and diff whitespace checks passed again; the five latest application hashes at the top were rechecked after the focused test and remained unchanged.
- Remaining coverage limitations are listed per RV item. Physical iPhone Safari/WhatsApp, actual assistive-technology output, and live background/bfcache behavior are not claimed as passed.

## Known unrelated deferred issues

- **E4 / interactive names:** STATUS's approved pending list (`STATUS.md:56–59`) calls for removing the eight-tap heart egg and making names non-interactive/non-selectable. Baseline `js/eggs.js:29–38` still installs a pointer cursor/click handler; the root still loads it. Track separately from reveal timing; preserve legitimate temporary screen-reader focus when eventually fixing it.
- **Compact/landscape overflow:** STATUS records inherited short-screen overflow (including an older 17px card-page overflow report at 320×568) and accepted landscape scrolling. Do not claim those historical measurements as current results or demand a zero-scroll two-section page. Compare invitation-card geometry and horizontal overflow against an equivalent baseline state before attributing a regression.

## Final recommendation

**Ready for release from this independent review's tested scope; no blocking reveal finding remains in the hashed working-tree state.** RB-01 and RB-03 are resolved with browser evidence. Preserve RB-02 as the explicitly tracked preexisting missing-script follow-up; it is unchanged and does not block this reveal change. Existing coverage limitations remain documented above. This reviewer pass modified only `REVEAL-BUGS.md`; no application fix, commit, push or deployment was performed.
