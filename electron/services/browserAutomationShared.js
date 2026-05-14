const fsPromises = require("fs/promises");
const path = require("path");

const DEFAULT_BROWSER_LAUNCH_ARGS = [
  "--start-maximized",
  "--disable-blink-features=AutomationControlled",
  "--disable-infobars",
  "--no-default-browser-check",
  "--no-first-run",
  "--disable-features=Translate,IsolateOrigins,site-per-process,AutomationControlled",
  "--disable-dev-shm-usage",
  "--disable-component-extensions-with-background-pages"
];

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
      window.chrome.loadTimes = function () { return { commitLoadTime: Date.now() / 1000, finishDocumentLoadTime: Date.now() / 1000, finishLoadTime: Date.now() / 1000, firstPaintAfterLoadTime: 0, firstPaintTime: Date.now() / 1000, navigationType: 'Other', requestTime: Date.now() / 1000, startLoadTime: Date.now() / 1000, wasAlternateProtocolAvailable: false, wasFetchedViaSpdy: true }; };
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

function createAutomationError(message, code, cause = null) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
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

async function injectCookiesAndOpenPage(options = {}) {
  const context = options.context;
  const cookies = Array.isArray(options.cookies) ? options.cookies.filter(Boolean) : [];
  const targetUrl = String(options.targetUrl || "").trim();
  const browserTimeoutMs = Number(options.browserTimeoutMs) > 0 ? Number(options.browserTimeoutMs) : 60000;
  const pageTimeoutMs = Number(options.pageTimeoutMs) > 0 ? Number(options.pageTimeoutMs) : 15000;
  const timeoutCode = String(options.timeoutCode || "BROWSER_TIMEOUT").trim() || "BROWSER_TIMEOUT";

  if (!context) {
    throw createAutomationError("浏览器上下文不可用，无法注入 cookies", "BROWSER_CONTEXT_MISSING");
  }

  if (!cookies.length) {
    throw createAutomationError("没有可注入的 cookies", "COOKIE_PARSE_FAILED");
  }

  await withTimeout(
    context.clearCookies(),
    browserTimeoutMs,
    () => createAutomationError(
      options.clearTimeoutMessage || "清理旧 cookies 超时，请稍后重试",
      timeoutCode
    )
  );

  await withTimeout(
    context.addCookies(cookies),
    browserTimeoutMs,
    () => createAutomationError(
      options.injectTimeoutMessage || "注入 cookies 超时，请稍后重试",
      timeoutCode
    )
  );

  const page = await withTimeout(
    context.newPage(),
    browserTimeoutMs,
    () => createAutomationError(
      options.pageTimeoutMessage || "创建浏览器标签页超时，请稍后重试",
      timeoutCode
    )
  );

  await page.bringToFront().catch(() => {});

  if (targetUrl) {
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: pageTimeoutMs
    }).catch(() => {});
    await page.waitForLoadState("domcontentloaded", {
      timeout: pageTimeoutMs
    }).catch(() => {});
  }

  return page;
}

module.exports = {
  ANTI_DETECTION_INIT_SCRIPT,
  createAutomationError,
  DEFAULT_BROWSER_LAUNCH_ARGS,
  injectCookiesAndOpenPage,
  parseCookieString,
  resolveBrowserExecutablePath,
  sanitizePathSegment,
  withTimeout
};
