#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SPACING_MAP = {
  '0': 0,
  px: 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384
};

const files = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(tsx|ts|jsx|js|css|scss)$/.test(entry.name)) {
      files.push(full);
    }
  }
}

walk(path.join(__dirname, 'apps'));

const classRegex = /\b(?:p|m)(?:[trblxy])?-(?:px|\d+(?:\.5)?)\b/g;
const results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const matches = line.match(classRegex);
    if (!matches) return;
    matches.forEach((cls) => {
      const value = cls.split('-')[1];
      const px = SPACING_MAP[value];
      if (px === undefined) return;
      if (px % 4 !== 0) {
        const suggestedPx = Math.round(px / 4) * 4;
        results.push({
          file: file.replace(path.join(__dirname, ''), ''),
          line: index + 1,
          selector: cls,
          valor_actual: `${px}px`,
          valor_sugerido: `${suggestedPx}px`
        });
      }
    });
  });
}

console.log(JSON.stringify(results, null, 2));
