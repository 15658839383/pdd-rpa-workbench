import re
import time
import json
import subprocess
import urllib.request
import urllib.error
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

用户数据目录 = r"F:/李泽鹏/获取数据/配置文件/聚水潭2"
CDP调试端口 = 9223
浏览器视口 = {'width': 1800, 'height': 900}
浏览器HTTP头 = {
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}

template_path = Path(r'默认模板 副本 副本-2026-05-10/template.json')
with open(template_path, 'r', encoding='utf-8') as f:
    template_data = json.load(f)
商品标题 = template_data.get('formData').get('goodsName')
商品分类 = template_data.get('formData').get('categoryData')#.split(' > ')
商品分类路径 = [part.strip() for part in 商品分类.split(' > ') if part.strip()]
商品三级类目 = 商品分类路径[2]
商品参考价 = template_data.get('formData').get('marketPrice')
商品两件折扣值 = template_data.get('formData').get('styleCode')
商品属性 = []
商品主图列表 = []
商品详情图列表 = []
商品SKU类型1 = template_data.get('formData').get('goodsSpecType1Name')
商品SKU类型2 = template_data.get('formData').get('goodsSpecType2Name')
商品SKU类型1的名称列表 = json.loads(template_data.get('formData').get('goodsSpecType1Values'))
商品SKU类型2的名称列表 = json.loads(template_data.get('formData').get('goodsSpecType2Values'))
商品SKU列表 = template_data.get('formData').get('skuList') or []
if isinstance(商品SKU列表, str):
    商品SKU列表 = json.loads(商品SKU列表)
for imgurl in template_data.get('imageRefs').get('mainGallery'):
    商品主图列表.append(imgurl.get('absolutePath'))
for imgurl in template_data.get('imageRefs').get('detailGallery'):
    商品详情图列表.append(imgurl.get('absolutePath'))
for item in template_data.get('formData').get('attributeList'):
    商品属性.append({
        "refPid": item.get('refPid'),
        "name": item.get('name'),
        "value": item.get('value')
    })


def 查找Chrome路径():
    for chrome_path in (
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        str(Path.home() / r"AppData\Local\Google\Chrome\Application\chrome.exe"),
    ):
        if Path(chrome_path).exists():
            return chrome_path
    return None


def 获取CDP地址():
    for endpoint in (f"http://127.0.0.1:{CDP调试端口}", f"http://localhost:{CDP调试端口}"):
        try:
            with urllib.request.urlopen(f"{endpoint}/json/version", timeout=1) as response:
                data = json.loads(response.read().decode("utf-8"))
            if data.get("webSocketDebuggerUrl"):
                return endpoint
        except (OSError, ValueError, urllib.error.URLError):
            pass

    devtools_active_port = Path(用户数据目录) / "DevToolsActivePort"
    if devtools_active_port.exists():
        try:
            lines = [
                line.strip()
                for line in devtools_active_port.read_text(encoding="utf-8", errors="ignore").splitlines()
                if line.strip()
            ]
            if len(lines) >= 2:
                return f"ws://127.0.0.1:{lines[0]}{lines[1]}"
        except OSError:
            pass
    return None


def 启动调试Chrome():
    chrome_path = 查找Chrome路径()
    if not chrome_path:
        raise RuntimeError("找不到本机 Chrome，请确认已安装 Google Chrome。")

    args = [
        chrome_path,
        f"--remote-debugging-port={CDP调试端口}",
        f"--user-data-dir={用户数据目录}",
        "--profile-directory=Default",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--disable-site-isolation-trials",
        "--disable-web-security",
        "--disable-features=BlockInsecurePrivateNetworkRequests",
        "--lang=zh-CN",
        "--start-maximized",
        "about:blank",
    ]
    subprocess.Popen(
        args,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
    )

    deadline = time.time() + 30
    while time.time() < deadline:
        endpoint = 获取CDP地址()
        if endpoint:
            return endpoint
        time.sleep(0.5)

    raise RuntimeError(
        f"Chrome 调试端口没有启动成功。请关闭正在使用该目录的 Chrome 后重试：{用户数据目录}"
    )


def 获取浏览器上下文(p):
    endpoint = 获取CDP地址()
    if not endpoint:
        endpoint = 启动调试Chrome()
    print(f"连接 Chrome CDP：{endpoint}")

    browser = p.chromium.connect_over_cdp(endpoint, slow_mo=500, timeout=30000)
    if browser.contexts:
        context = browser.contexts[0]
    else:
        context = browser.new_context(
            viewport=浏览器视口,
            locale="zh-CN",
            timezone_id="Asia/Shanghai",
            ignore_https_errors=True,
            accept_downloads=True,
            bypass_csp=True,
        )
    context.set_default_timeout(30000)
    context.set_extra_http_headers(浏览器HTTP头)
    try:
        context.grant_permissions(["geolocation", "notifications"])
    except Exception:
        pass
    return browser, context


def run():
    with sync_playwright() as p:
        _browser, browser = 获取浏览器上下文(p)
        
        try:
            page = browser.new_page()
            page.set_viewport_size(浏览器视口)
            
            # 注入反检测脚本
            browser.add_init_script("""
                // 移除 webdriver 属性
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                
                // 伪造 chrome 对象
                window.chrome = {
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                };
                
                // 伪造 plugins
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                
                // 伪造 languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['zh-CN', 'zh', 'en']
                });
                
                // 伪造 platform
                Object.defineProperty(navigator, 'platform', {
                    get: () => 'Win32'
                });
                
                // 移除 PhantomJS 特征
                delete window.callPhantom;
                
                // 伪造 permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
            """)
            
            page.goto("https://mms.pinduoduo.com/", timeout=60000)
            
            # 等待页面完全加载
            #page.wait_for_load_state('networkidle')
            #page.pause()
            
            test_example(page)
            
        except Exception as e:
            print(f"发生错误: {e}")
            
            # 打印页面内容用于调试
            try:
                content = page.content()
                print("页面内容:", content[:500])
            except:
                pass

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

    def same_value(left, right):
        return str(left).strip() == str(right).strip() or same_number(left, right)

    def fill_input(locator, value):
        value = "" if value is None else str(value)
        last_actual = ""
        for attempt in range(3):
            locator.wait_for(state="visible", timeout=8000)
            locator.click(timeout=8000)
            locator.fill(value, timeout=8000)
            locator.evaluate("""
                (input) => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.blur();
                }
            """)
            page2.wait_for_timeout(120)
            last_actual = locator.input_value(timeout=5000)
            if same_value(last_actual, value):
                return last_actual

            locator.click(timeout=8000)
            page2.keyboard.press("Control+A")
            page2.keyboard.press("Backspace")
            if value:
                page2.keyboard.type(value, delay=12)
            locator.evaluate("""
                (input) => {
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.blur();
                }
            """)
            page2.wait_for_timeout(150 + attempt * 150)
            last_actual = locator.input_value(timeout=5000)
            if same_value(last_actual, value):
                return last_actual

        return last_actual

    def preview_uploaded(row):
        return row.locator('td.sku-preview-cell, .sku-preview-cell').first.evaluate("""
            (cell) => {
                const imageNode = cell.querySelector('.MaterialModalButton_imgContainer, [style*="background-image"]');
                if (!imageNode) return false;
                const bg = getComputedStyle(imageNode).backgroundImage || imageNode.style.backgroundImage || "";
                return bg.includes("url(") && !bg.includes("none");
            }
        """)

    def upload_sku_thumb(row, sku):
        thumb_path = sku["skuThumbAbsolutePath"]
        if preview_uploaded(row):
            return {"ok": True, "skipped": True}

        file_inputs = row.locator('td.sku-preview-cell input[type="file"], .sku-preview-cell input[type="file"]')
        if file_inputs.count() == 0:
            return {"ok": False, "error": "没有找到预览图 file input", "path": thumb_path}

        last_error = ""
        for attempt in range(2):
            try:
                file_inputs.first.set_input_files(thumb_path, timeout=30000)
                deadline = time.time() + 25
                while time.time() < deadline:
                    page2.wait_for_timeout(500)
                    if preview_uploaded(row):
                        return {"ok": True, "skipped": False}
                last_error = "上传后没有检测到预览图背景"
            except Exception as exc:
                last_error = str(exc)
                page2.wait_for_timeout(800 + attempt * 500)

        return {"ok": False, "error": last_error[:200], "path": thumb_path}

    def scroll_info():
        return page2.locator(body_selector).evaluate("""
            (body) => {
                const scroller = Array.from(body.querySelectorAll('div')).find((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
                });
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
                const scroller = Array.from(body.querySelectorAll('div')).find((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
                });
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

    def row_spec_parts(row, first_spec):
        texts = [text.strip() for text in row.locator(".sku-row-title").all_inner_texts() if text.strip()]
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

    def visible_row_indexes():
        return page2.locator(body_selector).evaluate("""
            (body) => {
                const table = body.closest('[data-e2e-id="e2e-sku-table"]');
                const scroller = Array.from(body.querySelectorAll('div')).find((node) => {
                    const style = getComputedStyle(node);
                    return /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
                });
                const viewport = (scroller || body).getBoundingClientRect();
                return Array.from(table.querySelectorAll('[data-testid="beast-core-table-middle-tbody"] tr[data-testid="beast-core-table-body-tr"]'))
                    .map((row, index) => {
                        const rect = row.getBoundingClientRect();
                        return {
                            index,
                            top: rect.top,
                            bottom: rect.bottom,
                            height: rect.height,
                            visibleHeight: Math.min(rect.bottom, viewport.bottom) - Math.max(rect.top, viewport.top)
                        };
                    })
                    .filter((row) => row.height > 0 && row.visibleHeight >= Math.min(row.height * 0.6, row.height - 2))
                    .map((row) => row.index);
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
        row_count = rows.count()
        rendered_row_count = max(rendered_row_count, row_count)
        first_spec_in_chunk = ""
        used_before = len(used_keys)

        visible_indexes = set(visible_row_indexes())
        if not visible_indexes and row_count:
            visible_indexes = set(range(row_count))

        row_entries = []
        for row_index in range(row_count):
            row = rows.nth(row_index)
            spec_parts, first_spec_in_chunk = row_spec_parts(row, first_spec_in_chunk)
            row_entries.append((row_index, spec_parts))

        for row_index, spec_parts in row_entries:
            if row_index not in visible_indexes:
                continue
            row = rows.nth(row_index)
            if not spec_parts:
                continue
            key = 规格组合Key(spec_parts)
            if key in used_keys:
                continue

            sku = sku_by_key.get(key)
            if not sku:
                row_text = row.inner_text(timeout=5000)
                missing_rows.append({
                    "index": row_index,
                    "specParts": spec_parts,
                    "specKey": key,
                    "rowText": re.sub(r"\\s+", " ", row_text)[:120]
                })
                continue

            stock_input = row.locator('td.quantity input[data-testid="beast-core-input-htmlInput"]').first
            price_inputs = row.locator('input[data-testid="beast-core-inputNumber-htmlInput"]')
            code_inputs = row.locator('td.sku-input:not(.quantity) input[data-testid="beast-core-input-htmlInput"]')

            actual_stock = fill_input(stock_input, sku["stock"])
            actual_group = fill_input(price_inputs.nth(0), sku["groupPrice"])
            actual_single = fill_input(price_inputs.nth(1), sku["singlePrice"])
            actual_code = ""
            if code_inputs.count() > 0 and sku["outSkuSn"]:
                actual_code = fill_input(code_inputs.last, sku["outSkuSn"])
            thumb_result = upload_sku_thumb(row, sku)

            actual = [actual_stock, actual_group, actual_single, actual_code]
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
                str(actual_stock).strip() == str(sku["stock"]).strip() and
                same_number(actual_group, sku["groupPrice"]) and
                same_number(actual_single, sku["singlePrice"]) and
                (not sku["outSkuSn"] or str(actual_code).strip() == str(sku["outSkuSn"]).strip())
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
            if candidate.is_closed():
                return False
            url = candidate.url or ""
            if "/goods/goods_add/index" in url or "/goods/category" in url:
                return True
            if candidate.get_by_test_id("beast-core-search-panel").count() > 0:
                return True
            if candidate.get_by_role("button", name="确认发布该类商品").count() > 0:
                return True
            inputs = candidate.get_by_test_id("beast-core-input-htmlInput")
            return inputs.count() > 0 and ("goods" in url or "category" in url)
        except Exception:
            return False

    while time.time() < deadline:
        candidates = []
        for candidate in context.pages:
            if candidate not in before_pages:
                candidates.append(candidate)
        candidates.extend([candidate for candidate in context.pages if candidate not in candidates])

        for candidate in candidates:
            if page_ready(candidate):
                candidate.bring_to_front()
                try:
                    candidate.wait_for_load_state("domcontentloaded", timeout=10000)
                except PlaywrightTimeoutError:
                    pass
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
        if "/goods/goods_add/index" in page2.url or "/goods/category" in page2.url:
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
                    return page2
                if page2.get_by_role("textbox", name="商品标题组成").count() > 0:
                    return page2
            page2.wait_for_timeout(500)
        except Exception:
            page2.wait_for_timeout(500)
    raise RuntimeError(f"确认分类后没有进入商品编辑页，当前 URL: {page2.url}")


def 归一化分类文本(value):
    return re.sub(r"\s+", "", str(value or "").replace("＞", ">").replace("》", ">"))


def 读取已选分类(page2):
    try:
        return page2.evaluate("""
            () => {
                const normalize = (text) => (text || "").replace(/\\s+/g, " ").trim();
                const bodyText = document.body.innerText || "";
                const marker = "已选分类";
                const markerIndex = bodyText.indexOf(marker);
                if (markerIndex < 0) return "";
                const after = bodyText.slice(markerIndex + marker.length);
                const lines = after.split(/\\n+/).map(normalize).filter(Boolean);
                for (const line of lines) {
                    if (line.includes(">")) return line;
                    if (line.includes("确认发布该类商品")) break;
                }
                return "";
            }
        """)
    except Exception:
        return ""


def 当前分类正确(page2):
    selected = 读取已选分类(page2)
    if not selected:
        return False
    return 归一化分类文本(selected) == 归一化分类文本(商品分类)


def 通过搜索选择目标分类(page2):
    def 点击分类链接(part):
        exact_pattern = re.compile(rf"(^|\s){re.escape(part)}$")
        category_link = page2.locator("a.cate").filter(has_text=exact_pattern).first
        if category_link.count() == 0:
            category_link = page2.locator("a.cate").filter(has_text=part).first
        if category_link.count() == 0:
            return False
        category_link.click(timeout=10000)
        page2.wait_for_timeout(800)
        return True

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
    try:
        page2.wait_for_load_state("domcontentloaded", timeout=20000)
    except PlaywrightTimeoutError:
        pass

    if "/goods/goods_add/index" in (page2.url or ""):
        return 等待商品编辑页(page2)

    confirm_button = page2.get_by_role("button", name="确认发布该类商品").first
    try:
        confirm_button.wait_for(state="visible", timeout=15000)
    except PlaywrightTimeoutError:
        通过搜索选择目标分类(page2)
        confirm_button.wait_for(state="visible", timeout=30000)

    if not 当前分类正确(page2):
        print(f"当前已选分类不匹配，重新选择。当前: {读取已选分类(page2)}；目标: {商品分类}")
        通过搜索选择目标分类(page2)
        confirm_button.wait_for(state="visible", timeout=30000)

    selected = 读取已选分类(page2)
    if not 当前分类正确(page2):
        raise RuntimeError(f"分类确认前校验失败，目标: {商品分类}，当前已选: {selected}")
    print(f"已选择商品分类：{selected}")
    confirm_button.click(timeout=30000)
    return 等待商品编辑页(page2, timeout=90000)


def test_example(page):
    
    
       #page.get_by_text("x").click()

    try:

        page2 = 打开商品发布页(page)
        page2 = 选择分类进入商品编辑页(page2)


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
        time.sleep(5)
        file_input = page2.locator("[id=\"basic.carousel_gallery\"] input[type=\"file\"]")
        file_input.set_input_files(商品主图列表)
        page2.get_by_role("textbox", name="商品标题组成：商品描述+规格，最多输入30个汉字（60").click()
        page2.get_by_role("textbox", name="商品标题组成：商品描述+规格，最多输入30个汉字（60").fill(商品标题)
        time.sleep(1)
        for item in 商品属性:
            if item.get('name') == '品牌':
                continue
            print(item)
            try:
                page2.locator(f"#property-list-{item.get('refPid')}").get_by_test_id("beast-core-select-htmlInput").click(timeout=1000)
                page2.locator(f"#property-list-{item.get('refPid')}").get_by_test_id("beast-core-select-htmlInput").fill(item.get('value'))
                page2.get_by_role("option", name=item.get('value'), exact=True).click()
            except:
                page2.locator(f"#property-list-{item.get('refPid')}").get_by_test_id("beast-core-input-htmlInput").fill(item.get('value'))

        file_input = page2.locator('input[data-tracking-click-viewid="detail_img_localfile_upload"]')
        file_input.set_input_files(商品详情图列表)
        填写商品规格(page2)

        填写价格库存(page2)
        page2.pause()
        
    except Exception as e:
        print(e)
        if 'page2' in locals():
            page2.pause()
        else:
            page.pause()
        
if __name__ == "__main__":
    run()
    pass



# def test_example(page: Page) -> None:
