import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import path from "node:path";
await build({entryPoints:["tests/local.test.ts"],outfile:"dist/local-test.cjs",bundle:true,platform:"node",format:"cjs",target:"node24",external:["better-sqlite3-multiple-ciphers"],sourcemap:true});
const electron=path.resolve("node_modules/electron/dist/electron.exe");
const result=spawnSync(electron,[path.resolve("dist/local-test.cjs")],{stdio:"inherit",env:{...process.env,ELECTRON_RUN_AS_NODE:"1"}});
process.exit(result.status??1);
