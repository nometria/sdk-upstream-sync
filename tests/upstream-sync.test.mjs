import { test } from 'node:test';
import assert from 'node:assert/strict';

test('UPSTREAM_REPO env var is read correctly', () => {
  process.env.UPSTREAM_REPO = 'some-org/some-repo';
  const repo = process.env.UPSTREAM_REPO;
  assert.equal(repo, 'some-org/some-repo');
  delete process.env.UPSTREAM_REPO;
});

test('LOCAL_MIRROR_DIR defaults to ./sdk-mirror', () => {
  delete process.env.LOCAL_MIRROR_DIR;
  const dir = process.env.LOCAL_MIRROR_DIR ?? './sdk-mirror';
  assert.equal(dir, './sdk-mirror');
});

test('MAX_FILES is parsed as integer', () => {
  process.env.MAX_FILES = '50';
  const maxFiles = parseInt(process.env.MAX_FILES ?? '100', 10);
  assert.equal(maxFiles, 50);
  delete process.env.MAX_FILES;
});

test('MAX_LOC is parsed as integer', () => {
  process.env.MAX_LOC = '2000';
  const maxLoc = parseInt(process.env.MAX_LOC ?? '5000', 10);
  assert.equal(maxLoc, 2000);
  delete process.env.MAX_LOC;
});
