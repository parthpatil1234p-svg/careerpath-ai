/**
 * rebrand_to_dheepath.js
 * Comprehensive automated rebranding script: DheePath -> DheePath
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');

// File extensions to process
const validExtensions = new Set([
  '.html', '.js', '.css', '.json', '.txt', '.xml', '.webmanifest', '.svg', '.md', '.prisma', '.yaml', '.yml'
]);

// Ignored directory names
const ignoredDirs = new Set([
  'node_modules', '.git', '.gemini', 'graft', '.claude', '.serena', 'audit_screenshots', 'dist', 'build'
]);

// Exact & pattern-based replacement definitions
// Processed in strict priority order (most specific first)
const replacements = [
  // HTML two-tone brand styling
  { from: /CareerPath\s*<span class="brand-accent">AI<\/span>/g, to: 'Dhee<span class="brand-accent">Path</span>' },
  { from: /CareerPath\s*<span class="text-primary">AI<\/span>/g, to: 'Dhee<span class="text-primary">Path</span>' },
  { from: /CareerPath\s*<span class="brand-accent fs-5">AI<\/span>/g, to: 'Dhee<span class="brand-accent fs-5">Path</span>' },
  { from: /CareerPath\s*<span class="brand-accent fs-4">AI<\/span>/g, to: 'Dhee<span class="brand-accent fs-4">Path</span>' },
  { from: /CareerPath\s*<span class="text-primary fs-5">AI<\/span>/g, to: 'Dhee<span class="text-primary fs-5">Path</span>' },
  { from: /CareerPath\s*<span>AI<\/span>/g, to: 'Dhee<span>Path</span>' },
  { from: /CareerPath&nbsp;<span class="brand-accent">AI<\/span>/g, to: 'Dhee<span class="brand-accent">Path</span>' },
  { from: /CareerPath\s*<span class="text-primary">AI<\/span>\s*Technologies/g, to: 'DheePath Technologies' },

  // Legal & Institutional Entities
  { from: /CareerPath\s+AI\s+Technologies\s+Inc\./gi, to: 'DheePath Technologies Inc.' },
  { from: /CareerPath\s+Technologies\s+Inc\./gi, to: 'DheePath Technologies Inc.' },
  { from: /CareerPath\s+AI\s+Global\s+Talent\s+Protocol/gi, to: 'DheePath Global Talent Protocol' },
  { from: /CareerPath\s+Global\s+Talent\s+Protocol/gi, to: 'DheePath Global Talent Protocol' },
  { from: /CareerPath\s+AI\s+Global\s+Credential\s+Registry/gi, to: 'DheePath Global Credential Registry' },
  { from: /CareerPath\s+Global\s+Credential\s+Registry/gi, to: 'DheePath Global Credential Registry' },
  { from: /CareerPath\s+AI\s+Accreditation\s+Board/gi, to: 'DheePath Accreditation Board' },
  { from: /CareerPath\s+Accreditation\s+Board/gi, to: 'DheePath Accreditation Board' },
  { from: /CareerPath\s+AI\s+Knowledge\s+Engine/gi, to: 'DheePath Knowledge Engine' },
  { from: /CareerPath\s+Knowledge\s+Engine/gi, to: 'DheePath Knowledge Engine' },
  { from: /CareerPath\s+AI\s+Learning\s+Hub/gi, to: 'DheePath Learning Hub' },
  { from: /CareerPath\s+Learning\s+Hub/gi, to: 'DheePath Learning Hub' },
  { from: /CareerPath\s+AI\s+Talent\s+Radar/gi, to: 'DheePath Talent Radar' },
  { from: /CareerPath\s+Talent\s+Radar/gi, to: 'DheePath Talent Radar' },
  { from: /CareerPath\s+AI\s+Verified/gi, to: 'DheePath Verified' },
  { from: /CareerPath\s+Verified/gi, to: 'DheePath Verified' },
  { from: /CareerPath\s+Academy/gi, to: 'DheePath Academy' },
  { from: /CareerPath\s+AI\s+Team/gi, to: 'DheePath Team' },
  { from: /CareerPath\s+Team/gi, to: 'DheePath Team' },
  { from: /CareerPath\s+AI\s+Web\s+Platform/gi, to: 'DheePath Web Platform' },
  { from: /CareerPath\s+Web\s+Platform/gi, to: 'DheePath Web Platform' },
  { from: /CareerPath\s+AI\s+Platform/gi, to: 'DheePath Platform' },
  { from: /CareerPath\s+Platform/gi, to: 'DheePath Platform' },
  { from: /CareerPath\s+AI\s+Mentor/gi, to: 'DheePath Mentor' },
  { from: /CareerPath\s+Mentor/gi, to: 'DheePath Mentor' },
  { from: /CareerPath\s+AI\s+Student/gi, to: 'DheePath Student' },
  { from: /CareerPath\s+Student/gi, to: 'DheePath Student' },
  { from: /CareerPath\s+AI\s+Support/gi, to: 'DheePath Support' },
  { from: /CareerPath\s+Support/gi, to: 'DheePath Support' },
  { from: /CareerPath\s+AI\s+Ecosystem/gi, to: 'DheePath Ecosystem' },
  { from: /CareerPath\s+Ecosystem/gi, to: 'DheePath Ecosystem' },
  { from: /CareerPath\s+AI\s+OS/gi, to: 'DheePath OS' },
  { from: /CareerPath\s+OS/gi, to: 'DheePath OS' },
  { from: /CareerPath\s+AI\s+GPS/gi, to: 'DheePath GPS' },
  { from: /CareerPath\s+GPS/gi, to: 'DheePath GPS' },

  // General Brand Names
  { from: /\bCareerPath\s+AI\b/g, to: 'DheePath' },
  { from: /\bCareerpath\s+AI\b/g, to: 'DheePath' },
  { from: /\bcareerpath\s+ai\b/g, to: 'dheepath' },
  { from: /\bCAREERPATH\s+AI\b/g, to: 'DHEEPATH' },
  { from: /\bCareerPath-AI\b/g, to: 'DheePath' },
  { from: /\bCareerPathAI\b/g, to: 'DheePath' },
  { from: /\bcareerpath-ai\b/g, to: 'dheepath' },

  // Brand Prepositions & Predicates
  { from: /\bWelcome to DheePath\b/gi, to: 'Welcome to DheePath' },
  { from: /\bon CareerPath\b/gi, to: 'on DheePath' },
  { from: /\bin CareerPath\b/gi, to: 'in DheePath' },
  { from: /\bwith CareerPath\b/gi, to: 'with DheePath' },
  { from: /\bby CareerPath\b/gi, to: 'by DheePath' },
  { from: /\babout CareerPath\b/gi, to: 'about DheePath' },
  { from: /\busing CareerPath\b/gi, to: 'using DheePath' },
  { from: /\bat CareerPath\b/gi, to: 'at DheePath' },
  { from: /\bto CareerPath\b/gi, to: 'to DheePath' },
  { from: /\bfrom CareerPath\b/gi, to: 'from DheePath' },
  { from: /\bCareerPath account\b/gi, to: 'DheePath account' },
  { from: /\bCareerPath's\b/gi, to: "DheePath's" },
  { from: /\bCareerPath is\b/gi, to: 'DheePath is' },
  { from: /\bCareerPath provides\b/gi, to: 'DheePath provides' },
  { from: /\bCareerPath operates\b/gi, to: 'DheePath operates' },
  { from: /\bCareerPath enforces\b/gi, to: 'DheePath enforces' },
  { from: /\bCareerPath claims\b/gi, to: 'DheePath claims' },
  { from: /\bCareerPath owns\b/gi, to: 'DheePath owns' },
  { from: /\bCareerPath will\b/gi, to: 'DheePath will' },
  { from: /\bCareerPath was\b/gi, to: 'DheePath was' },
  { from: /\bCareerPath eliminated\b/gi, to: 'DheePath eliminated' },
  { from: /\bCareerPath eliminates\b/gi, to: 'DheePath eliminates' },
  { from: /\bCareerPath empowers\b/gi, to: 'DheePath empowers' },
  { from: /\bCareerPath bridges\b/gi, to: 'DheePath bridges' },
  { from: /\bCareerPath delivers\b/gi, to: 'DheePath delivers' },
  { from: /\bCareerPath activates\b/gi, to: 'DheePath activates' },
  { from: /\bCareerPath features\b/gi, to: 'DheePath features' },
  { from: /\bCareerPath uses\b/gi, to: 'DheePath uses' },
  { from: /\bDheePath Supports\b/gi, to: 'DheePath supports' },
  { from: /\bCareerPath accreditation\b/gi, to: 'DheePath accreditation' },
  { from: /\bCareerPath credential\b/gi, to: 'DheePath credential' },
  { from: /\bCareerPath ledger\b/gi, to: 'DheePath ledger' },
  { from: /\bCareerPath certificate\b/gi, to: 'DheePath certificate' },
  { from: /\bCareerPath roadmap\b/gi, to: 'DheePath roadmap' },
  { from: /\bCareerPath diagnostic\b/gi, to: 'DheePath diagnostic' },
  { from: /\bCareerPath assessment\b/gi, to: 'DheePath assessment' },
  { from: /\bCareerPath radar\b/gi, to: 'DheePath radar' },
  { from: /\bCareerPath talent\b/gi, to: 'DheePath talent' },
  { from: /\bCareerPath candidate\b/gi, to: 'DheePath candidate' },
  { from: /\bCareerPath recruiter\b/gi, to: 'DheePath recruiter' },
  { from: /\bDheePath Student\b/gi, to: 'DheePath student' },
  { from: /\bCareerPath portal\b/gi, to: 'DheePath portal' }
];

let filesModified = 0;
let totalChanges = 0;

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!validExtensions.has(ext)) return;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    let fileChanges = 0;

    for (const r of replacements) {
      const match = content.match(r.from);
      if (match) {
        fileChanges += match.length;
        content = content.replace(r.from, r.to);
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      totalChanges += fileChanges;
      console.log(`[UPDATED] (${fileChanges} replacements) ${path.relative(rootDir, filePath)}`);
    }
  } catch (err) {
    console.error(`[ERROR] Processing ${filePath}:`, err.message);
  }
}

function walkDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

console.log('====================================================');
console.log('   DHEEPATH REBRANDING AUTOMATION SUITE             ');
console.log('====================================================\n');

// 1. Process dheepath subproject
walkDirectory(rootDir);

// 2. Process specific parent project files
const parentFiles = [
  'CareerPath_AI_Job_Alerts_n8n.json',
  'SEVA_INNOVATION_CHALLENGE_SUBMISSION.md',
  'SEVA_INNOVATION_JALGAON_APPLICATION_PACKAGE.md',
  'docs/VIDEO_RESOURCE_TRANSFORMATION_PLAN.md'
];

for (const rel of parentFiles) {
  const fp = path.join(parentDir, rel);
  if (fs.existsSync(fp)) {
    processFile(fp);
  }
}

console.log('\n====================================================');
console.log(`REBRANDING COMPLETE:`);
console.log(`Files Modified:   ${filesModified}`);
console.log(`Total Changes:    ${totalChanges}`);
console.log('====================================================');
