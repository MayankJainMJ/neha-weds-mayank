# Invitation-first homepage and Sakura-only presentation — implementation plan

**Status:** Approved; IF0–IF4 complete; release requested
**Date:** 2026-09-12
**Author:** OpenCode assistant
**Domain:** Frontend routing migration and theme retirement
**Parent:** [SPEC.md](./SPEC.md)
**Progress:** [STATUS.md](./STATUS.md), phases IF0–IF5
**Audited baseline:** `ac0de7f` — invitation soundtrack release

> Guests should arrive at the sealed wedding invitation through the main site URL, with cherry blossom as the only invitation/RSVP presentation and the game available as an optional destination. The central implementation requirement was to change the homepage and every route consumer together because `index.html` previously meant “game” in both links and transition code. Release requires working root/legacy routes, preserved artwork and guest data, and passing visual and interaction checks.

## §1. Product narrative and capability map

**For guests:** open the shared main URL → see the envelope → open it with music → read the invitation → RSVP or play the game → return to the invitation.

**For the couple:** one invitation link to share, one consistent cherry-blossom design, and an optional game that remains fully functional.

| Capability | Guest-facing result | Implementation | Phase |
| --- | --- | --- | --- |
| Invitation at the main URL | Guests land on the envelope rather than Press Start | Current invitation becomes `index.html`; initial HTML and script order retained (§8–9) | IF3 |
| Optional game with a return route | Play the game from the invite; return from game screens | Add `game.html`; update static and generated links plus `js/game.js` actions (§7–8) | IF1, IF3 |
| One invitation design | No Lotus selector or remembered Lotus appearance | Fixed `bg-sakura` markup; retire theme switching and Lotus-exclusive code (§7) | IF2 |
| Previously shared links still work | `/invite` and `/invite.html` reach the new homepage | Lightweight compatibility redirect using `location.replace`, query/hash preservation, fallback link (§8) | IF3 |
| Consistent page transitions | Paper destinations use blush; game destination uses the game wash | Correct `js/nav.js` destination detection and prefetch targets (§7–8) | IF3 |
| Music remains available | Seal still starts Darkhaast; mute button occupies the freed corner | Preserve audio controller; reposition `.invite-sound` from right 64px to 10px (§7) | IF2–IF3 |
| Existing responses and scores survive | Returning guests retain RSVP/game state | Preserve storage keys and Firestore identity/schema; test against isolated fixtures (§3, §11) | All |

## §2. Verified current state

- `index.html` is the game page: `data-page="game"`, `bg-morning`, Press Start, canvas, game scripts, and a link to `invite.html`.
- `invite.html` contains the envelope, invitation card, Good to know dialog, music control, and an `index.html` game link.
- `rsvp.html` links back to `invite.html`; its leaderboard game link and game prefetch target `index.html`.
- `js/game.js` generates invitation links and has `goinvite` / `gorsvp` navigation actions.
- `js/nav.js::veilFor()` identifies `index.html` and any trailing-slash URL as game destinations. This becomes incorrect when the homepage is the invitation.
- `js/theme.js` reads `mwn.theme`, accepts `?theme=sakura|lotus`, changes body classes, and creates `.theme-toggle`.
- Both invitation and RSVP load `js/lotus.js` and `js/sakura.js`.
- All four HTML pages have an arrival-bootstrap read of the old Lotus preference.
- Sakura rendering uses shared names `.lotus-bg`, `.lotus-fg`, `.lotus-sway`, `.petal`, `.lotus-heart`, `.drift`, and shared animations. These are active Sakura dependencies despite their names.
- `css/invite-audio.css` positions the 44px music control at `right:64px`, next to the current theme chip.
- The production extensionless `/neha-weds-mayank/invite` returned HTTP 200 during the read-only audit. Keep verifying this alias after cutover; local Python serving does not emulate every GitHub Pages URL behavior.

## §3. Goals, preserved contracts, and non-goals

### Goals

1. Serve the actual invitation HTML at the site homepage without a redirect to `invite.html`.
2. Make Sakura the sole invitation and RSVP theme, including for returning guests with Lotus saved previously.
3. Provide an optional game route and update every relevant navigation/prefetch consumer.
4. Keep old invitation URLs usable without duplicating the complete invitation implementation.
5. Preserve the current envelope, music, blossoms, typography, content, controls, and data behavior except for the explicitly listed changes.

### Preserved contracts

- `img/logo.png` and `img/logo.webp`: byte-identical to the implementation baseline. All animals, flowers, internal transparency, blue strokes, dimensions, and current on-screen placements are preserved.
- The custom NM seal and current logo/seal offsets are preserved.
- Every fresh homepage load/refresh shows the envelope, subject to the existing reduced-motion, `?entry=0`, and startup fail-open behavior.
- `html.env-boot`, the 4s `mwnEnvExpired` safeguard, synchronous entry takeover, repeat-tap lock, and focus handoff remain in place.
- Darkhaast remains seal-gesture-started, looping, and independently muteable. `mwn.inviteMusicMuted` is preserved. Leaving/backgrounding the page still pauses it.
- Blossom Season remains active on the Sakura invitation; RSVP retains its existing blossom behavior.
- RSVP fields, copy, validation, summary/edit states, and 350px form cap remain intact.
- Game mechanics, music, scores, progress, and Firebase guest identities remain intact.
- Game and 404 keep their existing pixel-art presentation.

### Non-goals

- No single-page-app/PJAX conversion, new framework, bundler, package manifest, server, or Firebase migration.
- No fullscreen restoration or automatic audio on page load.
- No simultaneous implementation of the separately parked E4 removal/non-selectable-names bug list.
- No account-root GitHub Pages move. The site base in this plan is `https://mayankjainmj.github.io/neha-weds-mayank/`.
- No unrelated cosmetic or copy changes.

## §4. Core migration rule

The route cutover in IF3 must be atomic: move the invitation to `index.html`, retain the game at `game.html`, and update links, game actions, transition classification, prefetches, and the legacy alias in the same local change set.

Theme retirement is a dependency cleanup, not a global deletion of anything named “lotus.” Remove only code exclusive to the retired theme; retain shared Sakura rendering primitives.

## §5. Target structure

```text
/neha-weds-mayank/                  index.html: envelope + invitation
    ├── RSVP                       rsvp.html
    │     ├── Return to invitation ./
    │     └── Leaderboard → game    game.html
    └── Play the game              game.html
          ├── Skip/return          ./
          └── Existing RSVP action rsvp.html

/neha-weds-mayank/invite.html       compatibility redirect → ./
/neha-weds-mayank/invite            Pages alias → compatibility redirect → ./
/neha-weds-mayank/404.html           recovery link → site homepage
```

Keep the existing flat file layout. Normal sibling-page links use `./`, `game.html`, or `rsvp.html`, so they work both at a local root and under the GitHub Pages project prefix.

## §6. Reuse map

| Need | Existing implementation to reuse | Treatment |
| --- | --- | --- |
| Main invitation | `invite.html` | Transfer to `index.html`; preserve component markup and IDs |
| Game | Current `index.html` and existing game JS | Copy to `game.html` first; change navigation destinations only |
| Sakura background | `js/sakura.js` plus shared CSS primitives | Keep renderer and animation behavior |
| Opening experience | `js/entry.js` and inline bootstrap | Keep existing implementation |
| Invitation music | `js/invite-audio.js`, audio asset, audio stylesheet | Keep controller and media; move control to vacated corner |
| Route transitions | `js/nav.js` | Correct destination classification; retain interception safeguards |
| Guest storage/sync | `js/store.js`, `js/cloud.js` | No schema or identity changes |
| Progress documentation | `STATUS.md` | Add IF phase tracking and per-phase evidence |

No new application-level router is needed. The only new product page is `game.html`; the legacy invitation file becomes a small compatibility page.

## §7. Major change ledger — exact before/after intent

These IDs must also appear in the implementation report so every significant edit is attributable to an approved change.

| ID | File / area | Current behavior | Planned change and reason | Phase |
| --- | --- | --- | --- | --- |
| C01 | New `game.html` | Game exists only at `index.html` | Preserve game HTML at an explicit game URL; keep game script ordering and canvas IDs | IF1 |
| C02 | `index.html` | Root displays the game | Replace with the current invitation; set `data-page="invite"`, `body.bg-sakura`, invitation title/description and canonical homepage URL | IF3 |
| C03 | `invite.html` | Full standalone invitation | Replace with compatibility redirect to `./`; preserve query/hash and provide a direct fallback link | IF3 |
| C04 | Invitation/RSVP/game links | `index.html` means game; `invite.html` means invitation | Update the complete link matrix in §8, including links generated in JS | IF3 |
| C05 | `js/game.js` | Overlay skip links and `goinvite` point to `invite.html` | Point them to `./`; keep `gorsvp` pointing to `rsvp.html` and preserve existing `MWN_NAV` fallback | IF3 |
| C06 | `js/nav.js::veilFor()` | Root/trailing slash and `index.html` receive game wash | Classify the resolved `game.html` destination as game; root/`index.html` as invitation. Retain game-page exit palette and all navigation guards | IF3 |
| C07 | Prefetches in HTML and `js/rsvp.js` | Invite prefetches/return targets use `invite.html`; leaderboard warms `index.html` | Warm the new homepage and explicit game destination; preserve existing save-data checks and once-only prefetch behavior | IF3 |
| C08 | `js/theme.js` and its includes | Stored/query theme switching and theme chip | Remove script includes and retire the file after the dependency audit; retain static Sakura body classes before first paint | IF2 |
| C09 | `js/lotus.js` and its includes | Alternate theme renderer can initialize | Remove includes and retire the exclusive renderer after consumers are removed | IF2 |
| C10 | `css/style.css` | Dual-theme palette, chip, and Lotus-specific shapes | Remove proven Lotus-only selectors, `.theme-toggle` rules, and `.veil-lotus`; retain Sakura and shared renderer styles | IF2 |
| C11 | Inline arrival bootstrap on all pages | Reads `mwn.theme` and sets `veil-lotus` | Remove the legacy theme lookup; retain arrival-veil timing, reduced-motion handling, and safety timeout | IF2 |
| C12 | `css/invite-audio.css` | Music chip at right 64px; alternate Lotus colors | Move to right 10px at the existing 10px top offset; keep 44×44px target/focus styles and retire alternate colors | IF2 |
| C13 | `404.html` | Relative links may resolve from a missing nested URL | Return to the project homepage; use a project base for its relative assets/links so nested production 404s work (§8) | IF3 |
| C14 | HTML metadata | Root previews the game | Homepage uses invitation metadata and a canonical/OG URL ending in `/neha-weds-mayank/`; game stays clearly game-labelled; legacy page canonical points to homepage | IF3 |
| C15 | Changed asset references and docs | Existing versioned CSS/JS URLs and old route descriptions | Bump only changed CSS/JS references; record migration and evidence in `STATUS.md`; preserve historical changelog entries | IF4–IF5 |

### C10 deletion rules

- Remove a rule only when all its selectors are exclusive to the retired theme, or remove just the obsolete selector from a mixed list.
- Keep `.lotus-bg`, `.lotus-fg`, `.lotus-sway`, `.petal`, `.lotus-heart`, `.drift`, and the shared rules/keyframes used by Sakura. Do not rename them as part of this migration.
- Keep generic `.card-dark`, `.gold-frame`, modal, form, game, and responsive primitives.
- Remove obsolete Lotus release selectors without disturbing Sakura's `hold-bloom` / `go1–go4` behavior.
- No artwork file is deleted because its filename or content mentions lotus. The personalized illustrated logo remains intact.

### Theme preference contract

- Invitation and RSVP carry their Sakura body classes directly in HTML.
- Production code stops reading or writing `mwn.theme`.
- An existing `mwn.theme=lotus` value becomes inert; no `localStorage.clear()` or guest-data reset is permitted.
- Both `?theme=lotus` and `?theme=sakura` become harmless obsolete parameters; neither changes the single active presentation.

## §8. Route and compatibility contract

### Canonical route table

| Input | Result |
| --- | --- |
| Site base `/neha-weds-mayank/` | Serve invitation HTML directly |
| `/neha-weds-mayank/index.html` | Same invitation |
| `/neha-weds-mayank/game.html` | Existing playable game |
| `/neha-weds-mayank/rsvp.html` | Existing RSVP |
| `/neha-weds-mayank/invite.html` | Replace current history entry with homepage |
| `/neha-weds-mayank/invite` | Preserve currently working Pages alias; verify after deployment |
| Homepage with `?entry=0` | Show card immediately; music remains gesture-controlled |
| Legacy invitation with `?entry=0#names` | Forward to homepage with `?entry=0#names` intact |
| Invitation with old `?theme=lotus` or saved Lotus preference | Show Sakura |

The redirect uses a destination resolved against its own URL, then copies `location.search` and `location.hash`. Use `location.replace`, not `assign`, so Back does not repeatedly visit the redirect page. It loads no game, background, entry, audio, or Firebase scripts. Include a simple homepage anchor for blocked JavaScript.

GitHub Pages static HTML cannot itself issue an HTTP 301 via JavaScript. Describe this accurately as a compatibility redirect, not a server-side permanent redirect. Confirm the existing extensionless alias remains served; if Pages behaves differently after cutover, resolve that compatibility issue before release acceptance.

### Link and prefetch matrix

| Owner / selector or action | New target |
| --- | --- |
| Homepage `.inv-rsvp` | `rsvp.html` |
| Homepage `.inv-links` game anchor | `game.html` |
| Homepage RSVP prefetch | `rsvp.html` |
| RSVP `.footlink` return anchor | `./` |
| RSVP `#lbModal` game anchor | `game.html` |
| RSVP homepage prefetch | `./` |
| `js/rsvp.js` `pfGame` link | `game.html` |
| Game initial skip anchor | `./` |
| `js/game.js` generated skip anchor | `./` |
| `js/game.js` `goinvite` | `./` |
| `js/game.js` `gorsvp` | `rsvp.html` |
| Game idle/load-time homepage prefetch | `./` |
| 404 recovery anchor and prefetch | Project homepage |

For 404, set `<base href="/neha-weds-mayank/">` before relative resource references. This makes its `./` recovery and assets resolve correctly even when Pages serves the document for a missing nested path. Preview that case with the local project mounted at `/neha-weds-mayank/` (§11).

### Navigation helper behavior

- Resolve candidate destinations as URLs before classification.
- Treat the site's explicit `game.html` route as game; do not infer game from `index.html` or a trailing slash.
- Preserve existing same-origin, HTTP(S), `_self`, no-modifier, no-download click filtering, fragment handling, repeat-click locking, reduced-motion behavior, and bfcache cleanup.
- Preserve game music shutdown on game exits and invitation audio's pagehide/background pause.

## §9. Homepage startup order

1. Head declares `data-page="invite"`, the Sakura arrival background, invitation fonts, logo preload, and versioned styles.
2. Body starts with `bg-sakura`; no external theme script is required to make it Sakura.
3. The inline `env-boot` logic runs before invitation markup is parsed.
4. Invitation components retain their IDs: `.invite-card`, `#names`, `#gtkModal`, `#inviteAudio`, `#inviteSound` and related controls.
5. Keep the current functional script ordering: logo helper → Sakura renderer → invitation audio controller → entry controller → existing other functionality → cloud module / navigation helper as currently required.
6. Entry locks the card and creates the envelope synchronously, then releases `env-boot` in the same task.
7. Seal activation invokes the existing audio controller inside the gesture and proceeds through the current animation.

Route migration must not duplicate any controller, add a second audio element, or cause the invitation to flash before the envelope. Game code loads on `game.html`, not on the homepage.

## §10. Phased build order

Application work followed this sequence. IF3 was applied as one atomic routing cutover so no partially swapped homepage/link set was deployed.

| Phase | Deliverable | Dependency | Risk | Exit gate |
| --- | --- | --- | --- | --- |
| IF0 | Baseline, checkpoint, route/style dependency inventory | Approved plan | Low | Baseline and rollback recorded |
| IF1 | Working additive `game.html` | IF0 | Low | Game loads/plays; old routes still work |
| IF2 | Sakura-only invitation/RSVP and single music chip | IF1 | Medium | Old theme preferences cannot affect rendering; visual baseline preserved |
| IF3 | Atomic homepage/links/transitions/legacy-route cutover | IF2 | Medium | Complete route matrix passes |
| IF4 | Cross-browser review, visual regression, fixes, cache references | IF3 | Medium | All applicable acceptance tests pass; review findings resolved |
| IF5 | Release approval, commit/push, production verification | IF4 plus explicit release instruction | Medium | Actual production routes, assets, and playback verified |

### IF0 — Capture baseline and prepare rollback

1. Inspect current status/diff/history and record the actual starting commit. This plan was audited against `ac0de7f`; recheck if anything has changed.
2. Preserve existing unrelated/untracked work. Never use blanket staging or destructive cleanup.
3. Create a new local checkpoint tag, proposed name `pre-invitation-first-sakura-only`, after checking that the name is unused. Record its exact commit in STATUS. No tag is created by this planning document.
4. Capture mobile and desktop baselines: closed envelope, settled card, playing/muted music control, Good to know, RSVP fresh/+1/decline/summary/edit, and game splash/active/overlay.
5. Record hashes for both personalized logo files and the soundtrack.
6. Enumerate route/prefetch literals, theme readers, and CSS dependencies to guide C04/C07/C10.

### IF1 — Give the game its own page safely

1. Copy the current game `index.html` to `game.html`; retain `data-page="game"` and `bg-morning`.
2. Keep canvas/overlay/HUD/dialog IDs, game assets, script order, and launch logic.
3. Verify direct `game.html` entry, Press Start, name entry, game launch, mute, and skip behavior.
4. Keep the old homepage operational until IF3. Final repointing belongs to the atomic cutover.

### IF2 — Retire Lotus without changing Sakura artwork

1. Ensure fixed Sakura body markup on the current invitation and RSVP.
2. Remove theme-switch includes and Lotus-renderer includes, then retire `js/theme.js` and `js/lotus.js` after reference verification.
3. Remove old theme-preference reads from all arrival bootstraps, including the prepared game copy.
4. Apply the C10 deletion rules to theme-exclusive CSS; compare renders before/after cleanup.
5. Move only the music toggle's horizontal offset from 64px to 10px and remove its alternate palette block.
6. Verify fresh storage, stored Lotus, obsolete theme query parameters, and blocked storage all result in Sakura.
7. Verify entry/audio behavior and the 350px RSVP form remain intact.

### IF3 — Switch the homepage and every consumer together

1. Transfer the now-Sakura-only invitation into `index.html`, following §9.
2. Replace `invite.html` with the compatibility page defined in §8.
3. Apply every navigation and prefetch change in the §8 matrix.
4. Update `veilFor()` so the root URL receives the invitation's blush treatment.
5. Set invitation homepage metadata/canonical URL and the legacy canonical reference; keep game metadata game-specific.
6. Apply the project-aware 404 base and recovery links.
7. Run root → game → root, root → RSVP → root, game → RSVP, legacy link → root, and Back/Forward tests before considering IF3 complete.

### IF4 — Validate, resolve findings, and prepare the release

1. Run the acceptance suite in §11 on Chromium and WebKit, with all specified viewport checks.
2. Produce current screenshots, recordings, console/network results, and asset-hash comparisons.
3. Request Codex review of the actual migration diff and rendered evidence. Supply the change ledger and route contract; do not describe the plan as already validated.
4. Fix every confirmed issue and repeat affected checks; recheck the corrected diff with Codex. Record actual verdicts, not conditional/inferred PASS claims.
5. Update cache tokens for changed scripts/styles and their consumers. Preserve unchanged asset URLs unless a real caching issue requires otherwise.
6. Update STATUS with the files changed, test results, outstanding device checks, and final review verdict.

### IF5 — Release and verify

1. Present the final before/after summary and local preview for approval.
2. When explicitly instructed to release, inspect status/diff/history and stage only the migration files. Commit the working migration coherently and push to the existing personal repository.
3. Wait for the GitHub Pages deployment to succeed.
4. Verify the normal base URL, `game.html`, `rsvp.html`, `/invite`, `/invite.html`, and a nested missing URL on production.
5. Confirm current versions of the changed CSS/JS are serving, then verify envelope start, music, navigation, and mute on the deployed homepage.

## §11. Target verification

### Commands and local hosting

From the website repository:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
git diff --check
node --check js/nav.js
node --check js/game.js
node --check js/rsvp.js
node --check js/entry.js
node --check js/invite-audio.js
```

For production-prefix/404 verification, run `python3 -m http.server 8766 --bind 127.0.0.1` from the parent `Websites/` folder and use `http://127.0.0.1:8766/neha-weds-mayank/`. Python's default error response is not GitHub Pages' custom 404 behavior; also test the actual deployed nested-missing route in IF5.

IF0 prepared migration-specific Playwright verification in the external temporary QA workspace under `/var/folders/l0/3r2flvtx4zj0p4bggn67rxxm0000gp/T/opencode/invite-audio-qa/`. The application repository remains free of package files and build tooling. Actual results and unavailable platform coverage are recorded in `STATUS.md`.

### Acceptance cases

| Test | Required result |
| --- | --- |
| T01 — Homepage response | Root serves invitation markup directly; no game splash or forward redirect |
| T02 — Startup and refresh | Envelope is first; no invitation-before-envelope flash; repeated refresh works |
| T03 — Skip and motion preference | `?entry=0` and reduced motion show the card without a stuck overlay |
| T04 — Late/failed entry script | Existing fail-open and no-late-envelope safeguards remain valid |
| T05 — Opening interaction | Seal click, Enter, Space, repeat taps, final focus and timing behave as before |
| T06 — Soundtrack | Seal-start playback, loop, mute persistence, skip-page button, and navigation pause work |
| T07 — Single theme | Fresh storage, old Lotus storage, `?theme=lotus`, and blocked storage all render Sakura |
| T08 — Theme UI/resources | No theme chip; no requests for retired theme scripts; no active Lotus renderer |
| T09 — Blossom parity | Canopy, petal paths, cycling, layering, and reduced-motion static rendering match baseline |
| T10 — Logo integrity | Both logo file hashes exactly match IF0; placements and visible artwork unchanged |
| T11 — Game direct entry | `/game.html` displays and launches the game with its existing scripts and music |
| T12 — Invite/game round trip | Play the game → game; initial and generated skip/return controls → homepage |
| T13 — RSVP navigation | Homepage → RSVP → homepage; leaderboard game link → `game.html` |
| T14 — Game CTA routes | `goinvite` → homepage; `gorsvp` → RSVP |
| T15 — Guest data | Existing fixture progress, scores, name, RSVP, and mute preference survive navigation; no reset/migration |
| T16 — Legacy links | `invite.html` and production `/invite` resolve to homepage; query/hash preserved; no Back-loop |
| T17 — Dialogs | Good to know and leaderboard retain opening, dismissal, focus, and Maps behavior |
| T18 — Transition classification | Root is paper; game route is game; native/manual transitions and reduced motion work |
| T19 — Browser history/link semantics | Back/Forward, bfcache, new tabs, modifier clicks, external Maps, and fragments remain correct |
| T20 — 404 recovery | Nested production 404 loads its assets and its recovery link reaches the site homepage |
| T21 — Responsive parity | No new clipping/overflow; music chip fits at top-right; RSVP form width/touch targets preserved |
| T22 — Dependency/cache audit | No live references to retired theme scripts; no game links/prefetches mistakenly target homepage; changed asset versions verified |

Target: **22/22 acceptance cases**, with platform-specific subcases explicitly logged. Do not count an untested real-device case as passed.

### Viewports and environments

- Viewports: 320×568, 375×667, 375×812, 390×844, 430×932, 1280×800; include landscape and the RSVP +1/keyboard-expanded state.
- Engines: automated Chromium and WebKit; Firefox if available in the implementation environment.
- Physical/in-app check: iPhone Safari and WhatsApp's browser on iOS/Android when those devices are available. Emulated WebKit is not a substitute for claiming real-device coverage.
- Check normal network, delayed script loading, blocked audio, and Back navigation with partially entered RSVP data.
- Isolate guest-data tests from production Firestore writes. Screenshots and media evidence stay in the temporary QA workspace as small JPEGs/video, not large chat attachments.
- Baseline any existing compact/landscape overflow before edits. Release must introduce no new overflow; an existing failure must be documented rather than silently attributed to this migration or marked passed.

## §12. Phase reporting and review gates

For each completed phase, provide:

1. Phase ID and change-ledger IDs delivered.
2. Exact files added, modified, or retired.
3. Before → after behavior for each major change.
4. Screenshots/recording paths where visual behavior changed.
5. Commands run, assertions/results, and any unavailable device coverage.
6. Codex findings, remediation, and actual recheck verdict when a review was run.
7. Remaining work and any deviation from this approved plan.

STATUS records progress; this document remains the durable implementation contract. No implementation phase is marked complete based only on intent or an unverified review suggestion.

## §13. Risks and rollback

| Failure mode | Mitigation |
| --- | --- |
| Root accidentally still looks/behaves like game | Change `data-page`, markup, metadata, links, and `veilFor()` together in IF3 |
| Broken shared links | Keep a lightweight `invite.html` compatibility page; verify extensionless Pages alias |
| Wrong GitHub account-root navigation | Use project-aware relative links for normal routes and an explicit project base for 404 |
| Sakura damaged by Lotus cleanup | Preserve shared renderer selectors; use before/after screenshots and asset hashes |
| Old users see Lotus or a Lotus-colored arrival | Remove all theme readers and `veil-lotus` startup paths |
| Audio or entry initialized twice | One canonical invitation document, one controller instance; legacy page redirects without booting the application |
| Guest state lost | Keep storage/Firebase contracts; never clear all local storage or rewrite guest records |
| Cached HTML and scripts disagree about routes | Bump changed asset references, keep the legacy invite alias, and verify normal production URLs after Pages deployment |
| Incomplete route migration published | Deploy only the coherent IF3–IF4 result after acceptance |

**Rollback:** record the implementation checkpoint and release commit(s). If rollback is requested, use a new revert commit for the coherent migration release and redeploy it. If multiple commits were released, review and revert the migration set in reverse order. Preserve subsequent unrelated work; do not force-reset or force-push history. No guest-data rollback is required because the migration changes no data schema or records.

## §14. Approval assumptions

1. “Main URL” means the existing project homepage `https://mayankjainmj.github.io/neha-weds-mayank/`.
2. The game destination will be `game.html`, following the site's existing static-page convention.
3. Returning from game/RSVP to the homepage uses the current every-visit envelope behavior; `?entry=0` remains an explicit bypass.
4. Move the music chip into the removed theme chip's corner (`right:10px`, same size/top offset).
5. Preserve old invitation links with the compatibility redirect.
6. Runtime implementation and release are separate from this documentation task; proceed only after the corresponding instruction.

## §15. Status ownership

Phase status and dated delivery evidence belong in [STATUS.md](./STATUS.md). Historical game plans in `PLAN.md` and historical changelog entries are retained. At the time this plan was written, the only new work is this document and pending IF phase tracking; no application code, asset, route, tag, or deployment has been changed by the planning task.
