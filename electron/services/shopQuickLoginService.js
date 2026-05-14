const fsPromises = require("fs/promises");
const path = require("path");
const { screen } = require("electron");
const { chromium } = require("playwright-core");
const {
  ANTI_DETECTION_INIT_SCRIPT,
  createAutomationError,
  DEFAULT_BROWSER_LAUNCH_ARGS,
  injectCookiesAndOpenPage,
  parseCookieString,
  resolveBrowserExecutablePath,
  sanitizePathSegment,
  withTimeout
} = require("./browserAutomationShared");

const LOGIN_URL = "https://mms.pinduoduo.com/home";
const DEFAULT_TIMEOUT_MS = 60000;
const PAGE_READY_TIMEOUT_MS = 15000;
const contextCache = new Map();

async function quickLoginShopByCookie(payload = {}) {
  const shopCode = String(payload.shopCode || "").trim();
  const shopName = String(payload.shopName || "").trim();
  const cookie1 = String(payload.cookie1 || "").trim();
  const profileRoot = String(payload.profileRoot || "").trim();

  if (!shopCode) {
    throw createAutomationError("缺少店铺编号，无法执行一键登录", "SHOP_CODE_REQUIRED");
  }

  if (!cookie1) {
    throw createAutomationError("该店铺缺少 cookie1，无法执行一键登录", "COOKIE_MISSING");
  }

  if (!profileRoot) {
    throw createAutomationError("未配置浏览器资料目录，无法执行一键登录", "PROFILE_ROOT_MISSING");
  }

  const normalizedProfileRoot = path.resolve(profileRoot);
  await fsPromises.mkdir(normalizedProfileRoot, { recursive: true });

  const cookies = parseCookieString(cookie1);
  if (!cookies.length) {
    throw createAutomationError("cookie1 解析后为空，无法执行一键登录", "COOKIE_PARSE_FAILED");
  }

  const profileDir = path.join(normalizedProfileRoot, sanitizePathSegment(shopCode));
  await fsPromises.mkdir(profileDir, { recursive: true });

  const context = await withTimeout(
    getOrCreateContext(profileDir),
    DEFAULT_TIMEOUT_MS,
    () => createAutomationError("一键登录启动浏览器超时，请稍后重试", "QUICK_LOGIN_TIMEOUT")
  );

  let page = null;
  try {
    page = await injectCookiesAndOpenPage({
      context,
      cookies,
      targetUrl: LOGIN_URL,
      browserTimeoutMs: DEFAULT_TIMEOUT_MS,
      pageTimeoutMs: PAGE_READY_TIMEOUT_MS,
      timeoutCode: "QUICK_LOGIN_TIMEOUT",
      clearTimeoutMessage: "清理旧 cookies 超时，请稍后重试",
      injectTimeoutMessage: "注入 cookies 超时，请稍后重试",
      pageTimeoutMessage: "创建浏览器标签页超时，请稍后重试"
    });

    try {
      const client = await page.context().newCDPSession(page);
      const windowInfo = await client.send("Browser.getWindowForTarget");
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      await client.send("Browser.setWindowBounds", {
        windowId: windowInfo.windowId,
        bounds: {
          left: 0,
          top: 0,
          width,
          height,
          windowState: "normal"
        }
      });
    } catch {
      // 忽略窗口调整失败
    }

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

async function getOrCreateContext(profileDir) {
  const cacheKey = path.resolve(profileDir);
  const cached = contextCache.get(cacheKey);
  if (cached && !cached.closed) {
    return cached.context;
  }

  let launchArgs = [...DEFAULT_BROWSER_LAUNCH_ARGS];
  try {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    launchArgs = [
      `--window-size=${width},${height}`,
      "--window-position=0,0",
      ...launchArgs
    ];
  } catch {
    // 忽略屏幕尺寸获取失败
  }

  const executablePath = await resolveBrowserExecutablePath();
  const context = await chromium.launchPersistentContext(cacheKey, {
    channel: executablePath ? undefined : "chrome",
    executablePath: executablePath || undefined,
    headless: false,
    viewport: null,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ["--enable-automation"],
    args: launchArgs
  });

  try {
    await context.addInitScript(ANTI_DETECTION_INIT_SCRIPT);
  } catch (error) {
    console.warn("[shopQuickLogin] 注入反检测脚本失败：", error?.message || error);
  }

  context.on("close", () => {
    const current = contextCache.get(cacheKey);
    if (current && current.context === context) {
      current.closed = true;
      contextCache.delete(cacheKey);
    }
  });

  contextCache.set(cacheKey, { context, closed: false });
  return context;
}

function normalizePlaywrightError(error) {
  const message = String(error?.message || error || "").trim();
  if (!message) {
    return createAutomationError("一键登录失败，请稍后重试", "QUICK_LOGIN_FAILED", error);
  }

  if (message.includes("Executable doesn't exist") || message.includes("browserType.launchPersistentContext")) {
    return createAutomationError("未找到可用浏览器，请先安装 Google Chrome", "BROWSER_NOT_FOUND", error);
  }

  if (message.toLowerCase().includes("timeout")) {
    return createAutomationError("一键登录执行超时，请稍后重试", "QUICK_LOGIN_TIMEOUT", error);
  }

  return createAutomationError(`一键登录失败：${message}`, "QUICK_LOGIN_FAILED", error);
}

module.exports = {
  quickLoginShopByCookie
};
