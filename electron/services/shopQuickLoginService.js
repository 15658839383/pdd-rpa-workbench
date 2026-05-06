const fsPromises = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const { app } = require("electron");

const {
  buildPythonEnv,
  resolvePackagedHelperPath,
  resolvePythonRunner,
  resolveScriptPath
} = require("./externalTooling");

const DEFAULT_TIMEOUT_MS = 60000;
const QUICK_LOGIN_HELPER_FILE_NAME = "shop-quick-login.exe";
const QUICK_LOGIN_SCRIPT_RELATIVE_PATH = path.join("tools", "店铺一键登录", "拼多多cookie一键登录.py");

async function quickLoginShopByCookie(payload = {}) {
  const shopCode = String(payload.shopCode || "").trim();
  const shopName = String(payload.shopName || "").trim();
  const cookie1 = String(payload.cookie1 || "").trim();
  const profileRoot = String(payload.profileRoot || "").trim();

  if (!shopCode) {
    throw createError("缺少店铺编号，无法执行一键登录", "SHOP_CODE_REQUIRED");
  }

  if (!cookie1) {
    throw createError("该店铺缺少 cookie1，无法执行一键登录", "COOKIE_MISSING");
  }

  if (!profileRoot) {
    throw createError("未配置浏览器资料目录，无法执行一键登录", "PROFILE_ROOT_MISSING");
  }

  const normalizedProfileRoot = path.resolve(profileRoot);
  const input = {
    shopCode,
    shopName,
    cookie1,
    profileRoot: normalizedProfileRoot
  };

  await fsPromises.mkdir(normalizedProfileRoot, { recursive: true });

  const helperPath = resolvePackagedHelperPath(QUICK_LOGIN_HELPER_FILE_NAME);
  if (helperPath) {
    return runQuickLoginProcess({
      command: helperPath,
      args: [],
      input,
      processLabel: "一键登录辅助程序",
      env: buildPythonEnv()
    });
  }

  if (app?.isPackaged) {
    throw createError("未找到内置一键登录辅助程序，请重新安装发布版", "HELPER_NOT_FOUND");
  }

  const scriptPath = resolveScriptPath(QUICK_LOGIN_SCRIPT_RELATIVE_PATH);
  if (!scriptPath) {
    throw createError("未找到一键登录脚本", "SCRIPT_NOT_FOUND");
  }

  const runner = resolvePythonRunner(createError);
  return runQuickLoginProcess({
    command: runner.command,
    args: [...runner.args, scriptPath],
    input,
    processLabel: "一键登录脚本",
    env: buildPythonEnv()
  });
}

function runQuickLoginProcess({ command, args, input, processLabel, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: env || process.env
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutHandle);
      callback();
    };

    const timeoutHandle = setTimeout(() => {
      finish(() => {
        child.kill();
        reject(createError("一键登录执行超时，请稍后重试", "QUICK_LOGIN_TIMEOUT"));
      });
    }, DEFAULT_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (error) => {
      finish(() => {
        reject(createError(`${processLabel}启动失败`, "SCRIPT_EXEC_FAILED", error));
      });
    });

    child.on("close", (code) => {
      finish(() => {
        const trimmedStdout = stdout.trim();
        if (!trimmedStdout) {
          reject(createError(
            stderr.trim() || `${processLabel}没有返回结果（退出码 ${code ?? "null"}）`,
            "SCRIPT_BAD_OUTPUT"
          ));
          return;
        }

        let result;
        try {
          result = JSON.parse(trimmedStdout);
        } catch (error) {
          reject(createError(
            `${processLabel}返回了无法解析的数据：${trimmedStdout.slice(0, 240)}`,
            "SCRIPT_BAD_OUTPUT",
            error
          ));
          return;
        }

        if (!result?.ok) {
          reject(createError(
            String(result?.message || result?.error?.message || "一键登录失败").trim(),
            String(result?.code || result?.error?.code || "QUICK_LOGIN_FAILED").trim()
          ));
          return;
        }

        resolve({
          ok: true,
          shopCode: String(result.shopCode || input.shopCode).trim(),
          shopName: String(result.shopName || input.shopName || input.shopCode).trim(),
          launchedAt: String(result.launchedAt || new Date().toISOString()).trim(),
          message: String(result.message || "已打开独立浏览器并注入最新 cookies").trim()
        });
      });
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

function createError(message, code, cause = null) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

module.exports = {
  quickLoginShopByCookie
};
