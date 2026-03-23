/**
 * Diff two API contracts
 */

export function diffContracts(upstream, local) {
  const diff = {
    newExports: [],
    removedExports: [],
    newMethods: [],
    removedMethods: [],
    breakingChanges: [],
    filesChanged: [],
    locChanged: 0,
  };

  // Diff exports
  const upstreamExports = new Set(upstream.exports || []);
  const localExports = new Set(local.exports || []);

  for (const exp of upstreamExports) {
    if (!localExports.has(exp)) {
      diff.newExports.push(exp);
    }
  }

  for (const exp of localExports) {
    if (!upstreamExports.has(exp)) {
      diff.removedExports.push(exp);
      diff.breakingChanges.push({
        type: 'removed_export',
        description: `Export '${exp}' was removed in upstream`,
      });
    }
  }

  // Diff modules
  const upstreamModules = upstream.modules || {};
  const localModules = local.modules || {};

  for (const [moduleName, upstreamMethods] of Object.entries(upstreamModules)) {
    const localMethods = localModules[moduleName] || [];
    const upstreamMethodSet = new Set(upstreamMethods);
    const localMethodSet = new Set(localMethods);

    for (const method of upstreamMethodSet) {
      if (!localMethodSet.has(method)) {
        diff.newMethods.push({ module: moduleName, method });
      }
    }

    for (const method of localMethodSet) {
      if (!upstreamMethodSet.has(method)) {
        diff.removedMethods.push({ module: moduleName, method });
        diff.breakingChanges.push({
          type: 'removed_method',
          description: `Method '${moduleName}.${method}' was removed in upstream`,
        });
      }
    }
  }

  // Estimate LOC changed (simplified)
  diff.locChanged = (diff.newExports.length + diff.newMethods.length) * 10;

  return diff;
}
