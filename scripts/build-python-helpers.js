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
    name: "shop-quick-login",
    scriptPath: path.join(ROOT_DIR, "tools", "店铺一键登录", "拼多多cookie一键登录.py"),
    extraArgs: ["--collect-all", "DrissionPage"]
  },
  {
    name: "shop-online-check",
    scriptPath: path.join(ROOT_DIR, "tools", "检查是否登录状态是否正常", "检查cookies状态.py"),
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

  console.log("Python helper executables are ready:");
  HELPERS.forEach((helper) => {
    console.log(`- ${path.join(DIST_ROOT, `${helper.name}.exe`)}`);
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

function cleanDirectory(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
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
    "--onefile",
    "--name",
    helper.name,
    "--distpath",
    DIST_ROOT,
    "--workpath",
    path.join(WORK_ROOT, helper.name),
    "--specpath",
    SPEC_ROOT,
    ...helper.extraArgs,
    helper.scriptPath
  ];

  console.log(`Building ${helper.name}.exe`);
  const result = spawnSync("python", args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Failed to build ${helper.name}.exe`);
  }

  const outputPath = path.join(DIST_ROOT, `${helper.name}.exe`);
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Expected output was not created: ${outputPath}`);
  }
}
