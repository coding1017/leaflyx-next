const fs = require("fs");
const path = require("path");

const txt = fs.readFileSync("lib/products.ts", "utf8");
const refs = [...txt.matchAll(/"((?:\/images\/products\/)[^"']+)"/g)].map(m => m[1]);
const uniq = [...new Set(refs)];

let missing = 0;
for (const r of uniq) {
  const p = path.join("public", r);
  if (!fs.existsSync(p)) {
    console.log("MISSING:", r);
    missing++;
  }
}

console.log("Checked", uniq.length, "refs. Missing:", missing);
