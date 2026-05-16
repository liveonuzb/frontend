#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const REQUIRED_CHECKS = [
  "permission-granted",
  "pre-start-stable-map",
  "start-begins-real-watch",
  "live-marker-no-flicker",
  "route-line-grows",
  "pause-resume-stable",
  "finish-detail-route-map",
  "light-dark-map-readable",
];

const getArgValue = (name) => {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
};

const hasArg = (name) => process.argv.includes(name);

const getLanAddresses = () => {
  const interfaces = os.networkInterfaces();

  return Object.values(interfaces)
    .flat()
    .filter(Boolean)
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const getDefaultOutputDir = () =>
  path.resolve("test-results", "workout-real-gps-qa", timestamp());

const buildSummaryTemplate = ({ lanUrl }) => ({
  status: "pending",
  tester: "",
  testedAt: "",
  device: {
    model: "",
    os: "",
    browser: "",
    network: "mobile-data-or-wifi",
  },
  environment: {
    frontendUrl: lanUrl,
    backendUrl: "",
    appMode: "madagascar",
    colorMode: "light-and-dark",
    buildCommit: "",
  },
  observations: {
    testDurationMinutes: null,
    routePointCount: null,
    markerFlickerCount: null,
    mapBlankingCount: null,
    gpsPermissionPrompts: null,
    gpsAccuracyMetersMin: null,
    gpsAccuracyMetersMax: null,
  },
  checks: REQUIRED_CHECKS.map((id) => ({
    id,
    pass: false,
    notes: "",
    evidence: [],
  })),
  blockers: [],
});

const buildChecklist = ({ lanUrl, outputDir }) => `# Running Real Device GPS QA

This artifact is for the last production gate in \`WORKOUT_PRODUCTION.md\`.
Do not mark the real-device GPS gate complete until this run passes on a physical phone.

## Setup

- Start frontend for LAN access:
  \`npm run dev -- --host 0.0.0.0 --port 3030\`
- Open this URL on the phone: \`${lanUrl}\`
- Use the normal backend/API environment for the release candidate.
- Grant browser GPS permission when prompted.
- Save screenshots or screen recording files in this folder:
  \`${outputDir}\`

## Required Route

1. Open \`/user/workout/running\`.
2. Start a new running session and navigate to \`/user/workout/running/live/:id\`.
3. Verify pre-start map is visible and the current-location marker does not blink.
4. Tap \`START\`, wait for countdown, then walk outdoors for at least 2 minutes.
5. Verify:
   - current location marker stays mounted and does not disappear/reappear;
   - map does not blank, remount, or jump on every GPS point;
   - route line grows from real GPS points;
   - metrics update without layout shift.
6. Tap \`RESUME\` to pause, then tap \`RESUME\` again to resume.
7. Tap \`END\`, then \`Finish\`.
8. Verify result page opens and route map uses the real recorded route.
9. Repeat a quick visual check in dark mode.

## Pass Criteria

- \`markerFlickerCount\` must be \`0\`.
- \`mapBlankingCount\` must be \`0\`.
- Every check in \`summary.json\` must have \`pass: true\`.
- Evidence must include at least one screenshot or video for live tracking and result detail.

## Verification

After filling \`summary.json\`, run:

\`\`\`sh
npm run qa:running:real-gps -- --verify "${path.join(outputDir, "summary.json")}"
\`\`\`
`;

const createQaArtifact = () => {
  const outputDir = path.resolve(getArgValue("--output") ?? getDefaultOutputDir());
  const port = getArgValue("--port") ?? "3030";
  const lanAddress = getArgValue("--host") ?? getLanAddresses()[0] ?? "127.0.0.1";
  const lanUrl = `http://${lanAddress}:${port}`;

  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, "summary.json"), buildSummaryTemplate({ lanUrl }));
  fs.writeFileSync(
    path.join(outputDir, "checklist.md"),
    buildChecklist({ lanUrl, outputDir }),
  );

  console.log(`Created real-device GPS QA artifact: ${outputDir}`);
  console.log(`Phone URL: ${lanUrl}`);
  console.log(`Checklist: ${path.join(outputDir, "checklist.md")}`);
  console.log(`Summary: ${path.join(outputDir, "summary.json")}`);
};

const verifyQaSummary = (summaryPath) => {
  if (!summaryPath) {
    throw new Error("Missing --verify <summary.json> path.");
  }

  const resolvedPath = path.resolve(summaryPath);
  const summary = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  const checks = Array.isArray(summary.checks) ? summary.checks : [];
  const checksById = new Map(checks.map((check) => [check.id, check]));
  const missingChecks = REQUIRED_CHECKS.filter((id) => !checksById.has(id));
  const failedChecks = REQUIRED_CHECKS.filter((id) => checksById.get(id)?.pass !== true);
  const evidenceCount = checks.reduce(
    (total, check) => total + (Array.isArray(check.evidence) ? check.evidence.length : 0),
    0,
  );
  const observations = summary.observations ?? {};
  const errors = [];

  if (summary.status !== "passed") {
    errors.push("summary.status must be 'passed'.");
  }

  if (missingChecks.length) {
    errors.push(`Missing checks: ${missingChecks.join(", ")}.`);
  }

  if (failedChecks.length) {
    errors.push(`Checks not passed: ${failedChecks.join(", ")}.`);
  }

  if (Number(observations.markerFlickerCount) !== 0) {
    errors.push("observations.markerFlickerCount must be 0.");
  }

  if (Number(observations.mapBlankingCount) !== 0) {
    errors.push("observations.mapBlankingCount must be 0.");
  }

  if (evidenceCount < 2) {
    errors.push("At least two evidence files are required.");
  }

  if (!summary.device?.model || !summary.device?.os || !summary.device?.browser) {
    errors.push("Device model, OS, and browser must be filled.");
  }

  if (errors.length) {
    console.error("Real-device GPS QA verification failed:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("Real-device GPS QA verification passed.");
};

if (hasArg("--help") || hasArg("-h")) {
  console.log(`Usage:
  node scripts/workout-real-gps-qa.mjs [--output <dir>] [--host <lan-ip>] [--port 3030]
  node scripts/workout-real-gps-qa.mjs --verify <summary.json>
`);
} else if (hasArg("--verify")) {
  verifyQaSummary(getArgValue("--verify"));
} else {
  createQaArtifact();
}
