/**
 * Extract API contract from local codebase
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export function extractLocalContract() {
  const contract = {
    exports: [],
    modules: {},
  };

  // Extract from exports file
  const exportsFile = join(process.cwd(), 'src', 'compat', 'exports.js');
  try {
    const content = readFileSync(exportsFile, 'utf-8');
    contract.exports = extractExports(content);
  } catch {
    // File doesn't exist
  }

  // Extract modules from client.js
  const clientFile = join(process.cwd(), 'src', 'compat', 'client.js');
  try {
    const content = readFileSync(clientFile, 'utf-8');
    contract.modules = extractModules(content);
  } catch {
    // File doesn't exist
  }

  return contract;
}

function extractExports(content) {
  const exports = [];
  
  const exportRegex = /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)|export\s+class\s+(\w+)|export\s+default\s+(\w+)/g;
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4];
    if (name) exports.push(name);
  }

  return exports;
}

function extractModules(content) {
  const modules = {};

  // Extract module methods from factory functions
  const modulePatterns = {
    entities: /entities\.(\w+)\s*=/g,
    auth: /auth\.(\w+)\s*=/g,
    functions: /functions\.(\w+)\s*=/g,
    integrations: /integrations\.(\w+)\s*=/g,
    agents: /agents\.(\w+)\s*=/g,
    appLogs: /appLogs\.(\w+)\s*=/g,
    analytics: /analytics\.(\w+)\s*=/g,
    users: /users\.(\w+)\s*=/g,
  };

  for (const [moduleName, pattern] of Object.entries(modulePatterns)) {
    const methods = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
      methods.push(match[1]);
    }
    modules[moduleName] = methods;
  }

  return modules;
}
