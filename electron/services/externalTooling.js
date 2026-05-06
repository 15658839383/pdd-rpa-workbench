const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

let cachedPythonRunner = null;

function buildPythonEnv() {
  return {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1"
  };
}

function getPortableExecutableDir() {
  const directDir = String(process.env.PORTABLE_EXECUTABLE_DIR || "").trim();
  if (directDir) {
    return directDir;
  }

  const portableFile = String(process.env.PORTABLE_EXECUTABLE_FILE || "").trim();
  if (portableFile) {
    return path.dirname(portableFile);
  }

  return "";
}

function resolvePackagedHelperPath(fileName) {
  const normalizedFileName = String(fileName || "").trim();
  if (!normalizedFileName) {
    return null;
  }

  const portableExecutableDir = getPortableExecutableDir();
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, "helpers", normalizedFileName) : null,
    path.join(path.dirname(process.execPath), "resources", "helpers", normalizedFileName),
    path.join(path.dirname(process.execPath), "helpers", normalizedFileName),
    portableExecutableDir ? path.join(portableExecutableDir, "resources", "helpers", normalizedFileName) : null,
    portableExecutableDir ? path.join(portableExecutableDir, "helpers", normalizedFileName) : null,
    path.join(process.cwd(), "resources", "helpers", normalizedFileName)
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function resolveScriptPath(relativePath) {
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, relativePath) : null,
    path.join(process.cwd(), relativePath)
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function resolvePythonRunner(createError) {
  if (cachedPythonRunner) {
    return cachedPythonRunner;
  }

  const candidates = [
    { command: "py", args: ["-3"] },
    { command: "python", args: [] },
    { command: "python3", args: [] }
  ];

  for (const candidate of candidates) {
    try {
      const result = spawnSync(candidate.command, [...candidate.args, "--version"], {
        windowsHide: true
      });

      if (result.status === 0) {
        cachedPythonRunner = candidate;
        return cachedPythonRunner;
      }
    } catch {
      continue;
    }
  }

  throw createError("未找到可用的 Python 解释器", "PYTHON_NOT_FOUND");
}

module.exports = {
  buildPythonEnv,
  resolvePackagedHelperPath,
  resolvePythonRunner,
  resolveScriptPath
};
