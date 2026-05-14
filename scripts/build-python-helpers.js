const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BUILD_ROOT = path.join(ROOT_DIR, ".build");
const DIST_ROOT = path.join(BUILD_ROOT, "python-helpers");
const WORK_ROOT = path.join(BUILD_ROOT, "pyinstaller", "helpers-work");
const SPEC_ROOT = path.join(BUILD_ROOT, "pyinstaller", "helpers-spec");

const HELPERS = [
  {
    name: "shop-online-check",
    scriptPath: path.join(ROOT_DIR, "tools", "检查是否登录状态是否正常", "检查cookies状态.py"),
    extraArgs: []
  },
  {
    name: "pdd-auto-fill",
    scriptPath: path.join(ROOT_DIR, "新店1.py"),
    extraArgs: []
  }
];

main();

function main() {
  ensureWindows();
  ensureCommand("python", ["--version"], "Python");

  cleanDirectory(DIST_ROOT);
  cleanDirectory(WORK_ROOT);
  cleanDirectory(SPEC_ROOT);

  fs.mkdirSync(DIST_ROOT, { recursive: true });
  fs.mkdirSync(WORK_ROOT, { recursive: true });
  fs.mkdirSync(SPEC_ROOT, { recursive: true });

  for (const helper of HELPERS) {
    buildHelper(helper);
  }

  console.log("Python helper bundles are ready:");
  HELPERS.forEach((helper) => {
    console.log(`- ${path.join(DIST_ROOT, helper.name)}`);
  });
}

function ensureWindows() {
  if (process.platform !== "win32") {
    throw new Error("This build script currently supports Windows only.");
  }
}

function ensureCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} is required before building helper executables.`);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: "pipe",
    windowsHide: true,
    encoding: "utf-8",
    ...options
  });

  if (result.error || result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    const stdout = String(result.stdout || "").trim();
    const details = stderr || stdout || result.error?.message || "unknown error";
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${details}`);
  }

  return result;
}

function cleanDirectory(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function resolvePythonPackagePath(packageName) {
  const pythonScript = [
    "import importlib.util",
    "import pathlib",
    `spec = importlib.util.find_spec(${JSON.stringify(packageName)})`,
    "if spec is None or not spec.origin:",
    "    raise SystemExit(1)",
    "print(pathlib.Path(spec.origin).resolve().parent)"
  ].join("\n");

  const result = runCommand("python", ["-c", pythonScript]);
  const resolvedPath = String(result.stdout || "").trim();
  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    throw new Error(`Unable to resolve package path for ${packageName}`);
  }
  return resolvedPath;
}

function getHelperExtraDataArgs() {
  const playwrightPath = resolvePythonPackagePath("playwright");
  const playwrightDriverPath = path.join(playwrightPath, "driver");
  if (!fs.existsSync(playwrightDriverPath)) {
    throw new Error(`Playwright driver directory not found: ${playwrightDriverPath}`);
  }

  return [
    "--collect-data",
    "playwright",
    "--add-data",
    `${playwrightDriverPath};playwright\\driver`
  ];
}

function buildHelper(helper) {
  if (!fs.existsSync(helper.scriptPath)) {
    throw new Error(`Helper script not found: ${helper.scriptPath}`);
  }

  const args = [
    "-m",
    "PyInstaller",
    "--noconfirm",
    "--clean",
    "--onedir",
    "--name",
    helper.name,
    "--distpath",
    DIST_ROOT,
    "--workpath",
    path.join(WORK_ROOT, helper.name),
    "--specpath",
    SPEC_ROOT,
    ...getHelperExtraDataArgs(),
    ...helper.extraArgs,
    helper.scriptPath
  ];

  console.log(`Building ${helper.name} helper bundle`);
  const result = spawnSync("python", args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Failed to build ${helper.name} helper bundle`);
  }

  const outputDir = path.join(DIST_ROOT, helper.name);
  const outputExePath = path.join(outputDir, `${helper.name}.exe`);
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Expected helper bundle directory was not created: ${outputDir}`);
  }

  if (!fs.existsSync(outputExePath)) {
    throw new Error(`Expected helper executable was not created: ${outputExePath}`);
  }

  verifyHelperBundle(outputDir);
}

function verifyHelperBundle(outputDir) {
  const requiredFiles = [
    path.join(outputDir, "_internal", "playwright", "driver", "node.exe"),
    path.join(outputDir, "_internal", "playwright", "driver", "package", "cli.js")
  ];

  const missingFiles = requiredFiles.filter((filePath) => !fs.existsSync(filePath));
  if (missingFiles.length > 0) {
    throw new Error(
      `Playwright runtime files are missing from helper bundle:\n${missingFiles.join("\n")}`
    );
  }
}
