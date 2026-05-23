# Nutrition Scan Result Drawer Design

## Context

The current nutrition camera flow lives primarily in `src/modules/user/containers/nutrition/camera-drawer.jsx`, with barcode capture handled by `src/components/barcode-scanner/index.jsx`. The drawer supports AI photo scan, barcode scan, gallery upload, text entry, recent meals, and AI access checks.

Current issues for this change:

- The header shows an AI access label such as `7 kun trial`, which should not be visible in this scanner.
- The camera preview is too tall on mobile and pushes useful actions down.
- AI and Barcode share the same scanner area, but barcode results currently appear inline below the scanner, making the drawer feel inconsistent and crowded.
- AI result review is rendered as a full replacement of the scanner view instead of a stacked result drawer.

## Goals

- Remove the visible `7 kun trial`/AI access status text from the scanner header.
- Make the scanner preview compact using the recommended `4 / 5` style so the primary controls remain visible.
- Keep AI and Barcode visually consistent inside the same scanner shell.
- Move both AI scan results and Barcode lookup/manual-entry results into separate nested bottom drawers.
- Preserve existing working behavior: camera capture, gallery upload, barcode lookup, manual barcode add, recent meal copy, AI draft review, save-to-my-meals, meal time handling, and daily tracking writes.
- Add focused tests for the revised drawer states and barcode functionality.

## Non-Goals

- No backend/API/schema changes.
- No redesign of the whole nutrition module.
- No change to AI credit policy or premium gating logic, except hiding the trial label in this scanner UI.
- No replacement of `html5-qrcode` unless an existing scanner bug requires a narrow wrapper fix.

## Recommended Approach

Use a targeted refactor: keep `CameraDrawer` as the owner of the scan flow, but split result rendering into a nested result drawer. This gives the product behavior the user asked for without rewriting the whole nutrition logging system.

Alternative approaches considered:

- Minimal patch: hide trial text and shrink preview only. This is fast but leaves barcode and AI result UX inconsistent.
- Full scanner rewrite: split the scanner into a new subsystem. This is heavier than needed and risks breaking existing nutrition flows.

The targeted refactor is the best fit because it fixes the visible UX problems while preserving the existing data and API contracts.

## UI Design

### Main Scanner Drawer

The main bottom drawer remains the entry point for AI and Barcode scanning.

- Header title remains `Ovqatni aniqlash` for AI and `Barcode skanerlash` for barcode.
- Description stays short and mode-aware.
- The `AiAccessStatusText` trial label is removed from the header.
- The scanner preview uses a compact fixed aspect ratio around `4 / 5`.
- The AI/Barcode segmented control stays inside the preview near the top.
- AI mode shows Gallery, Capture, and Type controls.
- Barcode mode uses the same preview height, scan frame, and action-row dimensions. Gallery and Type controls render disabled with clear opacity so the layout does not jump; the center action is reserved for barcode rescan/reset behavior when needed.

### Nested Result Drawer

Both scan modes open a nested bottom drawer above the main scanner drawer.

- AI photo capture opens the nested result drawer in an analyzing/loading state, then updates to AI draft review.
- Barcode scan opens the nested result drawer in a lookup/loading state, then updates to one of: found, not found/manual entry, or error/retry.
- Closing the nested result drawer returns the user to the scanner drawer without losing the scanner mode.
- Successful “add food” closes the whole scanner flow.
- “Retake” or “Rescan” closes the nested result drawer and resets the relevant scanner state.

## Component Design

Targeted component boundaries:

- `ScanCameraView`: remains responsible for camera/barcode preview, mode switch, capture, gallery, and text entry controls.
- `ScanResultDrawer`: new local helper in `camera-drawer.jsx` or a nearby file if size becomes unwieldy. It owns the nested bottom drawer shell and delegates content by result type.
- `AiScanResultContent`: can reuse existing `ResultView`, `NoFoodView`, `MealDraftCard`, and `MealDraftSummaryCard`.
- `BarcodeResultContent`: moves current `BarcodeLookupPanel` content into the nested drawer. It handles loading, found, not-found/manual, and error states.
- `BarcodeScanner`: keep the public API stable, but allow embedded usage to avoid forced tall minimum height and make scanner config consistent with the parent preview.

If `camera-drawer.jsx` becomes harder to reason about after the extraction, move result drawer helpers into `camera-result-drawer.jsx`. Keep exports local to the nutrition module.

## State Model

The main drawer keeps scanner state and opens a nested result drawer when work is in progress or result content exists.

Suggested state:

- `view`: keep for scanner-level views that still need full replacement, but avoid using `result` as the main drawer replacement for AI results.
- `resultDrawerOpen`: boolean for the nested drawer.
- `resultType`: `ai` or `barcode`.
- `aiResultStatus`: `idle`, `analyzing`, `ready`, `empty`, `error`.
- `barcodeStatus`: existing `scanning`, `loading`, `found`, `not-found`, `error`.
- Existing `scannedItems`, `capturedImage`, `capturedImageUrl`, `barcodeFood`, `barcodeAmount`, `barcodeManualFood`, and `scannedBarcode` remain the source data.

State transitions:

- AI capture/gallery: validate access, set captured image, open result drawer as `ai/analyzing`, upload/analyze, then update to `ready`, `empty`, or `error`.
- Barcode detected: set scanned code, open result drawer as `barcode/loading`, lookup code, then update to `found`, `not-found`, or `error`.
- Close nested drawer: keep scanner open and reset only transient result display state needed for a clean retry.
- Add food: call existing `addMealAction`, show existing success toast, close main drawer.

## Data Flow

No API changes.

- AI scan continues to use `uploadMealCapture` and `analyzeMealImageDraft`.
- Barcode lookup continues to use `lookupFoodByBarcode`.
- Add actions continue to use `addMealAction`.
- Save-to-my-meals continues to use `createSavedMeal`.
- Recent meals and meal time drawers keep their existing behavior.

## Error Handling

- Camera permission failures keep the existing toast behavior and visible camera fallback where available.
- AI access limit no longer shows a passive `7 kun trial` label. If access is blocked, show an actionable error through toast/result state without showing the trial marketing label.
- Barcode lookup 404 opens the nested manual-entry result drawer.
- Barcode lookup network/server errors open the nested drawer error state with retry/rescan.
- Empty AI scan result opens the nested drawer empty state with retake.

## Accessibility

- Segmented AI/Barcode controls should be real buttons with clear selected state.
- Scanner action buttons keep accessible labels.
- Nested result drawer title and close button should be clear for screen readers.
- Disabled controls must not be the only feedback for blocked AI access; blocked attempts should provide a toast or visible error state.
- The compact preview must not cause text/action overlap on narrow mobile widths.

## Testing Plan

Add or update frontend tests around `CameraDrawer`:

- The scanner header does not render `7 kun trial`.
- The scanner preview uses the compact aspect ratio class/style.
- Switching to Barcode preserves the same scanner shell and does not render inline result content below the scanner.
- Barcode scan opens the nested result drawer in loading state.
- Barcode found state renders product, amount controls, and add action in the nested drawer.
- Barcode not-found state renders manual food form in the nested drawer.
- Manual barcode add calls `addMealAction` with barcode source data and closes the scanner.
- AI capture opens a nested result drawer and renders AI draft results after analysis.
- Closing nested result drawer returns to scanner mode.

Verification commands:

- `cd frontend && npm test -- src/modules/user/containers/nutrition/camera-drawer.test.jsx --run`
- `cd frontend && npm run build`

## Implementation Notes

- Keep edits scoped to nutrition scanner files and tests.
- Preserve existing query hooks and backend contracts.
- Avoid visual-only changes outside the scanner drawer.
- Do not remove barcode manual add fallback; it is required for incomplete catalog data.
- Keep result drawer content scrollable so long AI draft/manual forms fit inside `max-w-md` mobile drawers.
