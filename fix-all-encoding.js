const fs = require('fs');
const path = require('path');

// All known bad byte patterns and their replacements
const patterns = [
  // â€" (garbled em-dash: C3 A2 E2 82 AC E2 80 9D)
  { find: [0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x80,0x9d], rep: ' - ' },
  // â€" variant (E2 80 94 = proper em-dash)
  { find: [0xe2,0x80,0x94], rep: ' - ' },
  // â€" variant (E2 80 93 = en-dash)
  { find: [0xe2,0x80,0x93], rep: '-' },
  // â€˜ left single quote (E2 80 98)
  { find: [0xe2,0x80,0x98], rep: "'" },
  // â€™ right single quote (E2 80 99)
  { find: [0xe2,0x80,0x99], rep: "'" },
  // â€œ left double quote (E2 80 9C)
  { find: [0xe2,0x80,0x9c], rep: '"' },
  // â€ right double quote (E2 80 9D) - standalone
  { find: [0xe2,0x80,0x9d], rep: '"' },
  // Â· middle dot (C2 B7)
  { find: [0xc2,0xb7], rep: '·' },
  // Â© copyright (C2 A9)
  { find: [0xc2,0xa9], rep: '©' },
  // garbled â€œ: C3 A2 E2 82 AC C5 93
  { find: [0xc3,0xa2,0xe2,0x82,0xac,0xc5,0x93], rep: '"' },
  // garbled â€™: C3 A2 E2 82 AC E2 84 A2
  { find: [0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x84,0xa2], rep: "'" },
];

function fixBuffer(buf) {
  let arr = Array.from(buf);
  let changed = false;
  for (const { find, rep } of patterns) {
    const repBytes = Array.from(Buffer.from(rep, 'utf8'));
    let i = 0;
    const out = [];
    while (i < arr.length) {
      let match = find.length > 0;
      for (let j = 0; j < find.length; j++) {
        if (arr[i+j] !== find[j]) { match = false; break; }
      }
      if (match) {
        out.push(...repBytes);
        i += find.length;
        changed = true;
      } else {
        out.push(arr[i++]);
      }
    }
    arr = out;
  }
  return { buf: Buffer.from(arr), changed };
}

function walk(dir, exts) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules','.git','build'].includes(e.name)) walk(full, exts);
    } else if (exts.some(x => e.name.endsWith(x))) {
      const buf = fs.readFileSync(full);
      const { buf: fixed, changed } = fixBuffer(buf);
      if (changed) {
        fs.writeFileSync(full, fixed);
        console.log('Fixed:', full.replace(process.cwd(), ''));
      }
    }
  }
}

walk(path.join(__dirname, 'client/src'), ['.jsx','.js','.json']);
console.log('\nAll done.');
