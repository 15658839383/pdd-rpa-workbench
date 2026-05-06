const fs = require("fs/promises");
const path = require("path");

const MIGRATION_STATE_FILE = ".workspace-migration.json";
const WORKSPACE_BOOTSTRAP_CONFIG = {
  defaultTemplateId: null,
  currentTemplateId: null
};
const INSTALLED_WORKSPACE_APP_DIR = "宜承多多工作台";
const MIGRATION_HINT_NAMES = [
  "config.json",
  "templates",
  "assets",
  "auth-session.json",
  "login-credentials.json",
  "remembered-credentials.json"
];

async function ensureDirectory(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getPathStats(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

function resolvePortableExecutableDir() {
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

function normalizeCliWorkspaceRoot(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  return path.resolve(normalized);
}

function resolveCliWorkspaceRoot(argv = []) {
  const args = Array.isArray(argv) ? argv : [];

  for (let index = 0; index < args.length; index += 1) {
    const current = String(args[index] || "").trim();
    if (!current) {
      continue;
    }

    if (current === "--workspace-root") {
      return normalizeCliWorkspaceRoot(args[index + 1]);
    }

    if (current.startsWith("--workspace-root=")) {
      return normalizeCliWorkspaceRoot(current.slice("--workspace-root=".length));
    }
  }

  return "";
}

function resolveInstalledWorkspaceRoot(app) {
  const localAppData = String(process.env.LOCALAPPDATA || "").trim();
  const baseDir = localAppData || app.getPath("appData");
  return path.join(baseDir, INSTALLED_WORKSPACE_APP_DIR, "data");
}

function resolveWorkspaceRoot(app, options = {}) {
  const cliWorkspaceRoot = normalizeCliWorkspaceRoot(
    options.cliWorkspaceRoot || resolveCliWorkspaceRoot(process.argv)
  );
  if (cliWorkspaceRoot) {
    return cliWorkspaceRoot;
  }

  const portableExecutableDir = resolvePortableExecutableDir();
  if (portableExecutableDir) {
    return path.join(portableExecutableDir, "data");
  }

  if (app.isPackaged) {
    return resolveInstalledWorkspaceRoot(app);
  }

  return path.join(app.getAppPath(), "data");
}

function buildWorkspacePaths(root) {
  const normalizedRoot = path.resolve(root);
  const templates = path.join(normalizedRoot, "templates");
  const assets = path.join(normalizedRoot, "assets");
  const browserProfile = path.join(normalizedRoot, "browser-profile-playwright");
  const browserProfileCookieLogin = path.join(normalizedRoot, "browser-profile-cookie-login");
  const logs = path.join(normalizedRoot, "logs");
  const configPath = path.join(normalizedRoot, "config.json");
  const credentialsPath = path.join(normalizedRoot, "login-credentials.json");
  const migrationStatePath = path.join(normalizedRoot, MIGRATION_STATE_FILE);

  return {
    root: normalizedRoot,
    templates,
    assets,
    browserProfile,
    browserProfileCookieLogin,
    logs,
    configPath,
    credentialsPath,
    migrationStatePath,
    publicPaths: {
      root: normalizedRoot,
      templates,
      assets,
      browserProfile,
      browserProfileCookieLogin,
      logs,
      credentialsPath
    }
  };
}

async function ensureWorkspace(app, options = {}) {
  const root = resolveWorkspaceRoot(app, options);
  const workspacePaths = buildWorkspacePaths(root);

  await Promise.all([
    ensureDirectory(workspacePaths.root),
    ensureDirectory(workspacePaths.templates),
    ensureDirectory(workspacePaths.assets),
    ensureDirectory(workspacePaths.browserProfile),
    ensureDirectory(workspacePaths.browserProfileCookieLogin),
    ensureDirectory(workspacePaths.logs)
  ]);

  try {
    await fs.access(workspacePaths.configPath);
  } catch {
    await fs.writeFile(
      workspacePaths.configPath,
      JSON.stringify(
        {
          ...WORKSPACE_BOOTSTRAP_CONFIG,
          updatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
  }

  return workspacePaths;
}

async function isWorkspaceEmpty(root) {
  if (!await pathExists(root)) {
    return true;
  }

  const entries = await fs.readdir(root).catch(() => []);
  const meaningfulEntries = entries.filter((entry) => {
    return String(entry || "").trim() && entry !== MIGRATION_STATE_FILE;
  });
  return meaningfulEntries.length === 0;
}

async function detectWorkspaceMigrationState(root) {
  const migrationStatePath = path.join(root, MIGRATION_STATE_FILE);
  try {
    const raw = JSON.parse(await fs.readFile(migrationStatePath, "utf-8"));
    return {
      completed: raw?.completed === true,
      skipped: raw?.skipped === true,
      sourceRoot: typeof raw?.sourceRoot === "string" ? raw.sourceRoot : "",
      updatedAt: typeof raw?.updatedAt === "string" ? raw.updatedAt : ""
    };
  } catch {
    return {
      completed: false,
      skipped: false,
      sourceRoot: "",
      updatedAt: ""
    };
  }
}

async function markWorkspaceMigrationState(root, payload = {}) {
  await ensureDirectory(root);
  await fs.writeFile(
    path.join(root, MIGRATION_STATE_FILE),
    JSON.stringify(
      {
        completed: payload.completed === true,
        skipped: payload.skipped === true,
        sourceRoot: String(payload.sourceRoot || "").trim(),
        updatedAt: new Date().toISOString()
      },
      null,
      2
    ),
    "utf-8"
  );
}

async function getWorkspacePreflight(app, options = {}) {
  const cliWorkspaceRoot = normalizeCliWorkspaceRoot(
    options.cliWorkspaceRoot || resolveCliWorkspaceRoot(process.argv)
  );
  const root = resolveWorkspaceRoot(app, {
    cliWorkspaceRoot
  });
  const workspacePaths = buildWorkspacePaths(root);
  const migrationState = await detectWorkspaceMigrationState(root);
  const empty = await isWorkspaceEmpty(root);
  const portableExecutableDir = resolvePortableExecutableDir();

  const shouldPromptForMigration = app.isPackaged
    && !cliWorkspaceRoot
    && !portableExecutableDir
    && empty
    && !migrationState.completed
    && !migrationState.skipped;

  return {
    root,
    workspace: workspacePaths,
    cliWorkspaceRoot,
    portableExecutableDir,
    migrationState,
    isEmpty: empty,
    shouldPromptForMigration
  };
}

async function validateLegacyWorkspaceRoot(root) {
  const normalizedRoot = path.resolve(String(root || "").trim());
  if (!normalizedRoot) {
    return {
      ok: false,
      message: "请选择旧便携版的 data 目录"
    };
  }

  const rootStats = await getPathStats(normalizedRoot);
  if (!rootStats || !rootStats.isDirectory()) {
    return {
      ok: false,
      message: "所选路径不是有效目录，请重新选择旧便携版的 data 目录"
    };
  }

  const matchedHints = [];
  for (const name of MIGRATION_HINT_NAMES) {
    if (await pathExists(path.join(normalizedRoot, name))) {
      matchedHints.push(name);
    }
  }

  if (matchedHints.length === 0) {
    return {
      ok: false,
      message: "所选目录不像旧工作区 data 目录，请重新选择"
    };
  }

  return {
    ok: true,
    root: normalizedRoot,
    matchedHints
  };
}

async function copyDirectoryRecursive(sourceRoot, targetRoot) {
  await ensureDirectory(targetRoot);
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const targetPath = path.join(targetRoot, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, targetPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const realPath = await fs.realpath(sourcePath);
      const stats = await fs.stat(realPath);
      if (stats.isDirectory()) {
        await copyDirectoryRecursive(realPath, targetPath);
      } else {
        await ensureDirectory(path.dirname(targetPath));
        await fs.copyFile(realPath, targetPath);
      }
      continue;
    }

    await ensureDirectory(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
  }
}

function normalizePathForComparison(targetPath) {
  const resolved = path.resolve(String(targetPath || "").trim());
  return process.platform === "win32"
    ? resolved.replace(/[\\\/]+$/, "").toLowerCase()
    : resolved.replace(/[\\\/]+$/, "");
}

function isSameOrNestedPath(basePath, targetPath) {
  const normalizedBase = normalizePathForComparison(basePath);
  const normalizedTarget = normalizePathForComparison(targetPath);
  return normalizedTarget === normalizedBase || normalizedTarget.startsWith(`${normalizedBase}${path.sep}`);
}

async function migrateLegacyWorkspace({ sourceRoot, targetRoot }) {
  const validation = await validateLegacyWorkspaceRoot(sourceRoot);
  if (!validation.ok) {
    const error = new Error(validation.message);
    error.code = "INVALID_LEGACY_WORKSPACE";
    throw error;
  }

  const normalizedTargetRoot = path.resolve(String(targetRoot || "").trim());
  if (!normalizedTargetRoot) {
    const error = new Error("当前安装版工作区目录无效，无法执行迁移");
    error.code = "INVALID_TARGET_WORKSPACE";
    throw error;
  }

  if (
    isSameOrNestedPath(validation.root, normalizedTargetRoot)
    || isSameOrNestedPath(normalizedTargetRoot, validation.root)
  ) {
    const error = new Error("所选旧 data 目录不能与当前安装版工作区相同，也不能互为父子目录");
    error.code = "INVALID_LEGACY_WORKSPACE";
    throw error;
  }

  const targetStats = await getPathStats(normalizedTargetRoot);
  if (targetStats && !targetStats.isDirectory()) {
    const error = new Error("当前安装版工作区路径不是目录，无法执行迁移");
    error.code = "INVALID_TARGET_WORKSPACE";
    throw error;
  }

  const targetIsEmpty = await isWorkspaceEmpty(normalizedTargetRoot);
  if (targetStats && !targetIsEmpty) {
    const error = new Error("当前安装版工作区已经有内容，无法执行首次迁移");
    error.code = "TARGET_WORKSPACE_NOT_EMPTY";
    throw error;
  }

  await ensureDirectory(path.dirname(normalizedTargetRoot));
  const tempTargetRoot = path.join(
    path.dirname(normalizedTargetRoot),
    `${path.basename(normalizedTargetRoot)}.migration-${Date.now()}`
  );

  try {
    await copyDirectoryRecursive(validation.root, tempTargetRoot);
    await fs.rm(normalizedTargetRoot, { recursive: true, force: true });
    await fs.rename(tempTargetRoot, normalizedTargetRoot);
  } catch (error) {
    await fs.rm(tempTargetRoot, { recursive: true, force: true }).catch(() => undefined);
    const wrapped = new Error(
      "旧数据复制失败，请先关闭旧便携版和正在占用该资料目录的浏览器后重试"
    );
    wrapped.code = "LEGACY_WORKSPACE_COPY_FAILED";
    wrapped.cause = error;
    throw wrapped;
  }

  return validation;
}

module.exports = {
  MIGRATION_STATE_FILE,
  buildWorkspacePaths,
  detectWorkspaceMigrationState,
  ensureWorkspace,
  getWorkspacePreflight,
  markWorkspaceMigrationState,
  migrateLegacyWorkspace,
  resolveCliWorkspaceRoot,
  resolvePortableExecutableDir,
  resolveWorkspaceRoot,
  validateLegacyWorkspaceRoot
};
