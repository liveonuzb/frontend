# Nutrition Scan AI Result Drawer Fix Design

## Problem

After the recent scanner redesign, taking a photo or uploading an image from the nutrition action sheet can close the flow immediately instead of showing the AI result and portion editor.

The active runtime path still passes `onInlineCameraCapture` from `NutritionDrawers` into `ActionDrawer`, then into `CameraDrawer`. In `CameraDrawer.handleCapture`, that prop short-circuits the new AI result drawer flow:

1. User captures/uploads a photo.
2. `CameraDrawer` sees `onInlineCapture` and returns early.
3. `ActionDrawer` calls `onInlineCameraCapture`, closes stacked camera state, clears `activeNested`, and calls `onCloseAll`.
4. The scanner drawer closes before `CameraResultDrawer` can open.

The previous nested drawer fix improved the direct `CameraDrawer` path, but it did not remove this older parent-level inline capture path.

## Goals

- Photo capture and gallery upload from the nutrition scanner must always open the AI result bottom drawer.
- The drawer must stay open through `analyzing`, `ready`, `empty`, and `error` states.
- The portion editor inside `MealDraftCard` must remain usable inside the result drawer.
- The scanner should close only after explicit user action: save, retake/close, or parent close.
- Barcode result drawer behavior should remain unchanged.
- Existing inline scan review features should not be deleted unless they are clearly unused by this flow.

## Non-Goals

- No backend/API changes.
- No change to AI analysis payloads or meal save payloads.
- No broad redesign of the nutrition action sheet.
- No removal of pending inline scan review/history behavior outside this scanner path.

## Approaches Considered

### Approach A: Remove `onInlineCameraCapture` from the camera action path

`ActionDrawer` stops passing `onInlineCapture` to `CameraDrawer`. `CameraDrawer` becomes the owner of the AI image scan lifecycle and always opens `CameraResultDrawer`.

Pros:
- Smallest reliable fix.
- Matches the approved result drawer design.
- Keeps the scanner flow local and understandable.
- Avoids a parent-level close race.

Cons:
- Leaves older inline scan machinery in the codebase for now, even if less used.

### Approach B: Keep `onInlineCameraCapture`, but make it open the new drawer

The parent would receive the image and then coordinate the new result drawer state.

Pros:
- Could preserve the old architecture shape.

Cons:
- Splits scanner state between parent and child again.
- More race-prone.
- More code movement for no product benefit.

### Approach C: Revert to `InlineScanReviewDrawer`

Keep the old flow and abandon nested AI result drawer for photos.

Pros:
- Minimal code if the old behavior is preferred.

Cons:
- Contradicts the approved product direction.
- Barcode and AI result behavior stay inconsistent.
- Does not solve the requested nested drawer UX.

## Recommended Design

Use Approach A.

`CameraDrawer` should own photo scan state end to end:

- Capture/gallery click creates an AI scan request id.
- It sets `resultType="ai"`, `aiResultStatus="analyzing"`, and opens `CameraResultDrawer`.
- Upload and analysis update that same result drawer.
- Stale upload/analysis responses are ignored using the existing request id guard.
- Save closes the result drawer and parent scanner after meal logging succeeds.
- Retake/close only resets the result drawer state and returns to scanner.

`ActionDrawer` should no longer pass `onInlineCapture` into `CameraDrawer`. The `onInlineCameraCapture` prop can remain on `ActionDrawer` for compatibility until a later cleanup, but it should not be used by the scanner action path.

`CameraResultDrawer` can remain a nested Vaul drawer for the direct parent drawer path. If nested Vaul behavior is unstable in this stack, implementation may use the existing non-nested drawer composition plus a parent close guard, but the functional contract is the same: opening the AI result must not close the scanner.

## Data Flow

Photo scan:

1. `ActionDrawer` opens `CameraDrawer` with `activeNested === "camera"`.
2. `CameraDrawer.handleCapture(dataUrl)` starts the AI scan lifecycle.
3. `CameraResultDrawer` opens immediately in `analyzing` state.
4. `uploadMealCapture(dataUrl)` returns `imageUrl`.
5. `analyzeMealImageDraft({ imageUrl })` returns `items`.
6. Result drawer renders summary and `MealDraftCard` portion controls.
7. User edits portions/ingredients.
8. User taps save.
9. `addMealAction` logs the meal, then the scanner closes.

Barcode scan:

1. Barcode scan opens `CameraResultDrawer` with `resultType="barcode"`.
2. Lookup result renders found/manual state.
3. Add logs the meal and closes the scanner.

## Error Handling

- AI disabled/quota exhausted: visible capture/gallery controls show toast and do not start upload.
- Upload or analysis error: result drawer stays open in error state with retake action.
- Empty AI result: result drawer stays open with empty state and retake action.
- Stale async responses after close/retake are ignored.

## Testing

Add/update frontend tests:

- Rendering `ActionDrawer`, selecting camera, uploading a file opens `AI topgan ovqatlar`.
- That path must not call `onCloseAll` before save.
- Direct `CameraDrawer` gallery scan still opens result drawer.
- Closing AI result returns to scanner.
- Barcode result flow still opens drawer and returns to scanner on close.
- Build should pass.

## Acceptance Criteria

- From `/user/nutrition`, Smart Add -> camera -> capture/gallery does not immediately close.
- AI analyzing state appears.
- AI ready state shows detected meal and editable portion controls.
- Save closes after successful logging.
- Retake returns to scanner.
- Barcode result still works.
