# Running Real Device GPS QA

This artifact is for the last production gate in `WORKOUT_PRODUCTION.md`.
Do not mark the real-device GPS gate complete until this run passes on a physical phone.

## Setup

- Start frontend for LAN access:
  `npm run dev -- --host 0.0.0.0 --port 3030`
- Open this URL on the phone: `http://10.15.45.16:3030`
- Use the normal backend/API environment for the release candidate.
- Grant browser GPS permission when prompted.
- Save screenshots or screen recording files in this folder:
  `/Users/shoxruxshomurodov/Desktop/liveon/frontend/test-results/workout-real-gps-qa/latest`

## Required Route

1. Open `/user/workout/running`.
2. Start a new running session and navigate to `/user/workout/running/live/:id`.
3. Verify pre-start map is visible and the current-location marker does not blink.
4. Tap `START`, wait for countdown, then walk outdoors for at least 2 minutes.
5. Verify:
   - current location marker stays mounted and does not disappear/reappear;
   - map does not blank, remount, or jump on every GPS point;
   - route line grows from real GPS points;
   - metrics update without layout shift.
6. Tap `RESUME` to pause, then tap `RESUME` again to resume.
7. Tap `END`, then `Finish`.
8. Verify result page opens and route map uses the real recorded route.
9. Repeat a quick visual check in dark mode.

## Pass Criteria

- `markerFlickerCount` must be `0`.
- `mapBlankingCount` must be `0`.
- Every check in `summary.json` must have `pass: true`.
- Evidence must include at least one screenshot or video for live tracking and result detail.

## Verification

After filling `summary.json`, run:

```sh
npm run qa:running:real-gps -- --verify "/Users/shoxruxshomurodov/Desktop/liveon/frontend/test-results/workout-real-gps-qa/latest/summary.json"
```
