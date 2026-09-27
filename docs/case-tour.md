# Interactive case tour

## Brief and source contract

An in-browser presentation, not a film export. Russian rationale on the left; actual app in an iPhone 15 Pro Max wrapper on the right. Initial choice: guided tour or independent exploration. Existing minimal typography and dark presentation preserved. No soundtrack, marketing header, external visual references or video export added.

Reference-led-motion supplied by the user informs the action score: show context, cue the actual control, click, wait for the real result, hold for reading. Its film-specific music, reference-shortlist and export gates do not apply to this explicitly interactive deliverable. No external reference approval is claimed.

## Product evidence / asset ledger

- `src/features/Home.tsx`: neutral blue, pig mascots, support entry in mobile header.
- `src/features/Support.tsx`: delivery/veterinary/general routing, context card, quick replies, human handoff, two-stage mobile rating.
- `src/features/DeliveryMap.tsx`: inline map and expanded dialog; demo data, not live logistics.
- `src/features/TreatmentPlan.tsx`, `Documents.tsx`: treatment status and document selection.
- `src/shared/FeedbackToast.tsx`: short thanks notice with manual dismissal.
- Phone PNG copied unchanged from the portfolio's local Dresser mirror; application runs in a real same-origin iframe. Demo state remains separate from normal saved conversations.

## Shot score

`src/case/tour.ts` is the editable shot plan. Each scene defines source state, prerequisite actions, attention target, real click, result target and reading duration (10–14 seconds). Camera settles before the 2.2-second action cue. Result targets are awaited. Sequential scenes continue the existing app state using only the remaining actions. Back/jumps reconstruct application state through an embed-only reset event and app buttons. The iframe DOM node and document stay mounted throughout; native document view transitions hold the previous pixels until the next scene is ready. Switching to independent mode retains the current app state.

Narrative: visual character → support entry → choose context → order card → delivery time → human handoff → veterinary context → treatment → documents → finish → stars → optional comment → low-score reasons → thanks in closed chat.

First scene: stationary, full-color, no focus mask. Subsequent scenes: pan and zoom up to 1.65× around the focused element; stage clips the enlarged phone intentionally. Uniform full-screen dimming, with the selected UI rendered above it and no outline. No continuous tilt/wobble. System html/body scrollbar hidden only in the embedded document; scrolling retained. Reduced-motion preference removes camera/text transitions.

## Interaction and recovery

Pause freezes tour progression; browser-hidden time is excluded. Native app response timers are allowed to finish. Failed prerequisites show a retry action. A full restart returns to the first scene. The ending offers independent exploration. Mode selection and exploration are keyboard accessible.

## Local verification

`npm run build`
Live browser QA must cover all scene prerequisites/results, real exploration route changes, pause/resume, back/next, takeover, beginning without mask, camera close-up, embedded scrollbar, viewport fit and reduced motion.

Verified locally: production build passed; both `tests/case-tour.spec.ts` browser tests passed (14 scene actions, pause, preserved takeover state, independent navigation and rating). Additional browser checks passed for automatic ending, reduced motion, and overflow at 1280×720, 768×1024 and 390×844. Inspected opening, enlarged header before click, support after click, map and comment frames. Header camera clamps horizontal movement to retain the device edges. No film export or soundtrack was produced.

Transition revision: keep phone fully opaque during preparation and mode selection. Fade the focus mask out for 380 ms before the action; let the camera settle for 1350 ms before fading the mask back in. Retain camera geometry while the target is temporarily absent. Sequential scenes do not start document view transitions. Reconstructed scenes hold the old snapshot until prepared, then replace it without opacity blending. Camera movement is vertical only, with uniform scaling; its previous transform is retained until the current scene target is measured. No iframe reload for chapter changes.

Chat focus uses the entire message row, including avatar and tail, without blur. Embedded iOS bottom clearance is 34 px plus 12 px spacing in the chat composer, documents and rating actions. The finish scene returns to a full-phone overview after opening rating; the following scene zooms into the stars. Corresponding mobile Figma chat frames also reserve 46 px beneath their actions.

Focus rendering uses one uniform full-screen scrim and an inert computed-style copy of the selected component above it. Transparent portions, avatar, vector tail and per-element radii remain exact; no rectangular cutout or sibling brightness filters. Camera bounds are latched only after three stable measurements per scene phase, preventing repeated transition retargeting. Zoom changes continuously with target height.

The guided tour no longer includes the inline or expanded delivery map. Delivery now demonstrates a time clarification followed by human handoff. Independent exploration starts delivery with the order context rather than a preloaded map.

Focus copies respect all ancestor scroll clipping. Embedded native scrollbars are hidden while scrolling remains available. The tour waits for completed operator messages, excludes typing placeholders and discards copies whose source disappears. Guided mode suppresses automatic focus outlines; independent mode retains keyboard focus styling. Enlarged phones crop at the browser viewport edge rather than the resting layout padding.
