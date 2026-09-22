module.exports = {
  packagerConfig: {
    asar: { unpack: "**/*.node" },
    executableName: "ABSLabLite",
    name: "ABS Lab Lite",
    ignore: [/^\/src/, /^\/tests/, /^\/scripts/, /tsconfig\.json$/],
  },
  // The encrypted SQLite package ships a verified Electron x64 prebuild. Rebuilding it
  // would replace that artifact and unnecessarily require a local C++/Python toolchain.
  rebuildConfig: { onlyModules: [] },
  makers: [{ name: "@electron-forge/maker-squirrel", config: { name: "abs_lab_lite", setupExe: "ABS-Lab-Lite-Setup.exe", noMsi: true } }],
};
