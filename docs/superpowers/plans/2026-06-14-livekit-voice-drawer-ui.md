# LiveKit Voice Drawer UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Nutrition voice capture and voice result review into two polished bottom drawers, using LiveKit Agents UI Aura plus LiveKit start-audio and microphone controls.

**Architecture:** Keep `AudioAddBottomSheet` as a session-only drawer and move all review/save behavior into a new `AudioResultDrawer`. `ActionDrawer` owns the transition: audio drawer receives `draft_result`, disconnects, closes, then opens result review. The LiveKit hook exposes the active `room` and controlled microphone state for Agents UI controls.

**Tech Stack:** Vite React 19, JavaScript/JSX, LiveKit client, LiveKit Agents UI shadcn registry components, Vaul drawer via `@/components/ui/drawer.jsx`, Vitest + Testing Library, lodash-first frontend style.

---

## Environment Notes

This Codex shell may not have global `node`, `npm`, or `npx` on `PATH`. Use the bundled Node binary already verified in this workspace:

```bash
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Run package binaries through that Node:

```bash
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
$CODEX_NODE node_modules/.bin/shadcn info --json
```

The project has a dirty worktree with many unrelated files. Stage and commit only files touched by each task.

## File Structure

- Modify: `src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js`
  - Expose `room`, `microphoneEnabled`, `microphonePending`, and `setMicrophoneEnabled`.
  - Validate incoming `draft_result` messages before setting review state.

- Create: `src/modules/user/containers/nutrition/audio-add/voice-result-utils.js`
  - Shared draft validation, initial editor state, mood normalization, labels, and callback payload helpers.

- Create: `src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js`
  - Focused tests for result validation and editor initialization.

- Modify: `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx`
  - Remove review/save/editor logic.
  - Render Aura, transcript, errors, retry/cancel, `StartAudioButton`, and `AgentTrackToggle`.
  - Call `onDraftReady(draft)` after a valid draft and disconnect the room.

- Modify: `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx`
  - Replace save-editor expectations with session-only expectations.
  - Mock LiveKit Agents UI control components.

- Create: `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx`
  - Universal review drawer with meal/water/workout/mood editors and existing tracking save actions.

- Create: `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx`
  - Save/edit/cancel coverage for all result kinds and save error state.

- Modify: `src/modules/user/containers/nutrition/action-drawer.jsx`
  - Store voice draft result and open `AudioResultDrawer`.
  - Replace audio `onSubmitted` wiring with `onDraftReady` and result `onSaved`.

- Modify: `src/modules/user/containers/nutrition/action-drawer.test.jsx`
  - Cover audio drawer to result drawer handoff.

- Add through shadcn registry:
  - `src/components/agents-ui/start-audio-button.jsx`
  - `src/components/agents-ui/agent-track-toggle.jsx`

LiveKit reference points used for this plan:

- Media controls overview: https://docs.livekit.io/frontends/agents-ui/media-controls/
- StartAudioButton: https://docs.livekit.io/reference/components/agents-ui/component/start-audio-button/
- AgentTrackToggle: https://docs.livekit.io/reference/components/agents-ui/component/agent-track-toggle/

---

### Task 1: Add LiveKit Agents UI Media Controls

**Files:**
- Create: `src/components/agents-ui/start-audio-button.jsx`
- Create: `src/components/agents-ui/agent-track-toggle.jsx`
- May modify: `package-lock.json` only if shadcn adds a required dependency

- [ ] **Step 1: Confirm shadcn project context**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/shadcn info --json
```

Expected: JSON reports `frameworkName` as `vite`, `typescript` as `false`, and registry `@agents-ui`.

- [ ] **Step 2: Add Agents UI source components**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/shadcn add @agents-ui/start-audio-button @agents-ui/agent-track-toggle
```

Expected: shadcn creates `src/components/agents-ui/start-audio-button.jsx` and `src/components/agents-ui/agent-track-toggle.jsx`.

- [ ] **Step 3: Verify generated files use project aliases**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
rg -n "@/components|@/lib|@/hooks|from 'react'|from \"react\"" src/components/agents-ui/start-audio-button.jsx src/components/agents-ui/agent-track-toggle.jsx
```

Expected: imports use `@/` aliases or package imports. If shadcn generates `.tsx`, rename to `.jsx` and remove TypeScript annotations before continuing.

- [ ] **Step 4: Run focused syntax check through Vite build target**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vite build --mode development
```

Expected: build completes. Existing maplibre/chunk warnings are acceptable; syntax/import failures in the new Agents UI files must be fixed before committing.

- [ ] **Step 5: Commit media controls**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/components/agents-ui/start-audio-button.jsx src/components/agents-ui/agent-track-toggle.jsx package-lock.json package.json
git diff --cached --name-only
git commit -m "feat: add LiveKit voice media controls"
```

Expected staged files are only the new Agents UI files and package metadata if metadata changed.

---

### Task 2: Add Voice Result Utilities

**Files:**
- Create: `src/modules/user/containers/nutrition/audio-add/voice-result-utils.js`
- Create: `src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js`

- [ ] **Step 1: Write failing utility tests**

Create `src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js`:

```js
import { describe, expect, it } from "vitest";
import {
  buildSubmittedVoiceResult,
  getDraftKindLabel,
  getInitialMealItems,
  getInitialVoiceReview,
  getTargetDate,
  getVoiceDraftTranscript,
  normalizeMood,
  normalizeVoiceDraftResult,
  toPositiveInteger,
} from "./voice-result-utils.js";

describe("voice-result-utils", () => {
  it("accepts supported draft kinds and rejects unsupported shapes", () => {
    expect(
      normalizeVoiceDraftResult({
        kind: "water",
        transcript: "suv ichdim",
        confidence: 0.9,
        payload: { amountMl: 500 },
      }),
    ).toEqual({
      kind: "water",
      transcript: "suv ichdim",
      confidence: 0.9,
      payload: { amountMl: 500 },
    });

    expect(normalizeVoiceDraftResult({ kind: "sleep", payload: {} })).toBeNull();
    expect(normalizeVoiceDraftResult(null)).toBeNull();
  });

  it("requires meal drafts to contain at least one item", () => {
    expect(
      normalizeVoiceDraftResult({
        kind: "meal",
        transcript: "nonushta",
        confidence: 0.8,
        payload: { items: [] },
      }),
    ).toBeNull();

    expect(
      normalizeVoiceDraftResult({
        kind: "meal",
        transcript: "tuxum",
        confidence: 0.8,
        payload: {
          items: [{ id: "meal-1", title: "Tuxum", nutrition: {} }],
        },
      }),
    ).toEqual({
      kind: "meal",
      transcript: "tuxum",
      confidence: 0.8,
      payload: {
        items: [{ id: "meal-1", title: "Tuxum", nutrition: {} }],
      },
    });
  });

  it("builds type-specific initial editor state", () => {
    expect(
      getInitialVoiceReview({
        kind: "water",
        payload: { amountMl: 1500, time: "08:30" },
      }),
    ).toEqual({ amountMl: 1500, unit: "ml", time: "08:30" });

    expect(
      getInitialVoiceReview({
        kind: "workout",
        payload: { activity: "Yugurish", minutes: 25, kcal: 220, time: "18:15" },
      }),
    ).toEqual({
      activity: "Yugurish",
      minutes: 25,
      kcal: 220,
      time: "18:15",
    });

    expect(
      getInitialVoiceReview({
        kind: "mood",
        transcript: "bugun yaxshi",
        payload: { mood: "yaxshi", note: "", time: "21:00" },
      }),
    ).toEqual({ mood: "good", note: "bugun yaxshi", time: "21:00" });
  });

  it("normalizes helpers used by the result drawer", () => {
    expect(toPositiveInteger("18.7", 0)).toBe(19);
    expect(toPositiveInteger("-5", 250)).toBe(250);
    expect(normalizeMood("zo'r")).toBe("amazing");
    expect(normalizeMood("unknown")).toBe("neutral");
    expect(getDraftKindLabel("workout")).toBe("Mashq");
    expect(getTargetDate("2026-06-14")).toBe("2026-06-14");
  });

  it("builds submitted payloads and transcript history text", () => {
    const mealDraft = {
      kind: "meal",
      transcript: "tovuq yedim",
      payload: { items: [{ id: "meal-1", title: "Tovuq" }] },
    };
    expect(
      buildSubmittedVoiceResult({
        draft: mealDraft,
        mealItems: [{ id: "meal-2", title: "Guruch" }],
        review: null,
      }),
    ).toEqual({
      kind: "meal",
      transcript: "tovuq yedim",
      payload: { items: [{ id: "meal-2", title: "Guruch" }] },
    });
    expect(getInitialMealItems(mealDraft)).toEqual([
      { id: "meal-1", title: "Tovuq" },
    ]);
    expect(getVoiceDraftTranscript(mealDraft)).toBe("tovuq yedim");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js
```

Expected: FAIL because `voice-result-utils.js` does not exist.

- [ ] **Step 3: Add utility implementation**

Create `src/modules/user/containers/nutrition/audio-add/voice-result-utils.js`:

```js
import {
  get,
  includes,
  isArray,
  isObject,
  map,
  split,
  toNumber,
  trim,
} from "lodash";

const supportedDraftKinds = ["meal", "water", "workout", "mood"];

export const moodOptions = [
  { value: "amazing", label: "Ajoyib" },
  { value: "good", label: "Yaxshi" },
  { value: "neutral", label: "O'rtacha" },
  { value: "tired", label: "Charchagan" },
  { value: "bad", label: "Yomon" },
];

export const todayKey = () => split(new Date().toISOString(), "T")[0];

export const getTargetDate = (dateKey) => dateKey || todayKey();

export const toPositiveInteger = (value, fallback = 0) => {
  const next = Math.round(toNumber(value));

  return Number.isFinite(next) && next > 0 ? next : fallback;
};

export const normalizeMood = (value) => {
  const normalized = trim(String(value || "")).toLowerCase();

  if (includes(["amazing", "super", "zor", "zo'r", "excellent"], normalized)) {
    return "amazing";
  }
  if (includes(["good", "yaxshi", "хорошо"], normalized)) return "good";
  if (includes(["tired", "charchagan", "устал"], normalized)) return "tired";
  if (includes(["bad", "yomon", "плохо"], normalized)) return "bad";
  return "neutral";
};

export const getDraftKindLabel = (kind) => {
  if (kind === "meal") return "Ovqat";
  if (kind === "water") return "Suv";
  if (kind === "workout") return "Mashq";
  if (kind === "mood") return "Kayfiyat";
  return "Natija";
};

export const normalizeVoiceDraftResult = (result) => {
  if (!result || !isObject(result)) {
    return null;
  }

  const kind = trim(String(get(result, "kind", "")));

  if (!includes(supportedDraftKinds, kind)) {
    return null;
  }

  const payload = isObject(get(result, "payload")) ? get(result, "payload") : {};
  const transcript = trim(String(get(result, "transcript", "")));
  const confidence = toNumber(get(result, "confidence", 0));

  if (kind === "meal") {
    const items = isArray(get(payload, "items")) ? get(payload, "items") : [];

    if (!items.length) {
      return null;
    }

    return {
      kind,
      transcript,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      payload: { ...payload, items },
    };
  }

  return {
    kind,
    transcript,
    confidence: Number.isFinite(confidence) ? confidence : 0,
    payload,
  };
};

export const getInitialVoiceReview = (draft) => {
  if (!draft) {
    return null;
  }

  if (draft.kind === "water") {
    return {
      amountMl: toPositiveInteger(get(draft, "payload.amountMl"), 0),
      unit: trim(String(get(draft, "payload.unit", "ml"))) || "ml",
      time: trim(String(get(draft, "payload.time", ""))),
    };
  }

  if (draft.kind === "workout") {
    return {
      activity: trim(String(get(draft, "payload.activity", "Mashq"))) || "Mashq",
      minutes: toPositiveInteger(get(draft, "payload.minutes"), 0),
      kcal: toPositiveInteger(get(draft, "payload.kcal"), 0),
      time: trim(String(get(draft, "payload.time", ""))),
    };
  }

  if (draft.kind === "mood") {
    return {
      mood: normalizeMood(get(draft, "payload.mood")),
      note:
        trim(String(get(draft, "payload.note", ""))) ||
        trim(String(get(draft, "transcript", ""))),
      time: trim(String(get(draft, "payload.time", ""))),
    };
  }

  return null;
};

export const getInitialMealItems = (draft) =>
  draft?.kind === "meal" && isArray(get(draft, "payload.items"))
    ? map(get(draft, "payload.items"), (item) => item)
    : [];

export const buildSubmittedVoiceResult = ({ draft, mealItems, review }) => ({
  ...draft,
  payload: draft?.kind === "meal" ? { items: mealItems } : review,
});

export const getVoiceDraftTranscript = (draft) =>
  trim(String(get(draft, "originalText", get(draft, "transcript", ""))));
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit utilities**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/containers/nutrition/audio-add/voice-result-utils.js src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js
git commit -m "test: add voice result utilities"
```

---

### Task 3: Extend LiveKit Voice Session Hook

**Files:**
- Modify: `src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js`
- Test through: `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx`

- [ ] **Step 1: Add failing session-control expectations to the audio drawer test**

In `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx`, extend the hoisted mocks with:

```js
  startAudioProps: [],
  trackToggleProps: [],
```

Add these mocks below the Aura mock:

```jsx
vi.mock("@/components/agents-ui/start-audio-button.jsx", () => ({
  StartAudioButton: (props) => {
    mocks.startAudioProps.push(props);

    return (
      <button type="button" data-testid="start-audio-button">
        {props.label}
      </button>
    );
  },
}));

vi.mock("@/components/agents-ui/agent-track-toggle.jsx", () => ({
  AgentTrackToggle: (props) => {
    mocks.trackToggleProps.push(props);

    return (
      <button
        type="button"
        aria-label="Mikrofon"
        data-pressed={props.pressed ? "true" : "false"}
        onClick={() => props.onPressedChange?.(!props.pressed)}
      >
        {props.pressed ? "Mic on" : "Mic off"}
      </button>
    );
  },
}));
```

Reset arrays in `beforeEach`:

```js
  mocks.startAudioProps.length = 0;
  mocks.trackToggleProps.length = 0;
```

Add this test:

```jsx
  it("renders LiveKit start audio and microphone controls bound to the active room", async () => {
    render(<AudioAddBottomSheet onClose={vi.fn()} />);

    expect(await screen.findByText("Ovozli agent")).toBeInTheDocument();
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    await waitFor(() => {
      expect(mocks.startAudioProps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            room: mocks.rooms[0],
            label: "Audio boshlash",
          }),
        ]),
      );
    });

    await waitFor(() => {
      expect(mocks.trackToggleProps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "microphone",
            pressed: true,
            pending: false,
          }),
        ]),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Mikrofon" }));

    await waitFor(() => {
      expect(
        mocks.rooms[0].localParticipant.setMicrophoneEnabled,
      ).toHaveBeenCalledWith(false);
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
```

Expected: FAIL because `AudioAddBottomSheet` does not render the Agents UI media controls yet.

- [ ] **Step 3: Update the hook contract**

Modify `src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js`:

```js
import React from "react";
import { Room, RoomEvent } from "livekit-client";
import { get, trim } from "lodash";
import { createLiveKitSession } from "./audioAnalysisApi.js";
import { normalizeVoiceDraftResult } from "./voice-result-utils.js";
```

Add state near existing `useState` calls:

```js
  const [room, setRoom] = React.useState(null);
  const [microphoneEnabled, setMicrophoneEnabledState] =
    React.useState(false);
  const [microphonePending, setMicrophonePending] = React.useState(false);
```

Replace the `draft_result` branch inside `handleMessage`:

```js
    if (message.type === "draft_result") {
      markAgentResponded();
      const normalizedDraft = normalizeVoiceDraftResult(message.result);

      if (!normalizedDraft) {
        setError("Audio natijani tushunib bo'lmadi. Qayta urinib ko'ring.");
        setAgentState("error");
        return;
      }

      setDraftResult(normalizedDraft);
      setAgentState("reviewing");
      return;
    }
```

Update `disconnect`:

```js
  const disconnect = React.useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    startingRef.current = false;

    if (room) {
      room.disconnect();
    }

    clearAgentReadyTimeout();
    setRoom(null);
    setConnected(false);
    setMicrophoneEnabledState(false);
    setMicrophonePending(false);
    setAgentAudioTrack(null);
  }, [clearAgentReadyTimeout]);
```

Add controlled microphone action before `start`:

```js
  const setMicrophoneEnabled = React.useCallback(async (enabled) => {
    const activeRoom = roomRef.current;

    if (!activeRoom?.localParticipant?.setMicrophoneEnabled) {
      return;
    }

    setMicrophonePending(true);

    try {
      await activeRoom.localParticipant.setMicrophoneEnabled(Boolean(enabled));
      setMicrophoneEnabledState(Boolean(enabled));
      if (enabled) {
        setAgentState((current) =>
          current === "connecting" || current === "error"
            ? "listening"
            : current,
        );
      }
    } catch (nextError) {
      setError(getUserSafeError(nextError));
      setAgentState("error");
    } finally {
      setMicrophonePending(false);
    }
  }, []);
```

Inside `start`, after `roomRef.current = room;`, add:

```js
    setRoom(room);
```

Inside the `try` block, replace direct microphone enable state handling with:

```js
      const session = await createLiveKitSession();
      await room.connect(session.liveKitUrl, session.token);
      await room.localParticipant?.setMicrophoneEnabled(true);
      setMicrophoneEnabledState(true);
      setConnected(true);
```

Inside the `catch` block, before `room.disconnect();`, add:

```js
      setRoom(null);
      setMicrophoneEnabledState(false);
      setMicrophonePending(false);
```

Return the new contract:

```js
    room,
    agentState,
    connected,
    microphoneEnabled,
    microphonePending,
    agentAudioTrack,
    transcript,
    draftResult,
    error,
    start,
    retry,
    disconnect,
    setMicrophoneEnabled,
```

- [ ] **Step 4: Run test to confirm the hook still fails only on UI**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
```

Expected: FAIL remains until the next task renders `StartAudioButton` and `AgentTrackToggle`; no import/runtime error should come from the hook.

Do not commit this task until Task 4 makes the focused audio drawer tests pass.

---

### Task 4: Convert Audio Drawer Into Session-Only UI

**Files:**
- Modify: `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx`
- Modify: `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx`

- [ ] **Step 1: Replace save-focused tests with session-only tests**

In `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx`, remove tests that click `Saqlash` inside the audio drawer. Add this draft handoff test:

```jsx
  it("disconnects and emits a valid draft result instead of rendering a save editor", async () => {
    const onDraftReady = vi.fn();

    render(
      <AudioAddBottomSheet
        dateKey="2026-05-24"
        onClose={vi.fn()}
        onDraftReady={onDraftReady}
      />,
    );
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    act(() => {
      mocks.rooms[0].emit(
        "dataReceived",
        encodeMessage({
          type: "draft_result",
          result: {
            kind: "water",
            transcript: "1.5 litr suv ichdim",
            confidence: 0.9,
            payload: { amountMl: 1500, unit: "ml", time: "08:30" },
          },
        }),
        null,
        null,
        "liveon.voice_agent",
      );
    });

    await waitFor(() => {
      expect(onDraftReady).toHaveBeenCalledWith({
        kind: "water",
        transcript: "1.5 litr suv ichdim",
        confidence: 0.9,
        payload: { amountMl: 1500, unit: "ml", time: "08:30" },
      });
    });
    expect(mocks.rooms[0].disconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /Saqlash/i })).not.toBeInTheDocument();
  });
```

Add this invalid draft test:

```jsx
  it("keeps the audio drawer open and shows an error for invalid draft results", async () => {
    const onDraftReady = vi.fn();

    render(<AudioAddBottomSheet onClose={vi.fn()} onDraftReady={onDraftReady} />);
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    act(() => {
      mocks.rooms[0].emit(
        "dataReceived",
        encodeMessage({
          type: "draft_result",
          result: { kind: "sleep", transcript: "uxladim", payload: {} },
        }),
        null,
        null,
        "liveon.voice_agent",
      );
    });

    expect(
      await screen.findByText("Audio natijani tushunib bo'lmadi. Qayta urinib ko'ring."),
    ).toBeInTheDocument();
    expect(onDraftReady).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run audio drawer tests to verify failures**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
```

Expected: FAIL because `AudioAddBottomSheet` still renders review/save UI and does not call `onDraftReady`.

- [ ] **Step 3: Replace `AudioAddBottomSheet.jsx` with session-only implementation**

Replace `src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx` with:

```jsx
import React from "react";
import {
  AlertCircleIcon,
  MicIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura.jsx";
import { AgentTrackToggle } from "@/components/agents-ui/agent-track-toggle.jsx";
import { StartAudioButton } from "@/components/agents-ui/start-audio-button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils";
import { NutritionDrawerContent } from "../nutrition-drawer-layout.jsx";
import { useLiveKitVoiceAgentSession } from "./useLiveKitVoiceAgentSession.js";

const stateLabels = {
  connecting: "Ulanmoqda",
  listening: "Tinglayapti",
  thinking: "O'ylayapti",
  speaking: "Gapiryapti",
  reviewing: "Tekshiruv",
  error: "Xatolik",
};

const auraStateByAgentState = {
  connecting: "connecting",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  reviewing: "thinking",
  error: "failed",
};

const AudioAddBottomSheet = ({
  open = true,
  agentReadyTimeoutMs,
  onOpenChange,
  onClose,
  onDraftReady,
}) => {
  const handledDraftRef = React.useRef(null);
  const {
    room,
    agentState,
    connected,
    microphoneEnabled,
    microphonePending,
    agentAudioTrack,
    transcript,
    draftResult,
    error,
    retry,
    disconnect,
    setMicrophoneEnabled,
  } = useLiveKitVoiceAgentSession({ autoStart: open, agentReadyTimeoutMs });

  React.useEffect(() => {
    if (!draftResult || handledDraftRef.current === draftResult) {
      return;
    }

    handledDraftRef.current = draftResult;
    disconnect();
    onDraftReady?.(draftResult);
  }, [disconnect, draftResult, onDraftReady]);

  React.useEffect(() => {
    if (open) {
      handledDraftRef.current = null;
    }
  }, [open]);

  const handleCancel = React.useCallback(() => {
    disconnect();
    onClose?.();
    onOpenChange?.(false);
  }, [disconnect, onClose, onOpenChange]);

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        onOpenChange?.(true);
        return;
      }

      handleCancel();
    },
    [handleCancel, onOpenChange],
  );

  const transcriptText = transcript.finalText || transcript.partialText;

  return (
    <Drawer
      open={open}
      onOpenChange={handleDrawerOpenChange}
      direction="bottom"
    >
      <NutritionDrawerContent size="lg">
        <DrawerHeader className="shrink-0 border-b border-border/40 px-4 py-3 text-left sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MicIcon />
              </div>
              <div className="min-w-0">
                <DrawerTitle className="truncate text-left text-lg font-bold">
                  Ovozli agent
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  LiveKit Agents UI Aura bilan ovozli nutrition agent sessiyasi.
                </DrawerDescription>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full",
                      agentState === "error" && "bg-destructive/10 text-destructive",
                      agentState === "reviewing" &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    {agentState === "error" ? <AlertCircleIcon /> : null}
                    {stateLabels[agentState] || stateLabels.connecting}
                  </Badge>
                  {connected ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      LiveKit
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={retry}
                aria-label="Qayta urinish"
              >
                <RotateCcwIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Yopish"
              >
                <XIcon />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="px-0 pb-0" data-vaul-no-drag>
          <main className="grid min-h-[58vh] grid-rows-[auto_auto_auto]">
            <section className="flex flex-col items-center justify-center gap-5 px-5 py-6 sm:px-8">
              <AgentAudioVisualizerAura
                size="lg"
                color="#1FD5F9"
                colorShift={0.1}
                state={
                  auraStateByAgentState[agentState] ||
                  auraStateByAgentState.connecting
                }
                audioTrack={agentAudioTrack}
                className="max-h-[18rem] w-full max-w-[18rem]"
              />

              <div className="flex flex-wrap items-center justify-center gap-3">
                <StartAudioButton
                  room={room}
                  label="Audio boshlash"
                  variant="outline"
                />
                <AgentTrackToggle
                  source="microphone"
                  variant="livekit"
                  size="lg"
                  pressed={microphoneEnabled}
                  pending={microphonePending}
                  disabled={!room || !connected || Boolean(error)}
                  aria-label="Mikrofon"
                  onPressedChange={setMicrophoneEnabled}
                />
              </div>
            </section>

            <section className="px-5 pb-5 sm:px-8">
              <div className="mx-auto w-full max-w-xl rounded-2xl border bg-muted/20 p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Transcript
                </div>
                <p className="mt-2 min-h-12 text-base font-medium leading-relaxed">
                  {transcriptText || "Gapirishni boshlang..."}
                </p>
                {error ? (
                  <p className="mt-3 text-sm font-medium text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="px-5 pb-6 sm:px-8">
              <div className="mx-auto w-full max-w-xl rounded-2xl border border-dashed p-5 text-sm font-medium text-muted-foreground">
                Meal, suv, mashq yoki kayfiyat haqida ayting. Natija alohida
                tekshiruv oynasida ochiladi.
              </div>
            </section>
          </main>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
            <XIcon />
            Bekor qilish
          </Button>
          <Button type="button" size="lg" variant="secondary" onClick={retry}>
            <RotateCcwIcon />
            Qayta urinish
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
};

export default AudioAddBottomSheet;
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit hook and session drawer**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx
git commit -m "feat: use LiveKit controls in voice drawer"
```

---

### Task 5: Add Separate Audio Result Drawer

**Files:**
- Create: `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx`
- Create: `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx`

- [ ] **Step 1: Write failing result drawer tests**

Create `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx`:

```jsx
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AudioResultDrawer from "./AudioResultDrawer.jsx";

const mocks = vi.hoisted(() => ({
  actions: {
    addWaterCup: vi.fn(),
    addMeal: vi.fn(),
    addWorkout: vi.fn(),
    setMood: vi.fn(),
  },
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/hooks/app/use-daily-tracking.js", () => ({
  useDailyTrackingActions: () => mocks.actions,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock("../meal-draft-review.jsx", () => ({
  MealDraftSummaryCard: ({ items }) => (
    <div data-testid="meal-summary">{items.length} meal drafts</div>
  ),
  MealDraftCard: ({ item }) => <div>{item.title}</div>,
}));

beforeEach(() => {
  mocks.actions.addWaterCup.mockReset().mockResolvedValue({});
  mocks.actions.addMeal.mockReset().mockResolvedValue({});
  mocks.actions.addWorkout.mockReset().mockResolvedValue({});
  mocks.actions.setMood.mockReset().mockResolvedValue({});
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("AudioResultDrawer", () => {
  it("edits and saves water drafts through existing tracking actions", async () => {
    const onSaved = vi.fn();

    render(
      <AudioResultDrawer
        open
        dateKey="2026-05-24"
        draft={{
          kind: "water",
          transcript: "suv ichdim",
          confidence: 0.9,
          payload: { amountMl: 1500, unit: "ml", time: "08:30" },
        }}
        onSaved={onSaved}
      />,
    );

    fireEvent.change(screen.getByLabelText("Suv miqdori"), {
      target: { value: "800" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.addWaterCup).toHaveBeenCalledWith("2026-05-24", 800);
    });
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "water",
        payload: expect.objectContaining({ amountMl: "800" }),
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Audio natija saqlandi.");
  });

  it("saves meal drafts with source audio and loggedAt", async () => {
    render(
      <AudioResultDrawer
        open
        dateKey="2026-05-24"
        mealType="lunch"
        loggedAt="2026-05-24T12:00:00.000Z"
        draft={{
          kind: "meal",
          transcript: "tovuq va guruch",
          confidence: 0.84,
          payload: {
            items: [
              {
                id: "meal-1",
                title: "Tovuq va guruch",
                grams: 320,
                nutrition: {
                  calories: 560,
                  protein: 38,
                  carbs: 58,
                  fat: 16,
                  fiber: 3,
                },
                ingredients: [],
              },
            ],
          },
        }}
      />,
    );

    expect(await screen.findByText("Tovuq va guruch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.addMeal).toHaveBeenCalledWith(
        "2026-05-24",
        "lunch",
        expect.objectContaining({
          name: "Tovuq va guruch",
          source: "audio",
          addedAt: "2026-05-24T12:00:00.000Z",
          cal: 560,
          protein: 38,
        }),
      );
    });
  });

  it("saves workout and mood drafts", async () => {
    const { rerender } = render(
      <AudioResultDrawer
        open
        dateKey="2026-05-24"
        draft={{
          kind: "workout",
          transcript: "20 daqiqa yugurdim",
          payload: { activity: "Yugurish", minutes: 20, kcal: 180 },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.addWorkout).toHaveBeenCalledWith(
        "2026-05-24",
        20,
        180,
      );
    });

    rerender(
      <AudioResultDrawer
        open
        dateKey="2026-05-24"
        draft={{
          kind: "mood",
          transcript: "kayfiyatim yaxshi",
          payload: { mood: "good", note: "kayfiyatim yaxshi" },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.setMood).toHaveBeenCalledWith("2026-05-24", "good");
    });
  });

  it("keeps the drawer open when save fails", async () => {
    mocks.actions.addWaterCup.mockRejectedValueOnce(new Error("Network down"));

    render(
      <AudioResultDrawer
        open
        dateKey="2026-05-24"
        draft={{
          kind: "water",
          transcript: "suv",
          payload: { amountMl: 250 },
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Network down");
    });
    expect(screen.getByText("Suv tekshiruvi")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx
```

Expected: FAIL because `AudioResultDrawer.jsx` does not exist.

- [ ] **Step 3: Create `AudioResultDrawer.jsx`**

Create `src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx`:

```jsx
import React from "react";
import {
  CheckIcon,
  DropletsIcon,
  DumbbellIcon,
  Loader2Icon,
  SmileIcon,
  UtensilsIcon,
  XIcon,
} from "lucide-react";
import { filter, map } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking.js";
import { cn } from "@/lib/utils";
import { NutritionDrawerContent } from "../nutrition-drawer-layout.jsx";
import {
  MealDraftCard,
  MealDraftSummaryCard,
} from "../meal-draft-review.jsx";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
} from "../meal-draft-review-utils.js";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "../meal-ingredients.js";
import {
  buildSubmittedVoiceResult,
  getDraftKindLabel,
  getInitialMealItems,
  getInitialVoiceReview,
  getTargetDate,
  moodOptions,
  normalizeMood,
  toPositiveInteger,
} from "./voice-result-utils.js";

const iconsByKind = {
  meal: UtensilsIcon,
  water: DropletsIcon,
  workout: DumbbellIcon,
  mood: SmileIcon,
};

const AudioResultDrawer = ({
  open = false,
  draft,
  dateKey,
  mealType = "breakfast",
  loggedAt,
  onOpenChange,
  onClose,
  onSaved,
}) => {
  const actions = useDailyTrackingActions();
  const [review, setReview] = React.useState(() => getInitialVoiceReview(draft));
  const [mealItems, setMealItems] = React.useState(() =>
    getInitialMealItems(draft),
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setReview(getInitialVoiceReview(draft));
    setMealItems(getInitialMealItems(draft));
  }, [draft]);

  const updateReview = React.useCallback((field, value) => {
    setReview((current) => ({ ...(current || {}), [field]: value }));
  }, []);

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen) => {
      onOpenChange?.(nextOpen);
      if (!nextOpen) {
        onClose?.();
      }
    },
    [onClose, onOpenChange],
  );

  const handleIngredientUpdate = React.useCallback(
    (draftId, ingredientId, patch) => {
      setMealItems((current) =>
        map(current, (item) =>
          item.id === draftId
            ? {
                ...item,
                ingredients: updateMealIngredient(
                  item.ingredients,
                  ingredientId,
                  patch,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleIngredientRemove = React.useCallback((draftId, ingredientId) => {
    setMealItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: removeMealIngredient(item.ingredients, ingredientId),
            }
          : item,
      ),
    );
  }, []);

  const handleIngredientAdd = React.useCallback((draftId, ingredient) => {
    setMealItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: addMealIngredient(item.ingredients, ingredient),
            }
          : item,
      ),
    );
  }, []);

  const handleRemoveMealItem = React.useCallback((draftId) => {
    setMealItems((current) => filter(current, (item) => item.id !== draftId));
  }, []);

  const saveDraft = React.useCallback(async () => {
    if (!draft || saving) {
      return;
    }

    const targetDate = getTargetDate(dateKey);
    setSaving(true);

    try {
      if (draft.kind === "meal") {
        if (!mealItems.length) {
          throw new Error("Ovqat topilmadi.");
        }

        for (const item of mealItems) {
          await actions.addMeal(targetDate, mealType || "breakfast", {
            ...buildMealPayloadFromDraft(item, {
              source: "audio",
              image: getDraftImageUrl(item),
              addedAt: loggedAt || undefined,
            }),
            addedFromPlan: false,
          });
        }
      }

      if (draft.kind === "water") {
        const amountMl = toPositiveInteger(review?.amountMl, 0);
        if (!amountMl) {
          throw new Error("Suv miqdorini kiriting.");
        }
        await actions.addWaterCup(targetDate, amountMl);
      }

      if (draft.kind === "workout") {
        const minutes = toPositiveInteger(review?.minutes, 0);
        const kcal = toPositiveInteger(review?.kcal, 0);
        if (!minutes && !kcal) {
          throw new Error("Mashq davomiyligi yoki kaloriyasini kiriting.");
        }
        await actions.addWorkout(targetDate, minutes, kcal);
      }

      if (draft.kind === "mood") {
        await actions.setMood(targetDate, normalizeMood(review?.mood));
      }

      const submittedResult = buildSubmittedVoiceResult({
        draft,
        mealItems,
        review,
      });

      toast.success("Audio natija saqlandi.");
      onSaved?.(submittedResult);
      onOpenChange?.(false);
      onClose?.();
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Audio natija saqlanmadi.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    actions,
    dateKey,
    draft,
    loggedAt,
    mealItems,
    mealType,
    onClose,
    onOpenChange,
    onSaved,
    review,
    saving,
  ]);

  const Icon = iconsByKind[draft?.kind] || CheckIcon;
  const title = draft ? `${getDraftKindLabel(draft.kind)} tekshiruvi` : "Natija";

  return (
    <Drawer open={open} onOpenChange={handleDrawerOpenChange} direction="bottom">
      <NutritionDrawerContent size="lg">
        <DrawerHeader className="shrink-0 border-b border-border/40 px-4 py-3 text-left sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon />
              </div>
              <div className="min-w-0">
                <DrawerTitle className="truncate text-left text-lg font-bold">
                  {title}
                </DrawerTitle>
                <DrawerDescription className="text-left">
                  Natijani tekshiring va keyin saqlang.
                </DrawerDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Yopish"
              disabled={saving}
            >
              <XIcon />
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody className="px-5 py-5 sm:px-8" data-vaul-no-drag>
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
            {draft ? (
              <ReviewEditor
                draft={draft}
                review={review}
                mealItems={mealItems}
                onReviewChange={updateReview}
                onIngredientUpdate={handleIngredientUpdate}
                onIngredientRemove={handleIngredientRemove}
                onIngredientAdd={handleIngredientAdd}
                onRemoveMealItem={handleRemoveMealItem}
              />
            ) : (
              <div className="rounded-2xl border border-dashed p-5 text-sm font-medium text-muted-foreground">
                Audio natija topilmadi.
              </div>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={saving}
          >
            <XIcon />
            Bekor qilish
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={saveDraft}
            disabled={!draft || saving}
          >
            {saving ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
            Saqlash
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
};

const ReviewEditor = ({
  draft,
  review,
  mealItems,
  onReviewChange,
  onIngredientUpdate,
  onIngredientRemove,
  onIngredientAdd,
  onRemoveMealItem,
}) => {
  if (draft.kind === "meal") {
    return (
      <div className="flex flex-col gap-3">
        <MealDraftSummaryCard items={mealItems} />
        {map(mealItems, (item) => (
          <MealDraftCard
            key={item.id}
            item={item}
            onIngredientUpdate={(ingredientId, patch) =>
              onIngredientUpdate(item.id, ingredientId, patch)
            }
            onIngredientRemove={(ingredientId) =>
              onIngredientRemove(item.id, ingredientId)
            }
            onIngredientAdd={(ingredient) => onIngredientAdd(item.id, ingredient)}
            onRemove={() => onRemoveMealItem(item.id)}
          />
        ))}
      </div>
    );
  }

  if (draft.kind === "water") {
    return (
      <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
        <Field label="Suv miqdori">
          <Input
            aria-label="Suv miqdori"
            type="number"
            inputMode="numeric"
            min="1"
            value={review?.amountMl ?? ""}
            onChange={(event) => onReviewChange("amountMl", event.target.value)}
          />
        </Field>
        <Field label="Birlik">
          <Input
            aria-label="Suv birligi"
            value={review?.unit ?? "ml"}
            onChange={(event) => onReviewChange("unit", event.target.value)}
          />
        </Field>
        <Field label="Vaqt">
          <Input
            aria-label="Suv vaqti"
            type="time"
            value={review?.time ?? ""}
            onChange={(event) => onReviewChange("time", event.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (draft.kind === "workout") {
    return (
      <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
        <Field label="Mashq">
          <Input
            aria-label="Mashq nomi"
            value={review?.activity ?? ""}
            onChange={(event) => onReviewChange("activity", event.target.value)}
          />
        </Field>
        <Field label="Daqiqa">
          <Input
            aria-label="Mashq daqiqasi"
            type="number"
            min="0"
            value={review?.minutes ?? ""}
            onChange={(event) => onReviewChange("minutes", event.target.value)}
          />
        </Field>
        <Field label="Kcal">
          <Input
            aria-label="Mashq kaloriyasi"
            type="number"
            min="0"
            value={review?.kcal ?? ""}
            onChange={(event) => onReviewChange("kcal", event.target.value)}
          />
        </Field>
        <Field label="Vaqt">
          <Input
            aria-label="Mashq vaqti"
            type="time"
            value={review?.time ?? ""}
            onChange={(event) => onReviewChange("time", event.target.value)}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
      <Field label="Kayfiyat">
        <Select
          value={review?.mood ?? "neutral"}
          onValueChange={(value) => onReviewChange("mood", value)}
        >
          <SelectTrigger aria-label="Kayfiyat" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {map(moodOptions, (option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Vaqt">
        <Input
          aria-label="Kayfiyat vaqti"
          type="time"
          value={review?.time ?? ""}
          onChange={(event) => onReviewChange("time", event.target.value)}
        />
      </Field>
      <Field label="Izoh" className="sm:col-span-2">
        <Textarea
          aria-label="Kayfiyat izohi"
          value={review?.note ?? ""}
          onChange={(event) => onReviewChange("note", event.target.value)}
        />
      </Field>
    </div>
  );
};

const Field = ({ label, children, className }) => (
  <label className={cn("flex flex-col gap-1.5 text-sm font-semibold", className)}>
    <span>{label}</span>
    {children}
  </label>
);

export default AudioResultDrawer;
```

- [ ] **Step 4: Run result drawer tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit result drawer**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx
git commit -m "feat: add voice result drawer"
```

---

### Task 6: Wire Audio Capture to Separate Result Drawer

**Files:**
- Modify: `src/modules/user/containers/nutrition/action-drawer.jsx`
- Modify: `src/modules/user/containers/nutrition/action-drawer.test.jsx`

- [ ] **Step 1: Update ActionDrawer mocks and add failing handoff test**

In `src/modules/user/containers/nutrition/action-drawer.test.jsx`, add `resultProps` to hoisted mocks:

```js
  resultProps: null,
```

Add a mock for the new drawer:

```jsx
vi.mock("./audio-add/AudioResultDrawer.jsx", () => ({
  default: (props) => {
    mocks.resultProps = props;
    if (!props.open) return null;

    return (
      <button
        type="button"
        onClick={() => props.onSaved?.(props.draft)}
      >
        Mock audio result save
      </button>
    );
  },
}));
```

Update the audio mock to call `onDraftReady`:

```jsx
vi.mock("./audio-add-drawer.jsx", () => ({
  default: (props) => {
    mocks.audioProps = props;

    return props.open ? (
      <button
        type="button"
        onClick={() =>
          props.onDraftReady?.({
            kind: "water",
            transcript: "500 ml suv",
            payload: { amountMl: 500 },
          })
        }
      >
        Mock audio draft ready
      </button>
    ) : null;
  },
}));
```

Reset result props in `beforeEach`:

```js
  mocks.resultProps = null;
```

Replace the old audio submit history test with:

```jsx
  it("opens separate audio result drawer after voice draft and saves history after result save", async () => {
    const onCloseAll = vi.fn();

    render(
      <ActionDrawer
        open
        onOpenChange={vi.fn()}
        dateKey="2026-05-24"
        mealType="dinner"
        onOpenSavedMeals={vi.fn()}
        onCloseAll={onCloseAll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Audio" }));

    expect(mocks.saveHistoryItem).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Mock audio draft ready" }),
    );

    await waitFor(() => {
      expect(mocks.resultProps).toEqual(
        expect.objectContaining({
          open: true,
          dateKey: "2026-05-24",
          mealType: "dinner",
          draft: expect.objectContaining({
            kind: "water",
            transcript: "500 ml suv",
          }),
        }),
      );
    });

    expect(mocks.saveHistoryItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Mock audio result save" }));

    await waitFor(() => {
      expect(mocks.saveHistoryItem).toHaveBeenCalledWith(
        expect.objectContaining({
          transcript: "500 ml suv",
          mealType: "dinner",
        }),
      );
    });
    expect(onCloseAll).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run ActionDrawer test to verify failure**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/action-drawer.test.jsx
```

Expected: FAIL because `ActionDrawer` does not import or open `AudioResultDrawer`.

- [ ] **Step 3: Wire result state in `action-drawer.jsx`**

Add imports:

```js
import AudioResultDrawer from "./audio-add/AudioResultDrawer.jsx";
import { getVoiceDraftTranscript } from "./audio-add/voice-result-utils.js";
```

Add state next to the other nested state:

```js
  const [voiceDraftResult, setVoiceDraftResult] = useState(null);
```

Inside the `if (!open)` branch in the drawer reset `useLayoutEffect`, add:

```js
      setVoiceDraftResult(null);
```

Add callbacks near `handleOpenAudio`:

```js
  const handleVoiceDraftReady = useCallback(
    (draft) => {
      setVoiceDraftResult(draft);
      setActiveNested("audio-result");
    },
    [setActiveNested, setVoiceDraftResult],
  );

  const closeVoiceResult = useCallback(() => {
    setVoiceDraftResult(null);
    setActiveNested(null);
  }, [setActiveNested, setVoiceDraftResult]);

  const handleVoiceResultSaved = useCallback(
    (result) => {
      const transcript = getVoiceDraftTranscript(result);

      if (transcript) {
        void pushAudioTranscriptHistory(
          transcript,
          activeMealType,
          selectedLoggedAt,
        );
      }

      closeVoiceResult();
      onCloseAll?.();
    },
    [
      activeMealType,
      closeVoiceResult,
      onCloseAll,
      pushAudioTranscriptHistory,
      selectedLoggedAt,
    ],
  );
```

Replace the `AudioAddDrawer` block with:

```jsx
      <AudioAddDrawer
        open={activeNested === "audio"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        dateKey={selectedDateKey}
        mealType={activeMealType}
        loggedAt={selectedLoggedAt}
        onClose={() => setActiveNested(null)}
        onDraftReady={handleVoiceDraftReady}
      />
      <AudioResultDrawer
        open={activeNested === "audio-result"}
        draft={voiceDraftResult}
        dateKey={selectedDateKey}
        mealType={activeMealType}
        loggedAt={selectedLoggedAt}
        onOpenChange={(value) => !value && closeVoiceResult()}
        onClose={closeVoiceResult}
        onSaved={handleVoiceResultSaved}
      />
```

- [ ] **Step 4: Run ActionDrawer tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest src/modules/user/containers/nutrition/action-drawer.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit wiring**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git add src/modules/user/containers/nutrition/action-drawer.jsx src/modules/user/containers/nutrition/action-drawer.test.jsx
git commit -m "feat: route voice drafts to result drawer"
```

---

### Task 7: Focused Regression, Build, and Visual QA

**Files:**
- Verify only; modify touched files if tests reveal implementation defects.

- [ ] **Step 1: Run focused voice and nutrition tests**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vitest \
  src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js \
  src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx \
  src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx \
  src/modules/user/containers/nutrition/action-drawer.test.jsx \
  src/modules/user/containers/nutrition/meal-draft-review.test.js \
  src/hooks/app/use-daily-tracking.test.jsx
```

Expected: PASS.

- [ ] **Step 2: Run React Doctor on staged or touched files**

Run before each final commit if files are staged:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/react-doctor --staged --fail-on warning
```

Expected: no findings for staged files. If it flags unrelated already-staged files, unstage unrelated files and rerun.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vite build
```

Expected: PASS. Existing large chunk warnings are acceptable; import/type/runtime build errors are not.

- [ ] **Step 4: Run lodash scanner on touched frontend files**

Run:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE /Users/shoxruxshomurodov/.codex/skills/lodash-everywhere/scripts/find-native-patterns.js \
  src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js \
  src/modules/user/containers/nutrition/audio-add/voice-result-utils.js \
  src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx \
  src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx \
  src/modules/user/containers/nutrition/action-drawer.jsx
```

Expected: any findings are reviewed. Keep native APIs only for React hooks, DOM events, `Date`, `Number.isFinite`, and third-party component contracts.

- [ ] **Step 5: Manual UI QA in browser**

Start or reuse the Vite dev server:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
export CODEX_NODE=/Users/shoxruxshomurodov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$CODEX_NODE node_modules/.bin/vite --host 127.0.0.1 --port 3030
```

Open `http://127.0.0.1:3030/user/dashboard` in the in-app Browser. Verify:

- Audio action opens one bottom drawer.
- Aura is visible and centered.
- `Audio boshlash` and microphone control are visible and reachable.
- Session drawer no longer contains review form or save button.
- When a mocked or real `draft_result` arrives, session drawer closes and result drawer opens.
- Result drawer fields do not overlap on mobile or desktop.
- Saving closes result drawer and updates existing tracking paths.
- Cancel disconnects and closes without saving.

- [ ] **Step 6: Final commit if verification required fixes**

If Task 7 required code changes, commit only those files:

```bash
cd /Users/shoxruxshomurodov/Desktop/Liveon/frontend
git status --short
git add \
  src/components/agents-ui/start-audio-button.jsx \
  src/components/agents-ui/agent-track-toggle.jsx \
  src/modules/user/containers/nutrition/audio-add/useLiveKitVoiceAgentSession.js \
  src/modules/user/containers/nutrition/audio-add/voice-result-utils.js \
  src/modules/user/containers/nutrition/audio-add/voice-result-utils.test.js \
  src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.jsx \
  src/modules/user/containers/nutrition/audio-add/AudioAddBottomSheet.test.jsx \
  src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.jsx \
  src/modules/user/containers/nutrition/audio-add/AudioResultDrawer.test.jsx \
  src/modules/user/containers/nutrition/action-drawer.jsx \
  src/modules/user/containers/nutrition/action-drawer.test.jsx \
  package.json \
  package-lock.json
git commit -m "fix: polish voice drawer regression coverage"
```

Expected: no unrelated dirty worktree files are staged.
