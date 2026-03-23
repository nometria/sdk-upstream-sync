# Changelog

All notable changes to `sdk-upstream-sync` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2025-03-22

### Added
- Upstream contract extraction: reads exports, methods, and module structure from any JS/TS repo via GitHub API
- Local contract extraction: reads the same surface from your fork
- Contract diff: detects added/removed exports and methods (breaking vs safe)
- Auto-apply threshold: if ≤ `MAX_FILES` files and ≤ `MAX_LOC` lines changed and zero breaking changes → apply automatically
- `sync/report.md` generated for all changes that exceed thresholds or introduce breaking changes
- SHA tracking in `sync/upstream.json` — exits cleanly if already up to date
- `GITHUB_TOKEN` support for private repos and higher rate limits
- All config via env vars: `UPSTREAM_REPO`, `UPSTREAM_BRANCH`, `LOCAL_PATH`, `MAX_FILES`, `MAX_LOC`, `SYNC_DIR`
- GitHub Action (`action.yml`) for scheduled syncs (e.g. every Monday)
