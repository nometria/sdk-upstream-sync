#!/usr/bin/env node
/**
 * sdk-upstream-sync — contract-aware fork maintenance tool.
 *
 * Config via env vars (or action inputs when running as a GitHub Action):
 *   UPSTREAM_REPO      GitHub repo to track, e.g. "org/javascript-sdk"
 *   UPSTREAM_BRANCH    Branch to track (default: main)
 *   LOCAL_PATH         Path to local fork directory (default: cwd)
 *   MAX_FILES          Auto-apply threshold: max files changed (default: 20)
 *   MAX_LOC            Auto-apply threshold: max LOC changed (default: 600)
 *   GITHUB_TOKEN       GitHub token for private repos or higher rate limits
 *   SYNC_DIR           Where to write reports (default: ./sync)
 */

import { extractUpstreamContract } from './extract-upstream-contract.mjs';
import { extractLocalContract } from './extract-local-contract.mjs';
import { diffContracts } from './diff-contracts.mjs';
import { applySelectiveUpdates } from './apply-selective-updates.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Help flag ────────────────────────────────────────────────────────────────
const _args = process.argv.slice(2);
if (_args.includes('--help') || _args.includes('-h')) {
  console.log(`sdk-sync — contract-aware fork maintenance tool

Usage:
  npx sdk-sync

Auto-applies safe upstream changes. Flags breaking ones.

Environment variables:
  UPSTREAM_REPO      GitHub repo to track, e.g. "org/sdk" (required)
  UPSTREAM_BRANCH    Branch to track (default: main)
  LOCAL_PATH         Path to local fork directory (default: cwd)
  MAX_FILES          Auto-apply threshold: max files changed (default: 20)
  MAX_LOC            Auto-apply threshold: max LOC changed (default: 600)
  GITHUB_TOKEN       GitHub token for private repos / rate limits
  SYNC_DIR           Where to write reports (default: ./sync)

Examples:
  UPSTREAM_REPO=org/sdk npx sdk-sync
  UPSTREAM_REPO=org/sdk UPSTREAM_BRANCH=v2 npx sdk-sync`);
  process.exit(0);
}

// ── Config (all overridable via env) ─────────────────────────────────────────
const UPSTREAM_REPO   = process.env.UPSTREAM_REPO   || (() => { throw new Error('UPSTREAM_REPO is required. Set env var or pass --upstream-repo'); })();
const UPSTREAM_BRANCH = process.env.UPSTREAM_BRANCH || 'main';
const LOCAL_PATH      = process.env.LOCAL_PATH      || process.cwd();
const MAX_FILES       = parseInt(process.env.MAX_FILES  || '20', 10);
const MAX_LOC         = parseInt(process.env.MAX_LOC    || '600', 10);
const GITHUB_TOKEN    = process.env.GITHUB_TOKEN    || null;

const SYNC_DIR     = join(process.env.SYNC_DIR || process.cwd(), 'sync');
const UPSTREAM_JSON = join(SYNC_DIR, 'upstream.json');

async function main() {
  console.log('🔄 Starting upstream sync...');

  // Ensure sync directory exists
  if (!existsSync(SYNC_DIR)) {
    mkdirSync(SYNC_DIR, { recursive: true });
  }

  // Read last synced SHA
  let lastSyncedSha = null;
  if (existsSync(UPSTREAM_JSON)) {
    try {
      const data = JSON.parse(readFileSync(UPSTREAM_JSON, 'utf-8'));
      lastSyncedSha = data.sha;
    } catch {
      // Ignore parse errors
    }
  }

  // Fetch latest upstream SHA
  console.log('📥 Fetching upstream repository...');
  const latestSha = await fetchLatestSha();
  
  if (latestSha === lastSyncedSha) {
    console.log('✅ Already up to date');
    return { synced: false, reason: 'already_up_to_date' };
  }

  console.log(`📊 Comparing: ${lastSyncedSha?.substring(0, 7) || 'initial'} → ${latestSha.substring(0, 7)}`);

  // Extract contracts
  console.log('🔍 Extracting contracts...');
  const upstreamContract = await extractUpstreamContract(UPSTREAM_REPO, latestSha);
  const localContract = await extractLocalContract();

  // Save contracts
  writeFileSync(
    join(SYNC_DIR, 'upstream.contract.json'),
    JSON.stringify(upstreamContract, null, 2)
  );
  writeFileSync(
    join(SYNC_DIR, 'local.contract.json'),
    JSON.stringify(localContract, null, 2)
  );

  // Diff contracts
  console.log('🔎 Computing diff...');
  const diff = diffContracts(upstreamContract, localContract);
  writeFileSync(
    join(SYNC_DIR, 'contract.diff.json'),
    JSON.stringify(diff, null, 2)
  );

  // Generate report
  const report = generateReport(diff, lastSyncedSha, latestSha);
  writeFileSync(join(SYNC_DIR, 'report.md'), report);

  // Check safety thresholds
  const thresholds = checkThresholds(diff);
  
  if (thresholds.safe) {
    console.log('✅ Changes are safe, applying updates...');
    await applySelectiveUpdates(diff);
    writeFileSync(UPSTREAM_JSON, JSON.stringify({ sha: latestSha, syncedAt: new Date().toISOString() }));
    return { synced: true, applied: true, sha: latestSha };
  } else {
    console.log('⚠️  Changes exceed safety thresholds, creating investigation PR only');
    return { synced: true, applied: false, sha: latestSha, thresholds };
  }
}

async function fetchLatestSha() {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  const response = await fetch(
    `https://api.github.com/repos/${UPSTREAM_REPO}/commits/${UPSTREAM_BRANCH}`,
    { headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch upstream ${UPSTREAM_REPO}@${UPSTREAM_BRANCH}: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.sha;
}

function checkThresholds(diff) {
  const fileCount  = diff.filesChanged?.length || 0;
  const locChanged = diff.locChanged || 0;
  const hasBreaking = diff.breakingChanges?.length > 0;
  const safe = fileCount <= MAX_FILES && locChanged <= MAX_LOC && !hasBreaking;

  return {
    safe,
    fileCount,
    locChanged,
    hasBreaking,
    thresholds: { maxFiles: MAX_FILES, maxLOC: MAX_LOC, allowBreaking: false },
  };
}

function generateReport(diff, lastSha, currentSha) {
  return `# Upstream Sync Report

**Date**: ${new Date().toISOString()}
**Upstream**: ${UPSTREAM_REPO}
**From**: ${lastSha?.substring(0, 7) || 'initial'}
**To**: ${currentSha.substring(0, 7)}

## Summary

- **Files Changed**: ${diff.filesChanged?.length || 0}
- **LOC Changed**: ${diff.locChanged || 0}
- **New Exports**: ${diff.newExports?.length || 0}
- **New Methods**: ${diff.newMethods?.length || 0}
- **Breaking Changes**: ${diff.breakingChanges?.length || 0}

## New Exports

${(diff.newExports || []).map(e => `- \`${e}\``).join('\n') || 'None'}

## New Methods

${(diff.newMethods || []).map(m => `- \`${m.module}.${m.method}\``).join('\n') || 'None'}

## Breaking Changes

${(diff.breakingChanges || []).map(b => `- ${b.description}`).join('\n') || 'None'}

## Files Changed

${(diff.filesChanged || []).slice(0, 20).map(f => `- \`${f}\``).join('\n') || 'None'}
${(diff.filesChanged || []).length > 20 ? `\n... and ${diff.filesChanged.length - 20} more` : ''}

## Action Required

${diff.breakingChanges?.length > 0 ? '⚠️ **Breaking changes detected** - Manual review required' : '✅ Safe to apply automatically'}
`;
}

main().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
