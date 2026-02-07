#!/usr/bin/env node
/**
 * Credential Scanner v2 — Find exposed secrets
 * 
 * Scans workspace for secrets in UNEXPECTED locations.
 * Expected locations (credentials/, .env, etc.) are audited separately.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = process.env.WORKSPACE || '/Users/openclaw/.openclaw/workspace';
const SECURITY_DIR = path.join(WORKSPACE, 'data', 'security');

// Patterns that indicate secrets
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g },
  { name: 'Slack Token', pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/g },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Private Key Header', pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'Password in URL', pattern: /:\/\/[^:\s]+:[^@\s]+@[^\s]+/g },
  { name: 'Hardcoded Password', pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi },
  { name: 'API Key Assignment', pattern: /api[_-]?key\s*[=:]\s*['"][A-Za-z0-9_-]{20,}['"]/gi },
  { name: 'Secret Assignment', pattern: /secret\s*[=:]\s*['"][A-Za-z0-9_-]{20,}['"]/gi },
  { name: 'Bearer Token', pattern: /[Bb]earer\s+[A-Za-z0-9_-]{20,}/g },
];

// Directories to skip entirely
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
];

// Expected credential locations (audit permissions, don't flag as exposure)
const EXPECTED_CRED_PATHS = [
  /^\/credentials\//,
  /^\/\.env/,
  /\/auth-profiles\.json$/,
  /\/config\.json$/,  // CRM config
  /\/-token\.json$/,
  /\/-api\.json$/,
];

// Files to skip (data files, not code)
const SKIP_FILES = [
  /kommo-events\.json$/,
  /leads\.json$/,
  /contacts\.json$/,
  /pipeline\.json$/,
  /notes\.json$/,
  /\.log$/,
  /session-.*\.jsonl$/,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.py', '.sh', '.md', '.txt', '.yml', '.yaml'];

const findings = [];
const expectedCredFiles = [];

function isExpectedCredLocation(relativePath) {
  return EXPECTED_CRED_PATHS.some(p => p.test(relativePath));
}

function shouldSkipFile(relativePath) {
  return SKIP_FILES.some(p => p.test(relativePath));
}

function shouldScan(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath);
  const relativePath = filePath.replace(WORKSPACE, '');
  
  // Skip data files
  if (shouldSkipFile(relativePath)) return false;
  
  // Check expected cred locations - audit separately
  if (isExpectedCredLocation(relativePath)) {
    expectedCredFiles.push(relativePath);
    return false;
  }
  
  return SCAN_EXTENSIONS.includes(ext);
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = filePath.replace(WORKSPACE, '');
    
    SECRET_PATTERNS.forEach(({ name, pattern }) => {
      const regex = new RegExp(pattern.source, pattern.flags);
      
      lines.forEach((line, lineNum) => {
        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) return;
        
        let match;
        while ((match = regex.exec(line)) !== null) {
          // Skip placeholders
          const val = match[0].toLowerCase();
          if (val.includes('xxx') || val.includes('your_') || val.includes('example') || 
              val.includes('placeholder') || val.includes('change_me')) {
            continue;
          }
          
          findings.push({
            type: name,
            file: relativePath,
            line: lineNum + 1,
            preview: line.substring(0, 80).trim(),
            severity: getSeverity(name),
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  } catch (err) {
    // Skip unreadable files
  }
}

function getSeverity(type) {
  const critical = ['Private Key Header', 'Password in URL'];
  const high = ['AWS Access Key', 'GitHub Token', 'JWT Token', 'Hardcoded Password'];
  
  if (critical.includes(type)) return 'CRITICAL';
  if (high.includes(type)) return 'HIGH';
  return 'MEDIUM';
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && shouldScan(fullPath)) {
      scanFile(fullPath);
    }
  }
}

function auditCredentialsDir() {
  const credDir = path.join(WORKSPACE, 'credentials');
  if (!fs.existsSync(credDir)) return [];
  
  const issues = [];
  
  function walkCreds(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkCreds(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (mode !== '600' && mode !== '400') {
          issues.push({
            file: fullPath.replace(WORKSPACE, ''),
            permissions: mode,
            required: '600',
            severity: mode.includes('7') ? 'CRITICAL' : 'HIGH'
          });
        }
      }
    }
  }
  
  walkCreds(credDir);
  return issues;
}

// Also check .env files permissions
function auditEnvFiles() {
  const issues = [];
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  
  for (const envFile of envFiles) {
    const fullPath = path.join(WORKSPACE, envFile);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      
      if (mode !== '600' && mode !== '400') {
        issues.push({
          file: '/' + envFile,
          permissions: mode,
          required: '600',
          severity: 'HIGH'
        });
      }
    }
  }
  return issues;
}

// Run scan
console.log('🔍 Scanning workspace for exposed secrets...\n');
walkDir(WORKSPACE);

// Audit expected credential locations
const credPermIssues = auditCredentialsDir();
const envPermIssues = auditEnvFiles();
const permIssues = [...credPermIssues, ...envPermIssues];

// Output results
const critical = findings.filter(f => f.severity === 'CRITICAL');
const high = findings.filter(f => f.severity === 'HIGH');
const medium = findings.filter(f => f.severity === 'MEDIUM');

console.log(`Found ${findings.length} potential secret exposure(s):\n`);

if (critical.length > 0) {
  console.log('🔴 CRITICAL:');
  critical.forEach(f => console.log(`  ${f.file}:${f.line} — ${f.type}`));
  console.log();
}

if (high.length > 0) {
  console.log('🟠 HIGH:');
  high.forEach(f => console.log(`  ${f.file}:${f.line} — ${f.type}`));
  console.log();
}

if (medium.length > 0) {
  console.log('🟡 MEDIUM:');
  medium.forEach(f => console.log(`  ${f.file}:${f.line} — ${f.type}`));
  console.log();
}

if (findings.length === 0) {
  console.log('✅ No secrets found in unexpected locations\n');
}

// Permission issues
if (permIssues.length > 0) {
  console.log('⚠️  CREDENTIAL FILES WITH BAD PERMISSIONS:');
  permIssues.forEach(f => console.log(`  ${f.file} — mode ${f.permissions} (should be ${f.required})`));
  console.log();
} else {
  console.log('✅ All credential files have proper permissions (600)\n');
}

// Summary
console.log('📋 SUMMARY');
console.log(`  Scanned: code files in workspace`);
console.log(`  Expected cred locations: ${expectedCredFiles.length} files (audited for permissions)`);
console.log(`  Exposures found: ${findings.length}`);
console.log(`  Permission issues: ${permIssues.length}`);

// Save results
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    badPermissions: permIssues.length
  },
  findings,
  permissionIssues: permIssues,
  expectedCredentialFiles: expectedCredFiles
};

fs.writeFileSync(
  path.join(SECURITY_DIR, 'credential-audit.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n✅ Full report saved to data/security/credential-audit.json`);

// Exit with error if critical findings
if (critical.length > 0 || permIssues.some(p => p.severity === 'CRITICAL')) {
  process.exit(1);
}
