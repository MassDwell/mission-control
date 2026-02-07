#!/usr/bin/env node
/**
 * File Permission Checker
 * 
 * Ensures sensitive files have proper permissions
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/Users/openclaw/.openclaw/workspace';

// Files/patterns that should be restricted
const SENSITIVE_PATTERNS = [
  { pattern: /credentials\/.*\.(json|txt|key|pem)$/, requiredMode: '600' },
  { pattern: /\.env.*$/, requiredMode: '600' },
  { pattern: /.*-token\.json$/, requiredMode: '600' },
  { pattern: /.*-api\.json$/, requiredMode: '600' },
  { pattern: /.*\.pem$/, requiredMode: '600' },
  { pattern: /.*\.key$/, requiredMode: '600' },
  { pattern: /id_rsa.*$/, requiredMode: '600' },
];

const findings = [];

function checkPermissions(filePath) {
  const relativePath = filePath.replace(WORKSPACE + '/', '');
  
  for (const { pattern, requiredMode } of SENSITIVE_PATTERNS) {
    if (pattern.test(relativePath)) {
      try {
        const stats = fs.statSync(filePath);
        const actualMode = (stats.mode & parseInt('777', 8)).toString(8);
        
        if (actualMode !== requiredMode && actualMode !== '400') {
          findings.push({
            file: relativePath,
            actualMode,
            requiredMode,
            severity: actualMode.includes('7') ? 'CRITICAL' : 'HIGH'
          });
        }
      } catch (err) {
        // File might not exist
      }
      break;
    }
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else {
      checkPermissions(fullPath);
    }
  }
}

console.log('🔍 Checking file permissions...\n');

walkDir(WORKSPACE);

if (findings.length === 0) {
  console.log('✅ All sensitive files have proper permissions');
} else {
  console.log(`⚠️  Found ${findings.length} file(s) with improper permissions:\n`);
  
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : '🟠';
    console.log(`${icon} ${f.file}`);
    console.log(`   Current: ${f.actualMode} | Required: ${f.requiredMode}`);
    console.log(`   Fix: chmod ${f.requiredMode} "${f.file}"`);
    console.log();
  });
}

// Output fix commands
if (findings.length > 0) {
  console.log('\n📋 Run these commands to fix:\n');
  findings.forEach(f => {
    console.log(`chmod ${f.requiredMode} "${path.join(WORKSPACE, f.file)}"`);
  });
}
