#!/usr/bin/env node
/**
 * Dependency Vulnerability Scanner
 * 
 * Scans all package.json projects for known CVEs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/Users/openclaw/.openclaw/workspace';
const SECURITY_DIR = path.join(WORKSPACE, 'data', 'security');

// Find all package.json files
function findPackageJsons(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    
    if (entry.isDirectory()) {
      findPackageJsons(fullPath, results);
    } else if (entry.name === 'package.json') {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Run npm audit on a directory
function runAudit(packageDir) {
  try {
    const result = execSync('npm audit --json 2>/dev/null', {
      cwd: packageDir,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    return JSON.parse(result);
  } catch (err) {
    // npm audit exits with non-zero if vulnerabilities found
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        return { error: 'Failed to parse audit output' };
      }
    }
    return { error: err.message };
  }
}

console.log('🔍 Scanning dependencies for vulnerabilities...\n');

const packageJsons = findPackageJsons(WORKSPACE);
console.log(`Found ${packageJsons.length} Node.js projects\n`);

const allResults = [];

for (const pkgPath of packageJsons) {
  const projectDir = path.dirname(pkgPath);
  const relativePath = projectDir.replace(WORKSPACE, '') || '/';
  
  // Skip if no node_modules (not installed)
  if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
    console.log(`⏭️  ${relativePath} — skipped (no node_modules)`);
    continue;
  }
  
  console.log(`📦 ${relativePath}`);
  const audit = runAudit(projectDir);
  
  if (audit.error) {
    console.log(`   ❌ Error: ${audit.error}`);
    continue;
  }
  
  const vulns = audit.vulnerabilities || {};
  const summary = audit.metadata?.vulnerabilities || { critical: 0, high: 0, moderate: 0, low: 0 };
  
  const total = summary.critical + summary.high + summary.moderate + summary.low;
  
  if (total === 0) {
    console.log(`   ✅ No vulnerabilities found`);
  } else {
    console.log(`   🔴 ${summary.critical} critical | 🟠 ${summary.high} high | 🟡 ${summary.moderate} moderate | ⚪ ${summary.low} low`);
  }
  
  allResults.push({
    project: relativePath,
    summary,
    vulnerabilities: Object.keys(vulns).map(name => ({
      name,
      severity: vulns[name].severity,
      via: vulns[name].via?.map(v => typeof v === 'string' ? v : v.title).slice(0, 3),
      fixAvailable: vulns[name].fixAvailable
    }))
  });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY\n');

let totalCritical = 0, totalHigh = 0;

allResults.forEach(r => {
  totalCritical += r.summary.critical || 0;
  totalHigh += r.summary.high || 0;
});

if (totalCritical > 0) {
  console.log(`🔴 CRITICAL: ${totalCritical} vulnerabilities require immediate attention`);
}
if (totalHigh > 0) {
  console.log(`🟠 HIGH: ${totalHigh} vulnerabilities should be addressed soon`);
}
if (totalCritical === 0 && totalHigh === 0) {
  console.log(`✅ No critical or high severity vulnerabilities found`);
}

// Save report
const report = {
  timestamp: new Date().toISOString(),
  totalProjects: packageJsons.length,
  scanned: allResults.length,
  summary: {
    critical: totalCritical,
    high: totalHigh
  },
  projects: allResults
};

fs.writeFileSync(
  path.join(SECURITY_DIR, 'vulnerability-scan.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n✅ Full report saved to data/security/vulnerability-scan.json`);

if (totalCritical > 0) {
  process.exit(1);
}
