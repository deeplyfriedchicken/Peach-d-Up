const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * electron-builder afterPack hook.
 * Rewrites Remotion compositor dylib paths from bare names (e.g. "libavcodec.dylib")
 * to "@loader_path/libavcodec.dylib" so they load in hardened macOS apps.
 */
exports.default = async function (context) {
  if (process.platform !== "darwin") return;

  const appDir = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    "Contents",
    "Resources",
    "app"
  );

  const compositorDir = path.join(
    appDir,
    "node_modules",
    "@remotion",
    "compositor-darwin-arm64"
  );

  if (!fs.existsSync(compositorDir)) {
    console.log("Compositor directory not found, skipping dylib fix");
    return;
  }

  const dylibs = fs
    .readdirSync(compositorDir)
    .filter((f) => f.endsWith(".dylib"));

  const binaries = ["remotion", "ffmpeg", "ffprobe"].filter((b) =>
    fs.existsSync(path.join(compositorDir, b))
  );

  const targets = [
    ...binaries.map((b) => path.join(compositorDir, b)),
    ...dylibs.map((d) => path.join(compositorDir, d)),
  ];

  for (const target of targets) {
    // Get current linked libraries
    const output = execSync(`otool -L "${target}"`, { encoding: "utf-8" });
    const lines = output.split("\n").slice(1); // skip first line (file path)

    for (const line of lines) {
      const match = line.match(/^\s+(lib\S+\.dylib)\s/);
      if (match) {
        const oldName = match[1];
        const newName = `@loader_path/${oldName}`;
        try {
          execSync(
            `install_name_tool -change "${oldName}" "${newName}" "${target}"`,
            { stdio: "pipe" }
          );
        } catch {
          // Some changes may fail if already correct, ignore
        }
      }
    }

    // Also fix the install name (id) for dylibs themselves
    if (target.endsWith(".dylib")) {
      const basename = path.basename(target);
      try {
        execSync(
          `install_name_tool -id "@loader_path/${basename}" "${target}"`,
          { stdio: "pipe" }
        );
      } catch {
        // ignore
      }
    }

    // Re-sign after modification (ad-hoc is sufficient)
    try {
      execSync(`codesign --force --sign - "${target}"`, { stdio: "pipe" });
    } catch {
      // ignore
    }
  }

  console.log(
    `Fixed dylib paths for ${targets.length} files in compositor-darwin-arm64`
  );
};
