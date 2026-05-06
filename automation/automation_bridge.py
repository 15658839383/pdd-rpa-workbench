"""Legacy DrissionPage automation bridge kept for reference only."""

import argparse
import json
import os
import signal
import sys
import time
from pathlib import Path

try:
    from DrissionPage import ChromiumOptions, ChromiumPage
except Exception as import_error:  # pragma: no cover - runtime dependency guard
    ChromiumOptions = None
    ChromiumPage = None
    DRISSION_IMPORT_ERROR = import_error
else:
    DRISSION_IMPORT_ERROR = None


STEALTH_INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN', 'zh', 'en']});
Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
Object.defineProperty(navigator, 'platform', {get: () => 'Win32'});
window.chrome = {runtime: {}, loadTimes: function() {}, csi: function() {}, app: {}};
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
"""


browser_page = None

FIRST_STAGE = "basic-info"
FULL_FORM_STAGE = "full-form"
FIRST_STAGE_NEXT_BUTTON_SELECTORS = (
    "#bottomSubmitBtnId",
    "xpath://button[@id='bottomSubmitBtnId']",
    "xpath://button[.//span[contains(normalize-space(.), '下一步') and contains(normalize-space(.), '完善商品信息')]]",
)
FIRST_STAGE_TITLE_INPUT_SELECTORS = (
    "xpath://div[@id='goods_name']//input[@type='text']",
    "xpath://div[@id='goodsNameId']//input[@type='text']",
    "xpath://input[contains(@placeholder, '商品标题')]",
)
FIRST_STAGE_MAIN_GALLERY_SELECTORS = (
    "css:#goodsCarouselId input[type=file]",
    "xpath://div[@id='goodsCarouselId']//input[@type='file']",
)
FULL_FORM_SELECTOR = "#pddForm_goodsName"


def configure_stdio_utf8():
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None or not hasattr(stream, "reconfigure"):
            continue

        try:
            stream.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
        except Exception:
            continue


configure_stdio_utf8()


def emit(event_type, **payload):
    print(json.dumps({"type": event_type, **payload}, ensure_ascii=False), flush=True)


def load_template(template_path):
    return json.loads(Path(template_path).read_text(encoding="utf-8"))


def safe_quit_browser():
    global browser_page

    page = browser_page
    browser_page = None

    if not page:
        return

    try:
        page.quit(timeout=5, force=True, del_data=False)
    except Exception as exc:
        emit("log", level="warning", message=f"关闭 Chrome 时出现异常：{exc}")


def shutdown(*_args):
    emit("status", state="stopped", message="自动化侧车收到停止信号，正在退出")
    safe_quit_browser()
    raise SystemExit(0)


def fail(message, exit_code=1):
    emit("status", state="failed", message=message)
    safe_quit_browser()
    raise SystemExit(exit_code)


def resolve_chrome_path():
    candidates = []
    for env_name in ("LOCALAPPDATA", "ProgramFiles", "ProgramFiles(x86)"):
        env_value = os.environ.get(env_name)
        if env_value:
            candidates.append(Path(env_value) / "Google" / "Chrome" / "Application" / "chrome.exe")

    for candidate in candidates:
        if candidate.exists():
            return candidate, candidates

    return None, candidates


def install_stealth(page):
    page.add_init_js(STEALTH_INIT_SCRIPT)


def configure_browser(profile_dir):
    chrome_path, checked_paths = resolve_chrome_path()
    if chrome_path is None:
        checked = "；".join(str(path) for path in checked_paths) or "未生成候选路径"
        raise FileNotFoundError(f"未找到可用的系统 Chrome，请先安装 Google Chrome。已检查：{checked}")

    options = ChromiumOptions(read_file=False)
    options.set_browser_path(chrome_path)
    options.set_user_data_path(Path(profile_dir))
    options.set_timeouts(base=5, page_load=60, script=30)
    options.set_argument("--disable-blink-features", "AutomationControlled")
    options.set_argument("--disable-gpu")
    options.set_argument("--disable-dev-shm-usage")
    options.set_argument("--disable-features", "IsolateOrigins,site-per-process")
    options.set_argument("--lang", "zh-CN")

    page = ChromiumPage(options)
    install_stealth(page)
    page.run_cdp("Emulation.setTimezoneOverride", timezoneId="Asia/Shanghai")
    page.run_cdp("Emulation.setLocaleOverride", locale="zh-CN")
    return page, chrome_path


def wait_for_form(page, timeout_seconds=300):
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        current_stage = detect_publish_stage(page)
        if current_stage:
            return current_stage

        emit("status", state="waiting-login", message="等待人工登录并进入商品发布页面")
        time.sleep(2)

    return None


def detect_publish_stage(page):
    if has_any_loaded_selector(page, (FULL_FORM_SELECTOR,), timeout=1):
        return FULL_FORM_STAGE

    if find_first_element(page, FIRST_STAGE_NEXT_BUTTON_SELECTORS, timeout=1)[0]:
        return FIRST_STAGE

    return None


def has_any_loaded_selector(page, selectors, timeout=1):
    for selector in selectors:
        try:
            if page.wait.eles_loaded(selector, timeout=timeout):
                return True
        except Exception:
            continue

    return False


def find_first_element(page, selectors, timeout=1):
    for selector in selectors:
        try:
            element = page.ele(selector, timeout=timeout)
        except Exception:
            continue

        if element:
            return element, selector

    return None, None


def click_element(element):
    try:
        element.click()
        return True
    except Exception:
        try:
            element.click(by_js=True)
            return True
        except Exception:
            return False


def fill_text_with_selectors(page, selectors, value, label):
    if value in (None, ""):
        emit("log", level="info", message=f"{label} 为空，跳过")
        return False

    try:
        element, _selector = find_first_element(page, selectors, timeout=5)
        if not element:
            emit("log", level="warning", message=f"{label} 输入框未找到，跳过")
            return False

        element.input(str(value), clear=True)
        emit("log", level="info", message=f"{label} 已填充")
        return True
    except Exception as exc:
        emit("log", level="warning", message=f"{label} 填充失败：{exc}")
        return False


def upload_many_if_possible(page, selectors, asset_refs, label, workspace_root):
    refs = list(asset_refs or [])
    if not refs:
        emit("log", level="info", message=f"{label} 未配置，跳过")
        return False

    file_paths = []
    for ref in refs:
        file_path = resolve_asset_path(ref, workspace_root)
        if not file_path:
            continue
        if not file_path.exists():
            emit("log", level="warning", message=f"{label} 文件不存在：{file_path}")
            continue
        file_paths.append(file_path)

    if not file_paths:
        emit("log", level="warning", message=f"{label} 缺少可用文件，跳过")
        return False

    try:
        input_element, _selector = find_first_element(page, selectors, timeout=5)
        if not input_element:
            emit("log", level="warning", message=f"{label} 上传入口未找到，跳过")
            return False

        upload_value = str(file_paths[0]) if len(file_paths) == 1 else "\n".join(str(path) for path in file_paths)
        input_element.input(upload_value)
        emit("log", level="info", message=f"{label} 已尝试上传 {len(file_paths)} 个文件")
        return True
    except Exception as exc:
        emit("log", level="warning", message=f"{label} 上传失败：{exc}")
        return False


def split_category_path(value):
    return [part.strip() for part in str(value or "").split(">") if part.strip()]


def build_exact_text_selectors(value):
    literal = xpath_literal(value)
    return (
        f"xpath://button[normalize-space(.)={literal}]",
        f"xpath://button[.//span[normalize-space(.)={literal}]]",
        f"xpath://a[normalize-space(.)={literal}]",
        f"xpath://label[normalize-space(.)={literal}]",
        f"xpath://li[normalize-space(.)={literal}]",
        f"xpath://*[@role='button' and normalize-space(.)={literal}]",
        f"xpath://span[normalize-space(.)={literal}]/ancestor::*[self::button or self::a or self::label or self::li or self::div or @role='button'][1]",
    )


def click_text_option(page, value, timeout_seconds=12):
    if not value:
        return False

    deadline = time.time() + timeout_seconds
    selectors = build_exact_text_selectors(value)
    while time.time() < deadline:
        element, _selector = find_first_element(page, selectors, timeout=1)
        if element and click_element(element):
            return True
        time.sleep(1)

    return False


def select_first_stage_category(page, category_path):
    labels = split_category_path(category_path)
    if not labels:
        emit("log", level="info", message="模板未配置类目路径，跳过一阶段类目选择")
        return False

    emit("log", level="info", message=f"准备按模板类目路径选择：{' > '.join(labels)}")
    selected_count = 0
    for label in labels:
        if not click_text_option(page, label, timeout_seconds=15):
            emit("log", level="warning", message=f"未能自动定位类目选项：{label}")
            break

        selected_count += 1
        emit("log", level="info", message=f"已尝试选择类目：{label}")
        time.sleep(1.5)

    return selected_count == len(labels)


def click_first_stage_next(page):
    element, _selector = find_first_element(page, FIRST_STAGE_NEXT_BUTTON_SELECTORS, timeout=3)
    if not element:
        emit("log", level="warning", message="未找到一阶段“下一步, 完善商品信息”按钮")
        return False

    if click_element(element):
        emit("log", level="info", message="已尝试点击“下一步, 完善商品信息”")
        return True

    emit("log", level="warning", message="点击一阶段下一步按钮失败")
    return False


def wait_for_stage(page, expected_stage, timeout_seconds=180):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if detect_publish_stage(page) == expected_stage:
            return True
        time.sleep(2)
    return False


def fill_first_stage(page, template, workspace_root):
    form_data = template.get("formData", {})
    image_refs = template.get("imageRefs", {})

    title_filled = fill_text_with_selectors(
        page,
        FIRST_STAGE_TITLE_INPUT_SELECTORS,
        form_data.get("pddForm_goodsName") or form_data.get("goodsName"),
        "一阶段商品标题",
    )
    if title_filled:
        time.sleep(2)

    main_gallery_uploaded = upload_many_if_possible(
        page,
        FIRST_STAGE_MAIN_GALLERY_SELECTORS,
        image_refs.get("mainGallery", []),
        "一阶段商品主图",
        workspace_root,
    )

    category_selected = select_first_stage_category(
        page,
        form_data.get("pddForm_categoryData") or form_data.get("categoryData"),
    )

    next_clicked = click_first_stage_next(page)
    advanced = False
    if next_clicked:
        emit("status", state="filling", message="第一阶段已处理，等待商品信息页加载")
        advanced = wait_for_stage(page, FULL_FORM_STAGE, timeout_seconds=120)

    return {
        "advanced": advanced,
        "title_filled": title_filled,
        "main_gallery_uploaded": main_gallery_uploaded,
        "category_selected": category_selected,
    }


def fill_text(page, selector, value, label):
    if value in (None, ""):
        emit("log", level="info", message=f"{label} 为空，跳过")
        return

    try:
        element = page.ele(selector, timeout=5)
        element.input(str(value), clear=True)
        emit("log", level="info", message=f"{label} 已填充")
    except Exception as exc:
        emit("log", level="warning", message=f"{label} 填充失败：{exc}")


def xpath_literal(value):
    if "'" not in value:
        return f"'{value}'"
    if '"' not in value:
        return f'"{value}"'

    parts = value.split("'")
    return "concat(" + ", \"'\", ".join(f"'{part}'" for part in parts) + ")"


def click_radio(page, group_selector, value, label):
    if value in (None, ""):
        return

    group_id = group_selector[1:] if group_selector.startswith("#") else group_selector
    value_text = str(value)
    selector = (
        f"xpath://*[@id={xpath_literal(group_id)}]"
        f"//input[@value={xpath_literal(value_text)}]"
    )

    try:
        element = page.ele(selector, timeout=3)
        element.check()
        emit("log", level="info", message=f"{label} 已设置为 {value_text}")
    except Exception as exc:
        emit("log", level="warning", message=f"{label} 设置失败：{exc}")


def resolve_asset_path(asset_ref, workspace_root):
    absolute_path = asset_ref.get("absolutePath")
    if absolute_path:
        return Path(absolute_path)

    relative_path = asset_ref.get("relativePath")
    if relative_path:
        return Path(workspace_root) / relative_path

    return None


def upload_if_possible(page, selector, asset_ref, label, workspace_root):
    if not asset_ref:
        emit("log", level="info", message=f"{label} 未配置，跳过")
        return

    file_path = resolve_asset_path(asset_ref, workspace_root)
    if not file_path:
        emit("log", level="warning", message=f"{label} 缺少文件路径，跳过")
        return

    if not file_path.exists():
        emit("log", level="warning", message=f"{label} 文件不存在：{file_path}")
        return

    try:
        input_element = page.ele(f"css:{selector} input[type=file]", timeout=3)
        input_element.input(str(file_path))
        emit("log", level="info", message=f"{label} 已尝试上传 {file_path.name}")
    except Exception as exc:
        emit("log", level="warning", message=f"{label} 上传入口未找到或上传失败：{exc}")


def fill_from_template(page, template, workspace_root, skip_title=False, skip_main_gallery=False):
    form_data = template.get("formData", {})
    image_refs = template.get("imageRefs", {})

    if not skip_title:
        fill_text(page, "#pddForm_goodsName", form_data.get("pddForm_goodsName") or form_data.get("goodsName"), "商品标题")
    fill_text(page, "#pddForm_styleCode", form_data.get("pddForm_styleCode") or form_data.get("styleCode"), "满2件折扣")
    fill_text(page, "#pddForm_marketPrice", form_data.get("pddForm_marketPrice") or form_data.get("marketPrice"), "商品市场价")

    click_radio(page, "#pddForm_goodsType", form_data.get("goodsType"), "商品类型")
    click_radio(page, "#pddForm_secondHand", form_data.get("secondHand"), "是否二手")
    click_radio(page, "#pddForm_preSaleConfig", form_data.get("preSaleConfig"), "是否预售")
    click_radio(page, "#pddForm_shipmentLimitSecond", form_data.get("shipmentLimitSecond"), "承诺发货时间")
    click_radio(page, "#pddForm_publishType", form_data.get("publishType"), "上架设置")
    click_radio(page, "#pddForm_ignoreEditWarn", form_data.get("ignoreEditWarn"), "特殊情况处理")
    click_radio(page, "#pddForm_autoFillSpuProperty", form_data.get("autoFillSpuProperty"), "是否预填标品属性")

    upload_if_possible(page, "#pddForm_whiteImage", image_refs.get("whiteImage"), "商品白底图", workspace_root)
    upload_if_possible(page, "#pddForm_longImage", image_refs.get("longImage"), "商品长图", workspace_root)

    if not skip_main_gallery:
        for index, ref in enumerate(image_refs.get("mainGallery", [])):
            upload_if_possible(page, "#pddForm_mainSpareImage", ref, f"商品主图 {index + 1}", workspace_root)

    for index, ref in enumerate(image_refs.get("detailGallery", [])):
        upload_if_possible(page, "#pddForm_detailGallery", ref, f"商品详情图 {index + 1}", workspace_root)


def main():
    global browser_page

    parser = argparse.ArgumentParser(description="Electron 自动化侧车")
    parser.add_argument("--template-path", required=True)
    parser.add_argument("--workspace-root", required=True)
    parser.add_argument("--profile-dir", required=True)
    parser.add_argument("--mode", default="assist-fill")
    parser.add_argument("--target-url", default="https://mms.pinduoduo.com")
    args = parser.parse_args()

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    template = load_template(args.template_path)
    template_name = template.get("meta", {}).get("name") or Path(args.template_path).stem
    emit("status", state="starting", message=f"已加载模板：{template_name}")

    if DRISSION_IMPORT_ERROR is not None:
        fail(f"未安装 DrissionPage 运行依赖：{DRISSION_IMPORT_ERROR}")

    try:
        browser_page, chrome_path = configure_browser(args.profile_dir)
    except Exception as exc:
        fail(f"启动 Chrome 失败：{exc}")

    emit("log", level="info", message=f"已使用系统 Chrome：{chrome_path}")
    emit("status", state="launching-browser", message="浏览器已启动，准备打开拼多多后台")

    opened = browser_page.get(args.target_url, timeout=60)
    if opened is False:
        fail("打开拼多多后台失败，请检查网络或稍后重试")

    current_stage = wait_for_form(browser_page)
    if not current_stage:
        fail("等待进入商品发布页面超时，请重新启动任务")

    title_already_filled = False
    main_gallery_already_uploaded = False
    if current_stage == FIRST_STAGE:
        emit("status", state="filling", message="检测到商品发布一阶段，开始填充主图、标题和类目")
        first_stage_result = fill_first_stage(browser_page, template, args.workspace_root)
        title_already_filled = first_stage_result["title_filled"]
        main_gallery_already_uploaded = first_stage_result["main_gallery_uploaded"]

        if not first_stage_result["advanced"]:
            emit(
                "status",
                state="manual-review",
                message="一阶段已填充标题和主图，请确认类目后点击“下一步, 完善商品信息”进入商品信息页",
            )
            if not wait_for_stage(browser_page, FULL_FORM_STAGE, timeout_seconds=300):
                fail("等待进入商品信息页超时，请重新启动任务")

    emit("status", state="filling", message="检测到商品信息页，开始辅助填充")
    fill_from_template(
        browser_page,
        template,
        args.workspace_root,
        skip_title=title_already_filled,
        skip_main_gallery=main_gallery_already_uploaded,
    )
    emit("status", state="manual-review", message="辅助填充已完成，请人工检查并决定是否发布")

    while True:
        time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        fail(f"自动化异常：{exc}")
