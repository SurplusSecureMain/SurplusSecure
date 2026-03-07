#!/usr/bin/env node
/**
 * Build script: reads data files, injects them into the worker template,
 * outputs the final worker.js that wrangler deploys.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SRC_DIR = path.join(ROOT, 'src');
const OUT_FILE = path.join(ROOT, 'dist', 'worker.js');

// Read data files
const counties = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'counties.json'), 'utf8'));
const foiaTemplates = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'foia-templates.json'), 'utf8'));
const journeyStages = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'journey-stages.json'), 'utf8'));

// Read the worker template
const template = fs.readFileSync(path.join(SRC_DIR, 'worker.js'), 'utf8');

// Inject data
const output = template
  .replace('/*__COUNTIES_DATA__*/', JSON.stringify(counties))
  .replace('/*__FOIA_TEMPLATES__*/', JSON.stringify(foiaTemplates))
  .replace('/*__JOURNEY_STAGES__*/', JSON.stringify(journeyStages));

// Write output
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(OUT_FILE, output, 'utf8');

console.log(`✅ Built worker.js (${(output.length / 1024).toFixed(1)} KB)`);
console.log(`   ${counties.length} counties loaded`);
console.log(`   ${foiaTemplates.length} FOIA templates loaded`);
console.log(`   ${journeyStages.length} journey stages loaded`);
