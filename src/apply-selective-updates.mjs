/**
 * Apply selective updates from diff
 * Only applies safe, additive changes
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function applySelectiveUpdates(diff) {
  const updates = [];

  // Add new exports
  if (diff.newExports?.length > 0) {
    updates.push(...await addNewExports(diff.newExports));
  }

  // Add new methods
  if (diff.newMethods?.length > 0) {
    updates.push(...await addNewMethods(diff.newMethods));
  }

  return updates;
}

async function addNewExports(newExports) {
  const exportsFile = join(process.cwd(), 'src', 'compat', 'exports.js');
  
  if (!existsSync(exportsFile)) {
    return [];
  }

  const content = readFileSync(exportsFile, 'utf-8');
  const updates = [];

  for (const exp of newExports) {
    // Check if already exists
    if (content.includes(`export.*${exp}`)) {
      continue;
    }

    // Add export (simplified - would need proper AST parsing)
    // For now, just log
    updates.push({ type: 'new_export', name: exp });
  }

  return updates;
}

async function addNewMethods(newMethods) {
  const clientFile = join(process.cwd(), 'src', 'compat', 'client.js');
  
  if (!existsSync(clientFile)) {
    return [];
  }

  const updates = [];

  // Group by module
  const byModule = {};
  for (const { module, method } of newMethods) {
    if (!byModule[module]) byModule[module] = [];
    byModule[module].push(method);
  }

  for (const [moduleName, methods] of Object.entries(byModule)) {
    // Add methods to module factory
    // This would require AST manipulation in a real implementation
    updates.push({ type: 'new_methods', module: moduleName, methods });
  }

  return updates;
}
