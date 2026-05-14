import ctypes
import re
import time
import json
import argparse
import urllib.request
import urllib.error
import sys
from tempfile import gettempdir
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
登录首页URL = "https://mms.pinduoduo.com/home"

template_data = {}
商品标题 = ""
商品分类 = ""
商品分类路径 = []
商品分类ID路径 = []
商品三级类目 = ""
商品参考价 = ""
商品两件折扣值 = ""
商品属性 = []
商品主图列表 = []
商品详情图列表 = []
商品SKU类型1 = ""
商品SKU类型2 = ""
商品SKU类型1的名称列表 = []
商品SKU类型2的名称列表 = []
商品SKU列表 = []
店铺编号 = ""
店铺名称 = ""
cookie1 = ""
浏览器资料根目录 = ""


def 输出事件(event_type, message, **extra):
    payload = {
        "type": event_type,
        "message": message,
        **extra
    }
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def 取表单值(form_data, *keys, default=""):
    for key in keys:
        value = form_data.get(key)
        if value is not None and value != "":
            return value
    return default


def 解析JSON数组(value):
    if isinstance(value, list):
        return value
    if value is None or value == "":
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []


def 取图片路径列表(refs):
    return [
        str(item.get("absolutePath") or "").strip()
        for item in (refs if isinstance(refs, list) else [])
        if str(item.get("absolutePath") or "").strip()
    ]


def 提取扁平SKU列表(form_data):
    rows = {}
    pattern = re.compile(r"^goodsSkuDetail\[(\d+)\]\[(specName|groupPrice|singlePrice|stock|outSkuSn)\]$")
    for key, value in (form_data or {}).items():
        match = pattern.match(str(key or ""))
        if not match:
            continue
        index = int(match.group(1))
        field_name = match.group(2)
        rows.setdefault(index, {
            "specName": "",
            "groupPrice": "",
            "singlePrice": "",
            "stock": "",
            "outSkuSn": "",
            "skuThumbAbsolutePath": ""
        })
        rows[index][field_name] = str(value or "").strip()
    return [
        row
        for _index, row in sorted(rows.items())
        if any(str(value or "").strip() for value in row.values())
    ]


def 加载模板数据(input_path):
    global template_data
    global 商品标题, 商品分类, 商品分类路径, 商品分类ID路径, 商品三级类目, 商品参考价, 商品两件折扣值
    global 商品属性, 商品主图列表, 商品详情图列表
    global 商品SKU类型1, 商品SKU类型2, 商品SKU类型1的名称列表, 商品SKU类型2的名称列表, 商品SKU列表

    template_path = Path(input_path).resolve()
    with open(template_path, 'r', encoding='utf-8') as f:
        template_data = json.load(f)

    form_data = template_data.get('formData') or {}
    image_refs = template_data.get('imageRefs') or {}

    商品标题 = str(取表单值(form_data, 'goodsName', 'pddForm_goodsName')).strip()
    商品分类 = str(取表单值(form_data, 'categoryData', 'pddForm_categoryData', 'categoryFullPath')).strip()
    商品分类路径 = [part.strip() for part in 商品分类.split(' > ') if part.strip()]
    商品分类ID路径 = []
    category_id_key_groups = (
        ("一级类目ID", "pddForm_categoryId1", "categoryId1"),
        ("二级类目ID", "pddForm_categoryId2", "categoryId2"),
        ("三级类目ID", "pddForm_categoryId3", "categoryId3"),
        ("末级类目ID", "pddForm_leafCategoryId", "leafCategoryId"),
    )
    for category_id_keys in category_id_key_groups:
        category_id = 取表单值(form_data, *category_id_keys)
        if category_id and str(category_id) not in 商品分类ID路径:
            商品分类ID路径.append(str(category_id))
    if len(商品分类路径) < 3:
        raise RuntimeError(f"商品分类必须至少包含三级：{商品分类 or '未填写'}")
    商品三级类目 = 商品分类路径[-1]
    商品参考价 = str(取表单值(form_data, 'marketPrice', 'pddForm_marketPrice')).strip()
    商品两件折扣值 = str(取表单值(form_data, 'styleCode', 'pddForm_styleCode')).strip()
    商品SKU类型1 = str(取表单值(form_data, 'goodsSpecType1Name', 'pddForm_goodsSpecType1Name')).strip()
    商品SKU类型2 = str(取表单值(form_data, 'goodsSpecType2Name', 'pddForm_goodsSpecType2Name')).strip()
    商品SKU类型1的名称列表 = [str(value).strip() for value in 解析JSON数组(取表单值(form_data, 'goodsSpecType1Values', 'pddForm_goodsSpecType1Values')) if str(value).strip()]
    商品SKU类型2的名称列表 = [str(value).strip() for value in 解析JSON数组(取表单值(form_data, 'goodsSpecType2Values', 'pddForm_goodsSpecType2Values')) if str(value).strip()]
    商品SKU列表 = 解析JSON数组(form_data.get('skuList')) or 提取扁平SKU列表(form_data)

    商品主图列表 = 取图片路径列表(image_refs.get('mainGallery'))
    商品详情图列表 = 取图片路径列表(image_refs.get('detailGallery'))
    商品属性 = []
    for item in 解析JSON数组(form_data.get('attributeList')):
        商品属性.append({
            "refPid": item.get('refPid'),
            "name": item.get('name'),
            "value": item.get('value')
        })

    if not 商品标题:
        raise RuntimeError("工作台商品标题为空，无法自动填充")
    if not 商品主图列表:
        raise RuntimeError("工作台未上传商品轮播图，无法自动填充")

    输出事件(
        "progress",
        f"已读取工作台快照：标题《{商品标题[:20]}》，主图 {len(商品主图列表)} 张，详情图 {len(商品详情图列表)} 张，SKU {len(商品SKU列表)} 行",
        step="input-loaded"
    )


def 查找Chrome路径():
    for chrome_path in (
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        str(Path.home() / r"AppData\Local\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        str(Path.home() / r"AppData\Local\Microsoft\Edge\Application\msedge.exe"),
    ):
        if Path(chrome_path).exists():
            return chrome_path
    return None


MMS_COOKIE_NAMES = {
    "_nano_fp",
    "JSESSIONID",
    "PASS_ID",
    "x-visit-time",
    "windows_app_shop_token_23",
}
MMS_COOKIE_PREFIXES = ("mms_",)
ANTI_DETECTION_INIT_SCRIPT = """
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
"""


def 解析cookie字符串(cookie_string):
    normalized = str(cookie_string or "").strip()
    if not normalized:
        return []

    cookies = []
    for item in normalized.split(";"):
        item = item.strip()
        if not item or "=" not in item:
            continue
        name, value = item.split("=", 1)
        name = name.strip()
        value = value.strip()
        if not name:
            continue
        cookies.append({
            "name": name,
            "value": value,
            "domain": 解析cookie域名(name),
            "path": "/",
            "httpOnly": False,
            "secure": True,
            "sameSite": "None"
        })
    return cookies


def 解析cookie域名(name):
    cookie_name = str(name or "").strip()
    if not cookie_name:
        return ".pinduoduo.com"
    if cookie_name in MMS_COOKIE_NAMES:
        return "mms.pinduoduo.com"
    if any(cookie_name.startswith(prefix) for prefix in MMS_COOKIE_PREFIXES):
        return "mms.pinduoduo.com"
    return ".pinduoduo.com"


def 清理路径片段(value):
    text = str(value or "").strip() or "unknown-shop"
    blocked = '<>:"/\\|?*'
    return "".join("_" if char in blocked else char for char in text).strip() or "unknown-shop"


def 读取浏览器启动参数():
    raw = sys.stdin.read().strip()
    if not raw:
        raise RuntimeError("缺少浏览器启动参数，无法注入 cookies")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError("浏览器启动参数不是合法 JSON") from exc
    if not isinstance(payload, dict):
        raise RuntimeError("浏览器启动参数格式不正确")
    return payload


def 获取屏幕分辨率():
    try:
        user32 = ctypes.windll.user32
        return user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)
    except Exception:
        return 1920, 1080


def 获取浏览器上下文(p, browser_payload):
    global 店铺编号, 店铺名称, cookie1, 浏览器资料根目录

    店铺编号 = str(browser_payload.get("shopCode") or "").strip()
    店铺名称 = str(browser_payload.get("shopName") or "").strip() or 店铺编号 or "未命名店铺"
    cookie1 = str(browser_payload.get("cookie1") or "").strip()
    浏览器资料根目录 = str(browser_payload.get("profileRoot") or "").strip()

    if not 店铺编号:
        raise RuntimeError("缺少店铺编号，无法启动自动填充浏览器")
    if not cookie1:
        raise RuntimeError("该店铺缺少 cookie1，无法启动自动填充浏览器")

    cookies = 解析cookie字符串(cookie1)
    if not cookies:
        raise RuntimeError("cookie1 解析后为空，无法启动自动填充浏览器")

    executable_path = 查找Chrome路径()
    if not executable_path:
        raise RuntimeError("未找到可用浏览器，请先安装 Google Chrome 或 Microsoft Edge")

    profile_root = Path(浏览器资料根目录).resolve() if 浏览器资料根目录 else (Path(gettempdir()) / "pdd-auto-fill-profile")
    profile_dir = profile_root / 清理路径片段(店铺编号)
    profile_dir.mkdir(parents=True, exist_ok=True)

    screen_width, screen_height = 获取屏幕分辨率()
    # 显式指定 viewport：viewport=None 在持久化 context 下会从用户资料目录里读
    # 上次保存的窗口尺寸，把 renderer viewport 锁在 1280x720，导致「OS 窗口最大、
    # 网页内容仍是小窗口」。给一个减去浏览器 chrome 高度的尺寸，让 Playwright
    # 通过 Emulation.setDeviceMetricsOverride 把 renderer viewport 钉到屏幕大小。
    viewport_width = max(1280, screen_width)
    viewport_height = max(720, screen_height - 120)
    context = p.chromium.launch_persistent_context(
        str(profile_dir),
        executable_path=executable_path,
        headless=False,
        viewport={"width": viewport_width, "height": viewport_height},
        screen={"width": screen_width, "height": screen_height},
        ignore_https_errors=True,
        locale="zh-CN",
        timezone_id="Asia/Shanghai",
        accept_downloads=True,
        bypass_csp=True,
        ignore_default_args=["--enable-automation"],
        args=[
            f"--window-size={screen_width},{screen_height}",
            "--window-position=0,0",
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--no-default-browser-check",
            "--no-first-run",
            "--disable-features=Translate,IsolateOrigins,site-per-process,AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-component-extensions-with-background-pages",
        ]
    )
    context.set_default_timeout(30000)
    try:
        context.add_init_script(ANTI_DETECTION_INIT_SCRIPT)
    except Exception as error:
        print(f"注入反检测脚本失败：{error}")
    try:
        context.grant_permissions(["geolocation", "notifications"])
    except Exception:
        pass

    context.clear_cookies()
    context.add_cookies(cookies)
    return context


def 等待加载空闲(page, timeout=15000, networkidle_timeout=1200):
    try:
        page.wait_for_load_state("domcontentloaded", timeout=min(timeout, 20000))
    except PlaywrightTimeoutError:
        pass

    # 拼多多后台常驻请求较多，networkidle 只做短暂辅助等待，避免每次都阻塞几秒。
    try:
        idle_timeout = min(timeout, max(0, int(networkidle_timeout)))
        if idle_timeout > 0:
            page.wait_for_load_state("networkidle", timeout=idle_timeout)
    except PlaywrightTimeoutError:
        pass


def 定位器可见(locator, timeout=1000):
    try:
        if locator.count() <= 0:
            return False
        locator.first.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


def 等待关键元素稳定(page, 页面名称, probes, timeout=60000, stable_ms=600, poll_ms=200):
    deadline = time.time() + timeout / 1000
    stable_since = None
    last_reason = "尚未检测到关键元素"

    while time.time() < deadline:
        try:
            if page.is_closed():
                raise RuntimeError(f"{页面名称} 已关闭")
            ready_state = page.evaluate("() => document.readyState")
        except Exception as exc:
            stable_since = None
            last_reason = f"无法读取页面状态: {exc}"
            page.wait_for_timeout(poll_ms)
            continue

        if ready_state not in ("interactive", "complete"):
            stable_since = None
            last_reason = f"document.readyState={ready_state}"
            page.wait_for_timeout(poll_ms)
            continue

        ready = False
        reason = f"document.readyState={ready_state}"
        for probe in probes:
            try:
                probe_ok, probe_reason = probe()
            except Exception as exc:
                probe_ok, probe_reason = False, str(exc)
            if probe_ok:
                ready = True
                reason = probe_reason or reason
                break
            if probe_reason:
                reason = probe_reason

        last_reason = reason
        if ready:
            if stable_since is None:
                stable_since = time.time()
            elif (time.time() - stable_since) * 1000 >= stable_ms:
                print(f"{页面名称} 已稳定：{reason}")
                return
        else:
            stable_since = None

        page.wait_for_timeout(poll_ms)

    raise RuntimeError(f"{页面名称} 等待稳定超时：{last_reason}；当前 URL: {page.url}")


def 等待工作台首页稳定(page, timeout=90000):
    等待加载空闲(page, timeout=15000, networkidle_timeout=1000)

    def 首页已就绪():
        url = str(page.url or "").strip()
        if not url or "mms.pinduoduo.com" not in url:
            return False, f"当前 URL: {url or 'about:blank'}"

        try:
            body_text = page.locator("body").first.inner_text(timeout=1000).strip()
        except Exception:
            body_text = ""

        if len(body_text) < 20:
            return False, f"首页内容仍为空，当前 URL: {url}"

        return True, f"首页内容已加载，当前 URL: {url}"

    等待关键元素稳定(
        page,
        "工作台首页",
        [首页已就绪],
        timeout=timeout,
        stable_ms=400
    )


def 等待商品列表页稳定(page, timeout=60000):
    等待加载空闲(page, timeout=10000, networkidle_timeout=1000)
    add_button = page.get_by_role("button", name=re.compile(r"发布新商品")).first
    goods_table = page.locator("table").first

    等待关键元素稳定(
        page,
        "商品列表页",
        [
            lambda: (
                定位器可见(add_button, timeout=1000),
                f"发布新商品按钮已可见，当前 URL: {page.url}"
            ),
            lambda: (
                定位器可见(goods_table, timeout=1000),
                f"商品列表表格已可见，当前 URL: {page.url}"
            )
        ],
        timeout=timeout,
        stable_ms=400
    )


def 等待商品编辑页稳定(page2, timeout=90000):
    等待加载空闲(page2, timeout=15000, networkidle_timeout=1200)
    title_input = page2.get_by_role("textbox", name=re.compile(r"商品标题组成")).first
    main_gallery = page2.locator("[id=\"basic.carousel_gallery\"] input[type=\"file\"]").first
    detail_gallery = page2.locator('input[data-tracking-click-viewid="detail_img_localfile_upload"]').first

    等待关键元素稳定(
        page2,
        "商品编辑页",
        [
            lambda: (
                定位器可见(title_input, timeout=1000) and main_gallery.count() > 0,
                f"标题输入框和主图上传区已就绪，当前 URL: {page2.url}"
            ),
            lambda: (
                定位器可见(title_input, timeout=1000) and detail_gallery.count() > 0,
                f"标题输入框和详情图上传区已就绪，当前 URL: {page2.url}"
            )
        ],
        timeout=timeout,
        stable_ms=600
    )


def run():
    with sync_playwright() as p:
        browser_payload = 读取浏览器启动参数()
        browser = 获取浏览器上下文(p, browser_payload)
        
        try:
            page = browser.new_page()

            # 用 CDP 把窗口最大化：先切到 normal 给一个铺满屏幕的 bounds，
            # 再切到 maximized 状态。单独发 normal+bounds 时 Chromium 不会刷新
            # 页面 viewport，会出现「OS 窗口最大、网页内容仍是 1280x720」的现象。
            cdp_client = None
            cdp_window_id = None
            try:
                cdp_client = browser.new_cdp_session(page)
                window_info = cdp_client.send("Browser.getWindowForTarget")
                cdp_window_id = window_info["windowId"]
                screen_width, screen_height = 获取屏幕分辨率()
                cdp_client.send("Browser.setWindowBounds", {
                    "windowId": cdp_window_id,
                    "bounds": {
                        "left": 0,
                        "top": 0,
                        "width": screen_width,
                        "height": screen_height,
                        "windowState": "normal"
                    }
                })
                cdp_client.send("Browser.setWindowBounds", {
                    "windowId": cdp_window_id,
                    "bounds": {"windowState": "maximized"}
                })
            except Exception:
                pass

            page.goto(登录首页URL, timeout=60000, wait_until="domcontentloaded")

            # 诊断日志：采集 Python/CDP/页面 三个层面的尺寸信息，定位 viewport
            # 没有铺满整个窗口的根因
            try:
                py_screen = 获取屏幕分辨率()
                cdp_bounds = None
                if cdp_client and cdp_window_id is not None:
                    try:
                        cdp_bounds = cdp_client.send(
                            "Browser.getWindowBounds",
                            {"windowId": cdp_window_id}
                        ).get("bounds")
                    except Exception as cdp_err:
                        cdp_bounds = f"cdp_err={cdp_err}"
                page_metrics = page.evaluate(
                    "() => ({"
                    "inner: window.innerWidth + 'x' + window.innerHeight,"
                    "outer: window.outerWidth + 'x' + window.outerHeight,"
                    "screen: window.screen.width + 'x' + window.screen.height,"
                    "avail: window.screen.availWidth + 'x' + window.screen.availHeight,"
                    "dpr: window.devicePixelRatio"
                    "})"
                )
                输出事件(
                    "progress",
                    "[viewport-diag] python_screen={py} | cdp_bounds={cdp} | page={pg}".format(
                        py=py_screen,
                        cdp=cdp_bounds,
                        pg=page_metrics
                    ),
                    step="viewport-diag"
                )
            except Exception as diag_err:
                输出事件(
                    "progress",
                    f"[viewport-diag] 采集失败：{diag_err}",
                    step="viewport-diag-failed"
                )

            输出事件("progress", "已连接浏览器，等待工作台首页稳定...", step="wait-home")
            等待工作台首页稳定(page, timeout=90000)
            
            test_example(page)
            输出事件("completed", "自动填充已完成，请人工检查后再发布", step="done")
            try:
                browser.wait_for_event("close", timeout=0)
            except Exception:
                pass
            
        except Exception as e:
            输出事件("error", f"发生错误: {e}", step="failed")
            raise

def 取SKU字段(sku, *field_names):
    for field_name in field_names:
        value = sku.get(field_name)
        if value not in (None, ""):
            return value
    return ""

def 归一化规格文本(value):
    return re.sub(r"\s+", "", str(value or "").replace("／", "/")).strip()


def 模板规格值列表():
    spec_lists = []
    if 商品SKU类型1的名称列表:
        spec_lists.append([str(value).strip() for value in 商品SKU类型1的名称列表 if str(value).strip()])
    if 商品SKU类型2 and 商品SKU类型2的名称列表:
        spec_lists.append([str(value).strip() for value in 商品SKU类型2的名称列表 if str(value).strip()])
    return spec_lists


def 从模板规格值匹配(spec_name):
    spec_name = str(spec_name or "")
    normalized_name = 归一化规格文本(spec_name)
    if not normalized_name:
        return []

    spec_parts = []
    for values in 模板规格值列表():
        matches = [
            value
            for value in values
            if 归一化规格文本(value) and 归一化规格文本(value) in normalized_name
        ]
        if not matches:
            return []
        spec_parts.append(max(matches, key=lambda value: len(归一化规格文本(value))))
    return spec_parts


def 提取SKU规格列表(sku):
    for field_name in ("specValues", "specNames", "specList", "specs"):
        value = sku.get(field_name)
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except:
                value = []
        if isinstance(value, list) and value:
            spec_parts = []
            for item in value:
                if isinstance(item, dict):
                    spec_value = 取SKU字段(item, "value", "name", "specValue", "specName")
                else:
                    spec_value = item
                if spec_value not in (None, ""):
                    spec_parts.append(str(spec_value).strip())
            if spec_parts:
                return spec_parts

    spec_name = str(取SKU字段(sku, "specName", "规格名称", "skuName") or "")
    matched_parts = 从模板规格值匹配(spec_name)
    if matched_parts:
        return matched_parts
    return [part.strip() for part in re.split(r"\s*/\s*", spec_name) if part.strip()]

def 规格组合Key(spec_parts):
    return " / ".join(归一化规格文本(part) for part in spec_parts if 归一化规格文本(part))

def 格式化SKU填充数据(sku):
    spec_parts = 提取SKU规格列表(sku)
    return {
        "specName": str(取SKU字段(sku, "specName", "规格名称", "skuName") or " / ".join(spec_parts)),
        "specParts": spec_parts,
        "specKey": 规格组合Key(spec_parts),
        "stock": str(取SKU字段(sku, "stock", "库存", "skuStock", "quantity")),
        "groupPrice": str(取SKU字段(sku, "groupPrice", "拼单价", "拼单价(元)", "group_price")),
        "singlePrice": str(取SKU字段(sku, "singlePrice", "单买价", "单买价(元)", "price", "single_price")),
        "outSkuSn": str(取SKU字段(sku, "outSkuSn", "规格编码", "skuSn", "skuCode", "outerSkuId", "商家编码")),
        "skuThumbAbsolutePath": str(取SKU字段(
            sku,
            "skuThumbAbsolutePath",
            "skuThumbPath",
            "skuThumb",
            "thumbPath",
            "previewImage",
            "预览图"
        ))
    }


def 填充文本输入框(page2, input_locator, value, timeout=8000):
    value = "" if value is None else str(value)
    last_actual = ""
    last_error = ""
    for attempt in range(3):
        try:
            input_locator.wait_for(state="visible", timeout=timeout)
            input_locator.scroll_into_view_if_needed(timeout=timeout)
            input_locator.click(timeout=timeout)
            input_locator.fill(value, timeout=timeout)
            input_locator.evaluate("""
                (input) => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.blur();
                }
            """)
            page2.wait_for_timeout(150 + attempt * 150)
            last_actual = input_locator.input_value(timeout=5000)
            if str(last_actual).strip() == value.strip():
                return last_actual
        except Exception as exc:
            last_error = str(exc)
            page2.wait_for_timeout(300 + attempt * 200)

        try:
            input_locator.click(timeout=timeout)
            page2.keyboard.press("Control+A")
            page2.keyboard.press("Backspace")
            if value:
                page2.keyboard.type(value, delay=8)
            input_locator.evaluate("""
                (input) => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.blur();
                }
            """)
            page2.wait_for_timeout(200 + attempt * 150)
            last_actual = input_locator.input_value(timeout=5000)
            if str(last_actual).strip() == value.strip():
                return last_actual
        except Exception as exc:
            last_error = str(exc)
            page2.wait_for_timeout(300 + attempt * 200)

    if last_error:
        print(f"输入框填写未完全确认：{last_error[:120]}")
    return last_actual


def 填写规格名称列表(page2, 规格类型名, 名称列表):
    if not 规格类型名 or not 名称列表:
        return

    row = page2.locator(".goods-spec-row", has_text=规格类型名).first
    row.wait_for(state="visible", timeout=30000)

    def input_values():
        inputs = row.get_by_placeholder("请输入规格名称")
        values = []
        for i in range(inputs.count()):
            try:
                values.append(inputs.nth(i).input_value(timeout=1000).strip())
            except Exception:
                values.append("")
        return values

    def find_empty_input():
        inputs = row.get_by_placeholder("请输入规格名称")
        count = inputs.count()
        for i in range(count):
            input_locator = inputs.nth(i)
            try:
                if not input_locator.input_value(timeout=1000).strip():
                    return input_locator
            except Exception:
                pass
        return None

    for name in 名称列表:
        if name in input_values():
            continue

        target = None
        deadline = time.time() + 10
        while time.time() < deadline:
            target = find_empty_input()
            if target:
                break
            page2.wait_for_timeout(200)
        if not target:
            raise RuntimeError(f"没有找到可填写的规格名称输入框：{规格类型名} / {name}")

        target.scroll_into_view_if_needed(timeout=5000)
        填充文本输入框(page2, target, str(name), timeout=5000)
        page2.wait_for_timeout(300)

        deadline = time.time() + 10
        while time.time() < deadline:
            values = input_values()
            if name in values:
                break
            page2.wait_for_timeout(200)
        else:
            raise RuntimeError(f"规格名称填写后没有生效：{规格类型名} / {name}，当前值：{input_values()}")

    print(f"已填写规格 {规格类型名}：{len(名称列表)} 个")


def CSS属性值(value):
    return str(value).replace("\\", "\\\\").replace('"', '\\"')


def 精确选项定位器(page2, value):
    value = str(value or "").strip()
    escaped_text = re.escape(value)
    return page2.locator('[role="option"]:visible').filter(
        has_text=re.compile(rf"^\s*{escaped_text}\s*$")
    )


def 输入框当前值(input_locator, timeout=1500):
    try:
        return input_locator.input_value(timeout=timeout).strip()
    except Exception:
        return ""


def 商品属性值已生效(root_locator, input_locator, value):
    value = str(value or "").strip()
    if not value:
        return True
    if 输入框当前值(input_locator) == value:
        return True
    try:
        text = root_locator.evaluate("(node) => node.innerText || node.textContent || ''")
        return value in str(text or "")
    except Exception:
        return False


def 点击商品属性选项(page2, value, timeout=8000):
    value = str(value or "").strip()
    role_option = page2.get_by_role("option", name=value, exact=True).first
    try:
        role_option.wait_for(state="visible", timeout=timeout)
        role_option.scroll_into_view_if_needed(timeout=timeout)
        page2.wait_for_timeout(250)
        role_option.click(timeout=timeout)
        return
    except Exception:
        pass

    exact_option = 精确选项定位器(page2, value).first
    exact_option.wait_for(state="visible", timeout=timeout)
    exact_option.scroll_into_view_if_needed(timeout=timeout)
    page2.wait_for_timeout(250)
    exact_option.click(timeout=timeout)


def 选择下拉商品属性(page2, root_locator, select_input, item, timeout=12000):
    ref_pid = str(item.get("refPid") or "").strip()
    name = str(item.get("name") or "").strip()
    value = str(item.get("value") or "").strip()
    last_error = ""

    for attempt in range(3):
        try:
            select_input.wait_for(state="visible", timeout=timeout)
            select_input.scroll_into_view_if_needed(timeout=timeout)
            page2.wait_for_timeout(350 + attempt * 250)
            select_input.click(timeout=timeout)
            page2.wait_for_timeout(500 + attempt * 300)

            try:
                select_input.fill("", timeout=5000)
            except Exception:
                page2.keyboard.press("Control+A")
                page2.keyboard.press("Backspace")
            page2.wait_for_timeout(250)

            if value:
                page2.keyboard.type(value, delay=80 + attempt * 20)
            page2.wait_for_timeout(900 + attempt * 450)

            点击商品属性选项(page2, value, timeout=timeout)
            page2.wait_for_timeout(800 + attempt * 300)

            if 商品属性值已生效(root_locator, select_input, value):
                print(f"已选择商品属性：{name or ref_pid}={value}")
                return

            last_error = f"点击选项后未生效，当前值：{输入框当前值(select_input)}"
        except Exception as exc:
            last_error = str(exc)

        try:
            page2.keyboard.press("Escape")
        except Exception:
            pass
        page2.wait_for_timeout(700 + attempt * 300)

    raise RuntimeError(f"商品属性选择失败：{name or ref_pid}={value}，{last_error[:180]}")


def 填写商品属性项(page2, item):
    ref_pid = str(item.get("refPid") or "").strip()
    name = str(item.get("name") or "").strip()
    value = str(item.get("value") or "").strip()
    if not ref_pid or not value:
        return

    root_locator = page2.locator(f'[id="property-list-{CSS属性值(ref_pid)}"]').first
    root_locator.wait_for(state="visible", timeout=15000)
    root_locator.scroll_into_view_if_needed(timeout=15000)
    page2.wait_for_timeout(400)

    select_input = root_locator.get_by_test_id("beast-core-select-htmlInput").first
    if 定位器可见(select_input, timeout=1200):
        选择下拉商品属性(page2, root_locator, select_input, item)
        return

    text_input = root_locator.get_by_test_id("beast-core-input-htmlInput").first
    填充文本输入框(page2, text_input, value, timeout=10000)
    page2.wait_for_timeout(500)
    actual = 输入框当前值(text_input, timeout=3000)
    if actual and actual != value:
        print(f"商品属性文本填写后值不完全一致：{name or ref_pid}，目标={value}，当前={actual}")


def 定位新版商品规格区(page2):
    for selector in ("#newSpec", "#stand_spec"):
        locator = page2.locator(selector).first
        try:
            if locator.count() > 0 and locator.is_visible(timeout=1000):
                return locator
        except Exception:
            pass
    return None


def 新版规格输入占位符(规格类型名):
    normalized = 归一化规格文本(规格类型名)
    if "颜色" in normalized:
        return ["选择或输入主色", "请输入颜色", "颜色分类"]
    if "尺码" in normalized or "尺寸" in normalized:
        return ["自定义尺码", "请输入尺码"]
    return ["请输入规格名称", "请输入规格值", "自定义规格"]


def 新版规格输入选择器(占位符列表):
    selectors = []
    for placeholder in 占位符列表:
        escaped = CSS属性值(placeholder)
        selectors.append(f'input[placeholder="{escaped}"]:visible')
        selectors.append(f'textarea[placeholder="{escaped}"]:visible')
    return ", ".join(selectors)


def 填写新版规格名称列表(page2, 规格类型名, 名称列表):
    if not 规格类型名 or not 名称列表:
        return

    root = 定位新版商品规格区(page2)
    if not root:
        raise RuntimeError("没有找到新版商品规格区域 #newSpec/#stand_spec")

    placeholders = 新版规格输入占位符(规格类型名)
    input_selector = 新版规格输入选择器(placeholders)
    inputs = root.locator(input_selector)
    if inputs.count() == 0:
        raise RuntimeError(f"新版商品规格里没有找到 {规格类型名} 的输入框，占位符: {placeholders}")

    root.scroll_into_view_if_needed(timeout=10000)

    def input_values():
        current_inputs = root.locator(input_selector)
        values = []
        for i in range(current_inputs.count()):
            try:
                value = current_inputs.nth(i).input_value(timeout=1000).strip()
                if value:
                    values.append(value)
            except Exception:
                pass
        return values

    def has_value(name):
        normalized_name = 归一化规格文本(name)
        return any(归一化规格文本(value) == normalized_name for value in input_values())

    def find_empty_input():
        current_inputs = root.locator(input_selector)
        for i in range(current_inputs.count()):
            input_locator = current_inputs.nth(i)
            try:
                if not input_locator.is_enabled(timeout=500):
                    continue
                if not input_locator.input_value(timeout=1000).strip():
                    return input_locator
            except Exception:
                pass
        return None

    for name in 名称列表:
        if has_value(name):
            continue

        target = None
        deadline = time.time() + 15
        while time.time() < deadline:
            target = find_empty_input()
            if target:
                break
            page2.wait_for_timeout(300)
        if not target:
            raise RuntimeError(
                f"没有找到可填写的新版规格输入框：{规格类型名} / {name}，"
                f"当前值：{input_values()[:8]}"
            )

        actual = 填充文本输入框(page2, target, str(name), timeout=8000)
        try:
            page2.keyboard.press("Escape")
        except Exception:
            pass
        page2.wait_for_timeout(350)

        deadline = time.time() + 12
        while time.time() < deadline:
            if has_value(name):
                break
            page2.wait_for_timeout(250)
        else:
            raise RuntimeError(
                f"新版规格名称填写后没有生效：{规格类型名} / {name}，"
                f"输入后值：{actual}，当前值：{input_values()[:8]}"
            )

    print(f"已填写新版规格 {规格类型名}：{len(名称列表)} 个")


def 添加旧版规格类型(page2, index, 规格类型名):
    page2.get_by_role("button", name=re.compile(r"添加规格类型")).first.click()
    textbox_name = "规格类型" if index == 0 else f"规格类型{index + 1}"
    textbox = page2.get_by_role("textbox", name=textbox_name).first
    textbox.click()
    page2.get_by_role("option").filter(has_text=规格类型名).click()
    page2.wait_for_timeout(500)


def 填写旧版商品规格(page2):
    try:
        for _ in range(2):
            delete_link = page2.locator("a").filter(has_text="删除规格类型").first
            if delete_link.count() == 0:
                break
            delete_link.click(timeout=1000)
            page2.get_by_test_id("beast-core-modal-ok-button").click()
            page2.wait_for_timeout(500)
    except Exception:
        pass

    添加旧版规格类型(page2, 0, 商品SKU类型1)
    if 商品SKU类型2 != "":
        添加旧版规格类型(page2, 1, 商品SKU类型2)

    填写规格名称列表(page2, 商品SKU类型1, 商品SKU类型1的名称列表)
    if 商品SKU类型2 != "":
        填写规格名称列表(page2, 商品SKU类型2, 商品SKU类型2的名称列表)


def 填写商品规格(page2):
    new_spec_root = 定位新版商品规格区(page2)
    if new_spec_root:
        print("检测到新版商品规格区域，使用新版规格填写逻辑")
        填写新版规格名称列表(page2, 商品SKU类型1, 商品SKU类型1的名称列表)
        if 商品SKU类型2 != "":
            填写新版规格名称列表(page2, 商品SKU类型2, 商品SKU类型2的名称列表)
        return

    print("检测到旧版商品规格区域，使用旧版规格填写逻辑")
    填写旧版商品规格(page2)


def 填写价格库存(page2):
    sku_values = [格式化SKU填充数据(sku) for sku in 商品SKU列表]
    if not sku_values:
        print("模板里没有 skuList，跳过价格库存填写")
        return

    empty_keys = [sku["specName"] for sku in sku_values if not sku["specKey"]]
    if empty_keys:
        raise RuntimeError(f"以下 SKU 缺少可匹配的规格名称: {empty_keys[:5]}")

    missing_thumb_paths = [
        {"specName": sku["specName"], "skuThumbAbsolutePath": sku["skuThumbAbsolutePath"]}
        for sku in sku_values
        if not sku["skuThumbAbsolutePath"] or not Path(sku["skuThumbAbsolutePath"]).exists()
    ]
    if missing_thumb_paths:
        raise RuntimeError(f"以下 SKU 缺少可上传的预览图文件: {missing_thumb_paths[:5]}")

    duplicate_keys = {}
    for sku in sku_values:
        duplicate_keys.setdefault(sku["specKey"], []).append(sku["specName"])
    duplicate_keys = {key: names for key, names in duplicate_keys.items() if len(names) > 1}
    if duplicate_keys:
        raise RuntimeError(f"skuList 里有重复规格组合，不能唯一匹配: {list(duplicate_keys.values())[:3]}")

    page2.get_by_text("拼单价(元)").wait_for(timeout=30000)
    page2.locator('label.goods-sku-label:has-text("价格及库存")').first.scroll_into_view_if_needed(timeout=10000)
    time.sleep(1)

    sku_by_key = {sku["specKey"]: sku for sku in sku_values}
    table_selector = '[data-e2e-id="e2e-sku-table"]'
    row_selector = f'{table_selector} [data-testid="beast-core-table-middle-tbody"] tr[data-testid="beast-core-table-body-tr"]'
    body_selector = f'{table_selector} [data-testid="beast-core-table-middle-body"]'

    page2.locator(table_selector).wait_for(timeout=30000)

    def same_number(left, right):
        if str(left).strip() == str(right).strip():
            return True
        try:
            return float(left) == float(right)
        except:
            return False

    def fill_row_values(row_locator, sku):
        def normalize_actual(actual):
            return [
                actual.get("stock", ""),
                actual.get("groupPrice", ""),
                actual.get("singlePrice", ""),
                actual.get("outSkuSn", "")
            ]

        last_actual = {}
        last_error = ""
        for attempt in range(3):
            try:
                last_actual = row_locator.evaluate("""
                    (row, sku) => {
                        const setValue = (input, value) => {
                            if (!input) {
                                return "";
                            }
                            const nextValue = value == null ? "" : String(value);
                            input.focus({ preventScroll: true });
                            const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
                            if (descriptor && descriptor.set) {
                                descriptor.set.call(input, nextValue);
                            } else {
                                input.value = nextValue;
                            }
                            const inputEvent = typeof InputEvent === "function"
                                ? new InputEvent("input", {
                                    bubbles: true,
                                    inputType: "insertText",
                                    data: nextValue
                                })
                                : new Event("input", { bubbles: true });
                            input.dispatchEvent(inputEvent);
                            input.dispatchEvent(new Event("change", { bubbles: true }));
                            input.blur();
                            return input.value;
                        };

                        const stockInput = row.querySelector('td.quantity input[data-testid="beast-core-input-htmlInput"]');
                        const priceInputs = Array.from(row.querySelectorAll('input[data-testid="beast-core-inputNumber-htmlInput"]'));
                        const codeInputs = Array.from(row.querySelectorAll('td.sku-input:not(.quantity) input[data-testid="beast-core-input-htmlInput"]'));
                        const missing = [];
                        if (!stockInput) missing.push("库存");
                        if (priceInputs.length < 1) missing.push("拼单价");
                        if (priceInputs.length < 2) missing.push("单买价");
                        if (missing.length) {
                            throw new Error(`SKU 行缺少输入框: ${missing.join(", ")}`);
                        }

                        return {
                            stock: setValue(stockInput, sku.stock),
                            groupPrice: setValue(priceInputs[0], sku.groupPrice),
                            singlePrice: setValue(priceInputs[1], sku.singlePrice),
                            outSkuSn: sku.outSkuSn && codeInputs.length
                                ? setValue(codeInputs[codeInputs.length - 1], sku.outSkuSn)
                                : ""
                        };
                    }
                """, sku)
                page2.wait_for_timeout(150 + attempt * 150)
                verified = row_locator.evaluate("""
                    (row) => {
                        const stockInput = row.querySelector('td.quantity input[data-testid="beast-core-input-htmlInput"]');
                        const priceInputs = Array.from(row.querySelectorAll('input[data-testid="beast-core-inputNumber-htmlInput"]'));
                        const codeInputs = Array.from(row.querySelectorAll('td.sku-input:not(.quantity) input[data-testid="beast-core-input-htmlInput"]'));
                        return {
                            stock: stockInput ? stockInput.value : "",
                            groupPrice: priceInputs[0] ? priceInputs[0].value : "",
                            singlePrice: priceInputs[1] ? priceInputs[1].value : "",
                            outSkuSn: codeInputs.length ? codeInputs[codeInputs.length - 1].value : ""
                        };
                    }
                """)
            except Exception as exc:
                last_error = str(exc)
                page2.wait_for_timeout(200 + attempt * 200)
                continue

            actual = normalize_actual(verified)
            if (
                str(actual[0]).strip() == str(sku["stock"]).strip() and
                same_number(actual[1], sku["groupPrice"]) and
                same_number(actual[2], sku["singlePrice"]) and
                (not sku["outSkuSn"] or str(actual[3]).strip() == str(sku["outSkuSn"]).strip())
            ):
                return actual

        if last_error and not last_actual:
            raise RuntimeError(f"SKU 行填写失败: {last_error[:200]}")
        return normalize_actual(last_actual)

    def preview_uploaded(row_locator):
        return row_locator.evaluate("""
            (row) => {
                const cell = row.querySelector('td.sku-preview-cell, .sku-preview-cell');
                if (!cell) return false;
                const imageNode = cell.querySelector('.MaterialModalButton_imgContainer, [style*="background-image"]');
                if (!imageNode) return false;
                const bg = getComputedStyle(imageNode).backgroundImage || imageNode.style.backgroundImage || "";
                return bg.includes("url(") && !bg.includes("none");
            }
        """)

    def upload_sku_thumb(row_locator, sku):
        thumb_path = sku["skuThumbAbsolutePath"]
        if preview_uploaded(row_locator):
            return {"ok": True, "skipped": True}

        file_inputs = row_locator.locator('td.sku-preview-cell input[type="file"], .sku-preview-cell input[type="file"]')
        if file_inputs.count() == 0:
            return {"ok": False, "error": "没有找到预览图 file input", "path": thumb_path}

        last_error = ""
        for attempt in range(2):
            try:
                file_inputs.first.set_input_files(thumb_path, timeout=30000)
                deadline = time.time() + 25
                while time.time() < deadline:
                    page2.wait_for_timeout(500)
                    if preview_uploaded(row_locator):
                        return {"ok": True, "skipped": False}
                last_error = "上传后没有检测到预览图背景"
            except Exception as exc:
                last_error = str(exc)
                page2.wait_for_timeout(800 + attempt * 500)

        return {"ok": False, "error": last_error[:200], "path": thumb_path}

    def scroll_info():
        return page2.locator(body_selector).evaluate("""
            (body) => {
                const rowSelector = 'tr[data-testid="beast-core-table-body-tr"]';
                const candidates = [body, ...Array.from(body.querySelectorAll('div'))].filter((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll|overlay)/.test(style.overflowY)
                        && node.scrollHeight > node.clientHeight + 2
                        && node.querySelector(rowSelector);
                });
                candidates.sort((a, b) => {
                    const aScrollable = a.scrollHeight - a.clientHeight;
                    const bScrollable = b.scrollHeight - b.clientHeight;
                    return bScrollable - aScrollable;
                });
                const scroller = candidates[0];
                if (!scroller) return null;
                return {
                    top: scroller.scrollTop,
                    height: scroller.clientHeight,
                    scrollHeight: scroller.scrollHeight,
                    maxTop: scroller.scrollHeight - scroller.clientHeight
                };
            }
        """)

    def scroll_to(top):
        return page2.locator(body_selector).evaluate("""
            (body, top) => {
                const rowSelector = 'tr[data-testid="beast-core-table-body-tr"]';
                const candidates = [body, ...Array.from(body.querySelectorAll('div'))].filter((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll|overlay)/.test(style.overflowY)
                        && node.scrollHeight > node.clientHeight + 2
                        && node.querySelector(rowSelector);
                });
                candidates.sort((a, b) => {
                    const aScrollable = a.scrollHeight - a.clientHeight;
                    const bScrollable = b.scrollHeight - b.clientHeight;
                    return bScrollable - aScrollable;
                });
                const scroller = candidates[0];
                if (!scroller) return null;
                scroller.scrollTop = Math.max(0, Math.min(top, scroller.scrollHeight - scroller.clientHeight));
                scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
                return {
                    top: scroller.scrollTop,
                    height: scroller.clientHeight,
                    scrollHeight: scroller.scrollHeight,
                    maxTop: scroller.scrollHeight - scroller.clientHeight
                };
            }
        """, top)

    def row_spec_parts_from_texts(texts, first_spec):
        texts = [str(text or "").strip() for text in texts if str(text or "").strip()]
        if 商品SKU类型2:
            if len(商品SKU类型2的名称列表) == 1 and len(texts) == 1:
                if first_spec and 归一化规格文本(texts[0]) not in {
                    归一化规格文本(value) for value in 商品SKU类型1的名称列表
                }:
                    return [first_spec, texts[0]], first_spec
                return [texts[0], 商品SKU类型2的名称列表[0]], texts[0]
            if len(texts) >= 2:
                return [texts[0], texts[1]], texts[0]
            if len(texts) == 1 and first_spec:
                return [first_spec, texts[0]], first_spec
            return [], first_spec
        return texts[:1], first_spec

    def current_rendered_row_entries():
        return page2.locator(body_selector).evaluate("""
            (body) => {
                const table = body.closest('[data-e2e-id="e2e-sku-table"]');
                const inputRows = Array.from(table.querySelectorAll('[data-testid="beast-core-table-middle-tbody"] tr[data-testid="beast-core-table-body-tr"]'));
                const titleCells = Array.from(table.querySelectorAll('.sku-row-title')).map((cell) => {
                    const rect = cell.getBoundingClientRect();
                    return {
                        cell,
                        text: (cell.innerText || cell.textContent || "").trim(),
                        rect
                    };
                }).filter((item) => item.text && item.rect.width > 0 && item.rect.height > 0);

                const rowVisibleHeight = (rowRect, viewport) => {
                    return Math.min(rowRect.bottom, viewport.bottom) - Math.max(rowRect.top, viewport.top);
                };
                const rowSelector = 'tr[data-testid="beast-core-table-body-tr"]';
                const scrollerCandidates = [body, ...Array.from(body.querySelectorAll('div'))].filter((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll|overlay)/.test(style.overflowY)
                        && node.scrollHeight > node.clientHeight + 2
                        && node.querySelector(rowSelector);
                });
                scrollerCandidates.sort((a, b) => {
                    const aScrollable = a.scrollHeight - a.clientHeight;
                    const bScrollable = b.scrollHeight - b.clientHeight;
                    return bScrollable - aScrollable;
                });
                const scroller = scrollerCandidates[0] || body;
                const viewport = scroller.getBoundingClientRect();

                return inputRows
                    .map((row, index) => {
                        const rect = row.getBoundingClientRect();
                        const centerY = (rect.top + rect.bottom) / 2;
                        const texts = titleCells
                            .filter((item) => {
                                const overlap = Math.min(rect.bottom, item.rect.bottom) - Math.max(rect.top, item.rect.top);
                                return overlap > 2 || (centerY >= item.rect.top - 1 && centerY <= item.rect.bottom + 1);
                            })
                            .sort((a, b) => a.rect.left - b.rect.left)
                            .map((item) => item.text)
                            .filter((text, textIndex, allTexts) => allTexts.indexOf(text) === textIndex);
                        return {
                            index,
                            texts,
                            rowText: (row.innerText || row.textContent || "").replace(/\\s+/g, " ").trim(),
                            top: rect.top,
                            bottom: rect.bottom,
                            height: rect.height,
                            visibleHeight: rowVisibleHeight(rect, viewport)
                        };
                    })
                    .filter((row) => row.height > 0 && row.visibleHeight > 1);
            }
        """)

    scroll_to(0)
    page2.wait_for_timeout(500)

    used_keys = set()
    filled = []
    mismatches = []
    thumb_failures = []
    missing_rows = []
    rendered_row_count = 0
    last_top = -1

    for loop_index in range(160):
        rows = page2.locator(row_selector)
        rendered_entries = current_rendered_row_entries()
        row_count = rows.count()
        rendered_row_count = max(rendered_row_count, len(rendered_entries), row_count)
        first_spec_in_chunk = ""
        used_before = len(used_keys)

        row_entries = []
        for entry in rendered_entries:
            spec_parts, first_spec_in_chunk = row_spec_parts_from_texts(entry.get("texts") or [], first_spec_in_chunk)
            row_entries.append({
                "index": entry.get("index"),
                "specParts": spec_parts,
                "texts": entry.get("texts") or [],
                "rowText": entry.get("rowText") or ""
            })

        for entry in row_entries:
            row_index = entry["index"]
            spec_parts = entry["specParts"]
            if row_index is None or row_index >= row_count:
                continue
            if not spec_parts:
                continue
            key = 规格组合Key(spec_parts)
            if key in used_keys:
                continue

            sku = sku_by_key.get(key)
            if not sku:
                missing_rows.append({
                    "index": row_index,
                    "specParts": spec_parts,
                    "specKey": key,
                    "rowText": re.sub(r"\s+", " ", entry["rowText"])[:120]
                })
                continue

            row_locator = rows.nth(row_index)
            actual = fill_row_values(row_locator, sku)
            thumb_result = upload_sku_thumb(row_locator, sku)

            expected = [sku["stock"], sku["groupPrice"], sku["singlePrice"], sku["outSkuSn"]]
            filled.append({
                "index": row_index,
                "specName": sku["specName"],
                "specParts": spec_parts,
                "specKey": key,
                "values": actual,
                "thumb": thumb_result
            })
            used_keys.add(key)

            ok = (
                str(actual[0]).strip() == str(sku["stock"]).strip() and
                same_number(actual[1], sku["groupPrice"]) and
                same_number(actual[2], sku["singlePrice"]) and
                (not sku["outSkuSn"] or str(actual[3]).strip() == str(sku["outSkuSn"]).strip())
            )
            if not ok:
                mismatches.append({
                    "index": row_index,
                    "specName": sku["specName"],
                    "expected": expected,
                    "actual": actual
                })
            if not thumb_result["ok"]:
                thumb_failures.append({
                    "index": row_index,
                    "specName": sku["specName"],
                    "error": thumb_result.get("error"),
                    "path": thumb_result.get("path")
                })

        if len(used_keys) >= len(sku_values):
            break

        info = scroll_info()
        if not info:
            break
        if info["top"] >= info["maxTop"] and len(used_keys) == used_before:
            break

        step = max(120, int(info["height"] * 0.35))
        next_info = scroll_to(info["top"] + step)
        page2.wait_for_timeout(400)
        if next_info and next_info["top"] == last_top and len(used_keys) == used_before:
            break
        if next_info:
            last_top = next_info["top"]

    unused_skus = [
        {"specName": sku["specName"], "specKey": sku["specKey"]}
        for sku in sku_values
        if sku["specKey"] not in used_keys
    ][:10]

    result = {
        "renderedRowCount": rendered_row_count,
        "skuCount": len(sku_values),
        "filledCount": len(filled),
        "filledSample": filled[:3],
        "missingRows": missing_rows[:10],
        "unusedSkus": unused_skus,
        "mismatches": mismatches[:5],
        "thumbFailures": thumb_failures[:5]
    }

    if result["filledCount"] != len(sku_values) or result["unusedSkus"]:
        raise RuntimeError(
            f"价格库存只匹配填写了 {result['filledCount']} 行，模板有 {len(sku_values)} 个 SKU。"
            f" 未匹配页面行: {result['missingRows']}；未使用SKU: {result['unusedSkus']}"
        )
    if result["mismatches"]:
        raise RuntimeError(f"价格库存填写后校验失败: {result['mismatches']}")
    if result["thumbFailures"]:
        raise RuntimeError(f"SKU 预览图上传失败: {result['thumbFailures']}")

    print(f"已填写价格库存和预览图：{result['filledCount']} 个 SKU")


def 等待商品发布页(page, before_pages, timeout=60000):
    context = page.context
    deadline = time.time() + timeout / 1000

    def page_ready(candidate):
        try:
            return bool(获取商品发布页状态(candidate))
        except Exception:
            return False

    while time.time() < deadline:
        new_candidates = [candidate for candidate in context.pages if candidate not in before_pages]
        candidates = list(new_candidates)

        if page not in candidates and not page.is_closed():
            candidates.append(page)

        if time.time() > deadline - 20:
            candidates.extend([candidate for candidate in context.pages if candidate not in candidates])

        for candidate in candidates:
            if page_ready(candidate):
                candidate.bring_to_front()
                try:
                    candidate.wait_for_load_state("domcontentloaded", timeout=10000)
                except PlaywrightTimeoutError:
                    pass
                等待商品发布页就绪(candidate, timeout=10000)
                return candidate
        page.wait_for_timeout(500)

    page_urls = [candidate.url for candidate in context.pages if not candidate.is_closed()]
    raise RuntimeError(f"点击发布新商品后没有找到商品发布页，当前页面: {page_urls}")


def 打开商品发布页(page):
    page.goto("https://mms.pinduoduo.com/goods/goods_list?msfrom=mms_sidenav", timeout=60000)
    try:
        page.wait_for_load_state("domcontentloaded", timeout=20000)
    except PlaywrightTimeoutError:
        pass

    add_button = page.get_by_role("button", name="发布新商品").first
    add_button.wait_for(state="visible", timeout=60000)
    等待商品列表页稳定(page, timeout=60000)

    before_pages = list(page.context.pages)
    try:
        with page.expect_popup(timeout=5000) as page2_info:
            add_button.click(timeout=10000)
        page2 = page2_info.value
        page2.bring_to_front()
        try:
            page2.wait_for_load_state("domcontentloaded", timeout=20000)
        except PlaywrightTimeoutError:
            pass
        state = 等待商品发布页就绪(page2, timeout=30000)
        if state:
            print(f"发布页已就绪：{state}，URL: {page2.url}")
            return page2
    except PlaywrightTimeoutError:
        print("发布新商品未触发 popup，改为检查当前页/已有新标签页")
    except Exception as exc:
        print(f"发布新商品点击后未拿到 popup：{exc}，改为检查页面列表")

    return 等待商品发布页(page, before_pages, timeout=60000)


def 等待商品编辑页(page2, timeout=60000):
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        try:
            if "/goods/goods_add/index" in (page2.url or ""):
                if page2.locator("[id=\"basic.carousel_gallery\"] input[type=\"file\"]").count() > 0:
                    remaining_timeout = max(5000, int((deadline - time.time()) * 1000))
                    等待商品编辑页稳定(page2, timeout=remaining_timeout)
                    return page2
                if page2.get_by_role("textbox", name=re.compile(r"商品标题组成")).count() > 0:
                    remaining_timeout = max(5000, int((deadline - time.time()) * 1000))
                    等待商品编辑页稳定(page2, timeout=remaining_timeout)
                    return page2
            page2.wait_for_timeout(500)
        except Exception:
            page2.wait_for_timeout(500)
    raise RuntimeError(f"确认分类后没有进入商品编辑页，当前 URL: {page2.url}")


def 等待编辑页分类信息(page2, timeout=20000):
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        try:
            current = 读取已选分类(page2)
            if current:
                return current
            if page2.locator('.category-area .sort-name').count() > 0:
                try:
                    text = page2.locator('.category-area .sort-name').first.inner_text(timeout=1000).strip()
                    if text:
                        return text
                except Exception:
                    pass
            page2.wait_for_timeout(300)
        except Exception:
            page2.wait_for_timeout(300)
    return 读取已选分类(page2)


def 归一化分类文本(value):
    return re.sub(r"\s+", "", str(value or "").replace("＞", ">").replace("》", ">"))


def 清理分类节点文本(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    value = re.sub(r"^[A-Z]\s+", "", value)
    return value


def 商品标题输入框(page2):
    locators = [
        page2.locator('input[placeholder*="商品标题组成"]').first,
        page2.locator('textarea[placeholder*="商品标题组成"]').first,
        page2.locator('input[data-tracking-click-viewid="title_input_area"]').first,
    ]
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator
        except Exception:
            pass
    return page2.locator('input[placeholder*="商品标题"]').first


def 预测页主图输入框(page2):
    locators = [
        page2.locator('input[data-tracking-click-viewid="local_upload"]').first,
        page2.locator('input[data-tracking-click-viewid="carousel_img_localfile_upload"]').first,
        page2.locator('input[type="file"]').first,
    ]
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator
        except Exception:
            pass
    return page2.locator('input[type="file"]').first


def 修改分类链接(page2):
    locators = [
        page2.locator('a[data-tracking-click-viewid="change_cate"]').first,
        page2.locator('a', has_text="修改分类").first,
        page2.get_by_test_id("beast-core-button-link").filter(has_text="修改分类").first,
    ]
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator
        except Exception:
            pass
    return page2.locator("a").filter(has_text="修改分类").first


def 分类选择弹窗(page2):
    return page2.locator('[data-testid="beast-core-modal"]').filter(has_text="选择商品分类").first


def 分类弹窗确认按钮(page2):
    modal = 分类选择弹窗(page2)
    return modal.get_by_role("button", name="确认").first


def 读取已选分类(page2):
    try:
        return page2.evaluate("""
            (targetParts) => {
                const normalize = (text) => (text || "").replace(/\\s+/g, " ").trim();
                const cleanCateText = (text) => normalize(text).replace(/^[A-Z]\\s+/, "");
                const selectedPredictCate = document.querySelector('#selectedCateId [class*="cateItemCard_checked"]');
                if (selectedPredictCate) return cleanCateText(selectedPredictCate.innerText);

                const editCategory = document.querySelector('.category-area .sort-name');
                const changeCate = document.querySelector('[data-tracking-click-viewid="change_cate"]');
                if (editCategory && changeCate) return cleanCateText(editCategory.innerText);

                const selectedItems = Array
                    .from(document.querySelectorAll("#chooseCategory li.content-cat.selected"))
                    .map((item) => cleanCateText((item.querySelector("a.cate") || item).innerText))
                    .filter(Boolean);
                if (selectedItems.length) return selectedItems.join(" > ");

                const bodyText = document.body.innerText || "";
                const marker = "已选分类";
                let markerIndex = bodyText.indexOf(marker);
                while (markerIndex >= 0) {
                    const after = bodyText.slice(markerIndex + marker.length);
                    const lines = after.split(/\\n+/).map(normalize).filter(Boolean);
                    const parts = [];
                    for (const line of lines) {
                        if (line === marker) break;
                        if (line.includes(">")) return line;
                        if (/^(确认发布该类商品|下一步|官方|客服|以图发品|搜索发品)$/.test(line)) break;
                        if (targetParts.includes(line)) parts.push(line);
                    }
                    if (parts.length) return parts.join(" > ");
                    markerIndex = bodyText.indexOf(marker, markerIndex + marker.length);
                }
                return "";
            }
        """, 商品分类路径)
    except Exception:
        return ""


def 当前分类ID路径正确(page2):
    if not 商品分类ID路径:
        return False
    try:
        return page2.evaluate("""
            (ids) => ids.every((id) => {
                const item = document.getElementById("selectedCate" + id);
                return !!item && item.classList.contains("selected");
            })
        """, 商品分类ID路径)
    except Exception:
        return False


def 当前分类正确(page2):
    if 当前分类ID路径正确(page2):
        return True
    selected = 读取已选分类(page2)
    if not selected:
        return False
    return 归一化分类文本(selected) == 归一化分类文本(商品分类)


def 获取商品发布页状态(page2):
    try:
        if page2.is_closed():
            return ""
        url = page2.url or ""
        if "/goods/goods_add/index" in url:
            if page2.locator("[id=\"basic.carousel_gallery\"] input[type=\"file\"]").count() > 0:
                return "edit"
            if page2.locator('.category-area .sort-name').count() > 0:
                return "edit"
            if page2.locator('a[data-tracking-click-viewid="change_cate"]').count() > 0:
                return "edit"
            if page2.get_by_role("textbox", name=re.compile(r"商品标题组成")).count() > 0:
                return "edit"
        if "/goods/category" in url:
            if page2.locator("#chooseCategory").count() > 0:
                return "legacy"
            if page2.locator('input[placeholder="请输入关键词搜索分类"]').count() > 0:
                return "legacy"
            if page2.locator('input[placeholder*="商品标题组成"]').count() > 0:
                return "predict"
            if page2.locator('input[data-tracking-click-viewid="title_input_area"]').count() > 0:
                return "predict"
            if page2.locator('input[data-tracking-click-viewid="local_upload"]').count() > 0:
                return "predict"
            if page2.locator('[data-tracking-viewid="choose_cate"]').count() > 0:
                return "predict"
            if page2.get_by_role("button", name=re.compile(r"下一步\s*[,，]?\s*完善商品信息")).count() > 0:
                return "predict"
    except Exception:
        return ""
    return ""


def 等待商品发布页就绪(page2, timeout=30000):
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        state = 获取商品发布页状态(page2)
        if state:
            return state
        try:
            page2.wait_for_timeout(300)
        except Exception:
            time.sleep(0.3)
    return 获取商品发布页状态(page2)


def 是旧版类目选择页(page2):
    return 获取商品发布页状态(page2) == "legacy"


def 是预测分类流程页(page2):
    return 获取商品发布页状态(page2) == "predict"


def 预测分类手动选择按钮(page2):
    locators = [
        page2.locator('button[data-tracking-viewid="choose_cate_new"]').first,
        page2.get_by_role("button", name="选择分类").first,
        page2.get_by_text("手动选择商品分类", exact=True).first,
    ]
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator
        except Exception:
            pass
    locators = [
        page2.locator("button").filter(has_text="选择分类").first,
        page2.locator("span").filter(has_text="手动选择商品分类").first,
    ]
    for locator in locators:
        try:
            if locator.count() > 0:
                return locator
        except Exception:
            pass
    return page2.locator("span").filter(has_text="手动选择商品分类").first


def 预测分类展开更多推荐(page2):
    button = page2.get_by_role("button", name="查看更多推荐").first
    try:
        if button.count() > 0 and button.is_visible(timeout=1000):
            button.click(timeout=10000)
            page2.wait_for_timeout(1000)
            return True
    except Exception:
        return False
    return False


def 填写预测分类基础信息(page2):
    used_prefill = False
    title_input = 商品标题输入框(page2)
    title_input.wait_for(state="visible", timeout=30000)

    current_title = ""
    try:
        current_title = title_input.input_value(timeout=3000).strip()
    except Exception:
        current_title = ""

    if current_title != str(商品标题).strip():
        title_input.click(timeout=10000)
        title_input.fill(商品标题, timeout=10000)

    if 商品主图列表:
        upload_input = 预测页主图输入框(page2)
        try:
            if upload_input.count() > 0:
                upload_input.set_input_files(商品主图列表[0])
                used_prefill = True
                page2.wait_for_timeout(1500)
        except Exception as exc:
            print(f"预测分类页主图上传失败：{str(exc)[:120]}")

    return used_prefill


def 等待预测分类流程推进(page2, timeout=45000):
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        state = 获取商品发布页状态(page2)
        if state == "edit":
            return "edit"
        if state == "legacy":
            return "legacy"
        if state == "predict":
            return "predict"
        try:
            page2.wait_for_timeout(500)
        except Exception:
            time.sleep(0.5)
    return "timeout"


def 通过预测分类流程进入商品编辑页(page2):
    used_prefill = False
    for _ in range(4):
        current_state = 等待商品发布页就绪(page2, timeout=15000)
        print(f"预测分类流程状态：{current_state or 'unknown'}，URL: {page2.url}")
        if current_state == "edit":
            return 等待商品编辑页(page2, timeout=90000), used_prefill
        if current_state == "legacy":
            break

        if current_state == "predict":
            used_prefill = 填写预测分类基础信息(page2) or used_prefill
            page2.wait_for_timeout(800)

            manual_choose_button = 预测分类手动选择按钮(page2)
            try:
                if manual_choose_button.count() == 0:
                    预测分类展开更多推荐(page2)
                    manual_choose_button = 预测分类手动选择按钮(page2)

                if manual_choose_button.count() > 0 and manual_choose_button.is_visible(timeout=1000):
                    print(f"预测分类页切换到手动选类。URL: {page2.url}")
                    manual_choose_button.click(timeout=10000)
                    next_state = 等待预测分类流程推进(page2, timeout=15000)
                    print(f"手动选类展开后状态：{next_state}，URL: {page2.url}")
                    if next_state == "legacy":
                        break
                    if next_state == "edit":
                        return 等待商品编辑页(page2, timeout=90000), used_prefill
            except Exception as exc:
                print(f"预测分类页切换手动选类失败：{str(exc)[:120]}")

        next_button = 分类确认按钮(page2)
        next_button.wait_for(state="visible", timeout=30000)
        next_button.scroll_into_view_if_needed(timeout=10000)
        print(f"点击预测流程下一步，URL: {page2.url}")
        next_button.click(timeout=30000)

        next_state = 等待预测分类流程推进(page2, timeout=60000)
        print(f"预测流程下一步后状态：{next_state}，URL: {page2.url}")
        if next_state == "edit":
            return 等待商品编辑页(page2, timeout=90000), used_prefill
        if next_state == "legacy":
            break
        if next_state == "timeout":
            raise RuntimeError(f"预测分类流程推进超时，当前 URL: {page2.url}")

    if 获取商品发布页状态(page2) == "legacy":
        return None, used_prefill
    raise RuntimeError(f"预测分类流程结束后仍未进入编辑页，当前 URL: {page2.url}")


def 切换到搜索发品标签(page2):
    search_input = page2.locator('input[placeholder="请输入关键词搜索分类"]').first
    try:
        if search_input.count() > 0 and search_input.is_visible(timeout=1000):
            return
    except Exception:
        pass

    tab_locators = [
        page2.get_by_test_id("beast-core-tab-itemLabel").filter(has_text="搜索发品").first,
        page2.get_by_test_id("beast-core-tab-itemLabel-wrapper").filter(has_text="搜索发品").first,
        page2.get_by_text("搜索发品", exact=True).last,
    ]
    for tab in tab_locators:
        try:
            if tab.count() > 0 and tab.is_visible(timeout=1000):
                tab.click(timeout=5000)
                page2.wait_for_timeout(800)
                break
        except Exception:
            pass

    try:
        search_input.wait_for(state="visible", timeout=10000)
    except PlaywrightTimeoutError:
        pass


def 通过分类ID选择目标分类(page2):
    if not 商品分类ID路径:
        return False

    clicked = False
    for category_id in 商品分类ID路径:
        category_item = page2.locator(f"#selectedCate{category_id}").first
        category_link = category_item.locator("a.cate").first
        try:
            category_link.wait_for(state="attached", timeout=15000)
            category_link.scroll_into_view_if_needed(timeout=10000)
            category_link.click(timeout=10000)
            clicked = True
            try:
                category_item.wait_for(state="attached", timeout=5000)
                page2.locator(f"#selectedCate{category_id}.selected").first.wait_for(state="attached", timeout=5000)
            except PlaywrightTimeoutError:
                pass
            page2.wait_for_timeout(800)
        except Exception as exc:
            print(f"按分类ID选择失败：{category_id}，改用文本兜底。原因：{str(exc)[:120]}")
            return False

    if clicked:
        deadline = time.time() + 10
        while time.time() < deadline:
            if 当前分类正确(page2):
                return True
            page2.wait_for_timeout(300)
    return False


def 分类确认按钮(page2):
    return page2.get_by_role(
        "button",
        name=re.compile(r"(确认发布该类商品|下一步\s*[,，]?\s*完善商品信息)")
    ).first


def 通过搜索选择目标分类(page2):
    def 点击分类链接(part):
        exact_pattern = re.compile(rf"(^|\s){re.escape(part)}$")
        category_link = page2.locator("#chooseCategory a.cate").filter(has_text=exact_pattern).first
        if category_link.count() == 0:
            category_link = page2.locator("a.cate").filter(has_text=exact_pattern).first
        if category_link.count() == 0:
            category_link = page2.locator("#chooseCategory a.cate").filter(has_text=part).first
        if category_link.count() == 0:
            category_link = page2.locator("a.cate").filter(has_text=part).first
        if category_link.count() == 0:
            return False
        category_link.scroll_into_view_if_needed(timeout=10000)
        category_link.click(timeout=10000)
        page2.wait_for_timeout(800)
        return True

    切换到搜索发品标签(page2)
    if 通过分类ID选择目标分类(page2):
        return

    search_input = page2.locator('input[placeholder="请输入关键词搜索分类"]').first
    search_input.wait_for(state="visible", timeout=30000)
    search_input.click()
    search_input.fill(商品分类)
    page2.wait_for_timeout(1000)

    search_panel = page2.get_by_test_id("beast-core-search-panel")
    clicked = False
    if search_panel.count() > 0:
        exact_match = search_panel.get_by_text(商品分类, exact=True)
        if exact_match.count() > 0:
            exact_match.first.click(timeout=10000)
            clicked = True
        else:
            search_panel.get_by_text(商品三级类目).first.click(timeout=10000)
            clicked = True

    if clicked:
        page2.wait_for_timeout(1000)

    if not 当前分类正确(page2):
        clicked_path = False
        for part in 商品分类路径:
            clicked_path = 点击分类链接(part) or clicked_path
        clicked = clicked or clicked_path

    if not 当前分类正确(page2) and not 点击分类链接(商品三级类目):
        if not clicked:
            raise RuntimeError(f"未找到可点击的目标分类: {商品分类}")

    deadline = time.time() + 20
    while time.time() < deadline:
        if 当前分类正确(page2):
            return
        page2.wait_for_timeout(500)

    selected = 读取已选分类(page2)
    raise RuntimeError(f"未能选择正确分类，目标: {商品分类}，当前已选: {selected}")


def 选择分类进入商品编辑页(page2):
    已预上传首图 = False
    try:
        page2.wait_for_load_state("domcontentloaded", timeout=20000)
    except PlaywrightTimeoutError:
        pass

    if "/goods/goods_add/index" in (page2.url or ""):
        page2 = 等待商品编辑页(page2)
    elif 是预测分类流程页(page2):
        predicted_page2, 已预上传首图 = 通过预测分类流程进入商品编辑页(page2)
        if predicted_page2 is not None:
            page2 = predicted_page2

    if "/goods/goods_add/index" in (page2.url or ""):
        current = 等待编辑页分类信息(page2, timeout=20000)
        if 当前分类正确(page2):
            return page2, 已预上传首图
        change_link = 修改分类链接(page2)
        try:
            if change_link.count() > 0:
                print(f"编辑页商品分类不匹配，进入修改分类。当前: {current}；目标: {商品分类}")
                change_link.scroll_into_view_if_needed(timeout=10000)
                change_link.click(timeout=10000)
                page2.wait_for_timeout(1000)
                page2, changed_prefill = 选择分类进入商品编辑页(page2)
                return page2, 已预上传首图 or changed_prefill
        except Exception as exc:
            raise RuntimeError(f"编辑页修改分类失败：{str(exc)[:120]}") from exc
        raise RuntimeError(f"编辑页商品分类校验失败，目标: {商品分类}，当前: {current}")

    confirm_button = 分类确认按钮(page2)
    try:
        confirm_button.wait_for(state="visible", timeout=15000)
    except PlaywrightTimeoutError:
        通过搜索选择目标分类(page2)
        confirm_button = 分类确认按钮(page2)
        confirm_button.wait_for(state="visible", timeout=30000)

    if not 当前分类正确(page2):
        print(f"当前已选分类不匹配，重新选择。当前: {读取已选分类(page2)}；目标: {商品分类}")
        通过搜索选择目标分类(page2)
        confirm_button = 分类确认按钮(page2)
        confirm_button.wait_for(state="visible", timeout=30000)

    selected = 读取已选分类(page2)
    if not 当前分类正确(page2):
        raise RuntimeError(f"分类确认前校验失败，目标: {商品分类}，当前已选: {selected}")
    print(f"已选择商品分类：{selected}")

    modal = 分类选择弹窗(page2)
    if modal.count() > 0:
        modal_confirm = 分类弹窗确认按钮(page2)
        if modal_confirm.count() > 0:
            print("确认类目选择弹窗")
            modal_confirm.click(timeout=10000)
            page2.wait_for_timeout(1000)

    confirm_button.scroll_into_view_if_needed(timeout=10000)
    confirm_button.click(timeout=30000)
    page2 = 等待商品编辑页(page2, timeout=90000)
    current = 等待编辑页分类信息(page2, timeout=20000)
    print(f"进入编辑页后的分类：{current}")
    return page2, 已预上传首图


def test_example(page):
    
    
       #page.get_by_text("x").click()

    try:

        page2 = 打开商品发布页(page)
        page2, 已预上传首图 = 选择分类进入商品编辑页(page2)
        输出事件("progress", "商品编辑页已稳定，开始填充商品信息...", step="wait-form-ready")


        # page2.get_by_role("button", name="下一步, 完善商品信息").click()
        # page2.get_by_test_id("beast-core-input-htmlInput").click()
        # page2.get_by_role("button", name="查看更多推荐").click()
        
        # page2.get_by_role("button", name="手动选择商品分类").click()

        # page2.locator("ul[data-testid='beast-core-search-panel'] > li.SPP_searchItem_5-178-0")
        #page2.pause()
        # 商品发布页有时先进入 /goods/category。选择分类进入商品编辑页() 已兼容这个中间页。
        #page2.locator("a").filter(has_text=商品三级类目).click()
        #page2.locator("a").filter(has_text=商品三级类目).filter(has_not=page2.locator("text=/")).click()
        #page2.get_by_role("button", name="确认").click()
        file_input = page2.locator("[id=\"basic.carousel_gallery\"] input[type=\"file\"]")
        剩余主图列表 = 商品主图列表[1:] if 已预上传首图 else 商品主图列表
        if 剩余主图列表:
            file_input.set_input_files(剩余主图列表)
        title_input = 商品标题输入框(page2)
        if title_input.count() > 0:
            title_input.click(timeout=10000)
            title_input.fill(商品标题, timeout=10000)
        time.sleep(1)
        for item in 商品属性:
            if item.get('name') == '品牌':
                continue
            print(item)
            填写商品属性项(page2, item)

        file_input = page2.locator('input[data-tracking-click-viewid="detail_img_localfile_upload"]')
        file_input.set_input_files(商品详情图列表)
        填写商品规格(page2)

        填写价格库存(page2)
        输出事件("progress", "页面已填充完成，等待人工检查后发布", step="filled")
        
    except Exception as e:
        输出事件("error", str(e), step="fill-failed")
        raise
        
def parse_args():
    parser = argparse.ArgumentParser(description="从工作台快照启动拼多多商品自动填充")
    parser.add_argument("--input-json", required=True, help="工作台生成的自动填充快照 JSON")
    parser.add_argument("--dry-run", action="store_true", help="只校验并打印快照摘要，不连接浏览器")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        加载模板数据(args.input_json)
        if args.dry_run:
            输出事件("completed", "dry-run 校验通过", step="dry-run")
        else:
            run()
    except Exception as exc:
        输出事件("error", str(exc), step="fatal")
        raise SystemExit(1)



# def test_example(page: Page) -> None:
