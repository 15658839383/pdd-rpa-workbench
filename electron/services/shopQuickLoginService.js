const fsPromises = require("fs/promises");
const path = require("path");
const { chromium } = require("playwright-core");

const LOGIN_URL = "https://mms.pinduoduo.com/home";
const DEFAULT_TIMEOUT_MS = 60000;
const PAGE_READY_TIMEOUT_MS = 15000;
const MMS_COOKIE_NAMES = new Set([
  "_nano_fp",
  "JSESSIONID",
  "PASS_ID",
  "x-visit-time",
  "windows_app_shop_token_23"
]);
const MMS_COOKIE_PREFIXES = [
  "mms_"
];

const ANTI_DETECTION_INIT_SCRIPT = `
(() => {
  try {
    Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
      get: () => undefined,
      configurable: true
    });
  } catch (e) {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
    } catch (_) {}
  }

  try {
    delete Navigator.prototype.webdriver;
  } catch (e) {}

  try {
    if (!window.chrome || typeof window.chrome !== 'object') {
      window.chrome = {};
    }
    if (!window.chrome.runtime) {
      window.chrome.runtime = {
        PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
        PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
        RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
        OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' }
      };
    }
    if (!window.chrome.app) {
      window.chrome.app = { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } };
    }
    if (!window.chrome.csi) {
      window.chrome.csi = function () { return { startE: Date.now(), onloadT: Date.now(), pageT: 0, tran: 15 }; };
    }
    if (!window.chrome.loadTimes) {
      window.chrome.loadTimes = function () { return { commitLoadTime: Date.now() / 1000, finishDocumentLoadTime: Date.now() / 1000, finishLoadTime: Date.now() / 1000, firstPaintAfterLoadTime: 0, firstPaintTime: Date.now() / 1000, navigationType: 'Other', requestTime: Date.now() / 1000, startLoadTime: Date.now() / 1000, wasAlternateProtocolAvailable: false, wasFetchedViaSpdy: true, wasNpnNegotiated: true }; };
    }
  } catch (e) {}

  try {
    const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
    if (originalQuery) {
      window.navigator.permissions.query = function (parameters) {
        if (parameters && parameters.name === 'notifications') {
          return Promise.resolve({ state: typeof Notification !== 'undefined' ? Notification.permission : 'denied' });
        }
        return originalQuery.call(window.navigator.permissions, parameters);
      };
    }
  } catch (e) {}

  try {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en'],
      configurable: true
    });
  } catch (e) {}

  try {
    const fakePlugins = [
      { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => fakePlugins,
      configurable: true
    });
    Object.defineProperty(navigator, 'mimeTypes', {
      get: () => [{ type: 'application/pdf', suffixes: 'pdf', description: '' }],
      configurable: true
    });
  } catch (e) {}

  try {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.call(this, parameter);
    };
  } catch (e) {}
})();
`;

const contextCache = new Map();

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
  await fsPromises.mkdir(normalizedProfileRoot, { recursive: true });

  const cookies = parseCookieString(cookie1);
  if (!cookies.length) {
    throw createError("cookie1 解析后为空，无法执行一键登录", "COOKIE_PARSE_FAILED");
  }

  const profileDir = path.join(normalizedProfileRoot, sanitizePathSegment(shopCode));
  await fsPromises.mkdir(profileDir, { recursive: true });

  const context = await withTimeout(
    getOrCreateContext(profileDir),
    DEFAULT_TIMEOUT_MS,
    () => createError("一键登录启动浏览器超时，请稍后重试", "QUICK_LOGIN_TIMEOUT")
  );

  let page = null;
  try {
    await withTimeout(
      context.clearCookies(),
      DEFAULT_TIMEOUT_MS,
      () => createError("清理旧 cookies 超时，请稍后重试", "QUICK_LOGIN_TIMEOUT")
    );

    await withTimeout(
      context.addCookies(cookies),
      DEFAULT_TIMEOUT_MS,
      () => createError("注入 cookies 超时，请稍后重试", "QUICK_LOGIN_TIMEOUT")
    );

    page = await withTimeout(
      context.newPage(),
      DEFAULT_TIMEOUT_MS,
      () => createError("创建浏览器标签页超时，请稍后重试", "QUICK_LOGIN_TIMEOUT")
    );

    await page.bringToFront().catch(() => {});
    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: PAGE_READY_TIMEOUT_MS
    });
    await page.waitForLoadState("domcontentloaded", {
      timeout: PAGE_READY_TIMEOUT_MS
    }).catch(() => {});

    return {
      ok: true,
      shopCode,
      shopName: shopName || shopCode,
      launchedAt: new Date().toISOString(),
      message: `店铺《${shopName || shopCode}》已打开浏览器并注入最新 cookies`
    };
  } catch (error) {
    if (page && !page.isClosed()) {
      await page.close().catch(() => {});
    }
    throw normalizePlaywrightError(error);
  }
}

function parseCookieString(cookieString) {
  const normalized = String(cookieString || "").trim();
  if (!normalized) {
    return [];
  }

  return normalized.split(";").map((item) => item.trim()).filter(Boolean).map((item) => {
    const separatorIndex = item.indexOf("=");
    if (separatorIndex <= 0) {
      return null;
    }

    const name = item.slice(0, separatorIndex).trim();
    const value = item.slice(separatorIndex + 1).trim();
    if (!name) {
      return null;
    }

    return {
      name,
      value,
      domain: resolveCookieDomain(name),
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "None"
    };
  }).filter(Boolean);
}

function resolveCookieDomain(name) {
  const cookieName = String(name || "").trim();
  if (!cookieName) {
    return ".pinduoduo.com";
  }

  if (MMS_COOKIE_NAMES.has(cookieName)) {
    return "mms.pinduoduo.com";
  }

  if (MMS_COOKIE_PREFIXES.some((prefix) => cookieName.startsWith(prefix))) {
    return "mms.pinduoduo.com";
  }

  return ".pinduoduo.com";
}

function sanitizePathSegment(value) {
  const text = String(value || "").trim() || "unknown-shop";
  const blocked = /[<>:"/\\|?*]/g;
  return text.replace(blocked, "_").trim() || "unknown-shop";
}

async function getOrCreateContext(profileDir) {
  const cacheKey = path.resolve(profileDir);
  const cached = contextCache.get(cacheKey);
  if (cached && !cached.context.isClosed()) {
    return cached.context;
  }

  const executablePath = await resolveBrowserExecutablePath();
  const context = await chromium.launchPersistentContext(cacheKey, {
    channel: executablePath ? undefined : "chrome",
    executablePath: executablePath || undefined,
    headless: false,
    viewport: null,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
      "--no-default-browser-check",
      "--no-first-run",
      "--disable-features=Translate,IsolateOrigins,site-per-process,AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-component-extensions-with-background-pages"
    ]
  });

  try {
    await context.addInitScript(ANTI_DETECTION_INIT_SCRIPT);
  } catch (error) {
    console.warn("[shopQuickLogin] 注入反检测脚本失败：", error?.message || error);
  }

  context.on("close", () => {
    const current = contextCache.get(cacheKey);
    if (current && current.context === context) {
      contextCache.delete(cacheKey);
    }
  });

  contextCache.set(cacheKey, { context });
  return context;
}

async function resolveBrowserExecutablePath() {
  const candidates = [];
  const { ProgramFiles, "ProgramFiles(x86)": programFilesX86, LocalAppData } = process.env;

  if (ProgramFiles) {
    candidates.push(path.join(ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"));
    candidates.push(path.join(ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe"));
  }

  if (programFilesX86) {
    candidates.push(path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"));
    candidates.push(path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"));
  }

  if (LocalAppData) {
    candidates.push(path.join(LocalAppData, "Google", "Chrome", "Application", "chrome.exe"));
    candidates.push(path.join(LocalAppData, "Microsoft", "Edge", "Application", "msedge.exe"));
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      await fsPromises.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return "";
}

function withTimeout(promise, timeoutMs, createTimeoutError) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      reject(createTimeoutError());
    }, timeoutMs);

    Promise.resolve(promise).then((value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve(value);
    }).catch((error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

function normalizePlaywrightError(error) {
  const message = String(error?.message || error || "").trim();
  if (!message) {
    return createError("一键登录失败，请稍后重试", "QUICK_LOGIN_FAILED", error);
  }

  if (message.includes("Executable doesn't exist") || message.includes("browserType.launchPersistentContext")) {
    return createError("未找到可用浏览器，请先安装 Google Chrome", "BROWSER_NOT_FOUND", error);
  }

  if (message.toLowerCase().includes("timeout")) {
    return createError("一键登录执行超时，请稍后重试", "QUICK_LOGIN_TIMEOUT", error);
  }

  return createError(`一键登录失败：${message}`, "QUICK_LOGIN_FAILED", error);
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
