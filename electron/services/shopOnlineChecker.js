const path = require("path");
const { spawn } = require("child_process");
const { app } = require("electron");

const {
  buildPythonEnv,
  resolvePackagedHelperPath,
  resolvePythonRunner,
  resolveScriptPath
} = require("./externalTooling");

const DEFAULT_TIMEOUT_MS = 10000;
const ONLINE_CHECK_HELPER_FILE_NAME = "shop-online-check.exe";
const COOKIE_CHECK_SCRIPT_RELATIVE_PATH = path.join("tools", "检查是否登录状态是否正常", "检查cookies状态.py");
const ONLINE_CHECK_URL = "https://mms.pinduoduo.com/vodka/v2/mms/query/display/mall/goodsCount";
const ANTI_CONTENT_URL = "http://106.75.215.11:9000/api/0as";

async function checkShopOnline(cookie1) {
  try {
    const externalResult = await runExternalCheck(cookie1);
    if (externalResult && typeof externalResult === "object") {
      return externalResult;
    }
  } catch (error) {
    if (!isRecoverableExternalCheckError(error)) {
      throw error;
    }
  }

  return runNativeCheck(cookie1);
}

async function runExternalCheck(cookie1) {
  const helperPath = resolvePackagedHelperPath(ONLINE_CHECK_HELPER_FILE_NAME);
  if (helperPath) {
    return runJsonCheckProcess({
      command: helperPath,
      args: [],
      input: { cookie1: String(cookie1 || "") },
      processLabel: "在线检查辅助程序",
      env: buildPythonEnv()
    });
  }

  if (app?.isPackaged) {
    throw createError("未找到内置在线检查辅助程序", "HELPER_NOT_FOUND");
  }

  const scriptPath = resolveScriptPath(COOKIE_CHECK_SCRIPT_RELATIVE_PATH);
  if (!scriptPath) {
    throw createError("未找到检查在线状态脚本", "SCRIPT_NOT_FOUND");
  }

  const runner = resolvePythonRunner(createError);
  return runJsonCheckProcess({
    command: runner.command,
    args: [...runner.args, scriptPath],
    input: { cookie1: String(cookie1 || "") },
    processLabel: "在线检查脚本",
    env: buildPythonEnv()
  });
}

async function runJsonCheckProcess({ command, args, input, processLabel, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: env || process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (error) => {
      reject(createError(`${processLabel}启动失败`, "SCRIPT_EXEC_FAILED", error));
    });

    child.on("close", (code) => {
      const trimmedStdout = stdout.trim();
      if (!trimmedStdout) {
        reject(createError(stderr.trim() || `${processLabel}没有返回结果（退出码 ${code ?? "null"}）`, "SCRIPT_BAD_OUTPUT"));
        return;
      }

      try {
        resolve(JSON.parse(trimmedStdout));
      } catch (error) {
        reject(createError(`${processLabel}返回了无法解析的数据：${trimmedStdout.slice(0, 240)}`, "SCRIPT_BAD_OUTPUT", error));
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

async function runNativeCheck(cookie1) {
  const normalizedCookie = String(cookie1 || "").trim();
  if (!normalizedCookie) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      message: "该店铺缺少 cookie1，无法检查在线状态"
    };
  }

  const etagMatch = normalizedCookie.match(/rckk=([^;]+)/);
  if (!etagMatch?.[1]) {
    return {
      ok: false,
      code: "ETAG_MISSING",
      message: "该店铺的 cookie1 中缺少 rckk，无法检查在线状态"
    };
  }

  const antiContentResponse = await requestJson(ANTI_CONTENT_URL, {
    headers: {
      accept: "application/json"
    }
  });
  const antiContent = antiContentResponse.payload?.data;

  if (!antiContent) {
    return {
      ok: false,
      code: "ANTI_CONTENT_MISSING",
      message: "未拿到 anti-content，无法完成在线检查",
      statusCode: antiContentResponse.statusCode,
      payload: antiContentResponse.payload
    };
  }

  const response = await requestJson(ONLINE_CHECK_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "zh-CN,zh;q=0.9",
      "anti-content": String(antiContent),
      "cache-control": "max-age=0",
      "content-type": "application/json",
      etag: etagMatch[1],
      origin: "https://mms.pinduoduo.com",
      priority: "u=1, i",
      referer: "https://mms.pinduoduo.com/orders/list?msfrom=mms_sidenav",
      "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      cookie: normalizedCookie
    },
    body: {
      isSoldOut: false,
      isOnsale: true
    }
  });

  const payload = response.payload;
  const online = Boolean(payload?.success === true && Number(payload?.errorCode) === 1000000);

  return {
    ok: true,
    online,
    message: online
      ? "在线"
      : extractRemoteMessage(payload, response.statusCode >= 400 ? "检查接口返回异常" : "不在线"),
    statusCode: response.statusCode,
    payload
  };
}

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });
    const text = await response.text();
    return {
      statusCode: response.status,
      payload: parseJsonSafely(text)
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createError("在线检查请求超时", "TIMEOUT", error);
    }

    throw createError("在线检查请求失败", "NETWORK_ERROR", error);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function parseJsonSafely(text) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    return null;
  }

  try {
    return JSON.parse(normalizedText);
  } catch {
    return {
      raw: normalizedText
    };
  }
}

function extractRemoteMessage(payload, fallback) {
  if (payload && typeof payload === "object") {
    const candidates = [payload.errorMsg, payload.message, payload.msg, payload.error];
    const match = candidates.find((value) => typeof value === "string" && value.trim());
    if (match) {
      return match.trim();
    }
  }

  return fallback;
}

function isRecoverableExternalCheckError(error) {
  const code = String(error?.code || "").trim();
  return code === "HELPER_NOT_FOUND"
    || code === "SCRIPT_NOT_FOUND"
    || code === "PYTHON_NOT_FOUND"
    || code === "SCRIPT_EXEC_FAILED"
    || code === "SCRIPT_BAD_OUTPUT";
}

function createError(message, code, cause = null) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

module.exports = {
  checkShopOnline
};
