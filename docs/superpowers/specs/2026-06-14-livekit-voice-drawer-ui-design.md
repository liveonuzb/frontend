# LiveKit Voice Drawer UI Design

Date: 2026-06-14
Scope: Frontend Nutrition voice entry flow

## Summary

Improve the Nutrition voice add experience by keeping voice capture and result review in separate bottom drawers. The voice drawer is focused on listening, transcript feedback, LiveKit Agents UI Aura, and LiveKit media controls. When the agent sends a draft result, the voice drawer closes and a separate result drawer opens with a full editor for the detected entry type.

The implementation stays web-first and uses the existing LiveKit session endpoint, LiveKit worker contract, and existing daily tracking save actions. Voice capture never auto-saves data.

## Selected Direction

Use the minimal restructure approach:

- Keep `AudioAddBottomSheet` as the session drawer instead of replacing the whole Nutrition drawer stack.
- Move all draft review and save UI out of the session drawer.
- Add one universal `AudioResultDrawer` with kind-specific editor content.
- Let `ActionDrawer` own the transition from audio capture to result review.

This keeps the change focused on the current UX problem while avoiding another backend or worker redesign.

## Architecture

`AudioAddBottomSheet` becomes a voice-session-only component. It is responsible for LiveKit room connection, Aura visualizer state, transcript display, guided prompts, retry, cancel, and LiveKit media controls. It does not render meal, water, workout, or mood editors and does not save tracking entries.

`ActionDrawer` remains the parent flow coordinator. It opens the audio drawer from the existing Nutrition add action. When the LiveKit worker emits a valid `draft_result`, `ActionDrawer` stores that draft, disconnects/closes the audio drawer, and opens the result drawer.

`AudioResultDrawer` is a new universal bottom drawer. It receives the `draft_result` and renders a full editor based on `draft.kind`. The save path uses the existing daily tracking actions already used by Nutrition and dashboard flows.

`useLiveKitVoiceAgentSession` is extended only where needed for the UI contract. It should expose the LiveKit `room` object so Agents UI controls like `StartAudioButton` can bind to the active session, while preserving the existing data-message state handling.

## Components

### `AudioAddBottomSheet`

Purpose: capture voice input and show real-time session state.

Responsibilities:

- Request the LiveKit session token through the existing protected backend endpoint.
- Connect to the LiveKit room.
- Render official Agents UI Aura as the primary visualizer.
- Render LiveKit media controls:
  - `StartAudioButton` for browser audio playback restrictions.
  - `AgentTrackToggle` or `AgentTrackControl` for microphone on/off.
  - `AgentDisconnectButton` or an equivalent LiveKit-backed disconnect action.
- Display transcript, state badge, helper prompts, retry, and cancel.
- Emit `onDraftReady(draft)` only after receiving a valid `draft_result`.

Non-responsibilities:

- No tracking save calls.
- No meal/water/workout/mood editor forms.
- No result confirmation UI.

### `AudioResultDrawer`

Purpose: review and edit the recognized entry before saving.

Responsibilities:

- Open after audio drawer closes.
- Render a shared header and footer.
- Render type-specific body fields:
  - meal: reuse the existing meal draft shape and review utilities.
  - water: amount, unit, and time.
  - workout: activity, minutes, kcal, and time.
  - mood: mood, note, and time.
- Save through existing tracking actions.
- Keep edits visible if save fails.

### `ActionDrawer`

Purpose: coordinate nested Nutrition add flows.

Responsibilities:

- Open `AudioAddBottomSheet` from the current audio add action.
- Store the latest voice draft result.
- Close/disconnect audio capture before opening review.
- Open `AudioResultDrawer` with the stored draft.
- Clear draft state after save or cancel.

## Data Flow

1. User taps the Nutrition audio add action.
2. `ActionDrawer` opens the audio drawer.
3. `AudioAddBottomSheet` calls `POST /api/v1/user/ai/audio/livekit-session`.
4. The hook connects to the returned LiveKit room.
5. If playback is blocked, `StartAudioButton` prompts the user to start audio.
6. The microphone is controlled by LiveKit Agents UI media controls.
7. The worker sends LiveKit data messages:
   - `agent_state`
   - `transcript`
   - `draft_result`
   - `error`
8. On a valid `draft_result`, the audio drawer disconnects and closes.
9. `ActionDrawer` opens `AudioResultDrawer`.
10. User edits the result and saves through existing tracking actions.

No automatic save happens during or immediately after voice capture.

## Error Handling

LiveKit session/token errors stay in the audio drawer. Controls are disabled, a user-safe error is shown, and retry remains available.

Microphone permission errors keep the audio drawer open. The UI explains that microphone access is required and lets the user retry through the LiveKit controls.

Worker timeout or unavailable agent errors put the audio drawer into an error state. No result drawer opens unless a valid draft result is received.

Invalid `draft_result` payloads are rejected in the audio drawer with a user-safe error. The result drawer only opens for recognized `meal`, `water`, `workout`, or `mood` drafts with usable payload data.

Save failures stay in `AudioResultDrawer`. The drawer remains open, editor values are preserved, and the user can retry.

## UX Rules

- The voice drawer is for listening and feedback only.
- The result drawer is for editing and saving only.
- Aura remains the main visual focus of the voice drawer.
- LiveKit-provided media controls should be used for start audio, microphone toggle/control, and disconnect where practical.
- Drawer content must be comfortable on mobile and desktop, with stable footer actions and no overlapping text.
- A recognized result should feel like a clean handoff, not like more content appended inside the same capture drawer.

## Testing

Frontend unit tests should cover:

- Opening the audio drawer from the Nutrition add action.
- Rendering LiveKit `StartAudioButton` with the active room.
- Rendering the LiveKit microphone control.
- Handling `agent_state`, `transcript`, `draft_result`, and `error` messages.
- Closing audio and opening `AudioResultDrawer` after a valid draft.
- Rendering and editing meal, water, workout, and mood result forms.
- Saving through existing tracking actions.
- Cancel and disconnect behavior.
- Session/token, microphone, worker timeout, invalid draft, and save error states.

Regression tests should confirm existing Nutrition draft review and daily tracking save paths still work.

Manual visual QA should check:

- Desktop and mobile drawer framing.
- Aura visible and centered.
- LiveKit controls reachable and correctly spaced.
- Audio drawer and result drawer never visually stack or compete.
- Footer actions remain stable and readable.

## References

- LiveKit Agents: https://docs.livekit.io/agents/
- LiveKit Agents UI: https://docs.livekit.io/frontends/agents-ui/
- LiveKit Agents UI media controls: https://docs.livekit.io/frontends/agents-ui/media-controls/
- StartAudioButton: https://docs.livekit.io/reference/components/agents-ui/component/start-audio-button/
