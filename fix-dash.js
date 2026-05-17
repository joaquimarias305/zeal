const fs = require('fs');

const files = [
  'client/src/i18n/en.json',
  'client/src/i18n/es.json',
];

// Pattern: C3 A2 E2 82 AC E2 80 9D (â€" as stored in file)
const pattern = [0xc3, 0xa2, 0xe2, 0x82, 0xac, 0xe2, 0x80, 0x9d];
const replacement = Buffer.from(' - ');

for (const f of files) {
  const buf = fs.readFileSync(f);
  const result = [];
  for (let i = 0; i < buf.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (buf[i + j] !== pattern[j]) { match = false; break; }
    }
    if (match) {
      for (const b of replacement) result.push(b);
      i += pattern.length - 1;
    } else {
      result.push(buf[i]);
    }
  }
  fs.writeFileSync(f, Buffer.from(result));
  console.log('Fixed:', f);
}
console.log('Done');
