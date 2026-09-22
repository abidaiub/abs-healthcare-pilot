import { build } from "esbuild";
import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/renderer",{recursive:true});
await Promise.all([
  build({entryPoints:["src/main/main.ts"],outfile:"dist/main.cjs",bundle:true,platform:"node",format:"cjs",target:"node24",external:["electron","better-sqlite3-multiple-ciphers"],sourcemap:true}),
  build({entryPoints:["src/main/preload.ts"],outfile:"dist/preload.cjs",bundle:true,platform:"node",format:"cjs",target:"node24",external:["electron"],sourcemap:true}),
  build({entryPoints:["src/renderer/renderer.ts"],outfile:"dist/renderer/renderer.js",bundle:true,platform:"browser",format:"iife",target:"chrome140",sourcemap:true}),
  cp("src/renderer/index.html","dist/renderer/index.html"),
  cp("src/renderer/styles.css","dist/renderer/styles.css"),
]);
