#!/usr/bin/env node

const MIN_NODE_MAJOR = 22;

const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split('.')[0]);

if (!Number.isFinite(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) {
  console.error(
    `Node ${MIN_NODE_MAJOR}.x or newer is required. Current version: ${nodeVersion}.`,
  );
  process.exit(1);
}

console.log(`Environment check passed: Node ${nodeVersion} >= ${MIN_NODE_MAJOR}.0.0.`);
