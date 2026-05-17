const fs = require('fs');
const path = require('path');

const replacements = [
  ['ðŸ‡ºðŸ‡¸', '🇺🇸'],
  ['ðŸ‡ªðŸ‡¸', '🇪🇸'],
  ['ðŸŒ´', '🌴'],
  ['ðŸŒŽ', '🌎'],
  ['ðŸ'³', '💳'],
  ['ðŸ'°', '💰'],
  ['ðŸ"…', '📅'],
  ['ðŸ"', '📋'],
  ['ðŸš€', '🚀'],
  ['ðŸ"©', '📩'],
  ['â­', '⭐'],
  ['â¡', '⚡'],
  ['âœ…', '✅'],
  ['â€"', '—'],
  ['â€˜', '‘'],
  ['â€™', '’'],
  ['â€œ', '“'],
  ['â€', '”'],
  ['Â·', '·'],
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã±', 'ñ'],
  ['Ã', 'Á'],
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [bad, good] of replacements) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', path.basename(filePath));
  }
}

function walkDir(dir, exts) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') walkDir(full, exts);
    } else if (exts.some(e => entry.name.endsWith(e))) {
      fixFile(full);
    }
  }
}

walkDir(path.join(__dirname, 'client/src'), ['.jsx', '.js', '.json']);
console.log('All done.');
